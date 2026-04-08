// OWASP Security Tools & Vulnerability Detector
// Implements OWASP Top 10, CWE-25, and security best practices

import https from 'https';

// OWASP Detection Patterns
const OWASP_CHECKS = {
  // A01: Broken Access Control
  BROKEN_ACCESS_CONTROL: {
    name: 'Broken Access Control',
    severity: 'critical',
    patterns: [
      { header: 'x-permit-all', flag: true },
      { header: 'x-authorize', value: 'disabled' }
    ]
  },
  
  // A02: Cryptographic Failures
  CRYPTO_FAILURES: {
    name: 'Cryptographic Failures',
    severity: 'critical',
    checks: ['weak_ssl', 'expired_cert', 'weak_cipher', 'no_tls_1_3']
  },
  
  // A03: Injection
  INJECTION_RISK: {
    name: 'Injection Vulnerabilities',
    severity: 'critical',
    patterns: [
      { header: 'x-powered-by', contains: ['old', 'outdated'] },
      { behavior: 'sql_error_messages' },
      { behavior: 'path_traversal_allowed' }
    ]
  },
  
  // A04: Insecure Design
  INSECURE_DESIGN: {
    name: 'Insecure Design',
    severity: 'high',
    checks: ['missing_mfa', 'weak_password_policy', 'no_rate_limiting']
  },
  
  // A05: Security Misconfiguration
  MISCONFIGURATION: {
    name: 'Security Misconfiguration',
    severity: 'high',
    checks: [
      'missing_security_headers',
      'outdated_software',
      'default_credentials',
      'unnecessary_services'
    ]
  },
  
  // A06: Vulnerable & Outdated Components
  VULNERABLE_COMPONENTS: {
    name: 'Vulnerable & Outdated Components',
    severity: 'high',
    checks: ['outdated_framework', 'outdated_library', 'known_cve']
  },
  
  // A07: Authentication Failures
  AUTH_FAILURES: {
    name: 'Authentication Failures',
    severity: 'high',
    checks: [
      'weak_password_policy',
      'exposed_session_tokens',
      'no_account_lockout',
      'weak_mfa'
    ]
  },
  
  // A08: Software & Data Integrity Failures
  INTEGRITY_FAILURES: {
    name: 'Software & Data Integrity Failures',
    severity: 'high',
    checks: ['unsigned_updates', 'no_code_signing', 'weak_hash']
  },
  
  // A09: Logging & Monitoring Failures
  LOGGING_FAILURES: {
    name: 'Logging & Monitoring Failures',
    severity: 'medium',
    checks: ['no_audit_logs', 'incomplete_logging', 'no_alerting']
  },
  
  // A10: SSRF
  SSRF: {
    name: 'Server-Side Request Forgery (SSRF)',
    severity: 'high',
    patterns: []
  }
};

// CWE (Common Weakness Enumeration) Top 25
const CWE_TOP_VULNERABILITIES = {
  'CWE-79': { name: 'Cross-site Scripting (XSS)', severity: 'high' },
  'CWE-89': { name: 'SQL Injection', severity: 'critical' },
  'CWE-90': { name: 'LDAP Injection', severity: 'high' },
  'CWE-94': { name: 'Code Injection', severity: 'critical' },
  'CWE-95': { name: 'Improper Neutralization', severity: 'high' },
  'CWE-125': { name: 'Out-of-bounds Read', severity: 'high' },
  'CWE-200': { name: 'Information Exposure', severity: 'high' },
  'CWE-287': { name: 'Improper Authentication', severity: 'critical' },
  'CWE-352': { name: 'Cross-Site Request Forgery (CSRF)', severity: 'high' },
  'CWE-434': { name: 'Unrestricted Upload', severity: 'high' },
  'CWE-502': { name: 'Deserialization of Untrusted Data', severity: 'critical' },
  'CWE-611': { name: 'XXE Injection', severity: 'critical' },
  'CWE-639': { name: 'Authorization Bypass', severity: 'critical' },
  'CWE-862': { name: 'Missing Authorization', severity: 'critical' }
};

