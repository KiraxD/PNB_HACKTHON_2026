// Pure Internal TLS Scanner - No External APIs
import https from 'https';

export default async function handler(req, res) {
  const { host } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  if (!/^[a-zA-Z0-9.-]+\.?[a-zA-Z0-9-]*$/.test(host)) {
    return res.status(400).json({ error: 'Invalid host format' });
  }

  try {
    // Perform TLS connection and analyze certificate + ciphers
    const tlsData = await performTLSHandshake(host);

    res.status(200).json({
      ok: true,
      host: host,
      certificate: tlsData.certificate,
      tlsVersion: tlsData.tlsVersion,
      cipher: tlsData.cipher,
      cipherAnalysis: analyzeCipherSuite(tlsData.cipher),
      headers: tlsData.headers,
      timestamp: new Date().toISOString(),
      source: 'Internal TLS Scanner v2.0 (No External APIs)'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

async function performTLSHandshake(host) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      rejectUnauthorized: false,
      timeout: 10000,
      headers: {
        'User-Agent': 'QSecure-Radar/2.0'
      }
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      const tlsVersion = res.socket.getProtocol();
      const cipher = res.socket.getCipher();

      // Extract security headers
      const headers = {};
      const securityHeaders = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'x-xss-protection',
        'permissions-policy'
      ];

      securityHeaders.forEach(header => {
        if (res.headers[header]) {
          headers[header] = res.headers[header];
        }
      });

      resolve({
        certificate: {
          subject: cert.subject || {},
          issuer: cert.issuer || {},
          valid_from: new Date(cert.valid_from),
          valid_to: new Date(cert.valid_to),
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          bits: cert.bits || 2048,
          modulus: cert.modulus ? cert.modulus.substring(0, 50) + '...' : null
        },
        tlsVersion: tlsVersion || 'unknown',
        cipher: cipher ? {
          name: cipher.name,
          version: cipher.version,
          bits: cipher.bits
        } : null,
        headers: headers
      });

      res.destroy();
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('TLS handshake timeout'));
    });

    req.end();
  });
}

