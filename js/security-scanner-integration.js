/**
 * Security Tools Scanner - Integration Guide
 * How to use the security tools in your scanner interface
 */

import { SecurityToolsScanner } from './security-tools-scanner.js';

// Initialize scanner
const scanner = new SecurityToolsScanner({
  verbose: true,
  timeout: 30000
});

/**
 * USAGE 1: Quick scan from UI button
 */
export async function quickSecurityScan() {
  const domain = document.getElementById('domain-input')?.value;
  
  if (!domain) {
    showError('Please enter a domain');
    return;
  }

  try {
    showLoadingState('Starting comprehensive security scan...');
    
    const results = await scanner.runFullScan(domain);
    
    displayScanResults(results);
    showSuccess('Scan completed!');
    
  } catch (error) {
    showError(`Scan failed: ${error.message}`);
  }
}

/**
 * USAGE 2: Individual tool scans
 */

// Port scanning only
export async function scanPorts() {
  const domain = document.getElementById('domain-input')?.value;
  if (!domain) return;

  try {
    const results = await scanner.runPortScan(domain);
    displayPortResults(results);
  } catch (error) {
    showError(error.message);
  }
}

// XSS testing only
export async function testXSS() {
  const domain = document.getElementById('domain-input')?.value;
  if (!domain) return;

  try {
    const results = await scanner.runXSSScan(`https://${domain}`);
    displayXSSResults(results);
  } catch (error) {
    showError(error.message);
  }
}

// SQL injection testing only
export async function testSQLi() {
  const domain = document.getElementById('domain-input')?.value;
  if (!domain) return;

  try {
    const results = await scanner.runSQLScan(`https://${domain}`);
    displaySQLResults(results);
  } catch (error) {
    showError(error.message);
  }
}

// Subdomain enumeration only
export async function enumSubdomains() {
  const domain = document.getElementById('domain-input')?.value;
  if (!domain) return;

  try {
    const results = await scanner.runSubdomainEnum(domain);
    displaySubdomainResults(results);
  } catch (error) {
    showError(error.message);
  }
}

/**
 * DISPLAY FUNCTIONS
 */

function displayScanResults(results) {
  const container = document.getElementById('results-container');
  if (!container) return;

  let html = `
    <div class="scan-results">
      <div class="results-header">
        <h2>Security Scan Results</h2>
        <p>Target: <strong>${results.target}</strong></p>
        <p>Scanned: ${new Date(results.timestamp).toLocaleString()}</p>
      </div>

      <div class="summary-card">
        <h3>Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Total Vulnerabilities</span>
            <span class="value critical">${results.summary.totalVulnerabilities}</span>
          </div>
          <div class="summary-item">
            <span class="label">Critical</span>
            <span class="value critical">${results.summary.critical}</span>
          </div>
          <div class="summary-item">
            <span class="label">High</span>
            <span class="value high">${results.summary.high}</span>
          </div>
          <div class="summary-item">
            <span class="label">Medium</span>
            <span class="value medium">${results.summary.medium}</span>
          </div>
        </div>
      </div>

      <div class="alerts-section">
        <h3>Critical Alerts</h3>
  `;

  results.alerts.forEach(alert => {
    const alertClass = alert.level.toLowerCase();
    html += `
      <div class="alert alert-${alertClass}">
        <strong>[${alert.level}]</strong> ${alert.message}
        <p>Action: ${alert.action}</p>
      </div>
    `;
  });

  html += '</div>';

  // Port Scan Results
  if (results.scans.portScan) {
    html += `
      <div class="scan-section">
        <h3>🔍 Port Scan Results</h3>
        <p>Open Ports: ${results.scans.portScan.summary?.openCount || 0}</p>
        <ul>
    `;
    (results.scans.portScan.openPorts || []).forEach(port => {
      html += `<li>Port ${port.port}: ${port.service}</li>`;
    });
    html += '</ul></div>';
  }

  // Subdomain Results
  if (results.scans.subdomainEnum) {
    html += `
      <div class="scan-section">
        <h3>🌐 Subdomain Enumeration</h3>
        <p>Alive Subdomains: ${results.scans.subdomainEnum.summary?.alive || 0}</p>
        <ul>
    `;
    (results.scans.subdomainEnum.aliveSubdomains || []).forEach(sub => {
      html += `<li>${sub}</li>`;
    });
    html += '</ul></div>';
  }

  // XSS Results
  if (results.scans.xssScan) {
    html += `
      <div class="scan-section">
        <h3>🚨 XSS Vulnerabilities</h3>
        <p>Vulnerabilities Found: ${results.scans.xssScan.vulnerabilities?.length || 0}</p>
    `;
    if (results.scans.xssScan.vulnerabilities?.length > 0) {
      html += '<ul>';
      results.scans.xssScan.vulnerabilities.slice(0, 5).forEach(vuln => {
        html += `<li>${vuln.type} (${vuln.severity})</li>`;
      });
      html += '</ul>';
    }
    html += '</div>';
  }

  // SQL Injection Results
  if (results.scans.sqlScan) {
    html += `
      <div class="scan-section">
        <h3>💉 SQL Injection</h3>
        <p>Vulnerabilities Found: ${results.scans.sqlScan.vulnerabilities?.length || 0}</p>
    `;
    if (results.scans.sqlScan.vulnerabilities?.length > 0) {
      html += '<ul>';
      results.scans.sqlScan.vulnerabilities.slice(0, 5).forEach(vuln => {
        html += `<li>${vuln.type} in ${vuln.parameter} (${vuln.severity})</li>`;
      });
      html += '</ul>';
    }
    html += '</div>';
  }

  // Export buttons
  html += `
    <div class="export-section">
      <button onclick="exportReport()" class="btn btn-primary">📥 Export Report</button>
      <button onclick="shareScan()" class="btn btn-secondary">🔗 Share Results</button>
    </div>
  `;

  container.innerHTML = html;
}