// Security Headers Database
const SECURITY_HEADERS = {
  'strict-transport-security': {
    name: 'HSTS',
    severity: 'high',
    required: true,
    minValue: 'max-age=31536000; includeSubDomains'
  },
  'content-security-policy': {
    name: 'CSP',
    severity: 'high',
    required: true
  },
  'x-frame-options': {
    name: 'Clickjacking Protection',
    severity: 'medium',
    required: true,
    validValues: ['DENY', 'SAMEORIGIN']
  },
  'x-content-type-options': {
    name: 'MIME Type Sniffing Protection',
    severity: 'medium',
    required: true,
    value: 'nosniff'
  },
  'x-xss-protection': {
    name: 'XSS Protection',
    severity: 'medium',
    required: true,
    value: '1; mode=block'
  },
  'referrer-policy': {
    name: 'Referrer Policy',
    severity: 'low',
    required: true,
    validValues: ['no-referrer', 'strict-origin-when-cross-origin']
  },
  'permissions-policy': {
    name: 'Permissions Policy',
    severity: 'low',
    required: false
  },
  'content-security-policy-report-only': {
    name: 'CSP Report Only',
    severity: 'low',
    required: false
  }
};

export default async function handler(req, res) {
  const { host } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  try {
    const owaspAnalysis = await performOwaspAnalysis(host);
    
    res.status(200).json({
      ok: true,
      host: host,
      owaspAnalysis: owaspAnalysis,
      timestamp: new Date().toISOString(),
      source: 'OWASP Tools & Vulnerability Detector'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

async function performOwaspAnalysis(host) {
  const results = {
    owasp_top_10: [],
    cwe_vulnerabilities: [],
    security_headers: [],
    certificates: null,
    risk_assessment: null,
    remediation: []
  };

  try {
    // 1. Fetch headers and certificate
    const { headers, certData } = await fetchSecurityData(host);

    // 2. Analyze OWASP Top 10
    results.owasp_top_10 = analyzeOWASPTop10(headers, certData);

    // 3. Check for CWE vulnerabilities
    results.cwe_vulnerabilities = checkCWEVulnerabilities(headers, certData);

    // 4. Validate security headers
    results.security_headers = validateSecurityHeaders(headers);

    // 5. Certificate analysis
    results.certificates = analyzeCertificateSecurity(certData);

    // 6. Generate risk assessment
    results.risk_assessment = generateRiskAssessment(results);

    // 7. Generate remediation steps
    results.remediation = generateRemediationPlan(results);

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

async function fetchSecurityData(host) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      rejectUnauthorized: false,
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const certData = res.socket.getPeerCertificate();
      const tlsVersion = res.socket.getProtocol();
      const cipher = res.socket.getCipher();
      
      // Normalize headers to lowercase
      const headers = {};
      Object.entries(res.headers).forEach(([key, value]) => {
        headers[key.toLowerCase()] = value;
      });

      res.destroy();
      
      resolve({
        headers: headers,
        certData: {
          subject: certData.subject,
          issuer: certData.issuer,
          valid_from: certData.valid_from,
          valid_to: certData.valid_to,
          fingerprint: certData.fingerprint,
          bits: certData.bits,
          signatureAlgorithm: certData.signatureAlgorithm,
          tlsVersion: tlsVersion,
          cipher: cipher ? cipher.name : 'unknown'
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Security data fetch timeout'));
    });
    req.end();
  });
}

function analyzeOWASPTop10(headers, certData) {
  const findings = [];

  // A01: Broken Access Control
  if (!headers['authorization'] && !headers['cookie']) {
    findings.push({
      id: 'A01',
      name: 'Broken Access Control',
      severity: 'critical',
      description: 'Potential broken access control - check authentication mechanisms',
      recommendation: 'Implement proper authorization checks on all endpoints'
    });
  }

  // A02: Cryptographic Failures
  if (!certData.tlsVersion.includes('1.3')) {
    findings.push({
      id: 'A02',
      name: 'Cryptographic Failures',
      severity: 'high',
      description: `Using ${certData.tlsVersion} instead of TLS 1.3`,
      recommendation: 'Upgrade to TLS 1.3 and remove support for older versions'
    });
  }

  if (certData.bits < 2048) {
    findings.push({
      id: 'A02',
      name: 'Weak Certificate Key',
      severity: 'critical',
      description: `Certificate uses weak ${certData.bits}-bit key`,
      recommendation: 'Upgrade to 2048-bit or higher immediately'
    });
  }

  // A03: Injection - Check for error messages
  if (headers['x-powered-by']) {
    findings.push({
      id: 'A03',
      name: 'Information Disclosure (Injection Risk)',
      severity: 'medium',
      description: `Server reveals technology: ${headers['x-powered-by']}`,
      recommendation: 'Remove or obscure X-Powered-By header'
    });
  }

  // A04: Insecure Design - Missing security headers
  const missingHeaders = checkMissingSecurityHeaders(headers);
  if (missingHeaders.length > 0) {
    findings.push({
      id: 'A04',
      name: 'Insecure Design',
      severity: 'high',
      description: `Missing security headers: ${missingHeaders.join(', ')}`,
      recommendation: 'Implement all critical security headers'
    });
  }

  // A05: Security Misconfiguration
  if (headers['server']) {
    findings.push({
      id: 'A05',
      name: 'Security Misconfiguration',
      severity: 'medium',
      description: `Server version exposed: ${headers['server']}`,
      recommendation: 'Hide or mask server information'
    });
  }

  // A06: Vulnerable Components
  if (headers['x-aspnet-version'] || headers['x-powered-by']) {
    findings.push({
      id: 'A06',
      name: 'Vulnerable & Outdated Components',
      severity: 'high',
      description: 'Application framework/version information disclosed',
      recommendation: 'Keep all components updated and remove version disclosure'
    });
  }

  // A07: Authentication Failures
  if (!headers['strict-transport-security']) {
    findings.push({
      id: 'A07',
      name: 'Authentication Failures',
      severity: 'high',
      description: 'HSTS not enabled - credentials could be intercepted',
      recommendation: 'Enable HSTS with preload'
    });
  }

  // A09: Logging & Monitoring
  findings.push({
    id: 'A09',
    name: 'Logging & Monitoring Failures',
    severity: 'medium',
    description: 'Unable to verify logging/monitoring mechanisms',
    recommendation: 'Implement comprehensive logging and alerting'
  });

  return findings;
}

function checkCWEVulnerabilities(headers, certData) {
  const vulnerabilities = [];

  // CWE-79: XSS
  if (!headers['content-security-policy']) {
    vulnerabilities.push({
      cwe: 'CWE-79',
      name: 'Cross-site Scripting (XSS)',
      severity: 'high',
      description: 'No CSP header found',
      recommendation: 'Implement strict Content-Security-Policy'
    });
  }

  // CWE-352: CSRF
  if (!headers['x-csrf-token'] && !headers['csrf-token']) {
    vulnerabilities.push({
      cwe: 'CWE-352',
      name: 'Cross-Site Request Forgery (CSRF)',
      severity: 'high',
      description: 'No CSRF protection token found',
      recommendation: 'Implement CSRF tokens for state-changing operations'
    });
  }

  // CWE-287: Improper Authentication
  if (certData.tlsVersion === 'TLSv1' || certData.tlsVersion === 'SSLv3') {
    vulnerabilities.push({
      cwe: 'CWE-287',
      name: 'Improper Authentication',
      severity: 'critical',
      description: `Using deprecated protocol: ${certData.tlsVersion}`,
      recommendation: 'Upgrade to TLS 1.2 minimum, TLS 1.3 preferred'
    });
  }

  // CWE-639: Authorization Bypass
  if (!headers['x-frame-options']) {
    vulnerabilities.push({
      cwe: 'CWE-639',
      name: 'Authorization Bypass (Clickjacking)',
      severity: 'high',
      description: 'No X-Frame-Options header',
      recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN'
    });
  }

  return vulnerabilities;
}

function validateSecurityHeaders(headers) {
  const validation = [];

  Object.entries(SECURITY_HEADERS).forEach(([headerName, config]) => {
    const headerValue = headers[headerName];

    if (!headerValue && config.required) {
      validation.push({
        header: headerName,
        name: config.name,
        status: 'MISSING',
        severity: config.severity,
        recommendation: `Add header: ${headerName}: ${config.minValue || config.value || '...'}`
      });
    } else if (headerValue) {
      validation.push({
        header: headerName,
        name: config.name,
        status: 'PRESENT',
        value: headerValue,
        severity: 'low'
      });
    }
  });

  return validation;
}

function analyzeCertificateSecurity(certData) {
  const issues = [];

  // Check expiration
  const expiryDate = new Date(certData.valid_to);
  const daysUntilExpiry = Math.floor((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    issues.push({
      type: 'EXPIRED',
      severity: 'critical',
      message: 'Certificate has expired'
    });
  } else if (daysUntilExpiry < 30) {
    issues.push({
      type: 'EXPIRING_SOON',
      severity: 'high',
      message: `Certificate expires in ${daysUntilExpiry} days`
    });
  }

  // Check key strength
  if (certData.bits < 2048) {
    issues.push({
      type: 'WEAK_KEY',
      severity: 'critical',
      message: `${certData.bits}-bit key is cryptographically weak`
    });
  }

  // Check signature algorithm
  if (certData.signatureAlgorithm && certData.signatureAlgorithm.includes('SHA1')) {
    issues.push({
      type: 'WEAK_SIGNATURE',
      severity: 'high',
      message: 'Certificate uses SHA-1 (deprecated)'
    });
  }

  return {
    algorithm: certData.signatureAlgorithm,
    bits: certData.bits,
    tlsVersion: certData.tlsVersion,
    cipher: certData.cipher,
    issues: issues
  };
}

function generateRiskAssessment(results) {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  // Count all findings by severity
  const allFindings = [
    ...results.owasp_top_10,
    ...results.cwe_vulnerabilities,
    ...results.security_headers.filter(h => h.status === 'MISSING'),
    ...(results.certificates?.issues || [])
  ];

  allFindings.forEach(finding => {
    if (finding.severity === 'critical') criticalCount++;
    else if (finding.severity === 'high') highCount++;
    else if (finding.severity === 'medium') mediumCount++;
  });

  const totalScore = Math.max(0, 100 - (criticalCount * 40 + highCount * 20 + mediumCount * 10));

  return {
    overallRiskScore: totalScore,
    riskLevel: getRiskLevel(totalScore),
    criticalIssues: criticalCount,
    highIssues: highCount,
    mediumIssues: mediumCount,
    totalIssues: allFindings.length
  };
}

function generateRemediationPlan(results) {
  const plan = [];

  if (results.risk_assessment.criticalIssues > 0) {
    plan.push({
      priority: 1,
      timeframe: 'IMMEDIATE (within 24 hours)',
      actions: results.owasp_top_10
        .filter(f => f.severity === 'critical')
        .map(f => f.recommendation)
    });
  }

  if (results.risk_assessment.highIssues > 0) {
    plan.push({
      priority: 2,
      timeframe: 'URGENT (within 1 week)',
      actions: results.owasp_top_10
        .filter(f => f.severity === 'high')
        .concat(results.cwe_vulnerabilities.filter(v => v.severity === 'high'))
        .map(f => f.recommendation)
    });
  }

  if (results.risk_assessment.mediumIssues > 0) {
    plan.push({
      priority: 3,
      timeframe: 'IMPORTANT (within 1 month)',
      actions: results.owasp_top_10
        .filter(f => f.severity === 'medium')
        .map(f => f.recommendation)
    });
  }

  return plan;
}

function checkMissingSecurityHeaders(headers) {
  const missing = [];
  const required = ['strict-transport-security', 'content-security-policy', 'x-frame-options'];

  required.forEach(header => {
    if (!headers[header]) {
      missing.push(header);
    }
  });

  return missing;
}

function getRiskLevel(score) {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  if (score >= 20) return 'CRITICAL';
  return 'EXTREME';
}
