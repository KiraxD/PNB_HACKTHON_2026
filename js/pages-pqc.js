/* pages-pqc.js — Post-Quantum Cryptography Posture (FR9, FR10, FR11)
   Live Supabase data */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.pqc = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Post-Quantum Cryptography Posture</h1>
        <p class="page-subtitle">NIST PQC Standards Assessment • FR9, FR10, FR11</p>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="grid-4">
      <div class="kpi-tile good"><div class="kpi-val" id="pqc-elite">—</div><div class="kpi-label">Elite-PQC Assets</div></div>
      <div class="kpi-tile"><div class="kpi-val" id="pqc-std">—</div><div class="kpi-label">Standard</div></div>
      <div class="kpi-tile warn"><div class="kpi-val" id="pqc-legacy">—</div><div class="kpi-label">Legacy</div></div>
      <div class="kpi-tile danger"><div class="kpi-val" id="pqc-crit">—</div><div class="kpi-label">Critical</div></div>
    </div>

    <!-- Chart + Info -->
    <div class="grid-2" style="margin-top:18px;">
      <div class="panel">
        <div class="panel-title">PQC Readiness Distribution</div>
        <canvas id="pqc-donut" data-h="200" style="width:100%;display:block;"></canvas>
      </div>
      <div class="panel">
        <div class="panel-title">Recommended PQC Algorithms</div>
        <div class="pqc-recs" id="pqc-recs"></div>
      </div>
    </div>

    <!-- Asset Scores Table -->
    <div class="panel" style="margin-top:18px;">
      <div class="panel-title">Per-Asset Quantum Risk Score</div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr>
            <th>Asset</th><th>QR Score (0-100)</th><th>Status</th><th>PQC Support</th>
          </tr></thead>
          <tbody id="pqc-tbody">
            <tr><td colspan="4" class="loading-cell">Loading PQC scores...</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  /* Load data */
  const dl = window.QSR_DataLayer;
  const data = dl ? await dl.fetchPQCScores() : (window.QSR.pqcPosture || {});
  const assets = data.assets || [];

  /* KPIs */
  const elite    = assets.filter(a => (a.status||'').includes('Elite')).length;
  const standard = assets.filter(a => a.status === 'Standard').length;
  const legacy   = assets.filter(a => a.status === 'Legacy').length;
  const critical = assets.filter(a => a.status === 'Critical').length;
  document.getElementById('pqc-elite').textContent = elite;
  document.getElementById('pqc-std').textContent   = standard;
  document.getElementById('pqc-legacy').textContent = legacy;
  document.getElementById('pqc-crit').textContent  = critical;

  /* Donut chart */
  QSR.drawDonut('pqc-donut', [
    { label: 'Elite-PQC', value: elite,    color: '#48bb78' },
    { label: 'Standard',  value: standard, color: '#4299e1' },
    { label: 'Legacy',    value: legacy,   color: '#ed8936' },
    { label: 'Critical',  value: critical, color: '#e53e3e' }
  ], 'PQC Status', assets.length + ' Assets');

  /* Recommendations */
  const recs = [
    { algo: 'CRYSTALS-Kyber (ML-KEM)', use: 'Key Encapsulation', status: 'NIST FIPS 203' },
    { algo: 'CRYSTALS-Dilithium (ML-DSA)', use: 'Digital Signatures', status: 'NIST FIPS 204' },
    { algo: 'FALCON (FN-DSA)', use: 'Compact Signatures', status: 'NIST FIPS 206' },
    { algo: 'SPHINCS+ (SLH-DSA)', use: 'Hash-based Signatures', status: 'NIST FIPS 205' }
  ];
  document.getElementById('pqc-recs').innerHTML = recs.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color);">
      <div>
        <div style="font-weight:600;font-size:14px;">${r.algo}</div>
        <div style="font-size:12px;color:#888;">${r.use}</div>
      </div>
      <span class="badge badge-ok">${r.status}</span>
    </div>`).join('');

  /* Score bar helper */
  function scoreBar(score) {
    const color = score >= 70 ? '#48bb78' : score >= 40 ? '#ed8936' : '#e53e3e';
    return `<div style="display:flex;align-items:center;gap:10px;">
      <div style="flex:1;background:#2d3748;border-radius:4px;height:8px;">
        <div style="width:${score}%;background:${color};height:8px;border-radius:4px;transition:width 0.6s;"></div>
      </div>
      <span style="font-weight:700;color:${color};min-width:35px;">${score}/100</span>
    </div>`;
  }

  /* Table */
  const tbody = document.getElementById('pqc-tbody');
  if (!assets.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;padding:20px;">No PQC score data found.</td></tr>';
  } else {
    const statusClass = { 'Elite-PQC':'badge-ok', 'Standard':'badge-info', 'Legacy':'badge-warn', 'Critical':'badge-danger' };
    tbody.innerHTML = assets
      .sort((a,b) => b.score - a.score)
      .map(a => `<tr>
        <td><strong>${a.name}</strong></td>
        <td style="min-width:180px;">${scoreBar(a.score||0)}</td>
        <td><span class="badge ${statusClass[a.status]||'badge-info'}">${a.status||'Unknown'}</span></td>
        <td>${a.pqcSupport ? '<span class="badge badge-ok">YES</span>' : '<span class="badge badge-danger">NO</span>'}</td>
      </tr>`).join('');
  }
};
