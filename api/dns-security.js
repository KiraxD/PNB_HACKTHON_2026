// Internal DNS Security Analysis - Pure Node.js DNS (No External APIs)
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveCaa = promisify(dns.resolveCaa);

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
    a_records: [],
    caa_records: [],
    txt_records: [],
    spf_record: null,
    dmarc_policy: null,
    dkim_selectors: [],
    email_security: {},
    mx_records: [],
    ns_records: []
  };

  try {
    // Fetch MX records
    try {
      result.mx_records = await resolveMx(host);
    } catch (e) {
      // Not found
    }

    // Fetch NS records
    try {
      result.ns_records = await resolveNs(host);
    } catch (e) {
      // Not found
    }

    // Fetch CAA records
    try {
      result.caa_records = await resolveCaa(host);
    } catch (e) {
      // Not found
    }

    // Fetch TXT records (SPF, DMARC, etc.)
    try {
      const txtRecords = await resolveTxt(host);
      result.txt_records = txtRecords.map(r => r.join(''));

      // Parse SPF
      const spf = result.txt_records.find(r => r.startsWith('v=spf1'));
      if (spf) {
        result.spf_record = spf;
        result.email_security.spf_present = true;
        result.email_security.spf_policy = analyzeSPFPolicy(spf);
      }

      // Parse DMARC
      const dmarc = result.txt_records.find(r => r.startsWith('v=DMARC1'));
      if (dmarc) {
        result.dmarc_policy = dmarc;
        result.email_security.dmarc_present = true;
        result.email_security.dmarc_policy = analyzeDMARCPolicy(dmarc);
      }
    } catch (e) {
      // Not found
    }

    // Check DMARC at _dmarc subdomain
    try {
      const dmarcTxt = await resolveTxt(`_dmarc.${host}`);
      const dmarcRecord = dmarcTxt.map(r => r.join('')).find(r => r.startsWith('v=DMARC1'));
      if (dmarcRecord) {
        result.dmarc_policy = dmarcRecord;
        result.email_security.dmarc_present = true;
        result.email_security.dmarc_policy = analyzeDMARCPolicy(dmarcRecord);
      }
    } catch (e) {
      // Not found
    }

    // Check common DKIM selectors
    const commonSelectors = ['default', 'selector1', 'selector2', 'google', 'sendgrid', 'mandrill'];
    for (const selector of commonSelectors) {
      try {
        const dkimTxt = await resolveTxt(`${selector}._domainkey.${host}`);
        if (dkimTxt.length > 0) {
          result.dkim_selectors.push({
            selector: selector,
            record: dkimTxt.map(r => r.join(''))
          });
        }
      } catch (e) {
        // Not found
      }
    }

    if (result.dkim_selectors.length > 0) {
      result.email_security.dkim_present = true;
    }
  } catch (error) {
    console.error('DNS analysis error:', error.message);
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
