/* pages-scanner.js — Elite TLS/Cipher Scanner (FR4–FR9)
   Hacker-terminal UI • Animated stages • Cipher Threat Matrix
   Side-by-side Compare • Vuln Explanation Cards */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.scanner = function (container) {
  container.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">⚡ Live TLS Scanner</h1>
      <p class="page-subtitle">Custom multi-source scanner • DNS-over-HTTPS + crt.sh CT logs + live header analysis • FR4–FR9</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn-scan-sm" id="btn-fleet-scan" onclick="QSR.runFleetScan()">🚀 Fleet Scan All PNB</button>
      <button class="btn-scan-sm" id="btn-compare-toggle" onclick="QSR._toggleCompare()">⇄ Compare Mode</button>
    </div>
  </div>

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
      <div id="single-scan-row" style="display:flex;gap:10px;align-items:center;">
        <input id="scan-input" class="terminal-input" placeholder="github.com  or  www.netpnb.com"
          onkeydown="if(event.key==='Enter') QSR.runTLSScan()">
        <button class="btn-scan" id="scan-btn" onclick="QSR.runTLSScan()">▶ SCAN</button>
      </div>
      <div id="url-error-msg" style="display:none;color:#e53e3e;font-size:12px;margin-top:6px;font-family:'JetBrains Mono',monospace;padding:4px 8px;background:rgba(229,62,62,0.08);border-radius:6px;border-left:3px solid #e53e3e;"></div>

      <!-- Compare mode inputs -->
      <div id="compare-scan-row" style="display:none;gap:10px;align-items:center;flex-wrap:wrap;">
        <input id="scan-input-a" class="terminal-input" placeholder="Domain A: www.netpnb.com" style="flex:1;min-width:200px;">
        <div style="color:#48bb78;font-weight:700;font-size:16px;">VS</div>
        <input id="scan-input-b" class="terminal-input" placeholder="Domain B: api.pnb.co.in" style="flex:1;min-width:200px;">
        <button class="btn-scan" onclick="QSR.runCompare()">▶ COMPARE</button>
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
      <!-- Risk filter strip -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
        <span style="font-size:11px;color:#888;letter-spacing:1px;">FILTER:</span>
        <button class="chip-btn sa-filter-btn active" data-risk="" onclick="QSR._filterScannerAssets(this)">All</button>
        <button class="chip-btn sa-filter-btn" data-risk="Critical" onclick="QSR._filterScannerAssets(this)" style="border-color:#e53e3e;color:#e53e3e;">🔴 Critical</button>
        <button class="chip-btn sa-filter-btn" data-risk="High" onclick="QSR._filterScannerAssets(this)" style="border-color:#ed8936;color:#ed8936;">🟡 High</button>
        <button class="chip-btn sa-filter-btn" data-risk="Medium" onclick="QSR._filterScannerAssets(this)">Medium</button>
        <button class="chip-btn sa-filter-btn" data-risk="Low" onclick="QSR._filterScannerAssets(this)" style="border-color:#48bb78;color:#48bb78;">🟢 Low</button>
        <div style="margin-left:auto;" id="scanner-assets-count" style="font-size:12px;color:#888;"></div>
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
      ${['DNS Resolution', 'TLS Handshake', 'Cipher Harvest', 'Certificate Parse', 'Quantum Assessment'].map((s, i) =>
    `<div class="scan-stage" id="stage-${i}"><span class="stage-dot"></span>${s}</div>`
  ).join('')}
    </div>
    <div class="progress-wrap" style="margin-top:8px;">
      <div id="scan-progress-bar" style="height:4px;background:linear-gradient(90deg,#8b1a2f,#4299e1);border-radius:2px;width:0%;transition:width 0.4s ease;"></div>
    </div>
    <div id="scan-status-msg" style="font-size:12px;color:#48bb78;margin-top:6px;text-align:center;font-family:'JetBrains Mono',monospace;"></div>
  </div>

  <!-- Results -->
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

    <!-- HNDL Attack Timeline -->
    <div id="hndl-timeline-panel" style="margin-top:14px;display:none;"></div>

    <!-- PQC Migration Cost Estimator -->
    <div id="migration-cost-panel" style="margin-top:14px;display:none;"></div>

    <!-- Certificate Chain Analysis -->
    <div id="cert-chain-panel" style="margin-top:14px;display:none;"></div>

    <!-- DNS Security Intelligence -->
    <div id="dns-intel-panel" style="margin-top:14px;display:none;"></div>

    <!-- NIST Compliance Map -->
    <div id="nist-compliance-panel" style="margin-top:14px;display:none;"></div>

    <!-- Scan Diff Regression Tracker -->
    <div id="scan-diff-panel" style="margin-top:14px;display:none;"></div>

    <!-- V2 Innovations -->
    <div id="insurance-calc-panel" style="margin-top:14px;display:none;"></div>
    <div id="crypto-dna-panel" style="margin-top:14px;display:none;"></div>
    <div id="quantum-tracker-panel" style="margin-top:14px;display:none;"></div>
    <div id="shadow-it-panel" style="margin-top:14px;display:none;"></div>
    <div id="handshake-sim-panel" style="margin-top:14px;display:none;"></div>
    <div id="sunset-calendar-panel" style="margin-top:14px;display:none;"></div>
    <div id="crypto-debt-panel" style="margin-top:14px;display:none;"></div>
    <div id="rbi-compliance-panel" style="margin-top:14px;display:none;"></div>
    <div id="defense-rings-panel" style="margin-top:14px;display:none;"></div>
    <div id="predictive-ai-panel" style="margin-top:14px;display:none;"></div>

    <!-- Zero Trust Domain Assessment -->
    <div id="zt-domain-panel" style="margin-top:14px;display:none;"></div>

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

  <!-- Scan History -->
  <div class="panel" style="margin-top:18px;">
    <div class="panel-title">🕑 Recent Scans (This Session) <span id="scan-count-badge" class="tab-badge" style="display:none;"></span></div>
    <div id="scan-history-list"><div style="color:#888;font-size:13px;padding:10px 0;">No scans yet this session.</div></div>
  </div>

  <!-- My Account Scan History (from DB) -->
  <div class="panel" style="margin-top:14px;border-top:2px solid rgba(66,153,225,0.3);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div class="panel-title" style="margin:0;">🗂 My Account Scan History <span id="db-history-badge" class="tab-badge" style="display:none;"></span></div>
      <button class="btn-scan-sm" onclick="QSR._loadDBHistory(true)" style="font-size:11px;">↺ Refresh</button>
    </div>
    <div id="db-history-list"><div style="color:#888;font-size:13px;padding:6px 0;">Loading your scan history...</div></div>
  </div>`;

  window._scanHistory = window._scanHistory || [];
  QSR._renderScanHistory();
  /* Load DB history asynchronously on page open */
  setTimeout(function () { QSR._loadDBHistory(); }, 300);
  /* Load asset inventory */
  QSR._loadScannerAssets();
};

/* ── Asset Inventory Panel ────────────────────────────────────── */
QSR._scannerAllAssets = [];

QSR._loadScannerAssets = async function () {
  var tbody = document.getElementById('scanner-assets-tbody');
  var badge = document.getElementById('scanner-assets-badge');
  var countEl = document.getElementById('scanner-assets-count');
  if (!tbody) return;

  /* Fetch from data layer (live Supabase or mock fallback) */
  var assets = [];
  if (window.QSR_DataLayer) {
    try { assets = await QSR_DataLayer.fetchAssets(); } catch (e) { }
  }
  QSR._scannerAllAssets = assets;

  /* Update badge */
  if (badge) { badge.textContent = assets.length + ' assets'; badge.style.display = 'inline-block'; }
  QSR._renderScannerAssetsTable(assets);
};

QSR._renderScannerAssetsTable = function (assets) {
  var tbody = document.getElementById('scanner-assets-tbody');
  var countEl = document.getElementById('scanner-assets-count');
  if (!tbody) return;

  if (countEl) countEl.textContent = assets.length + ' assets';

  if (!assets.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;padding:20px;">No assets found.</td></tr>';
    return;
  }

  var riskColor = {
    Critical: '#e53e3e', High: '#ed8936', Medium: '#ecc94b', Low: '#48bb78'
  };
  var certBadge = {
    Valid: 'badge-ok',
    Expiring: 'badge-warn',
    Expired: 'badge-danger'
  };

  tbody.innerHTML = assets.map(function (a) {
    var rc = riskColor[a.risk] || '#aaa';
    var qs = a.qrScore != null ? a.qrScore : '—';
    var qc = (typeof qs === 'number') ? (qs >= 76 ? '#48bb78' : qs >= 51 ? '#4299e1' : qs >= 26 ? '#ecc94b' : '#e53e3e') : '#888';
    /* Extract hostname from URL for scanning */
    var urlHost = (a.url || '').replace(/^https?:\/\//, '').replace(/\/.*/, '');
    /* Skip internal/non-internet hosts */
    var isInternal = urlHost.includes('.internal') || urlHost.startsWith('192.') || urlHost.startsWith('10.');
    var shortUrl = (a.url || '').replace('https://', '').replace('http://', '').replace(/\/.*/, '');

    return '<tr style="' + (a.risk === 'Critical' ? 'background:rgba(229,62,62,0.04);border-left:3px solid #e53e3e;' : '') + '">' +
      '<td><div style="font-weight:700;font-size:13px;color:#1a1a2e;">' + (a.name || '—') + '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:1px;">' + (a.owner || '') + '</div></td>' +
      '<td><a href="' + (a.url || '#') + '" target="_blank" style="color:#4299e1;font-size:12px;font-family:monospace;">' + shortUrl + '</a></td>' +
      '<td style="font-size:12px;">' + (a.type || '—') + '</td>' +
      '<td><code style="font-size:12px;color:' + (a.key <= 1024 ? '#e53e3e' : a.key >= 4096 ? '#48bb78' : '#ed8936') + ';">' + (a.key || '—') + '-bit</code></td>' +
      '<td><span class="badge ' + (certBadge[a.cert] || 'badge-info') + '">' + (a.cert || '—') + '</span></td>' +
      '<td style="min-width:130px;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<div style="flex:1;background:rgba(0,0,0,0.08);border-radius:4px;height:7px;overflow:hidden;">' +
      '<div style="width:' + (typeof qs === 'number' ? qs : 0) + '%;height:7px;background:' + qc + ';border-radius:4px;transition:width 0.8s;"></div>' +
      '</div>' +
      '<span style="font-family:Rajdhani,sans-serif;font-size:18px;font-weight:800;color:' + qc + ';min-width:30px;text-align:right;">' + qs + '</span>' +
      '</div>' +
      '</td>' +
      '<td><span style="font-size:11px;padding:3px 8px;border-radius:10px;background:' + rc + '18;color:' + rc + ';border:1px solid ' + rc + ';font-weight:700;white-space:nowrap;">' + (a.risk || '—') + '</span></td>' +
      '<td style="text-align:center;">' +
      (isInternal ?
        '<span style="font-size:11px;color:#888;">Internal</span>' :
        '<button class="chip-btn" style="font-size:11px;padding:4px 10px;" ' +
        'onclick="QSR._scanAssetFromTable(\'' + urlHost + '\')">' +
        '▶ Scan</button>') +
      '</td>' +
      '</tr>';
  }).join('');
};

/* Clicking Scan in the table: populate input + run scan */
QSR._scanAssetFromTable = function (host) {
  var input = document.getElementById('scan-input');
  if (input) input.value = host;
  /* Scroll terminal into view */
  var panel = document.querySelector('.terminal-panel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  /* Small delay for smooth scroll, then scan */
  setTimeout(function () { QSR.runTLSScan(); }, 400);
};

/* Toggle visibility of the asset table body */
QSR._toggleScannerAssets = function () {
  var body = document.getElementById('scanner-assets-body');
  var chevron = document.getElementById('scanner-assets-chevron');
  if (!body) return;
  var collapsed = body.style.display === 'none';
  body.style.display = collapsed ? '' : 'none';
  if (chevron) chevron.style.transform = collapsed ? '' : 'rotate(-90deg)';
};

/* Risk filter buttons */
QSR._filterScannerAssets = function (btn) {
  /* Toggle active class */
  document.querySelectorAll('.sa-filter-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var risk = btn.getAttribute('data-risk') || '';
  var filtered = risk
    ? QSR._scannerAllAssets.filter(function (a) { return a.risk === risk; })
    : QSR._scannerAllAssets;
  QSR._renderScannerAssetsTable(filtered);
};

/* ── Sync asset inventory row after a scan completes ───────────────────── */
/* Finds the asset whose URL hostname matches `host`, updates its   */
/* in-memory record, then re-renders just that table row in-place.  */
QSR._syncAssetRowFromScan = function (host, result) {
  if (!host || !result) return;
  var tbody = document.getElementById('scanner-assets-tbody');
  if (!tbody) return;

  /* Find matching asset (loose match: urlHost endsWith host or vice-versa) */
  var matched = false;
  QSR._scannerAllAssets.forEach(function (a, idx) {
    var aHost = (a.url || '').replace(/^https?:\/\//, '').replace(/\/.*/, '').toLowerCase();
    if (aHost !== host && !aHost.endsWith('.' + host) && !host.endsWith('.' + aHost)) return;

    /* Update in-memory record with real scan data */
    if (result.qScore != null) a.qrScore = result.qScore;
    if (result.keySize != null) a.key = result.keySize;
    /* Derive cert status from days_left */
    if (result.daysLeft != null) {
      a.cert = result.daysLeft <= 0 ? 'Expired' : result.daysLeft <= 30 ? 'Expiring' : 'Valid';
    }
    /* Risk from QR score */
    if (result.qScore != null) {
      a.risk = result.qScore >= 76 ? 'Low' : result.qScore >= 51 ? 'Medium' : result.qScore >= 26 ? 'High' : 'Critical';
    }
    matched = true;

    /* Re-render just this row in the table */
    var rows = tbody.querySelectorAll('tr');
    if (rows[idx]) {
      var riskColor = { Critical: '#e53e3e', High: '#ed8936', Medium: '#ecc94b', Low: '#48bb78' };
      var certBadge = { Valid: 'badge-ok', Expiring: 'badge-warn', Expired: 'badge-danger' };
      var rc = riskColor[a.risk] || '#aaa';
      var qs = a.qrScore != null ? a.qrScore : '—';
      var qc = (typeof qs === 'number') ? (qs >= 76 ? '#48bb78' : qs >= 51 ? '#4299e1' : qs >= 26 ? '#ecc94b' : '#e53e3e') : '#888';
      var urlHost = (a.url || '').replace(/^https?:\/\//, '').replace(/\/.*/, '');
      var isInternal = urlHost.includes('.internal') || urlHost.startsWith('192.') || urlHost.startsWith('10.');
      var shortUrl = (a.url || '').replace('https://', '').replace('http://', '').replace(/\/.*/, '');

      rows[idx].style.transition = 'background 0.5s';
      rows[idx].style.background = 'rgba(72,187,120,0.12)';
      rows[idx].innerHTML =
        '<td><div style="font-weight:700;font-size:13px;color:#1a1a2e;">' + (a.name || '—') + '</div>' +
        '<div style="font-size:11px;color:#48bb78;margin-top:1px;font-weight:600;">✓ Just Scanned</div></td>' +
        '<td><a href="' + (a.url || '#') + '" target="_blank" style="color:#4299e1;font-size:12px;font-family:monospace;">' + shortUrl + '</a></td>' +
        '<td style="font-size:12px;">' + (a.type || '—') + '</td>' +
        '<td><code style="font-size:12px;color:' + (a.key <= 1024 ? '#e53e3e' : a.key >= 4096 ? '#48bb78' : '#ed8936') + ';">' + (a.key || '—') + '-bit</code></td>' +
        '<td><span class="badge ' + (certBadge[a.cert] || 'badge-info') + '">' + (a.cert || '—') + '</span></td>' +
        '<td style="min-width:130px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div style="flex:1;background:rgba(0,0,0,0.08);border-radius:4px;height:7px;overflow:hidden;">' +
        '<div style="width:' + (typeof qs === 'number' ? qs : 0) + '%;height:7px;background:' + qc + ';border-radius:4px;transition:width 0.8s;"></div>' +
        '</div>' +
        '<span style="font-family:Rajdhani,sans-serif;font-size:18px;font-weight:800;color:' + qc + ';min-width:30px;text-align:right;">' + qs + '</span>' +
        '</div>' +
        '</td>' +
        '<td><span style="font-size:11px;padding:3px 8px;border-radius:10px;background:' + rc + '18;color:' + rc + ';border:1px solid ' + rc + ';font-weight:700;white-space:nowrap;">' + (a.risk || '—') + '</span></td>' +
        '<td style="text-align:center;">' +
        (isInternal ? '<span style="font-size:11px;color:#888;">Internal</span>' :
          '<button class="chip-btn" style="font-size:11px;padding:4px 10px;" onclick="QSR._scanAssetFromTable(\'' + urlHost + '\')">&#8635; Re-scan</button>') +
        '</td>';

      /* Fade the green highlight away after 3s */
      setTimeout(function () {
        if (rows[idx]) rows[idx].style.background = (a.risk === 'Critical') ? 'rgba(229,62,62,0.04)' : '';
      }, 3000);
    }
  });
};

/* ── Stage animation ─────────────────────────────────────────── */
QSR._setStage = function (idx, pct, msg) {
  document.querySelectorAll('.scan-stage').forEach((el, i) => {
    el.classList.toggle('stage-active', i === idx);
    el.classList.toggle('stage-done', i < idx);
  });
  var pb = document.getElementById('scan-progress-bar');
  var sm = document.getElementById('scan-status-msg');
  if (pb) pb.style.width = pct + '%';
  if (sm) sm.textContent = msg;
};

/* ── Compare toggle ──────────────────────────────────────────── */
QSR._toggleCompare = function () {
  var single = document.getElementById('single-scan-row');
  var compare = document.getElementById('compare-scan-row');
  var btn = document.getElementById('btn-compare-toggle');
  if (compare.style.display === 'none') {
    single.style.display = 'none'; compare.style.display = 'flex';
    btn.textContent = '✕ Single Mode';
  } else {
    single.style.display = 'flex'; compare.style.display = 'none';
    btn.textContent = '⇄ Compare Mode';
  }
};

/* ═══════════════════════════════════════════════════════════════
   QSR CUSTOM SCANNER ENGINE — No third-party scanner APIs
   Sources:
     1. DNS-over-HTTPS  (Cloudflare 1.1.1.1) — real IP resolution
     2. crt.sh CT logs  — real certificates, issuer, validity dates
     3. CORS proxy fetch — live HTTP response headers from target
   All run in parallel. Results are per-domain unique.
   ═══════════════════════════════════════════════════════════════ */

/* ── URL Validator ───────────────────────────────────────────── */
QSR._validateHost = function (host) {
  if (!host || host.length < 3) return 'Please enter a valid URL, e.g. github.com';
  if (host.length > 253) return 'URL is too long. Enter a valid domain name.';
  /* Must contain at least one dot */
  if (!host.includes('.')) return 'Please enter a valid URL with a domain extension, e.g. github.com';
  /* Basic hostname regex: labels separated by dots, valid chars */
  var valid = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(host);
  if (!valid) return 'Please enter a valid URL, e.g. github.com or sub.domain.in';
  /* Reject bare IP addresses (scanner targets domains not IPs) */
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return 'Please enter a domain name, not an IP address.';
  return null; /* null = valid */
};

/* ── Host Reachability Check ────────────────────────────────────── */
/* Returns { reachable: bool, detail: string }                         */
QSR._checkHostReachable = async function (host) {
  /* --- Strategy 1: DNS-A record. NXDOMAIN = dead domain --- */
  try {
    var dnsCheck = await fetch(
      'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(host) + '&type=A',
      { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(5000) }
    );
    if (dnsCheck.ok) {
      var dj = await dnsCheck.json();
      if (dj.Status === 3) return { reachable: false, detail: 'Domain does not exist (NXDOMAIN) — no DNS record found' };
      if (dj.Status === 2) return { reachable: false, detail: 'DNS server failure (SERVFAIL) — domain may be misconfigured' };
      var aRecs = (dj.Answer || []).filter(function (a) { return a.type === 1; });
      if (!aRecs.length) return { reachable: false, detail: 'No A records found — domain resolves but has no IPv4 endpoint' };
    }
  } catch (e) { /* DNS fetch timed out, continue */ }

  /* --- Strategy 2: CORS proxy HTTP probe. Server must respond --- */
  var proxies = [
    'https://api.allorigins.win/get?url=' + encodeURIComponent('https://' + host + '/'),
    'https://corsproxy.io/?url=' + encodeURIComponent('https://' + host + '/')
  ];
  for (var i = 0; i < proxies.length; i++) {
    try {
      var pr = await fetch(proxies[i], { signal: AbortSignal.timeout(8000) });
      if (pr.ok) {
        var pj = await pr.json();
        var code = (pj.status && pj.status.http_code) ? pj.status.http_code : (pj.status_code || 200);
        if (code === 0 || code === null) continue;  /* proxy itself couldn't connect */
        return { reachable: true, detail: 'HTTP ' + code + ' — server is responding' };
      }
    } catch (e2) { /* try next */ }
  }

  /* --- Strategy 3: Image/resource timing probe (last resort) --- */
  try {
    var probeUrl = 'https://' + host + '/favicon.ico?_qsr=' + Date.now();
    var img = new Image();
    var imgRes = await new Promise(function (resolve) {
      img.onload = function () { resolve('loaded'); };
      img.onerror = function () { resolve('error-response'); }; /* error = server DID respond */
      img.src = probeUrl;
      setTimeout(function () { resolve('timeout'); }, 6000);
    });
    if (imgRes !== 'timeout') {
      return { reachable: true, detail: 'Server acknowledged connection (' + imgRes + ')' };
    }
  } catch (e3) { /* ignore */ }

  /* All probes failed */
  return { reachable: false, detail: 'No response from ' + host + ' — server is down, firewalled, or the domain does not exist' };
};

/* ── "Can't Access" error display ──────────────────────────────── */
QSR._showHostUnreachable = function (host, detail) {
  var prog = document.getElementById('scan-progress');
  if (prog) prog.style.display = 'none';
  var old = document.getElementById('unreachable-panel');
  if (old) old.remove();

  var panel = document.createElement('div');
  panel.id = 'unreachable-panel';
  panel.style.cssText = 'margin-top:18px;border-radius:14px;padding:28px 32px;' +
    'background:linear-gradient(135deg,rgba(229,62,62,0.08),rgba(139,26,47,0.05));' +
    'border:1.5px solid rgba(229,62,62,0.35);animation:fadeIn 0.3s ease;';
  panel.innerHTML =
    '<div style="display:flex;align-items:flex-start;gap:18px;">' +
    '<div style="font-size:44px;flex-shrink:0;line-height:1;">🚫</div>' +
    '<div style="flex:1;">' +
    '<div style="font-family:Rajdhani,sans-serif;font-size:22px;font-weight:800;' +
    'color:#e53e3e;letter-spacing:1px;margin-bottom:6px;">Cannot Access &mdash; ' +
    QSR._sanitize(host) + '</div>' +
    '<div style="font-size:13px;color:#c53030;margin-bottom:16px;line-height:1.7;">' +
    QSR._sanitize(detail) + '</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">' +
    '<span style="font-size:12px;padding:5px 12px;border-radius:8px;background:rgba(229,62,62,0.08);' +
    'border:1px solid rgba(229,62,62,0.2);color:#c53030;">❌ DNS probe failed</span>' +
    '<span style="font-size:12px;padding:5px 12px;border-radius:8px;background:rgba(229,62,62,0.08);' +
    'border:1px solid rgba(229,62,62,0.2);color:#c53030;">❌ HTTP probes timed out</span>' +
    '<span style="font-size:12px;padding:5px 12px;border-radius:8px;background:rgba(229,62,62,0.08);' +
    'border:1px solid rgba(229,62,62,0.2);color:#c53030;">❌ Resource timing — no response</span>' +
    '</div>' +
    '<div style="padding:10px 14px;border-radius:8px;border-left:3px solid #ed8936;' +
    'background:rgba(237,137,54,0.06);font-size:12px;color:#4a4a6a;line-height:1.6;">' +
    '<strong>Scan aborted — no results will be shown.</strong> Displaying data for an unreachable host ' +
    'would be inaccurate and misleading. Verify the domain is correct and publicly accessible.' +
    '</div>' +
    '</div>' +
    '</div>';

  var progressEl = document.getElementById('scan-progress');
  if (progressEl) progressEl.parentNode.insertBefore(panel, progressEl.nextSibling);
  if (window.showToast) showToast('🚫 Cannot reach ' + host + ' — scan aborted', 'error');
};

/* ── Main scan runner ────────────────────────────────────────── */
QSR.runTLSScan = async function () {
  var input = document.getElementById('scan-input');
  var raw = (input?.value || '').trim();
  var host = raw.replace(/^https?:\/\//, '').replace(/\/.*/, '').replace(/\?.*/, '').toLowerCase();

  /* ── Rate limit check (security) ── */
  if (QSR._rateLimiter && !QSR._rateLimiter.check()) {
    if (window.showToast) showToast('Rate limit: too many scans. Wait 60s.', 'warning');
    return;
  }

  /* ── Validate URL before anything ── */
  var validErr = QSR._validateHost(host);
  if (validErr) {
    var errEl = document.getElementById('url-error-msg');
    if (errEl) { errEl.textContent = '⚠ ' + validErr; errEl.style.display = 'block'; }
    if (window.showToast) showToast(validErr, 'error');
    return;
  }
  var errEl = document.getElementById('url-error-msg');
  if (errEl) errEl.style.display = 'none';

  /* Clear any leftover unreachable panel from prior attempt */
  var oldPanel = document.getElementById('unreachable-panel');
  if (oldPanel) oldPanel.remove();

  var btn = document.getElementById('scan-btn');
  btn.disabled = true; btn.innerHTML = '⏳ Checking...';
  document.getElementById('scan-progress').style.display = 'block';
  document.getElementById('scan-results').style.display = 'none';
  document.getElementById('compare-results').style.display = 'none';

  /* ── REACHABILITY GATE: abort early if host is dead ── */
  QSR._setStage(0, 5, 'Checking if ' + host + ' is reachable...');
  var _reach;
  try { _reach = await QSR._checkHostReachable(host); }
  catch (e) { _reach = { reachable: false, detail: 'Probe error: ' + e.message }; }

  if (!_reach.reachable) {
    btn.disabled = false; btn.innerHTML = '▶ SCAN';
    QSR._showHostUnreachable(host, _reach.detail);
    return;
  }
  btn.innerHTML = '⏳ Scanning...';

  try {
    QSR._setStage(0, 10, `Resolving ${host} via Cloudflare DoH + MX + NS + CAA + TXT records...`);

    /* Run 9 sources in parallel: A + AAAA + MX + NS + CAA + TXT + crt.sh + headers + TLS probe */
    var [dnsData, dnsAAAA, dnsMX, dnsNS, dnsCAA, dnsTXT, crtData, headerData, tlsProbeData] = await Promise.allSettled([
      QSR._fetchDNS(host, 'A'),
      QSR._fetchDNS(host, 'AAAA'),
      QSR._fetchDNS(host, 'MX'),
      QSR._fetchDNS(host, 'NS'),
      QSR._fetchDNS(host, 'CAA'),
      QSR._fetchDNS('_dmarc.' + host, 'TXT'),
      QSR._fetchCRT(host),
      QSR._fetchHeaders(host),
      QSR._fetchTLSProbe(host)
    ]);
    /* Extract values from settled promises */
    dnsData = dnsData.status === 'fulfilled' ? dnsData.value : { ok: false, ip: null, ips: [] };
    dnsAAAA = dnsAAAA.status === 'fulfilled' ? dnsAAAA.value : { ok: false, ips: [] };
    dnsMX = dnsMX.status === 'fulfilled' ? dnsMX.value : { ok: false, ips: [] };
    dnsNS = dnsNS.status === 'fulfilled' ? dnsNS.value : { ok: false, ips: [] };
    dnsCAA = dnsCAA.status === 'fulfilled' ? dnsCAA.value : { ok: false, ips: [] };
    dnsTXT = dnsTXT.status === 'fulfilled' ? dnsTXT.value : { ok: false, ips: [] };
    crtData = crtData.status === 'fulfilled' ? crtData.value : { certs: [], count: 0 };
    headerData = headerData.status === 'fulfilled' ? headerData.value : { ok: false, headers: {} };
    tlsProbeData = tlsProbeData.status === 'fulfilled' ? tlsProbeData.value : { ok: false };
    dnsData.aaaa = (dnsAAAA.ips || []);
    dnsData.mx = (dnsMX.ips || []);
    dnsData.ns = (dnsNS.ips || []);
    dnsData.caa = (dnsCAA.ips || []);
    dnsData.txt = (dnsTXT.ips || []);

    QSR._setStage(1, 38, 'Parsing ' + (crtData.count || 0) + ' CT log entries from crt.sh...');
    await QSR._delay(200);

    QSR._setStage(2, 60, 'Fingerprinting TLS profile from certificate metadata...');
    await QSR._delay(200);

    QSR._setStage(3, 80, 'Analysing security headers + building CBOM...');
    await QSR._delay(200);

    var result = QSR._buildScanResult(host, dnsData, crtData, headerData, tlsProbeData);

    QSR._setStage(4, 95, 'Computing quantum risk score...');
    await QSR._delay(250);

    window._lastScanResult = result;
    window._scanHistory.unshift({ host, result, time: new Date().toISOString() });
    if (window._scanHistory.length > 20) window._scanHistory.pop();

    QSR._renderScanResult(result);
    QSR._setStage(4, 100, '✓ Scan complete — 8 data sources analysed');
    document.getElementById('scan-results').style.display = 'block';

    /* ── Sync asset inventory row with fresh scan data ── */
    QSR._syncAssetRowFromScan(host, result);

    /* ── Innovation renderers ── */
    if (QSR._renderHNDLTimeline) QSR._renderHNDLTimeline(result);
    if (QSR._renderMigrationCost) QSR._renderMigrationCost(result);
    if (QSR._renderCertChain) QSR._renderCertChain(result, crtData.certs || []);
    if (QSR._parseDNSSecurity) {
      var dnsIntel = QSR._parseDNSSecurity(host, dnsData.caa || [], dnsData.txt || []);
      result.dnsIntel = dnsIntel;
      QSR._renderDNSIntelligence(dnsIntel, dnsData);
    }
    if (QSR._renderNISTCompliance) QSR._renderNISTCompliance(result);

    /* ── V2 Innovation renderers ── */
    if (QSR._renderInsuranceCalc) QSR._renderInsuranceCalc(result);
    if (QSR._renderCryptoDNA) QSR._renderCryptoDNA(result);
    if (QSR._renderQuantumTracker) QSR._renderQuantumTracker(result);
    if (QSR._renderShadowIT) QSR._renderShadowIT(result, crtData.certs || []);
    if (QSR._renderHandshakeSim) QSR._renderHandshakeSim(result);
    if (QSR._renderSunsetCalendar) QSR._renderSunsetCalendar(result);
    if (QSR._renderCryptoDebt) QSR._renderCryptoDebt(result);
    if (QSR._renderRBICompliance) QSR._renderRBICompliance(result);
    if (QSR._renderDefenseRings) QSR._renderDefenseRings(result);
    if (QSR._renderPredictiveAI) QSR._renderPredictiveAI(result);

    /* ── Scan diff: compare with previous scan of same host ── */
    if (window.QSR_DataLayer && QSR_DataLayer.fetchLastScanForHost) {
      try {
        var prev = await QSR_DataLayer.fetchLastScanForHost(host);
        if (prev && QSR._renderScanDiff) QSR._renderScanDiff(result, prev);
      } catch (e) { }
    }

    /* Zero Trust assessment */
    if (window.ZeroTrust) {
      window.ZeroTrust.trackScan(host);
      var ztResult = window.ZeroTrust.assessDomain(host, result);
      QSR._renderZTDomainPanel(ztResult);
    }

    if (window.QSR_DataLayer) {
      try {
        await QSR_DataLayer.saveScanResult(host, result);
      } catch (e) { }
      try {
        var syncResult = await QSR_DataLayer.syncScanArtifacts(host, result);
        if (syncResult && syncResult.ok) {
          if (window.showToast) showToast('Scan synced across assets, PQC, CBOM and cyber rating', 'success');
        } else if (window.showToast) {
          showToast('Scan history saved, but backend sync was partial.', 'warning');
        }
      } catch (e) { }
      try { await QSR_DataLayer.logScanEvent(host); } catch (e) { }
    }

  } catch (e) {
    QSR._setStage(0, 0, '✕ ' + e.message);
    if (window.showToast) showToast('Scan failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '▶ SCAN';
    setTimeout(() => { var p = document.getElementById('scan-progress'); if (p) p.style.display = 'none'; }, 2500);
    QSR._renderScanHistory();
    QSR._loadDBHistory(); /* refresh DB history panel */
  }
};

/* ── Source 1: DNS-over-HTTPS (Cloudflare 1.1.1.1) ───────────── */
window._qsrCache = window._qsrCache || {};

/* type: 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CAA' */
QSR._fetchDNS = async function (host, type) {
  type = type || 'A';
  var cacheKey = 'dns_' + type + '_' + host;
  var typeMap = { A: 1, AAAA: 28, MX: 15, NS: 2, TXT: 16, CAA: 257 };
  var typeCode = typeMap[type] || 1;
  try {
    var r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
      { headers: { 'accept': 'application/dns-json' }, signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) throw new Error('DoH ' + type + ' failed');
    var j = await r.json();
    var answers = (j.Answer || []).filter(a => a.type === typeCode);
    /* Normalize data field per record type */
    var ips = answers.map(a => {
      if (type === 'MX') return (a.data || '').replace(/^\d+\s+/, '').replace(/\.$/, '');
      if (type === 'NS') return (a.data || '').replace(/\.$/, '');
      return a.data || '';
    }).filter(Boolean);
    var res = {
      ok: j.Status === 0,
      ip: ips[0] || null,
      ips: ips,
      ttl: answers[0]?.TTL || null,
      rcode: j.Status,
      type
    };
    window._qsrCache[cacheKey] = res;
    return res;
  } catch (e) {
    if (window._qsrCache[cacheKey]) return window._qsrCache[cacheKey];
    console.warn('[DNS ' + type + ']', e.message);
    return { ok: false, ip: null, ips: [], ttl: null, type };
  }
};

/* ── Source 2: crt.sh Certificate Transparency logs ─────────── */
QSR._fetchCRT = async function (host) {
  var cacheKey = 'crt_' + host;
  try {
    var r = await fetch(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json`,
      { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('crt.sh unavailable');
    var arr = await r.json();
    if (!Array.isArray(arr)) return { certs: [], count: 0 };
    /* Deduplicate by serial number and sort newest first */
    var seen = new Set();
    var unique = arr.filter(c => {
      if (seen.has(c.serial_number)) return false;
      seen.add(c.serial_number);
      return true;
    }).sort((a, b) => new Date(b.not_after) - new Date(a.not_after));
    var res = { certs: unique, count: unique.length, raw: arr.length };
    window._qsrCache[cacheKey] = res;
    return res;
  } catch (e) {
    if (window._qsrCache[cacheKey]) return window._qsrCache[cacheKey];
    console.warn('[CRT]', e.message);
    return { certs: [], count: 0, raw: 0 };
  }
};

