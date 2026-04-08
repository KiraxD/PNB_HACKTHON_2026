# Practical Security Scanner - Complete Guide

## Overview

This is a **working, practical security scanner** that performs real vulnerability detection within browser constraints. Unlike theoretical implementations, this scanner uses:

- **HTTP-based analysis** (respects browser security)
- **Response pattern matching** (detects actual vulnerabilities)
- **Header analysis** (real security configuration)
- **Status code checking** (reliable enumeration)
- **Live DOM inspection** (actual XSS detection)

## Architecture

### Core Security Modules

#### 1. **Service Detection** (`tools-service-detection.js`)

Detects what services are running on the target domain.

**What it does:**

- Checks HTTP (port 80) and HTTPS (port 443)
- Tests alternate common ports: 8080, 8443, 3000, 5000, 9000
- Extracts server fingerprints from response headers
- Analyzes response times and availability
- Returns realistic service inventory

**Usage:**

```javascript
import { detectServices } from "./tools-service-detection.js";

const services = await detectServices("example.com");
console.log(services.services); // Array of detected services
console.log(services.issues); // Security issues found
```

**Output:**

```json
{
  "services": [
    {
      "port": 80,
      "protocol": "HTTP",
      "status": "OPEN",
      "responseTime": 145,
      "server": "nginx/1.18.0"
    }
  ],
  "issues": ["HTTP not redirecting to HTTPS"]
}
```

#### 2. **XSS Vulnerability Analysis** (`tools-xss-analyzer.js`)

Analyzes the page for XSS vulnerabilities.

**What it does:**

- Detects dangerous JavaScript patterns (innerHTML, eval, document.write)
- Checks for CSP header and its strength
- Analyzes inline event handlers
- Identifies missing security headers (X-XSS-Protection)
- Examines dangerous JavaScript functions in scripts

**Usage:**

```javascript
import { analyzeXSSVulnerabilities } from "./tools-xss-analyzer.js";

const results = await analyzeXSSVulnerabilities("example.com");
console.log(results.vulnerabilities); // Array of XSS issues
```

**Real Detection Examples:**

- `innerHTML` assignment without sanitization
- `eval()` function usage
- `javascript:` protocol in links
- Inline event handlers with unsanitized input

#### 3. **SQL Injection Analysis** (`tools-sql-analyzer.js`)

Detects SQL injection vulnerabilities through response analysis.

**What it does:**

- Checks for SQL error messages in responses
- Detects database technology disclosure
- Tests endpoints for SQL error patterns
- Identifies vulnerable parameter handling
- Detects database version information leaks

**Usage:**

```javascript
import { analyzeSQLInjectionRisks } from "./tools-sql-analyzer.js";

const results = await analyzeSQLInjectionRisks("example.com");
console.log(results.vulnerabilities); // SQL injection issues
```

**Real Detection Examples:**

- MySQL error messages visible
- PostgreSQL syntax errors shown
- Oracle error codes disclosed
- Query structure revealed in responses

#### 4. **Subdomain Enumeration** (`tools-subdomain-checker.js`)

Discovers active subdomains through HTTP status code analysis.

**What it does:**

- Tests 50+ common subdomains
- Uses HTTP status codes to determine if subdomain is alive
- Extracts technology stack from headers
- Identifies service purpose (API, admin, dev, etc.)
- Analyzes response times and redirects

**Usage:**

```javascript
import { enumerateSubdomains } from "./tools-subdomain-checker.js";

const results = await enumerateSubdomains("example.com");
console.log(results.foundSubdomains); // Array of active subdomains
```

**Output:**

```json
{
  "foundSubdomains": [
    {
      "subdomain": "api.example.com",
      "status": "OK - Service is active",
      "statusCode": 200,
      "technology": ["Node.js", "express"],
      "notes": ["API endpoint"]
    }
  ]
}
```

#### 5. **Security Headers Analysis** (`tools-security-headers.js`)

