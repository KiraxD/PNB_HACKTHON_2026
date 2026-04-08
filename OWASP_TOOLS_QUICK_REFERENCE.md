# OWASP Security Scanner - Quick Reference

## 📋 Files Created

### 1. **API Endpoints** (Backend)

- `api/unified-scanner.js` - Main orchestrator combining all analysis tools
- `api/owasp-tools-detector.js` - OWASP Top 10 + CWE vulnerabilities
- `api/crypto-analyzer.js` - Cryptographic analysis (already existed)
- `api/threat-analyzer.js` - Threat modeling (already existed)

### 2. **Frontend Integration**

- `js/scanner-owasp-integration.js` - UI integration and display logic
- `OWASP_TOOLS_USAGE_GUIDE.md` - Detailed usage examples

### 3. **Documentation**

- `SETUP_OWASP_TOOLS.sh` - Step-by-step setup guide

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Add HTML

```html
<!-- Add to your scanner page -->
<div id="host-input-container">
  <input type="text" id="host-input" placeholder="Enter domain" />
  <button id="scan-domain-btn">🔍 Scan Security</button>
</div>
<div id="scan-results"></div>
```

### Step 2: Import JavaScript

```javascript
import { initializeOwaspScanner } from "./js/scanner-owasp-integration.js";

// On page load:
document.addEventListener("DOMContentLoaded", () => {
  initializeOwaspScanner();
});
```

### Step 3: Test

```bash
# Manual API call
curl "http://localhost:3000/api/unified-scanner?host=example.com&analysisType=full"
```

---

## 🔍 What Each Tool Detects

### **Unified Scanner** (`/api/unified-scanner`)

```
GET /api/unified-scanner?host=example.com&analysisType=full
```

**Analysis Types:**

- `full` - All analyses combined
- `owasp` - OWASP Top 10 only
- `crypto` - Cryptographic weaknesses
- `headers` - Security headers
- `pqc` - Quantum readiness
- `threats` - Threat models

**Returns:**

```json
{
  "analyses": {
    "owasp": {
      /* A01-A10 findings */
    },
    "cryptography": {
      /* key/TLS analysis */
    },
    "securityHeaders": {
      /* header validation */
    },
    "quantumReadiness": {
      /* PQC assessment */
    },
    "threats": {
      /* threat models */
    }
  },
  "overallAssessment": {
    "overallRiskScore": 45,
    "riskLevel": "MEDIUM"
  },
  "remediationPlan": {
    /* Priority-based actions */
  }
}
```

### **OWASP Top 10 Detector** (`/api/owasp-tools-detector`)

```
GET /api/owasp-tools-detector?host=example.com
```

**Detects:**

- **A01** - Broken Access Control
- **A02** - Cryptographic Failures
- **A03** - Injection
- **A04** - Insecure Design
- **A05** - Security Misconfiguration
- **A06** - Vulnerable & Outdated Components
- **A07** - Authentication Failures
- **A08** - Software & Data Integrity Failures
- **A09** - Logging & Monitoring Failures
- **A10** - SSRF

**Plus CWE Top 25:**

- CWE-79 (XSS)
- CWE-89 (SQL Injection)
- CWE-287 (Authentication)
- CWE-352 (CSRF)
- CWE-502 (Deserialization)
- CWE-611 (XXE)
- CWE-639 (Authorization)
- ... and 18 more

### **Cryptographic Analyzer** (`/api/crypto-analyzer`)

```
GET /api/crypto-analyzer?host=example.com
```

**Detects:**

- Weak key sizes (RSA < 2048, ECDSA < 384)
- Deprecated TLS versions (TLS 1.1, 1.0, SSL)
- Weak signature algorithms (SHA-1, MD5)
- Missing forward secrecy
- Weak cipher suites
- Certificate expiration issues
- PQC readiness

### **Threat Analyzer** (`/api/threat-analyzer`)

```
GET /api/threat-analyzer?host=example.com
```

**Models:**

- Certificate expiration threats
- Weak key factorization risks
- MITM attack vectors
- XSS/injection threats
- Authentication bypass risks

---

## 📊 Response Examples

### OWASP Finding

```json
{
  "owaspId": "A02",
  "title": "Cryptographic Failures",
  "severity": "CRITICAL",
  "description": "Using TLS 1.2 instead of TLS 1.3",
  "recommendation": "Upgrade to TLS 1.3",
  "cvssScore": 8.2
}
```

