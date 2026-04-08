/**
 * UNIFIED SECURITY SCANNER - Practical, Working Implementation
 * Combines all practical security analysis tools
 */

import { detectServices, analyzeServerFingerprints } from './tools-service-detection.js';
import { analyzeXSSVulnerabilities, generateXSSReport } from './tools-xss-analyzer.js';
import { analyzeSQLInjectionRisks, generateSQLReport } from './tools-sql-analyzer.js';
import { enumerateSubdomains, generateSubdomainReport } from './tools-subdomain-checker.js';
import { analyzeSecurityHeaders, generateHeadersReport } from './tools-security-headers.js';

export class UnifiedSecurityScanner {
  constructor(domain) {
    this.domain = domain;
    this.results = {
      domain: domain,
      timestamp: new Date().toISOString(),
      scanStatus: 'RUNNING',
      modules: {}
    };
  }

  async runFullScan(options = {}) {
    console.log(`🔍 Starting comprehensive security scan for ${this.domain}...`);
    
    const {
      skipServices = false,
      skipXSS = false,
      skipSQL = false,
      skipSubdomains = false,
      skipHeaders = false,
      verbose = false
    } = options;

    const startTime = Date.now();

    try {
      // 1. Service Detection
      if (!skipServices) {
        console.log('📡 Scanning services...');
        const services = await detectServices(this.domain);
        this.results.modules.services = {
          status: 'COMPLETED',
          data: services,
          time: Date.now() - startTime
        };
        
        if (verbose) console.log('✅ Services scan complete');
      }

      // 2. XSS Analysis
      if (!skipXSS) {
        console.log('🚨 Analyzing XSS vulnerabilities...');
        const xssResults = await analyzeXSSVulnerabilities(this.domain);
        this.results.modules.xss = {
          status: 'COMPLETED',
          data: xssResults,
          time: Date.now() - startTime
        };
        
        if (verbose) console.log('✅ XSS analysis complete');
      }

      // 3. SQL Injection Analysis
      if (!skipSQL) {
        console.log('🔍 Analyzing SQL injection vulnerabilities...');
        const sqlResults = await analyzeSQLInjectionRisks(this.domain);
        this.results.modules.sql = {
          status: 'COMPLETED',
          data: sqlResults,
          time: Date.now() - startTime
        };
        
        if (verbose) console.log('✅ SQL analysis complete');
      }

      // 4. Subdomain Enumeration
      if (!skipSubdomains) {
        console.log('🔎 Enumerating subdomains...');
        const subdomains = await enumerateSubdomains(this.domain);
        this.results.modules.subdomains = {
          status: 'COMPLETED',
          data: subdomains,
          time: Date.now() - startTime
        };
        
        if (verbose) console.log('✅ Subdomain enumeration complete');
      }

      // 5. Security Headers Analysis
      if (!skipHeaders) {
        console.log('🔐 Analyzing security headers...');
        const headers = await analyzeSecurityHeaders(this.domain);
        this.results.modules.headers = {
          status: 'COMPLETED',
          data: headers,
          time: Date.now() - startTime
        };
        
        if (verbose) console.log('✅ Headers analysis complete');
      }

      // Generate summary
      this.results.summary = this.generateSummary();
      this.results.scanStatus = 'COMPLETED';
      this.results.totalTime = Date.now() - startTime;

    } catch (error) {
      this.results.scanStatus = 'ERROR';
      this.results.error = error.message;
      console.error('❌ Scan failed:', error.message);
    }

    return this.results;
  }

  generateSummary() {
    const summary = {
      totalVulnerabilities: 0,
      vulnerabilityBreakdown: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      modulesRun: Object.keys(this.results.modules).length,
      overallRiskLevel: 'LOW',
      scanTime: this.results.totalTime || 0
    };

    // Count vulnerabilities from each module
    Object.entries(this.results.modules).forEach(([module, result]) => {
      if (result.data?.vulnerabilities) {
        summary.totalVulnerabilities += result.data.vulnerabilities.length;
        
        result.data.vulnerabilities.forEach(vuln => {
          if (vuln.severity) {
            summary.vulnerabilityBreakdown[vuln.severity]++;
          }
        });
      }
    });

    // Determine overall risk level
    if (summary.vulnerabilityBreakdown.CRITICAL > 0) {
      summary.overallRiskLevel = 'CRITICAL';
    } else if (summary.vulnerabilityBreakdown.HIGH > 2) {
      summary.overallRiskLevel = 'HIGH';
    } else if (summary.vulnerabilityBreakdown.HIGH > 0 || summary.vulnerabilityBreakdown.MEDIUM > 3) {
      summary.overallRiskLevel = 'MEDIUM';
    } else {
      summary.overallRiskLevel = 'LOW';
    }

    return summary;
  }

