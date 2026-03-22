/* ============================================================
   app.js - QSecure Radar SPA Router
   PSB Hackathon 2026 | Team REAL - KIIT
   All pages use QSR_DataLayer for live Supabase data.
   ============================================================ */

var ROUTES = {
  'home':            { title:'Dashboard',        init: initHome            },
  'asset-inventory': { title:'Asset Inventory',  init: initAssetInventory  },
  'asset-discovery': { title:'Asset Discovery',  init: function(){ var c=document.getElementById('main-content')||document.querySelector('.fade-in'); if(window.QSR&&window.QSR.pages&&window.QSR.pages.discovery) window.QSR.pages.discovery(document.getElementById('page-content')); } },
  'cbom':            { title:'CBOM',             init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.cbom) window.QSR.pages.cbom(document.getElementById('page-content')); } },
  'pqc-posture':     { title:'Posture of PQC',   init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.pqc) window.QSR.pages.pqc(document.getElementById('page-content')); } },
  'cyber-rating':    { title:'Cyber Rating',     init: function(){ if(window.initCyberRating) window.initCyberRating(); } },
  'reporting':       { title:'Reporting',        init: function(){ if(window.initReporting) window.initReporting(); } },
  'user-management': { title:'User Management',  init: function(){ if(window.initUserManagement) window.initUserManagement(); } },
  'audit-log':       { title:'Audit Log',        init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.auditlog) window.QSR.pages.auditlog(document.getElementById('page-content')); } },
  'scanner':         { title:'TLS Scanner',      init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.scanner) window.QSR.pages.scanner(document.getElementById('page-content')); } }
};

var PAGE_HTML = {
  'home':            pageHome,
  'asset-inventory': pageAssetInventory,
  'asset-discovery': function(){ return window._discoveryPage   ? window._discoveryPage()   : '<p>Loading...</p>'; },
  'cbom':            function(){ return window._cbomPage         ? window._cbomPage()         : '<p>Loading...</p>'; },
  'pqc-posture':     function(){ return window._pqcPage          ? window._pqcPage()          : '<p>Loading...</p>'; },
  'cyber-rating':    function(){ return window._cyberRatingPage  ? window._cyberRatingPage()  : '<p>Loading...</p>'; },
  'reporting':       function(){ return window._reportingPage    ? window._reportingPage()    : '<p>Loading...</p>'; },
  'user-management': function(){ return window._usersPage        ? window._usersPage()        : '<p>Loading...</p>'; },
  'audit-log':       function(){ return window._auditLogPage     ? window._auditLogPage()     : '<p>Loading...</p>'; },
  'scanner':         function(){ return '<div id="scanner-mount"></div>'; }
};

function navigateTo(page) {
  var route = ROUTES[page];
  if (!route) return;

  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });

  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = route.title;

  var content = document.getElementById('page-content');
  if (!content) return;

  var html = PAGE_HTML[page] ? PAGE_HTML[page]() : '<p>Page not found</p>';
  content.innerHTML = '<div class="fade-in">' + html + '</div>';

  if (route.init) {
    try { route.init(); }
    catch(e) { console.error('[Router] Error initializing', page, e); }
  }
}

window.navigateTo = navigateTo;

/* Track current page for resize re-render */
var _origNavigate = navigateTo;
navigateTo = function(page) {
  window._currentPage = page;
  _origNavigate(page);
};
window.navigateTo = navigateTo;

/* ======================================================
   HOME PAGE
   ====================================================== */