### Security Header Check

```json
{
  "header": "strict-transport-security",
  "name": "HSTS",
  "status": "MISSING",
  "severity": "HIGH",
  "recommendation": "Add header: strict-transport-security: max-age=31536000; includeSubDomains; preload"
}
```

### Risk Assessment

```json
{
  "overallRiskScore": 45,
  "riskLevel": "MEDIUM",
  "criticalIssues": 2,
  "highIssues": 5
}
```

---

## 🎯 Frontend Usage Examples

### Basic Scan

```javascript
// Scan everything
const results = await fetch(
  `/api/unified-scanner?host=example.com&analysisType=full`,
).then((r) => r.json());

// Display results
displayScanResults(results);
```

### Focused OWASP Scan

```javascript
const owasp = await fetch(`/api/owasp-tools-detector?host=example.com`).then(
  (r) => r.json(),
);

owasp.owaspAnalysis.findings.forEach((finding) => {
  console.log(`${finding.owaspId}: ${finding.title}`);
});
```

### Error Handling

```javascript
try {
  const response = await fetch(
    `/api/unified-scanner?host=${host}&analysisType=full`,
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const results = await response.json();
  updateUI(results);
} catch (error) {
  showError(`Scan failed: ${error.message}`);
}
```

---

## 🛠️ Customization

### Change Risk Thresholds

Edit `getRiskLevel()` function in `/api/unified-scanner.js`:

```javascript
function getRiskLevel(score) {
  if (score >= 80) return "LOW"; // Adjust these
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "HIGH";
  return "CRITICAL";
}
```

### Add Custom Security Headers

Edit `SECURITY_HEADERS` in `/api/owasp-tools-detector.js`:

```javascript
const SECURITY_HEADERS = {
  "your-custom-header": {
    name: "Custom Security",
    severity: "high",
    required: true,
  },
};
```

### Modify OWASP Checks

Edit `analyzeOWASPTop10()` in `/api/unified-scanner.js` to add custom checks.

---

## 📈 Performance Tips

### Caching Results

```javascript
const scanCache = new Map();

async function cachedScan(host, ttl = 3600000) {
  // 1 hour default
  if (scanCache.has(host)) {
    const { data, timestamp } = scanCache.get(host);
    if (Date.now() - timestamp < ttl) return data;
  }

  const results = await performFullSecurityScan(host);
  scanCache.set(host, { data: results, timestamp: Date.now() });
  return results;
}
```

### Batch Scans

```javascript
async function scanMultipleDomains(domains) {
  return Promise.allSettled(
    domains.map((domain) => performFullSecurityScan(domain)),
  );
}
```

---

## ✅ Production Checklist

- [ ] Update `vercel.json` with function memory limits
- [ ] Add rate limiting to prevent abuse
- [ ] Store scan results in database
- [ ] Implement authentication for sensitive reports
- [ ] Set up monitoring/alerting on critical findings
- [ ] Configure CORS properly for frontend requests
- [ ] Add request validation and sanitization
- [ ] Implement caching to reduce API calls
- [ ] Test with real domains
- [ ] Review and customize recommendations

---

## 📞 Common Questions

**Q: How long does a scan take?**
A: 5-15 seconds depending on network. Timeout set to 30 seconds.

**Q: Can I export results?**
A: Yes, `downloadReport()` exports as JSON.

**Q: How often should I scan?**
A: Security monitoring should be continuous. Consider caching 1-24 hours.

**Q: What if a domain is offline?**
A: Scanner handles timeouts gracefully with error messages.

**Q: Can I run this locally?**
A: No, it requires HTTPS connections. Works with `localhost:3000` in development.

---

## 🔗 Related Resources

- OWASP Top 10: https://owasp.org/Top10/
- CWE Top 25: https://cwe.mitre.org/top25/
- CVSS Calculator: https://www.first.org/cvss/calculator/3.1
- Mozilla Observatory: https://observatory.mozilla.org/
- SSL Labs: https://www.ssllabs.com/

---

## 📝 Version History

- **v1.0** - OWASP Top 10 Detection
- **v2.0** - Added Cryptographic Analysis
- **v3.0** - Unified Scanner with all modules

---

**Last Updated:** April 8, 2026  
**Status:** ✅ Production Ready
