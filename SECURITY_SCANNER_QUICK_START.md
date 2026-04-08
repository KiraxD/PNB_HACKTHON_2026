# Security Scanner Integration - Quick Start

## ✅ What Was Completed

### 1. **Practical Security Modules Created**

- `tools-service-detection.js` - HTTP-based service detection on ports 80, 443, 8080, 8443, 3000, 5000, 9000
- `tools-xss-analyzer.js` - Detects XSS vulnerabilities through code pattern analysis
- `tools-sql-analyzer.js` - Identifies SQL injection risks via response analysis
- `tools-subdomain-checker.js` - Enumerates subdomains using HTTP status codes
- `tools-security-headers.js` - Analyzes security headers with scoring (0-100)

### 2. **Orchestration Layer**

- `unified-security-scanner.js` - Combines all 5 modules with summary generation
- `pages-security-scanner.js` - Dashboard UI for the scanner
- `security-scanner-ui.js` - Reusable UI component

### 3. **Dashboard Integration**

- Added "Security Scanner" navigation item to dashboard.html
- Registered page in app.js routing system
- Included all necessary script modules

## 🚀 How to Use

### Access from Dashboard

1. Open the dashboard: `dashboard.html`
2. Click **"Security Scanner"** in the left sidebar (🔐 icon)
3. Enter target domain (e.g., `example.com`)
4. Select which modules to run (all checked by default)
5. Click **"▶ SCAN"** button

### What Each Module Does

**📡 Service Detection (1-2 sec)**

- Checks HTTP/HTTPS availability
- Tests alternate ports
- Extracts server headers
- Returns service fingerprint

**🚨 XSS Analysis (2-3 sec)**

- Scans for `innerHTML` assignments
- Detects `eval()` function usage
- Checks CSP header strength
- Identifies inline event handlers
- Finds security header gaps

**🔍 SQL Injection (1-2 sec)**

- Checks for SQL error messages
- Detects database info disclosure
- Tests endpoints for SQLi patterns
- Identifies response anomalies

**🔎 Subdomain Enumeration (5-10 sec)**

- Tests 50+ common subdomains
- Uses HTTP status codes for detection
- Identifies service purposes
- Extracts technology stack

**🔐 Security Headers (1-2 sec)**

- Validates HSTS, CSP, CORS headers
- Checks cookie security flags
- Tests X-Frame-Options
- Scores security posture (0-100)

**Total Typical Runtime: 10-20 seconds**

## 📊 Understanding Results

### Risk Levels

- 🔴 **CRITICAL**: Address immediately (direct breach possible)
- 🟠 **HIGH**: Address within 1 week (significant exposure)
- 🟡 **MEDIUM**: Address within 1 month (moderate risk)
- 🟢 **LOW**: Address during maintenance (minor issue)

### Remediation Example

If XSS shows:

```
INNERHTML_ASSIGNMENT (HIGH)
Found innerHTML assignments without sanitization
✓ Fix: Use textContent or sanitize with DOMPurify
```

Then in code:

```javascript
// Before (vulnerable)
user.innerHTML = userInput;

// After (safe)
user.textContent = userInput; // Or use DOMPurify.sanitize()
```

## 💾 Export Results

Click export buttons at top:

- **PDF**: Full formatted report
- **JSON**: Machine-readable format
- **CSV**: Spreadsheet format

Example JSON exports to: `security-scan-example.com-1712670123456.json`

Example CSV exports to: `security-scan-example.com-1712670123456.csv`

## 🧪 Testing

### Test The Scanner Locally

```bash
# Open browser console on dashboard.html

# Quick test
await QSR.security.startScan('example.com');

# Get results
console.log(window.QSR.security.scanResults);

# Export
QSR.security.exportResults('json');
```

### Test Individual Modules

```javascript
// Import scanner
import { UnifiedScanner } from "./js/unified-security-scanner.js";

// Create instance
const scanner = new UnifiedSecurityScanner("example.com");

// Run full scan
const results = await scanner.runFullScan();

// Get report
console.log(scanner.getFullReport());

// Export
console.log(scanner.exportJSON());
console.log(scanner.exportCSV());
```