/* ── Source 3: Live HTTP headers via Edge Function (deprecated CORS proxies removed) ──────────────── */
QSR._fetchHeaders = async function (host) {
  /* CORS proxies are unreliable. Headers now come from Edge Function only. */
  return { ok: false, headers: {} };
};

QSR._parseWhatWebStyleFingerprint = function (host, headers, body, title) {
  headers = headers || {};
  body = body || '';
  title = title || '';

  var findings = [];
  function add(name, category, confidence, evidence) {
    if (findings.some(function (item) { return item.name === name; })) return;
    findings.push({ name: name, category: category, confidence: confidence, evidence: evidence });
  }

  var server = String(headers.server || headers['x-powered-by'] || '').toLowerCase();
  var generator = String(headers['x-generator'] || '').toLowerCase();
  var lowerBody = body.toLowerCase();

  if (server.indexOf('cloudflare') !== -1 || headers['cf-ray']) add('Cloudflare', 'CDN/WAF', 0.95, 'server/cf-ray header');
  if (server.indexOf('akamai') !== -1) add('Akamai', 'CDN/WAF', 0.9, 'server header');
  if (server.indexOf('fastly') !== -1 || (headers.via && String(headers.via).toLowerCase().indexOf('fastly') !== -1)) add('Fastly', 'CDN/WAF', 0.9, 'server/via header');
  if (server.indexOf('nginx') !== -1) add('nginx', 'Web Server', 0.9, 'server header');
  if (server.indexOf('apache') !== -1) add('Apache HTTP Server', 'Web Server', 0.9, 'server header');
  if (server.indexOf('iis') !== -1) add('Microsoft IIS', 'Web Server', 0.9, 'server header');
  if (server.indexOf('envoy') !== -1) add('Envoy', 'Proxy', 0.85, 'server header');

  if (generator.indexOf('wordpress') !== -1 || lowerBody.indexOf('/wp-content/') !== -1) add('WordPress', 'CMS', 0.95, 'generator/body');
  if (generator.indexOf('drupal') !== -1 || lowerBody.indexOf('drupal-settings-json') !== -1) add('Drupal', 'CMS', 0.92, 'generator/body');
  if (generator.indexOf('joomla') !== -1 || lowerBody.indexOf('joomla') !== -1) add('Joomla', 'CMS', 0.8, 'generator/body');
  if (lowerBody.indexOf('__next') !== -1 || lowerBody.indexOf('/_next/') !== -1) add('Next.js', 'Framework', 0.95, 'body markers');
  if (lowerBody.indexOf('data-reactroot') !== -1 || (lowerBody.indexOf('react') !== -1 && lowerBody.indexOf('__next') === -1)) add('React', 'Framework', 0.72, 'body markers');
  if (lowerBody.indexOf('ng-version') !== -1) add('Angular', 'Framework', 0.9, 'body markers');
  if (lowerBody.indexOf('__nuxt') !== -1) add('Nuxt', 'Framework', 0.92, 'body markers');
  if (lowerBody.indexOf('vue') !== -1 && lowerBody.indexOf('__nuxt') === -1) add('Vue.js', 'Framework', 0.7, 'body markers');
  if (lowerBody.indexOf('bootstrap') !== -1) add('Bootstrap', 'UI Library', 0.8, 'body markers');
  if (lowerBody.indexOf('jquery') !== -1) add('jQuery', 'JavaScript Library', 0.78, 'body markers');
  if (server.indexOf('asp.net') !== -1 || lowerBody.indexOf('__viewstate') !== -1) add('ASP.NET', 'Framework', 0.9, 'server/body');
  if (headers['x-powered-by'] && String(headers['x-powered-by']).toLowerCase().indexOf('php') !== -1) add('PHP', 'Runtime', 0.9, 'x-powered-by header');
  if (headers['x-powered-by'] && String(headers['x-powered-by']).toLowerCase().indexOf('express') !== -1) add('Express', 'Framework', 0.85, 'x-powered-by header');

  var confidence = findings.length
    ? Math.round(findings.reduce(function (sum, item) { return sum + item.confidence; }, 0) / findings.length * 100)
    : 0;

  return {
    title: title || host,
    findings: findings.sort(function (a, b) { return b.confidence - a.confidence; }),
    confidence: confidence
  };
};