function displayPortResults(results) {
  const container = document.getElementById('results-container');
  
  let html = `
    <div class="port-results">
      <h2>Port Scan Results</h2>
      <p>Target: ${results.host}</p>
      <p>Open Ports: ${results.openPorts?.length || 0}</p>
      <table>
        <thead>
          <tr>
            <th>Port</th>
            <th>Service</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  (results.openPorts || []).forEach(port => {
    html += `
      <tr>
        <td>${port.port}</td>
        <td>${port.service}</td>
        <td><span class="badge badge-open">${port.status}</span></td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function displayXSSResults(results) {
  const container = document.getElementById('results-container');
  
  let html = `
    <div class="xss-results">
      <h2>XSS Vulnerability Report</h2>
      <p>URL: ${results.url}</p>
      <p>Vulnerabilities: ${results.vulnerabilities?.length || 0}</p>
  `;

  if (!results.vulnerabilities || results.vulnerabilities.length === 0) {
    html += '<p>✅ No XSS vulnerabilities detected</p>';
  } else {
    html += '<ul>';
    results.vulnerabilities.forEach(vuln => {
      html += `
        <li>
          <strong>${vuln.parameter}</strong> - ${vuln.type} (${vuln.severity})
          <p>${vuln.recommendation}</p>
        </li>
      `;
    });
    html += '</ul>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function displaySQLResults(results) {
  const container = document.getElementById('results-container');
  
  let html = `
    <div class="sql-results">
      <h2>SQL Injection Report</h2>
      <p>URL: ${results.url}</p>
      <p>Vulnerabilities: ${results.vulnerabilities?.length || 0}</p>
  `;

  if (!results.vulnerabilities || results.vulnerabilities.length === 0) {
    html += '<p>✅ No SQL injection vulnerabilities detected</p>';
  } else {
    html += '<ul>';
    results.vulnerabilities.forEach(vuln => {
      html += `
        <li>
          <strong>${vuln.parameter}</strong> - ${vuln.type}
        </li>
      `;
    });
    html += '</ul>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function displaySubdomainResults(results) {
  const container = document.getElementById('results-container');
  
  let html = `
    <div class="subdomain-results">
      <h2>Subdomain Enumeration</h2>
      <p>Domain: ${results.domain}</p>
      <p>Alive Subdomains: ${results.aliveSubdomains?.length || 0}</p>
  `;

  if (results.aliveSubdomains?.length > 0) {
    html += '<ul>';
    results.aliveSubdomains.forEach(sub => {
      html += `<li>${sub}</li>`;
    });
    html += '</ul>';
  } else {
    html += '<p>No subdomains discovered</p>';
  }

  html += '</div>';
  container.innerHTML = html;
}

/**
 * UTILITY FUNCTIONS
 */

function showLoadingState(message) {
  const container = document.getElementById('results-container');
  if (container) {
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }
}

function showError(message) {
  console.error(message);
  alert(`Error: ${message}`);
}

function showSuccess(message) {
  console.log(message);
}

function exportReport() {
  // Implementation for exporting results
  console.log('Export report');
}

function shareScan() {
  // Implementation for sharing results
  console.log('Share scan');
}

/**
 * HTML INTEGRATION EXAMPLE
 */
/*
Add this to your scanner page (scanner.html or dashboard.html):

<div class="scanner-interface">
  <h1>Security Tools Scanner</h1>
  
  <div class="input-section">
    <input type="text" id="domain-input" placeholder="Enter domain (e.g., example.com)">
    <button onclick="quickSecurityScan()" class="btn btn-primary">Full Scan</button>
  </div>

  <div class="individual-tools">
    <button onclick="scanPorts()" class="btn">Port Scan</button>
    <button onclick="testXSS()" class="btn">XSS Test</button>
    <button onclick="testSQLi()" class="btn">SQL Injection</button>
    <button onclick="enumSubdomains()" class="btn">Enumerate Subdomains</button>
  </div>

  <div id="results-container"></div>
</div>

<script type="module">
  import { quickSecurityScan, scanPorts, testXSS, testSQLi, enumSubdomains } from './js/security-scanner-integration.js';
  window.quickSecurityScan = quickSecurityScan;
  window.scanPorts = scanPorts;
  window.testXSS = testXSS;
  window.testSQLi = testSQLi;
  window.enumSubdomains = enumSubdomains;
</script>
*/

/** QUICK START **/
export function initializeSecurityScanner() {
  const scanBtn = document.querySelector('[data-action="full-scan"]');
  if (scanBtn) {
    scanBtn.addEventListener('click', quickSecurityScan);
  }
}
