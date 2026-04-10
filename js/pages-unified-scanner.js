/**
 * Unified Scanner Page — QSecure Radar
 * Combines TLS Scanner + Security Scanner into one comprehensive tool
 * PSB Hackathon 2026 | Team REAL - KIIT
 */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

// Import security scanner (ES module style)
let _secScannerMod = null;
async function _loadSecurityScanner() {
  if (_secScannerMod) return _secScannerMod;
  try {
    _secScannerMod = await import('./unified-security-scanner.js');
    return _secScannerMod;
  } catch(e) {
    console.warn('[UnifiedScanner] Could not load security scanner module:', e.message);
    return null;
  }
}

QSR.pages.unifiedScanner = function(container) {
  const targetContainer = container || document.getElementById('page-content');
  if (!targetContainer) {
    console.error('Unified scanner: no container found');
    return;
  }

  // Build the full page — TLS tab contains the COMPLETE scanner HTML
  // so QSR._renderScanResult() can find all required DOM element IDs.
  targetContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">⚡ Security &amp; TLS Scanner</h1>
        <p class="page-subtitle">Custom multi-source TLS scanner • DNS-over-HTTPS + crt.sh CT logs + live header analysis • Vulnerability detection • PQC readiness</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-scan-sm" id="btn-fleet-scan" onclick="QSR.runFleetScan()">🚀 Fleet Scan</button>
        <button class="btn-scan-sm" id="btn-export-json" onclick="window.unifiedScannerUI?.exportResults('json')" style="display:none;">📥 JSON</button>
      </div>
    </div>

    <!-- Scanner Tabs -->
    <div style="display:flex;gap:0;margin-bottom:0;border-bottom:2px solid rgba(139,26,47,0.2);">
      <button id="tab-tls" onclick="window.unifiedScannerUI.switchTab('tls')"
              style="padding:10px 22px;background:rgba(139,26,47,0.15);border:none;border-bottom:3px solid #8b1a2f;color:#8b1a2f;cursor:pointer;font-weight:700;font-family:'Exo 2',sans-serif;font-size:14px;">
        ⚡ TLS / Crypto Scanner
      </button>
      <button id="tab-security" onclick="window.unifiedScannerUI.switchTab('security')"
              style="padding:10px 22px;background:transparent;border:none;border-bottom:3px solid transparent;color:#888;cursor:pointer;font-weight:600;font-family:'Exo 2',sans-serif;font-size:14px;">
        🔐 Security Scanner
      </button>
    </div>

    <!-- ═══ TLS SCANNER TAB ═══ -->
    <div id="tab-content-tls" style="display:block;">

      <!-- Terminal Scanner Panel -->
      <div class="terminal-panel" style="margin-top:16px;">
        <div class="terminal-topbar">
          <span class="terminal-dot" style="background:#ff5f57;"></span>
          <span class="terminal-dot" style="background:#febc2e;"></span>
          <span class="terminal-dot" style="background:#28c840;"></span>
          <span style="flex:1;text-align:center;font-size:12px;color:#888;letter-spacing:2px;">CRYPTOGRAPHIC SCANNER v2.0</span>
        </div>
        <div style="padding:24px 28px;">
          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› TARGET ACQUISITION</div>

          <!-- Single scan input -->
          <div id="single-scan-row" style="display:flex;gap:10px;align-items:center;">
            <input id="scan-input" class="terminal-input" placeholder="github.com  or  www.netpnb.com"
              onkeydown="if(event.key==='Enter') QSR.runTLSScan()">
            <button class="btn-scan" id="scan-btn" onclick="QSR.runTLSScan()">▶ SCAN</button>
          </div>
          <div id="url-error-msg" style="display:none;color:#e53e3e;font-size:12px;margin-top:6px;font-family:'JetBrains Mono',monospace;padding:4px 8px;background:rgba(229,62,62,0.08);border-radius:6px;border-left:3px solid #e53e3e;"></div>

          <!-- Compare mode inputs -->
          <div id="compare-scan-row" style="display:none;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;">
            <input id="scan-input-a" class="terminal-input" placeholder="Domain A: www.netpnb.com" style="flex:1;min-width:200px;">
            <div style="color:#48bb78;font-weight:700;font-size:16px;">VS</div>
            <input id="scan-input-b" class="terminal-input" placeholder="Domain B: api.pnb.co.in" style="flex:1;min-width:200px;">
            <button class="btn-scan" onclick="QSR.runCompare()">▶ COMPARE</button>
          </div>

          <div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn-scan-sm" onclick="QSR._toggleCompare()" id="btn-compare-toggle">⇄ Compare Mode</button>
          </div>
        </div>
      </div>

      <!-- Asset Target Inventory -->
      <div class="panel" id="scanner-assets-panel" style="margin-top:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="QSR._toggleScannerAssets()">
          <div class="panel-title" style="margin:0;">🎯 PNB Asset Inventory — Click any asset to scan instantly</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span id="scanner-assets-badge" style="display:none;font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(139,26,47,0.12);color:#8b1a2f;font-weight:700;"></span>
            <span id="scanner-assets-chevron" style="font-size:18px;color:#888;transition:transform 0.2s;">▾</span>
          </div>
        </div>
        <div id="scanner-assets-body" style="margin-top:12px;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
            <span style="font-size:11px;color:#888;letter-spacing:1px;">FILTER:</span>
            <button class="chip-btn sa-filter-btn active" data-risk="" onclick="QSR._filterScannerAssets(this)">All</button>
            <button class="chip-btn sa-filter-btn" data-risk="Critical" onclick="QSR._filterScannerAssets(this)" style="border-color:#e53e3e;color:#e53e3e;">🔴 Critical</button>
            <button class="chip-btn sa-filter-btn" data-risk="High" onclick="QSR._filterScannerAssets(this)" style="border-color:#ed8936;color:#ed8936;">🟡 High</button>
            <button class="chip-btn sa-filter-btn" data-risk="Medium" onclick="QSR._filterScannerAssets(this)">Medium</button>
            <button class="chip-btn sa-filter-btn" data-risk="Low" onclick="QSR._filterScannerAssets(this)" style="border-color:#48bb78;color:#48bb78;">🟢 Low</button>
            <div style="margin-left:auto;" id="scanner-assets-count"></div>
          </div>
          <div style="overflow-x:auto;">
            <table class="data-table" id="scanner-assets-table">
              <thead><tr>
                <th>Asset</th><th>URL</th><th>Type</th><th>Key</th>
                <th>Cert</th><th>PQC Score</th><th>Risk</th><th style="text-align:center;">Scan</th>
              </tr></thead>
              <tbody id="scanner-assets-tbody">
                <tr><td colspan="8" class="loading-cell">Loading assets...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Animated Progress -->
      <div id="scan-progress" style="display:none;margin-top:14px;">
        <div class="scan-stages" id="scan-stages">
          ${['DNS Resolution','TLS Handshake','Cipher Harvest','Certificate Parse','Quantum Assessment'].map((s,i) =>
            `<div class="scan-stage" id="stage-${i}"><span class="stage-dot"></span>${s}</div>`
          ).join('')}
        </div>
        <div class="progress-wrap" style="margin-top:8px;">
          <div id="scan-progress-bar" style="height:4px;background:linear-gradient(90deg,#8b1a2f,#4299e1);border-radius:2px;width:0%;transition:width 0.4s ease;"></div>
        </div>
        <div id="scan-status-msg" style="font-size:12px;color:#48bb78;margin-top:6px;text-align:center;font-family:'JetBrains Mono',monospace;"></div>
      </div>

      <!-- ═══ SCAN RESULTS (renders here after scan) ═══ -->
      <div id="scan-results" style="display:none;margin-top:18px;">
        <div id="risk-banner" class="risk-banner"></div>
        <div class="grid-2" style="margin-top:14px;">
          <!-- TLS Details -->
          <div class="panel">
            <div class="panel-title">🔒 TLS / Certificate Details</div>
            <div id="tls-details"></div>
          </div>
          <!-- Quantum Gauge -->
          <div class="panel" style="display:flex;flex-direction:column;align-items:center;">
            <div class="panel-title" style="width:100%;">⏳ PQC Readiness Score</div>
            <div style="position:relative;width:220px;height:220px;">
              <canvas id="scanner-gauge" style="width:220px;height:220px;display:block;"></canvas>
              <div id="scanner-gauge-label" style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);text-align:center;">
                <div style="font-family:Rajdhani,sans-serif;font-size:44px;font-weight:800;color:#e53e3e;" id="qr-score-big">—</div>
                <div style="font-size:11px;color:#888;">/100 PQC Score</div>
              </div>
            </div>
            <div id="quantum-factors" style="width:100%;margin-top:10px;"></div>
          </div>
        </div>

        <!-- Cert Expiry Timeline -->
        <div class="panel" style="margin-top:14px;" id="cert-timeline-panel">
          <div class="panel-title">📅 Certificate Validity Timeline</div>
          <div id="cert-timeline"></div>
        </div>

        <!-- Cipher Threat Matrix -->
        <div class="panel" style="margin-top:14px;">
          <div class="panel-title">🛡️ Cipher Threat Matrix — CBOM Components</div>
          <div id="cipher-table"></div>
        </div>

        <!-- Vulnerability Fix Cards -->
        <div id="vuln-cards" style="margin-top:14px;"></div>

        <!-- Innovation panels (populated by scanner-addons.js, scanner-innovations-v2.js) -->
        <div id="hndl-timeline-panel"    style="margin-top:14px;display:none;"></div>
        <div id="migration-cost-panel"   style="margin-top:14px;display:none;"></div>
        <div id="cert-chain-panel"       style="margin-top:14px;display:none;"></div>
        <div id="dns-intel-panel"        style="margin-top:14px;display:none;"></div>
        <div id="nist-compliance-panel"  style="margin-top:14px;display:none;"></div>
        <div id="scan-diff-panel"        style="margin-top:14px;display:none;"></div>
        <div id="insurance-calc-panel"   style="margin-top:14px;display:none;"></div>
        <div id="crypto-dna-panel"       style="margin-top:14px;display:none;"></div>
        <div id="quantum-tracker-panel"  style="margin-top:14px;display:none;"></div>
        <div id="shadow-it-panel"        style="margin-top:14px;display:none;"></div>
        <div id="handshake-sim-panel"    style="margin-top:14px;display:none;"></div>
        <div id="sunset-calendar-panel"  style="margin-top:14px;display:none;"></div>
        <div id="crypto-debt-panel"      style="margin-top:14px;display:none;"></div>
        <div id="rbi-compliance-panel"   style="margin-top:14px;display:none;"></div>
        <div id="defense-rings-panel"    style="margin-top:14px;display:none;"></div>
        <div id="predictive-ai-panel"    style="margin-top:14px;display:none;"></div>
        <div id="zt-domain-panel"        style="margin-top:14px;display:none;"></div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:12px;margin-top:14px;flex-wrap:wrap;">
          <button class="btn-export" onclick="QSR.saveScanToCBOM()">💾 Save to CBOM Database</button>
          <button class="btn-export" onclick="QSR.exportScanCycloneDX()">⬇ Export CycloneDX JSON</button>
          <button class="btn-scan-sm" onclick="QSR.runTLSScan()">↺ Rescan</button>
        </div>
      </div>

      <!-- Fleet Scan Results -->
      <div id="fleet-results" style="display:none;margin-top:18px;"></div>

      <!-- Compare Results -->
      <div id="compare-results" style="display:none;margin-top:18px;"></div>

      <!-- Scan History (this session) -->
      <div class="panel" style="margin-top:18px;">
        <div class="panel-title">🕑 Recent Scans (This Session) <span id="scan-count-badge" class="tab-badge" style="display:none;"></span></div>
        <div id="scan-history-list"><div style="color:#888;font-size:13px;padding:10px 0;">No scans yet this session.</div></div>
      </div>

      <!-- DB Scan History -->
      <div class="panel" style="margin-top:14px;border-top:2px solid rgba(66,153,225,0.3);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div class="panel-title" style="margin:0;">🗂 My Account Scan History <span id="db-history-badge" class="tab-badge" style="display:none;"></span></div>
          <button class="btn-scan-sm" onclick="QSR._loadDBHistory(true)" style="font-size:11px;">↺ Refresh</button>
        </div>
        <div id="db-history-list"><div style="color:#888;font-size:13px;padding:6px 0;">Loading your scan history...</div></div>
      </div>

    </div><!-- end #tab-content-tls -->

    <!-- ═══ SECURITY SCANNER TAB ═══ -->
    <div id="tab-content-security" style="display:none;margin-top:16px;">
      <div class="terminal-panel">
        <div class="terminal-topbar">
          <span class="terminal-dot" style="background:#ff5f57;"></span>
          <span class="terminal-dot" style="background:#febc2e;"></span>
          <span class="terminal-dot" style="background:#28c840;"></span>
          <span style="flex:1;text-align:center;font-size:12px;color:#888;letter-spacing:2px;">SECURITY RISK ASSESSMENT v1.0</span>
        </div>
        <div style="padding:24px 28px;">
          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› TARGET ACQUISITION</div>
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;">
            <input id="security-domain-input" class="terminal-input" placeholder="example.com"
              onkeydown="if(event.key==='Enter') window.unifiedScannerUI.startSecurityScan()"
              style="flex:1;">
            <button class="btn-scan" id="security-scan-btn" onclick="window.unifiedScannerUI.startSecurityScan()">▶ SCAN</button>
          </div>

          <div style="font-size:11px;color:#48bb78;letter-spacing:3px;margin-bottom:10px;">› MODULES</div>
          <div id="module-toggles" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:16px;">
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="module-services" checked style="cursor:pointer;">
              <span>📡 Services</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e0;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="module-xss" checked style="cursor:pointer;">
              <span>🚨 XSS Detection</span>
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
          <div id="error-msg-security" style="display:none;color:#e53e3e;font-size:12px;padding:4px 8px;background:rgba(229,62,62,0.08);border-radius:6px;border-left:3px solid #e53e3e;"></div>
        </div>
      </div>

      <!-- Security Progress -->
      <div id="scan-progress-security" style="display:none;margin-top:14px;">
        <div class="progress-wrap">
          <div id="scan-progress-bar-security" style="height:4px;background:linear-gradient(90deg,#8b1a2f,#4299e1);border-radius:2px;width:0%;transition:width 0.4s ease;"></div>
        </div>
        <div id="scan-status-msg-security" style="font-size:12px;color:#48bb78;margin-top:6px;text-align:center;font-family:'JetBrains Mono',monospace;"></div>
      </div>

      <!-- Security Results -->
      <div id="scan-results-security" style="display:none;margin-top:18px;"></div>

      <div style="margin-top:14px;padding:12px 16px;background:rgba(66,153,225,0.06);border-radius:10px;border-left:3px solid #4299e1;">
        <div style="font-size:12px;color:#4299e1;font-weight:700;margin-bottom:6px;">ℹ️ About Security Scanner</div>
        <div style="font-size:12px;color:#4a4a6a;line-height:1.6;">
          Performs passive reconnaissance: service detection, XSS payload testing, SQL injection probes, subdomain enumeration, and security header analysis. 
          Results vary based on domain accessibility from browser context (HTTPS restrictions apply).
        </div>
      </div>
    </div><!-- end #tab-content-security -->
  `;

  // Initialize the TLS scanner asset inventory & history
  window._scanHistory = window._scanHistory || [];
  if (QSR._renderScanHistory) QSR._renderScanHistory();
  setTimeout(function() { if (QSR._loadDBHistory) QSR._loadDBHistory(); }, 400);
  setTimeout(function() { if (QSR._loadScannerAssets) QSR._loadScannerAssets(); }, 200);

  // Unified scanner controller
  window.unifiedScannerUI = {
    currentTab: 'tls',

    switchTab(tab) {
      // Hide all tab content
      ['tls','security'].forEach(function(t) {
        var el = document.getElementById('tab-content-' + t);
        if (el) el.style.display = 'none';
        var btn = document.getElementById('tab-' + t);
        if (btn) {
          btn.style.borderBottom = '3px solid transparent';
          btn.style.color = '#888';
          btn.style.background = 'transparent';
        }
      });

      // Show selected
      var content = document.getElementById('tab-content-' + tab);
      if (content) content.style.display = 'block';
      var activeBtn = document.getElementById('tab-' + tab);
      if (activeBtn) {
        activeBtn.style.borderBottom = '3px solid #8b1a2f';
        activeBtn.style.color = '#8b1a2f';
        activeBtn.style.background = 'rgba(139,26,47,0.12)';
      }
      this.currentTab = tab;

      // Load security scanner if switching to it  
      if (tab === 'security') {
        _loadSecurityScanner(); // preload module
      }
    },

    async startSecurityScan() {
      const domain = (document.getElementById('security-domain-input')?.value || '').trim();
      if (!domain) {
        this._showSecurityError('Please enter a domain name');
        return;
      }

      const progressDiv = document.getElementById('scan-progress-security');
      const progressBar = document.getElementById('scan-progress-bar-security');
      const statusMsg = document.getElementById('scan-status-msg-security');
      const btn = document.getElementById('security-scan-btn');

      if (progressDiv) progressDiv.style.display = 'block';
      if (btn) { btn.disabled = true; btn.textContent = 'SCANNING...'; }
      if (progressBar) progressBar.style.width = '10%';
      if (statusMsg) statusMsg.textContent = 'Loading security scanner...';

      try {
        const mod = await _loadSecurityScanner();
        if (!mod || !mod.UnifiedSecurityScanner) {
          throw new Error('Security scanner module could not be loaded. Check browser console.');
        }

        if (progressBar) progressBar.style.width = '30%';
        if (statusMsg) statusMsg.textContent = 'Running security analysis...';

        const scanner = new mod.UnifiedSecurityScanner(domain);
        const options = {
          skipServices:   !document.getElementById('module-services')?.checked,
          skipXSS:        !document.getElementById('module-xss')?.checked,
          skipSQL:        !document.getElementById('module-sql')?.checked,
          skipSubdomains: !document.getElementById('module-subdomains')?.checked,
          skipHeaders:    !document.getElementById('module-headers')?.checked,
          verbose: true
        };

        if (progressBar) progressBar.style.width = '60%';
        const results = await scanner.runFullScan(options);
        if (progressBar) progressBar.style.width = '100%';

        this._displaySecurityResults(results, domain);

      } catch (err) {
        this._showSecurityError('Scan failed: ' + err.message);
      } finally {
        if (progressDiv) progressDiv.style.display = 'none';
        if (btn) { btn.disabled = false; btn.textContent = '▶ SCAN'; }
      }
    },

    _displaySecurityResults(results, domain) {
      const container = document.getElementById('scan-results-security');
      if (!container) return;
      container.style.display = 'block';

      const summary = results && results.summary ? results.summary : {};
      const breakdown = summary.vulnerabilityBreakdown || {};
      const total = summary.totalVulnerabilities || 0;
      const riskLevel = summary.overallRiskLevel || 'UNKNOWN';
      const riskColor = riskLevel === 'CRITICAL' ? '#e53e3e' : riskLevel === 'HIGH' ? '#ed8936' : riskLevel === 'MEDIUM' ? '#ecc94b' : '#48bb78';

      container.innerHTML = `
        <div class="panel" style="border-left:4px solid ${riskColor};">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
            <div class="panel-title" style="margin:0;">📊 Security Scan Results — ${domain}</div>
            <span style="font-size:13px;font-weight:700;padding:4px 12px;border-radius:8px;background:${riskColor}22;color:${riskColor};border:1px solid ${riskColor};">${riskLevel}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-bottom:18px;">
            <div style="text-align:center;padding:12px;background:rgba(66,153,225,0.1);border-radius:8px;">
              <div style="font-size:28px;font-weight:800;color:#4299e1;font-family:Rajdhani,sans-serif;">${total}</div>
              <div style="font-size:11px;color:#888;">Total Issues</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(229,62,62,0.1);border-radius:8px;">
              <div style="font-size:28px;font-weight:800;color:#e53e3e;font-family:Rajdhani,sans-serif;">${breakdown.CRITICAL || 0}</div>
              <div style="font-size:11px;color:#888;">Critical</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(237,137,54,0.1);border-radius:8px;">
              <div style="font-size:28px;font-weight:800;color:#ed8936;font-family:Rajdhani,sans-serif;">${breakdown.HIGH || 0}</div>
              <div style="font-size:11px;color:#888;">High</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(236,201,75,0.1);border-radius:8px;">
              <div style="font-size:28px;font-weight:800;color:#ecc94b;font-family:Rajdhani,sans-serif;">${breakdown.MEDIUM || 0}</div>
              <div style="font-size:11px;color:#888;">Medium</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(72,187,120,0.1);border-radius:8px;">
              <div style="font-size:28px;font-weight:800;color:#48bb78;font-family:Rajdhani,sans-serif;">${breakdown.LOW || 0}</div>
              <div style="font-size:11px;color:#888;">Low</div>
            </div>
          </div>
          ${total === 0 ? `
            <div style="text-align:center;padding:20px;color:#48bb78;">
              <div style="font-size:32px;margin-bottom:8px;">✅</div>
              <div style="font-weight:700;">No security issues detected</div>
              <div style="font-size:12px;color:#888;margin-top:4px;">The domain did not exhibit common vulnerability patterns in browser-side testing.</div>
            </div>` : ''}
          ${results && results.vulnerabilities && results.vulnerabilities.length ? `
            <div style="margin-top:14px;">
              <div style="font-size:12px;font-weight:700;color:#4a4a6a;margin-bottom:10px;">Detailed Findings</div>
              ${results.vulnerabilities.slice(0,20).map(v => {
                const vc = v.severity === 'CRITICAL' ? '#e53e3e' : v.severity === 'HIGH' ? '#ed8936' : v.severity === 'MEDIUM' ? '#ecc94b' : '#48bb78';
                return `<div class="vuln-card" style="border-left:4px solid ${vc};margin-bottom:8px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-weight:700;font-size:13px;color:#1a1a2e;">${v.type || v.title || 'Finding'}</span>
                    <span class="badge" style="background:${vc}22;color:${vc};border:1px solid ${vc};">${v.severity}</span>
                  </div>
                  <div style="font-size:12px;color:#4a4a6a;">${v.description || v.detail || ''}</div>
                  ${v.recommendation ? `<div style="font-size:11px;color:#276749;margin-top:6px;background:rgba(72,187,120,0.08);padding:6px;border-radius:4px;"><strong>Fix:</strong> ${v.recommendation}</div>` : ''}
                </div>`;
              }).join('')}
            </div>` : ''}
        </div>
      `;
    },

    _showSecurityError(msg) {
      const el = document.getElementById('error-msg-security');
      if (el) { el.textContent = '❌ ' + msg; el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 6000); }
    },

    exportResults(format) {
      console.log('Export not available from security tab for format:', format);
    }
  };
};