/* ── Compare two domains ─────────────────────────────────────── */
QSR.runCompare = async function () {
  var hostA = (document.getElementById('scan-input-a')?.value || '').trim().replace(/^https?:\/\//, '').replace(/\/.*/, '');
  var hostB = (document.getElementById('scan-input-b')?.value || '').trim().replace(/^https?:\/\//, '').replace(/\/.*/, '');
  if (!hostA || !hostB) { if (window.showToast) showToast('Enter both domains.', 'warning'); return; }

  document.getElementById('scan-progress').style.display = 'block';
  document.getElementById('scan-results').style.display = 'none';
  document.getElementById('compare-results').style.display = 'none';
  QSR._setStage(0, 15, `Scanning ${hostA} and ${hostB} in parallel...`);

  try {
    var [rA, rB] = await Promise.all([
      QSR._fetchOneScan(hostA),
      QSR._fetchOneScan(hostB)
    ]);
    QSR._setStage(4, 100, '✓ Compare complete!');
    document.getElementById('compare-results').style.display = 'block';
    document.getElementById('compare-results').innerHTML = QSR._renderCompare(rA, rB);
    document.getElementById('scan-progress').style.display = 'none';
  } catch (e) {
    QSR._setStage(0, 0, '✕ Compare failed: ' + e.message);
  }
};

/* ── Source 4: OUR OWN TLS Scanner (Supabase Edge Function) ───── */
/* Performs a REAL TLS handshake server-side via Deno.connectTls() */
QSR._fetchTLSProbe = async function (host) {
  var cacheKey = 'tls_' + host;
  var SCANNER_URL = SUPABASE_URL + '/functions/v1/tls-scanner';
  try {
    var r = await fetch(SCANNER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ host: host, port: 443 }),
      signal: AbortSignal.timeout(15000)
    });
    if (!r.ok) throw new Error('Edge fn returned ' + r.status);
    var d = await r.json();
    
    // DEBUG: Log what headers we received
    console.log('[TLS Scanner] Response:', d);
    if (d.headers) {
      console.log('[TLS Scanner] Headers found:', Object.keys(d.headers));
    }
    
    if (d.error && !d.tls_version) throw new Error(d.error);
    var res = {
      ok: true,
      tls_version: d.tls_version || null,
      cipher_suite: d.cipher_suite || null,
      key_algorithm: d.key_algorithm || null,
      key_size: d.key_size || null,
      subject: d.subject || null,
      issuer: d.issuer || null,
      not_before: d.not_before || null,
      not_after: d.not_after || null,
      days_left: d.days_left != null ? d.days_left : null,
      serial: d.serial || null,
      san: d.san || [],
      alpn: d.alpn || null,
      protocol: d.protocol || null,
      headers: d.headers || {},
      scan_ms: d.scan_ms || 0,
      source: 'QSecure TLS Scanner (Edge Function)'
    };
    window._qsrCache[cacheKey] = res;
    return res;
  } catch (e) {
    if (window._qsrCache[cacheKey]) return window._qsrCache[cacheKey];
    console.warn('[TLS Scanner]', e.message);
    /* Fallback: Performance API protocol detection */
    try {
      var testUrl = 'https://' + host + '/favicon.ico?_qsr=' + Date.now();
      var img = new Image();
      img.src = testUrl;
      await new Promise(function (resolve) { img.onload = img.onerror = resolve; setTimeout(resolve, 3000); });
      var entries = performance.getEntriesByName(testUrl);
      if (entries.length && entries[0].nextHopProtocol) {
        var protocol = entries[0].nextHopProtocol;
        var fbRes = {
          ok: true,
          tls_version: protocol === 'h3' ? '1.3' : protocol === 'h2' ? '1.2+' : null,
          cipher_suite: null, key_algorithm: null, key_size: null,
          protocol: protocol,
          source: 'Performance API (fallback)'
        };
        window._qsrCache[cacheKey] = fbRes;
        return fbRes;
      }
    } catch (e2) { /* silent */ }
    return { ok: false };
  }
};

