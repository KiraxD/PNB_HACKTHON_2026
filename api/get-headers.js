// Vercel API route to fetch security headers from any domain (server-side, no CORS issues)
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://${host}`, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'QSecure-Radar/2.0 (Security Scanner; +https://qsecure-radar.vercel.app)'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeout);

    // Extract security headers from response
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
      const value = response.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    res.status(200).json({
      ok: true,
      host: host,
      statusCode: response.status,
      headers: headers,
      source: 'Direct HEAD Request',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}
