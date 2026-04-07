// Advanced Cryptographic Threat Analysis - No External APIs
import https from 'https';
import crypto from 'crypto';

// Internal threat knowledge base
const WEAK_ALGORITHMS = {
  RSA: { 1024: 'critical', 2048: 'high', 4096: 'low', 8192: 'minimal' },
  ECDSA: { 256: 'high', 384: 'low', 521: 'minimal' },
  'RSA-PSS': { 1024: 'critical', 2048: 'high', 4096: 'low' },
  DSA: { 1024: 'critical', 2048: 'high' }
};

const WEAK_SIGNATURE_ALGS = {
  'SHA1': 'critical',
  'MD5': 'critical',
  'MD4': 'critical',
  'SHA224': 'medium',
  'SHA256': 'low',
  'SHA384': 'minimal',
  'SHA512': 'minimal'
};

const STRONG_CIPHERS = {
  'TLS_AES_256_GCM_SHA384': 'excellent',
  'TLS_AES_128_GCM_SHA256': 'good',
  'TLS_CHACHA20_POLY1305_SHA256': 'excellent',
  'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384': 'good',
  'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384': 'good'
};

const WEAK_CIPHERS = {
  'TLS_RSA_WITH_AES_256_CBC_SHA256': 'weak', // No forward secrecy
  'TLS_RSA_WITH_AES_128_CBC_SHA256': 'weak',
  'TLS_RSA_WITH_3DES_EDE_CBC_SHA': 'critical',
  'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA': 'medium',
  'TLS_DHE_RSA_WITH_AES_128_CBC_SHA': 'low'
};

const ALGORITHM_SUNSET = {
  'RSA-2048': 2030,
  'RSA-1024': 2013, // Already deprecated
  'ECDSA-256': 2033,
  'SHA-1': 2017, // Already deprecated
  'TLS 1.2': 2031
};

export default async function handler(req, res) {
  const { host } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  if (!/^[a-zA-Z0-9.-]+\.?[a-zA-Z0-9-]*$/.test(host)) {
    return res.status(400).json({ error: 'Invalid host format' });
  }

  try {
    // Perform comprehensive local cryptographic analysis
    const certData = await fetchAndAnalyzeCertificate(host);
    const threatScore = calculateThreatScore(certData);
    const pqcAssessment = assessPQCReadiness(certData);
    const riskTimeline = generateQuantumRiskTimeline(certData);

    res.status(200).json({
      ok: true,
      host: host,
      certificate: certData,
      threatScore: threatScore,
      pqcAssessment: pqcAssessment,
      quantumRiskTimeline: riskTimeline,
      timestamp: new Date().toISOString(),
      source: 'Internal Cryptographic Analyzer v2.0'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

async function fetchAndAnalyzeCertificate(host) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      rejectUnauthorized: false,
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      if (!res.socket) {
        reject(new Error('No socket available'));
        return;
      }

      const cert = res.socket.getPeerCertificate();
      const tlsVersion = res.socket.getProtocol();
      const cipher = res.socket.getCipher();

      // Deep cryptographic analysis
      const analysis = {
        // Certificate details
        subject: cert.subject || {},
        issuer: cert.issuer || {},
        valid_from: new Date(cert.valid_from),
        valid_to: new Date(cert.valid_to),
        fingerprint: cert.fingerprint,
        serialNumber: cert.serialNumber,
        
        // Key analysis
        bits: cert.bits || 2048,
        publicKeyAlgorithm: extractKeyAlgorithm(cert),
        keyStrength: analyzeKeyStrength(cert),
        
        // Signature analysis
        signatureAlgorithm: cert.signatureAlgorithm || 'unknown',
        signatureWeakness: analyzeSignatureAlgorithm(cert.signatureAlgorithm),
        
        // Certificate validity
        daysValid: Math.floor((new Date(cert.valid_to) - new Date(cert.valid_from)) / (1000 * 60 * 60 * 24)),
        daysRemaining: Math.floor((new Date(cert.valid_to) - Date.now()) / (1000 * 60 * 60 * 24)),
        isExpired: new Date(cert.valid_to) < Date.now(),
        
        // TLS negotiation
        tlsVersion: tlsVersion || 'unknown',
        tlsVersionScore: scoreTLSVersion(tlsVersion),
        
        // Cipher suite
        cipherSuite: cipher ? cipher.name : 'unknown',
        cipherStrength: cipher ? cipher.bits : 0,
        cipherScore: analyzeCipherSuite(cipher ? cipher.name : 'unknown'),
        forwardSecrecy: hasForwardSecrecy(cipher ? cipher.name : ''),
        
        // ALPN and extensions
        alpn: extractALPN(res),
        
        // Chain
        issuerChain: extractChain(cert),
        chainDepth: measureChainDepth(cert)
      };

      res.destroy();
      resolve(analysis);
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Certificate fetch timeout'));
    });
    req.end();
  });
}