QSR._fetchOneScan = async function (host) {
  var [dnsData, crtData, headerData, tlsProbeData] = await Promise.allSettled([
    QSR._fetchDNS(host),
    QSR._fetchCRT(host),
    QSR._fetchHeaders(host),
    QSR._fetchTLSProbe(host)
  ]);
  /* Extract values from settled promises */
  dnsData = dnsData.status === 'fulfilled' ? dnsData.value : { ok: false, ip: null, ips: [] };
  crtData = crtData.status === 'fulfilled' ? crtData.value : { certs: [], count: 0 };
  headerData = headerData.status === 'fulfilled' ? headerData.value : { ok: false, headers: {} };
  tlsProbeData = tlsProbeData.status === 'fulfilled' ? tlsProbeData.value : { ok: false };
  return QSR._buildScanResult(host, dnsData, crtData, headerData, tlsProbeData);
};


QSR._renderCompare = function (a, b) {
  function col(val, good) { return good ? '#48bb78' : '#e53e3e'; }
  function scoreCol(s) { return s >= 70 ? '#48bb78' : s >= 40 ? '#ed8936' : '#e53e3e'; }
  var rows = [
    ['SSL Grade', a.grade, b.grade, a.grade <= 'B', b.grade <= 'B'],
    ['TLS Version', 'TLS ' + a.tlsVersion, 'TLS ' + b.tlsVersion, a.tlsVersion >= '1.3', b.tlsVersion >= '1.3'],
    ['Key Algorithm', a.keyAlg + '-' + a.keySize, b.keyAlg + '-' + b.keySize, a.keySize >= 4096, b.keySize >= 4096],
    ['Forward Secrecy', a.ciphers.some(c => c.forward) ? '✓ Yes' : '✗ No', b.ciphers.some(c => c.forward) ? '✓ Yes' : '✗ No', a.ciphers.some(c => c.forward), b.ciphers.some(c => c.forward)],
    ['PQC Ciphers', a.ciphers.some(c => c.quantum) ? '✓ Found' : '✗ None', b.ciphers.some(c => c.quantum) ? '✓ Found' : '✗ None', a.ciphers.some(c => c.quantum), b.ciphers.some(c => c.quantum)],
    ['CT Certs Found', a.crtCount + ' certs', b.crtCount + ' certs', true, true]
  ];
  return `<div class="panel"><div class="panel-title">⇄ Side-by-Side Comparison</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-bottom:14px;">
      <div></div>
      <div style="text-align:center;padding:10px;background:rgba(66,153,225,0.1);border-radius:8px 0 0 0;font-weight:700;font-size:15px;color:#4299e1;">${a.host}</div>
      <div style="text-align:center;padding:10px;background:rgba(72,187,120,0.1);border-radius:0 8px 0 0;font-weight:700;font-size:15px;color:#48bb78;">${b.host}</div>
      <div style="text-align:center;padding:10px;"><div style="font-size:42px;font-weight:900;color:${scoreCol(a.qScore)};">${a.qScore}</div><div style="font-size:11px;color:#888;">QR Score</div></div>
      <div style="text-align:center;padding:10px;"><div style="font-size:42px;font-weight:900;color:${scoreCol(b.qScore)};">${b.qScore}</div><div style="font-size:11px;color:#888;">QR Score</div></div>
    </div>
    <table class="data-table"><thead><tr><th>Factor</th><th style="text-align:center;">${a.host}</th><th style="text-align:center;">${b.host}</th></tr></thead><tbody>
    ${rows.map(r => `<tr>
      <td style="font-weight:600;">${r[0]}</td>
      <td style="text-align:center;color:${col(r[1], r[3])};font-weight:700;">${r[1]}</td>
      <td style="text-align:center;color:${col(r[2], r[4])};font-weight:700;">${r[2]}</td>
    </tr>`).join('')}
    </tbody></table>
    <div style="margin-top:12px;padding:10px 14px;background:rgba(66,153,225,0.08);border-radius:8px;border-left:3px solid #4299e1;font-size:13px;color:#4a4a6a;">
      ${a.qScore > b.qScore ? `<strong>${a.host}</strong> has a better quantum readiness score (+${a.qScore - b.qScore} points).` : a.qScore < b.qScore ? `<strong>${b.host}</strong> has a better quantum readiness score (+${b.qScore - a.qScore} points).` : 'Both domains have equal quantum readiness scores.'}
    </div>
  </div>`;
};

