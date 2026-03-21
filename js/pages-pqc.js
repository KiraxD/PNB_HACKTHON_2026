/* pages-pqc.js - PQC Posture Page (FR9, FR10, FR11, FR12) */
/* QR Score 0-100 per SRS FR9 */

window._pqcPage = function() {
  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
    '<div><div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;">PQC Posture Assessment (FR9-FR12)</div>' +
    '<div style="font-size:13px;color:#4a4a6a;">Quantum Risk Score: 0 (Critical) to 100 (Elite-PQC) | NIST PQC Guidelines</div></div>' +
    '<button class="btn btn-primary" onclick="navigateTo(\'reporting\')">Generate Report (FR14)</button>' +
    '</div>' +

    /* Summary stats */
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px;" id="pqc-stats-strip">' +
    [['Elite-PQC (76-100)','#48bb78','pqc-elite'],['Standard (51-75)','#4299e1','pqc-standard'],['Legacy (26-50)','#ecc94b','pqc-legacy'],['Critical (0-25)','#e53e3e','pqc-critical']].map(function(x){
      return '<div style="background:rgba(255,255,255,0.9);border-radius:10px;padding:12px;border-left:4px solid '+x[1]+';"><div style="font-size:11px;color:#4a4a6a;text-transform:uppercase;">'+x[0]+'</div><div id="'+x[2]+'" style="font-family:Rajdhani;font-size:34px;font-weight:700;color:'+x[1]+';line-height:1;">—%</div></div>';
    }).join('') + '</div>' +

    '<div class="grid-2" style="margin-bottom:12px;">' +
    '<div class="panel"><div class="panel-title">QR Score Distribution (FR9)</div><canvas id="chart-pqc-dist" data-h="140" style="width:100%;display:block;"></canvas></div>' +
    '<div class="panel"><div class="panel-title">Application Status (FR10, FR11)</div><div style="display:flex;align-items:center;gap:14px;"><canvas id="chart-pqc-status" data-h="130" style="width:100%;display:block;"></canvas><div id="pqc-status-legend" style="flex:1;"></div></div></div>' +
    '</div>' +

    '<div class="panel"><div class="panel-title">Asset-Level PQC Assessment Table (FR9, FR11)</div>' +
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Asset</th><th>QR Score (0-100)</th><th>Classification (FR11)</th><th>PQC Support</th><th>Priority</th><th>Score Bar</th></tr></thead>' +
    '<tbody id="pqc-asset-tbody"><tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">Loading...</td></tr></tbody></table></div></div>' +

    /* Migration recommendations (FR12) */
    '<div class="panel"><div class="panel-title">Migration Recommendations (FR12) - NIST Post-Quantum Standards</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">' +
    [
      ['CRYSTALS-Kyber (ML-KEM)','#48bb78','Key Encapsulation Mechanism. Deploy for all TLS 1.3 endpoints. NIST FIPS 203. Priority: HIGH.'],
      ['CRYSTALS-Dilithium (ML-DSA)','#4299e1','Lattice-based digital signature. Replace ECDSA/RSA signatures. NIST FIPS 204. Priority: HIGH.'],
      ['SPHINCS+ (SLH-DSA)','#ed8936','Hash-based signature. Backup for code signing. NIST FIPS 205. Priority: MEDIUM.'],
      ['Hybrid TLS Transition','#9f7aea','Run classical + PQC simultaneously during migration. Use X25519_Kyber768. Priority: IMMEDIATE.']
    ].map(function(r) {
      return '<div style="background:rgba(255,255,255,0.9);border-radius:10px;padding:14px;border-top:3px solid '+r[1]+';box-shadow:0 1px 6px rgba(0,0,0,0.06);">' +
        '<div style="font-weight:700;font-family:Rajdhani;font-size:15px;color:'+r[1]+';margin-bottom:6px;">'+r[0]+'</div>' +
        '<div style="font-size:12px;color:#4a4a6a;line-height:1.6;">'+r[2]+'</div></div>';
    }).join('') +
    '</div></div>';
};

