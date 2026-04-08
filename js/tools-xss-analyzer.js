/**
 * PRACTICAL XSS Vulnerability Detector
 * Real analysis of actual vulnerabilities
 */

export async function analyzeXSSVulnerabilities(domain) {
  const results = {
    domain: domain,
    timestamp: new Date().toISOString(),
    vulnerabilities: [],
    riskAreas: [],
    summary: {}
  };

  console.log(`🚨 Analyzing XSS vulnerabilities on ${domain}...`);

  try {
    // Fetch the page
    const pageRes = await fetch(`https://${domain}`, { timeout: 10000 }).catch(() => 
      fetch(`http://${domain}`, { timeout: 10000 })
    );
    const html = await pageRes.text();

    // 1. Check for dangerous patterns in HTML
    const dangerousPatterns = detectDangerousPatterns(html);
    results.vulnerabilities.push(...dangerousPatterns);

    // 2. Find input fields without proper protections
    const inputRisks = analyzeInputFields(html);
    results.riskAreas.push(...inputRisks);

    // 3. Check for CSP header
    const cspHeader = pageRes.headers.get('content-security-policy');
    if (!cspHeader) {
      results.vulnerabilities.push({
        type: 'MISSING_CSP',
        severity: 'HIGH',
        description: 'No Content-Security-Policy header',
        impact: 'XSS attacks not mitigated by CSP',
        recommendation: 'Add Content-Security-Policy header'
      });
    } else {
      // Analyze CSP strength
      const cspStrength = analyzeCSP(cspHeader);
      if (!cspStrength.isStrict) {
        results.vulnerabilities.push({
          type: 'WEAK_CSP',
          severity: 'MEDIUM',
          description: `CSP is permissive: ${cspHeader}`,
          recommendation: 'Strengthen CSP policy, remove unsafe-inline'
        });
      }
    }

    // 4. Check for X-XSS-Protection header
    const xssProtection = pageRes.headers.get('x-xss-protection');
    if (!xssProtection) {
      results.vulnerabilities.push({
        type: 'MISSING_XSS_PROTECTION',
        severity: 'LOW',
        description: 'X-XSS-Protection header not set',
        recommendation: 'Add X-XSS-Protection: 1; mode=block'
      });
    }

    // 5. Analyze JavaScript for dangerous functions
    const jsRisks = detectDangerousJavaScript(html);
    results.vulnerabilities.push(...jsRisks);

  } catch (error) {
    results.error = error.message;
  }

  results.summary = {
    totalVulnerabilities: results.vulnerabilities.length,
    critical: results.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    high: results.vulnerabilities.filter(v => v.severity === 'HIGH').length,
    riskLevel: results.vulnerabilities.length > 3 ? 'HIGH' : 'MEDIUM'
  };

  return results;
}

function detectDangerousPatterns(html) {
  const vulnerabilities = [];

  // Check for innerHTML assignments
  const innerHTMLMatches = html.match(/\.innerHTML\s*=\s*(?!.*sanitize|.*escape)/gi);
  if (innerHTMLMatches) {
    vulnerabilities.push({
      type: 'INNERHTML_ASSIGNMENT',
      severity: 'HIGH',
      description: `Found ${innerHTMLMatches.length} innerHTML assignments without sanitization`,
      impact: 'DOM-based XSS is possible',
      recommendation: 'Use textContent or sanitize with DOMPurify'
    });
  }

  // Check for eval() usage
  if (html.includes('eval(')) {
    vulnerabilities.push({
      type: 'EVAL_USAGE',
      severity: 'CRITICAL',
      description: 'eval() function detected',
      impact: 'Complete code injection is possible',
      recommendation: 'Never use eval(), use JSON.parse() instead'
    });
  }

  // Check for document.write()
  if (html.includes('document.write(')) {
    vulnerabilities.push({
      type: 'DOCUMENT_WRITE',
      severity: 'MEDIUM',
      description: 'document.write() is used (deprecated)',
      impact: 'Can be exploited for XSS',
      recommendation: 'Use modern DOM methods instead'
    });
  }

  // Check for javascript: protocol
  if (html.includes('javascript:')) {
    vulnerabilities.push({
      type: 'JAVASCRIPT_PROTOCOL',
      severity: 'HIGH',
      description: 'javascript: protocol found in HTML',
      impact: 'XSS is possible through links',
      recommendation: 'Remove javascript: protocol usage'
    });
  }

  // Check for onload, onclick, etc handlers
  const eventHandlers = html.match(/on\w+\s*=\s*["'][^"']*["']/gi);
  if (eventHandlers) {
    vulnerabilities.push({
      type: 'INLINE_EVENT_HANDLERS',
      severity: 'MEDIUM',
      description: `Found ${eventHandlers.length} inline event handlers`,
      impact: 'XSS possible if handlers contain unsanitized input',
      recommendation: 'Use addEventListener instead of inline handlers'
    });
  }

  return vulnerabilities;
}

