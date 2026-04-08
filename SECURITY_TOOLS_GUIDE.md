# Security Tools Scanner - Complete User Guide

## 📋 Overview

You now have a complete suite of security scanning tools integrated into your project. NO APIs - pure frontend/Node.js tools that can run directly.

---

## 🛠️ Available Security Tools

### 1. **Port Scanner** (`tools-port-scanner.js`)

**Like nmap** - Scans for open ports and running services

```javascript
import { portScan, analyzeServices } from "./tools-port-scanner.js";

const results = await portScan("example.com");
// Results: open ports, services, vulnerabilities
```

**What it detects:**

- Open ports on common services (FTP, SSH, HTTP, HTTPS, DB ports, etc.)
- Dangerous services (Telnet, unencrypted FTP)
- Exposed databases (Redis, MongoDB, MySQL)
- Service vulnerabilities

**Ports scanned:** 21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017, 9200

---

### 2. **XSS Detector** (`tools-xss-detector.js`)

**Like xss-strike** - Tests for Cross-Site Scripting vulnerabilities

```javascript
import { xssScan, detectDOMXSSVulnerabilities } from "./tools-xss-detector.js";

const results = await xssScan("https://example.com", ["search", "q", "id"]);
// Tests 26 XSS payloads on each parameter
```

**What it detects:**

- Reflected XSS vulnerabilities
- DOM-based XSS
- Event handler injection
- Script tag injection
- Dangerous patterns in JavaScript code

**24 XSS payloads tested:**

- Basic script injections
- Event handlers (onclick, onerror, etc.)
- Data URIs
- HTML5 elements (audio, video, source, track)
- SVG-based XSS
- Encoded payloads

---

### 3. **SQL Injection Detector** (`tools-sql-injection.js`)

**Like sqlmap** - Tests for SQL injection vulnerabilities

```javascript
import { sqlScan, testDatabaseEnumeration } from "./tools-sql-injection.js";

const results = await sqlScan("https://example.com", [
  "id",
  "search",
  "filter",
]);
```

**What it detects:**

- UNION-based SQL injection
- Time-based blind SQL injection
- Boolean-based blind SQL injection
- Error-based SQL injection
- Stacked queries
- Database enumeration attempts

**Database systems identified:**

- MySQL
- PostgreSQL
- Microsoft SQL Server
- Oracle Database
- SQLite
- MongoDB

---

### 4. **Subdomain & Directory Enumeration** (`tools-enumeration.js`)

**Like sublist3r, dirsearch** - Discovers subdomains and hidden directories

```javascript
import {
  enumerateSubdomains,
  enumerateDirectories,
} from "./tools-enumeration.js";

const subdomains = await enumerateSubdomains("example.com");
const directories = await enumerateDirectories("https://example.com");
```

**Subdomains checked:** 50+ common subdomains (www, mail, api, admin, staging, etc.)

**Directories scanned:** 50+ common paths (admin, config, backup, .git, .env, uploads, etc.)

---

### 5. **Authentication & CSRF Security** (`tools-auth-security.js`)

**Detects auth and CSRF vulnerabilities**

```javascript
import {
  detectCSRFVulnerabilities,
  detectAuthenticationBypassAttempts,
} from "./tools-auth-security.js";

const csrfVulns = detectCSRFVulnerabilities(htmlContent);
const authBypass = detectAuthenticationBypassAttempts(htmlContent);
```

**What it detects:**

- Missing CSRF tokens on forms
- CSRF-vulnerable cookies (missing SameSite)
- Hardcoded credentials in code
- Default credentials
- Weak passwords
- Missing MFA
- Exposed OAuth tokens
- Insecure session cookies (missing HttpOnly, Secure)

---

## 🚀 Quick Start Usage

### Method 1: Full Automated Scan

```javascript
import { SecurityToolsScanner } from "./js/security-tools-scanner.js";

const scanner = new SecurityToolsScanner();
const results = await scanner.runFullScan("example.com");

// Get full report
const report = scanner.generateFullReport(results);
console.log(report);
```

