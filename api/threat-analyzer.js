// Threat Analysis Engine - Real Certificate Analysis + Header Checks
export default async function handler(req, res) {
  const { host, certData, headers } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  try {
    // Performs custom threat scoring using real certificate data
    const threatAnalysis = performCustomThreatAnalysis(host, certData, headers);
    
    res.status(200).json({
      ok: true,
      host: host,
      threatAnalysis: threatAnalysis,
      timestamp: new Date().toISOString(),
      source: 'Internal Threat Intelligence Engine'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

function performCustomThreatAnalysis(host, certData, headers) {
  const threats = [];
  let overallRisk = 0;

  // === CERTIFICATE-BASED THREATS ===
  if (certData) {
    // Expired certificate
    if (certData.daysRemaining && certData.daysRemaining < 0) {
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
    if (certData.daysRemaining && certData.daysRemaining < 7 && certData.daysRemaining > 0) {
      threats.push({
        type: 'CERTIFICATE_EXPIRING_CRITICAL',
        severity: 'high',
        description: `Certificate expires in ${certData.daysRemaining} days`,
        impact: 'Service disruption imminent',
        recommendation: 'Renew certificate within 7 days'
      });
      overallRisk += 25;
    } else if (certData.daysRemaining && certData.daysRemaining < 30) {
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
    const keyBits = certData.keyBits || certData.bits || 2048;
    if (keyBits < 2048) {
      threats.push({
        type: 'WEAK_CRYPTOGRAPHY_CRITICAL',
        severity: 'critical',
        description: `${keyBits}-bit key is cryptographically weak`,
        impact: 'Private key could be compromised via factorization attacks',
        recommendation: 'Immediately upgrade to 2048-bit or higher key'
      });
      overallRisk += 35;
    } else if (keyBits === 2048) {
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
    const sigAlg = certData.signatureAlgorithm || 'unknown';
    if (sigAlg && 
        (sigAlg.toUpperCase().includes('SHA1') || 
         sigAlg.toUpperCase().includes('MD5'))) {
      threats.push({
        type: 'WEAK_SIGNATURE_ALGORITHM',
        severity: 'high',
        description: `Certificate uses ${sigAlg} (deprecated)`,
        impact: 'Collision attacks possible, browsers may reject certificate',
        recommendation: 'Renew certificate with SHA256 or higher'
      });
      overallRisk += 25;
    }
  }

  // === HEADER-BASED THREATS ===
  if (headers) {
    // Missing HSTS
    if (!headers['strict-transport-security']) {
      threats.push({
        type: 'MISSING_HSTS',
        severity: 'high',
        description: 'No HSTS header found',
        impact: 'Browser not forced to HTTPS - man-in-the-middle attack risk',
        recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'
      });
      overallRisk += 15;
    }

    // Missing CSP
    if (!headers['content-security-policy']) {
      threats.push({
        type: 'MISSING_CSP',
        severity: 'medium',
        description: 'No Content-Security-Policy header found',
        impact: 'XSS and injection attacks not mitigated',
        recommendation: 'Implement CSP policy'
      });
      overallRisk += 10;
    }

    // Missing X-Frame-Options
    if (!headers['x-frame-options']) {
      threats.push({
        type: 'MISSING_X_FRAME_OPTIONS',
        severity: 'medium',
        description: 'No X-Frame-Options header found',
        impact: 'Clickjacking attacks possible',
        recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN'
      });
      overallRisk += 8;
    }

    // Missing X-Content-Type-Options
    if (!headers['x-content-type-options']) {
      threats.push({
        type: 'MISSING_X_CONTENT_TYPE_OPTIONS',
        severity: 'low',
        description: 'No X-Content-Type-Options header',
        impact: 'MIME sniffing attacks possible',
        recommendation: 'Add X-Content-Type-Options: nosniff'
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
