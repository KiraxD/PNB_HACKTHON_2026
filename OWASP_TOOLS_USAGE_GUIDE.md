/\*\*

- OWASP Security Scanner - COMPLETE USAGE GUIDE
-
- This guide shows how to integrate and use all security analysis tools
- in your vulnerability scanner project.
-
- Available Endpoints:
- 1.  /api/unified-scanner - Full security analysis
- 2.  /api/owasp-tools-detector - OWASP Top 10 detection
- 3.  /api/crypto-analyzer - Cryptographic vulnerability analysis
- 4.  /api/threat-analyzer - Threat model analysis
      \*/

// ============================================================================
// EXAMPLE 1: FRONTEND USAGE - Basic Security Scan
// ============================================================================

// File: js/pages-scanner.js or similar

export async function performSecurityScan(host) {
try {
// Full scan with all analysis modules
const response = await fetch(
`/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=full`
);

    const data = await response.json();

    if (!response.ok) {
      showError(`Scan failed: ${data.error}`);
      return null;
    }

    // Process and display results
    displayScanResults(data.results);
    return data.results;

} catch (error) {
showError(`Error performing scan: ${error.message}`);
}
}

// ============================================================================
// EXAMPLE 2: FOCUSED SCANS - Analyze specific aspects
// ============================================================================

export async function performOWASPScan(host) {
// OWASP Top 10 analysis only
const response = await fetch(
`/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=owasp`
);
return response.json();
}

export async function performCryptoScan(host) {
// Cryptographic vulnerability analysis only
const response = await fetch(
`/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=crypto`
);
return response.json();
}

export async function performQuantumAssessment(host) {
// Post-Quantum Cryptography readiness
const response = await fetch(
`/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=pqc`
);
return response.json();
}

export async function performThreatAnalysis(host) {
// Threat model and risk assessment
const response = await fetch(
`/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=threats`
);
return response.json();
}

// ============================================================================
// EXAMPLE 3: DISPLAYING RESULTS IN UI
// ============================================================================

function displayScanResults(results) {
// Display OWASP findings
if (results.analyses.owasp) {
displayOWASPFindings(results.analyses.owasp);
}

// Display cryptography analysis
if (results.analyses.cryptography) {
displayCryptoAnalysis(results.analyses.cryptography);
}

// Display security headers
if (results.analyses.securityHeaders) {
displayHeadersAnalysis(results.analyses.securityHeaders);
}

// Display quantum readiness
if (results.analyses.quantumReadiness) {
displayQuantumReadiness(results.analyses.quantumReadiness);
}

// Display threat assessment
if (results.analyses.threats) {
displayThreats(results.analyses.threats);
}

// Display overall risk
displayOverallRisk(results.overallAssessment);

// Display remediation plan
displayRemediationPlan(results.remediationPlan);
}

function displayOWASPFindings(owaspAnalysis) {
const container = document.getElementById('owasp-findings');
if (!container) return;

let html = `     <div class="analysis-section">
      <h3>OWASP Top 10 Analysis</h3>
      <div class="finding-summary">
        <span class="badge badge-critical">${owaspAnalysis.findings.filter(f => f.severity === 'CRITICAL').length} Critical</span>
        <span class="badge badge-high">${owaspAnalysis.findings.filter(f => f.severity === 'HIGH').length} High</span>
        <span class="badge badge-medium">${owaspAnalysis.findings.filter(f => f.severity === 'MEDIUM').length} Medium</span>
      </div>
      <div class="compliance-status">
        Compliance Level: <strong>${owaspAnalysis.complianceLevel}</strong>
      </div>
  `;

// Display each finding
owaspAnalysis.findings.forEach(finding => {
html += `      <div class="finding finding-${finding.severity.toLowerCase()}">
        <div class="finding-header">
          <span class="finding-id">${finding.owaspId}</span>
          <h4>${finding.title}</h4>
          <span class="finding-cvss">CVSS: ${finding.cvssScore}</span>
        </div>
        <div class="finding-body">
          <p><strong>Description:</strong> ${finding.description || ''}</p>
          ${finding.issues ?`<p><strong>Issues:</strong> ${finding.issues.join(', ')}</p>`: ''}
          <p><strong>Recommendation:</strong> ${finding.recommendation}</p>
        </div>
      </div>
   `;
});

html += '</div>';
container.innerHTML = html;
}

