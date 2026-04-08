/**
 * PRACTICAL Subdomain Enumeration Tool
 * Uses HTTP status codes and response analysis to find subdomains
 */

export async function enumerateSubdomains(domain) {
  const results = {
    domain: domain,
    timestamp: new Date().toISOString(),
    foundSubdomains: [],
    commonSubdomains: [],
    analysis: {}
  };

  console.log(`🔎 Enumerating subdomains for ${domain}...`);

  // Common subdomains to check
  const commonSubs = [
    'www', 'mail', 'smtp', 'pop', 'ns1', 'webmail',
    'ftp', 'localhost', 'webdisk', 'ns2', 'cpanel', 'whm',
    'autodiscover', 'autoconfig', 'api', 'admin', 'test',
    'dev', 'staging', 'prod', 'production', 'oldsite',
    'backup', 'old', 'new', 'git', 'github', 'jenkins',
    'grafana', 'kibana', 'prometheus', 'docker', 'kubernetes',
    'static', 'cdn', 'assets', 'files', 'downloads',
    'shop', 'store', 'cart', 'checkout', 'payment',
    'blog', 'news', 'forum', 'community', 'support',
    'help', 'docs', 'documentation', 'wiki', 'knowledge',
    'media', 'videos', 'images', 'photos', 'gallery',
    'calendar', 'email', 'mobile', 'app', 'dashboard',
    'panel', 'control', 'server', 'db', 'database',
    'vpn', 'remote', 'access', 'secure', 'ssl',
    'mx', 'google', 'verification', 'monitoring', 'logs',
    'splunk', 'datadog', 'newrelic', 'papertrail', 'sentry'
  ];

  // Check each subdomain
  for (const sub of commonSubs) {
    const subdomain = `${sub}.${domain}`;
    try {
      const result = await checkSubdomain(subdomain);
      
      if (result.isAlive) {
        results.foundSubdomains.push({
          subdomain: subdomain,
          status: result.status,
          statusCode: result.statusCode,
          responseTime: result.responseTime,
          technology: result.technology,
          notes: result.notes
        });
      }

      results.commonSubdomains.push({
        subdomain: subdomain,
        status: result.status,
        statusCode: result.statusCode,
        isAlive: result.isAlive
      });

    } catch (error) {
      // Timeout or error typically means subdomain doesn't exist
      results.commonSubdomains.push({
        subdomain: subdomain,
        status: 'NOT_FOUND',
        isAlive: false
      });
    }
  }

  results.analysis = {
    totalFound: results.foundSubdomains.length,
    percentageFound: ((results.foundSubdomains.length / commonSubs.length) * 100).toFixed(2),
    activeServices: analyzeFoundServices(results.foundSubdomains),
    potentialRisks: identifyRisks(results.foundSubdomains)
  };

  return results;
}

async function checkSubdomain(subdomain) {
  const startTime = Date.now();
  
  // Try HTTPS first, then HTTP
  let response, protocol;
  
  try {
    response = await Promise.race([
      fetch(`https://${subdomain}`, { 
        timeout: 3000,
        redirect: 'follow'
      }),
      fetch(`http://${subdomain}`, {
        timeout: 3000,
        redirect: 'follow'
      })
    ]);
    protocol = response.url.startsWith('https') ? 'https' : 'http';
  } catch (error) {
    return {
      isAlive: false,
      status: 'ERROR',
      statusCode: 0,
      error: error.message
    };
  }

  const responseTime = Date.now() - startTime;
  const html = await response.text().catch(() => '');
  const headers = response.headers;

  // Determine if subdomain is alive based on status code
  const isAlive = [200, 301, 302, 303, 307, 308, 400, 401, 403, 404].includes(response.status);

  // Extract technology fingerprints
  const technology = extractTechnology(headers, html);

  // Identify what the subdomain might be
  const notes = identifySubdomainPurpose(subdomain, response.status, html, technology);

  return {
    isAlive: isAlive && response.status !== 404, // 404 means empty/not configured
    status: getStatusDescription(response.status),
    statusCode: response.status,
    responseTime: responseTime,
    protocol: protocol,
    technology: technology,
    notes: notes,
    redirectUrl: response.url !== `${protocol}://${subdomain}` ? response.url : null
  };
}