Analyzes HTTP security headers for proper configuration.

**What it does:**

- Checks HSTS (HTTP Strict Transport Security)
- Validates CSP (Content-Security-Policy)
- Examines X-Frame-Options
- Checks X-Content-Type-Options
- Analyzes cookie security flags
- Verifies security header completeness
- Generates security score (0-100)

**Usage:**

```javascript
import { analyzeSecurityHeaders } from "./tools-security-headers.js";

const results = await analyzeSecurityHeaders("example.com");
console.log(results.securityScore); // Security score: 0-100
```

**Security Score Breakdown:**

- HTTPS Enforced: 20 points
- HSTS Present: 15 points
- CSP Present: 15 points
- X-Frame-Options: 10 points
- X-Content-Type-Options: 10 points
- X-XSS-Protection: 5 points
- Other headers: 25 points

### Unified Scanner (`unified-security-scanner.js`)

Combines all five modules into a comprehensive security assessment.

**Usage:**

```javascript
import { UnifiedSecurityScanner } from "./unified-security-scanner.js";

const scanner = new UnifiedSecurityScanner("example.com");
const results = await scanner.runFullScan();

// Get detailed report
console.log(scanner.getFullReport());

// Export results
console.log(scanner.exportJSON()); // JSON format
console.log(scanner.exportCSV()); // CSV format
```

**Output Structure:**

```javascript
{
  domain: 'example.com',
  timestamp: '2024-01-15T10:30:00Z',
  scanStatus: 'COMPLETED',
  modules: {
    services: { status: 'COMPLETED', data: {...}, time: 1234 },
    xss: { status: 'COMPLETED', data: {...}, time: 2345 },
    sql: { status: 'COMPLETED', data: {...}, time: 1890 },
    subdomains: { status: 'COMPLETED', data: {...}, time: 5600 },
    headers: { status: 'COMPLETED', data: {...}, time: 1200 }
  },
  summary: {
    totalVulnerabilities: 12,
    vulnerabilityBreakdown: { CRITICAL: 1, HIGH: 3, MEDIUM: 6, LOW: 2 },
    overallRiskLevel: 'MEDIUM',
    scanTime: 12270
  }
}
```

### UI Integration (`security-scanner-ui.js`)

Provides dashboard integration for the scanner.

**HTML Requirements:**

```html
<div id="scanner-container">
  <input id="security-domain-input" type="text" placeholder="example.com" />
  <button id="security-scan-start">Start Scan</button>

  <div id="module-toggles">
    <label
      ><input type="checkbox" id="module-services" checked /> Services</label
    >
    <label
      ><input type="checkbox" id="module-xss" checked /> XSS Analysis</label
    >
    <label
      ><input type="checkbox" id="module-sql" checked /> SQL Injection</label
    >
    <label
      ><input type="checkbox" id="module-subdomains" checked />
      Subdomains</label
    >
    <label><input type="checkbox" id="module-headers" checked /> Headers</label>
  </div>

  <div id="scan-results"></div>

  <button id="export-json">Export JSON</button>
  <button id="export-csv">Export CSV</button>
</div>
```

**JavaScript Usage:**

```javascript
import SecurityScannerUI from "./security-scanner-ui.js";

const scannerUI = new SecurityScannerUI("#scanner-container");
// UI automatically handles events
```

**Features:**

- Real-time scan progress
- Module selection
- Results visualization
- Export to JSON/CSV
- Notification system

## Real Vulnerability Detection Examples

### XSS Detection

```javascript
// Real detection: innerHTML without sanitization
const html = "<script>user.innerHTML = userInput;</script>";
// → Detected: INNERHTML_ASSIGNMENT vulnerability

// Real detection: eval() usage
const code = "eval(userInput)";
// → Detected: EVAL_USAGE vulnerability (CRITICAL)
```

### SQL Injection Detection

