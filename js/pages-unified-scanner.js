/**
 * Unified Scanner Page
 * Combines TLS Scanner + Security Scanner into one comprehensive tool
 */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

// Import security scanner
import { UnifiedSecurityScanner } from './unified-security-scanner.js';

QSR.pages.unifiedScanner = function(container) {
  const targetContainer = container || document.getElementById('page-content');
  if (!targetContainer) {
    console.error('Unified scanner: no container found');
    return;
  }

  targetContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">🔍 Unified Security & TLS Scanner</h1>
        <p class="page-subtitle">Comprehensive analysis • Cryptographic validation • Vulnerability detection • Infrastructure assessment</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-scan-sm" id="btn-export-json" onclick="window.unifiedScannerUI?.exportResults('json')" style="display:none;">📥 JSON</button>
        <button class="btn-scan-sm" id="btn-export-csv" onclick="window.unifiedScannerUI?.exportResults('csv')" style="display:none;">📥 CSV</button>
      </div>
    </div>

    <!-- Scanner Tabs -->
    <div style="display:flex;gap:12px;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">
      <button class="scanner-tab active" onclick="window.unifiedScannerUI.switchTab('security')" id="tab-security" 
              style="padding:10px 16px;background:rgba(66,153,225,0.2);border:1px solid #4299e1;border-radius:6px;color:#4299e1;cursor:pointer;font-weight:700;">
        🔐 Security Scanner
      </button>
      <button class="scanner-tab" onclick="window.unifiedScannerUI.switchTab('tls')" id="tab-tls"
              style="padding:10px 16px;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#cbd5e0;cursor:pointer;font-weight:700;">
        ⚡ TLS Scanner
      </button>
      <button class="scanner-tab" onclick="window.unifiedScannerUI.switchTab('combined')" id="tab-combined"
              style="padding:10px 16px;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#cbd5e0;cursor:pointer;font-weight:700;">
        🎯 Combined Scan
      </button>
    </div>

    <!-- Security Scanner Tab -->
    <div id="tab-content-security" style="display:block;">
      <!-- Terminal Scanner Panel -->
      <div class="terminal-panel">
        <div class="terminal-topbar">
          <span class="terminal-dot" style="background:#ff5f57;"></span>
          <span class="terminal-dot" style="background:#febc2e;"></span>
          <span class="terminal-dot" style="background:#28c840;"></span>
          <span style="flex:1;text-align:center;font-size:12px;color:#888;letter-spacing:2px;">SECURITY RISK ASSESSMENT v1.0</span>
        </div>
        <div style="padding:24px 28px;">
          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› TARGET ACQUISITION</div>

          <!-- Input section -->
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;">
            <input id="security-domain-input" class="terminal-input" placeholder="example.com"
              onkeydown="if(event.key==='Enter') window.unifiedScannerUI.startSecurityScan()"
              style="flex:1;">
            <button class="btn-scan" id="security-scan-btn" onclick="window.unifiedScannerUI.startSecurityScan()">▶ SCAN</button>
          </div>

          <!-- Module selection -->
          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› MODULES</div>
          <div id="module-toggles" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:16px;">
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="module-services" checked style="cursor:pointer;">
              <span>📡 Services</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="module-xss" checked style="cursor:pointer;">
              <span>🚨 XSS</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="module-sql" checked style="cursor:pointer;">
              <span>🔍 SQL</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="module-subdomains" checked style="cursor:pointer;">
              <span>🔎 Subdomains</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="module-headers" checked style="cursor:pointer;">
              <span>🔐 Headers</span>
            </label>
          </div>

          <div id="error-msg-security" style="display:none;color:#e53e3e;font-size:12px;margin-top:6px;font-family:'JetBrains Mono',monospace;padding:4px 8px;background:rgba(229,62,62,0.08);border-radius:6px;border-left:3px solid #e53e3e;"></div>
        </div>
      </div>

      <!-- Progress -->
      <div id="scan-progress-security" style="display:none;margin-top:18px;">
        <div class="progress-wrap" style="margin-top:8px;">
          <div id="scan-progress-bar-security" style="height:4px;background:linear-gradient(90deg,#8b1a2f,#4299e1);border-radius:2px;width:0%;transition:width 0.4s ease;"></div>
        </div>
        <div id="scan-status-msg-security" style="font-size:12px;color:#48bb78;margin-top:6px;text-align:center;font-family:'JetBrains Mono',monospace;"></div>
      </div>

      <!-- Results -->
      <div id="scan-results-security" style="display:none;margin-top:18px;"></div>
    </div>

    <!-- TLS Scanner Tab -->
    <div id="tab-content-tls" style="display:none;">
      <!-- Terminal Scanner Panel -->
      <div class="terminal-panel">
        <div class="terminal-topbar">
          <span class="terminal-dot" style="background:#ff5f57;"></span>
          <span class="terminal-dot" style="background:#febc2e;"></span>
          <span class="terminal-dot" style="background:#28c840;"></span>
          <span style="flex:1;text-align:center;font-size:12px;color:#888;letter-spacing:2px;">CRYPTOGRAPHIC SCANNER v2.0</span>
        </div>
        <div style="padding:24px 28px;">
          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› TARGET ACQUISITION</div>

          <!-- Single scan input -->
          <div id="tls-single-scan-row" style="display:flex;gap:10px;align-items:center;">
            <input id="scan-input-tls" class="terminal-input" placeholder="github.com  or  www.netpnb.com"
              onkeydown="if(event.key==='Enter') window.unifiedScannerUI.startTLSScan()">
            <button class="btn-scan" id="scan-btn-tls" onclick="window.unifiedScannerUI.startTLSScan()">▶ SCAN</button>
          </div>
          <div id="url-error-msg-tls" style="display:none;color:#e53e3e;font-size:12px;margin-top:6px;font-family:'JetBrains Mono',monospace;padding:4px 8px;background:rgba(229,62,62,0.08);border-radius:6px;border-left:3px solid #e53e3e;"></div>

          <!-- Options -->
          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;margin-top:16px;">› OPTIONS</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn-scan-sm" id="btn-fleet-scan" onclick="window.unifiedScannerUI.runFleetScan()" style="background:rgba(66,153,225,0.1);border:1px solid #4299e1;color:#4299e1;">🚀 Fleet Scan</button>
            <button class="btn-scan-sm" id="btn-compare-toggle" onclick="window.unifiedScannerUI.toggleCompareMode()" style="background:rgba(139,26,47,0.1);border:1px solid #8b1a2f;color:#e53e3e;">⇄ Compare</button>
          </div>

          <!-- Compare mode inputs -->
          <div id="tls-compare-scan-row" style="display:none;gap:10px;align-items:center;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">
            <input id="scan-input-a" class="terminal-input" placeholder="Domain A: www.netpnb.com" style="flex:1;min-width:200px;">
            <div style="color:#48bb78;font-weight:700;font-size:16px;">VS</div>
            <input id="scan-input-b" class="terminal-input" placeholder="Domain B: api.pnb.co.in" style="flex:1;min-width:200px;">
            <button class="btn-scan" onclick="window.unifiedScannerUI.runCompare()">▶ COMPARE</button>
          </div>
        </div>
      </div>

      <!-- TLS Progress -->
      <div id="scan-progress-tls" style="display:none;margin-top:18px;">
        <div id="scan-stages" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
          <div class="scan-stage" id="stage-0" style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888;"><span class="stage-dot" style="width:8px;height:8px;border-radius:50%;background:#666;"></span>DNS Resolution</div>
          <div class="scan-stage" id="stage-1" style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888;"><span class="stage-dot" style="width:8px;height:8px;border-radius:50%;background:#666;"></span>TLS Handshake</div>
          <div class="scan-stage" id="stage-2" style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888;"><span class="stage-dot" style="width:8px;height:8px;border-radius:50%;background:#666;"></span>Certificate Parse</div>
        </div>
        <div class="progress-wrap" style="margin-top:8px;">
          <div id="scan-progress-bar-tls" style="height:4px;background:linear-gradient(90deg,#8b1a2f,#4299e1);border-radius:2px;width:0%;transition:width 0.4s ease;"></div>
        </div>
        <div id="scan-status-msg-tls" style="font-size:12px;color:#48bb78;margin-top:6px;text-align:center;font-family:'JetBrains Mono',monospace;"></div>
      </div>

      <!-- TLS Results -->
      <div id="scan-results-tls" style="display:none;margin-top:18px;"></div>
    </div>

    <!-- Combined Scan Tab -->
    <div id="tab-content-combined" style="display:none;">
      <div class="terminal-panel">
        <div class="terminal-topbar">
          <span class="terminal-dot" style="background:#ff5f57;"></span>
          <span class="terminal-dot" style="background:#febc2e;"></span>
          <span class="terminal-dot" style="background:#28c840;"></span>
          <span style="flex:1;text-align:center;font-size:12px;color:#888;letter-spacing:2px;">UNIFIED SECURITY ASSESSMENT v1.0</span>
        </div>
        <div style="padding:24px 28px;">
          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› TARGET ACQUISITION</div>

          <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;">
            <input id="combined-domain-input" class="terminal-input" placeholder="example.com"
              onkeydown="if(event.key==='Enter') window.unifiedScannerUI.startCombinedScan()"
              style="flex:1;">
            <button class="btn-scan" id="combined-scan-btn" onclick="window.unifiedScannerUI.startCombinedScan()">▶ SCAN ALL</button>
          </div>

          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› WHAT THIS DOES</div>
          <div style="font-size:12px;color:#a0aec0;line-height:1.6;">
            <p>✓ Runs <strong>TLS Scanner</strong>: Certificate validation, ciphers, SSL/TLS versions</p>
            <p>✓ Runs <strong>Security Scanner</strong>: Services, XSS, SQL injection, subdomains, headers</p>
            <p>✓ Generates <strong>unified report</strong> with all findings</p>
          </div>
        </div>
      </div>

      <!-- Combined Progress -->
      <div id="scan-progress-combined" style="display:none;margin-top:18px;">
        <div class="progress-wrap" style="margin-top:8px;">
          <div id="scan-progress-bar-combined" style="height:4px;background:linear-gradient(90deg,#8b1a2f,#4299e1);border-radius:2px;width:0%;transition:width 0.4s ease;"></div>
        </div>
        <div id="scan-status-msg-combined" style="font-size:12px;color:#48bb78;margin-top:6px;text-align:center;font-family:'JetBrains Mono',monospace;"></div>
      </div>

      <!-- Combined Results -->
      <div id="scan-results-combined" style="display:none;margin-top:18px;"></div>
    </div>
  `;

  // Initialize UI controller
  window.unifiedScannerUI = {
    currentTab: 'security',
    securityScan: null,
    securityResults: null,

    switchTab(tab) {
      // Hide all tabs
      document.getElementById('tab-content-security').style.display = 'none';
      document.getElementById('tab-content-tls').style.display = 'none';
      document.getElementById('tab-content-combined').style.display = 'none';

      // Deactivate all tabs
      document.getElementById('tab-security').style.background = 'transparent';
      document.getElementById('tab-security').style.color = '#cbd5e0';
      document.getElementById('tab-tls').style.background = 'transparent';
      document.getElementById('tab-tls').style.color = '#cbd5e0';
      document.getElementById('tab-combined').style.background = 'transparent';
      document.getElementById('tab-combined').style.color = '#cbd5e0';

      // Show selected tab
      document.getElementById(`tab-content-${tab}`).style.display = 'block';

      // Activate selected tab
      document.getElementById(`tab-${tab}`).style.background = 'rgba(66,153,225,0.2)';
      document.getElementById(`tab-${tab}`).style.color = '#4299e1';
      document.getElementById(`tab-${tab}`).style.borderColor = '#4299e1';

      this.currentTab = tab;
    },

    async startSecurityScan() {
      const domain = document.getElementById('security-domain-input')?.value?.trim();

      if (!domain) {
        this.showSecurityError('Please enter a domain');
        return;
      }

      const options = {
        skipServices: !document.getElementById('module-services')?.checked,
        skipXSS: !document.getElementById('module-xss')?.checked,
        skipSQL: !document.getElementById('module-sql')?.checked,
        skipSubdomains: !document.getElementById('module-subdomains')?.checked,
        skipHeaders: !document.getElementById('module-headers')?.checked,
        verbose: true
      };

      this.showSecurityProgress(true);

      try {
        this.securityScan = new UnifiedSecurityScanner(domain);
        this.securityResults = await this.securityScan.runFullScan(options);

        this.displaySecurityResults();
        this.showSecurityProgress(false);

      } catch (error) {
        this.showSecurityError(`Scan failed: ${error.message}`);
        this.showSecurityProgress(false);
      }
    },

    displaySecurityResults() {
      if (!this.securityResults) return;

      const resultsContainer = document.getElementById('scan-results-security');
      resultsContainer.style.display = 'block';

      const summary = this.securityResults.summary;

      let html = `
        <div class="panel" style="background:linear-gradient(135deg,rgba(139,26,47,0.05),rgba(66,153,225,0.05));border:1px solid rgba(139,26,47,0.2);">
          <h3 style="margin:0 0 16px 0;">📊 Security Scan Results</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:12px;margin-bottom:20px;">
            <div style="text-align:center;padding:12px;background:rgba(66,153,225,0.1);border-radius:6px;">
              <div style="font-size:24px;font-weight:700;color:#4299e1;">${summary.totalVulnerabilities}</div>
              <div style="font-size:11px;color:#888;">Total Issues</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(229,62,62,0.1);border-radius:6px;">
              <div style="font-size:24px;font-weight:700;color:#e53e3e;">${summary.vulnerabilityBreakdown.CRITICAL}</div>
              <div style="font-size:11px;color:#888;">Critical</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(237,137,54,0.1);border-radius:6px;">
              <div style="font-size:24px;font-weight:700;color:#ed8936;">${summary.vulnerabilityBreakdown.HIGH}</div>
              <div style="font-size:11px;color:#888;">High</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(72,187,120,0.1);border-radius:6px;">
              <div style="font-size:24px;font-weight:700;color:#48bb78;">${summary.overallRiskLevel}</div>
              <div style="font-size:11px;color:#888;">Risk Level</div>
            </div>
          </div>
        </div>
      `;

      resultsContainer.innerHTML = html;
    },

    startTLSScan() {
      const domain = document.getElementById('scan-input-tls')?.value?.trim();
      if (!domain) {
        this.showTLSError('Please enter a domain');
        return;
      }

      this.showTLSProgress(true);
      if (window.QSR && window.QSR.runTLSScan) {
        window.QSR.runTLSScan();
      }
    },

    toggleCompareMode() {
      const compareRow = document.getElementById('tls-compare-scan-row');
      compareRow.style.display = compareRow.style.display === 'none' ? 'flex' : 'none';
    },

    runFleetScan() {
      this.showTLSProgress(true);
      if (window.QSR && window.QSR.runFleetScan) {
        window.QSR.runFleetScan();
      }
    },

    runCompare() {
      this.showTLSProgress(true);
      if (window.QSR && window.QSR.runCompare) {
        window.QSR.runCompare();
      }
    },

    async startCombinedScan() {
      const domain = document.getElementById('combined-domain-input')?.value?.trim();
      if (!domain) {
        alert('Please enter a domain');
        return;
      }

      this.showCombinedProgress(true);

      try {
        const scan = new UnifiedSecurityScanner(domain);
        const results = await scan.runFullScan();

        const resultsDiv = document.getElementById('scan-results-combined');
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
          <div class="panel" style="background:linear-gradient(135deg,rgba(139,26,47,0.05),rgba(66,153,225,0.05));border:1px solid rgba(139,26,47,0.2);">
            <h3>🎯 Combined Scan Results</h3>
            <p style="font-size:12px;color:#a0aec0;">Security: ${results.summary.totalVulnerabilities} issues found</p>
            <p style="font-size:12px;color:#a0aec0;">Risk Level: <strong style="color:#4299e1;">${results.summary.overallRiskLevel}</strong></p>
            <p style="font-size:11px;color:#888;margin-top:12px;">TLS Scanner results will appear below</p>
          </div>
        `;

        this.showCombinedProgress(false);

      } catch (error) {
        alert(`Scan failed: ${error.message}`);
        this.showCombinedProgress(false);
      }
    },

    showSecurityProgress(show) {
      document.getElementById('scan-progress-security').style.display = show ? 'block' : 'none';
      document.getElementById('security-scan-btn').disabled = show;
      document.getElementById('security-scan-btn').textContent = show ? 'SCANNING...' : '▶ SCAN';
    },

    showTLSProgress(show) {
      document.getElementById('scan-progress-tls').style.display = show ? 'block' : 'none';
      document.getElementById('scan-btn-tls').disabled = show;
      document.getElementById('scan-btn-tls').textContent = show ? 'SCANNING...' : '▶ SCAN';
    },

    showCombinedProgress(show) {
      document.getElementById('scan-progress-combined').style.display = show ? 'block' : 'none';
      document.getElementById('combined-scan-btn').disabled = show;
      document.getElementById('combined-scan-btn').textContent = show ? 'SCANNING...' : '▶ SCAN ALL';
    },

    showSecurityError(msg) {
      const errorDiv = document.getElementById('error-msg-security');
      errorDiv.textContent = `❌ ${msg}`;
      errorDiv.style.display = 'block';
      setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
    },

    showTLSError(msg) {
      const errorDiv = document.getElementById('url-error-msg-tls');
      errorDiv.textContent = `❌ ${msg}`;
      errorDiv.style.display = 'block';
      setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
    },

    exportResults(format) {
      if (!this.securityScan) {
        alert('No scan results to export');
        return;
      }

      let content, filename, type;

      if (format === 'json') {
        content = this.securityScan.exportJSON();
        filename = `scan-${this.securityResults.domain}-${Date.now()}.json`;
        type = 'application/json';
      } else if (format === 'csv') {
        content = this.securityScan.exportCSV();
        filename = `scan-${this.securityResults.domain}-${Date.now()}.csv`;
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
    }
  };
};
