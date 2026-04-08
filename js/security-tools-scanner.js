/**
 * Unified Security Tools Scanner
 * Master integrator combining all security tools
 */

import { portScan, analyzeServices, generatePortScanReport } from './tools-port-scanner.js';
import { xssScan, detectDOMXSSVulnerabilities, generateXSSReport } from './tools-xss-detector.js';
import { sqlScan, analyzeParameterForSQLi, generateSQLReport } from './tools-sql-injection.js';
import { enumerateSubdomains, enumerateDirectories, generateEnumerationReport } from './tools-enumeration.js';
import { detectCSRFVulnerabilities, detectAuthenticationBypassAttempts, analyzeSessionSecurity, generateAuthReport } from './tools-auth-security.js';

export class SecurityToolsScanner {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 30000;
    this.resultsCache = new Map();
  }

  async runFullScan(target) {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║   UNIFIED SECURITY TOOLS SCANNER v1.0     ║
    ║   Running comprehensive security audit    ║
    ╚═══════════════════════════════════════════╝
    `);

    const scanResults = {
      target: target,
      timestamp: new Date().toISOString(),
      scans: {},
      summary: {},
      alerts: []
    };

    try {
      // 1. Port Scan
      console.log('\n[1/6] Running port scan...');
      scanResults.scans.portScan = await this.runPortScan(target);

      // 2. Subdomain Enumeration
      console.log('[2/6] Enumerating subdomains...');
      scanResults.scans.subdomainEnum = await this.runSubdomainEnum(target);

      // 3. Directory Enumeration
      console.log('[3/6] Enumerating directories...');
      scanResults.scans.directoryEnum = await this.runDirectoryEnum(`https://${target}`);

      // 4. XSS Detection
      console.log('[4/6] Testing for XSS vulnerabilities...');
      scanResults.scans.xssScan = await this.runXSSScan(`https://${target}`);

      // 5. SQL Injection Detection
      console.log('[5/6] Testing for SQL injection...');
      scanResults.scans.sqlScan = await this.runSQLScan(`https://${target}`);

      // 6. Authentication Security
      console.log('[6/6] Analyzing authentication security...');
      scanResults.scans.authSecurity = await this.runAuthSecurity(`https://${target}`);

      // Calculate summary
      scanResults.summary = this.calculateSummary(scanResults.scans);
      scanResults.alerts = this.generateAlerts(scanResults.scans);

      console.log('\n✅ Scan complete!');
      return scanResults;

    } catch (error) {
      console.error('Scan failed:', error);
      scanResults.error = error.message;
      return scanResults;
    }
  }

  async runPortScan(host) {
    try {
      const results = await portScan(host);
      const vulnerabilities = analyzeServices(results);
      return {
        ...results,
        vulnerabilities: vulnerabilities,
        report: generatePortScanReport(results)
      };
    } catch (error) {
      console.error('Port scan error:', error);
      return { error: error.message };
    }
  }

  async runSubdomainEnum(domain) {
    try {
      const results = await enumerateSubdomains(domain);
      return {
        ...results,
        message: `Found ${results.aliveSubdomains.length} alive subdomains`
      };
    } catch (error) {
      console.error('Subdomain enum error:', error);
      return { error: error.message };
    }
  }

  async runDirectoryEnum(baseUrl) {
    try {
      const results = await enumerateDirectories(baseUrl);
      return {
        ...results,
        message: `Discovered ${results.discoveredDirectories.length} directories`
      };
    } catch (error) {
      console.error('Directory enum error:', error);
      return { error: error.message };
    }
  }

  async runXSSScan(url) {
    try {
      // Extract query parameters
      const params = new URL(url).searchParams;
      const testParams = Array.from(params.keys());
      
      const results = await xssScan(url, testParams.length > 0 ? testParams : ['q', 'search', 'id']);
      return {
        ...results,
        report: generateXSSReport(results)
      };
    } catch (error) {
      console.error('XSS scan error:', error);
      return { error: error.message };
    }
  }

  async runSQLScan(url) {
    try {
      const params = new URL(url).searchParams;
      const testParams = Array.from(params.keys());
      
      const results = await sqlScan(url, testParams.length > 0 ? testParams : ['id', 'search', 'filter']);
      return {
        ...results,
        report: generateSQLReport(results)
      };
    } catch (error) {
      console.error('SQL scan error:', error);
      return { error: error.message };
    }
  }

  async runAuthSecurity(url) {
    try {
      let htmlContent = '';
      try {
        const response = await fetch(url, { timeout: 10000 });
        htmlContent = await response.text();
      } catch (e) {
        // Continue with empty content
      }

      const csrfVulns = detectCSRFVulnerabilities(htmlContent);
      const authBypass = detectAuthenticationBypassAttempts(htmlContent);
      
      return {
        csrfVulnerabilities: csrfVulns,
        authenticationBypass: authBypass,
        report: generateAuthReport(csrfVulns, authBypass, []),
        message: `Found ${csrfVulns.length + authBypass.length} authentication security issues`
      };
    } catch (error) {
      console.error('Auth security error:', error);
      return { error: error.message };
    }
  }

  calculateSummary(scans) {
    const summary = {
      totalVulnerabilities: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      scansCompleted: 0,
      scansWithIssues: 0
    };

    const countSeverity = (items) => {
      items.forEach(item => {
        if (!item.severity) return;
        summary.totalVulnerabilities++;
        if (item.severity === 'CRITICAL') summary.critical++;
        else if (item.severity === 'HIGH') summary.high++;
        else if (item.severity === 'MEDIUM') summary.medium++;
        else if (item.severity === 'LOW') summary.low++;
      });
    };

    // Count port vulnerabilities
    if (scans.portScan?.vulnerabilities) {
      countSeverity(scans.portScan.vulnerabilities);
      summary.scansCompleted++;
    }

    // Count XSS vulnerabilities
    if (scans.xssScan?.vulnerabilities) {
      countSeverity(scans.xssScan.vulnerabilities);
      summary.scansCompleted++;
    }

    // Count SQL vulnerabilities
    if (scans.sqlScan?.vulnerabilities) {
      countSeverity(scans.sqlScan.vulnerabilities);
      summary.scansCompleted++;
    }

    // Count auth vulnerabilities
    if (scans.authSecurity?.csrfVulnerabilities) {
      countSeverity(scans.authSecurity.csrfVulnerabilities);
      summary.scansCompleted++;
    }

    summary.scansWithIssues = (scans.portScan?.openPorts?.length > 0 ? 1 : 0) +
                              (scans.xssScan?.vulnerabilities?.length > 0 ? 1 : 0) +
                              (scans.sqlScan?.vulnerabilities?.length > 0 ? 1 : 0) +
                              (scans.authSecurity?.csrfVulnerabilities?.length > 0 ? 1 : 0);

    return summary;
  }

  generateAlerts(scans) {
    const alerts = [];

    // Port scan alerts
    if (scans.portScan?.openPorts?.some(p => ['Telnet', 'FTP'].includes(p.service))) {
      alerts.push({
        level: 'CRITICAL',
        message: 'Unencrypted protocols detected (Telnet/FTP)',
        action: 'Disable immediately or migrate to secure alternatives'
      });
    }

    // XSS alerts
    if (scans.xssScan?.vulnerabilities?.length > 0) {
      alerts.push({
        level: 'CRITICAL',
        message: `${scans.xssScan.vulnerabilities.length} XSS vulnerabilities found`,
        action: 'Implement output encoding and CSP headers'
      });
    }

    // SQL injection alerts
    if (scans.sqlScan?.vulnerabilities?.length > 0) {
      alerts.push({
        level: 'CRITICAL',
        message: `${scans.sqlScan.vulnerabilities.length} SQL injection vulnerabilities found`,
        action: 'Use parameterized queries immediately'
      });
    }

    // Subdomain alerts
    if (scans.subdomainEnum?.aliveSubdomains?.length > 0) {
      alerts.push({
        level: 'MEDIUM',
        message: `${scans.subdomainEnum.aliveSubdomains.length} subdomains discovered`,
        action: 'Review security configuration on all subdomains'
      });
    }

    return alerts;
  }

  generateFullReport(scanResults) {
    let report = `
╔════════════════════════════════════════════════════════════╗
║           SECURITY SCAN FULL REPORT                        ║
╚════════════════════════════════════════════════════════════╝

TARGET: ${scanResults.target}
SCAN DATE: ${scanResults.timestamp}

EXECUTIVE SUMMARY
=================
Total Vulnerabilities: ${scanResults.summary.totalVulnerabilities}
  • Critical: ${scanResults.summary.critical}
  • High: ${scanResults.summary.high}
  • Medium: ${scanResults.summary.medium}
  • Low: ${scanResults.summary.low}

Scans Completed: ${scanResults.summary.scansCompleted}/6
Scans with Issues: ${scanResults.summary.scansWithIssues}

CRITICAL ALERTS
================
`;

    scanResults.alerts
      .filter(a => a.level === 'CRITICAL')
      .forEach(alert => {
        report += `⚠️ ${alert.message}\n   Action: ${alert.action}\n\n`;
      });

    if (scanResults.scans.portScan?.report) {
      report += `\n${scanResults.scans.portScan.report}`;
    }

    if (scanResults.scans.xssScan?.report) {
      report += `\n${scanResults.scans.xssScan.report}`;
    }

    if (scanResults.scans.sqlScan?.report) {
      report += `\n${scanResults.scans.sqlScan.report}`;
    }

    if (scanResults.scans.authSecurity?.report) {
      report += `\n${scanResults.scans.authSecurity.report}`;
    }

    report += `

REMEDIATION PRIORITY
====================
1. IMMEDIATE (within 24 hours):
   - Fix critical vulnerabilities
   - Disable unencrypted protocols
   - Patch known exploits

2. URGENT (within 1 week):
   - Address high-severity issues
   - Implement security headers
   - Enable MFA

3. IMPORTANT (within 1 month):
   - Security hardening
   - Monitoring setup
   - Regular testing schedule

Generated: ${new Date().toLocaleString()}
`;

    return report;
  }
}

// Usage example
export async function runSecurityAudit(domain) {
  const scanner = new SecurityToolsScanner({ verbose: true });
  const results = await scanner.runFullScan(domain);
  const report = scanner.generateFullReport(results);
  
  console.log(report);
  return { results, report };
}