function extractKeyAlgorithm(cert) {
  if (cert.modulus) return 'RSA';
  if (cert.publicKey && cert.publicKey.includes('EC')) return 'ECDSA';
  if (cert.publicKey && cert.publicKey.includes('ED25519')) return 'EdDSA';
  return 'unknown';
}

function analyzeKeyStrength(cert) {
  const bits = cert.bits || 2048;
  const alg = extractKeyAlgorithm(cert);
  
  if (alg === 'RSA') {
    if (bits < 1024) return { rating: 'critical', recommendation: 'Upgrade immediately' };
    if (bits === 1024) return { rating: 'critical', recommendation: 'Upgrade to 2048+ immediately' };
    if (bits === 2048) return { rating: 'medium', recommendation: 'Upgrade to 4096 for long-term safety' };
    if (bits === 4096) return { rating: 'strong', recommendation: 'Good for next 10 years' };
    if (bits >= 8192) return { rating: 'excellent', recommendation: 'Optimal strength' };
  }
  
  if (alg === 'ECDSA') {
    if (bits === 256) return { rating: 'medium', recommendation: 'Upgrade to 384 or 521' };
    if (bits === 384) return { rating: 'strong', recommendation: 'Strong elliptic curve' };
    if (bits >= 521) return { rating: 'excellent', recommendation: 'Excellent security' };
  }
  
  return { rating: 'unknown', recommendation: 'Unable to assess' };
}

function analyzeSignatureAlgorithm(sigAlg) {
  if (!sigAlg) return { rating: 'unknown' };
  
  const alg = sigAlg.toUpperCase();
  for (const [weakAlg, severity] of Object.entries(WEAK_SIGNATURE_ALGS)) {
    if (alg.includes(weakAlg)) {
      return { rating: severity, algorithm: alg };
    }
  }
  
  return { rating: 'strong', algorithm: alg };
}

function scoreTLSVersion(tlsVersion) {
  if (!tlsVersion) return { score: 0, rating: 'unknown' };
  
  if (tlsVersion.includes('1.3')) return { score: 100, rating: 'excellent' };
  if (tlsVersion.includes('1.2')) return { score: 70, rating: 'good' };
  if (tlsVersion.includes('1.1')) return { score: 30, rating: 'weak' };
  if (tlsVersion.includes('1.0')) return { score: 10, rating: 'critical' };
  
  return { score: 0, rating: 'unknown' };
}

function analyzeCipherSuite(cipherName) {
  if (!cipherName) return { score: 0, rating: 'unknown' };
  
  // Check strong ciphers first
  for (const [strongCipher, rating] of Object.entries(STRONG_CIPHERS)) {
    if (cipherName.includes(strongCipher)) {
      return { score: 90, rating: rating };
    }
  }
  
  // Check weak ciphers
  for (const [weakCipher, rating] of Object.entries(WEAK_CIPHERS)) {
    if (cipherName.includes(weakCipher)) {
      return { score: 30, rating: rating };
    }
  }
  
  // Default scoring
  if (cipherName.includes('AES') && cipherName.includes('GCM')) return { score: 85, rating: 'strong' };
  if (cipherName.includes('ChaCha')) return { score: 85, rating: 'strong' };
  if (cipherName.includes('CBC')) return { score: 50, rating: 'medium' };
  if (cipherName.includes('RSA') && !cipherName.includes('ECDHE')) return { score: 20, rating: 'critical' };
  
  return { score: 50, rating: 'unknown' };
}

function hasForwardSecrecy(cipherName) {
  if (!cipherName) return false;
  return cipherName.includes('ECDHE') || cipherName.includes('DHE') || cipherName.includes('TLS_AES');
}

function extractALPN(res) {
  try {
    return res.socket.getALPNProtocol ? res.socket.getALPNProtocol() : null;
  } catch {
    return null;
  }
}

function extractChain(cert) {
  const chain = [];
  let current = cert;
  let depth = 0;
  
  while (current && depth < 5) {
    chain.push({
      cn: current.subject ? current.subject.CN : 'unknown',
      issuer: current.issuer ? current.issuer.CN : 'unknown'
    });
    current = current.issuerCert;
    depth++;
  }
  
  return chain;
}

