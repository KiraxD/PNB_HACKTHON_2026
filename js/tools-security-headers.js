/**
 * PRACTICAL Security Headers Analyzer
 * Analyzes HTTP response headers for security configurations
 */

export async function analyzeSecurityHeaders(domain) {
  const results = {
    domain: domain,
    timestamp: new Date().toISOString(),
    headers: {},
    analysis: {},
    vulnerabilities: [],
    recommendations: []
  };

  console.log(`🔐 Analyzing security headers for ${domain}...`);

  try {
    // Fetch both HTTP and HTTPS versions
    let response;
    
    try {
      response = await fetch(`https://${domain}`, { timeout: 10000 });
    } catch (e) {
      response = await fetch(`http://${domain}`, { timeout: 10000 });
    }

    // Extract all headers
    const headersObj = {};
    response.headers.forEach((value, name) => {
      headersObj[name.toLowerCase()] = value;
    });

    results.headers = headersObj;

    // Analyze each important security header
    analyzeCSP(headersObj, results);
    analyzeContentSecurity(headersObj, results);
    analyzeHTTPS(response.url, results);
    analyzeCookies(headersObj, results);
    analyzeFrameOptions(headersObj, results);
    analyzeTypeOptions(headersObj, results);
    analyzeReferrerPolicy(headersObj, results);
    analyzePermissionsPolicy(headersObj, results);
    analyzeCacheControl(headersObj, results);
    analyzeHSTS(headersObj, results);

    // Overall score
    results.securityScore = calculateSecurityScore(results.analysis);

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

function analyzeCSP(headers, results) {
  const csp = headers['content-security-policy'];
  
  results.analysis.csp = {
    present: !!csp,
    value: csp || 'NOT SET',
    issues: []
  };

  if (!csp) {
    results.vulnerabilities.push({
      header: 'Content-Security-Policy',
      severity: 'HIGH',
      issue: 'Missing CSP header',
      risk: 'XSS attacks not mitigated by CSP',
      recommendation: 'Implement a strict CSP policy'
    });
    return;
  }

  // Check for unsafe directives
  if (csp.includes('unsafe-inline')) {
    results.analysis.csp.issues.push('Contains unsafe-inline');
    results.vulnerabilities.push({
      header: 'Content-Security-Policy',
      severity: 'HIGH',
      issue: "CSP contains 'unsafe-inline'",
      risk: 'Inline scripts can execute, reducing XSS protection',
      recommendation: "Remove 'unsafe-inline' and use nonces or hashes"
    });
  }

  if (csp.includes('unsafe-eval')) {
    results.analysis.csp.issues.push('Contains unsafe-eval');
    results.vulnerabilities.push({
      header: 'Content-Security-Policy',
      severity: 'MEDIUM',
      issue: "CSP contains 'unsafe-eval'",
      risk: 'eval() can execute, potential code injection',
      recommendation: "Remove 'unsafe-eval' directive"
    });
  }

  if (csp.includes('*')) {
    results.analysis.csp.issues.push('Contains wildcard directives');
  }

  if (!csp.includes('strict-dynamic')) {
    results.recommendations.push({
      header: 'Content-Security-Policy',
      suggestion: "Consider adding 'strict-dynamic' for better security"
    });
  }
}

function analyzeContentSecurity(headers, results) {
  // X-Content-Type-Options
  const xContentType = headers['x-content-type-options'];
  results.analysis.xContentTypeOptions = {
    present: !!xContentType,
    value: xContentType || 'NOT SET'
  };

  if (!xContentType || xContentType.toLowerCase() !== 'nosniff') {
    results.vulnerabilities.push({
      header: 'X-Content-Type-Options',
      severity: 'MEDIUM',
      issue: "Header missing or not set to 'nosniff'",
      risk: 'MIME type sniffing attacks possible',
      recommendation: "Set to 'X-Content-Type-Options: nosniff'"
    });
  }

  // X-XSS-Protection
  const xXss = headers['x-xss-protection'];
  results.analysis.xXssProtection = {
    present: !!xXss,
    value: xXss || 'NOT SET'
  };

  if (!xXss || !xXss.includes('1')) {
    results.vulnerabilities.push({
      header: 'X-XSS-Protection',
      severity: 'LOW',
      issue: 'Browser XSS protection not enabled',
      risk: 'Browser XSS filters may not be active',
      recommendation: "Set to 'X-XSS-Protection: 1; mode=block'"
    });
  }
}

function analyzeHTTPS(url, results) {
  const isHTTPS = url.startsWith('https');
  
  results.analysis.https = {
    enforced: isHTTPS,
    url: url
  };

  if (!isHTTPS) {
    results.vulnerabilities.push({
      header: 'HTTPS',
      severity: 'CRITICAL',
      issue: 'HTTPS not enforced',
      risk: 'Man-in-the-middle attacks possible',
      recommendation: 'Enforce HTTPS for all traffic'
    });
  }
}

function analyzeCookies(headers, results) {
  results.analysis.cookies = {
    present: !!headers['set-cookie'],
    value: headers['set-cookie'] || 'NOT SET'
  };

  if (headers['set-cookie']) {
    const cookie = headers['set-cookie'].toLowerCase();

    if (!cookie.includes('secure')) {
      results.vulnerabilities.push({
        header: 'Set-Cookie',
        severity: 'HIGH',
        issue: 'Cookie missing Secure flag',
        risk: 'Cookies transmitted over unencrypted HTTP',
        recommendation: "Set 'Secure' flag on all cookies"
      });
    }

    if (!cookie.includes('httponly')) {
      results.vulnerabilities.push({
        header: 'Set-Cookie',
        severity: 'HIGH',
        issue: 'Cookie missing HttpOnly flag',
        risk: 'Cookies accessible to JavaScript, XSS can steal them',
        recommendation: "Set 'HttpOnly' flag on sensitive cookies"
      });
    }

    if (!cookie.includes('samesite')) {
      results.vulnerabilities.push({
        header: 'Set-Cookie',
        severity: 'MEDIUM',
        issue: 'Cookie missing SameSite attribute',
        risk: 'CSRF attacks possible',
        recommendation: "Set 'SameSite=Strict' or 'SameSite=Lax'"
      });
    }
  }
}

function analyzeFrameOptions(headers, results) {
  const xFrame = headers['x-frame-options'];
  
  results.analysis.xFrameOptions = {
    present: !!xFrame,
    value: xFrame || 'NOT SET'
  };

  if (!xFrame || (xFrame.toUpperCase() !== 'DENY' && xFrame.toUpperCase() !== 'SAMEORIGIN')) {
    results.vulnerabilities.push({
      header: 'X-Frame-Options',
      severity: 'MEDIUM',
      issue: 'Missing or weak X-Frame-Options header',
      risk: 'Clickjacking attacks possible',
      recommendation: "Set to 'X-Frame-Options: DENY' or 'SAMEORIGIN'"
    });
  }
}

function analyzeTypeOptions(headers, results) {
  // Already covered in analyzeContentSecurity
}

function analyzeReferrerPolicy(headers, results) {
  const referrer = headers['referrer-policy'];
  
  results.analysis.referrerPolicy = {
    present: !!referrer,
    value: referrer || 'NOT SET'
  };

  if (!referrer) {
    results.recommendations.push({
      header: 'Referrer-Policy',
      suggestion: "Set 'Referrer-Policy: strict-origin-when-cross-origin' to limit referrer information"
    });
  }
}

function analyzePermissionsPolicy(headers, results) {
  const permissions = headers['permissions-policy'] || headers['feature-policy'];
  
  results.analysis.permissionsPolicy = {
    present: !!permissions,
    value: permissions || 'NOT SET'
  };

  if (!permissions) {
    results.recommendations.push({
      header: 'Permissions-Policy',
      suggestion: 'Implement Permissions-Policy to control browser features (microphone, camera, geolocation)'
    });
  }
}

function analyzeCacheControl(headers, results) {
  const cacheControl = headers['cache-control'];
  
  results.analysis.cacheControl = {
    present: !!cacheControl,
    value: cacheControl || 'NOT SET'
  };

  if (!cacheControl) {
    results.recommendations.push({
      header: 'Cache-Control',
      suggestion: 'Set appropriate Cache-Control headers for security and performance'
    });
  } else if (!cacheControl.includes('no-store') && !cacheControl.includes('private')) {
    results.vulnerabilities.push({
      header: 'Cache-Control',
      severity: 'LOW',
      issue: 'Caching policy may expose sensitive data',
      risk: 'Cached pages might be accessible from browser history or proxies',
      recommendation: "Use 'Cache-Control: no-store' for sensitive pages"
    });
  }
}

function analyzeHSTS(headers, results) {
  const hsts = headers['strict-transport-security'];
  
  results.analysis.hsts = {
    present: !!hsts,
    value: hsts || 'NOT SET'
  };

  if (!hsts) {
    results.vulnerabilities.push({
      header: 'Strict-Transport-Security',
      severity: 'HIGH',
      issue: 'HSTS header missing',
      risk: 'HTTPS enforcement not guaranteed, downgrade attacks possible',
      recommendation: "Set 'Strict-Transport-Security: max-age=31536000; includeSubDomains' (1 year)"
    });
  } else {
    const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] || 0);
    if (maxAge < 31536000) { // Less than 1 year
      results.recommendations.push({
        header: 'Strict-Transport-Security',
        suggestion: 'HSTS max-age could be longer (recommend 1 year = 31536000 seconds)'
      });
    }
  }
}

