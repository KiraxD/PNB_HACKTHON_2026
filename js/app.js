/* ============================================================
   app.js - QSecure Radar SPA Router
   PSB Hackathon 2026 | Team REAL - KIIT
   All pages use QSR_DataLayer for live Supabase data.
   ============================================================ */

var ROUTES = {
  'home':            { title:'Dashboard',        init: initHome            },
  'asset-inventory': { title:'Asset Inventory',  init: initAssetInventory  },
  'asset-discovery': { title:'Unified Scanner', init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.unifiedScanner) window.QSR.pages.unifiedScanner(document.getElementById('page-content')); } },
  'cbom':            { title:'CBOM',             init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.cbom) window.QSR.pages.cbom(document.getElementById('page-content')); } },
  'pqc-posture':     { title:'Posture of PQC',   init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.pqc) window.QSR.pages.pqc(document.getElementById('page-content')); } },
  'cyber-rating':    { title:'Cyber Rating',     init: function(){ if(window.initCyberRating) window.initCyberRating(); } },
  'reporting':       { title:'Reporting',        init: function(){ if(window.initReporting) window.initReporting(); } },
  'user-management': { title:'User Management',  init: function(){ if(window.initUserManagement) window.initUserManagement(); } },
  'audit-log':       { title:'Audit Log',        init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.auditlog) window.QSR.pages.auditlog(document.getElementById('page-content')); } },
  'scanner':         { title:'Security & TLS Scanner', init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.unifiedScanner) window.QSR.pages.unifiedScanner(document.getElementById('page-content')); } },
  'zero-trust':      { title:'Zero Trust',       init: function(){ if(window.QSR&&window.QSR.pages&&window.QSR.pages.zerotrust) window.QSR.pages.zerotrust(document.getElementById('page-content')); } }
};

var PAGE_HTML = {
  'home':            pageHome,
  'asset-inventory': pageAssetInventory,
  'asset-discovery': function(){ return '<div id="page-content"></div>'; },
  'cbom':            function(){ return window._cbomPage         ? window._cbomPage()         : '<p>Loading...</p>'; },
  'pqc-posture':     function(){ return window._pqcPage          ? window._pqcPage()          : '<p>Loading...</p>'; },
  'cyber-rating':    function(){ return window._cyberRatingPage  ? window._cyberRatingPage()  : '<p>Loading...</p>'; },
  'reporting':       function(){ return window._reportingPage    ? window._reportingPage()    : '<p>Loading...</p>'; },
  'user-management': function(){ return window._usersPage        ? window._usersPage()        : '<p>Loading...</p>'; },
  'audit-log':       function(){ return window._auditLogPage     ? window._auditLogPage()     : '<p>Loading...</p>'; },
  'scanner':         function(){ return '<div id="page-content"></div>'; },
  'zero-trust':      function(){ return '<div id="zt-page-mount"></div>'; }
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
  /* Zero Trust: track every page visit */
  if (window.ZeroTrust) window.ZeroTrust.trackPage(page);
  _origNavigate(page);
};
window.navigateTo = navigateTo;

/* ── Sync refresh registry ────────────────────────────────────────────
   Each page registers a lightweight "data-only" refresh function so
   data can be updated without re-building the entire DOM.
   When a scan completes the active tab re-fetches; all others get a
   green pulse badge on the sidebar nav item.
──────────────────────────────────────────────────────────────────── */
var _syncRefreshFns = {};

function registerPageRefresh(page, fn) {
  _syncRefreshFns[page] = fn;
}

function _pulseNavBadge(page) {
  var navItem = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (!navItem) return;
  if (navItem.querySelector('.sync-badge')) return; /* already pulsing */
  var badge = document.createElement('span');
  badge.className = 'sync-badge';
  badge.title = 'New scan data available';
  navItem.style.position = 'relative';
  navItem.appendChild(badge);
}

function _clearNavBadge(page) {
  var navItem = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (!navItem) return;
  var badge = navItem.querySelector('.sync-badge');
  if (badge) badge.remove();
}

window.addEventListener('qsr:data-sync', function(e) {
  var active = window._currentPage;
  var affected = ['home', 'asset-inventory', 'cbom', 'pqc-posture', 'cyber-rating', 'audit-log'];
  affected.forEach(function(page) {
    if (page === active) {
      /* Active tab: quietly re-fetch and patch the DOM */
      var fn = _syncRefreshFns[page];
      if (fn) {
        try { fn(e && e.detail); } catch(err) {}
      }
    } else {
      /* Inactive tab: mark it as having fresh data */
      _pulseNavBadge(page);
    }
  });
});