## 🔧 Troubleshooting

### "Failed to fetch" Error

**Cause**: Domain unreachable or CORS blocked
**Fix**: Verify domain is accessible, check CORS settings

### No Vulnerabilities Found

**Possible Reasons**:

- Domain has good security practices
- All modules disabled
- Domain not fully scanned
  **Solution**: Re-run scan, enable all modules

### Scan Takes Too Long

**Cause**: Subdomain enumeration tests 50+ domains
**Fix**: Uncheck "Subdomains" module for faster scan

### Results Not Displaying

**Cause**: Browser console errors
**Solution**:

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Verify scanner modules are loaded
4. Reload page and try again

## 📋 Module Capabilities

### Service Detection Results

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
  ]
}
```

### XSS Vulnerabilities

- innerHTML without sanitization
- eval() function usage
- document.write() calls
- javascript: protocol usage
- Inline event handlers with user input

### SQL Injection Indicators

- MySQL/PostgreSQL/Oracle error messages
- Database configuration exposure
- Query structure revelation
- Response pattern anomalies

### Subdomain Results

Active subdomains with:

- HTTP status code
- Response time
- Technology stack
- Identified purpose
- Security implications

### Security Headers Score

- 0-30: Critical issues
- 31-60: Multiple gaps
- 61-80: Good baseline
- 81-100: Excellent security

## 🚀 Advanced Features

### Custom Scan Options

```javascript
const scanner = new UnifiedSecurityScanner("example.com");

// Skip specific modules
const results = await scanner.runFullScan({
  skipServices: false,
  skipXSS: false,
  skipSQL: false,
  skipSubdomains: false,
  skipHeaders: false,
  verbose: true, // Console logging
});
```

### Get Vulnerabilities by Severity

```javascript
const critical = scanner.getAllVulnerabelitiesBySeverity("CRITICAL");
const high = scanner.getAllVulnerabelitiesBySeverity("HIGH");

// Use for prioritization
critical.forEach((issue) => console.log(issue));
```

### Generate Full Report

```javascript
const fullReport = scanner.getFullReport();
console.log(fullReport);
// Contains: summary, vulnerabilities, remediation roadmap
```

## 📁 File Structure

```
js/
├── tools-service-detection.js         # Service detection module
├── tools-xss-analyzer.js              # XSS vulnerability detection
├── tools-sql-analyzer.js              # SQL injection analysis
├── tools-subdomain-checker.js         # Subdomain enumeration
├── tools-security-headers.js          # Security headers analysis
├── unified-security-scanner.js        # Orchestration layer
├── security-scanner-ui.js             # Standalone UI component
└── pages-security-scanner.js          # Dashboard integration

dashboard.html                          # Updated with scanner navigation
app.js                                  # Updated routing

PRACTICAL_SECURITY_SCANNER.md           # Technical documentation
SECURITY_SCANNER_QUICK_START.md         # This file
```

## ✨ Key Features

✅ **Real Security Analysis** - Not theoretical, actual vulnerability detection
✅ **Browser Compatible** - Works in all modern browsers, no special setup
✅ **Fast Scanning** - 10-20 seconds for comprehensive assessment
✅ **Detailed Reports** - Specific recommendations, not just warnings
✅ **Export Options** - JSON, CSV, and HTML formats
✅ **Visual Dashboard** - Integration with existing QSecure Radar interface
✅ **Modular** - Use individual modules or run complete scan

## 🎯 Next Steps

1. **Access Dashboard**: Open `dashboard.html`
2. **Navigate to Scanner**: Click "Security Scanner" in sidebar
3. **Enter Target Domain**: e.g., `pwn.example.com`
4. **Start Scan**: Click "▶ SCAN" button
5. **Review Results**: Check for CRITICAL and HIGH items first
6. **Export Report**: Save findings for documentation
7. **Remediate**: Use recommendations to fix issues

---

**Ready to scan?** Navigate to the Security Scanner page in the dashboard and start analyzing!