```javascript
// Real detection: SQL error messages visible
const response = "You have an error in your SQL syntax";
// → Detected: MYSQL_ERROR_DISCLOSURE vulnerability

// Real detection: Database config exposed
const html = '<script>db_host = "192.168.1.1"</script>';
// → Detected: DATABASE_CONFIG_EXPOSURE vulnerability (CRITICAL)
```

### Subdomain Discovery

```javascript
// Real detection: HTTP status codes
await fetch("https://api.example.com"); // 200 OK
// → Found: api.example.com (active)

await fetch("https://admin.example.com"); // 401 Unauthorized
// → Found: admin.example.com (requires auth)

await fetch("https://random.example.com"); // Timeout
// → Not Found: random.example.com (doesn't exist)
```

### Security Headers

```javascript
// Real detection: Missing HSTS
const headers = response.headers;
if (!headers.get("strict-transport-security")) {
  // → Detected: MISSING_HSTS vulnerability
}

// Real detection: Weak CSP
if (headers.get("content-security-policy").includes("unsafe-inline")) {
  // → Detected: WEAK_CSP vulnerability
}
```

## Integration with Dashboard

### Adding to Dashboard

```javascript
// 1. Import the UI component
import SecurityScannerUI from "./security-scanner-ui.js";

// 2. Add HTML element
// (See HTML Requirements above)

// 3. Initialize automatically on page load
// (Happens automatically if #scanner-container exists)

// 4. Or manually initialize
const scanner = new SecurityScannerUI("#scanner-container");
```

### Getting Scan Results Programmatically

```javascript
// Access results from UI instance
const results = window.securityScannerUI.scanResults;
const scanner = window.securityScannerUI.currentScan;

// Print full report
console.log(scanner.getFullReport());

// Get vulnerabilities by severity
const criticalIssues = scanner.getAllVulnerabelitiesBySeverity("CRITICAL");
```

## Best Practices

### 1. Domain Input

- Include protocol if needed: `https://example.com`
- Handles both HTTP and HTTPS automatically
- Works with subdomains

### 2. Module Selection

- Run all modules for comprehensive scan
- Skip modules for faster scans if needed
- Subdomain enumeration takes longest

### 3. Interpreting Results

- **CRITICAL**: Address immediately
- **HIGH**: Address within 1 week
- **MEDIUM**: Address within 1 month
- **LOW**: Address during maintenance

### 4. Remediation

- Use recommended fixes provided
- Security headers are easiest to implement
- Code changes needed for XSS/SQL issues

## Performance Metrics

Typical scan times:

- Service Detection: 1-2 seconds
- XSS Analysis: 2-3 seconds
- SQL Injection: 1-2 seconds
- Subdomains: 5-10 seconds (tests 50 subdomains)
- Security Headers: 1-2 seconds

**Total: 10-20 seconds per domain**

## Browser Compatibility

Works on all modern browsers that support:

- `fetch()` API
- ES6 modules
- Promise/async-await
- DOM manipulation

Tested on:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Known Limitations

1. **CORS Policy**: Cannot scan private networks or CORS-blocked domains
2. **Rate Limiting**: May be rate-limited by target domain
3. **Timeouts**: Long-running scans may timeout
4. **Subdomains**: Only tests known common subdomains (50+)

## Troubleshooting

### "Failed to fetch" error

- Domain might be down
- Check if domain is accessible
- Verify CORS settings

### No vulnerabilities found

- Domain might have good security
- Some tools might be blocked
- Try refreshing and scanning again

### Scan taking too long

- Skip subdomain module for faster scan
- Check internet connection
- Try again later

## Future Enhancements

- [ ] Real-time response analysis
- [ ] WebSocket testing
- [ ] DNS enumeration
- [ ] SSL certificate analysis
- [ ] API endpoint discovery
- [ ] Custom payload support
- [ ] Scheduled scans
- [ ] Scan history tracking

---

**Made with ❤️ for practical security testing**