/* Wrap navigateTo to clear badges when the user lands on a page */
var _origNavigate2 = navigateTo;
navigateTo = function(page) {
  _clearNavBadge(page);
  _origNavigate2(page);
};
window.navigateTo = navigateTo;

/* ======================================================
   HOME PAGE
   ====================================================== */
function pageHome() {
  return '<div id="home-kpi-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px;">' +
    kpiCard('Assets Discovered',    '—', '#4299e1', 'Total internet-facing assets (FR4)',    'home-kpi-assets') +
    kpiCard('PNB Domains',          '—', '#8b1a2f', 'PNB-owned scanned assets',             'home-kpi-pnb') +
    kpiCard('3rd-Party Domains',    '—', '#4299e1', 'External/vendor domains scanned',       'home-kpi-third') +
    kpiCard('Avg QR Score',         '—', '#e53e3e', 'Average Quantum Risk Score (FR9)',      'home-kpi-score') +
    kpiCard('PQC-Ready',            '—', '#48bb78', 'Classified PQC-compliant (FR10)',       'home-kpi-pqc') +
    kpiCard('Critical Assets',      '—', '#c53030', 'QR Score ≤ 25 — immediate action',     'home-kpi-critical') +
    '</div>' +

    '<div class="grid-2">' +
    /* Left: audit feed */
    '<div class="panel"><div class="panel-title">Recent Security Events (FR15)</div>' +
    '<div id="home-audit-feed"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>' +
    '<br><a style="font-size:13px;color:#8b1a2f;font-weight:600;cursor:pointer;" onclick="navigateTo(\'audit-log\')">View Full Audit Log &rarr;</a>' +
    '</div>' +
    /* Right: risk distribution */
    '<div class="panel"><div class="panel-title">Quantum Risk Distribution (FR9)</div>' +
    '<canvas id="chart-home-risk" data-h="150" style="width:100%;display:block;"></canvas>' +
    '<div id="home-risk-bars" style="margin-top:10px;">' +
    '<div class="progress-bar-wrap"><div class="progress-label"><span style="color:#e53e3e;font-weight:700;">Critical (0-25)</span><span id="home-pb-critical">— assets</span></div><div class="progress-bar"><div id="home-pf-critical" class="progress-fill" style="width:0%;background:#e53e3e;"></div></div></div>' +
    '<div class="progress-bar-wrap"><div class="progress-label"><span style="color:#ed8936;font-weight:700;">High (26-50)</span><span id="home-pb-high">— assets</span></div><div class="progress-bar"><div id="home-pf-high" class="progress-fill" style="width:0%;background:#ed8936;"></div></div></div>' +
    '<div class="progress-bar-wrap"><div class="progress-label"><span style="color:#ecc94b;font-weight:700;">Moderate (51-75)</span><span id="home-pb-moderate">— assets</span></div><div class="progress-bar"><div id="home-pf-moderate" class="progress-fill" style="width:0%;background:#ecc94b;"></div></div></div>' +
    '<div class="progress-bar-wrap"><div class="progress-label"><span style="color:#48bb78;font-weight:700;">PQC-Ready (76-100)</span><span id="home-pb-ready">— assets</span></div><div class="progress-bar"><div id="home-pf-ready" class="progress-fill" style="width:0%;background:#48bb78;"></div></div></div>' +
    '</div></div>' +
    '</div>' +

    '<div class="grid-3">' +
    /* PQC compliance donut */
    '<div class="panel"><div class="panel-title">PQC Compliance (FR10)</div>' +
    '<div style="text-align:center;"><canvas id="chart-home-pqc" data-h="130" style="width:100%;display:block;"></canvas></div>' +
    '<div style="font-size:12px;text-align:center;color:#4a4a6a;margin-top:4px;">ML-KEM / CRYSTALS-Kyber target</div>' +
    '</div>' +
    /* TLS distribution */
    '<div class="panel"><div class="panel-title">TLS Version Distribution (FR5)</div>' +
    '<canvas id="chart-home-tls" data-h="130" style="width:100%;display:block;"></canvas>' +
    '</div>' +
    /* PNB vs 3rd-Party domain split */
    '<div class="panel"><div class="panel-title">Domain Portfolio</div>' +
    '<div style="text-align:center;"><canvas id="chart-home-domains" data-h="110" style="width:100%;display:block;"></canvas></div>' +
    '<div id="home-domain-split" style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;"><span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#8b1a2f;"><span style="width:10px;height:10px;border-radius:50%;background:#8b1a2f;display:inline-block;"></span>PNB Domains</span><span id="home-split-pnb" style="font-family:Rajdhani;font-size:18px;font-weight:700;color:#8b1a2f;">—</span></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;"><span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#4299e1;"><span style="width:10px;height:10px;border-radius:50%;background:#4299e1;display:inline-block;"></span>3rd-Party</span><span id="home-split-third" style="font-family:Rajdhani;font-size:18px;font-weight:700;color:#4299e1;">—</span></div>' +
    '<div style="margin-top:4px;"><button class="dbs-btn" style="width:100%;text-align:center;border:1px solid rgba(139,26,47,0.2);border-radius:7px;padding:6px 10px;font-size:11px;" onclick="navigateTo(\'asset-inventory\')">View Asset Inventory &rarr;</button></div>' +
    '</div></div>' +
    '</div>';
}