### Method 2: Individual Tool Scans

```javascript
// Ports only
const ports = await scanner.runPortScan("example.com");

// XSS only
const xss = await scanner.runXSSScan("https://example.com");

// SQL injection only
const sql = await scanner.runSQLScan("https://example.com");

// Subdomains only
const subs = await scanner.runSubdomainEnum("example.com");

// Auth security only
const auth = await scanner.runAuthSecurity("https://example.com");
```

### Method 3: HTML Integration (Easy for UI)

```html
<!-- Add to your scanner page -->
<div class="scanner-interface">
  <input type="text" id="domain-input" placeholder="Enter domain" />
  <button onclick="quickSecurityScan()">Full Scan</button>
  <button onclick="scanPorts()">Port Scan</button>
  <button onclick="testXSS()">XSS Test</button>
  <button onclick="testSQLi()">SQL Test</button>
  <button onclick="enumSubdomains()">Subdomains</button>

  <div id="results-container"></div>
</div>

<script type="module">
  import {
    quickSecurityScan,
    scanPorts,
    testXSS,
    testSQLi,
    enumSubdomains,
  } from "./js/security-scanner-integration.js";

  window.quickSecurityScan = quickSecurityScan;
  window.scanPorts = scanPorts;
  window.testXSS = testXSS;
  window.testSQLi = testSQLi;
  window.enumSubdomains = enumSubdomains;
</script>
```

---

## 📊 Understanding Results

### Port Scan Results

```json
{
  "host": "example.com",
  "openPorts": [
    {
      "port": 443,
      "service": "HTTPS",
      "status": "OPEN"
    }
  ],
  "vulnerabilities": [
    {
      "port": 21,
      "service": "FTP",
      "severity": "HIGH",
      "issue": "Unencrypted file transfer",
      "recommendation": "Use SFTP/"
    }
  ]
}
```

### XSS Results

```json
{
  "vulnerabilities": [
    {
      "parameter": "search",
      "type": "SCRIPT_TAG",
      "severity": "CRITICAL",
      "payload": "<script>alert('XSS')</script>"
    }
  ]
}
```

### SQL Injection Results

```json
{
  "vulnerabilities": [
    {
      "parameter": "id",
      "type": "UNION_BASED",
      "severity": "CRITICAL",
      "indicator": "SQL Error Message Detected"
    }
  ]
}
```

### Summary

```json
{
  "totalVulnerabilities": 15,
  "critical": 5,
  "high": 7,
  "medium": 3,
  "scansCompleted": 6,
  "scansWithIssues": 4
}
```

---

## ⚙️ Configuration

### Adjust Scanner Settings

```javascript
const scanner = new SecurityToolsScanner({
  verbose: true, // Detailed logging
  timeout: 30000, // 30 second timeout per request
});
```

### Customize Scan Ports

Edit `tools-port-scanner.js` - modify `SCAN_PORTS` array:

```javascript
const SCAN_PORTS = [21, 22, 23, 25, 53, 80, 443, 8080, 8443];
```

### Add Custom XSS Payloads

Edit `tools-xss-detector.js` - add to `XSS_PAYLOADS` array:

```javascript
const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  "<!-- your custom payload -->",
];
```

### Customize SQL Injection Payloads

Edit `tools-sql-injection.js` - modify `SQL_PAYLOADS` array

### Add More Subdomains

Edit `tools-enumeration.js` - update `COMMON_SUBDOMAINS` array

---

## 💾 File Structure

```
js/
├── tools-port-scanner.js          # Port/service scanning
├── tools-xss-detector.js          # XSS vulnerability testing
├── tools-sql-injection.js         # SQLi testing
├── tools-enumeration.js           # Subdomain/directory discovery
├── tools-auth-security.js         # Auth & CSRF detection
├── security-tools-scanner.js      # Unified orchestrator
└── security-scanner-integration.js # UI integration
```

---

## 🚨 Alert System

The scanner automatically generates critical alerts:

```javascript
{
  alerts: [
    {
      level: "CRITICAL",
      message: "Unencrypted protocols detected (Telnet/FTP)",
      action: "Disable immediately or migrate to secure alternatives",
    },
    {
      level: "CRITICAL",
      message: "5 XSS vulnerabilities found",
      action: "Implement output encoding and CSP headers",
    },
  ];
}
```

---

## 📈 Report Generation

Generate comprehensive reports:

```javascript
// Full HTML report
const report = scanner.generateFullReport(results);

// Individual tool reports
const portReport = generatePortScanReport(portResults);
const xssReport = generateXSSReport(xssResults);
const sqlReport = generateSQLReport(sqlResults);
const authReport = generateAuthReport(csrfVulns, authBypass, sessionIssues);
```

---

## 🎯 Vulnerability Priority Matrix

### CRITICAL (Address within 24 hours)

- Open Telnet/FTP ports
- SQL injection vulnerabilities
- XSS vulnerabilities in critical parameters
- Hardcoded credentials
- Default credentials still active
- Exposed databases

### HIGH (Address within 1 week)

- Outdated TLS versions
- Missing security headers
- Weak password policies
- Missing CSRF tokens
- Exposed subdomains
- Missing MFA

### MEDIUM (Address within 1 month)

- Weak ciphers
- Information disclosure
- Missing security policies
- Undocumented endpoints

---

## 🔍 Example: Complete Workflow

```javascript
import { SecurityToolsScanner } from "./security-tools-scanner.js";

async function auditWebsite(domain) {
  const scanner = new SecurityToolsScanner({ verbose: true });

  // 1. Run full scan
  console.log("Starting scan...");
  const results = await scanner.runFullScan(domain);

  // 2. Check for critical issues
  if (results.summary.critical > 0) {
    console.log(`⚠️ CRITICAL: ${results.summary.critical} issues found!`);
    results.alerts.forEach((alert) => {
      if (alert.level === "CRITICAL") {
        console.log(`  - ${alert.message}`);
      }
    });
  }

  // 3. Generate report
  const report = scanner.generateFullReport(results);

  // 4. Export results
  const json = JSON.stringify(results, null, 2);
  saveToFile(`audit-${domain}-${Date.now()}.json`, json);

  // 5. Display to user
  displayReport(report);
}

// Run it
auditWebsite("example.com");
```

---

## ✅ Checklist: Implementation Steps

- [ ] Copy all `tools-*.js` files to `js/` directory
- [ ] Copy `security-tools-scanner.js` to `js/` directory
- [ ] Add HTML form for domain input
- [ ] Import and initialize scanner:
  ```javascript
  import { SecurityToolsScanner } from "./js/security-tools-scanner.js";
  ```
- [ ] Create button click handler for full scan
- [ ] Display results in UI
- [ ] Add export functionality
- [ ] Test with sample domains
- [ ] Deploy to production

---

## 🔒 Security & Best Practices

1. **Rate Limiting**: Implement limits on scan requests
2. **Authentication**: Require user login before scanning
3. **Logging**: Log all scans for audit trail
4. **Privacy**: Hash/encrypt domain names in storage
5. **Remediation**: Track fixes and re-scan to verify
6. **Reports**: Store reports securely

---

## 📞 Troubleshooting

**"Scan timeout"**

- Increase timeout in `SecurityToolsScanner` constructor
- Check internet connection
- Verify domain is accessible

**"Port scan returns nothing"**

- Make sure you have network access
- Some ports might be blocked by firewall
- Try scanning localhost for testing

**"XSS detection not working"**

- Verify URL is correct
- Check if site has CORS restrictions
- Some sites may block scanner User-Agent

**"No subdomains found"**

- Domain might not have public subdomains
- Check DNS records manually
- Add custom subdomains to test list

---

## 🎓 Learning More

- OWASP Top 10: https://owasp.org/Top10/
- CWE Top 25: https://cwe.mitre.org/top25/
- Web Security Academy: https://portswigger.net/web-security
- PortSwigger Burp: https://portswigger.net/burp

---

**Version:** 1.0  
**Created:** April 8, 2026  
**Status:** ✅ Ready to Use