function getStatusDescription(code) {
  const descriptions = {
    200: 'OK - Service is active',
    301: 'Moved Permanently',
    302: 'Found - Redirect',
    303: 'See Other',
    304: 'Not Modified',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized - Login Required',
    403: 'Forbidden - Service exists but blocked',
    404: 'Not Found - Empty',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  return descriptions[code] || `HTTP ${code}`;
}

function extractTechnology(headers, html) {
  const tech = [];

  // Check headers
  const server = headers.get('server')?.toLowerCase();
  if (server) {
    tech.push(server);
  }

  const powered = headers.get('x-powered-by')?.toLowerCase();
  if (powered) {
    tech.push(powered);
  }

  // Check for framework signatures in HTML
  if (html.includes('django') || html.includes('Django')) tech.push('Django');
  if (html.includes('Laravel') || html.includes('laravel')) tech.push('Laravel');
  if (html.includes('wordpress') || html.includes('WordPress')) tech.push('WordPress');
  if (html.includes('react') || html.includes('React')) tech.push('React');
  if (html.includes('angular') || html.includes('Angular')) tech.push('Angular');
  if (html.includes('express') || html.includes('Express')) tech.push('Express');
  if (html.includes('flask') || html.includes('Flask')) tech.push('Flask');
  if (html.includes('asp.net') || html.includes('ASP.NET')) tech.push('ASP.NET');

  return tech.length > 0 ? tech : ['Unknown'];
}

function identifySubdomainPurpose(subdomain, statusCode, html, technology) {
  const name = subdomain.split('.')[0].toLowerCase();
  const notes = [];

  // Based on subdomain name
  if (['www', 'web', 'index'].includes(name)) notes.push('Main website');
  if (['mail', 'smtp', 'pop', 'imap'].includes(name)) notes.push('Email service');
  if (['api', 'api-v1', 'api-v2'].includes(name)) notes.push('API endpoint');
  if (['admin', 'dashboard', 'panel', 'control'].includes(name)) notes.push('Admin panel');
  if (['dev', 'develop', 'development', 'staging'].includes(name)) notes.push('Development environment');
  if (['test', 'testing', 'qa'].includes(name)) notes.push('Testing environment');
  if (['prod', 'production'].includes(name)) notes.push('Production server');
  if (['cdn', 'static', 'assets', 'files'].includes(name)) notes.push('Content delivery');
  if (['blog', 'news', 'press'].includes(name)) notes.push('Blog/News');
  if (['shop', 'store', 'ecommerce'].includes(name)) notes.push('E-commerce');
  if (['vpn', 'remote', 'access'].includes(name)) notes.push('Remote access');
  if (['git', 'github', 'gitlab', 'bitbucket'].includes(name)) notes.push('Version control');
  if (['jenkins', 'docker', 'kubernetes'].includes(name)) notes.push('DevOps/CI-CD');
  if (['grafana', 'prometheus', 'monitoring'].includes(name)) notes.push('Monitoring');
  if (['mail', 'email', 'webmail'].includes(name)) notes.push('Email/Webmail');

  // Based on status code
  if (statusCode === 401 || statusCode === 403) notes.push('Authentication required');
  if (statusCode === 500 || statusCode === 502) notes.push('Service issue');

  // Based on technology
  if (technology.includes('nodejs') || technology.includes('express')) notes.push('Node.js app');
  if (technology.includes('python')) notes.push('Python app');
  if (technology.includes('php')) notes.push('PHP app');
  if (technology.includes('java')) notes.push('Java app');

  return notes.length > 0 ? notes : ['Unknown purpose'];
}

function analyzeFoundServices(subdomains) {
  const services = {
    webServers: subdomains.filter(s => ['www', 'web'].some(t => s.subdomain.includes(t))).length,
    apiEndpoints: subdomains.filter(s => s.subdomain.includes('api')).length,
    adminPanels: subdomains.filter(s => ['admin', 'dashboard', 'panel'].some(t => s.subdomain.includes(t))).length,
    devEnvironments: subdomains.filter(s => ['dev', 'staging', 'test'].some(t => s.subdomain.includes(t))).length,
    emailServices: subdomains.filter(s => ['mail', 'smtp', 'pop'].some(t => s.subdomain.includes(t))).length,
    contentDelivery: subdomains.filter(s => ['cdn', 'static', 'assets'].some(t => s.subdomain.includes(t))).length
  };
  return services;
}

function identifyRisks(subdomains) {
  const risks = [];

  // Dev/staging servers exposed
  const devExposed = subdomains.filter(s => ['dev', 'staging', 'test'].some(t => s.subdomain.includes(t)));
  if (devExposed.length > 0) {
    risks.push({
      risk: 'Development servers exposed',
      count: devExposed.length,
      severity: 'HIGH',
      recommendation: 'Restrict access to dev/staging servers'
    });
  }

  // Admin panels found
  const adminFound = subdomains.filter(s => ['admin', 'dashboard', 'panel'].some(t => s.subdomain.includes(t)));
  if (adminFound.length > 0) {
    risks.push({
      risk: 'Admin panels discoverable',
      count: adminFound.length,
      severity: 'MEDIUM',
      recommendation: 'Move admin panels to non-standard URLs or require authentication'
    });
  }

  // Outdated/vulnerable technologies
  const vulnerableTech = subdomains.filter(s => 
    s.technology.some(t => t.includes('apache/2.4.1') || t.includes('nginx/1.10') || t.includes('PHP/5.'))
  );
  if (vulnerableTech.length > 0) {
    risks.push({
      risk: 'Potentially outdated software detected',
      count: vulnerableTech.length,
      severity: 'HIGH',
      recommendation: 'Update all software to latest secure versions'
    });
  }

  return risks;
}

export function generateSubdomainReport(results) {
  let report = `
SUBDOMAIN ENUMERATION REPORT
=============================
Domain: ${results.domain}
Scan Date: ${results.timestamp}

SUMMARY:
--------
Total Subdomains Found: ${results.analysis.totalFound}
Percentage Found: ${results.analysis.percentageFound}%

ACTIVE SERVICES:
${Object.entries(results.analysis.activeServices)
  .map(([key, val]) => `${key}: ${val}`)
  .join('\n')}

FOUND SUBDOMAINS:
-----------------
`;

  if (results.foundSubdomains.length === 0) {
    report += 'No active subdomains detected.\n';
  } else {
    results.foundSubdomains.forEach(sub => {
      report += `
${sub.subdomain}
  Status: ${sub.status} (${sub.statusCode})
  Response Time: ${sub.responseTime}ms
  Technology: ${sub.technology.join(', ')}
  Purpose: ${sub.notes.join(', ')}
${sub.redirectUrl ? `  Redirects to: ${sub.redirectUrl}\n` : ''}`;
    });
  }

  if (results.analysis.potentialRisks.length > 0) {
    report += `

IDENTIFIED RISKS:
-----------------
`;
    results.analysis.potentialRisks.forEach(risk => {
      report += `
⚠️  ${risk.risk} (${risk.severity})
    Count: ${risk.count}
    Recommendation: ${risk.recommendation}
`;
    });
  }

  report += `

RECOMMENDATIONS:
----------------
1. Review what subdomains are necessary and publicly accessible
2. Implement proper access controls on sensitive endpoints
3. Keep all discovered services updated
4. Use Web Application Firewall (WAF) rules
5. Monitor subdomain creation for unauthorized additions
`;

  return report;
}