function pageHome() {
  var d = QSR;
  return '<div style="font-family:Rajdhani;font-size:20px;font-weight:700;color:#8b1a2f;margin-bottom:12px;">Security Overview - QSecure Radar</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-bottom:14px;">' +
    kpiCard('Assets Discovered',    d.summary.assetCount,          '#4299e1', 'Total internet-facing assets (FR4)') +
    kpiCard('Avg QR Score (0-100)', d.summary.avgRiskScore + '/100','#e53e3e', 'Average Quantum Risk Score (FR9)') +
    kpiCard('CBOM Vulnerabilities', d.summary.cbomVulns,           '#ed8936', 'Weak crypto components (FR8)') +
    kpiCard('PQC-Ready Assets',     d.summary.pqcReady + '%',      '#48bb78', 'Classified PQC-compliant (FR10)') +
    kpiCard('Expiring Certs',       d.summary.expiringCerts,       '#ecc94b', 'Within 30 days (FR7)') +
    kpiCard('Critical Tier-4',      d.summary.criticalCount,       '#c53030', 'Immediate action needed (FR10)') +
    '</div>' +

    '<div class="grid-2">' +
    '<div class="panel"><div class="panel-title">Recent Security Events (FR15)</div>' +
    '<div id="home-audit-feed">' +
    d.recentScans.map(function(s) {
      var dotClass = (s.icon === 'alert' || s.msg.toUpperCase().includes('VULN') || s.msg.toUpperCase().includes('FAIL')) ? 'critical' :
                     (s.msg.toUpperCase().includes('WARN') || s.msg.toUpperCase().includes('EXPIR')) ? 'warning' : 'info';
      return '<div class="alert-item"><div class="alert-dot ' + dotClass + '"></div>' +
        '<div><div style="font-size:13px;font-weight:600;color:#1a1a2e;">' + s.msg + '</div>' +
        '<div style="font-size:11px;color:#888;">' + s.time + '</div></div></div>';
    }).join('') +
    '<br><a style="font-size:13px;color:#8b1a2f;font-weight:600;cursor:pointer;" onclick="navigateTo(\'audit-log\')">View Full Audit Log (FR15) &rarr;</a>' +
    '</div></div>' +

    '<div class="panel"><div class="panel-title">Quantum Risk Distribution (FR9 - 0 to 100)</div>' +
    '<canvas id="chart-home-risk" data-h="160" style="width:100%;display:block;"></canvas>' +
    '<div style="margin-top:10px;">' +
    [['Critical (0-25)','#e53e3e',d.summary.criticalCount],['High (26-50)','#ed8936',3],['Moderate (51-75)','#ecc94b',2],['PQC-Ready (76-100)','#48bb78',3]].map(function(x){
      return '<div class="progress-bar-wrap"><div class="progress-label"><span style="color:'+x[1]+';font-weight:700;">'+x[0]+'</span><span>'+x[2]+' assets</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:'+Math.round(x[2]/10*100)+'%;background:'+x[1]+';"></div></div></div>';
    }).join('') + '</div></div>' +
    '</div>' +

    '<div class="grid-3">' +
    '<div class="panel"><div class="panel-title">PQC Compliance (FR10)</div>' +
    '<div style="text-align:center;"><canvas id="chart-home-pqc" data-h="130" style="width:100%;display:block;"></canvas></div>' +
    '<div style="font-size:12px;text-align:center;color:#4a4a6a;margin-top:4px;">CRYSTALS-Kyber migration target</div>' +
    '</div>' +

    '<div class="panel"><div class="panel-title">TLS Distribution (FR5)</div>' +
    '<canvas id="chart-home-tls" data-h="130" style="width:100%;display:block;"></canvas>' +
    '</div>' +

    '<div class="panel"><div class="panel-title">Quick Actions</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
    '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="navigateTo(\'asset-discovery\')">Run New Scan (FR13)</button>' +
    '<button class="btn btn-secondary" style="width:100%;justify-content:center;" onclick="navigateTo(\'cbom\')">Generate CBOM (FR8)</button>' +
    '<button class="btn btn-outline" style="width:100%;justify-content:center;" onclick="navigateTo(\'reporting\')">Create Report (FR14)</button>' +
    '<button class="btn btn-outline" style="width:100%;justify-content:center;" onclick="navigateTo(\'audit-log\')">Audit Log (FR15)</button>' +
    '</div></div>' +
    '</div>';
}

function kpiCard(label, value, color, desc) {
  return '<div style="background:rgba(255,255,255,0.88);border-radius:10px;padding:14px 16px;border-left:4px solid ' + color + ';box-shadow:0 2px 8px rgba(0,0,0,0.08);" title="' + desc + '">' +
    '<div style="font-size:11px;color:#4a4a6a;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">' + label + '</div>' +
    '<div style="font-family:Rajdhani;font-size:30px;font-weight:700;color:' + color + ';line-height:1.1;margin:4px 0;">' + value + '</div>' +
    '<div style="font-size:11px;color:#aaa;">' + desc + '</div>' +
    '</div>';
}