function displayCryptoAnalysis(cryptoAnalysis) {
const container = document.getElementById('crypto-analysis');
if (!container) return;

let html = `     <div class="analysis-section">
      <h3>Cryptographic Analysis</h3>
      <div class="crypto-details">
        <div class="detail-row">
          <span class="label">Key Algorithm:</span>
          <span class="value">${cryptoAnalysis.keyAlgorithm} (${cryptoAnalysis.keyBits}-bit)</span>
        </div>
        <div class="detail-row">
          <span class="label">TLS Version:</span>
          <span class="value ${cryptoAnalysis.tlsVersion === 'TLSv1.3' ? 'good' : 'warning'}">${cryptoAnalysis.tlsVersion}</span>
        </div>
        <div class="detail-row">
          <span class="label">Cipher Suite:</span>
          <span class="value">${cryptoAnalysis.cipherSuite}</span>
        </div>
        <div class="detail-row">
          <span class="label">Crypto Score:</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${cryptoAnalysis.cryptoScore}%"></div>
            <span class="progress-text">${cryptoAnalysis.cryptoScore}/100</span>
          </div>
        </div>
      </div>
  `;

// Display issues
if (cryptoAnalysis.issues.length > 0) {
html += '<div class="issues"><h4>Issues Found:</h4>';
cryptoAnalysis.issues.forEach(issue => {
html += `        <div class="issue issue-${issue.severity.toLowerCase()}">
          <strong>${issue.type}</strong>: ${issue.description || issue.impact}
          ${issue.recommendation ?`<br><small>Recommendation: ${issue.recommendation}</small>`: ''}
        </div>
     `;
});
html += '</div>';
}

// Display strengths
if (cryptoAnalysis.strengths.length > 0) {
html += '<div class="strengths"><h4>Strengths:</h4>';
cryptoAnalysis.strengths.forEach(strength => {
html += `<div class="strength"><strong>${strength.type}</strong>: ${strength.rating}</div>`;
});
html += '</div>';
}

html += '</div>';
container.innerHTML = html;
}

function displayHeadersAnalysis(headersAnalysis) {
const container = document.getElementById('headers-analysis');
if (!container) return;

let html = `     <div class="analysis-section">
      <h3>Security Headers Analysis</h3>
      <div class="headers-summary">
        <span class="badge badge-success">${headersAnalysis.presentHeaders} Present</span>
        <span class="badge badge-danger">${headersAnalysis.missingHeaders} Missing</span>
      </div>
      <table class="headers-table">
        <thead>
          <tr>
            <th>Header</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
  `;

headersAnalysis.analysis.forEach(header => {
const statusClass = header.status === 'PRESENT' ? 'success' : 'danger';
html += `      <tr class="header-row header-${header.status.toLowerCase()}">
        <td class="header-name">${header.name}</td>
        <td class="header-status"><span class="badge badge-${statusClass}">${header.status}</span></td>
        <td class="header-action">
          ${header.status === 'MISSING' ?`
<button class="btn-small" onclick="copyToClipboard('${header.header}')">
Add Header
</button>
`:`<span class="value-preview">${header.value.substring(0, 50)}...</span>`}
        </td>
      </tr>
    `;
});

html += `         </tbody>
      </table>
    </div>
  `;

container.innerHTML = html;
}