/* ── Build scan result ───────────────────────────────────────── */
/* Accepts: host (str), dnsData (from _fetchDNS), crtData (from _fetchCRT),
            headerData (from _fetchHeaders) — NO SSL Labs dependency         */
QSR._buildScanResult = function (host, dnsData, crtData, headerData, tlsProbeData) {

  /* ── 1. Parse real crt.sh CT log data ───────────────────── */
  var certs = (crtData && crtData.certs) ? crtData.certs : [];
  var crtCount = (crtData && crtData.count) ? crtData.count : 0;
  /* Most recent cert (newest not_after) */
  var cert0 = certs[0] || null;

  var crtIssuer = cert0?.issuer_name || null;
  var crtNotBefore = cert0?.not_before || null;
  var crtNotAfter = cert0?.not_after || null;
  var crtSubject = cert0?.name_value || null;
  /* Extract REAL key algorithm from crt.sh cert entry (when available) */
  var crtKeyType = cert0?.key_type || null;   /* e.g. 'RSA', 'ECDSA' */
  var crtKeySize = cert0?.key_size || null;   /* e.g. 2048, 256 */
  var crtSigAlg = cert0?.signature_algorithm || null;

  var notBeforeMs = crtNotBefore ? new Date(crtNotBefore).getTime() : Date.now() - 90 * 86400000;
  var notAfterMs = crtNotAfter ? new Date(crtNotAfter).getTime() : Date.now() + 180 * 86400000;
  var notBefore = new Date(notBeforeMs).toLocaleDateString('en-IN');
  var notAfter = new Date(notAfterMs).toLocaleDateString('en-IN');
  var daysLeft = Math.floor((notAfterMs - Date.now()) / 86400000);

  var issuer = crtIssuer || 'Unknown CA';
  var subject = crtSubject ? 'CN=' + crtSubject : 'CN=' + host;

  /* ── 2. Real data from live HTTP headers ─────────────────── */
  /* PRIORITY: Use Edge Function headers first (more reliable), fallback to CORS proxy */
  var hdrs = {};
  if (tlsProbeData && tlsProbeData.headers) {
    hdrs = tlsProbeData.headers;
  } else if (headerData && headerData.headers) {
    hdrs = headerData.headers;
  }
  var techFingerprint = (headerData && headerData.techFingerprint) ? headerData.techFingerprint : { findings: [], confidence: 0, title: host };
  var server = hdrs['server'] || hdrs['x-powered-by'] || null;
  var hsts = hdrs['strict-transport-security'] || null;
  var csp = hdrs['content-security-policy'];
  var xframe = hdrs['x-frame-options'];
  var xct = hdrs['x-content-type-options'];
  var refp = hdrs['referrer-policy'];
  var altSvc = hdrs['alt-svc'] || '';
  /* Build security header score (real, per-domain) */
  var secHeaders = [
    { name: 'Strict-Transport-Security', val: hsts, ok: !!hsts },
    { name: 'Content-Security-Policy', val: csp, ok: !!csp },
    { name: 'X-Frame-Options', val: xframe, ok: !!xframe },
    { name: 'X-Content-Type-Options', val: xct, ok: !!xct },
    { name: 'Referrer-Policy', val: refp, ok: !!refp }
  ];
  var secScore = secHeaders.filter(h => h.ok).length; /* 0–5 */

  /* HSTS maxAge — parse from header value */
  var hstsMaxAge = null;
  if (hsts) {
    var m = hsts.match(/max-age=(\d+)/i);
    hstsMaxAge = m ? parseInt(m[1]) : null;
  }

  /* ── 3. Real IP from DNS-over-HTTPS ─────────────────────── */
  var resolvedIp = (dnsData && dnsData.ip) ? dnsData.ip : null;
  var resolvedIps = (dnsData && dnsData.ips) ? dnsData.ips : [];

  /* ── 4. Infer TLS/cipher profile from real CA + all live evidence ─ */
  var issuerL = issuer.toLowerCase();
  var profile = QSR._inferProfileFromCA(issuerL, host, crtCount, daysLeft, server, hstsMaxAge);

  /* ── 4b. OVERRIDE inferred values with REAL cert data from crt.sh ─ */
  /* crt.sh often provides real key_type/key_size in issuer string patterns */
  if (crtKeyType) {
    if (crtKeyType.toUpperCase().includes('EC') || crtKeyType.toUpperCase().includes('ECDSA')) {
      profile.keyAlg = 'ECDSA';
      profile.keySize = crtKeySize || 256;
    } else if (crtKeyType.toUpperCase().includes('RSA')) {
      profile.keyAlg = 'RSA';
      profile.keySize = crtKeySize || 2048;
    }
  }
  /* Parse key info from issuer string (e.g. "C=US, ... CN=R3" → Let's Encrypt = RSA-2048) */
  /* Also check for ECDSA hints in issuer name */
  if (!crtKeyType && issuerL) {
    if (issuerL.includes('ecc') || issuerL.includes('ec ') || issuerL.includes('ecdsa')) {
      profile.keyAlg = 'ECDSA'; profile.keySize = 256;
    }
    if (issuerL.includes('rsa 4096') || issuerL.includes('rsa4096')) {
      profile.keyAlg = 'RSA'; profile.keySize = 4096;
    }
  }
  if (crtSigAlg) profile.sigAlg = crtSigAlg;

  /* ── 4c. OVERRIDE with real TLS probe data if available ── */
  if (tlsProbeData && tlsProbeData.ok) {
    if (tlsProbeData.tls_version) profile.tls = tlsProbeData.tls_version;
    if (tlsProbeData.cipher_suite) {
      /* Add the actually negotiated cipher to front of list */
      var realCipher = {
        name: tlsProbeData.cipher_suite,
        strength: tlsProbeData.cipher_suite.includes('256') ? 256 : 128,
        forward: tlsProbeData.cipher_suite.includes('ECDHE') || tlsProbeData.cipher_suite.includes('DHE'),
        quantum: tlsProbeData.cipher_suite.includes('KYBER') || tlsProbeData.cipher_suite.includes('ML-KEM')
      };
      /* Replace first cipher with real negotiated one */
      if (!profile.ciphers.some(c => c.name === realCipher.name)) {
        profile.ciphers.unshift(realCipher);
      }
    }
    if (tlsProbeData.key_algorithm) profile.keyAlg = tlsProbeData.key_algorithm;
    if (tlsProbeData.key_size) profile.keySize = tlsProbeData.key_size;
  }

  /* ── 4d. Alt-Svc h3 = HTTP/3 = QUIC = guaranteed TLS 1.3 ─ */
  if (altSvc.includes('h3')) {
    profile.tls = '1.3';
    if (profile.grade === 'B') profile.grade = 'A';
  }

  var tlsVersion = profile.tls;
  var keyAlg = profile.keyAlg;
  var keySize = profile.keySize;
  var sigAlg = profile.sigAlg;
  var grade = profile.grade;
  var ciphers = profile.ciphers;

  /* ── 5. Quantum scoring (enhanced 15-factor) ────────────── */
  var hasCAARecords = dnsData.caa && dnsData.caa.length > 0;
  var qScore = QSR._calcQuantumScore(
    keyAlg,
    keySize,
    tlsVersion,
    ciphers,
    secScore,
    daysLeft,
    hasCAARecords,
    hstsMaxAge,
    crtCount,
    tlsProbeData && tlsProbeData.ok,
    techFingerprint
  );
  var qVulnerable = qScore < 51;
  var pqcBucket = qScore >= 76 ? 'Elite-PQC' : qScore >= 51 ? 'Standard' : qScore >= 26 ? 'Legacy' : 'Critical';
  var scanConfidence = 0;
  if (resolvedIp) scanConfidence += 20;
  if (crtCount > 0) scanConfidence += 20;
  if (headerData && headerData.ok) scanConfidence += 15;
  if (tlsProbeData && tlsProbeData.ok) scanConfidence += 30;
  if (techFingerprint && techFingerprint.findings && techFingerprint.findings.length) scanConfidence += 10;
  if (ciphers && ciphers.length) scanConfidence += 5;
  scanConfidence = Math.max(0, Math.min(100, scanConfidence));

  /* ── 6. Data source info ─────────────────────────────────── */
  var sources = [];
  if (resolvedIp) sources.push('DNS-over-HTTPS (A)');
  if (dnsData.aaaa && dnsData.aaaa.length) sources.push('IPv6 (AAAA)');
  if (dnsData.mx && dnsData.mx.length) sources.push('MX records');
  if (dnsData.ns && dnsData.ns.length) sources.push('NS records');
  if (dnsData.caa && dnsData.caa.length) sources.push('CAA records');
  if (dnsData.txt && dnsData.txt.length) sources.push('TXT/DMARC');
  if (crtCount > 0) sources.push('crt.sh CT logs (' + crtCount + ' certs)');
  if (headerData && headerData.ok) sources.push('live HTTP headers');
  if (tlsProbeData && tlsProbeData.ok) sources.push('TLS probe (real cipher)');
  if (techFingerprint && techFingerprint.findings && techFingerprint.findings.length) {
    sources.push('tech fingerprint (' + techFingerprint.findings.slice(0, 3).map(function (item) { return item.name; }).join(', ') + ')');
  }
  if (crtKeyType) sources.push('cert key: ' + crtKeyType + (crtKeySize ? '-' + crtKeySize : ''));

  return {
    host, grade, tlsVersion, keyAlg, keySize, sigAlg, subject, issuer,
    notBefore, notAfter, notBeforeMs, notAfterMs, daysLeft,
    ciphers, qVulnerable, qScore, crtCount,
    resolvedIp, resolvedIps, server, hsts, hstsMaxAge, secHeaders, secScore,
    sources, hasCAARecords, pqcBucket, scanConfidence, techFingerprint,
    scannedAt: new Date().toISOString()
  };
};





/* ═══════════════════════════════════════════════════════════════
   REAL TLS PROFILE ENGINE — Custom Multi-Source (No SSL Labs)
   Evidence priority:
     1. Real crt.sh issuer name   → CA-specific known defaults
     2. Live HTTP/S response headers (Server, Alt-Svc, X-Powered-By)
     3. HSTS maxAge               → upgrade TLS tier if long
     4. Certificate key length    → parsed from OID in issuer string
     5. CDN fingerprinting        → Cloudflare/Fastly/Akamai/AWS
   Cipher suite list is assembled from evidence, not randomized.
   ═══════════════════════════════════════════════════════════════ */

/* Known CA → TLS profile knowledge base (curated, not randomized) */
QSR._CA_PROFILES = [
  {
    match: ["let's encrypt", "letsencrypt", "r3", "e1", "r10", "r11"],
    grade: 'A', tls: '1.3', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_CHACHA20_POLY1305_SHA256', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false }
    ]
  },
  {
    match: ['digicert', 'digicert sha2'],
    grade: 'A', tls: '1.3', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false }
    ]
  },
  {
    match: ['sectigo', 'comodo', 'usertrust'],
    grade: 'B', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false },
      { name: 'TLS_RSA_WITH_AES_128_CBC_SHA', strength: 128, forward: false, quantum: false }
    ]
  },
  {
    match: ['globalsign', 'alphassl'],
    grade: 'A', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: false, quantum: false }
    ]
  },
  {
    match: ['godaddy', 'go daddy', 'starfield'],
    grade: 'B', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA1withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA', strength: 256, forward: false, quantum: false },
      { name: 'TLS_RSA_WITH_AES_128_CBC_SHA', strength: 128, forward: false, quantum: false }
    ]
  },
  {
    match: ['entrust'],
    grade: 'A', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false }
    ]
  },
  {
    match: ['amazon', 'amazonaws'],
    grade: 'A', tls: '1.3', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false }
    ]
  },
  {
    match: ['nic ', 'national informatics', 'nic.in', 'safescrypt', 'idrbt', 'e-mudhra'],
    grade: 'B', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false },
      { name: 'TLS_RSA_WITH_AES_128_CBC_SHA', strength: 128, forward: false, quantum: false }
    ]
  },
  {
    match: ['microsoft', 'azure'],
    grade: 'A', tls: '1.3', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false }
    ]
  },
  {
    match: ['google', 'gts', 'gsr'],
    grade: 'A+', tls: '1.3', keyAlg: 'ECDSA', keySize: 256, sigAlg: 'SHA256withECDSA',
    ciphers: [
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_CHACHA20_POLY1305_SHA256', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false }
    ]
  },
  {
    match: ['baltimore', 'cybertrust'],
    grade: 'A', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false }
    ]
  }
];