  getFullReport() {
    let report = `
╔════════════════════════════════════════════════════════════════════╗
║          UNIFIED SECURITY ASSESSMENT REPORT                        ║
║                    ${this.domain}                                   ║
╚════════════════════════════════════════════════════════════════════╝

Scan Date: ${this.results.timestamp}
Scan Status: ${this.results.scanStatus}
Total Time: ${(this.results.totalTime / 1000).toFixed(2)}s

───────────────────────────────────────────────────────────────────
EXECUTIVE SUMMARY
───────────────────────────────────────────────────────────────────
Total Vulnerabilities: ${this.results.summary.totalVulnerabilities}
Critical Issues: ${this.results.summary.vulnerabilityBreakdown.CRITICAL}
High Issues: ${this.results.summary.vulnerabilityBreakdown.HIGH}
Medium Issues: ${this.results.summary.vulnerabilityBreakdown.MEDIUM}
Low Issues: ${this.results.summary.vulnerabilityBreakdown.LOW}

OVERALL RISK LEVEL: ${this.getRiskLevelIndicator(this.results.summary.overallRiskLevel)} ${this.results.summary.overallRiskLevel}

───────────────────────────────────────────────────────────────────`;

    // Service Detection Report
    if (this.results.modules.services) {
      report += `
SERVICE DETECTION REPORT
───────────────────────────────────────────────────────────────────
Services Found: ${this.results.modules.services.data.services?.length || 0}
Issues: ${this.results.modules.services.data.issues?.length || 0}
`;
      if (this.results.modules.services.data.services) {
        this.results.modules.services.data.services.forEach(service => {
          report += `  • ${service.port}/${service.protocol}: ${service.status}\n`;
        });
      }
    }

    // XSS Report
    if (this.results.modules.xss) {
      report += `
XSS VULNERABILITY REPORT
───────────────────────────────────────────────────────────────────
${this.results.modules.xss.data.summary.totalVulnerabilities} vulnerabilities found
Severity: ${this.getVulnerabilitySeverityList(this.results.modules.xss.data.vulnerabilities)}
`;
    }

    // SQL Injection Report
    if (this.results.modules.sql) {
      report += `
SQL INJECTION REPORT
───────────────────────────────────────────────────────────────────
${this.results.modules.sql.data.summary.totalVulnerabilities} vulnerabilities found
Vulnerable Endpoints: ${this.results.modules.sql.data.summary.vulnerableEndpoints}
`;
    }

    // Subdomain Report
    if (this.results.modules.subdomains) {
      report += `
SUBDOMAIN ENUMERATION REPORT
───────────────────────────────────────────────────────────────────
Active Subdomains Found: ${this.results.modules.subdomains.data.foundSubdomains.length}
Coverage: ${this.results.modules.subdomains.data.analysis.percentageFound}%
`;
    }

    // Security Headers Report
    if (this.results.modules.headers) {
      report += `
SECURITY HEADERS REPORT
───────────────────────────────────────────────────────────────────
Security Score: ${this.results.modules.headers.data.securityScore}/100
Missing Headers: ${this.results.modules.headers.data.vulnerabilities.length}
`;
    }

    report += `

───────────────────────────────────────────────────────────────────
CRITICAL ISSUES TO ADDRESS IMMEDIATELY
───────────────────────────────────────────────────────────────────
`;

    const criticalIssues = this.getAllVulnerabelitiesBySeverity('CRITICAL').slice(0, 5);
    if (criticalIssues.length === 0) {
      report += 'None\n';
    } else {
      criticalIssues.forEach((issue, index) => {
        report += `${index + 1}. [${issue.module}] ${issue.issue}\n   → ${issue.recommendation}\n\n`;
      });
    }

    report += `

───────────────────────────────────────────────────────────────────
REMEDIATION ROADMAP
───────────────────────────────────────────────────────────────────

PHASE 1 - IMMEDIATE (Week 1):
${this.getRemediationPhase('CRITICAL')}

PHASE 2 - URGENT (Week 2-3):
${this.getRemediationPhase('HIGH').slice(0, 3)}

PHASE 3 - IMPORTANT (Week 4+):
${this.getRemediationPhase('MEDIUM').slice(0, 3)}

───────────────────────────────────────────────────────────────────
END OF REPORT
───────────────────────────────────────────────────────────────────
`;

    return report;
  }

  getRiskLevelIndicator(level) {
    const indicators = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢'
    };
    return indicators[level] || '⚪';
  }

  getVulnerabilitySeverityList(vulnerabilities) {
    if (!vulnerabilities) return 'N/A';
    const critical = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const high = vulnerabilities.filter(v => v.severity === 'HIGH').length;
    return `Critical: ${critical}, High: ${high}`;
  }

  getAllVulnerabelitiesBySeverity(severity) {
    const issues = [];
    
    Object.entries(this.results.modules).forEach(([module, result]) => {
      if (result.data?.vulnerabilities) {
        result.data.vulnerabilities
          .filter(v => v.severity === severity)
          .forEach(vuln => {
            issues.push({
              module: module.toUpperCase(),
              issue: vuln.type || vuln.issue || vuln.description,
              recommendation: vuln.recommendation,
              severity: severity
            });
          });
      }
    });

    return issues;
  }

  getRemediationPhase(severity) {
    const issues = this.getAllVulnerabelitiesBySeverity(severity);
    if (issues.length === 0) {
      return '  ✓ No issues in this severity level\n';
    }
    
    return issues.slice(0, 3).map((issue, index) => 
      `  ${index + 1}. ${issue.issue}\n     Recommendation: ${issue.recommendation}`
    ).join('\n') + '\n';
  }

  exportJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  exportCSV() {
    let csv = 'Module,Type,Severity,Description,Recommendation\n';
    
    Object.entries(this.results.modules).forEach(([module, result]) => {
      if (result.data?.vulnerabilities) {
        result.data.vulnerabilities.forEach(vuln => {
          csv += `${module.toUpperCase()},"${vuln.type || vuln.issue}","${vuln.severity}","${vuln.description || vuln.issue}","${vuln.recommendation}"\n`;
        });
      }
    });

    return csv;
  }
}

// Export convenience functions
export async function quickScan(domain) {
  const scanner = new UnifiedSecurityScanner(domain);
  return await scanner.runFullScan();
}

export async function fullScan(domain) {
  const scanner = new UnifiedSecurityScanner(domain);
  const results = await scanner.runFullScan();
  console.log(scanner.getFullReport());
  return results;
}
