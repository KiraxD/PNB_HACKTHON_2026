// Internal DNS Security and Email Configuration Analysis
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveCaa = promisify(dns.resolveCaa);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

export default async function handler(req, res) {
  const { host } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  if (!/^[a-zA-Z0-9.-]+\.?[a-zA-Z0-9-]*$/.test(host)) {
    return res.status(400).json({ error: 'Invalid host format' });
  }

  try {
    const dnsData = await performDNSSecurityAnalysis(host);
    const score = calculateDNSSecurityScore(dnsData);

    res.status(200).json({
      ok: true,
      host: host,
      dnsRecords: dnsData,
      securityScore: score,
      timestamp: new Date().toISOString(),
      source: 'Internal DNS Analyzer v1.0'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      host: host
    });
  }
}

async function performDNSSecurityAnalysis(host) {
  const results = {
    a_records: [],
    aaaa_records: [],
    mx_records: [],
    ns_records: [],
    caa_records: [],
    txt_records: [],
    spf_record: null,
    dmarc_policy: null,
    dkim_selectors: [],
    email_security: {}
  };

  try {
    // Fetch A records (IPv4)
    try {
      results.a_records = await resolve4(host);
    } catch (e) {
      // Not found
    }

    // Fetch AAAA records (IPv6)
    try {
      results.aaaa_records = await resolve6(host);
    } catch (e) {
      // Not found
    }

    // Fetch MX records
    try {
      results.mx_records = await resolveMx(host);
    } catch (e) {
      // Not found
    }

    // Fetch NS records
    try {
      results.ns_records = await resolveNs(host);
    } catch (e) {
      // Not found
    }

    // Fetch CAA records
    try {
      results.caa_records = await resolveCaa(host);
    } catch (e) {
      // Not found
    }

    // Fetch TXT records (SPF, DMARC, etc.)
    try {
      const txtRecords = await resolveTxt(host);
      results.txt_records = txtRecords.map(r => r.join(''));

      // Parse SPF
      const spf = results.txt_records.find(r => r.startsWith('v=spf1'));
      if (spf) {
        results.spf_record = spf;
        results.email_security.spf_present = true;
        results.email_security.spf_policy = analyzeSPFPolicy(spf);
      }

      // Parse DMARC (need to check _dmarc subdomain separately)
      const dmarc = results.txt_records.find(r => r.startsWith('v=DMARC1'));
      if (dmarc) {
        results.dmarc_policy = dmarc;
        results.email_security.dmarc_present = true;
        results.email_security.dmarc_policy = analyzeDMARCPolicy(dmarc);
      }
    } catch (e) {
      // Not found
    }

    // Check DMARC at _dmarc subdomain
    try {
      const dmarcTxt = await resolveTxt(`_dmarc.${host}`);
      const dmarcRecord = dmarcTxt.map(r => r.join('')).find(r => r.startsWith('v=DMARC1'));
      if (dmarcRecord) {
        results.dmarc_policy = dmarcRecord;
        results.email_security.dmarc_present = true;
        results.email_security.dmarc_policy = analyzeDMARCPolicy(dmarcRecord);
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
          results.dkim_selectors.push({
            selector: selector,
            record: dkimTxt.map(r => r.join(''))
          });
        }
      } catch (e) {
        // Not found
      }
    }

    if (results.dkim_selectors.length > 0) {
      results.email_security.dkim_present = true;
    }
  } catch (error) {
    console.error('DNS analysis error:', error.message);
  }

  return results;
}