function initHome() {
  /* Draw charts with static defaults first — will be updated with live data */
  QSR.drawBars('chart-home-risk', [
    {label:'0-25 Critical',value:QSR.summary.criticalCount,color:'#e53e3e'},
    {label:'26-50 High',   value:3, color:'#ed8936'},
    {label:'51-75 Mod',    value:2, color:'#ecc94b'},
    {label:'76-100 PQC',  value:3, color:'#48bb78'}
  ]);
  QSR.drawDonut('chart-home-pqc', [
    {label:'PQC-Ready', value:QSR.summary.pqcReady,       color:'#48bb78'},
    {label:'At Risk',   value:100-QSR.summary.pqcReady,   color:'#e53e3e'}
  ], QSR.summary.pqcReady + '%', 'Ready');
  QSR.drawBars('chart-home-tls', [
    {label:'TLS 1.3',value:6,color:'#48bb78'},{label:'TLS 1.2',value:3,color:'#ecc94b'},
    {label:'TLS 1.1',value:1,color:'#ed8936'},{label:'TLS 1.0',value:2,color:'#e53e3e'}
  ]);

  if (!window.QSR_DataLayer) return;
  var DL = window.QSR_DataLayer;

  /* ── Live audit feed ───────────────────────────────────────── */
  DL.fetchAuditLog(8).then(function(rows) {
    if (!rows || !rows.length) return;
    var feed = document.getElementById('home-audit-feed');
    if (!feed) return;
    feed.innerHTML = rows.map(function(s) {
      var dot = (s.msg||'').toUpperCase().match(/VULN|FAIL|WEAK|POLICY/) ? 'critical' :
                (s.msg||'').toUpperCase().match(/WARN|EXPIR/) ? 'warning' : 'info';
      return '<div class="alert-item"><div class="alert-dot ' + dot + '"></div>' +
        '<div><div style="font-size:13px;font-weight:600;color:#1a1a2e;">' + (s.msg||'—') + '</div>' +
        '<div style="font-size:11px;color:#888;">' + (s.time||'—') + '</div></div></div>';
    }).join('') +
      '<br><a style="font-size:13px;color:#8b1a2f;font-weight:600;cursor:pointer;" onclick="navigateTo(\'audit-log\')">View Full Audit Log &rarr;</a>';
  });

  /* ── Live KPI cards ─────────────────────────────────────────── */
  Promise.all([
    DL.fetchAssets(),
    DL.fetchCyberRating(),
    DL.fetchPQCScores(),
    DL.fetchCBOM()
  ]).then(function(results) {
    var assets  = results[0] || [];
    var rating  = results[1] || {};
    var pqc     = results[2] || {};
    var cbom    = results[3] || {};

    /* Helper to set KPI card value */
    function setKPI(idx, val) {
      var cards = document.querySelectorAll('[title]');
      /* Find KPI cards by title attr (from kpiCard desc param) */
      var kpiWrappers = document.querySelectorAll('.fade-in > div:first-child > div');
      if (!kpiWrappers.length) return;
      var card = kpiWrappers[idx];
      if (card) {
        var valEl = card.querySelector('div:nth-child(2)');
        if (valEl) valEl.textContent = val;
      }
    }

    var assetCount    = assets.length || QSR.summary.assetCount;
    var avgQR         = rating.enterpriseScore || QSR.summary.avgRiskScore;
    var cbomVulns     = cbom.weakCrypto   || QSR.summary.cbomVulns;
    var pqcReadyPct   = pqc.elitePct !== undefined ? pqc.elitePct : QSR.summary.pqcReady;
    var expiringCerts = assets.filter(function(a){ return a.cert === 'Expiring' || a.cert === 'Expired'; }).length || QSR.summary.expiringCerts;
    var criticalCount = (pqc.criticalApps !== undefined ? pqc.criticalApps : QSR.summary.criticalCount);

    /* Re-render the entire KPI row with fresh live data */
    var kpiRow = document.querySelector('.fade-in > div:first-child');
    if (kpiRow && kpiRow.style && kpiRow.style.display === 'grid') {
      kpiRow.innerHTML =
        kpiCard('Assets Discovered',    assetCount,             '#4299e1', 'Total internet-facing assets (FR4)') +
        kpiCard('Avg QR Score (0-100)', avgQR + '/100',         '#e53e3e', 'Average Quantum Risk Score (FR9)') +
        kpiCard('CBOM Vulnerabilities', cbomVulns,              '#ed8936', 'Weak crypto components (FR8)') +
        kpiCard('PQC-Ready Assets',     pqcReadyPct + '%',      '#48bb78', 'Classified PQC-compliant (FR10)') +
        kpiCard('Expiring Certs',       expiringCerts,          '#ecc94b', 'Within 30 days (FR7)') +
        kpiCard('Critical Tier-4',      criticalCount,          '#c53030', 'Immediate action needed (FR10)');
    }

    /* Update PQC donut chart with live data */
    QSR.drawDonut('chart-home-pqc', [
      {label:'PQC-Ready', value: pqcReadyPct,     color:'#48bb78'},
      {label:'At Risk',   value: 100-pqcReadyPct, color:'#e53e3e'}
    ], pqcReadyPct + '%', 'Ready');

    /* Update risk bar chart with live breakdown */
    if (pqc.criticalPct !== undefined) {
      QSR.drawBars('chart-home-risk', [
        {label:'0-25 Critical', value: pqc.criticalPct || criticalCount, color:'#e53e3e'},
        {label:'26-50 High',    value: pqc.legacyPct   || 3,             color:'#ed8936'},
        {label:'51-75 Mod',     value: pqc.standardPct || 2,             color:'#ecc94b'},
        {label:'76-100 PQC',    value: pqc.elitePct    || 3,             color:'#48bb78'}
      ]);
    }
  }).catch(function(e) {
    console.warn('[Home] Live KPI fetch error:', e.message);
  });
}