window.initPQCPosture = async function() {
  var pqc = QSR.pqcPosture;
  if (window.QSR_DataLayer) {
    try { var live = await QSR_DataLayer.fetchPQCScores(); if (live && live.assets) pqc = live; } catch(e){}
  }

  /* Update stats */
  var setEl = function(id, v){ var el = document.getElementById(id); if(el) el.textContent = v; };
  setEl('pqc-elite',    (pqc.elitePct||0)+'%');
  setEl('pqc-standard', (pqc.standardPct||0)+'%');
  setEl('pqc-legacy',   (pqc.legacyPct||0)+'%');
  setEl('pqc-critical', (pqc.criticalPct||0)+'%');

  /* Charts */
  QSR.drawBars('chart-pqc-dist', [
    {label:'0-25 Critical',value:pqc.criticalPct||0, color:'#e53e3e'},
    {label:'26-50 Legacy',  value:pqc.legacyPct||0,  color:'#ecc94b'},
    {label:'51-75 Standard',value:pqc.standardPct||0,color:'#4299e1'},
    {label:'76-100 Elite',  value:pqc.elitePct||0,   color:'#48bb78'}
  ]);
  var statusData = [
    {label:'Elite-PQC', value:pqc.elitePct||0, color:'#48bb78'},
    {label:'Standard',  value:pqc.standardPct||0, color:'#4299e1'},
    {label:'Legacy',    value:pqc.legacyPct||0, color:'#ecc94b'},
    {label:'Critical',  value:pqc.criticalPct||0, color:'#e53e3e'}
  ];
  QSR.drawDonut('chart-pqc-status', statusData, (pqc.elitePct||0)+'%', 'Elite');
  var leg = document.getElementById('pqc-status-legend');
  if (leg) leg.innerHTML = statusData.map(function(s){ return '<div class="stat-row"><span class="stat-key" style="color:'+s.color+';font-weight:700;">'+s.label+'</span><span class="stat-val">'+s.value+'%</span></div>'; }).join('');

  /* Asset table */
  var tbody = document.getElementById('pqc-asset-tbody');
  if (tbody && pqc.assets) {
    var statusColors = {'Elite-PQC':'#48bb78',Standard:'#4299e1',Legacy:'#ecc94b',Critical:'#e53e3e'};
    tbody.innerHTML = pqc.assets.map(function(a) {
      var s = a.score || 0;
      var c = statusColors[a.status] || '#888';
      var priority = s < 26 ? 'P1 - Immediate' : s < 51 ? 'P2 - High' : s < 76 ? 'P3 - Medium' : 'P4 - Low';
      var priColor  = s < 26 ? '#e53e3e' : s < 51 ? '#ed8936' : s < 76 ? '#ecc94b' : '#48bb78';
      return '<tr>' +
        '<td style="font-weight:600;">'+(a.name||'—')+'</td>' +
        '<td><span style="font-family:Rajdhani;font-size:22px;font-weight:700;color:'+c+';">'+s+'</span><span style="font-size:10px;color:#aaa;">/100</span></td>' +
        '<td><span class="badge" style="background:'+c+'22;color:'+c+';border:1px solid '+c+';">'+(a.status||'—')+'</span></td>' +
        '<td><span class="badge '+(a.pqcSupport?'badge-valid':'badge-critical')+'">'+(a.pqcSupport?'Supported':'Not Ready')+'</span></td>' +
        '<td style="font-weight:700;color:'+priColor+';font-size:12px;">'+priority+'</td>' +
        '<td style="min-width:100px;"><div class="progress-bar"><div class="progress-fill" style="width:'+Math.min(s,100)+'%;background:'+c+';"></div></div></td>' +
        '</tr>';
    }).join('');
  }
};

