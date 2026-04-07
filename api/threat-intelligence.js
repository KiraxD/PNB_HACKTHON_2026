// Security Threat Intelligence - Reputation, Malware, Phishing detection
export default async function handler(req, res) {
  const { host } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  // Validate host format
  if (!/^[a-zA-Z0-9.-]+\.?[a-zA-Z0-9-]*$/.test(host)) {
    return res.status(400).json({ error: 'Invalid host format' });
  }

  try {
    // Parallel threat intelligence checks
    const [abuseReport, urlhaus, virusTotal] = await Promise.allSettled([
      checkAbuse(host),
      checkURLhaus(host),
      checkVirusTotal(host)
    ]);

    res.status(200).json({
      ok: true,
      host: host,
      abuse: abuseReport.status === 'fulfilled' ? abuseReport.value : null,
      urlhaus: urlhaus.status === 'fulfilled' ? urlhaus.value : null,
      virusTotal: virusTotal.status === 'fulfilled' ? virusTotal.value : null,
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

async function checkAbuse(host) {
  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/domain/check`, {
      method: 'POST',
      headers: {
        'Key': process.env.ABUSEIPDB_API_KEY || '',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ domain: host }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function checkURLhaus(host) {
  try {
    const response = await fetch(`https://urlhaus-api.abuse.ch/v1/host/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `host=${encodeURIComponent(host)}`,
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        malicious_urls: data.query_status === 'ok' ? (data.urls ? data.urls.length : 0) : 0,
        status: data.query_status
      };
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function checkVirusTotal(host) {
  try {
    // VirusTotal free API check (limited, requires API key for full results)
    const response = await fetch(`https://www.virustotal.com/api/v3/domains/${host}`, {
      method: 'GET',
      headers: {
        'x-apikey': process.env.VIRUSTOTAL_API_KEY || ''
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        reputation: data.data?.attributes?.reputation || 0,
        last_analysis_stats: data.data?.attributes?.last_analysis_stats || null
      };
    }
  } catch (error) {
    return { error: error.message };
  }
}
