// Unified Security Scanner - Integrates all OWASP, Crypto, and Threat Analysis Tools
// Usage: Orchestrates multiple analysis engines for comprehensive security assessment

import https from 'https';

export default async function handler(req, res) {
  const { host, analysisType = 'full' } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  try {
    // Full security scan combining all tools
    const scanResults = await performComprehensiveScan(host, analysisType);
    
    res.status(200).json({
      ok: true,
      host: host,
      scanType: analysisType,
      results: scanResults,
      timestamp: new Date().toISOString(),
      version: '3.0 - Unified Security Scanner'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

async function performComprehensiveScan(host, analysisType) {
  const scanResults = {
    host: host,
    scanDate: new Date().toISOString(),
    analyses: {}
  };

  try {
    // Stage 1: Fetch security data once
    const securityData = await fetchAllSecurityData(host);

    // Stage 2: Run analysis based on type requested
    if (analysisType === 'full' || analysisType === 'owasp') {
      scanResults.analyses.owasp = analyzeOWASP(securityData);
    }

    if (analysisType === 'full' || analysisType === 'crypto') {
      scanResults.analyses.cryptography = analyzeCryptography(securityData);
    }

    if (analysisType === 'full' || analysisType === 'headers') {
      scanResults.analyses.securityHeaders = analyzeSecurityHeaders(securityData);
    }

    if (analysisType === 'full' || analysisType === 'pqc') {
      scanResults.analyses.quantumReadiness = analyzeQuantumReadiness(securityData);
    }

    if (analysisType === 'full' || analysisType === 'threats') {
      scanResults.analyses.threats = analyzeThreatModel(securityData);
    }

    // Stage 3: Calculate overall risk
    scanResults.overallAssessment = calculateOverallRisk(scanResults.analyses);

    // Stage 4: Generate actionable plan
    scanResults.remediationPlan = generateComprehensiveRemediationPlan(scanResults);

  } catch (error) {
    scanResults.error = error.message;
  }

  return scanResults;
}

async function fetchAllSecurityData(host) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      rejectUnauthorized: false,
      timeout: 15000
    };

    const request = https.request(options, (res) => {
      try {
        const cert = res.socket.getPeerCertificate();
        const tlsVersion = res.socket.getProtocol();
        const cipher = res.socket.getCipher();
        
        // Normalize headers
        const headers = {};
        Object.entries(res.headers).forEach(([key, value]) => {
          headers[key.toLowerCase()] = value;
        });

        res.destroy();

        resolve({
          host: host,
          timestamp: new Date().toISOString(),
          headers: headers,
          certificate: {
            subject: cert.subject || {},
            issuer: cert.issuer || {},
            validFrom: new Date(cert.valid_from),
            validTo: new Date(cert.valid_to),
            daysRemaining: Math.floor((new Date(cert.valid_to) - Date.now()) / (1000 * 60 * 60 * 24)),
            fingerprint: cert.fingerprint,
            serialNumber: cert.serialNumber,
            bits: cert.bits || 2048,
            publicKeyAlgorithm: extractKeyAlgorithm(cert),
            signatureAlgorithm: cert.signatureAlgorithm || 'unknown',
            issuerChain: extractChain(cert)
          },
          tls: {
            version: tlsVersion,
            cipher: cipher ? cipher.name : 'unknown',
            cipherBits: cipher ? cipher.bits : 0
          }
        });
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', (error) => {
      reject(new Error(`Failed to connect to ${host}: ${error.message}`));
    });

    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Security data fetch timeout'));
    });

    request.end();
  });
}

