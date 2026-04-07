// DNS Security Intelligence - DNSSEC, SPF, DMARC, CAA records
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
    // Fetch DNS records via public DNS APIs (Cloudflare, Google)
    const dnsRecords = await fetchDNSRecords(host);
    
    res.status(200).json({
      ok: true,
      host: host,
      dnssec: dnsRecords.dnssec,
      spf: dnsRecords.spf,
      dmarc: dnsRecords.dmarc,
      dkim: dnsRecords.dkim,
      caa: dnsRecords.caa,
      mx: dnsRecords.mx,
      ns: dnsRecords.ns,
      mxSecurityScore: calculateMXScore(dnsRecords),
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

async function fetchDNSRecords(host) {
  const result = {
    dnssec: null,
    spf: null,
    dmarc: null,
    dkim: null,
    caa: [],
    mx: [],
    ns: [],
    txt: []
  };

  try {
    // Cloudflare DoH API
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=`;
    
    // Fetch TXT records (SPF, DMARC, DKIM)
    const txtResponse = await fetch(dohUrl + 'TXT', {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (txtResponse.ok) {
      const txtData = await txtResponse.json();
      if (txtData.Answer) {
        result.txt = txtData.Answer.filter(a => a.type === 16).map(a => a.data).join(' ');
        
        // Parse SPF
        if (result.txt.includes('v=spf1')) {
          result.spf = result.txt;
        }
        
        // Parse DMARC
        if (result.txt.includes('v=DMARC1')) {
          result.dmarc = result.txt;
        }
      }
    }
    
    // Fetch DMARC policy (at _dmarc subdomain)
    const dmarcUrl = `https://cloudflare-dns.com/dns-query?name=_dmarc.${encodeURIComponent(host)}&type=TXT`;
    const dmarcResponse = await fetch(dmarcUrl, {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (dmarcResponse.ok) {
      const dmarcData = await dmarcResponse.json();
      if (dmarcData.Answer) {
        result.dmarc = dmarcData.Answer.map(a => a.data).join(' ');
      }
    }
    
    // Fetch CAA records
    const caaUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=CAA`;
    const caaResponse = await fetch(caaUrl, {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (caaResponse.ok) {
      const caaData = await caaResponse.json();
      if (caaData.Answer) {
        result.caa = caaData.Answer.filter(a => a.type === 257).map(a => a.data);
      }
    }
    
    // Fetch MX records
    const mxUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=MX`;
    const mxResponse = await fetch(mxUrl, {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (mxResponse.ok) {
      const mxData = await mxResponse.json();
      if (mxData.Answer) {
        result.mx = mxData.Answer.filter(a => a.type === 15).map(a => a.data);
      }
    }
    
    // Fetch NS records
    const nsUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=NS`;
    const nsResponse = await fetch(nsUrl, {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (nsResponse.ok) {
      const nsData = await nsResponse.json();
      if (nsData.Answer) {
        result.ns = nsData.Answer.filter(a => a.type === 2).map(a => a.data);
      }
    }
    
  } catch (error) {
    console.error('DNS fetch error:', error.message);
  }

  return result;
}

function calculateMXScore(records) {
  let score = 0;
  
  if (records.spf) score += 20;
  if (records.dmarc) score += 20;
  if (records.dkim) score += 20;
  if (records.caa && records.caa.length > 0) score += 20;
  if (records.mx && records.mx.length > 0) score += 20;
  
  return score;
}
