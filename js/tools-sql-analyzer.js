/**
 * PRACTICAL SQL Injection Vulnerability Detector
 * Analyzes responses for SQL errors and vulnerability indicators
 */

export async function analyzeSQLInjectionRisks(domain, testPaths = []) {
  const results = {
    domain: domain,
    timestamp: new Date().toISOString(),
    vulnerabilities: [],
    testedEndpoints: [],
    riskAreas: [],
    summary: {}
  };

  console.log(`🔍 Analyzing SQL injection risks on ${domain}...`);

  // Default paths to test if none provided
  const pathsToTest = testPaths.length > 0 ? testPaths : [
    '/',
    '/search',
    '/login',
    '/api/users',
    '/api/search',
    '/api/products',
    '/index.php'
  ];

  try {
    // First, check HTML for SQL-related issues
    const pageRes = await fetch(`https://${domain}`, { timeout: 10000 }).catch(() =>
      fetch(`http://${domain}`, { timeout: 10000 })
    );
    const html = await pageRes.text();

    // Check for SQL error messages in page
    const sqlErrors = detectSQLErrors(html);
    results.vulnerabilities.push(...sqlErrors);

    // Check for database info disclosure
    const dbDisclosure = detectDatabaseInfoDisclosure(html);
    results.vulnerabilities.push(...dbDisclosure);

    // Check for SQL-related headers
    const headerRisks = analyzeSQLRelatedHeaders(pageRes);
    results.vulnerabilities.push(...headerRisks);

    // Test various endpoints for SQL error patterns
    for (const path of pathsToTest) {
      const testResults = await testPathForSQLInjection(domain, path);
      results.testedEndpoints.push(testResults);
      
      if (testResults.vulnerabilities.length > 0) {
        results.vulnerabilities.push(...testResults.vulnerabilities);
      }
    }

  } catch (error) {
    results.error = error.message;
  }

  results.summary = {
    totalVulnerabilities: results.vulnerabilities.length,
    critical: results.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    high: results.vulnerabilities.filter(v => v.severity === 'HIGH').length,
    vulnerableEndpoints: results.testedEndpoints.filter(e => e.vulnerabilities.length > 0).length,
    riskLevel: results.vulnerabilities.length > 3 ? 'HIGH' : 'MEDIUM'
  };

  return results;
}

function detectSQLErrors(html) {
  const vulnerabilities = [];

  // SQL error patterns (MySQL)
  const mysqlErrors = [
    /You have an error in your SQL syntax/gi,
    /Warning: mysql_/gi,
    /SQL query/gi,
    /mysql_error\(\)/gi
  ];

  // SQL error patterns (PostgreSQL)
  const postgresErrors = [
    /ERROR: column/gi,
    /invalid input syntax for/gi,
    /PostgreSQL/gi
  ];

  // SQL error patterns (Oracle)
  const oracleErrors = [
    /ORA-\d+/gi,
    /Oracle error/gi
  ];

  // SQL error patterns (MSSQL)
  const mssqlErrors = [
    /Incorrect syntax near/gi,
    /SQL Server error/gi,
    /MSSQL/gi
  ];

  let foundErrors = [];

  if (mysqlErrors.some(pattern => pattern.test(html))) {
    foundErrors.push({
      type: 'MYSQL_ERROR_DISCLOSURE',
      severity: 'HIGH',
      description: 'MySQL error messages visible in response',
      impact: 'Attacker can use error messages to craft injection attacks',
      recommendation: 'Hide database errors, use generic error messages'
    });
  }

  if (postgresErrors.some(pattern => pattern.test(html))) {
    foundErrors.push({
      type: 'POSTGRESQL_ERROR_DISCLOSURE',
      severity: 'HIGH',
      description: 'PostgreSQL error messages visible in response',
      impact: 'Database schema might be revealed',
      recommendation: 'Configure error logging properly'
    });
  }

  if (oracleErrors.some(pattern => pattern.test(html))) {
    foundErrors.push({
      type: 'ORACLE_ERROR_DISCLOSURE',
      severity: 'HIGH',
      description: 'Oracle error messages visible in response',
      impact: 'Database information disclosed',
      recommendation: 'Hide database errors'
    });
  }

  if (mssqlErrors.some(pattern => pattern.test(html))) {
    foundErrors.push({
      type: 'MSSQL_ERROR_DISCLOSURE',
      severity: 'HIGH',
      description: 'MSSQL error messages visible in response',
      impact: 'Database structure might be revealed',
      recommendation: 'Use custom error pages'
    });
  }

  return foundErrors;
}

