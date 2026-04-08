/**
 * Security Scanner UI Integration
 * Connects scanner tools to the dashboard UI
 */

import { UnifiedSecurityScanner } from './unified-security-scanner.js';

export class SecurityScannerUI {
  constructor(containerSelector = '#scanner-container') {
    this.container = document.querySelector(containerSelector);
    this.currentScan = null;
    this.scanResults = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Start scan button
    const startBtn = document.getElementById('security-scan-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startScan());
    }

    // Domain input enter key
    const domainInput = document.getElementById('security-domain-input');
    if (domainInput) {
      domainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.startScan();
      });
    }

    // Export buttons
    const exportJSONBtn = document.getElementById('export-json');
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener('click', () => this.exportResults('json'));
    }

    const exportCSVBtn = document.getElementById('export-csv');
    if (exportCSVBtn) {
      exportCSVBtn.addEventListener('click', () => this.exportResults('csv'));
    }

    // Module toggles
    ['services', 'xss', 'sql', 'subdomains', 'headers'].forEach(module => {
      const toggle = document.getElementById(`module-${module}`);
      if (toggle) {
        toggle.addEventListener('change', () => this.updateModuleSelection());
      }
    });
  }

  async startScan() {
    const domain = document.getElementById('security-domain-input')?.value?.trim();

    if (!domain) {
      this.showNotification('Please enter a domain', 'error');
      return;
    }

    // Get enabled modules
    const options = {
      skipServices: !document.getElementById('module-services')?.checked,
      skipXSS: !document.getElementById('module-xss')?.checked,
      skipSQL: !document.getElementById('module-sql')?.checked,
      skipSubdomains: !document.getElementById('module-subdomains')?.checked,
      skipHeaders: !document.getElementById('module-headers')?.checked
    };

    // Update UI
    this.showScanProgress(true);
    this.showNotification(`Scanning ${domain}...`, 'info');

    try {
      this.currentScan = new UnifiedSecurityScanner(domain);
      this.scanResults = await this.currentScan.runFullScan(options);

      this.displayResults();
      this.showNotification(`Scan completed in ${(this.scanResults.totalTime / 1000).toFixed(2)}s`, 'success');

    } catch (error) {
      this.showNotification(`Scan failed: ${error.message}`, 'error');
      console.error('Scan error:', error);
    } finally {
      this.showScanProgress(false);
    }
  }

  displayResults() {
    if (!this.scanResults) return;

    // Clear previous results
    const resultsContainer = document.getElementById('scan-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }

    // Display summary
    this.displaySummary();

    // Display detailed results for each module
    ['services', 'xss', 'sql', 'subdomains', 'headers'].forEach(module => {
      if (this.scanResults.modules[module]) {
        this.displayModuleResults(module);
      }
    });
  }

  displaySummary() {
    const summary = this.scanResults.summary;
    const resultsContainer = document.getElementById('scan-results');

    if (!resultsContainer) return;

    const summaryHTML = `
      <div class="scan-summary">
        <div class="summary-card">
          <h3>Scan Summary</h3>
          <div class="summary-stats">
            <div class="stat">
              <div class="stat-value">${summary.totalVulnerabilities}</div>
              <div class="stat-label">Total Issues</div>
            </div>
            <div class="stat critical">
              <div class="stat-value">${summary.vulnerabilityBreakdown.CRITICAL}</div>
              <div class="stat-label">Critical</div>
            </div>
            <div class="stat high">
              <div class="stat-value">${summary.vulnerabilityBreakdown.HIGH}</div>
              <div class="stat-label">High</div>
            </div>
            <div class="stat medium">
              <div class="stat-value">${summary.vulnerabilityBreakdown.MEDIUM}</div>
              <div class="stat-label">Medium</div>
            </div>
            <div class="stat low">
              <div class="stat-value">${summary.vulnerabilityBreakdown.LOW}</div>
              <div class="stat-label">Low</div>
            </div>
          </div>
          <div class="overall-risk">
            <strong>Overall Risk: </strong>
            <span class="risk-${summary.overallRiskLevel.toLowerCase()}">
              ${summary.overallRiskLevel}
            </span>
          </div>
        </div>
      </div>
    `;

    resultsContainer.insertAdjacentHTML('beforeend', summaryHTML);
  }

  displayModuleResults(module) {
    const moduleData = this.scanResults.modules[module];
    if (!moduleData) return;

    const resultsContainer = document.getElementById('scan-results');
    if (!resultsContainer) return;

    const data = moduleData.data;
    let html = `<div class="module-results module-${module}">
      <h4>${this.getModuleTitle(module)}</h4>`;

    if (data.vulnerabilities && data.vulnerabilities.length > 0) {
      html += `<div class="vulnerabilities">`;
      data.vulnerabilities.forEach(vuln => {
        html += `
          <div class="vulnerability severity-${vuln.severity?.toLowerCase() || 'unknown'}">
            <div class="vuln-header">
              <span class="vuln-type">${vuln.type || vuln.issue || 'Issue'}</span>
              <span class="vuln-severity">${vuln.severity || 'N/A'}</span>
            </div>
            <div class="vuln-description">${vuln.description || vuln.issue || ''}</div>
            <div class="vuln-recommendation">
              <strong>📋 Recommendation:</strong> ${vuln.recommendation || 'No recommendation available'}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } else if (data.summary) {
      if (data.summary.totalVulnerabilities === 0) {
        html += `<div class="no-issues">✅ No vulnerabilities found</div>`;
      }
    } else {
      html += `<div class="module-info">
        ${JSON.stringify(data).substring(0, 200)}...
      </div>`;
    }

    html += `<div class="module-footer">Module completed in ${(moduleData.time / 1000).toFixed(2)}s</div></div>`;

    resultsContainer.insertAdjacentHTML('beforeend', html);
  }

  getModuleTitle(module) {
    const titles = {
      services: '📡 Service Detection',
      xss: '🚨 XSS Vulnerabilities',
      sql: '🔍 SQL Injection',
      subdomains: '🔎 Subdomain Enumeration',
      headers: '🔐 Security Headers'
    };
    return titles[module] || module;
  }

  exportResults(format) {
    if (!this.currentScan) {
      this.showNotification('No scan results to export', 'error');
      return;
    }

    let content, filename, type;

    if (format === 'json') {
      content = this.currentScan.exportJSON();
      filename = `security-scan-${this.scanResults.domain}-${Date.now()}.json`;
      type = 'application/json';
    } else if (format === 'csv') {
      content = this.currentScan.exportCSV();
      filename = `security-scan-${this.scanResults.domain}-${Date.now()}.csv`;
      type = 'text/csv';
    } else if (format === 'html') {
      content = this.currentScan.getFullReport();
      filename = `security-scan-${this.scanResults.domain}-${Date.now()}.html`;
      type = 'text/html';
    } else {
      return;
    }

    // Create blob and download
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    this.showNotification(`Exported to ${filename}`, 'success');
  }

  showScanProgress(isScanning) {
    const startBtn = document.getElementById('security-scan-start');
    const progressBar = document.getElementById('scan-progress');

    if (startBtn) {
      startBtn.disabled = isScanning;
      startBtn.textContent = isScanning ? 'Scanning...' : 'Start Scan';
    }

    if (progressBar) {
      progressBar.style.display = isScanning ? 'block' : 'none';
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to page
    const container = document.body;
    container.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateModuleSelection() {
    // Update UI based on selected modules
    const selected = [];
    ['services', 'xss', 'sql', 'subdomains', 'headers'].forEach(module => {
      if (document.getElementById(`module-${module}`)?.checked) {
        selected.push(module);
      }
    });

    console.log('Selected modules:', selected);
  }

  displayFullReport() {
    if (!this.currentScan) return;

    const report = this.currentScan.getFullReport();
    console.log(report);

    // Could also display in modal or new window
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">×</button>
        <pre>${report}</pre>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if scanner container exists
  if (document.getElementById('scanner-container')) {
    window.securityScannerUI = new SecurityScannerUI('#scanner-container');
  }
});

// Export for manual initialization
export default SecurityScannerUI;