function analyzeOWASP(data) {
  const findings = [];
  const { headers, certificate, tls } = data;

  // A01: Broken Access Control
  if (!headers['authorization'] && !headers['cookie']) {
    findings.push({
      owaspId: 'A01',
      title: 'Broken Access Control',
      severity: 'CRITICAL',
      description: 'Potential access control issues detected',
      recommendation: 'Review and implement proper authorization checks',
      cvssScore: 7.5
    });
  }

  // A02: Cryptographic Failures
  const cryptoIssues = [];
  if (tls.version !== 'TLSv1.3') {
    cryptoIssues.push(`Using ${tls.version} instead of TLS 1.3`);
  }
  if (certificate.bits < 2048) {
    cryptoIssues.push(`${certificate.bits}-bit key is weak`);
  }
  if (cryptoIssues.length > 0) {
    findings.push({
      owaspId: 'A02',
      title: 'Cryptographic Failures',
      severity: 'CRITICAL',
      issues: cryptoIssues,
      recommendation: 'Upgrade cryptographic implementations',
      cvssScore: 8.2
    });
  }

  // A03: Injection
  if (headers['x-powered-by'] || headers['server']) {
    findings.push({
      owaspId: 'A03',
      title: 'Information Disclosure (Injection Risk)',
      severity: 'MEDIUM',
      description: `Technology stack exposed: ${headers['x-powered-by'] || headers['server']}`,
      recommendation: 'Remove or obscure server information headers',
      cvssScore: 5.3
    });
  }

  // A04: Insecure Design
  const missingHeaders = [
    !headers['strict-transport-security'] && 'HSTS',
    !headers['content-security-policy'] && 'CSP',
    !headers['x-frame-options'] && 'X-Frame-Options'
  ].filter(Boolean);

  if (missingHeaders.length > 0) {
    findings.push({
      owaspId: 'A04',
      title: 'Insecure Design',
      severity: 'HIGH',
      missingHeaders: missingHeaders,
      recommendation: 'Implement all critical security headers',
      cvssScore: 6.5
    });
  }

  // A05: Security Misconfiguration
  if (headers['server']) {
    findings.push({
      owaspId: 'A05',
      title: 'Security Misconfiguration',
      severity: 'MEDIUM',
      description: `Server version exposed: ${headers['server']}`,
      recommendation: 'Configure server to hide version information',
      cvssScore: 5.3
    });
  }

  // A07: Authentication Failures
  if (!headers['strict-transport-security']) {
    findings.push({
      owaspId: 'A07',
      title: 'Authentication Failures',
      severity: 'HIGH',
      description: 'HSTS not enabled - authentication credentials at risk',
      recommendation: 'Enable HSTS with max-age=31536000; includeSubDomains; preload',
      cvssScore: 6.8
    });
  }

  // A09: Logging & Monitoring Failures
  findings.push({
    owaspId: 'A09',
    title: 'Logging & Monitoring Failures',
    severity: 'MEDIUM',
    description: 'Unable to verify security event logging and monitoring',
    recommendation: 'Implement centralized logging and security alerting',
    cvssScore: 4.3
  });

  return {
    findingCount: findings.length,
    findings: findings,
    complianceLevel: calculateOWASPCompliance(findings)
  };
}

function analyzeCryptography(data) {
  const { certificate, tls } = data;
  const issues = [];
  const strengths = [];

  // Key strength analysis
  if (certificate.publicKeyAlgorithm === 'RSA') {
    if (certificate.bits < 1024) {
      issues.push({
        type: 'CRITICAL_KEY_WEAKNESS',
        bits: certificate.bits,
        severity: 'CRITICAL',
        impact: 'Key can be broken with current technology'
      });
    } else if (certificate.bits === 1024) {
      issues.push({
        type: 'KEY_WEAKNESS',
        bits: certificate.bits,
        severity: 'CRITICAL',
        impact: 'Vulnerable to factorization attacks'
      });
    } else if (certificate.bits === 2048) {
      issues.push({
        type: 'SUNSET_WARNING',
        bits: certificate.bits,
        severity: 'HIGH',
        impact: 'RSA-2048 sunset scheduled for 2030',
        recommendation: 'Plan migration to 4096-bit or ECDSA-384'
      });
    } else if (certificate.bits >= 4096) {
      strengths.push({
        type: 'STRONG_KEY',
        bits: certificate.bits,
        rating: 'EXCELLENT'
      });
    }
  }

  // TLS version analysis
  const tlsVersionScore = scoreTLSVersion(tls.version);
  if (tlsVersionScore.severity !== 'GOOD') {
    issues.push({
      type: 'WEAK_TLS_VERSION',
      version: tls.version,
      severity: tlsVersionScore.severity,
      recommendation: 'Upgrade to TLS 1.3'
    });
  }

  // Signature algorithm analysis
  if (certificate.signatureAlgorithm.includes('SHA1')) {
    issues.push({
      type: 'WEAK_SIGNATURE',
      algorithm: certificate.signatureAlgorithm,
      severity: 'HIGH',
      recommendation: 'Renew certificate with SHA256 or higher'
    });
  }

  // Forward secrecy check
  const hasFS = tls.cipher.includes('ECDHE') || tls.cipher.includes('DHE');
  if (!hasFS) {
    issues.push({
      type: 'NO_FORWARD_SECRECY',
      cipher: tls.cipher,
      severity: 'HIGH',
      recommendation: 'Use ECDHE or DHE ciphers'
    });
  }

  return {
    keyAlgorithm: certificate.publicKeyAlgorithm,
    keyBits: certificate.bits,
    tlsVersion: tls.version,
    cipherSuite: tls.cipher,
    issues: issues,
    strengths: strengths,
    cryptoScore: calculateCryptoScore(issues, strengths)
  };
}