function kpiCard(label, value, color, desc, id) {
  return '<div style="background:rgba(255,255,255,0.88);border-radius:10px;padding:14px 16px;border-left:4px solid ' + color + ';box-shadow:0 2px 8px rgba(0,0,0,0.08);" title="' + desc + '">' +
    '<div style="font-size:11px;color:#4a4a6a;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">' + label + '</div>' +
    '<div ' + (id ? 'id="' + id + '"' : '') + ' style="font-family:Rajdhani;font-size:30px;font-weight:700;color:' + color + ';line-height:1.1;margin:4px 0;">' + value + '</div>' +
    '<div style="font-size:11px;color:#aaa;">' + desc + '</div>' +
    '</div>';
}

/* Lightweight data-only refresh for the Home dashboard.
   Called directly by the sync event when the home page is active. */
function refreshHomeData() {
  if (!window.QSR_DataLayer) return;
  var DL = window.QSR_DataLayer;
  var setEl = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };

  /* Refresh audit feed */
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

  Promise.all([
    DL.fetchAssets(),
    DL.fetchCyberRating(),
    DL.fetchPQCScores(),
    DL.fetchCBOM()
  ]).then(function(results) {
    var assets = results[0] || [];
    var rating = results[1] || {};
    var pqc    = results[2] || {};
    var total  = assets.length || 1;
    var pnbAssets   = assets.filter(function(a) { return isPNBDomain(a.url || a.name); });
    var thirdAssets = assets.filter(function(a) { return !isPNBDomain(a.url || a.name); });
    var riskC  = assets.filter(function(a){ return (a.qrScore||0) <= 25; }).length;
    var riskH  = assets.filter(function(a){ var s=a.qrScore||0; return s>=26&&s<=50; }).length;
    var riskM  = assets.filter(function(a){ var s=a.qrScore||0; return s>=51&&s<=75; }).length;
    var riskR  = assets.filter(function(a){ return (a.qrScore||0) >= 76; }).length;
    var tls13  = assets.filter(function(a){ return (a.tls||'').includes('1.3'); }).length;
    var tls12  = assets.filter(function(a){ return (a.tls||'').includes('1.2'); }).length;
    var tls11  = assets.filter(function(a){ return (a.tls||'').includes('1.1'); }).length;
    var tls10  = assets.filter(function(a){ return (a.tls||'').includes('1.0'); }).length;
    var avgQR  = Number(rating.enterpriseScore) || 0;
    var pqcReadyPct = pqc.elitePct !== undefined ? pqc.elitePct : 0;
    var critCount   = pqc.criticalApps !== undefined ? pqc.criticalApps : riskC;

    setEl('home-kpi-assets',   assets.length);
    setEl('home-kpi-pnb',      pnbAssets.length);
    setEl('home-kpi-third',    thirdAssets.length);
    setEl('home-kpi-score',    avgQR + '/100');
    setEl('home-kpi-pqc',      pqcReadyPct + '%');
    setEl('home-kpi-critical', critCount);

    var maxRisk = Math.max(riskC, riskH, riskM, riskR, 1);
    function setPB(id, pfId, count) {
      setEl(id, count + ' assets');
      var pf = document.getElementById(pfId);
      if (pf) { pf.style.transition = 'width 0.7s ease'; pf.style.width = Math.round(count / maxRisk * 100) + '%'; }
    }
    setPB('home-pb-critical', 'home-pf-critical', riskC);
    setPB('home-pb-high',     'home-pf-high',     riskH);
    setPB('home-pb-moderate', 'home-pf-moderate', riskM);
    setPB('home-pb-ready',    'home-pf-ready',    riskR);

    QSR.drawBars('chart-home-risk', [
      {label:'0-25 Critical', value:riskC, color:'#e53e3e'},
      {label:'26-50 High',    value:riskH, color:'#ed8936'},
      {label:'51-75 Mod',     value:riskM, color:'#ecc94b'},
      {label:'76-100 PQC',   value:riskR, color:'#48bb78'}
    ]);
    QSR.drawDonut('chart-home-pqc', [
      {label:'PQC-Ready', value: assets.filter(function(a){ return a.pqcBucket==='Elite-PQC'; }).length, color:'#48bb78'},
      {label:'At Risk',   value: assets.filter(function(a){ return a.pqcBucket!=='Elite-PQC'; }).length, color:'#e53e3e'}
    ], pqcReadyPct + '%', 'Ready');
    QSR.drawBars('chart-home-tls', [
      {label:'TLS 1.3', value:tls13, color:'#48bb78'},
      {label:'TLS 1.2', value:tls12, color:'#ecc94b'},
      {label:'TLS 1.1', value:tls11, color:'#ed8936'},
      {label:'TLS 1.0', value:tls10, color:'#e53e3e'}
    ]);
    QSR.drawDonut('chart-home-domains', [
      {label:'PNB',       value:pnbAssets.length,   color:'#8b1a2f'},
      {label:'3rd-Party', value:thirdAssets.length, color:'#4299e1'}
    ], assets.length + '', 'Domains');
    setEl('home-split-pnb',   pnbAssets.length);
    setEl('home-split-third', thirdAssets.length);
  });
}

