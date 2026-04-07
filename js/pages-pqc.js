/* pages-pqc.js - PQC Posture Page (FR9, FR10, FR11) */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.pqc = async function(container) {
  container.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">Post-Quantum Cryptography Posture</h1>
      <p class="page-subtitle">NIST-aligned readiness assessment using FIPS 203, 204, and 205.</p>
    </div>
  </div>

  <div class="pqc-tier-grid">
    <div class="pqc-tier-card tier-elite">
      <div class="tier-num" id="pqc-elite">0</div>
      <div class="tier-label">Elite PQC</div>
      <div class="tier-sublabel">Tier 1 | Score 76-100</div>
      <div class="tier-desc">Hybrid PQC or strong crypto-agility evidence.</div>
    </div>
    <div class="pqc-tier-card tier-standard">
      <div class="tier-num" id="pqc-std">0</div>
      <div class="tier-label">Standard</div>
      <div class="tier-sublabel">Tier 2 | Score 51-75</div>
      <div class="tier-desc">TLS 1.3 and good hygiene, but incomplete PQC rollout.</div>
    </div>
    <div class="pqc-tier-card tier-legacy">
      <div class="tier-num" id="pqc-legacy">0</div>
      <div class="tier-label">Legacy</div>
      <div class="tier-sublabel">Tier 3 | Score 26-50</div>
      <div class="tier-desc">Migration required to reduce HNDL exposure.</div>
    </div>
    <div class="pqc-tier-card tier-critical">
      <div class="tier-num" id="pqc-crit">0</div>
      <div class="tier-label">Critical</div>
      <div class="tier-sublabel">Tier 4 | Score 0-25</div>
      <div class="tier-desc">Urgent remediation and PQC migration priority.</div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:14px;">
    <div class="panel-title">PQC Migration Progress</div>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:#4a4a6a;margin-bottom:8px;">
      <span>Current: <strong id="pqc-elite-pct">0</strong>% ready</span>
      <span>Target: <strong style="color:#48bb78;">60%</strong> by December 2026</span>
    </div>
    <div style="position:relative;background:rgba(0,0,0,0.08);border-radius:8px;height:20px;overflow:visible;">
      <div id="pqc-progress-fill" style="height:100%;background:linear-gradient(90deg,#48bb78,#4299e1);border-radius:8px;width:0%;transition:width 1s ease;position:relative;">
        <div style="position:absolute;right:-1px;top:-4px;width:3px;height:28px;background:#fff;border-radius:2px;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
      </div>
      <div style="position:absolute;left:60%;top:-8px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;">
        <div style="font-size:10px;color:#48bb78;font-weight:700;white-space:nowrap;">60% target</div>
        <div style="width:2px;height:36px;background:rgba(72,187,120,0.6);margin-top:2px;"></div>
      </div>
    </div>
    <div id="migration-insight" style="margin-top:14px;padding:10px 14px;background:rgba(66,153,225,0.08);border-radius:8px;border-left:3px solid #4299e1;font-size:13px;color:#4a4a6a;"></div>
  </div>

  <div class="grid-2" style="margin-bottom:14px;">
    <div class="panel">
      <div class="panel-title">PQC Readiness Distribution</div>
      <canvas id="pqc-donut" data-h="200" style="width:100%;display:block;"></canvas>
    </div>
    <div class="panel">
      <div class="panel-title">NIST PQC Algorithms</div>
      <div id="pqc-recs"></div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-title">Per-Asset PQC Readiness Score</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <input id="pqc-search" class="form-input" style="width:200px;" placeholder="Search assets..." oninput="QSR._filterPQC()">
      <select id="pqc-status-filter" class="form-select" style="width:140px;" onchange="QSR._filterPQC()">
        <option value="">All Tiers</option>
        <option>Elite-PQC</option><option>Standard</option><option>Legacy</option><option>Critical</option>
      </select>
    </div>
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr>
          <th>Asset</th><th>PQC Score (0-100)</th><th>Tier</th><th>PQC Support</th><th>Priority</th>
        </tr></thead>
        <tbody id="pqc-tbody"><tr><td colspan="5" class="loading-cell">Loading PQC scores...</td></tr></tbody>
      </table>
    </div>
  </div>`;

  var dl = window.QSR_DataLayer;
  var data = dl ? await dl.fetchPQCScores() : { assets: [], elitePct: 0, standardPct: 0, legacyPct: 0, criticalPct: 0, criticalApps: 0 };
  var assets = (data.assets || []).slice().sort(function(a, b) { return (a.score || 0) - (b.score || 0); });

  var elite = assets.filter(function(a) { return (a.status || '').includes('Elite'); }).length;
  var standard = assets.filter(function(a) { return a.status === 'Standard'; }).length;
  var legacy = assets.filter(function(a) { return a.status === 'Legacy'; }).length;
  var critical = assets.filter(function(a) { return a.status === 'Critical'; }).length;
  var total = assets.length || 1;
  var elitePct = data.elitePct !== undefined ? data.elitePct : Math.round(elite / total * 100);

  function countUp(id, target, suffix) {
    var el = document.getElementById(id);
    if (!el) return;
    var start = 0;
    var dur = 800;
    var step = 16;
    var inc = target / (dur / step);
    var t = setInterval(function() {
      start = Math.min(start + inc, target);
      el.textContent = Math.round(start) + (suffix || '');
      if (start >= target) clearInterval(t);
    }, step);
  }

  countUp('pqc-elite', elite);
  countUp('pqc-std', standard);
  countUp('pqc-legacy', legacy);
  countUp('pqc-crit', critical);
  countUp('pqc-elite-pct', elitePct, '%');

  setTimeout(function() {
    var fill = document.getElementById('pqc-progress-fill');
    if (fill) fill.style.width = Math.min(elitePct, 100) + '%';
  }, 200);

  var insight = document.getElementById('migration-insight');
  if (insight) {
    if (!assets.length) {
      insight.innerHTML = '<strong>No PQC-scored assets yet.</strong> Run live scans or load assessed inventory to populate migration readiness.';
    } else {
      var gap = Math.max(0, 60 - elitePct);
      insight.innerHTML = gap > 0
        ? '<strong>Gap to target:</strong> ' + gap + '% of assets still need uplift. Prioritize the ' + critical + ' critical-tier assets first because they carry the highest harvest-now-decrypt-later exposure.'
        : '<strong>On track:</strong> current readiness exceeds the 2026 target. Focus on converting the remaining non-elite assets to hybrid PQC or equivalent crypto-agility posture.';
    }
  }

  QSR.drawDonut('pqc-donut', [
    { label:'Elite-PQC', value:elite, color:'#48bb78' },
    { label:'Standard', value:standard, color:'#4299e1' },
    { label:'Legacy', value:legacy, color:'#ed8936' },
    { label:'Critical', value:critical, color:'#e53e3e' }
  ], 'PQC Status', assets.length + ' Assets');

  var recs = [
    { algo:'ML-KEM', use:'Key establishment', std:'FIPS 203', status:'APPROVED', color:'#48bb78', desc:'Primary post-quantum KEM for hybrid transport migration.' },
    { algo:'ML-DSA', use:'Digital signatures', std:'FIPS 204', status:'APPROVED', color:'#48bb78', desc:'Primary signature algorithm for replacing RSA and ECDSA signing flows.' },
    { algo:'SLH-DSA', use:'Hash-based signatures', std:'FIPS 205', status:'APPROVED', color:'#4299e1', desc:'Backup signature option for high-assurance and long-lived trust material.' }
  ];
  document.getElementById('pqc-recs').innerHTML = recs.map(function(r) {
    return '<div class="nist-algo-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">' +
        '<div><div style="font-weight:700;font-size:13px;color:#1a1a2e;">' + r.algo + '</div><div style="font-size:11px;color:#888;">' + r.use + '</div></div>' +
        '<div><span class="badge badge-ok">' + r.status + '</span><br><span style="font-size:10px;color:#888;">' + r.std + '</span></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#4a4a6a;line-height:1.5;">' + r.desc + '</div>' +
    '</div>';
  }).join('');

  window._pqcAssets = assets;
  QSR._renderPQCTable(assets);
};

QSR._filterPQC = function() {
  var q = (document.getElementById('pqc-search')?.value || '').toLowerCase();
  var s = document.getElementById('pqc-status-filter')?.value || '';
  QSR._renderPQCTable((window._pqcAssets || []).filter(function(a) {
    return (!q || (a.name || '').toLowerCase().includes(q)) && (!s || a.status === s);
  }));
};

QSR._renderPQCTable = function(assets) {
  var tbody = document.getElementById('pqc-tbody');
  if (!tbody) return;
  if (!assets.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">No assets match the current filter.</td></tr>';
    return;
  }

  var statusClass = { 'Elite-PQC':'badge-ok', Standard:'badge-info', Legacy:'badge-warn', Critical:'badge-danger' };
  var priority = { Critical:'Urgent', Legacy:'High', Standard:'Medium', 'Elite-PQC':'Monitor' };
  tbody.innerHTML = assets.map(function(a) {
    var s = a.score || 0;
    var c = s >= 76 ? '#48bb78' : s >= 51 ? '#4299e1' : s >= 26 ? '#ecc94b' : '#e53e3e';
    return '<tr style="' + (a.status === 'Critical' ? 'background:rgba(229,62,62,0.04);' : '') + '">' +
      '<td><strong>' + a.name + '</strong></td>' +
      '<td style="min-width:180px;"><div style="display:flex;align-items:center;gap:10px;"><div style="flex:1;background:rgba(0,0,0,0.08);border-radius:4px;height:8px;overflow:hidden;"><div style="width:' + s + '%;background:' + c + ';height:8px;border-radius:4px;transition:width 0.8s ease;"></div></div><span style="font-family:Rajdhani,sans-serif;font-size:18px;font-weight:800;color:' + c + ';min-width:40px;">' + s + '</span></div></td>' +
      '<td><span class="badge ' + (statusClass[a.status] || 'badge-info') + '">' + (a.status || 'Unknown') + '</span></td>' +
      '<td>' + (a.pqcSupport ? '<span class="badge badge-ok">YES</span>' : '<span class="badge badge-danger">NO</span>') + '</td>' +
      '<td style="font-size:13px;">' + (priority[a.status] || '-') + '</td>' +
    '</tr>';
  }).join('');
};