function analyzeSPFPolicy(spfRecord) {
  const analysis = {
    strength: 'unknown',
    issues: [],
    recommendations: []
  };

  if (!spfRecord) {
    analysis.strength = 'missing';
    analysis.recommendations.push('Add SPF record to prevent email spoofing');
    return analysis;
  }

  const spfValue = spfRecord.toLowerCase();

  // Check for hard fail
  if (spfValue.includes('-all')) {
    analysis.strength = 'strong';
  } else if (spfValue.includes('~all')) {
    analysis.strength = 'moderate';
    analysis.issues.push('Using soft fail (~all) instead of hard fail (-all)');
    analysis.recommendations.push('Change ~all to -all for stronger protection');
  } else if (spfValue.includes('+all')) {
    analysis.strength = 'weak';
    analysis.issues.push('Using +all allows any server to send mail');
    analysis.recommendations.push('Use -all to reject unauthorized senders');
  }

  // Check for common mechanisms
  if (!spfValue.includes('include:') && !spfValue.includes('a/') && !spfValue.includes('mx')) {
    analysis.issues.push('No explicit sender mechanisms defined');
  }

  // Check DNS lookup limit (max 10)
  const lookupMechanisms = (spfValue.match(/include:|a:|mx:|ptr:/g) || []).length;
  if (lookupMechanisms > 8) {
    analysis.issues.push(`High DNS lookup count (${lookupMechanisms}): close to SPF limit of 10`);
    analysis.recommendations.push('Consolidate SPF record or use SPF flattening');
  }

  return analysis;
}

function analyzeDMARCPolicy(dmarcRecord) {
  const analysis = {
    strength: 'unknown',
    policy: 'unknown',
    issues: [],
    recommendations: []
  };

  if (!dmarcRecord) {
    analysis.strength = 'missing';
    analysis.recommendations.push('Add DMARC policy to prevent domain spoofing');
    return analysis;
  }

  // Extract policy
  const policyMatch = dmarcRecord.match(/p=(\w+)/);
  if (policyMatch) {
    analysis.policy = policyMatch[1].toLowerCase();

    if (analysis.policy === 'reject') {
      analysis.strength = 'strong';
    } else if (analysis.policy === 'quarantine') {
      analysis.strength = 'moderate';
      analysis.recommendations.push('Consider upgrading to p=reject for maximum protection');
    } else if (analysis.policy === 'none') {
      analysis.strength = 'weak';
      analysis.issues.push('Policy is set to none (monitoring-only)');
      analysis.recommendations.push('Set p=quarantine or p=reject after testing');
    }
  }

  // Check for subdomain policy
  const subdomainMatch = dmarcRecord.match(/sp=(\w+)/);
  if (!subdomainMatch) {
    analysis.recommendations.push('Add sp= to specify policy for subdomains');
  }

  // Check report addresses
  if (!dmarcRecord.includes('rua=') && !dmarcRecord.includes('ruf=')) {
    analysis.issues.push('No aggregate or forensic report email addresses');
    analysis.recommendations.push('Add rua= and ruf= to receive DMARC reports');
  }

  return analysis;
}

function calculateDNSSecurityScore(dnsData) {
  let score = 0;
  const maxScore = 100;
  let factors = 0;

  // A records (IPv4)
  if (dnsData.a_records && dnsData.a_records.length > 0) {
    score += 15;
  }
  factors++;

  // AAAA records (IPv6)
  if (dnsData.aaaa_records && dnsData.aaaa_records.length > 0) {
    score += 10; // Bonus for IPv6 support
  }
  factors++;

  // MX records
  if (dnsData.mx_records && dnsData.mx_records.length > 0) {
    score += 15;
  }
  factors++;

  // NS records
  if (dnsData.ns_records && dnsData.ns_records.length > 0) {
    score += 15;
  }
  factors++;

  // CAA records (certificate authority authorization)
  if (dnsData.caa_records && dnsData.caa_records.length > 0) {
    score += 15;
  } else {
    // CAA is important for certificate security
    // score -= 5;
  }
  factors++;

  // Email security
  if (dnsData.email_security.spf_present) {
    score += 10;
    if (dnsData.email_security.spf_policy?.strength === 'strong') score += 5;
  }
  factors++;

  if (dnsData.email_security.dmarc_present) {
    score += 10;
    if (dnsData.email_security.dmarc_policy?.strength === 'strong') score += 5;
  }
  factors++;

  if (dnsData.email_security.dkim_present) {
    score += 10;
  }
  factors++;

  return Math.round(score);
}