function initHome() {
  /* Draw zero-state charts first for instant render */
  QSR.drawBars('chart-home-risk', [
    {label:'0-25',value:0,color:'#e53e3e'},
    {label:'26-50',value:0,color:'#ed8936'},
    {label:'51-75',value:0,color:'#ecc94b'},
    {label:'76-100',value:0,color:'#48bb78'}
  ]);
  QSR.drawDonut('chart-home-pqc', [
    {label:'PQC-Ready',value:0,color:'#48bb78'},
    {label:'At Risk',  value:0,color:'#e53e3e'}
  ], '0%', 'Ready');
  QSR.drawBars('chart-home-tls', [
    {label:'TLS 1.3',value:0,color:'#48bb78'},
    {label:'TLS 1.2',value:0,color:'#ecc94b'},
    {label:'TLS 1.1',value:0,color:'#ed8936'},
    {label:'TLS 1.0',value:0,color:'#e53e3e'}
  ]);
  QSR.drawDonut('chart-home-domains', [
    {label:'PNB',      value:0, color:'#8b1a2f'},
    {label:'3rd-Party',value:0, color:'#4299e1'}
  ], '0', 'Domains');

  if (!window.QSR_DataLayer) return;
  var DL = window.QSR_DataLayer;
  var setEl = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };

  /* ── Live audit feed ── */
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

  /* ── Live KPIs + all charts ── */
  Promise.all([
    DL.fetchAssets(),
    DL.fetchCyberRating(),
    DL.fetchPQCScores(),
    DL.fetchCBOM()
  ]).then(function(results) {
    var assets = results[0] || [];
    var rating = results[1] || {};
    var pqc    = results[2] || {};
    var cbom   = results[3] || {};

    /* Domain split */
    var pnbAssets   = assets.filter(function(a) { return isPNBDomain(a.url || a.name); });
    var thirdAssets = assets.filter(function(a) { return !isPNBDomain(a.url || a.name); });

    /* Risk buckets */
    var total    = assets.length || 1;
    var riskC    = assets.filter(function(a){ return (a.qrScore||0) <= 25; }).length;
    var riskH    = assets.filter(function(a){ var s=a.qrScore||0; return s>=26&&s<=50; }).length;
    var riskM    = assets.filter(function(a){ var s=a.qrScore||0; return s>=51&&s<=75; }).length;
    var riskR    = assets.filter(function(a){ return (a.qrScore||0) >= 76; }).length;

    /* TLS distribution from stored assets */
    var tls13 = assets.filter(function(a){ return (a.tls||'').includes('1.3'); }).length;
    var tls12 = assets.filter(function(a){ return (a.tls||'').includes('1.2'); }).length;
    var tls11 = assets.filter(function(a){ return (a.tls||'').includes('1.1'); }).length;
    var tls10 = assets.filter(function(a){ return (a.tls||'').includes('1.0'); }).length;

    var avgQR       = Number(rating.enterpriseScore) || 0;
    var cbomVulns   = Number(cbom.weakCrypto) || 0;
    var pqcReadyPct = pqc.elitePct !== undefined ? pqc.elitePct : 0;
    var critCount   = pqc.criticalApps !== undefined ? pqc.criticalApps : riskC;
    var expiring    = assets.filter(function(a){ return a.cert === 'Expiring' || a.cert === 'Expired'; }).length;

    /* ── KPI tiles ── */
    setEl('home-kpi-assets',   assets.length);
    setEl('home-kpi-pnb',      pnbAssets.length);
    setEl('home-kpi-third',    thirdAssets.length);
    setEl('home-kpi-score',    avgQR + '/100');
    setEl('home-kpi-pqc',      pqcReadyPct + '%');
    setEl('home-kpi-critical', critCount);

    /* ── Progress bars: animated widths ── */
    var maxRisk = Math.max(riskC, riskH, riskM, riskR, 1);
    function setPB(id, pfId, count) {
      setEl(id, count + ' assets');
      var pf = document.getElementById(pfId);
      if (pf) { pf.style.transition = 'width 0.7s ease'; pf.style.width = Math.round(count / maxRisk * 100) + '%'; }
    }
    setPB('home-pb-critical', 'home-pf-critical', riskC);
    setPB('home-pb-high',     'home-pf-high',     riskH);
    setPB('home-pb-moderate', 'home-pf-moderate', riskM);
    setPB('home-pb-ready',    'home-pf-ready',    riskR);

    /* ── Charts ── */
    QSR.drawBars('chart-home-risk', [
      {label:'0-25 Critical', value:riskC, color:'#e53e3e'},
      {label:'26-50 High',    value:riskH, color:'#ed8936'},
      {label:'51-75 Mod',     value:riskM, color:'#ecc94b'},
      {label:'76-100 PQC',   value:riskR, color:'#48bb78'}
    ]);
    QSR.drawDonut('chart-home-pqc', [
      {label:'PQC-Ready', value: assets.filter(function(a){ return a.pqcBucket==='Elite-PQC'; }).length, color:'#48bb78'},
      {label:'At Risk',   value: assets.filter(function(a){ return a.pqcBucket!=='Elite-PQC'; }).length, color:'#e53e3e'}
    ], pqcReadyPct + '%', 'Ready');
    QSR.drawBars('chart-home-tls', [
      {label:'TLS 1.3', value:tls13, color:'#48bb78'},
      {label:'TLS 1.2', value:tls12, color:'#ecc94b'},
      {label:'TLS 1.1', value:tls11, color:'#ed8936'},
      {label:'TLS 1.0', value:tls10, color:'#e53e3e'}
    ]);
    QSR.drawDonut('chart-home-domains', [
      {label:'PNB',       value:pnbAssets.length,   color:'#8b1a2f'},
      {label:'3rd-Party', value:thirdAssets.length, color:'#4299e1'}
    ], assets.length + '', 'Domains');

    /* ── Domain split counters ── */
    setEl('home-split-pnb',   pnbAssets.length);
    setEl('home-split-third', thirdAssets.length);

  }).catch(function(e) {
    console.warn('[Home] Live data fetch error:', e.message);
  });

  /* Register this page's live refresh fn for qsr:data-sync */
  registerPageRefresh('home', refreshHomeData);
}