function measureChainDepth(cert) {
  let depth = 0;
  let current = cert;
  
  while (current && depth < 10) {
    current = current.issuerCert;
    depth++;
  }
  
  return depth;
}

function calculateThreatScore(certData) {
  let score = 100; // Start perfect
  
  // Deduct for key weakness
  if (certData.keyStrength.rating === 'critical') score -= 40;
  else if (certData.keyStrength.rating === 'medium') score -= 15;
  else if (certData.keyStrength.rating === 'weak') score -= 25;
  
  // Deduct for weak signature algorithm
  if (certData.signatureWeakness.rating === 'critical') score -= 35;
  else if (certData.signatureWeakness.rating === 'high') score -= 20;
  else if (certData.signatureWeakness.rating === 'medium') score -= 10;
  
  // Deduct for TLS version
  const tlsScore = certData.tlsVersionScore.score;
  if (tlsScore < 50) score -= (50 - tlsScore) / 2;
  
  // Deduct for weak cipher
  if (certData.cipherScore.score < 50) score -= (50 - certData.cipherScore.score) / 2;
  
  // Deduct if no forward secrecy
  if (!certData.forwardSecrecy) score -= 20;
  
  // Deduct if expired
  if (certData.isExpired) score -= 50;
  
  // Deduct if expires soon
  if (certData.daysRemaining < 30) score -= 15;
  if (certData.daysRemaining < 7) score -= 25;
  
  return Math.max(0, Math.round(score));
}

function assessPQCReadiness(certData) {
  const assessment = {
    quantumVulnerable: true,
    readinessScore: 0,
    migrations: []
  };
  
  // Check for post-quantum safe algorithms (placeholder - not widely deployed yet)
  if (certData.bits >= 4096 && certData.publicKeyAlgorithm === 'RSA') {
    assessment.readinessScore += 30;
    assessment.migrations.push({ task: 'TLS 1.3 migration', status: 'check' });
  }
  
  if (certData.tlsVersion.includes('1.3')) {
    assessment.readinessScore += 25;
  }
  
  if (certData.forwardSecrecy) {
    assessment.readinessScore += 25;
  }
  
  // Check for ECDSA (slightly better for PQC transition)
  if (certData.publicKeyAlgorithm === 'ECDSA' && certData.bits >= 384) {
    assessment.readinessScore += 10;
  }
  
  // Required migrations for PQC
  assessment.migrations.push({
    task: 'Deploy CRYSTALS-Kyber (ML-KEM) hybrid ciphers',
    effort: 'high',
    priority: 'critical'
  });
  
  if (certData.bits < 4096) {
    assessment.migrations.push({
      task: `Upgrade key from ${certData.bits}-bit to 4096-bit`,
      effort: 'medium',
      priority: 'high'
    });
  }
  
  if (!certData.tlsVersion.includes('1.3')) {
    assessment.migrations.push({
      task: 'Enable TLS 1.3 minimum',
      effort: 'low',
      priority: 'high'
    });
  }
  
  return assessment;
}

function generateQuantumRiskTimeline(certData) {
  const timeline = {
    currentQubitCount: 2000,
    estimatedBitStrength: 0,
    yearsUntilBreak: 0,
    breakDate: null,
    riskLevel: 'low'
  };
  
  // Simplified quantum threat model
  // RSA-2048 requires ~4096 qubits
  // ECDSA-256 requires ~2330 qubits
  
  if (certData.publicKeyAlgorithm === 'RSA') {
    timeline.estimatedBitStrength = certData.bits;
    if (certData.bits === 2048) {
      timeline.yearsUntilBreak = 8; // 2034
      timeline.riskLevel = 'high';
    } else if (certData.bits === 4096) {
      timeline.yearsUntilBreak = 12;
      timeline.riskLevel = 'medium';
    }
  } else if (certData.publicKeyAlgorithm === 'ECDSA') {
    timeline.estimatedBitStrength = certData.bits;
    if (certData.bits === 256) {
      timeline.yearsUntilBreak = 10; // 2036
      timeline.riskLevel = 'high';
    } else if (certData.bits === 384) {
      timeline.yearsUntilBreak = 15;
      timeline.riskLevel = 'low';
    }
  }
  
  timeline.breakDate = new Date(Date.now() + timeline.yearsUntilBreak * 365 * 24 * 60 * 60 * 1000);
  
  return timeline;
}
