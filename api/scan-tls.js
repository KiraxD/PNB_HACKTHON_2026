// Comprehensive TLS/Certificate/Headers scanner via multiple data sources
import https from 'https';
import tls from 'tls';

export default async function handler(req, res) {
  const { host } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  // Validate host format (prevent SSRF)
  if (!/^[a-zA-Z0-9.-]+\.?[a-zA-Z0-9-]*$/.test(host)) {
    return res.status(400).json({ error: 'Invalid host format' });
  }

  try {
    // Parallel requests for certificate, headers, and SSL Labs grade
    const [certData, headersData, sslLabsData] = await Promise.allSettled([
      fetchCertificate(host),
      fetchHeadersAndCiphers(host),
      fetchSSLLabsGrade(host)
    ]);

    const result = {
      ok: true,
      host: host,
      certificate: certData.status === 'fulfilled' ? certData.value : null,
      headers: headersData.status === 'fulfilled' ? headersData.value.headers : {},
      ciphers: headersData.status === 'fulfilled' ? headersData.value.ciphers : [],
      tlsVersion: headersData.status === 'fulfilled' ? headersData.value.tlsVersion : null,
      sslLabsGrade: sslLabsData.status === 'fulfilled' ? sslLabsData.value : null,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

// Fetch actual TLS certificate by establishing connection
function fetchCertificate(host) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false, // Allow self-signed certs for analysis
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      if (res.socket && res.socket.getPeerCertificate) {
        const cert = res.socket.getPeerCertificate();
        resolve({
          subject: cert.subject || {},
          issuer: cert.issuer || {},
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          modulus: cert.modulus ? cert.modulus.substring(0, 50) + '...' : null,
          bits: cert.bits,
          publicKey: cert.publicKey ? cert.publicKey.substring(0, 50) + '...' : null,
          issuerCert: cert.issuerCert ? {
            subject: cert.issuerCert.subject,
            issuer: cert.issuerCert.issuer
          } : null
        });
      }
      res.destroy();
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Certificate fetch timeout'));
    });

    req.end();
  });
}

// Fetch headers and TLS version info
function fetchHeadersAndCiphers(host) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 10000,
      headers: {
        'User-Agent': 'QSecure-Radar/2.0 (Security Scanner)'
      }
    };

    const req = https.request(options, (res) => {
      const headers = {};
      const securityHeaders = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'x-xss-protection',
        'permissions-policy',
        'server',
        'x-powered-by'
      ];

      securityHeaders.forEach(header => {
        if (res.headers[header]) {
          headers[header] = res.headers[header];
        }
      });

      // Extract TLS info from socket
      const tlsVersion = res.socket.getProtocol ? res.socket.getProtocol() : null;
      const cipher = res.socket.getCipher ? res.socket.getCipher() : null;

      resolve({
        headers: headers,
        tlsVersion: tlsVersion,
        cipher: cipher ? {
          name: cipher.name,
          version: cipher.version,
          standardName: cipher.standardName,
          bits: cipher.bits
        } : null,
        ciphers: [] // Will be populated if we re-connect for cipher enumeration
      });

      res.destroy();
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Headers/Ciphers fetch timeout'));
    });

    req.end();
  });
}

// Fetch SSL Labs grade (optional, rate-limited)
function fetchSSLLabsGrade(host) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.ssllabs.com',
      port: 443,
      path: `/api/v3/analyze?host=${encodeURIComponent(host)}&publish=off&all=done`,
      method: 'GET',
      timeout: 30000
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            grade: parsed.grade,
            score: parsed.score,
            endpoints: parsed.endpoints ? parsed.endpoints.map(e => ({
              ipAddress: e.ipAddress,
              grade: e.grade,
              serverName: e.serverName
            })) : []
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).setTimeout(30000, function() {
      this.destroy();
      reject(new Error('SSL Labs timeout'));
    }).end();
  });
}