/* ======================================================
   ASSET INVENTORY PAGE
   ====================================================== */
function pageAssetInventory() {
  return '<div class="kpi-strip">' +
    '<div class="kpi-tile"><div class="kpi-label">Total Assets</div><div class="kpi-value" id="kpi-total">—</div><div class="kpi-icon">&#128736;</div></div>' +
    '<div class="kpi-tile"><div class="kpi-label">PNB Domains</div><div class="kpi-value" id="kpi-pnb-count" style="color:#8b1a2f;">—</div><div class="kpi-icon">&#127981;</div></div>' +
    '<div class="kpi-tile"><div class="kpi-label">3rd-Party</div><div class="kpi-value" id="kpi-3p-count" style="color:#4299e1;">—</div><div class="kpi-icon">&#127760;</div></div>' +
    '<div class="kpi-tile warning"><div class="kpi-label">Expiring Certs</div><div class="kpi-value" id="kpi-expiring">—</div><div class="kpi-icon">&#9888;</div></div>' +
    '<div class="kpi-tile danger"><div class="kpi-label">High-Risk</div><div class="kpi-value" id="kpi-highrisk">—</div><div class="kpi-icon">&#128681;</div></div>' +
    '</div>' +

    '<div class="grid-2" style="margin-bottom:12px;">' +
    '<div class="panel"><div class="panel-title">Asset Type Distribution</div>' +
    '<div style="display:flex;align-items:center;gap:12px;min-height:140px;">' +
    '<div style="flex:0 0 auto;width:130px;"><canvas id="chart-inv-types" data-h="130" style="width:130px;height:130px;display:block;"></canvas></div>' +
    '<div style="flex:1;min-width:0;">' +
    [['Web Apps','#4299e1','webapps'],['APIs','#48bb78','apis'],['Servers','#ed8936','servers'],['VPN/Other','#e53e3e','vpnother'],['Internal','#ecc94b','internal']].map(function(x){
      return '<div class="stat-row" style="flex-wrap:nowrap;"><span class="stat-key" style="color:'+x[1]+';font-weight:700;white-space:nowrap;min-width:80px;">'+x[0]+'</span><span class="stat-val" id="inv-count-'+x[2]+'">—</span></div>';
    }).join('') +
    '</div></div></div>' +

    '<div class="panel"><div class="panel-title">Risk Distribution (QR Score 0-100, FR9)</div>' +
    '<canvas id="chart-inv-risk" data-h="140" style="width:100%;display:block;"></canvas></div></div>' +

    '<div class="tab-nav" style="margin-top:18px;">' +
    '  <button class="tab-btn active" data-bucket="all"    onclick="setDomainBucket(this,\'all\')">All Domains</button>' +
    '  <button class="tab-btn"        data-bucket="pnb"    onclick="setDomainBucket(this,\'pnb\')">&#127981; PNB Domains</button>' +
    '  <button class="tab-btn"        data-bucket="third"  onclick="setDomainBucket(this,\'third\')">&#127760; 3rd-Party Targets</button>' +
    '</div>' +
    '<div class="panel" style="margin-top:0;border-top-left-radius:0;">' +
    '<div class="panel-title" style="margin-bottom:14px;">Asset Inventory with Cryptographic Details (FR6, FR7)</div>' +
    /* ── Filters row ── */
    '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
    '<div class="search-wrap" style="flex:1;min-width:200px;margin:0;"><span class="search-icon">&#128269;</span><input class="search-input" id="inv-search" placeholder="Search name, URL, IP..." oninput="filterInventory()"></div>' +
    '<select id="inv-risk-filter" class="form-select" style="width:140px;" onchange="filterInventory()"><option value="">All Risks</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>' +
    '<select id="inv-cert-filter" class="form-select" style="width:140px;" onchange="filterInventory()"><option value="">All Certs</option><option>Valid</option><option>Expiring</option><option>Expired</option></select>' +
    '<select id="inv-bucket-filter" class="form-select" style="width:150px;" onchange="filterInventory()"><option value="">All PQC Buckets</option><option>Elite-PQC</option><option>Standard</option><option>Legacy</option><option>Critical</option></select>' +
    '</div>' +
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Asset Name</th><th>Domain Group</th><th>URL</th><th>IPv4</th><th>Key Size</th><th>Cert</th><th>PQC Bucket</th><th>QR Score</th><th>Risk</th><th>Last Scan</th></tr></thead>' +
    '<tbody id="inv-tbody"><tr><td colspan="10" style="text-align:center;padding:24px;color:#aaa;">Loading assets...</td></tr></tbody>' +
    '</table></div></div>';
}

