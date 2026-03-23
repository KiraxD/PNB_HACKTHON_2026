/* pages-pqc.js — Elite PQC Posture Page (FR9, FR10, FR11) */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.pqc = async function(container) {
  container.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">🧬 Post-Quantum Cryptography Posture</h1>
      <p class="page-subtitle">NIST PQC Standards Assessment — FR9, FR10, FR11 — FIPS 203/204/205</p>
    </div>
  </div>

  <!-- Animated Tier Cards -->
  <div class="pqc-tier-grid">
    <div class="pqc-tier-card tier-elite">
      <div class="tier-num" id="pqc-elite">—</div>
      <div class="tier-label">Elite PQC</div>
      <div class="tier-sublabel">Tier 1 · Score 76–100</div>
      <div class="tier-desc">CRYSTALS-Kyber hybrid deployed. Full quantum resistance.</div>
    </div>
    <div class="pqc-tier-card tier-standard">
      <div class="tier-num" id="pqc-std">—</div>
      <div class="tier-label">Standard</div>
      <div class="tier-sublabel">Tier 2 · Score 51–75</div>
      <div class="tier-desc">TLS 1.3 + AES-256. PQC migration planned.</div>
    </div>
    <div class="pqc-tier-card tier-legacy">
      <div class="tier-num" id="pqc-legacy">—</div>
      <div class="tier-label">Legacy</div>
      <div class="tier-sublabel">Tier 3 · Score 26–50</div>
      <div class="tier-desc">RSA-2048 / TLS 1.2. Migration required.</div>
    </div>
    <div class="pqc-tier-card tier-critical">
      <div class="tier-num" id="pqc-crit">—</div>
      <div class="tier-label">Critical</div>
      <div class="tier-sublabel">Tier 4 · Score 0–25</div>
      <div class="tier-desc">RSA-1024 / TLS 1.0. Immediate action required.</div>
    </div>
  </div>

  <!-- Migration Progress -->
  <div class="panel" style="margin-bottom:14px;">
    <div class="panel-title">🚀 PQC Migration Progress to 2026 Target</div>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:#4a4a6a;margin-bottom:8px;">
      <span>Current: <strong id="pqc-elite-pct">—</strong>% PQC-Ready</span>
      <span>Target: <strong style="color:#48bb78;">60%</strong> by Dec 2026</span>
    </div>
    <div style="position:relative;background:rgba(0,0,0,0.08);border-radius:8px;height:20px;overflow:visible;">
      <div id="pqc-progress-fill" style="height:100%;background:linear-gradient(90deg,#48bb78,#4299e1);border-radius:8px;width:0%;transition:width 1s ease;position:relative;">
        <div style="position:absolute;right:-1px;top:-4px;width:3px;height:28px;background:#fff;border-radius:2px;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
      </div>
      <!-- Target marker -->
      <div style="position:absolute;left:60%;top:-8px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;">
        <div style="font-size:10px;color:#48bb78;font-weight:700;white-space:nowrap;">🎯 60% Target</div>
        <div style="width:2px;height:36px;background:rgba(72,187,120,0.6);margin-top:2px;"></div>
      </div>
    </div>
    <div id="migration-insight" style="margin-top:14px;padding:10px 14px;background:rgba(66,153,225,0.08);border-radius:8px;border-left:3px solid #4299e1;font-size:13px;color:#4a4a6a;"></div>
  </div>

  <!-- Donut Chart + NIST Algorithms -->
  <div class="grid-2" style="margin-bottom:14px;">
    <div class="panel">
      <div class="panel-title">📊 PQC Readiness Distribution</div>
      <canvas id="pqc-donut" data-h="200" style="width:100%;display:block;"></canvas>
    </div>
    <div class="panel">
      <div class="panel-title">🔬 NIST PQC Algorithms — Adoption Status</div>
      <div id="pqc-recs"></div>
    </div>
  </div>

  <!-- Per-Asset Score Table -->
  <div class="panel">
    <div class="panel-title">📋 Per-Asset Quantum Risk Score (sorted by urgency)</div>
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
          <th>Asset</th><th>QR Score (0–100)</th><th>Tier</th><th>PQC Support</th><th>Priority</th>
        </tr></thead>
        <tbody id="pqc-tbody"><tr><td colspan="5" class="loading-cell">Loading PQC scores...</td></tr></tbody>
      </table>
    </div>
  </div>`;

  /* Load data */
  var dl = window.QSR_DataLayer;
  var data = dl ? await dl.fetchPQCScores() : (window.QSR.pqcPosture || {});
  var assets = data.assets || [];

  /* Sort critical first */
  assets.sort((a,b) => (a.score||0) - (b.score||0));

  var elite    = assets.filter(a => (a.status||'').includes('Elite')).length;
  var standard = assets.filter(a => a.status === 'Standard').length;
  var legacy   = assets.filter(a => a.status === 'Legacy').length;
  var critical = assets.filter(a => a.status === 'Critical').length;
  var total    = assets.length || 1;
  var elitePct = data.elitePct !== undefined ? data.elitePct : Math.round(elite/total*100);

  /* Animated count-up */
  function countUp(id, target, suffix) {
    var el = document.getElementById(id);
    if (!el) return;
    var start = 0, dur = 800, step = 16;
    var inc = target / (dur / step);
    var t = setInterval(() => {
      start = Math.min(start + inc, target);
      el.textContent = Math.round(start) + (suffix||'');
      if (start >= target) clearInterval(t);
    }, step);
  }
  countUp('pqc-elite',    elite);
  countUp('pqc-std',      standard);
  countUp('pqc-legacy',   legacy);
  countUp('pqc-crit',     critical);
  countUp('pqc-elite-pct', elitePct, '%');

  /* Progress bar */
  setTimeout(() => {
    var fill = document.getElementById('pqc-progress-fill');
    if (fill) fill.style.width = Math.min(elitePct, 100) + '%';
  }, 200);

  /* Migration insight */
  var insight = document.getElementById('migration-insight');
  if (insight) {
    var gap = Math.max(0, 60 - elitePct);
    insight.innerHTML = gap > 0
      ? `<strong>Gap to target:</strong> ${gap}% of assets need PQC upgrade. At the current pace, <strong>${critical}</strong> critical-tier assets should be prioritized first — they represent the highest quantum attack surface.`
      : `<strong>🎉 On track!</strong> ${elitePct}% PQC readiness exceeds the 60% 2026 target. Focus on converting the remaining ${100-elitePct}% Legacy/Standard assets.`;
  }

  /* Donut */
  QSR.drawDonut('pqc-donut', [
    { label:'Elite-PQC', value:elite,    color:'#48bb78' },
    { label:'Standard',  value:standard, color:'#4299e1' },
    { label:'Legacy',    value:legacy,   color:'#ed8936' },
    { label:'Critical',  value:critical, color:'#e53e3e' }
  ], 'PQC Status', total + ' Assets');

  /* NIST Algorithm cards */
  var recs = [
    { algo:'CRYSTALS-Kyber (ML-KEM)', use:'Key Encapsulation', std:'NIST FIPS 203', status:'APPROVED', color:'#48bb78',
      desc:'Primary key exchange algorithm. Replace all RSA/ECDH. Kyber-768 recommended for most use cases.' },
    { algo:'CRYSTALS-Dilithium (ML-DSA)', use:'Digital Signatures', std:'NIST FIPS 204', status:'APPROVED', color:'#48bb78',
      desc:'Primary signature algorithm. Replace RSA-SHA256 and ECDSA. Dilithium-3 offers optimal balance.' },
    { algo:'SPHINCS+ (SLH-DSA)', use:'Hash-based Signatures', std:'NIST FIPS 205', status:'APPROVED', color:'#4299e1',
      desc:'Stateless hash-based. Best for long-lived documents, CAs, and code signing.' },
    { algo:'FALCON (FN-DSA)', use:'Compact Signatures', std:'NIST FIPS 206', status:'APPROVED', color:'#4299e1',
      desc:'Smallest signature sizes. Ideal for embedded systems and IoT with constrained bandwidth.' }
  ];
  document.getElementById('pqc-recs').innerHTML = recs.map(r => `
    <div class="nist-algo-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div>
          <div style="font-weight:700;font-size:13px;color:#1a1a2e;">${r.algo}</div>
          <div style="font-size:11px;color:#888;">${r.use}</div>
        </div>
        <div>
          <span class="badge badge-ok">${r.status}</span><br>
          <span style="font-size:10px;color:#888;">${r.std}</span>
        </div>
      </div>
      <div style="font-size:11px;color:#4a4a6a;line-height:1.5;">${r.desc}</div>
    </div>`).join('');

  /* Table */
  window._pqcAssets = assets;
  QSR._renderPQCTable(assets);
};

QSR._filterPQC = function() {
  var q = (document.getElementById('pqc-search')?.value || '').toLowerCase();
  var s = document.getElementById('pqc-status-filter')?.value || '';
  QSR._renderPQCTable((window._pqcAssets || []).filter(a =>
    (!q || (a.name||'').toLowerCase().includes(q)) && (!s || a.status === s)
  ));
};

QSR._renderPQCTable = function(assets) {
  var tbody = document.getElementById('pqc-tbody');
  if (!tbody) return;
  if (!assets.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">No assets match filter.</td></tr>'; return; }
  var statusClass = { 'Elite-PQC':'badge-ok','Standard':'badge-info','Legacy':'badge-warn','Critical':'badge-danger' };
  var priority = { 'Critical':'🔴 Urgent','Legacy':'🟡 High','Standard':'🔵 Medium','Elite-PQC':'🟢 Monitor' };
  tbody.innerHTML = assets.map(a => {
    var s = a.score || 0;
    var c = s >= 76 ? '#48bb78' : s >= 51 ? '#4299e1' : s >= 26 ? '#ecc94b' : '#e53e3e';
    return `<tr style="${a.status === 'Critical' ? 'background:rgba(229,62,62,0.04);' : ''}">
      <td><strong>${a.name}</strong></td>
      <td style="min-width:180px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="flex:1;background:rgba(0,0,0,0.08);border-radius:4px;height:8px;overflow:hidden;">
            <div style="width:${s}%;background:${c};height:8px;border-radius:4px;transition:width 0.8s ease;" class="score-bar-animate"></div>
          </div>
          <span style="font-family:Rajdhani,sans-serif;font-size:18px;font-weight:800;color:${c};min-width:40px;">${s}</span>
        </div>
      </td>
      <td><span class="badge ${statusClass[a.status]||'badge-info'}">${a.status||'Unknown'}</span></td>
      <td>${a.pqcSupport ? '<span class="badge badge-ok">✓ YES</span>' : '<span class="badge badge-danger">✗ NO</span>'}</td>
      <td style="font-size:13px;">${priority[a.status]||'—'}</td>
    </tr>`;
  }).join('');
};