function analyzeSecurityHeaders(data) {
  const { headers } = data;
  const headerAnalysis = [];

  const requiredHeaders = {
    'strict-transport-security': { severity: 'HIGH', name: 'HSTS' },
    'content-security-policy': { severity: 'HIGH', name: 'CSP' },
    'x-frame-options': { severity: 'HIGH', name: 'Clickjacking Protection' },
    'x-content-type-options': { severity: 'MEDIUM', name: 'MIME Sniffing Protection' },
    'referrer-policy': { severity: 'MEDIUM', name: 'Referrer Policy' }
  };

  Object.entries(requiredHeaders).forEach(([headerName, config]) => {
    if (headers[headerName]) {
      headerAnalysis.push({
        header: headerName,
        name: config.name,
        status: 'PRESENT',
        value: headers[headerName],
        severity: 'GOOD'
      });
    } else {
      headerAnalysis.push({
        header: headerName,
        name: config.name,
        status: 'MISSING',
        severity: config.severity,
        recommendation: `Add ${headerName} header`
      });
    }
  });

  return {
    presentHeaders: headerAnalysis.filter(h => h.status === 'PRESENT').length,
    missingHeaders: headerAnalysis.filter(h => h.status === 'MISSING').length,
    analysis: headerAnalysis
  };
}

function analyzeQuantumReadiness(data) {
  const { certificate } = data;
  let readinessScore = 0;
  const recommendations = [];

  // TLS 1.3 support
  if (data.tls.version === 'TLSv1.3') {
    readinessScore += 25;
  } else {
    recommendations.push('Upgrade to TLS 1.3 for quantum resistance');
  }

  // Forward secrecy
  if (data.tls.cipher.includes('ECDHE') || data.tls.cipher.includes('DHE')) {
    readinessScore += 25;
  } else {
    recommendations.push('Enable perfect forward secrecy with ECDHE');
  }

  // ECDSA or EdDSA
  if (certificate.publicKeyAlgorithm === 'ECDSA' || certificate.publicKeyAlgorithm === 'EdDSA') {
    readinessScore += 20;
  } else {
    recommendations.push('Consider using ECDSA for quantum transitional security');
  }

  // Key size considerations
  if (certificate.bits >= 4096) {
    readinessScore += 15;
  }

  return {
    readinessScore: readinessScore,
    level: readinessScore >= 70 ? 'READY' : readinessScore >= 50 ? 'DEVELOPING' : 'NEEDS_WORK',
    recommendations: recommendations,
    estimatedQuantumBreakDate: calculateQuantumBreakDate(certificate)
  };
}

function analyzeThreatModel(data) {
  const { certificate, headers } = data;
  const threats = [];

  // Certificate expiration threat
  if (certificate.daysRemaining < 0) {
    threats.push({
      threatType: 'CERTIFICATE_EXPIRED',
      severity: 'CRITICAL',
      impact: 'Service unavailable, HTTPS connections fail',
      daysRemaining: certificate.daysRemaining
    });
  } else if (certificate.daysRemaining < 30) {
    threats.push({
      threatType: 'CERTIFICATE_EXPIRING_SOON',
      severity: 'HIGH',
      impact: 'Imminent service disruption',
      daysRemaining: certificate.daysRemaining
    });
  }

  // Weak key threat
  if (certificate.bits < 2048) {
    threats.push({
      threatType: 'WEAK_KEY_FACTORIZATION',
      severity: 'CRITICAL',
      impact: 'Private key could be compromised',
      bits: certificate.bits
    });
  }

  // MITM threat without HSTS
  if (!headers['strict-transport-security']) {
    threats.push({
      threatType: 'MITM_ATTACK_RISK',
      severity: 'HIGH',
      impact: 'Browser not enforced to use HTTPS',
      recommendation: 'Enable HSTS'
    });
  }

  // XSS threat without CSP
  if (!headers['content-security-policy']) {
    threats.push({
      threatType: 'XSS_INJECTION',
      severity: 'HIGH',
      impact: 'Cross-site scripting attacks not protected',
      recommendation: 'Implement Content-Security-Policy'
    });
  }

  return {
    threatCount: threats.length,
    threats: threats,
    threatLevel: threats.length > 3 ? 'CRITICAL' : threats.length > 1 ? 'HIGH' : 'MEDIUM'
  };
}