function calculateSecurityScore(analysis) {
  let score = 100;
  const penalties = {
    'https': { present: false, penalty: 20 },
    'hsts': { present: false, penalty: 15 },
    'csp': { present: false, penalty: 15 },
    'xFrameOptions': { present: false, penalty: 10 },
    'xContentTypeOptions': { present: false, penalty: 10 },
    'xXssProtection': { present: false, penalty: 5 }
  };

  Object.entries(penalties).forEach(([key, { present, penalty }]) => {
    if (key === 'https') {
      if (!analysis[key]?.enforced) score -= penalty;
    } else {
      if (!analysis[key]?.present) score -= penalty;
    }
  });

  return Math.max(0, score);
}

export function generateHeadersReport(results) {
  let report = `
SECURITY HEADERS ANALYSIS REPORT
=================================
Domain: ${results.domain}
Scan Date: ${results.timestamp}

SECURITY SCORE: ${results.securityScore}/100

HEADER STATUS:
--------------
HTTPS Enforced: ${results.analysis.https?.enforced ? '✅ YES' : '❌ NO'}
HSTS Present: ${results.analysis.hsts?.present ? '✅ YES' : '❌ NO'}
CSP Present: ${results.analysis.csp?.present ? '✅ YES' : '❌ NO'}
X-Frame-Options: ${results.analysis.xFrameOptions?.present ? '✅ YES' : '❌ NO'}
X-Content-Type-Options: ${results.analysis.xContentTypeOptions?.present ? '✅ YES' : '❌ NO'}
X-XSS-Protection: ${results.analysis.xXssProtection?.present ? '✅ YES' : '❌ NO'}
Referrer-Policy: ${results.analysis.referrerPolicy?.present ? '✅ YES' : '❌ NO'}
Permissions-Policy: ${results.analysis.permissionsPolicy?.present ? '✅ YES' : '❌ NO'}

`;

  if (results.vulnerabilities.length > 0) {
    report += `VULNERABILITIES FOUND (${results.vulnerabilities.length}):
-------------------
`;
    results.vulnerabilities.forEach((vuln, index) => {
      report += `
${index + 1}. ${vuln.header} - ${vuln.severity}
   Issue: ${vuln.issue}
   Risk: ${vuln.risk}
   Recommendation: ${vuln.recommendation}
`;
    });
  }

  if (results.recommendations.length > 0) {
    report += `

RECOMMENDATIONS:
----------------
`;
    results.recommendations.forEach(rec => {
      report += `- ${rec.header}: ${rec.suggestion}\n`;
    });
  }

  report += `

IMPLEMENTATION STEPS:
---------------------
1. Add HSTS header (Strict-Transport-Security)
2. Implement CSP (Content-Security-Policy)
3. Set X-Frame-Options to DENY or SAMEORIGIN
4. Add X-Content-Type-Options: nosniff
5. Enable X-XSS-Protection
6. Configure secure cookies with HttpOnly and Secure flags
7. Set Referrer-Policy appropriately
8. Implement Permissions-Policy for feature control
`;

  return report;
}
