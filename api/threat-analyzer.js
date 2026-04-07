// Internal Custom Threat Intelligence Engine
// Builds malware/phishing/misconfiguration detection from certificate and DNS analysis

export default async function handler(req, res) {
  const { host, certData, dnsData } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  try {
    // Performs custom threat scoring without external APIs
    const threatAnalysis = performCustomThreatAnalysis(host, certData, dnsData);
    
    res.status(200).json({
      ok: true,
      host: host,
      threatAnalysis: threatAnalysis,
      timestamp: new Date().toISOString(),
      source: 'Internal Threat Intelligence Engine v1.0'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

function performCustomThreatAnalysis(host, certData, dnsData) {
  const threats = [];
  let overallRisk = 0;

  // === CERTIFICATE-BASED THREATS ===
  if (certData) {
    // Expired certificate
    if (certData.daysRemaining < 0) {
      threats.push({
        type: 'CERTIFICATE_EXPIRED',
        severity: 'critical',
        description: `Certificate expired ${Math.abs(certData.daysRemaining)} days ago`,
        impact: 'https connection will fail; potential sign of misconfiguration or abandonment',
        recommendation: 'Renew certificate immediately'
      });
      overallRisk += 40;
    }

    // Certificate expiring soon
    if (certData.daysRemaining < 7 && certData.daysRemaining > 0) {
      threats.push({
        type: 'CERTIFICATE_EXPIRING_CRITICAL',
        severity: 'high',
        description: `Certificate expires in ${certData.daysRemaining} days`,
        impact: 'Service disruption imminent',
        recommendation: 'Renew certificate within 7 days'
      });
      overallRisk += 25;
    } else if (certData.daysRemaining < 30) {
      threats.push({
        type: 'CERTIFICATE_EXPIRING_WARNING',
        severity: 'medium',
        description: `Certificate expires in ${certData.daysRemaining} days`,
        impact: 'Plan renewal soon to avoid disruption',
        recommendation: 'Schedule certificate renewal'
      });
      overallRisk += 10;
    }

    // Weak key
    if (certData.bits < 2048) {
      threats.push({
        type: 'WEAK_CRYPTOGRAPHY_CRITICAL',
        severity: 'critical',
        description: `${certData.bits}-bit key is cryptographically weak`,
        impact: 'Private key could be compromised via factorization attacks',
        recommendation: 'Immediately upgrade to 2048-bit or higher key'
      });
      overallRisk += 35;
    } else if (certData.bits === 2048) {
      threats.push({
        type: 'WEAK_CRYPTOGRAPHY_WARNING',
        severity: 'high',
        description: '2048-bit RSA key approaching sunset (2030)',
        impact: 'Vulnerable to future quantum computing attacks',
        recommendation: 'Plan migration to 4096-bit RSA or equivalent'
      });
      overallRisk += 20;
    }

    // Weak signature algorithm
    if (certData.signAlgorithm && 
        (certData.signAlgorithm.includes('SHA1') || 
         certData.signAlgorithm.includes('MD5'))) {
      threats.push({
        type: 'WEAK_SIGNATURE_ALGORITHM',
        severity: 'high',
        description: `Certificate uses ${certData.signAlgorithm} (deprecated)`,
        impact: 'Collision attacks possible, browsers may reject certificate',
        recommendation: 'Renew certificate with SHA256 or higher'
      });
      overallRisk += 25;
    }

    // Missing TLS 1.3
    if (!certData.tlsVersion.includes('1.3')) {
      threats.push({
        type: 'OUTDATED_TLS_VERSION',
        severity: 'medium',
        description: `Server uses ${certData.tlsVersion} instead of TLS 1.3`,
        impact: 'Slower connections, potential downgrade attacks',
        recommendation: 'Configure server to support TLS 1.3'
      });
      overallRisk += 15;
    }

    // No forward secrecy
    if (!certData.forwardSecrecy) {
      threats.push({
        type: 'NO_FORWARD_SECRECY',
        severity: 'high',
        description: 'Cipher suite lacks Perfect Forward Secrecy (PFS)',
        impact: 'If private key is compromised, all historical sessions can be decrypted',
        recommendation: 'Use ECDHE or DHE ciphers exclusively'
      });
      overallRisk += 20;
    }
  }

  // === DNS-BASED THREATS ===
  if (dnsData) {
    // Missing SPF
    if (!dnsData.email_security?.spf_present) {
      threats.push({
        type: 'MISSING_SPF_RECORD',
        severity: 'high',
        description: 'No SPF record found',
        impact: 'Domain vulnerable to email spoofing attacks',
        recommendation: 'Add SPF record with hard fail policy (v=spf1 ... -all)'
      });
      overallRisk += 20;
    } else if (dnsData.email_security?.spf_policy?.strength === 'weak') {
      threats.push({
        type: 'WEAK_SPF_POLICY',
        severity: 'medium',
        description: 'SPF policy uses soft fail or no fail',
        impact: 'Spoofed emails from your domain may still be delivered',
        recommendation: 'Change to hard fail (-all) policy'
      });
      overallRisk += 12;
    }

    // Missing DMARC
    if (!dnsData.email_security?.dmarc_present) {
      threats.push({
        type: 'MISSING_DMARC_POLICY',
        severity: 'high',
        description: 'No DMARC policy found',
        impact: 'No mechanism to prevent domain spoofing or report breaches',
        recommendation: 'Implement DMARC policy (start with p=none for monitoring)'
      });
      overallRisk += 20;
    } else if (dnsData.email_security?.dmarc_policy?.strength === 'weak') {
      threats.push({
        type: 'WEAK_DMARC_POLICY',
        severity: 'medium',
        description: 'DMARC policy is in monitoring-only mode (p=none)',
        impact: 'Non-compliant emails are not rejected',
        recommendation: 'Upgrade to p=quarantine or p=reject after testing'
      });
      overallRisk += 15;
    }

    // Missing DKIM
    if (!dnsData.email_security?.dkim_present) {
      threats.push({
        type: 'MISSING_DKIM_SIGNATURES',
        severity: 'medium',
        description: 'No DKIM records found',
        impact: 'Emails cannot be cryptographically signed and verified',
        recommendation: 'Generate and publish DKIM public keys for email servers'
      });
      overallRisk += 10;
    }

    // Missing CAA
    if (!dnsData.caa_records || dnsData.caa_records.length === 0) {
      threats.push({
        type: 'MISSING_CAA_RECORDS',
        severity: 'low',
        description: 'No CAA records restricting certificate issuance',
        impact: 'Any CA can issue certificates for your domain',
        recommendation: 'Add CAA records to whitelist authorized CAs only'
      });
      overallRisk += 8;
    }
  }

  // === KNOWN PATTERNS ===
  // Check for common misconfigurations
  const hostLower = host.toLowerCase();
  
  // Suspicious domain patterns
  if (hostLower.includes('test') || hostLower.includes('dev') || hostLower.includes('staging')) {
    if (!dnsData?.txt_records?.some(r => r.includes('v=spf1'))) {
      threats.push({
        type: 'TEST_DOMAIN_NO_SEC',
        severity: 'low',
        description: 'Test/dev domain lacks email security records',
        impact: 'Test infrastructure could act as launching point for phishing',
        recommendation: 'Add SPF/DMARC even to test domains'
      });
      overallRisk += 5;
    }
  }

  // Calculate final risk score (0-100)
  const riskScore = Math.min(100, overallRisk);

  return {
    riskScore: riskScore,
    riskLevel: getRiskLevel(riskScore),
    threatCount: threats.length,
    threats: threats,
    recommendations: generateActionPlan(threats)
  };
}

function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'MINIMAL';
}

function generateActionPlan(threats) {
  const critical = threats.filter(t => t.severity === 'critical');
  const high = threats.filter(t => t.severity === 'high');
  const medium = threats.filter(t => t.severity === 'medium');

  const actions = [];

  if (critical.length > 0) {
    actions.push({
      priority: 1,
      timeframe: 'IMMEDIATE (within 24 hours)',
      tasks: critical.map(t => t.recommendation)
    });
  }

  if (high.length > 0) {
    actions.push({
      priority: 2,
      timeframe: 'URGENT (within 1 week)',
      tasks: high.map(t => t.recommendation)
    });
  }

  if (medium.length > 0) {
    actions.push({
      priority: 3,
      timeframe: 'IMPORTANT (within 1 month)',
      tasks: medium.map(t => t.recommendation)
    });
  }

  return actions;
}