// INTERNAL Cipher Suite Database (Internal Analysis - No SSL Labs)
const CIPHER_DATABASE = {
  // TLS 1.3 ciphers (AEAD based, all with PFS)
  'TLS_AES_256_GCM_SHA384': {
    version: '1.3',
    strength: 256,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'AES-256-GCM',
    forwardSecrecy: true,
    rating: 'excellent',
    quantum_vulnerable: true,
    deprecated: false
  },
  'TLS_AES_128_GCM_SHA256': {
    version: '1.3',
    strength: 128,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'AES-128-GCM',
    forwardSecrecy: true,
    rating: 'good',
    quantum_vulnerable: true,
    deprecated: false
  },
  'TLS_CHACHA20_POLY1305_SHA256': {
    version: '1.3',
    strength: 256,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'ChaCha20-Poly1305',
    forwardSecrecy: true,
    rating: 'excellent',
    quantum_vulnerable: true,
    deprecated: false
  },
  // TLS 1.2 with ECDHE
  'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384': {
    version: '1.2',
    strength: 256,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'AES-256-GCM',
    forwardSecrecy: true,
    rating: 'good',
    quantum_vulnerable: true,
    deprecated: false
  },
  'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384': {
    version: '1.2',
    strength: 256,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'AES-256-GCM',
    forwardSecrecy: true,
    rating: 'good',
    quantum_vulnerable: true,
    deprecated: false
  },
  'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256': {
    version: '1.2',
    strength: 128,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'AES-128-GCM',
    forwardSecrecy: true,
    rating: 'good',
    quantum_vulnerable: true,
    deprecated: false
  },
  'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256': {
    version: '1.2',
    strength: 128,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'AES-128-GCM',
    forwardSecrecy: true,
    rating: 'good',
    quantum_vulnerable: true,
    deprecated: false
  },
  // TLS 1.2 with DHE
  'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384': {
    version: '1.2',
    strength: 256,
    type: 'AEAD',
    keyExchange: 'DHE',
    encryption: 'AES-256-GCM',
    forwardSecrecy: true,
    rating: 'good',
    quantum_vulnerable: true,
    deprecated: false
  },
  // TLS 1.2 with RSA (no PFS - weak)
  'TLS_RSA_WITH_AES_256_GCM_SHA384': {
    version: '1.2',
    strength: 256,
    type: 'AEAD',
    keyExchange: 'RSA',
    encryption: 'AES-256-GCM',
    forwardSecrecy: false,
    rating: 'weak',
    quantum_vulnerable: true,
    deprecated: false,
    note: 'No forward secrecy - critically weak'
  },
  'TLS_RSA_WITH_AES_128_GCM_SHA256': {
    version: '1.2',
    strength: 128,
    type: 'AEAD',
    keyExchange: 'RSA',
    encryption: 'AES-128-GCM',
    forwardSecrecy: false,
    rating: 'weak',
    quantum_vulnerable: true,
    deprecated: false,
    note: 'No forward secrecy - critically weak'
  },
  // TLS 1.2 CBC-based
  'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA': {
    version: '1.2',
    strength: 256,
    type: 'CBC',
    keyExchange: 'ECDHE',
    encryption: 'AES-256-CBC',
    forwardSecrecy: true,
    rating: 'medium',
    quantum_vulnerable: true,
    deprecated: false,
    note: 'SHA1 MAC deprecated'
  },
  'TLS_RSA_WITH_AES_256_CBC_SHA': {
    version: '1.2',
    strength: 256,
    type: 'CBC',
    keyExchange: 'RSA',
    encryption: 'AES-256-CBC',
    forwardSecrecy: false,
    rating: 'weak',
    quantum_vulnerable: true,
    deprecated: false,
    note: 'No PFS, SHA1 deprecated'
  },
  // Legacy
  'TLS_RSA_WITH_3DES_EDE_CBC_SHA': {
    version: '1.2',
    strength: 112,
    type: 'CBC',
    keyExchange: 'RSA',
    encryption: '3DES',
    forwardSecrecy: false,
    rating: 'critical',
    quantum_vulnerable: true,
    deprecated: true,
    note: '3DES and SHA1 both deprecated'
  },
  // ChaCha20
  'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256': {
    version: '1.2',
    strength: 256,
    type: 'AEAD',
    keyExchange: 'ECDHE',
    encryption: 'ChaCha20-Poly1305',
    forwardSecrecy: true,
    rating: 'excellent',
    quantum_vulnerable: true,
    deprecated: false
  }
};

function analyzeCipherSuite(cipher) {
  if (!cipher || !cipher.name) {
    return {
      name: 'unknown',
      analysis: 'Unable to determine cipher suite',
      rating: 'unknown',
      recommendations: ['Unable to analyze']
    };
  }

  const cipherName = cipher.name;
  const dbEntry = CIPHER_DATABASE[cipherName];

  if (dbEntry) {
    return {
      name: cipherName,
      ...dbEntry,
      recommendations: generateCipherRecommendations(dbEntry)
    };
  }

  // Fallback analysis for unknown ciphers
  return {
    name: cipherName,
    analysis: 'Cipher not in database',
    rating: 'unknown',
    recommendations: ['Verify cipher security with documentation']
  };
}

function generateCipherRecommendations(cipher) {
  const recommendations = [];

  if (cipher.deprecated) {
    recommendations.push('🚨 CRITICAL: Disable this deprecated cipher immediately');
  }

  if (!cipher.forwardSecrecy) {
    recommendations.push('⚠️ HIGH: No Perfect Forward Secrecy - upgrade to ECDHE/DHE');
  }

  if (cipher.quantum_vulnerable) {
    recommendations.push('⚠️ Medium: Vulnerable to quantum attacks - plan PQC migration');
  }

  if (cipher.strength < 128) {
    recommendations.push('🚨 CRITICAL: Key strength < 128 bits - replace with stronger cipher');
  } else if (cipher.strength < 256) {
    recommendations.push('⚠️ Medium: Consider upgrading to 256-bit cipher');
  } else {
    recommendations.push('✓ Good: Key strength is 256 bits');
  }

  if (cipher.rating === 'excellent') {
    recommendations.push('✓ Excellent: This is a recommended modern cipher suite');
  } else if (cipher.rating === 'critical') {
    recommendations.push('🚨 CRITICAL: Remove this cipher suite immediately');
  }

  if (cipher.note) {
    recommendations.push(`Note: ${cipher.note}`);
  }

  return recommendations;
}