function displayQuantumReadiness(quantumAnalysis) {
const container = document.getElementById('quantum-readiness');
if (!container) return;

const levelColor = {
'READY': '#28a745',
'DEVELOPING': '#ffc107',
'NEEDS_WORK': '#dc3545'
};

let html = `     <div class="analysis-section">
      <h3>Post-Quantum Cryptography Readiness</h3>
      <div class="readiness-meter">
        <div class="meter-background">
          <div class="meter-fill" style="width: ${quantumAnalysis.readinessScore}%; background-color: ${levelColor[quantumAnalysis.level]}"></div>
        </div>
        <div class="meter-label">
          <strong>${quantumAnalysis.readinessScore}%</strong> - ${quantumAnalysis.level}
        </div>
      </div>
  `;

if (quantumAnalysis.estimatedQuantumBreakDate) {
const breakDate = new Date(quantumAnalysis.estimatedQuantumBreakDate);
html += `<p class="warning">Estimated quantum break date: <strong>${breakDate.toLocaleDateString()}</strong></p>`;
}

html += '<div class="recommendations"><h4>Recommendations:</h4><ul>';
quantumAnalysis.recommendations.forEach(rec => {
html += `<li>${rec}</li>`;
});
html += '</ul></div></div>';

container.innerHTML = html;
}

function displayThreats(threatAnalysis) {
const container = document.getElementById('threat-analysis');
if (!container) return;

let html = `     <div class="analysis-section">
      <h3>Threat Model Assessment</h3>
      <div class="threat-summary">
        <span class="badge badge-${threatAnalysis.threatLevel.toLowerCase()}">${threatAnalysis.threatLevel}</span>
        <span class="threat-count">${threatAnalysis.threatCount} Threats Identified</span>
      </div>
  `;

if (threatAnalysis.threats.length > 0) {
html += '<div class="threats-list">';
threatAnalysis.threats.forEach(threat => {
html += `        <div class="threat threat-${threat.severity.toLowerCase()}">
          <strong>${threat.threatType}</strong>
          <p>${threat.impact}</p>
          ${threat.recommendation ?`<p><em>Mitigation: ${threat.recommendation}</em></p>`: ''}
        </div>
     `;
});
html += '</div>';
}

html += '</div>';
container.innerHTML = html;
}

function displayOverallRisk(riskAssessment) {
const container = document.getElementById('overall-risk');
if (!container) return;

const riskColors = {
'LOW': '#28a745',
'MEDIUM': '#ffc107',
'HIGH': '#fd7e14',
'CRITICAL': '#dc3545'
};

let html = `     <div class="risk-card risk-${riskAssessment.riskLevel.toLowerCase()}">
      <h2>Overall Risk Assessment</h2>
      <div class="risk-score">
        <div class="score-circle" style="background-color: ${riskColors[riskAssessment.riskLevel]}">
          <span class="score-number">${riskAssessment.overallRiskScore}</span>
          <span class="score-label">/100</span>
        </div>
        <div class="risk-level-text">
          <h3>${riskAssessment.riskLevel}</h3>
          <p>${riskAssessment.criticalIssues} Critical | ${riskAssessment.highIssues} High Issues</p>
        </div>
      </div>
    </div>
  `;

container.innerHTML = html;
}

function displayRemediationPlan(remediationPlan) {
const container = document.getElementById('remediation-plan');
if (!container) return;

let html = '<div class="analysis-section"><h3>Remediation Plan</h3>';

Object.entries(remediationPlan).forEach(([priority, section]) => {
html += `       <div class="remediation-priority">
        <div class="priority-header">
          <h4>${section.timeframe}</h4>
        </div>
        <ul class="action-list">
    `;

    section.actions.forEach(action => {
      html += `<li>${action}</li>`;
    });

    html += '</ul></div>';

});

html += '</div>';
container.innerHTML = html;
}

// ============================================================================
// EXAMPLE 4: QUICK SCAN FUNCTION - All-in-one usage
// ============================================================================