var _allInventory = [];
var _inv_domainFilter = 'all'; /* 'all' | 'pnb' | 'third' */

/* PNB-owned domain patterns — extend this list as needed */
var _PNB_PATTERNS = [
  /\.pnb\.co\.in$/i, /^pnb\.co\.in$/i,
  /\.netpnb\.com$/i, /^netpnb\.com$/i,
  /\.pnbindia\.in$/i, /^pnbindia\.in$/i,
  /pnbhousing/i, /punjab.*national.*bank/i,
  /pnbmetlife/i, /\.pnb\./i
];

function isPNBDomain(urlOrName) {
  var s = String(urlOrName || '').toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return _PNB_PATTERNS.some(function(re) { return re.test(s); });
}

function initAssetInventory() {
  QSR.drawDonut('chart-inv-types', [
    {label:'Web Apps',value:0,color:'#4299e1'},
    {label:'APIs',value:0,color:'#48bb78'},
    {label:'Servers',value:0,color:'#ed8936'},
    {label:'VPN',value:0,color:'#e53e3e'},
    {label:'Internal',value:0,color:'#ecc94b'}
  ], '0', 'Assets');
  QSR.drawBars('chart-inv-risk', [
    {label:'Critical',value:0,color:'#e53e3e'},
    {label:'High',value:0,color:'#ed8936'},
    {label:'Medium',value:0,color:'#ecc94b'},
    {label:'Low',value:0,color:'#48bb78'}
  ]);

  /* Restore domain filter to 'all' on page load */
  _inv_domainFilter = 'all';

  var dataSource = window.QSR_DataLayer ? window.QSR_DataLayer.fetchAssets() : Promise.resolve([]);
  dataSource.then(function(assets) {
    _allInventory = assets;
    var pnbAssets   = assets.filter(function(a) { return isPNBDomain(a.url || a.name); });
    var thirdAssets = assets.filter(function(a) { return !isPNBDomain(a.url || a.name); });
    var setEl = function(id, v){ var el = document.getElementById(id); if(el) el.textContent = v; };
    setEl('kpi-total',     assets.length);
    setEl('kpi-pnb-count', pnbAssets.length);
    setEl('kpi-3p-count',  thirdAssets.length);
    setEl('kpi-expiring',  assets.filter(function(a){ return a.cert === 'Expiring' || a.cert === 'Expired'; }).length);
    setEl('kpi-highrisk',  assets.filter(function(a){ return a.risk === 'Critical' || a.risk === 'High'; }).length);

    /* Asset type counts for legend */
    var webapps  = assets.filter(function(a){ return a.type === 'Web App'; }).length;
    var apis     = assets.filter(function(a){ return a.type === 'API Gateway' || (a.type||'').toLowerCase().includes('api'); }).length;
    var servers  = assets.filter(function(a){ return (a.type||'').toLowerCase().includes('server'); }).length;
    var vpn      = assets.filter(function(a){ return (a.type||'').toLowerCase().includes('vpn'); }).length;
    var internal = assets.filter(function(a){ return (a.type||'').toLowerCase().includes('internal'); }).length;
    setEl('inv-count-webapps',  webapps);
    setEl('inv-count-apis',     apis);
    setEl('inv-count-servers',  servers);
    setEl('inv-count-vpnother', vpn);
    setEl('inv-count-internal', internal);

    QSR.drawDonut('chart-inv-types', [
      {label:'Web Apps',value:assets.filter(function(a){ return a.type === 'Web App'; }).length,color:'#4299e1'},
      {label:'APIs',value:assets.filter(function(a){ return a.type === 'API Gateway'; }).length,color:'#48bb78'},
      {label:'Servers',value:assets.filter(function(a){ return a.type && a.type.includes('Server'); }).length,color:'#ed8936'},
      {label:'VPN',value:assets.filter(function(a){ return a.type && a.type.includes('VPN'); }).length,color:'#e53e3e'},
      {label:'Internal',value:assets.filter(function(a){ return a.type && a.type.includes('Internal'); }).length,color:'#ecc94b'}
    ], String(assets.length), 'Assets');
    QSR.drawBars('chart-inv-risk', [
      {label:'Critical',value:assets.filter(function(a){ return a.risk === 'Critical'; }).length,color:'#e53e3e'},
      {label:'High',value:assets.filter(function(a){ return a.risk === 'High'; }).length,color:'#ed8936'},
      {label:'Medium',value:assets.filter(function(a){ return a.risk === 'Medium'; }).length,color:'#ecc94b'},
      {label:'Low',value:assets.filter(function(a){ return a.risk === 'Low'; }).length,color:'#48bb78'}
    ]);
    renderInventoryTable(assets);
  });

  /* Register refresh fn for live sync */
  registerPageRefresh('asset-inventory', function() {
    if (!window.QSR_DataLayer) return;
    /* Re-fetch assets & patch table/charts without rebuilding HTML */
    _allInventory = [];
    initAssetInventory();
  });

  /* Register full re-renders for other tabs (they handle their own data via their init fns) */
  registerPageRefresh('cbom',        function() { if(window.QSR&&window.QSR.pages&&window.QSR.pages.cbom) window.QSR.pages.cbom(document.getElementById('page-content')); });
  registerPageRefresh('pqc-posture', function() { if(window.QSR&&window.QSR.pages&&window.QSR.pages.pqc)  window.QSR.pages.pqc(document.getElementById('page-content')); });
  registerPageRefresh('cyber-rating',function() { if(window.initCyberRating) window.initCyberRating(); });
  registerPageRefresh('audit-log',   function() { if(window.QSR&&window.QSR.pages&&window.QSR.pages.auditlog) window.QSR.pages.auditlog(document.getElementById('page-content')); });
}