/* ======================================================
   ASSET INVENTORY PAGE
   ====================================================== */
function pageAssetInventory() {
  return '<div class="kpi-strip">' +
    '<div class="kpi-tile"><div class="kpi-label">Total Assets</div><div class="kpi-value" id="kpi-total">—</div><div class="kpi-icon">&#128736;</div></div>' +
    '<div class="kpi-tile"><div class="kpi-label">Web Apps</div><div class="kpi-value" id="kpi-webapps">—</div><div class="kpi-icon">&#127760;</div></div>' +
    '<div class="kpi-tile"><div class="kpi-label">APIs</div><div class="kpi-value" id="kpi-apis">—</div><div class="kpi-icon">&#128268;</div></div>' +
    '<div class="kpi-tile"><div class="kpi-label">Servers</div><div class="kpi-value" id="kpi-servers">—</div><div class="kpi-icon">&#128421;</div></div>' +
    '<div class="kpi-tile warning"><div class="kpi-label">Expiring Certs</div><div class="kpi-value" id="kpi-expiring">—</div><div class="kpi-icon">&#9888;</div></div>' +
    '<div class="kpi-tile danger"><div class="kpi-label">High-Risk</div><div class="kpi-value" id="kpi-highrisk">—</div><div class="kpi-icon">&#128681;</div></div>' +
    '</div>' +

    '<div class="grid-2" style="margin-bottom:12px;">' +
    '<div class="panel"><div class="panel-title">Asset Type Distribution</div>' +
    '<div style="display:flex;align-items:center;gap:14px;">' +
    '<canvas id="chart-inv-types" data-h="130" style="width:100%;display:block;"></canvas>' +
    '<div style="flex:1;">' +
    [['Web Apps','#4299e1'],['APIs','#48bb78'],['Servers','#ed8936'],['VPN/Other','#e53e3e'],['Internal','#ecc94b']].map(function(x){
      return '<div class="stat-row"><span class="stat-key" style="color:'+x[1]+';font-weight:700;">'+x[0]+'</span><span class="stat-val" id="inv-count-'+x[0].replace(/[^a-z]/gi,'').toLowerCase()+'">—</span></div>';
    }).join('') +
    '</div></div></div>' +

    '<div class="panel"><div class="panel-title">Risk Distribution (QR Score 0-100, FR9)</div>' +
    '<canvas id="chart-inv-risk" data-h="140" style="width:100%;display:block;"></canvas></div></div>' +

    '<div class="panel"><div class="panel-title">Asset Inventory with Cryptographic Details (FR6, FR7)</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
    '<div class="search-wrap" style="flex:1;min-width:200px;margin:0;"><span class="search-icon">&#128269;</span><input class="search-input" id="inv-search" placeholder="Search name, URL, IP..." oninput="filterInventory()"></div>' +
    '<select id="inv-risk-filter" class="form-select" style="width:140px;" onchange="filterInventory()"><option value="">All Risks</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>' +
    '<select id="inv-cert-filter" class="form-select" style="width:140px;" onchange="filterInventory()"><option value="">All Certs</option><option>Valid</option><option>Expiring</option><option>Expired</option></select>' +
    '</div>' +
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Asset Name</th><th>URL</th><th>IPv4</th><th>Type</th><th>Owner</th><th>Key Size</th><th>Cert</th><th>QR Score</th><th>Risk</th><th>Last Scan</th></tr></thead>' +
    '<tbody id="inv-tbody"><tr><td colspan="10" style="text-align:center;padding:24px;color:#aaa;">Loading assets...</td></tr></tbody>' +
    '</table></div></div>';
}

var _allInventory = [];