export async function quickSecurityAssessment(host) {
console.log(`🔍 Starting security assessment for ${host}...`);

try {
// Start scan
const results = await fetch(
`/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=full`
).then(r => r.json());

    // Create assessment report
    const report = {
      host: host,
      timestamp: new Date().toISOString(),
      riskScore: results.overallAssessment.overallRiskScore,
      riskLevel: results.overallAssessment.riskLevel,
      criticalIssues: results.overallAssessment.criticalIssues,
      owaspFindings: results.analyses.owasp.findingCount,
      remediationActions: results.remediationPlan
    };

    // Log summary
    console.log(`
      ✅ Scan Complete
      Risk Score: ${report.riskScore}/100 (${report.riskLevel})
      Critical Issues: ${report.criticalIssues}
      OWASP Findings: ${report.owaspFindings}
    `);

    return report;

} catch (error) {
console.error('Scan failed:', error);
return null;
}
}

// ============================================================================
// EXAMPLE 5: INTEGRATION WITH EXISTING SCANNER
// ============================================================================

// File: js/scanner-addons.js or integration file

export const SecurityAnalysisTools = {
// Tool definitions for frontend integration
tools: [
{
id: 'crypto-analysis',
name: 'Cryptographic Analysis',
icon: '🔐',
endpoint: 'crypto-analyzer',
description: 'Analyze certificate strength, TLS version, and cipher suites'
},
{
id: 'owasp-top-10',
name: 'OWASP Top 10',
icon: '⚠️',
endpoint: 'owasp-tools-detector',
description: 'Detect OWASP Top 10 vulnerabilities'
},
{
id: 'threat-model',
name: 'Threat Assessment',
icon: '🎯',
endpoint: 'threat-analyzer',
description: 'Identify security threats and risks'
},
{
id: 'quantum-ready',
name: 'Quantum Readiness',
icon: '⚛️',
endpoint: 'unified-scanner?analysisType=pqc',
description: 'Assess post-quantum cryptography readiness'
}
],

// Run all tools
async runAllTools(host) {
const results = {};
for (const tool of this.tools) {
try {
const response = await fetch(`/api/${tool.endpoint}&host=${host}`);
results[tool.id] = await response.json();
} catch (error) {
results[tool.id] = { error: error.message };
}
}
return results;
}
};

// ============================================================================
// EXAMPLE 6: API ENDPOINT REGISTRATION (vercel.json)
// ============================================================================

/\*
Add these to vercel.json for API route mapping:

{
"functions": {
"api/unified-scanner.js": {
"memory": 3008,
"maxDuration": 30
},
"api/owasp-tools-detector.js": {
"memory": 3008,
"maxDuration": 30
},
"api/crypto-analyzer.js": {
"memory": 3008,
"maxDuration": 30
},
"api/threat-analyzer.js": {
"memory": 3008,
"maxDuration": 30
}
}
}
\*/

// ============================================================================
// EXAMPLE 7: ERROR HANDLING & RECOVERY
// ============================================================================

export async function robustSecurityScan(host, retries = 3) {
for (let attempt = 1; attempt <= retries; attempt++) {
try {
const response = await fetch(
`/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=full`,
{ timeout: 30000 }
);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.warn(`Attempt ${attempt}/${retries} failed:`, error);

      if (attempt < retries) {
        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      } else {
        throw new Error(`Scan failed after ${retries} attempts: ${error.message}`);
      }
    }

}
}

// ============================================================================
// SUMMARY: QUICK START
// ============================================================================

/\*
QUICK START GUIDE:

1. Add API files to /api directory:
   - unified-scanner.js
   - owasp-tools-detector.js
   - crypto-analyzer.js
   - threat-analyzer.js

2. Update frontend scanning code:
   import { performSecurityScan } from './js/scanner-addons.js';

   // Run full scan
   const results = await performSecurityScan('example.com');

3. Display results:
   displayScanResults(results);

4. Available analysis types:
   - 'full' - All analysis modules
   - 'owasp' - OWASP Top 10 only
   - 'crypto' - Cryptography analysis only
   - 'headers' - Security headers only
   - 'pqc' - Quantum readiness only
   - 'threats' - Threat model only

5. Access results:
   - results.analyses.owasp
   - results.analyses.cryptography
   - results.analyses.securityHeaders
   - results.analyses.quantumReadiness
   - results.analyses.threats
   - results.overallAssessment
   - results.remediationPlan
     \*/
