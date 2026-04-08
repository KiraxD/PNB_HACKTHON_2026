/**
 * PRACTICAL Port & Service Detection
 * HTTP-based detection (what actually works in browser)
 */

export async function detectServices(domain) {
  const results = {
    domain: domain,
    timestamp: new Date().toISOString(),
    services: [],
    issues: [],
    openServices: []
  };

  console.log(`🔍 Detecting services on ${domain}...`);

  // Check HTTP
  try {
    const httpRes = await fetch(`http://${domain}`, { timeout: 5000 }).catch(() => null);
    if (httpRes) {
      results.services.push({
        service: 'HTTP',
        port: 80,
        status: 'DETECTED',
        headers: Object.fromEntries(httpRes.headers)
      });
      results.openServices.push('HTTP');
    }
  } catch (e) {}

  // Check HTTPS
  try {
    const httpsRes = await fetch(`https://${domain}`, { timeout: 5000 }).catch(() => null);
    if (httpsRes) {
      results.services.push({
        service: 'HTTPS',
        port: 443,
        status: 'DETECTED',
        headers: Object.fromEntries(httpsRes.headers)
      });
      results.openServices.push('HTTPS');
    }
  } catch (e) {}

  // Check for common alternate ports
  const altPorts = [
    { port: 8080, name: 'HTTP-ALT' },
    { port: 8443, name: 'HTTPS-ALT' },
    { port: 3000, name: 'Node.js' },
    { port: 5000, name: 'Flask' },
    { port: 9000, name: 'Service' }
  ];

  for (const { port, name } of altPorts) {
    try {
      const res = await fetch(`http://${domain}:${port}`, { timeout: 3000 }).catch(() => null);
      if (res && res.ok) {
        results.services.push({
          service: name,
          port: port,
          status: 'DETECTED'
        });
      }
    } catch (e) {}
  }

  // Analyze detected services for issues
  const httpService = results.services.find(s => s.service === 'HTTP');
  if (httpService && results.openServices.includes('HTTPS')) {
    results.issues.push({
      severity: 'MEDIUM',
      issue: 'HTTP detected alongside HTTPS',
      recommendation: 'Enable HTTPS redirect for all HTTP traffic'
    });
  }

  return results;
}

export function analyzeServerFingerprints(services) {
  const fingerprints = [];

  services.forEach(service => {
    if (!service.headers) return;

    const serverHeader = service.headers['server'];
    const poweredBy = service.headers['x-powered-by'];
    const xAspNet = service.headers['x-aspnet-version'];

    if (serverHeader) {
      fingerprints.push({
        type: 'SERVER_HEADER',
        value: serverHeader,
        severity: 'LOW',
        recommendation: 'Hide or mask server version information'
      });
    }

    if (poweredBy) {
      fingerprints.push({
        type: 'POWERED_BY',
        value: poweredBy,
        severity: 'LOW',
        recommendation: 'Remove X-Powered-By header'
      });
    }

    if (xAspNet) {
      fingerprints.push({
        type: 'ASPNET_VERSION',
        value: xAspNet,
        severity: 'MEDIUM',
        recommendation: 'Remove or mask .NET version'
      });
    }
  });

  return fingerprints;
}

export async function checkServiceAvailability(domain) {
  const availability = {
    domain: domain,
    isReachable: false,
    responseTime: 0,
    statusCode: null,
    redirects: [],
    finalUrl: null
  };

  try {
    const startTime = Date.now();
    const response = await fetch(`https://${domain}`, { redirect: 'follow' });
    availability.responseTime = Date.now() - startTime;
    availability.statusCode = response.status;
    availability.finalUrl = response.url;
    availability.isReachable = response.ok;

    return availability;
  } catch (e) {
    try {
      const startTime = Date.now();
      const response = await fetch(`http://${domain}`);
      availability.responseTime = Date.now() - startTime;
      availability.statusCode = response.status;
      availability.isReachable = response.ok;
      return availability;
    } catch (error) {
      availability.isReachable = false;
      return availability;
    }
  }
}