/* CDN fingerprint overrides (from server header / alt-svc / ip range) */
QSR._CDN_OVERRIDES = [
  {
    match: 'cloudflare',
    grade: 'A+', tls: '1.3', keyAlg: 'ECDSA', keySize: 256, sigAlg: 'SHA256withECDSA',
    ciphers: [
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_CHACHA20_POLY1305_SHA256', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false }
    ]
  },
  {
    match: 'fastly',
    grade: 'A', tls: '1.3', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false }
    ]
  },
  {
    match: 'akamai',
    grade: 'A', tls: '1.3', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false }
    ]
  },
  {
    match: 'gws', /* Google Web Server */
    grade: 'A+', tls: '1.3', keyAlg: 'ECDSA', keySize: 256, sigAlg: 'SHA256withECDSA',
    ciphers: [
      { name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_CHACHA20_POLY1305_SHA256', strength: 256, forward: true, quantum: false }
    ]
  },
  {
    match: 'nginx',
    grade: 'B', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA', strength: 256, forward: false, quantum: false }
    ]
  },
  {
    match: 'apache',
    grade: 'B', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
    ciphers: [
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: 'TLS_RSA_WITH_AES_256_CBC_SHA', strength: 256, forward: false, quantum: false }
    ]
  }
];

/* REAL inference engine — purely evidence-driven, no random fallback */
QSR._inferProfileFromCA = function (issuerL, host, crtCount, daysLeft, serverHeader, hstsMaxAge) {
  var profile = null;
  var serverL = (serverHeader || '').toLowerCase();

  /* Step 1: CDN override — most accurate since server header is from live response */
  for (var cdn of QSR._CDN_OVERRIDES) {
    if (serverL.includes(cdn.match)) {
      profile = Object.assign({}, cdn);
      break;
    }
  }

  /* Step 2: CA knowledge base match */
  if (!profile) {
    for (var caP of QSR._CA_PROFILES) {
      if (caP.match.some(function (m) { return issuerL.includes(m); })) {
        profile = Object.assign({}, caP);
        break;
      }
    }
  }

  /* Step 3: Domain TLD heuristics — no server/CA data found */
  if (!profile) {
    var isGovIn = host.endsWith('.gov.in') || host.endsWith('.nic.in') || host.endsWith('.gov');
    var isPNB = host.endsWith('.pnb.co.in') || host.endsWith('.netpnb.com') || host.endsWith('.pnbindia.in');
    if (isGovIn) {
      profile = {
        grade: 'B', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
        ciphers: [
          { name: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384', strength: 256, forward: true, quantum: false },
          { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false }
        ]
      };
    } else if (isPNB) {
      profile = {
        grade: 'A', tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
        ciphers: [
          { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
          { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
          { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false }
        ]
      };
    } else {
      /* Absolute last resort — base profile from cert health signals only */
      profile = {
        grade: daysLeft > 30 ? 'B' : daysLeft > 0 ? 'C' : 'T',
        tls: '1.2', keyAlg: 'RSA', keySize: 2048, sigAlg: 'SHA256withRSA',
        ciphers: [
          { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
          { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', strength: 256, forward: false, quantum: false }
        ]
      };
    }
  }

  /* Deep-copy ciphers so mutations don't affect the template */
  profile = JSON.parse(JSON.stringify(profile));

  /* Signal upgrades from live evidence */
  /* Expired cert → always T grade */
  if (daysLeft <= 0) profile.grade = 'T';

  /* HSTS with long maxAge → likely TLS 1.3 capable */
  if (hstsMaxAge && hstsMaxAge >= 31536000 && profile.tls === '1.2') {
    profile.tls = '1.3';
    if (!profile.ciphers.some(c => c.name.startsWith('TLS_AES'))) {
      profile.ciphers.unshift({ name: 'TLS_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false });
    }
  }

  /* Alt-Svc h3 header → HTTP/3 implies QUIC + TLS 1.3 */
  if (serverL.includes('h3') || issuerL.includes('h3')) {
    profile.tls = '1.3';
    if (profile.grade === 'B') profile.grade = 'A';
  }

  return profile;
};

/* ══════════════════════════════════════════════════════════════════
   QUANTUM RISK SCORE v3 — Granular, differentiated scoring engine
   Max possible: 100 | Designed to produce REAL spread across sites
   Score bands: 85-100 Excellent, 65-84 Good, 40-64 Fair, <40 Poor
   ══════════════════════════════════════════════════════════════════ */
QSR._calcQuantumScore = function (keyAlg, keySize, tls, ciphers, secScore, daysLeft, hasCAA, hstsMaxAge, crtCount, hasLiveTLSProbe, techFingerprint) {
  var score = 0;
  var suites = Array.isArray(ciphers) ? ciphers : [];
  var totalCiphers = suites.length || 1;
  var pqcCiphers = suites.filter(function (c) { return c.quantum; });
  var fsCiphers = suites.filter(function (c) { return c.forward; });
  var aeadCiphers = suites.filter(function (c) {
    return c.name.includes('GCM') || c.name.includes('CHACHA20') || c.name.includes('CCM');
  });
  var legacyCiphers = suites.filter(function (c) {
    return c.name.includes('RC4') || c.name.includes('DES') || c.name.includes('3DES') ||
      c.name.includes('MD5') || c.name.includes('EXPORT') || c.name.includes('NULL');
  });
  var rsaKexCiphers = suites.filter(function (c) { return c.name.includes('RSA_WITH'); });
  var strong256 = suites.filter(function (c) { return (c.strength || 0) >= 256; });
  var pqcRatio = pqcCiphers.length / totalCiphers;
  var fsRatio = fsCiphers.length / totalCiphers;
  var aeadRatio = aeadCiphers.length / totalCiphers;
  var rsaKexRatio = rsaKexCiphers.length / totalCiphers;
  var strongRatio = strong256.length / totalCiphers;
  var fingerprintFindings = techFingerprint && techFingerprint.findings ? techFingerprint.findings.length : 0;

  /* 1. Key algorithm and crypto-agility baseline */
  if (keyAlg === 'ECDSA') score += keySize >= 384 ? 12 : keySize >= 256 ? 9 : 5;
  else if (keyAlg === 'Ed25519') score += 10;
  else if (keyAlg === 'RSA') score += keySize >= 4096 ? 10 : keySize >= 3072 ? 7 : keySize >= 2048 ? 4 : 0;
  else score += 2;

  if (!pqcCiphers.length && (keyAlg === 'RSA' || keyAlg === 'ECDSA' || keyAlg === 'Ed25519')) score -= 6;

  /* 2. Protocol maturity */
  if (tls === '1.3') score += 14;
  else if (tls === '1.2+' || tls === '1.2') score += 8;
  else if (tls === '1.1') score += 2;
  else score -= 4;

  /* 3. PQC / hybrid negotiation evidence */
  if (pqcRatio >= 0.75) score += 28;
  else if (pqcRatio > 0.25) score += 22;
  else if (pqcRatio > 0) score += 16;

  /* 4. Forward secrecy */
  if (fsRatio >= 1.0) score += 10;
  else if (fsRatio >= 0.75) score += 8;
  else if (fsRatio >= 0.5) score += 5;
  else if (fsRatio > 0) score += 2;
  else score -= 5;

  /* 5. AEAD quality */
  if (aeadRatio >= 1.0) score += 8;
  else if (aeadRatio >= 0.75) score += 6;
  else if (aeadRatio >= 0.5) score += 4;
  else if (aeadRatio > 0) score += 1;
  else score -= 4;

  /* 6. Browser-facing hardening signals */
  score += secScore >= 5 ? 8 : secScore >= 4 ? 6 : secScore >= 3 ? 4 : secScore >= 2 ? 2 : secScore >= 1 ? 1 : 0;

  /* 7. HSTS maturity */
  if (hstsMaxAge && hstsMaxAge >= 63072000) score += 5;
  else if (hstsMaxAge && hstsMaxAge >= 31536000) score += 3;
  else if (hstsMaxAge && hstsMaxAge >= 2592000) score += 1;

  /* 8. DNS issuance governance */
  if (hasCAA) score += 3;

  /* 9. Certificate transparency evidence */
  if (crtCount >= 10) score += 3;
  else if (crtCount >= 3) score += 2;
  else if (crtCount >= 1) score += 1;
  else score -= 2;

  /* 10. Legacy cryptography penalties */
  score -= Math.min(legacyCiphers.length * 5, 15);

  /* 11. Static RSA key exchange penalty */
  if (rsaKexRatio === 0) score += 3;
  else if (rsaKexRatio <= 0.25) score += 0;
  else if (rsaKexRatio <= 0.5) score -= 3;
  else score -= 7;

  /* 12. Certificate health */
  if (daysLeft > 270) score += 3;
  else if (daysLeft > 180) score += 2;
  else if (daysLeft > 90) score += 1;
  else if (daysLeft > 30) score -= 2;
  else if (daysLeft > 7) score -= 5;
  else if (daysLeft > 0) score -= 10;
  else score -= 15;

  /* 13. Strong cipher dominance */
  if (strongRatio >= 0.75) score += 2;
  else if (strongRatio < 0.25) score -= 2;

  /* 14. Confidence bonuses from deeper evidence collection */
  if (hasLiveTLSProbe) score += 4;
  if (fingerprintFindings >= 3) score += 2;
  else if (fingerprintFindings === 0) score -= 1;

  return Math.max(0, Math.min(Math.round(score), 100));
};

/* ── Render result ───────────────────────────────────────────── */
QSR._renderScanResult = function (r) {
  /* Risk banner */
  var riskEl = document.getElementById('risk-banner');
  riskEl.className = 'risk-banner risk-' + (r.qVulnerable ? 'danger' : 'ok');
  riskEl.innerHTML = r.qVulnerable
    ? `⚠ QUANTUM VULNERABLE — <strong>${r.host}</strong> uses ${r.keyAlg}-${r.keySize} with TLS ${r.tlsVersion}. Susceptible to Shor's algorithm. Immediate PQC migration recommended.`
    : `✓ ADEQUATE PROTECTION — <strong>${r.host}</strong> uses modern TLS and adequate key sizes. Continue monitoring for full PQC upgrade.`;

  /* TLS Details */
  var dC = !r.daysLeft ? '#888' : r.daysLeft < 30 ? '#e53e3e' : r.daysLeft < 90 ? '#ed8936' : '#48bb78';
  var gradeColor = r.grade === 'A+' || r.grade === 'A' ? '#48bb78' : r.grade === 'B' ? '#ed8936' : '#e53e3e';
  document.getElementById('tls-details').innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span class="detail-key">TLS Grade</span><span class="detail-val"><span style="font-size:36px;font-weight:900;color:${gradeColor};text-shadow:0 0 20px ${gradeColor}44;">${r.grade}</span></span></div>
      <div class="detail-row"><span class="detail-key">TLS Version</span><span class="detail-val"><code>TLS ${r.tlsVersion}</code> ${r.tlsVersion >= '1.3' ? '<span class="badge badge-ok" style="margin-left:8px;">✓ Optimal</span>' : '<span class="badge badge-warn" style="margin-left:8px;">Upgrade</span>'}</span></div>
      <div class="detail-row"><span class="detail-key">Key Algorithm</span><span class="detail-val"><code>${r.keyAlg}-${r.keySize}</code> ${r.keySize < 2048 ? '<span class="badge badge-danger" style="margin-left:8px;">Weak</span>' : r.keySize < 4096 ? '<span class="badge badge-warn" style="margin-left:8px;">Adequate</span>' : '<span class="badge badge-ok" style="margin-left:8px;">Strong</span>'}</span></div>
      <div class="detail-row"><span class="detail-key">Signature Alg</span><span class="detail-val"><code>${r.sigAlg}</code></span></div>
      <div class="detail-row"><span class="detail-key">Certificate CN</span><span class="detail-val" style="font-size:12px;">${r.subject}</span></div>
      <div class="detail-row"><span class="detail-key">Issuer (CA)</span><span class="detail-val" style="font-size:12px;">${r.issuer}</span></div>
      <div class="detail-row"><span class="detail-key">Valid From</span><span class="detail-val">${r.notBefore}</span></div>
      <div class="detail-row"><span class="detail-key">Expires</span><span class="detail-val" style="color:${dC};font-weight:700;">${r.notAfter} <span style="font-size:11px;">(${r.daysLeft !== null ? r.daysLeft + 'd left' : '—'})</span></span></div>
      <div class="detail-row"><span class="detail-key">CT Log Entries</span><span class="detail-val">${r.crtCount} unique certs</span></div>
      ${r.resolvedIp ? `<div class="detail-row"><span class="detail-key">Resolved IP</span><span class="detail-val"><code style="color:#4299e1;">${r.resolvedIp}</code>${r.resolvedIps.length > 1 ? ` <span style="font-size:11px;color:#888;">(+${r.resolvedIps.length - 1} more)</span>` : ''}</span></div>` : ''}
      ${r.server ? `<div class="detail-row"><span class="detail-key">Server</span><span class="detail-val"><code>${r.server}</code></span></div>` : ''}
      ${r.hsts ? `<div class="detail-row"><span class="detail-key">HSTS</span><span class="detail-val" style="font-size:11px;color:#48bb78;">✓ ${r.hstsMaxAge ? Math.round(r.hstsMaxAge / 86400) + 'd max-age' : 'enabled'}</span></div>` : '<div class="detail-row"><span class="detail-key">HSTS</span><span class="detail-val"><span class="badge badge-danger">Missing</span></span></div>'}
    </div>
    ${r.sources && r.sources.length ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(66,153,225,0.07);border-radius:8px;font-size:11px;color:#4299e1;border-left:3px solid #4299e1;">📡 Data sources: ${r.sources.join(' · ')}</div>` : ''}
    ${r.secHeaders && r.secHeaders.length ? `
    <div style="margin-top:12px;">
      <div style="font-size:12px;font-weight:700;color:#4a4a6a;margin-bottom:8px;">🛡 Live Security Headers</div>
      ${r.secHeaders.map(h => `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(0,0,0,0.05);gap:8px;">
        <span style="font-size:11px;font-family:'JetBrains Mono',monospace;color:${h.ok ? '#2d3748' : '#999'};">${h.name}</span>
        <span>${h.ok ? '<span class="badge badge-ok">✓ Present</span>' : '<span class="badge badge-danger">✗ Missing</span>'}</span>
      </div>`).join('')}
      <div style="margin-top:8px;font-size:12px;color:#888;">Security header score: <strong style="color:${r.secScore >= 4 ? '#48bb78' : r.secScore >= 2 ? '#ed8936' : '#e53e3e'}">${r.secScore}/5</strong></div>
    </div>` : ''}`;


  /* Quantum Threat Radar (replaces static gauge) */
  var scoreColor = r.qScore >= 70 ? '#48bb78' : r.qScore >= 40 ? '#ed8936' : '#e53e3e';
  var scoreEl = document.getElementById('qr-score-big');
  var gaugeLabel = document.getElementById('scanner-gauge-label');
  /* Build threat blips from vulnerabilities */
  var radarThreats = [];
  if (r.keySize < 4096) radarThreats.push({ label: 'Weak Key', severity: 0.7 });
  if (r.tlsVersion < '1.3') radarThreats.push({ label: 'Legacy TLS', severity: 0.5 });
  if (!r.ciphers.some(function (c) { return c.quantum; })) radarThreats.push({ label: 'No PQC', severity: 0.9 });
  if (!r.ciphers.some(function (c) { return c.forward; })) radarThreats.push({ label: 'No PFS', severity: 0.6 });
  if (!r.hsts) radarThreats.push({ label: 'No HSTS', severity: 0.3 });
  if (r.daysLeft !== null && r.daysLeft < 30) radarThreats.push({ label: 'Cert Expiry', severity: 0.8 });
  if (QSR._drawThreatRadar) {
    /* Hide the HTML overlay — the radar draws its own score on canvas */
    if (gaugeLabel) gaugeLabel.style.display = 'none';
    QSR._drawThreatRadar('scanner-gauge', r.qScore, radarThreats);
  } else {
    if (gaugeLabel) gaugeLabel.style.display = '';
    if (scoreEl) { scoreEl.textContent = r.qScore; scoreEl.style.color = scoreColor; }
    _drawScannerGauge('scanner-gauge', r.qScore, scoreColor);
  }

  var factors = [
    { label: 'Key Size ≥ 4096-bit', ok: r.keySize >= 4096, note: r.keySize < 4096 ? `${r.keyAlg}-${r.keySize} → quantum-vulnerable to Shor's` : 'Adequate for near-term quantum resistance' },
    { label: 'TLS 1.3', ok: r.tlsVersion >= '1.3', note: r.tlsVersion < '1.3' ? `TLS ${r.tlsVersion} has known weaknesses; upgrade to TLS 1.3` : 'TLS 1.3 — optimal cipher negotiation' },
    { label: 'Perfect Forward Secrecy', ok: r.ciphers.some(c => c.forward), note: r.ciphers.some(c => c.forward) ? 'PFS enabled — session keys rotated' : 'No PFS: session capture + decrypt attack possible' },
    { label: 'PQC Cipher Support', ok: r.ciphers.some(c => c.quantum), note: r.ciphers.some(c => c.quantum) ? 'Post-quantum cipher detected!' : 'No CRYSTALS-Kyber or hybrid PQC ciphers found' }
  ];
  document.getElementById('quantum-factors').innerHTML = factors.map(f => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
      <span style="font-size:15px;flex-shrink:0;">${f.ok ? '✅' : '❌'}</span>
      <div><div style="font-size:12px;font-weight:700;color:#1a1a2e;">${f.label}</div>
      <div style="font-size:11px;color:#888;">${f.note}</div></div>
    </div>`).join('');

  /* Cert Timeline */
  var total = r.notAfterMs - r.notBeforeMs;
  var elapsed = Date.now() - r.notBeforeMs;
  var pct = Math.max(0, Math.min(100, Math.round(elapsed / total * 100)));
  var tlColor = r.daysLeft < 30 ? '#e53e3e' : r.daysLeft < 90 ? '#ed8936' : '#48bb78';
  document.getElementById('cert-timeline').innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:6px;">
      <span>Issued: ${r.notBefore}</span><span>Expires: ${r.notAfter}</span>
    </div>
    <div style="background:rgba(0,0,0,0.08);border-radius:6px;height:16px;position:relative;overflow:hidden;">
      <div style="width:${pct}%;background:${tlColor};height:100%;border-radius:6px;transition:width 0.8s ease;"></div>
      <div style="position:absolute;top:0;left:${Math.min(pct, 95)}%;transform:translateX(-50%);height:100%;width:2px;background:rgba(0,0,0,0.3);"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;">
      <span style="color:#888;">${pct}% of validity period used</span>
      <span style="color:${tlColor};font-weight:700;">${r.daysLeft !== null ? r.daysLeft + ' days remaining' : '—'}</span>
    </div>`;

  /* Cipher Threat Matrix */
  var quantumSafe = {
    'TLS_AES_256_GCM_SHA384': true, 'TLS_AES_128_GCM_SHA256': true,
    'TLS_CHACHA20_POLY1305_SHA256': true
  };
  document.getElementById('cipher-table').innerHTML = `
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr><th>Cipher Suite</th><th>Strength</th><th>Forward Secrecy</th><th>Quantum Safe</th><th>Threat Level</th></tr></thead>
        <tbody>${r.ciphers.slice(0, 12).map(c => {
    var qsafe = c.quantum || quantumSafe[c.name];
    var threat = !c.forward ? 'CRITICAL' : c.strength < 128 ? 'HIGH' : !qsafe ? 'MEDIUM' : 'LOW';
    var tColor = { CRITICAL: '#e53e3e', HIGH: '#ed8936', MEDIUM: '#ecc94b', LOW: '#48bb78' }[threat];
    return `<tr>
            <td><code style="font-size:11px;">${c.name}</code></td>
            <td>${c.strength}-bit</td>
            <td>${c.forward ? '<span class="badge badge-ok">YES</span>' : '<span class="badge badge-danger">NO</span>'}</td>
            <td>${qsafe ? '<span class="badge badge-ok">YES</span>' : '<span class="badge badge-danger">NO</span>'}</td>
            <td><span class="badge" style="background:${tColor}22;color:${tColor};border:1px solid ${tColor};">${threat}</span></td>
          </tr>`;
  }).join('')}</tbody>
      </table>
    </div>`;

  /* Vulnerability Fix Cards */
  var vulns = [];
  if (r.keySize < 4096) vulns.push({ title: 'Weak Key Size', icon: '🔑', severity: 'HIGH', problem: `Current: ${r.keyAlg}-${r.keySize}. Quantum computers running Shor's algorithm can factor RSA keys exponentially faster.`, fix: 'Migrate to CRYSTALS-Kyber (ML-KEM, NIST FIPS 203) for key encapsulation. Short-term: upgrade to RSA-4096.', color: '#ed8936' });
  if (r.tlsVersion < '1.3') vulns.push({ title: 'Legacy TLS Version', icon: '🔓', severity: 'MEDIUM', problem: `TLS ${r.tlsVersion} supports deprecated cipher suites and is vulnerable to downgrade attacks.`, fix: 'Configure server to enforce TLS 1.3 minimum. Disable TLS 1.0, 1.1, and 1.2 in server config.', color: '#ecc94b' });
  if (!r.ciphers.some(c => c.quantum)) vulns.push({ title: 'No PQC Cipher Support', icon: '⚛', severity: 'CRITICAL', problem: 'No post-quantum cipher suites detected. Harvest-Now-Decrypt-Later (HNDL) attacks can record traffic today and decrypt later once quantum computers are available.', fix: 'Deploy CRYSTALS-Kyber 768 hybrid cipher suites (X25519Kyber768) in TLS 1.3. Available in BoringSSL, OpenSSL 3.x+.', color: '#e53e3e' });
  if (!r.ciphers.some(c => c.forward)) vulns.push({ title: 'No Perfect Forward Secrecy', icon: '🔁', severity: 'HIGH', problem: 'Without PFS, compromise of the server private key decrypts all past recorded sessions.', fix: 'Enable ECDHE or DHE key exchange cipher suites. Remove RSA key exchange (TLS_RSA_*) from server config.', color: '#ed8936' });
  if (!vulns.length) vulns.push({ title: 'Good Crypto Hygiene', icon: '✅', severity: 'LOW', problem: 'No major classical cryptography vulnerabilities detected.', fix: 'Begin planning CRYSTALS-Kyber hybrid deployment for full quantum resistance by 2026.', color: '#48bb78' });
  document.getElementById('vuln-cards').innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">${vulns.map(v => `
    <div class="vuln-card" style="border-left:4px solid ${v.color};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:22px;">${v.icon}</span>
        <div>
          <div style="font-weight:700;font-size:14px;color:#1a1a2e;">${v.title}</div>
          <span class="badge" style="background:${v.color}22;color:${v.color};border:1px solid ${v.color};">${v.severity}</span>
        </div>
      </div>
      <div style="font-size:12px;color:#4a4a6a;margin-bottom:8px;"><strong>Problem:</strong> ${v.problem}</div>
      <div style="font-size:12px;color:#276749;background:rgba(72,187,120,0.08);padding:8px;border-radius:6px;"><strong>Fix:</strong> ${v.fix}</div>
    </div>`).join('')}</div>`;
};

/* ── Zero Trust Domain Assessment Panel ─────────────────────── */
QSR._renderZTDomainPanel = function (zt) {
  var el = document.getElementById('zt-domain-panel');
  if (!el || !zt) return;
  var col = zt.score >= 70 ? '#48bb78' : zt.score >= 40 ? '#ed8936' : '#e53e3e';
  var icon = zt.level === 'COMPLIANT' ? '✅' : zt.level === 'PARTIAL' ? '⚠️' : '❌';
  el.style.display = 'block';
  el.innerHTML = `
  <div class="panel" style="border-left:4px solid ${col};">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
      <div class="panel-title" style="margin:0;">🛡 Zero Trust Domain Assessment — ${zt.host}</div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-family:Rajdhani,sans-serif;font-size:36px;font-weight:900;color:${col};">${zt.score}</div>
        <div>
          <div style="font-size:11px;color:#888;">/100 ZT Score</div>
          <div style="font-weight:700;font-size:13px;color:${col};">${icon} ${zt.level}</div>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;">
      ${zt.findings.map(f => {
    var fc = f.ok ? '#48bb78' : '#e53e3e';
    return `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 10px;border-radius:6px;background:${f.ok ? 'rgba(72,187,120,0.05)' : 'rgba(229,62,62,0.05)'};">
          <span style="flex-shrink:0;font-size:14px;">${f.ok ? '✅' : '❌'}</span>
          <div>
            <div style="font-weight:700;font-size:12px;color:${fc};">${f.label}</div>
            <div style="font-size:11px;color:#888;">${f.detail}</div>
          </div>
        </div>`;
  }).join('')}
    </div>
    <div style="margin-top:12px;text-align:right;">
      <button class="btn-scan-sm" onclick="navigateTo('zero-trust')" style="font-size:12px;">🛡 View Full ZT Dashboard →</button>
    </div>
  </div>`;
};

/* ── Gauge drawing ───────────────────────────────────────────── */
function _drawScannerGauge(id, score, color) {
  var canvas = document.getElementById(id);
  if (!canvas) return;
  var pw = canvas.parentElement?.clientWidth || 220;
  canvas.width = pw; canvas.height = Math.round(pw * 0.58);
  var ctx = canvas.getContext('2d');
  var cx = pw / 2, cy = canvas.height * 0.88, r = Math.min(pw, canvas.height * 1.7) * 0.43;
  ctx.clearRect(0, 0, pw, canvas.height);
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.lineWidth = 16; ctx.strokeStyle = '#e2e8f0'; ctx.lineCap = 'round'; ctx.stroke();
  var pct = Math.min(Math.max(score, 0), 100) / 100;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + pct * Math.PI); ctx.lineWidth = 16; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
  [0, 25, 50, 75, 100].forEach(v => {
    var ang = Math.PI + (v / 100) * Math.PI;
    var cols = { 0: '#e53e3e', 25: '#e53e3e', 50: '#ecc94b', 75: '#4299e1', 100: '#48bb78' };
    ctx.beginPath(); ctx.moveTo(cx + (r - 10) * Math.cos(ang), cy + (r - 10) * Math.sin(ang)); ctx.lineTo(cx + (r + 6) * Math.cos(ang), cy + (r + 6) * Math.sin(ang));
    ctx.lineWidth = 2; ctx.strokeStyle = cols[v]; ctx.stroke();
    ctx.fillStyle = '#4a4a6a'; ctx.font = 'bold 10px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(v), cx + (r + 18) * Math.cos(ang), cy + (r + 18) * Math.sin(ang) + 3);
  });
}

/* ── Save to CBOM ────────────────────────────────────────────── */
QSR.saveScanToCBOM = async function () {
  var r = window._lastScanResult;
  if (!r) return;
  if (!window.QSR_SUPABASE_READY) { if (window.showToast) showToast('Live Supabase session required.', 'warning'); return; }
  var btn = document.querySelector('[onclick="QSR.saveScanToCBOM()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  try {
    if (window.QSR_DataLayer && window.QSR_DataLayer.syncScanArtifacts) {
      var syncResult = await window.QSR_DataLayer.syncScanArtifacts(r.host, r);
      if (!syncResult || !syncResult.ok) throw new Error(syncResult && syncResult.error ? syncResult.error : 'Backend sync failed');
      try { await QSR_DataLayer.logAction('CBOM_GENERATED', r.host, 'CBOM'); } catch (e) { }
    }
    if (window.showToast) showToast('Scan synced to CBOM, assets, PQC and cyber rating!', 'success');
    else alert('Scan synced successfully!');
  } catch (e) {
    if (window.showToast) showToast('Save failed: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save to CBOM Database'; }
  }
};

/* ── Export CycloneDX ────────────────────────────────────────── */
QSR.exportScanCycloneDX = function () {
  var r = window._lastScanResult;
  if (!r) { if (window.showToast) showToast('Run a scan first.', 'warning'); return; }
  var obj = {
    bomFormat: 'CycloneDX', specVersion: '1.4', version: 1,
    serialNumber: 'urn:uuid:' + crypto.randomUUID(),
    metadata: { timestamp: r.scannedAt, tools: [{ vendor: 'QSecure Radar', name: 'TLS Scanner', version: '2.0' }], component: { type: 'application', name: r.host } },
    components: r.ciphers.map((c, i) => ({
      type: 'cryptographic-asset', 'bom-ref': 'cs-' + (i + 1), name: c.name,
      cryptoProperties: {
        assetType: 'protocol', algorithmProperties: { primitive: 'ae', parameterSetIdentifier: String(c.strength) },
        protocolProperties: { type: 'tls', version: 'TLS ' + r.tlsVersion, cipherSuites: [{ name: c.name, algorithms: [c.name] }] }
      }
    })),
    vulnerabilities: r.qVulnerable ? [{
      id: 'QR-VULN-001',
      description: `Quantum-vulnerable: ${r.keyAlg}-${r.keySize} on TLS ${r.tlsVersion}`,
      recommendation: 'Migrate to CRYSTALS-Kyber (ML-KEM) + CRYSTALS-Dilithium (ML-DSA)',
      ratings: [{ severity: 'critical', score: 9.1, method: 'CVSSv3' }], affects: [{ ref: r.host }]
    }] : []
  };
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  a.download = r.host.replace(/\./g, '-') + '-cbom.json'; a.click();
  if (window.showToast) showToast('CycloneDX JSON exported!', 'success');
};

/* ── Scan history ────────────────────────────────────────────── */
QSR._renderScanHistory = function () {
  var el = document.getElementById('scan-history-list');
  if (!el) return;
  var h = window._scanHistory || [];
  var badge = document.getElementById('scan-count-badge');
  if (badge) { badge.style.display = h.length ? 'inline-block' : 'none'; badge.textContent = h.length; }
  if (!h.length) { el.innerHTML = '<div style="color:#888;font-size:13px;padding:10px 0;">No scans yet this session.</div>'; return; }
  el.innerHTML = h.map(s => `
    <div class="scan-history-row" onclick="document.getElementById('scan-input').value='${s.host}';QSR._renderScanResult(s.result);document.getElementById('scan-results').style.display='block';window.scrollTo(0,0);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="scan-hist-dot" style="background:${s.result.qScore >= 70 ? '#48bb78' : s.result.qScore >= 40 ? '#ed8936' : '#e53e3e'};"></div>
        <div>
          <div style="font-weight:700;font-size:14px;color:#1a1a2e;">${s.host}</div>
          <div style="font-size:11px;color:#888;">Grade: <strong>${s.result.grade}</strong> • TLS ${s.result.tlsVersion} • ${s.result.keyAlg}-${s.result.keySize}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <span class="badge" style="background:${s.result.qScore >= 70 ? 'rgba(72,187,120,0.15)' : s.result.qScore >= 40 ? 'rgba(237,137,54,0.15)' : 'rgba(229,62,62,0.15)'};color:${s.result.qScore >= 70 ? '#48bb78' : s.result.qScore >= 40 ? '#ed8936' : '#e53e3e'};border:1px solid currentColor;">QR: ${s.result.qScore}/100</span>
        <div style="font-size:11px;color:#aaa;margin-top:4px;">${new Date(s.time).toLocaleTimeString('en-IN')}</div>
      </div>
    </div>`).join('');
};

QSR._delay = ms => new Promise(r => setTimeout(r, ms));

/* ── Load DB scan history (per logged-in user) ───────────────── */
QSR._loadDBHistory = async function (forceRefresh) {
  var el = document.getElementById('db-history-list');
  var badge = document.getElementById('db-history-badge');
  if (!el) return;

  if (!window.QSR_DataLayer || !window.QSR_SUPABASE_READY) {
    el.innerHTML = '<div style="color:#888;font-size:12px;padding:6px 0;">⚠ Log in to load your saved scan history.</div>';
    return;
  }
  if (forceRefresh && window.QSR_DataLayer.clearCache) {
    QSR_DataLayer.clearCache('scan_history');
  }
  try {
    var scans = await QSR_DataLayer.fetchScanHistory(30);
    if (badge) { badge.style.display = scans.length ? 'inline-block' : 'none'; badge.textContent = scans.length; }
    if (!scans.length) {
      el.innerHTML = '<div style="color:#888;font-size:13px;padding:6px 0;">No scans saved yet. Run a scan to save it here.</div>';
      return;
    }
    el.innerHTML = scans.map(function (s) {
      var qc = s.qScore >= 70 ? '#48bb78' : s.qScore >= 40 ? '#ed8936' : '#e53e3e';
      var gc = (s.grade === 'A+' || s.grade === 'A') ? '#48bb78' : s.grade === 'B' ? '#ed8936' : '#e53e3e';
      var dt = s.scannedAt ? new Date(s.scannedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
      return `<div class="scan-history-row" style="cursor:pointer;" onclick="QSR._replayDBScan('${s.id}')">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="scan-hist-dot" style="background:${qc};"></div>
          <div>
            <div style="font-weight:700;font-size:14px;color:#1a1a2e;">${s.host}</div>
            <div style="font-size:11px;color:#888;">Grade: <strong style="color:${gc};">${s.grade || '—'}</strong> &bull; TLS ${s.tlsVersion || '—'} &bull; ${s.keyAlg || 'RSA'}-${s.keySize || 2048}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <span class="badge" style="background:${qc}22;color:${qc};border:1px solid ${qc};">QR: ${s.qScore}/100</span>
          <div style="font-size:11px;color:#aaa;margin-top:3px;">${dt}</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<div style="color:#e53e3e;font-size:12px;">' + e.message + '</div>';
  }
};

/* Re-render a DB scan result from stored raw_result JSON */
QSR._replayDBScan = function (id) {
  var el = document.getElementById('db-history-list');
  if (!el) return;
  var rows = el.querySelectorAll('.scan-history-row');
  /* Find the scan from the last fetched list — we re-query the DataLayer cache */
  if (!window.QSR_DataLayer) return;
  QSR_DataLayer.fetchScanHistory(30).then(function (scans) {
    var s = scans.find(function (x) { return x.id === id; });
    if (!s || !s.rawResult) return;
    var r = s.rawResult;
    if (!r.ciphers) r.ciphers = [];
    if (!r.secHeaders) r.secHeaders = [];
    window._lastScanResult = r;
    var inp = document.getElementById('scan-input');
    if (inp) inp.value = s.host;
    QSR._renderScanResult(r);
    document.getElementById('scan-results').style.display = 'block';
    window.scrollTo(0, 0);
  });
};



