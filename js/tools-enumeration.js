/**
 * Subdomain & Directory Enumeration Tool
 * Discovers subdomains and hidden directories
 */

// Common subdomains
const COMMON_SUBDOMAINS = [
  'www', 'mail', 'ftp', 'admin', 'api', 'blog', 'shop', 'dev', 'test',
  'staging', 'beta', 'app', 'dashboard', 'portal', 'cdn', 'mx', 'ns1',
  'mail1', 'smtp', 'pop', 'imap', 'vpn', 'backup', 'git', 'jenkins',
  'docker', 'kubernetes', 'prometheus', 'grafana', 'elasticsearch',
  'kibana', 'db', 'database', 'redis', 'cache', 'queue', 'rabbitmq',
  'storage', 'assets', 'static', 'images', 'media', 'files', 'download',
  'upload', 'user', 'users', 'profile', 'settings', 'account', 'login',
  'logout', 'register', 'forgot', 'reset', 'api-v1', 'api-v2', 'graphql'
];

// Common directories
const COMMON_DIRECTORIES = [
  '/admin', '/administrator', '/wp-admin', '/joomla',
  '/api', '/v1', '/v2', '/v3',
  '/config', '/configuration', '/settings',
  '/database', '/db', '/sql',
  '/backup', '/backups', '.backup',
  '/log', '/logs', '/logging',
  '/temp', '/tmp', '/cache',
  '/.git', '/.gitignore', '/.env',
  '/.aws', '/.ssh', '/.htaccess',
  '/test', '/tests', '/testing',
  '/debug', '/debugger', '/xdebug',
  '/phpinfo.php', '/info.php', '/test.php',
  '/wp-login.php', '/wp-admin',
  '/joomla/administrator',
  '/.svn', '/.hg', '/.bzr',
  '/uploads', '/download', '/downloads',
  '/files', '/file', '/documents',
  '/images', '/img', '/media',
  '/.well-known', '/.github', '/.gitlab',
  '/node_modules', '/package.json',
  '/Makefile', '/docker-compose.yml'
];

export async function enumerateSubdomains(domain) {
  const results = {
    domain: domain,
    timestamp: new Date().toISOString(),
    discoveredSubdomains: [],
    aliveSubdomains: [],
    summary: {}
  };

  console.log(`🔎 Enumerating subdomains for ${domain}...`);

  // Check each common subdomain
  for (const subdomain of COMMON_SUBDOMAINS) {
    const fqdn = `${subdomain}.${domain}`;
    
    try {
      const isAlive = await checkSubdomainAlive(fqdn);
      
      if (isAlive) {
        results.discoveredSubdomains.push({
          subdomain: fqdn,
          status: 'ALIVE',
          timestamp: new Date()
        });
        results.aliveSubdomains.push(fqdn);
        console.log(`✓ ${fqdn} is alive`);
      }
    } catch (error) {
      // Continue enumeration
    }
  }

  results.summary = {
    totalChecked: COMMON_SUBDOMAINS.length,
    discovered: results.discoveredSubdomains.length,
    alive: results.aliveSubdomains.length,
    riskLevel: results.aliveSubdomains.length > 5 ? 'MEDIUM' : 'LOW'
  };

  return results;
}

async function checkSubdomainAlive(subdomain) {
  return new Promise((resolve) => {
    try {
      // Try both HTTP and HTTPS
      Promise.race([
        fetch(`https://${subdomain}`, { mode: 'no-cors', timeout: 5000 }),
        fetch(`http://${subdomain}`, { mode: 'no-cors', timeout: 5000 })
      ]).then(() => resolve(true)).catch(() => resolve(false));
    } catch (error) {
      resolve(false);
    }
  });
}