function analyzeInputFields(html) {
  const risks = [];

  // Find all input fields
  const inputRegex = /<input[^>]*>/gi;
  const inputs = html.match(inputRegex) || [];

  inputs.forEach((input, index) => {
    const hasValidation = input.includes('pattern') || input.includes('type="email"') || input.includes('type="number"');
    const hasMaxlength = input.includes('maxlength');
    
    if (!hasValidation && !hasMaxlength) {
      risks.push({
        inputNumber: index + 1,
        risk: 'Unvalidated input field detected',
        severity: 'MEDIUM',
        recommendation: 'Add input validation and constraints'
      });
    }
  });

  return risks;
}

function analyzeCSP(cspHeader) {
  const hasUnsafeInline = cspHeader.includes('unsafe-inline');
  const hasUnsafeEval = cspHeader.includes('unsafe-eval');
  const hasStrictDynamic = cspHeader.includes("'strict-dynamic'");

  return {
    isStrict: !hasUnsafeInline && !hasUnsafeEval,
    hasUnsafeInline,
    hasUnsafeEval,
    hasStrictDynamic,
    issues: [
      hasUnsafeInline && "Contains 'unsafe-inline'",
      hasUnsafeEval && "Contains 'unsafe-eval'"
    ].filter(Boolean)
  };
}

function detectDangerousJavaScript(html) {
  const risks = [];

  // Extract scripts
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  let scriptCount = 0;

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    const scriptContent = scriptMatch[1];

    // Check for dangerous patterns in scripts
    if (scriptContent.includes('eval(')) {
      risks.push({
        type: 'EVAL_IN_SCRIPT',
        severity: 'CRITICAL',
        scriptNumber: scriptCount,
        recommendation: 'Remove eval() usage'
      });
    }

    if (scriptContent.includes('innerHTML')) {
      risks.push({
        type: 'INNERHTML_IN_SCRIPT',
        severity: 'HIGH',
        scriptNumber: scriptCount,
        recommendation: 'Use textContent or sanitize HTML'
      });
    }

    if (scriptContent.includes('dangerouslySetInnerHTML')) {
      risks.push({
        type: 'DANGEROUS_SET_INNERHTML',
        severity: 'CRITICAL',
        scriptNumber: scriptCount,
        recommendation: 'Use alternatives to dangerouslySetInnerHTML'
      });
    }
  }

  return risks;
}

export function generateXSSReport(results) {
  let report = `
XSS VULNERABILITY ANALYSIS REPORT
==================================
Domain: ${results.domain}
Scan Date: ${results.timestamp}

SUMMARY:
--------
Total Vulnerabilities: ${results.summary.totalVulnerabilities}
Critical: ${results.summary.critical}
High: ${results.summary.high}
Risk Level: ${results.summary.riskLevel}

VULNERABILITIES FOUND:
----------------------
`;

  if (results.vulnerabilities.length === 0) {
    report += 'No XSS vulnerabilities detected.\n';
  } else {
    results.vulnerabilities.forEach((vuln, index) => {
      report += `
${index + 1}. ${vuln.type} (${vuln.severity})
   Description: ${vuln.description}
   Impact: ${vuln.impact || 'XSS attack vector'}
   Recommendation: ${vuln.recommendation}
`;
    });
  }

  report += `

MITIGATION STEPS:
-----------------
1. Enable strict Content-Security-Policy
2. Remove all inline event handlers
3. Use textContent instead of innerHTML
4. Sanitize all user input
5. Use security libraries (DOMPurify)
6. Implement X-XSS-Protection header
7. Enable X-Content-Type-Options: nosniff
`;

  return report;
}