function calculateOverallRisk(analyses) {
  let score = 100;
  let criticalCount = 0;
  let highCount = 0;

  // Count OWASP findings
  if (analyses.owasp) {
    analyses.owasp.findings.forEach(f => {
      if (f.severity === 'CRITICAL') criticalCount++;
      if (f.severity === 'HIGH') highCount++;
    });
  }

  // Deduct points
  score -= criticalCount * 15;
  score -= highCount * 8;

  return {
    overallRiskScore: Math.max(0, Math.min(100, score)),
    riskLevel: getRiskLevel(score),
    criticalIssues: criticalCount,
    highIssues: highCount
  };
}

function generateComprehensiveRemediationPlan(scanResults) {
  const plan = {};

  // Critical priority
  const criticalActions = [];
  if (scanResults.analyses.cryptography?.issues?.some(i => i.severity === 'CRITICAL')) {
    criticalActions.push('Upgrade cryptographic implementations immediately');
  }
  if (scanResults.analyses.threats?.threats?.some(t => t.severity === 'CRITICAL')) {
    criticalActions.push('Address critical threats');
  }

  if (criticalActions.length > 0) {
    plan.immediate = {
      timeframe: 'IMMEDIATE (within 24 hours)',
      actions: criticalActions
    };
  }

  // High priority
  const highActions = [];
  if (scanResults.analyses.owasp?.findings?.some(f => f.severity === 'HIGH')) {
    highActions.push('Implement missing security controls');
  }
  if (scanResults.analyses.securityHeaders?.missingHeaders > 0) {
    highActions.push(`Add ${scanResults.analyses.securityHeaders.missingHeaders} missing security headers`);
  }

  if (highActions.length > 0) {
    plan.urgent = {
      timeframe: 'URGENT (within 1 week)',
      actions: highActions
    };
  }

  // Medium priority
  plan.scheduled = {
    timeframe: 'SCHEDULED (within 1 month)',
    actions: [
      'Update security policies and procedures',
      'Conduct security awareness training',
      'Review and update incident response plan'
    ]
  };

  return plan;
}

// Helper functions
function extractKeyAlgorithm(cert) {
  if (cert.modulus) return 'RSA';
  if (cert.publicKey?.includes('EC')) return 'ECDSA';
  if (cert.publicKey?.includes('ED25519')) return 'EdDSA';
  return 'unknown';
}

function extractChain(cert) {
  const chain = [];
  let current = cert;
  let depth = 0;
  while (current && depth < 5) {
    chain.push(current.subject?.CN || 'unknown');
    current = current.issuerCert;
    depth++;
  }
  return chain;
}

function scoreTLSVersion(version) {
  if (version === 'TLSv1.3') return { score: 100, severity: 'GOOD' };
  if (version === 'TLSv1.2') return { score: 70, severity: 'GOOD' };
  if (version === 'TLSv1.1') return { score: 30, severity: 'WEAK' };
  return { score: 0, severity: 'CRITICAL' };
}

function calculateCryptoScore(issues, strengths) {
  let score = 60;
  issues.forEach(issue => {
    if (issue.severity === 'CRITICAL') score -= 30;
    if (issue.severity === 'HIGH') score -= 15;
  });
  strengths.forEach(strength => {
    score += 15;
  });
  return Math.max(0, Math.min(100, score));
}

function calculateOWASPCompliance(findings) {
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  if (criticalCount > 0) return 'NON_COMPLIANT';
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  return highCount > 0 ? 'PARTIALLY_COMPLIANT' : 'COMPLIANT';
}

function calculateQuantumBreakDate(certificate) {
  if (certificate.publicKeyAlgorithm === 'RSA' && certificate.bits === 2048) {
    return new Date(Date.now() + 8 * 365 * 24 * 60 * 60 * 1000); // ~2034
  }
  return null;
}

function getRiskLevel(score) {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  return 'CRITICAL';
}