export async function enumerateDirectories(baseUrl) {
  const results = {
    baseUrl: baseUrl,
    timestamp: new Date().toISOString(),
    discoveredDirectories: [],
    summary: {}
  };

  console.log(`📂 Enumerating directories in ${baseUrl}...`);

  for (const dir of COMMON_DIRECTORIES) {
    try {
      const testUrl = baseUrl.endsWith('/') ? baseUrl + dir.substring(1) : baseUrl + dir;
      const response = await fetch(testUrl, { timeout: 5000 });

      if (response.ok || response.status === 403) {
        results.discoveredDirectories.push({
          path: dir,
          status: response.status,
          statusText: response.statusText,
          severity: response.status === 403 ? 'INFO' : 'MEDIUM'
        });
        console.log(`✓ ${dir} - ${response.status}`);
      }
    } catch (error) {
      // Continue
    }
  }

  results.summary = {
    totalChecked: COMMON_DIRECTORIES.length,
    discoveredCount: results.discoveredDirectories.length,
    accessibleCount: results.discoveredDirectories.filter(d => d.status === 200).length,
    forbiddenCount: results.discoveredDirectories.filter(d => d.status === 403).length,
    riskLevel: results.discoveredDirectories.length > 3 ? 'MEDIUM' : 'LOW'
  };

  return results;
}

export async function analyzeSubdomainSecurityIssues(subdomains) {
  const issues = [];

  for (const subdomain of subdomains) {
    try {
      const response = await fetch(`https://${subdomain}`, { timeout: 5000 });
      const html = await response.text();

      // Check for common security issues
      if (html.includes('phpinfo') || html.includes('PHP Version')) {
        issues.push({
          subdomain: subdomain,
          issue: 'PHP Information Exposed',
          severity: 'HIGH',
          recommendation: 'Remove phpinfo() and debug pages'
        });
      }

      if (html.includes('default Apache') || html.includes('default nginx')) {
        issues.push({
          subdomain: subdomain,
          issue: 'Default Server Page',
          severity: 'MEDIUM',
          recommendation: 'Configure proper web server routing'
        });
      }

      if (html.includes('MySQL') || html.includes('database')) {
        issues.push({
          subdomain: subdomain,
          issue: 'Database Information Exposed',
          severity: 'CRITICAL',
          recommendation: 'Remove database error messages from responses'
        });
      }

    } catch (error) {
      // Continue
    }
  }

  return issues;
}

export function generateEnumerationReport(subdomainResults, directoryResults) {
  let report = `
ENUMERATION & DISCOVERY REPORT
===============================

SUBDOMAIN ENUMERATION:
----------------------
Domain: ${subdomainResults.domain}
Total Subdomains Checked: ${subdomainResults.summary.totalChecked}
Alive Subdomains: ${subdomainResults.summary.alive}

Discovered:
`;

  subdomainResults.aliveSubdomains.forEach((subdomain, index) => {
    report += `${index + 1}. ${subdomain}\n`;
  });

  report += `

DIRECTORY ENUMERATION:
----------------------
Base URL: ${directoryResults.baseUrl}
Total Directories Checked: ${directoryResults.summary.totalChecked}
Discovered Directories: ${directoryResults.summary.discoveredCount}
Accessible (200): ${directoryResults.summary.accessibleCount}
Forbidden (403): ${directoryResults.summary.forbiddenCount}

Found Directories:
`;

  directoryResults.discoveredDirectories.forEach((dir, index) => {
    const statusIcon = dir.status === 200 ? '✓' : '⚠';
    report += `${index + 1}. ${statusIcon} ${dir.path} (${dir.status})\n`;
  });

  report += `

RISK ASSESSMENT:
----------------
Subdomain Risk: ${subdomainResults.summary.riskLevel}
Directory Risk: ${directoryResults.summary.riskLevel}

RECOMMENDATIONS:
----------------
1. Review all discovered subdomains for security configuration
2. Ensure hidden directories are properly protected
3. Implement access controls on sensitive paths
4. Use Web Application Firewall for directory protection
5. Regular security audit of discovered assets
`;

  return report;
}
