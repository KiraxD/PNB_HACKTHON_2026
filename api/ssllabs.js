module.exports = async function handler(req, res) {
  // Allow CORS if accessed from outside (though usually same-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { host, startNew } = req.query;
  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  const sNew = startNew === 'on' ? 'on' : 'off';
  const sslLabsUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&publish=off&all=done&ignoreMismatch=on&startNew=${sNew}`;

  try {
    const response = await fetch(sslLabsUrl);
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(200).json(data);
    } else {
      const text = await response.text();
      return res.status(502).json({ error: "SSL Labs API returned non-JSON", details: text });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
