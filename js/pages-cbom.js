/* pages-cbom.js — Elite Cryptographic Bill of Materials (FR8)
   Risk Heatmap • Search/Filter • CycloneDX 1.4 Export */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.cbom = async function(container) {
  container.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">📦 Cryptographic Bill of Materials</h1>
      <p class="page-subtitle">CycloneDX 1.4 Compliant • FR8 — Full CBOM Generation & Export</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn-export" onclick="QSR.exportCBOM()">⬇ CycloneDX JSON</button>
      <button class="btn-export" onclick="QSR.exportCBOMCSV()">📄 Export CSV</button>
    </div>
  </div>

  <!-- KPI Row -->
  <div class="grid-4" id="cbom-kpis">
    <div class="kpi-tile"><div class="kpi-val" id="k-apps">—</div><div class="kpi-label">Applications</div></div>
    <div class="kpi-tile danger"><div class="kpi-val" id="k-weak">—</div><div class="kpi-label">Weak Crypto</div></div>
    <div class="kpi-tile success"><div class="kpi-val" id="k-certs">—</div><div class="kpi-label">Active Certs</div></div>
    <div class="kpi-tile warning"><div class="kpi-val" id="k-issues">—</div><div class="kpi-label">Cert Issues</div></div>
  </div>

  <!-- Risk Heatmap -->
  <div class="panel" style="margin-top:14px;">
    <div class="panel-title">🔥 Cryptographic Risk Heatmap</div>
    <div style="font-size:12px;color:#888;margin-bottom:10px;">Each cell = one asset. Hover for details.</div>
    <div id="cbom-heatmap" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
    <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">
      ${[['#e53e3e','Critical (RSA-1024 / TLS 1.0)'],['#ed8936','High (RSA-2048 / TLS 1.2)'],['#ecc94b','Medium (RSA-2048 / TLS 1.3)'],['#48bb78','Low (RSA-4096 / TLS 1.3)']].map(([c,l]) =>
        `<span style="display:flex;align-items:center;gap:5px;font-size:12px;"><span style="width:12px;height:12px;border-radius:2px;background:${c};display:inline-block;"></span>${l}</span>`
      ).join('')}
    </div>
  </div>

  <!-- Charts Row -->
  <div class="grid-2" style="margin-top:14px;">
    <div class="panel">
      <div class="panel-title">🔑 Key Length Distribution</div>
      <canvas id="chart-keylength" data-h="180" style="width:100%;display:block;"></canvas>
    </div>
    <div class="panel">
      <div class="panel-title">🌐 TLS Protocol Versions</div>
      <canvas id="chart-tls" data-h="180" style="width:100%;display:block;"></canvas>
    </div>
  </div>

  <!-- Per-App CBOM Table -->
  <div class="panel" style="margin-top:14px;">
    <div class="panel-title">📋 Per-Application Cryptographic Inventory</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <div class="search-wrap" style="flex:1;min-width:200px;margin:0;">
        <span class="search-icon">🔍</span>
        <input class="search-input" id="cbom-search" placeholder="Search app, cipher, CA..." oninput="QSR._filterCBOM()">
      </div>
      <select class="form-select" id="cbom-risk-filter" style="width:130px;" onchange="QSR._filterCBOM()">
        <option value="">All Risks</option>
        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
      </select>
      <select class="form-select" id="cbom-tls-filter" style="width:130px;" onchange="QSR._filterCBOM()">
        <option value="">All TLS</option>
        <option>1.3</option><option>1.2</option><option>1.1</option><option>1.0</option>
      </select>
    </div>
    <div style="overflow-x:auto;">
      <table class="data-table" id="cbom-table">
        <thead><tr>
          <th>Application</th><th>Key Length</th><th>Cipher Suite</th>
          <th>Certificate Authority</th><th>TLS Version</th><th>Risk</th>
        </tr></thead>
        <tbody id="cbom-tbody"><tr><td colspan="6" class="loading-cell">Loading CBOM data...</td></tr></tbody>
      </table>
    </div>
    <div id="cbom-count" style="font-size:12px;color:#888;margin-top:8px;text-align:right;"></div>
  </div>`;

  /* Load data */
  var dl = window.QSR_DataLayer;
  var cbom = dl ? await dl.fetchCBOM() : (window.QSR.cbom || {});
  var perApp = cbom.perApp || [];

  /* KPI with count-up */
  function countUp(id, n) {
    var el = document.getElementById(id); if (!el) return;
    var v = parseInt(n) || 0, s = 0, inc = v/40, t = setInterval(() => { s = Math.min(s+inc,v); el.textContent = Math.round(s); if(s>=v) clearInterval(t); }, 20);
  }
  countUp('k-apps',   cbom.totalApps   || perApp.length);
  countUp('k-weak',   cbom.weakCrypto  || 0);
  countUp('k-certs',  cbom.activeCerts || perApp.length);
  countUp('k-issues', cbom.certIssues  || 0);

  /* Risk Heatmap */
  var hm = document.getElementById('cbom-heatmap');
  if (hm && perApp.length) {
    hm.innerHTML = perApp.map(p => {
      var isWeak = p.keyLen === 'RSA-1024' || p.keyLen === '1024-bit' || p.tls === '1.0';
      var isMed  = p.tls === '1.2';
      var isHigh = !isWeak && p.keyLen && (p.keyLen.includes('2048')) && p.tls !== '1.3';
      var color  = isWeak ? '#e53e3e' : isHigh ? '#ed8936' : isMed ? '#ecc94b' : '#48bb78';
      return `<div title="${p.app||'?'}\nKey: ${p.keyLen||'—'}\nTLS: ${p.tls||'—'}\nCA: ${p.ca||'—'}"
        style="width:28px;height:28px;border-radius:4px;background:${color};cursor:pointer;transition:transform 0.15s;flex-shrink:0;"
        onmouseover="this.style.transform='scale(1.4)';this.style.zIndex='10';"
        onmouseout="this.style.transform='scale(1)';this.style.zIndex='1';">
      </div>`;
    }).join('');
  } else if (hm) {
    hm.innerHTML = '<div style="color:#aaa;font-size:13px;">No CBOM data for heatmap. Run a scan first.</div>';
  }

  /* Key length chart */
  var keyMap = {};
  perApp.forEach(p => { var k = p.keyLen||'Unknown'; keyMap[k]=(keyMap[k]||0)+1; });
  var keyColors = {'RSA-1024':'#e53e3e','1024-bit':'#e53e3e','RSA-2048':'#ed8936','2048-bit':'#ed8936','RSA-4096':'#48bb78','4096-bit':'#48bb78'};
  QSR.drawBars('chart-keylength', Object.entries(keyMap).map(([l,v])=>({ label:l, value:v, color:keyColors[l]||'#4299e1' })));

  /* TLS chart */
  var tlsMap = {};
  perApp.forEach(p=>{ var t=p.tls||'Unknown'; tlsMap[t]=(tlsMap[t]||0)+1; });
  var tlsColors={'1.0':'#e53e3e','1.1':'#ed8936','1.2':'#4299e1','1.3':'#48bb78'};
  QSR.drawBars('chart-tls', Object.entries(tlsMap).map(([l,v])=>({ label:'TLS '+l, value:v, color:tlsColors[l]||'#a0aec0' })));

  window._cbomData = { cbom, perApp };
  QSR._filterCBOM();
};

QSR._filterCBOM = function() {
  var q  = (document.getElementById('cbom-search')?.value || '').toLowerCase();
  var rf = document.getElementById('cbom-risk-filter')?.value || '';
  var tf = document.getElementById('cbom-tls-filter')?.value || '';
  var perApp = (window._cbomData?.perApp || []);

  var filtered = perApp.filter(p => {
    var matchQ  = !q || (p.app||'').toLowerCase().includes(q) || (p.cipher||'').toLowerCase().includes(q) || (p.ca||'').toLowerCase().includes(q);
    var isWeak  = p.keyLen === 'RSA-1024' || p.keyLen === '1024-bit' || p.tls === '1.0';
    var isMed   = p.tls === '1.2';
    var isHigh  = !isWeak && (p.keyLen?.includes('2048')) && p.tls !== '1.3';
    var risk    = isWeak ? 'Critical' : isHigh ? 'High' : isMed ? 'Medium' : 'Low';
    var matchR  = !rf || risk === rf;
    var matchT  = !tf || p.tls === tf;
    return matchQ && matchR && matchT;
  });

  var tbody = document.getElementById('cbom-tbody');
  var count = document.getElementById('cbom-count');
  if (count) count.textContent = filtered.length + ' of ' + perApp.length + ' entries';
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No CBOM data. Run a TLS scan first.</td></tr>'; return;
  }
  var riskBadge = (kl, tls) => {
    if (kl === 'RSA-1024' || kl === '1024-bit' || tls === '1.0') return `<span class="badge badge-danger">Critical</span>`;
    if (kl?.includes('2048') && tls !== '1.3') return `<span class="badge badge-warn">High</span>`;
    if (tls === '1.2') return `<span class="badge badge-warn">Medium</span>`;
    return `<span class="badge badge-ok">Low</span>`;
  };
  tbody.innerHTML = filtered.map(p => {
    var isCrit = p.keyLen === 'RSA-1024' || p.keyLen === '1024-bit' || p.tls === '1.0';
    return `<tr style="${isCrit ? 'background:rgba(229,62,62,0.04);border-left:3px solid #e53e3e;' : ''}">
      <td><strong>${p.app||'—'}</strong></td>
      <td><code style="color:${p.keyLen?.includes('1024')?'#e53e3e':'inherit'}">${p.keyLen||'—'}</code></td>
      <td style="font-size:11px;max-width:180px;word-break:break-all;">${p.cipher||'—'}</td>
      <td style="font-size:12px;">${p.ca||'—'}</td>
      <td><code style="color:${p.tls==='1.3'?'#48bb78':p.tls==='1.0'?'#e53e3e':'#ed8936'}">${p.tls||'—'}</code></td>
      <td>${riskBadge(p.keyLen, p.tls)}</td>
    </tr>`;
  }).join('');
};

QSR.exportCBOMCSV = function() {
  var perApp = window._cbomData?.perApp || [];
  var csv = ['Application,Key Length,Cipher Suite,CA,TLS Version,Risk'].concat(perApp.map(p => {
    var r = (p.keyLen?.includes('1024') || p.tls === '1.0') ? 'Critical' : p.tls === '1.2' ? 'Medium' : 'Low';
    return [p.app,p.keyLen,p.cipher,p.ca,p.tls,r].map(v=>`"${v||''}"`).join(',');
  })).join('\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download = 'pnb-cbom-'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
  if(window.showToast) showToast('CBOM CSV exported!','success');
};

/* ── CycloneDX 1.4 JSON Export (unchanged core logic) ── */
QSR.exportCBOM = function() {
  var { cbom, perApp } = window._cbomData || { cbom:{}, perApp:[] };
  var now = new Date().toISOString();
  var obj = {
    bomFormat:'CycloneDX', specVersion:'1.4', version:1,
    serialNumber:'urn:uuid:'+crypto.randomUUID(),
    metadata:{ timestamp:now, tools:[{vendor:'QSecure Radar',name:'CBOM Generator',version:'2.0'}],
      component:{type:'application',name:'Punjab National Bank — Internet Banking Infrastructure'} },
    components: perApp.map((p,i) => ({
      type:'cryptographic-asset', 'bom-ref':'crypto-'+(i+1), name:p.app||('Component-'+(i+1)),
      cryptoProperties:{ assetType:'certificate',
        algorithmProperties:{ primitive:'asymmetric-encryption', parameterSetIdentifier:p.keyLen||'RSA-2048' },
        certificateProperties:{ subjectName:p.app, issuerName:p.ca||'DigiCert Inc',
          signatureAlgorithm:p.cipher||'SHA256withRSA', certificateFormat:'X.509' } } })),
    vulnerabilities: perApp.filter(p => p.keyLen==='RSA-1024'||p.keyLen==='1024-bit'||p.tls==='1.0').map((p,i) => ({
      'bom-ref':'vuln-'+(i+1), id:'PQC-RISK-'+String(i+1).padStart(3,'0'),
      ratings:[{score:9.1,severity:'critical',method:'CVSSv3'}],
      description:`Quantum-vulnerable: ${p.keyLen} in ${p.app}`,
      recommendation:'Migrate to CRYSTALS-Kyber (ML-KEM) + CRYSTALS-Dilithium (ML-DSA)',
      affects:[{ref:p.app}]
    }))
  };
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));
  a.download = 'pnb-cbom-cyclonedx-'+new Date().toISOString().slice(0,10)+'.json'; a.click();
  URL.revokeObjectURL(a.href);
  if(window.showToast) showToast('CycloneDX 1.4 JSON exported!','success');
};