function detectDatabaseInfoDisclosure(html) {
  const vulnerabilities = [];

  // Look for database-related indicators
  if (html.includes('db_host') || html.includes('database_host')) {
    vulnerabilities.push({
      type: 'DATABASE_CONFIG_EXPOSURE',
      severity: 'CRITICAL',
      description: 'Database configuration exposed in HTML',
      impact: 'Direct database connection possible',
      recommendation: 'Remove sensitive config from client-side'
    });
  }

  // Check for table/column names
  if (/(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\s+(.*\s+)?FROM\s+\w+/gi.test(html)) {
    vulnerabilities.push({
      type: 'SQL_QUERY_EXPOSURE',
      severity: 'MEDIUM',
      description: 'SQL query structure visible in response',
      impact: 'Helps attacker understand database schema',
      recommendation: 'Do not expose SQL queries client-side'
    });
  }

  return vulnerabilities;
}

function analyzeSQLRelatedHeaders(response) {
  const vulnerabilities = [];

  const dbHeaders = [
    'x-aspnet-version',
    'server',
    'x-powered-by',
    'x-runtime-server'
  ];

  dbHeaders.forEach(header => {
    const value = response.headers.get(header);
    if (value && (value.toLowerCase().includes('aspnet') || value.toLowerCase().includes('mysql') || value.toLowerCase().includes('postgres'))) {
      vulnerabilities.push({
        type: 'DATABASE_TECH_DISCLOSURE',
        severity: 'LOW',
        description: `Database technology revealed: ${value}`,
        recommendation: 'Remove or obfuscate technology headers'
      });
    }
  });

  return vulnerabilities;
}

async function testPathForSQLInjection(domain, path) {
  const results = {
    path: path,
    vulnerabilities: []
  };

  // SQL injection test payloads that trigger different behaviors
  const testPayloads = [
    { payload: "' OR '1'='1", name: 'Boolean-based SQLi' },
    { payload: "'; DROP TABLE users; --", name: 'Stacked queries' },
    { payload: "1' UNION SELECT NULL--", name: 'Union-based SQLi' },
    { payload: "admin'--", name: 'Comment-based bypass' }
  ];

  for (const test of testPayloads) {
    try {
      // Test with parameter injection
      const testUrl = `https://${domain}${path}?id=${encodeURIComponent(test.payload)}`;
      
      const res = await fetch(testUrl, { timeout: 5000 }).catch(() =>
        fetch(testUrl.replace('https://', 'http://'), { timeout: 5000 })
      );

      const responseText = await res.text();

      // Check for SQL error indicators
      if (containsSQLError(responseText)) {
        results.vulnerabilities.push({
          type: 'SQL_INJECTION_DETECTED',
          severity: 'CRITICAL',
          path: path,
          testPayload: test.name,
          description: `${test.name} may be possible`,
          indication: 'SQL error in response',
          recommendation: 'Implement parameterized queries and input validation'
        });
        break; // Don't need to test further if already confirmed
      }

      // Check for response time differences (time-based SQLi)
      if (responseText.length === 0 || res.status === 500) {
        results.vulnerabilities.push({
          type: 'POTENTIAL_SQL_INJECTION',
          severity: 'HIGH',
          path: path,
          testPayload: test.name,
          description: `Response anomaly detected`,
          recommendation: 'Implement input validation and WAF'
        });
      }
    } catch (error) {
      // Network errors might indicate filtering
      if (error.message.includes('timeout')) {
        results.vulnerabilities.push({
          type: 'POTENTIAL_TIME_BASED_SQLI',
          severity: 'MEDIUM',
          path: path,
          description: 'Response timeout - possible time-based SQL injection',
          recommendation: 'Implement query timeouts and rate limiting'
        });
      }
    }
  }

  return results;
}

function containsSQLError(responseText) {
  const errorPatterns = [
    /You have an error in your SQL syntax/i,
    /Warning: mysql_/i,
    /SQL query/i,
    /ERROR: column/i,
    /invalid input syntax for/i,
    /ORA-\d+/i,
    /Incorrect syntax near/i,
    /syntax error/i,
    /database error/i
  ];

  return errorPatterns.some(pattern => pattern.test(responseText));
}

export function generateSQLReport(results) {
  let report = `
SQL INJECTION VULNERABILITY ANALYSIS REPORT
============================================
Domain: ${results.domain}
Scan Date: ${results.timestamp}

SUMMARY:
--------
Total Vulnerabilities: ${results.summary.totalVulnerabilities}
Critical: ${results.summary.critical}
High: ${results.summary.high}
Vulnerable Endpoints: ${results.summary.vulnerableEndpoints}
Risk Level: ${results.summary.riskLevel}

VULNERABILITIES FOUND:
----------------------
`;

  if (results.vulnerabilities.length === 0) {
    report += 'No SQL injection vulnerabilities detected.\n';
  } else {
    results.vulnerabilities.forEach((vuln, index) => {
      report += `
${index + 1}. ${vuln.type} (${vuln.severity})
   ${vuln.description}
   Impact: ${vuln.impact || 'Database compromise possible'}
   Recommendation: ${vuln.recommendation}
`;
    });
  }

  report += `

TESTED ENDPOINTS:
-----------------
${results.testedEndpoints.map(e => `${e.path}: ${e.vulnerabilities.length} issues`).join('\n')}

MITIGATION STEPS:
-----------------
1. Use parameterized queries/prepared statements
2. Implement input validation and sanitization
3. Hide database error messages from users
4. Use least privilege database accounts
5. Implement Web Application Firewall (WAF)
6. Regular security testing and code reviews
7. Keep database software updated
`;

  return report;
}