function renderInventoryTable(assets) {
  var tbody = document.getElementById('inv-tbody');
  if (!tbody) return;
  if (!assets || !assets.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:#aaa;">No assets found in this group.</td></tr>';
    return;
  }
  var riskCls = {Critical:'badge-critical',High:'badge-high',Medium:'badge-medium',Low:'badge-low'};
  var certCls = {Valid:'badge-valid',Expiring:'badge-expiring',Expired:'badge-expired'};
  var bucketCls = {'Elite-PQC':'badge-ok',Standard:'badge-info',Legacy:'badge-warn',Critical:'badge-danger'};
  tbody.innerHTML = assets.map(function(a) {
    var isPNB = isPNBDomain(a.url || a.name);
    var score = a.qrScore !== undefined ? a.qrScore : (a.risk === 'Critical' ? 15 : a.risk === 'High' ? 35 : a.risk === 'Medium' ? 55 : 80);
    var scoreColor = score >= 76 ? '#48bb78' : score >= 51 ? '#ecc94b' : score >= 26 ? '#ed8936' : '#e53e3e';
    var keyLen = a.key || 2048;
    var weakKey = keyLen < 2048;
    return '<tr class="inv-row-anim">' +
      '<td style="font-weight:600;">' + (a.name || '—') + '</td>' +
      '<td>' + (isPNB
        ? '<span class="domain-badge domain-pnb">&#127981; PNB</span>'
        : '<span class="domain-badge domain-third">&#127760; 3rd-Party</span>') + '</td>' +
      '<td><a href="' + (a.url||'#') + '" target="_blank" style="font-size:12px;">' + (a.url||'—') + '</a></td>' +
      '<td style="font-family:monospace;font-size:12px;">' + (a.ipv4||'—') + '</td>' +
      '<td style="font-weight:700;color:' + (weakKey?'#e53e3e':'#48bb78') + ';">' + keyLen + '-bit' + (weakKey?' &#9888;':'') + '</td>' +
      '<td><span class="badge ' + (certCls[a.cert]||'badge-valid') + '">' + (a.cert||'Valid') + '</span></td>' +
      '<td><span class="badge ' + (bucketCls[a.pqcBucket]||'badge-info') + '">' + (a.pqcBucket||'Unknown') + '</span></td>' +
      '<td><span style="font-family:Rajdhani;font-size:18px;font-weight:700;color:' + scoreColor + ';">' + score + '</span><span style="font-size:10px;color:#aaa;">/100</span></td>' +
      '<td><span class="badge ' + (riskCls[a.risk]||'badge-low') + '">' + (a.risk||'Low') + '</span></td>' +
      '<td style="font-size:11px;color:#888;">' + (a.lastScan||'Never') + '</td>' +
      '</tr>';
  }).join('');
  /* Stagger-in animation */
  var rows = tbody.querySelectorAll('.inv-row-anim');
  rows.forEach(function(row, i) {
    row.style.opacity = '0';
    row.style.transform = 'translateY(8px)';
    setTimeout(function() {
      row.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, i * 35);
  });
}

window.filterInventory = function() {
  var q = (document.getElementById('inv-search')?.value||'').toLowerCase();
  var r = document.getElementById('inv-risk-filter')?.value||'';
  var c = document.getElementById('inv-cert-filter')?.value||'';
  var b = document.getElementById('inv-bucket-filter')?.value||'';
  renderInventoryTable(_allInventory.filter(function(a) {
    /* Domain bucket filter */
    var bucket = _inv_domainFilter || 'all';
    if (bucket === 'pnb'   && !isPNBDomain(a.url || a.name)) return false;
    if (bucket === 'third' &&  isPNBDomain(a.url || a.name)) return false;
    return (!q || ((a.name||'')+(a.url||'')+(a.ipv4||'')).toLowerCase().includes(q)) &&
           (!r || a.risk === r) && (!c || a.cert === c) && (!b || a.pqcBucket === b);
  }));
};

window.setDomainBucket = function(btn, bucket) {
  _inv_domainFilter = bucket;
  document.querySelectorAll('.tab-btn[data-bucket]').forEach(function(b) {
    b.classList.remove('active');
  });
  if(btn) btn.classList.add('active');
  filterInventory();
};
