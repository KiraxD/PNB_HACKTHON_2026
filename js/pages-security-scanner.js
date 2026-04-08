/**
 * Practical Security Scanner Page
 * Integrates all security analysis modules into dashboard
 */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

// Import the scanner modules
import { UnifiedSecurityScanner } from './unified-security-scanner.js';

QSR.pages.securityScanner = function(container) {
  // Make sure we have a valid container
  const targetContainer = container || document.getElementById('page-content') || document.getElementById('security-scanner-mount');
  if (!targetContainer) {
    console.error('Security scanner: no container found');
    return;
  }

  targetContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">🔐 Security Risk Scanner</h1>
        <p class="page-subtitle">Comprehensive vulnerability analysis • Service detection • XSS • SQL Injection • Subdomains • Security Headers</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-scan-sm" id="btn-export-json" onclick="QSR.security.exportResults('json')">📥 JSON</button>
        <button class="btn-scan-sm" id="btn-export-csv" onclick="QSR.security.exportResults('csv')">📥 CSV</button>
      </div>
    </div>

    <!-- Scanner Panel -->
    <div class="terminal-panel">
      <div class="terminal-topbar">
        <span class="terminal-dot" style="background:#ff5f57;"></span>
        <span class="terminal-dot" style="background:#febc2e;"></span>
        <span class="terminal-dot" style="background:#28c840;"></span>
        <span style="flex:1;text-align:center;font-size:12px;color:#888;letter-spacing:2px;">SECURITY ASSESSMENT SCANNER v1.0</span>
      </div>
      <div style="padding:24px 28px;">
        <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› TARGET ACQUISITION</div>

        <!-- Input section -->
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;">
          <input id="security-domain-input" class="terminal-input" placeholder="example.com  or  www.mysite.com"
            onkeydown="if(event.key==='Enter') QSR.security.startScan()"
            style="flex:1;">
          <button class="btn-scan" id="security-scan-btn" onclick="QSR.security.startScan()">▶ SCAN</button>
        </div>

        <!-- Module selection -->
        <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› MODULE SELECTION</div>
        <div id="module-toggles" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:16px;">
          <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="module-services" checked style="cursor:pointer;">
            <span>📡 Service Detection</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="module-xss" checked style="cursor:pointer;">
            <span>🚨 XSS Analysis</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="module-sql" checked style="cursor:pointer;">
            <span>🔍 SQL Injection</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="module-subdomains" checked style="cursor:pointer;">
            <span>🔎 Subdomains</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="module-headers" checked style="cursor:pointer;">
            <span>🔐 Security Headers</span>
          </label>
        </div>

        <div id="error-msg" style="display:none;color:#e53e3e;font-size:12px;margin-top:6px;font-family:'JetBrains Mono',monospace;padding:4px 8px;background:rgba(229,62,62,0.08);border-radius:6px;border-left:3px solid #e53e3e;"></div>
      </div>
    </div>

    <!-- Progress Section -->
    <div id="scan-progress" style="display:none;margin-top:18px;">
      <div class="scan-stages" id="scan-stages">
        <div class="scan-stage" id="stage-0"><span class="stage-dot"></span>Services</div>
        <div class="scan-stage" id="stage-1"><span class="stage-dot"></span>XSS Analysis</div>
        <div class="scan-stage" id="stage-2"><span class="stage-dot"></span>SQL Injection</div>
        <div class="scan-stage" id="stage-3"><span class="stage-dot"></span>Subdomains</div>
        <div class="scan-stage" id="stage-4"><span class="stage-dot"></span>Security Headers</div>
      </div>
      <div class="progress-wrap" style="margin-top:8px;">
        <div id="scan-progress-bar" style="height:4px;background:linear-gradient(90deg,#8b1a2f,#4299e1);border-radius:2px;width:0%;transition:width 0.4s ease;"></div>
      </div>
      <div id="scan-status-msg" style="font-size:12px;color:#48bb78;margin-top:6px;text-align:center;font-family:'JetBrains Mono',monospace;"></div>
    </div>

    <!-- Results Section -->
    <div id="scan-results" style="display:none;margin-top:18px;">
      <!-- Summary Card -->
      <div class="panel" style="background:linear-gradient(135deg,rgba(139,26,47,0.05),rgba(66,153,225,0.05));border:1px solid rgba(139,26,47,0.2);">
        <h3 style="margin:0 0 16px 0;">📊 Executive Summary</h3>
        <div id="summary-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;">
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#4299e1;" id="summary-total">0</div>
            <div style="font-size:12px;color:#888;">Total Issues</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#e53e3e;" id="summary-critical">0</div>
            <div style="font-size:12px;color:#888;">Critical</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#ed8936;" id="summary-high">0</div>
            <div style="font-size:12px;color:#888;">High</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#ecc94b;" id="summary-medium">0</div>
            <div style="font-size:12px;color:#888;">Medium</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#48bb78;" id="summary-low">0</div>
            <div style="font-size:12px;color:#888;">Low</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:20px;font-weight:700;" id="summary-risk">−</div>
            <div style="font-size:12px;color:#888;">Risk Level</div>
          </div>
        </div>
      </div>

      <!-- Module Results -->
      <div id="modules-results" style="margin-top:18px;"></div>
    </div>

    <!-- Quick Reference -->
    <div class="panel" style="margin-top:18px;background:rgba(66,153,225,0.05);border:1px solid rgba(66,153,225,0.2);">
      <h3 style="margin:0 0 12px 0;">💡 Quick Reference</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;font-size:12px;">
        <div style="padding:8px;background:rgba(229,62,62,0.1);border-radius:4px;border-left:3px solid #e53e3e;">
          <strong style="color:#e53e3e;">CRITICAL:</strong> Address immediately - direct security breach possible
        </div>
        <div style="padding:8px;background:rgba(237,137,54,0.1);border-radius:4px;border-left:3px solid #ed8936;">
          <strong style="color:#ed8936;">HIGH:</strong> Address within 1 week - significant exposure
        </div>
        <div style="padding:8px;background:rgba(236,201,75,0.1);border-radius:4px;border-left:3px solid #ecc94b;">
          <strong style="color:#ecc94b;">MEDIUM:</strong> Address within 1 month - moderate risk
        </div>
        <div style="padding:8px;background:rgba(72,187,120,0.1);border-radius:4px;border-left:3px solid #48bb78;">
          <strong style="color:#48bb78;">LOW:</strong> Address during maintenance - minor issue
        </div>
      </div>
    </div>
  `;

  // Initialize scanner controller
  QSR.security = {
    currentScan: null,
    scanResults: null,

    async startScan() {
      const domain = document.getElementById('security-domain-input')?.value?.trim();

      if (!domain) {
        this.showError('Please enter a domain');
        return;
      }

      // Get enabled modules
      const options = {
        skipServices: !document.getElementById('module-services')?.checked,
        skipXSS: !document.getElementById('module-xss')?.checked,
        skipSQL: !document.getElementById('module-sql')?.checked,
        skipSubdomains: !document.getElementById('module-subdomains')?.checked,
        skipHeaders: !document.getElementById('module-headers')?.checked,
        verbose: true
      };

      this.showProgress(true);
      this.clearResults();

      try {
        this.currentScan = new UnifiedSecurityScanner(domain);
        this.scanResults = await this.currentScan.runFullScan(options);

        this.displayResults();
        this.showProgress(false);
        this.showSuccess(`Scan completed in ${(this.scanResults.totalTime / 1000).toFixed(2)}s`);

      } catch (error) {
        this.showError(`Scan failed: ${error.message}`);
        this.showProgress(false);
        console.error('Scan error:', error);
      }
    },

    displayResults() {
      if (!this.scanResults) return;

      // Show results container
      const resultsContainer = document.getElementById('scan-results');
      resultsContainer.style.display = 'block';

      // Update summary
      const summary = this.scanResults.summary;
      document.getElementById('summary-total').textContent = summary.totalVulnerabilities;
      document.getElementById('summary-critical').textContent = summary.vulnerabilityBreakdown.CRITICAL;
      document.getElementById('summary-high').textContent = summary.vulnerabilityBreakdown.HIGH;
      document.getElementById('summary-medium').textContent = summary.vulnerabilityBreakdown.MEDIUM;
      document.getElementById('summary-low').textContent = summary.vulnerabilityBreakdown.LOW;
      document.getElementById('summary-risk').textContent = summary.overallRiskLevel;

      // Style risk level
      const riskSpan = document.getElementById('summary-risk');
      riskSpan.style.color = {
        CRITICAL: '#e53e3e',
        HIGH: '#ed8936',
        MEDIUM: '#ecc94b',
        LOW: '#48bb78'
      }[summary.overallRiskLevel] || '#cbd5e0';

      // Display module results
      this.displayModuleResults();
    },

    displayModuleResults() {
      const modulesContainer = document.getElementById('modules-results');
      modulesContainer.innerHTML = '';

      Object.entries(this.scanResults.modules).forEach(([module, result]) => {
        if (result.status === 'COMPLETED' && result.data?.vulnerabilities) {
          const vulnCount = result.data.vulnerabilities.length;
          
          let html = `
            <div class="panel" style="margin-bottom:12px;border-left:3px solid ${this.getModuleColor(module)};">
              <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:12px;">
                <h3 style="margin:0;display:flex;align-items:center;gap:8px;">
                  ${this.getModuleIcon(module)} ${this.getModuleTitle(module)}
                  <span style="font-size:11px;background:rgba(66,153,225,0.2);padding:2px 8px;border-radius:10px;color:#4299e1;">
                    ${vulnCount} issue${vulnCount !== 1 ? 's' : ''}
                  </span>
                </h3>
                <span style="font-size:12px;color:#888;">${(result.time / 1000).toFixed(2)}s</span>
              </div>
          `;

          if (vulnCount === 0) {
            html += `<div style="padding:12px;background:rgba(72,187,120,0.1);border-radius:4px;text-align:center;color:#48bb78;">✅ No vulnerabilities found</div>`;
          } else {
            html += `<div style="display:grid;gap:8px;">`;
            result.data.vulnerabilities.forEach(vuln => {
              const severity = vuln.severity || 'UNKNOWN';
              const severityColor = {
                CRITICAL: '#e53e3e',
                HIGH: '#ed8936',
                MEDIUM: '#ecc94b',
                LOW: '#48bb78'
              }[severity] || '#cbd5e0';

              html += `
                <div style="padding:10px;background:rgba(${this.getRGB(severityColor)},0.1);border-left:3px solid ${severityColor};border-radius:4px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                    <strong style="color:${severityColor};">${vuln.type || vuln.issue || 'Issue'}</strong>
                    <span style="font-size:10px;background:${severityColor};color:white;padding:2px 6px;border-radius:3px;font-weight:700;">${severity}</span>
                  </div>
                  <div style="font-size:12px;color:#cbd5e0;margin-bottom:6px;">${vuln.description || vuln.issue || ''}</div>
                  <div style="font-size:11px;color:#a0aec0;">
                    <strong>💡 Fix:</strong> ${vuln.recommendation || 'Review and remediate'}
                  </div>
                </div>
              `;
            });
            html += `</div>`;
          }

          html += `</div>`;
          modulesContainer.insertAdjacentHTML('beforeend', html);
        }
      });
    },

    getModuleIcon(module) {
      const icons = {
        services: '📡',
        xss: '🚨',
        sql: '🔍',
        subdomains: '🔎',
        headers: '🔐'
      };
      return icons[module] || '📊';
    },

    getModuleTitle(module) {
      const titles = {
        services: 'Service Detection',
        xss: 'XSS Vulnerabilities',
        sql: 'SQL Injection',
        subdomains: 'Subdomain Enumeration',
        headers: 'Security Headers'
      };
      return titles[module] || module;
    },

    getModuleColor(module) {
      const colors = {
        services: '#4299e1',
        xss: '#e53e3e',
        sql: '#ed8936',
        subdomains: '#9f7aea',
        headers: '#48bb78'
      };
      return colors[module] || '#cbd5e0';
    },

    getRGB(hexColor) {
      const hex = hexColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r},${g},${b}`;
    },

    exportResults(format) {
      if (!this.currentScan) {
        this.showError('No scan results to export');
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
      } else {
        return;
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      this.showSuccess(`Exported to ${filename}`);
    },

    showProgress(show) {
      document.getElementById('scan-progress').style.display = show ? 'block' : 'none';
      document.getElementById('security-scan-btn').disabled = show;
      document.getElementById('security-scan-btn').textContent = show ? 'SCANNING...' : '▶ SCAN';

      if (show) {
        // Animate progress
        const progressBar = document.getElementById('scan-progress-bar');
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          progressBar.style.width = Math.min(progress, 90) + '%';
          if (progress > 100) clearInterval(interval);
        }, 300);
        this.progressInterval = interval;
      } else {
        clearInterval(this.progressInterval);
        document.getElementById('scan-progress-bar').style.width = '100%';
      }
    },

    clearResults() {
      document.getElementById('scan-results').style.display = 'none';
      document.getElementById('modules-results').innerHTML = '';
    },

    showError(message) {
      const errorMsg = document.getElementById('error-msg');
      errorMsg.textContent = `❌ ${message}`;
      errorMsg.style.display = 'block';
      setTimeout(() => {
        errorMsg.style.display = 'none';
      }, 5000);
    },

    showSuccess(message) {
      const statusMsg = document.getElementById('scan-status-msg');
      statusMsg.textContent = `✅ ${message}`;
    }
  };
};