function initAssetInventory() {
  QSR.drawDonut('chart-inv-types', [
    {label:'Web Apps',value:42,color:'#4299e1'},{label:'APIs',value:26,color:'#48bb78'},
    {label:'Servers',value:37,color:'#ed8936'},{label:'VPN',value:7,color:'#e53e3e'},{label:'Internal',value:16,color:'#ecc94b'}
  ], '128', 'Assets');
  QSR.drawBars('chart-inv-risk', [
    {label:'Critical',value:14,color:'#e53e3e'},{label:'High',value:28,color:'#ed8936'},
    {label:'Medium',value:52,color:'#ecc94b'},{label:'Low',value:34,color:'#48bb78'}
  ]);

  var dataSource = window.QSR_DataLayer ? window.QSR_DataLayer.fetchAssets() : Promise.resolve(QSR.assets || []);
  dataSource.then(function(assets) {
    _allInventory = assets;
    var setEl = function(id, v){ var el = document.getElementById(id); if(el) el.textContent = v; };
    setEl('kpi-total',    assets.length);
    setEl('kpi-webapps',  assets.filter(function(a){ return a.type === 'Web App'; }).length);
    setEl('kpi-apis',     assets.filter(function(a){ return a.type === 'API Gateway'; }).length);
    setEl('kpi-servers',  assets.filter(function(a){ return a.type && a.type.includes('Server'); }).length);
    setEl('kpi-expiring', assets.filter(function(a){ return a.cert === 'Expiring' || a.cert === 'Expired'; }).length);
    setEl('kpi-highrisk', assets.filter(function(a){ return a.risk === 'Critical' || a.risk === 'High'; }).length);
    renderInventoryTable(assets);
  });
}

function renderInventoryTable(assets) {
  var tbody = document.getElementById('inv-tbody');
  if (!tbody) return;
  if (!assets || !assets.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:#aaa;">No assets found.</td></tr>';
    return;
  }
  var riskCls = {Critical:'badge-critical',High:'badge-high',Medium:'badge-medium',Low:'badge-low'};
  var certCls = {Valid:'badge-valid',Expiring:'badge-expiring',Expired:'badge-expired'};
  tbody.innerHTML = assets.map(function(a) {
    var score = a.qrScore !== undefined ? a.qrScore : (a.risk === 'Critical' ? 15 : a.risk === 'High' ? 35 : a.risk === 'Medium' ? 55 : 80);
    var scoreColor = score >= 76 ? '#48bb78' : score >= 51 ? '#ecc94b' : score >= 26 ? '#ed8936' : '#e53e3e';
    var keyLen = a.key || 2048;
    var weakKey = keyLen < 2048;
    return '<tr>' +
      '<td style="font-weight:600;">' + (a.name || '—') + '</td>' +
      '<td><a href="' + (a.url||'#') + '" target="_blank" style="font-size:12px;">' + (a.url||'—') + '</a></td>' +
      '<td style="font-family:monospace;font-size:12px;">' + (a.ipv4||'—') + '</td>' +
      '<td style="font-size:12px;">' + (a.type||'—') + '</td>' +
      '<td style="font-size:12px;">' + (a.owner||'—') + '</td>' +
      '<td style="font-weight:700;color:' + (weakKey?'#e53e3e':'#48bb78') + ';">' + keyLen + '-bit' + (weakKey?' &#9888;':'') + '</td>' +
      '<td><span class="badge ' + (certCls[a.cert]||'badge-valid') + '">' + (a.cert||'Valid') + '</span></td>' +
      '<td><span style="font-family:Rajdhani;font-size:18px;font-weight:700;color:' + scoreColor + ';">' + score + '</span><span style="font-size:10px;color:#aaa;">/100</span></td>' +
      '<td><span class="badge ' + (riskCls[a.risk]||'badge-low') + '">' + (a.risk||'Low') + '</span></td>' +
      '<td style="font-size:11px;color:#888;">' + (a.lastScan||'Never') + '</td>' +
      '</tr>';
  }).join('');
}

window.filterInventory = function() {
  var q = (document.getElementById('inv-search')?.value||'').toLowerCase();
  var r = document.getElementById('inv-risk-filter')?.value||'';
  var c = document.getElementById('inv-cert-filter')?.value||'';
  renderInventoryTable(_allInventory.filter(function(a) {
    return (!q || ((a.name||'')+(a.url||'')+(a.ipv4||'')).toLowerCase().includes(q)) &&
           (!r || a.risk === r) && (!c || a.cert === c);
  }));
};



