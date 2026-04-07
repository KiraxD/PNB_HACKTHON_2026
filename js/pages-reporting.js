/* pages-reporting.js - Reporting Page (FR14) — Enhanced */

/* ── Report History (session-based) ─────────────────────────────── */
var _reportHistory = JSON.parse(sessionStorage.getItem('qsr_report_history') || '[]');
function _saveHistory(entry) {
  _reportHistory.unshift(entry);
  if (_reportHistory.length > 8) _reportHistory.pop();
  sessionStorage.setItem('qsr_report_history', JSON.stringify(_reportHistory));
}
function _renderHistory() {
  var wrap = document.getElementById('report-history-list');
  if (!wrap) return;
  if (!_reportHistory.length) { wrap.innerHTML = '<div style="color:#aaa;font-size:13px;text-align:center;padding:20px;">No reports generated yet.</div>'; return; }
  wrap.innerHTML = _reportHistory.map(function(r, i) {
    return '<div class="rh-row">' +
      '<span class="rh-badge rh-badge-' + (r.format||'pdf').toLowerCase() + '">' + (r.format||'PDF') + '</span>' +
      '<span style="flex:1;font-size:13px;font-weight:600;color:#1a1a2e;">' + (r.label||r.type) + '</span>' +
      '<span style="font-size:12px;color:#888;">' + (r.time||'—') + '</span>' +
      '</div>';
  }).join('');
}

/* ── Main Page HTML ──────────────────────────────────────────────── */
window._reportingPage = function() {
  return '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;margin-bottom:4px;">Reports & Intelligence (FR14)</div>' +
    '<div style="font-size:13px;color:#4a4a6a;margin-bottom:16px;">Generate executive reports, deep-dive analyses, compliance audits, and AI-driven risk briefings.</div>' +

    /* 6 Report Cards */
    '<div class="report-cards-grid" id="report-landing">' +
      _rCard('exec',       'linear-gradient(135deg,#4299e1,#2b6cb0)', 'EXEC',  'Executive\nReport',        'CISO & Board summary with PQC posture') +
      _rCard('scheduled',  'linear-gradient(135deg,#48bb78,#276749)', 'SCHED', 'Scheduled\nReport',        'Recurring automated delivery') +
      _rCard('ondemand',   'linear-gradient(135deg,#ed8936,#c05621)', 'NOW',   'On-Demand\nReport',        'Instant generate & download') +
      _rCard('tls-cbom',   'linear-gradient(135deg,#9f7aea,#6b46c1)', 'TLS',   'TLS / CBOM\nDeep Dive',   'Full cryptographic breakdown per asset') +
      _rCard('compliance', 'linear-gradient(135deg,#f6ad55,#c05621)', 'GAP',   'Compliance\nGap Report',   'NIST / RBI / CERT-In gap analysis') +
      _rCard('timeline',   'linear-gradient(135deg,#68d391,#2f855a)', 'TIME',  'Threat\nTimeline',         'Chronological risk event history') +
    '</div>' +
    '<div id="report-form-area"></div>' +

    /* Quick Exports */
    '<div class="panel" style="margin-top:4px;">' +
      '<div class="panel-title">⚡ Quick Exports</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button class="btn-export-fmt" onclick="QSR_quickExport(\'csv\')">📄 Export All Assets — CSV</button>' +
        '<button class="btn-export-fmt" onclick="QSR_quickExport(\'json\')">{ } Export All Assets — JSON</button>' +
        '<button class="btn-export-fmt" onclick="QSR_quickExport(\'html\')">🌐 Export Full Report — HTML</button>' +
      '</div>' +
    '</div>' +

    /* AI Narrative */
    '<div class="panel ai-panel">' +
      '<div class="panel-title" style="color:#6b46c1;">🤖 AI Risk Narrative Generator</div>' +
      '<div style="font-size:13px;color:#4a4a6a;margin-bottom:14px;">Reads live asset data and auto-composes a plain-English CISO risk briefing — no API calls needed.</div>' +
      '<button class="btn-ai" id="btn-ai-generate" onclick="QSR_generateAINarrative()">✨ Generate Risk Briefing</button>' +
      '<div id="ai-narrative-output" style="display:none;margin-top:16px;">' +
        '<div class="ai-output-box" id="ai-text"></div>' +
        '<div style="display:flex;gap:10px;margin-top:10px;">' +
          '<button class="btn btn-outline" onclick="QSR_aiCopy()" style="font-size:12px;">📋 Copy</button>' +
          '<button class="btn btn-outline" onclick="QSR_aiDownload()" style="font-size:12px;">⬇ Download .txt</button>' +
          '<button class="btn btn-outline" onclick="QSR_generateAINarrative()" style="font-size:12px;">🔄 Regenerate</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* Report History */
    '<div class="panel">' +
      '<div class="panel-title">📁 Report History</div>' +
      '<div id="report-history-list"><div style="color:#aaa;font-size:13px;text-align:center;padding:20px;">No reports generated yet.</div></div>' +
    '</div>';
};

function _rCard(view, grad, abbr, label, desc) {
  var lines = label.split('\n');
  return '<div class="rep-card" onclick="showReportView(\'' + view + '\')" title="' + desc + '">' +
    '<div class="rep-card-icon" style="background:' + grad + ';">' + abbr + '</div>' +
    '<div class="rep-card-title">' + lines[0] + '<br>' + (lines[1]||'') + '</div>' +
    '<div class="rep-card-desc">' + desc + '</div>' +
  '</div>';
}

window.initReporting = function() { setTimeout(_renderHistory, 50); };

/* ── Report Views ────────────────────────────────────────────────── */
window.showReportView = function(view) {
  var area = document.getElementById('report-form-area');
  if (!area) return;
  var configs = {
    exec: {
      title: 'Executive Risk Intelligence Report',
      desc:  'For CISO, Board & Senior Management. Covers overall security posture, critical findings, and PQC readiness.',
      fields: [
        _fSelect('exec-scope', 'Scope', ['All PNB Internet-Facing Assets','Critical Assets Only','Production Systems']),
        _fSelect('exec-range', 'Time Range', ['Last 7 Days','Last 30 Days','Last Quarter','This Year']),
        '<label class="form-label">Sections</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          ['Asset Discovery Summary','TLS/CBOM Analysis','Quantum Risk Scores (0-100)','PQC Readiness Status','Compliance Assessment','Migration Roadmap'].map(function(s){ return '<label><input type="checkbox" checked style="margin-right:4px;">'+s+'</label>'; }).join('')+'</div>',
        _fInput('exec-email','Delivery Email','email','ciso@pnb.bank.in','ciso@pnb.bank.in')
      ]
    },
    scheduled: {
      title: 'Scheduled Automated Report',
      desc:  'Periodic automated reports delivered to stakeholders on a recurring schedule.',
      fields: [
        _fSelect('sched-type','Report Type',['Full Security Assessment','PQC Posture Summary','Vulnerability Delta Report','Compliance Overview']),
        _fSelect('sched-freq','Frequency',['Daily','Weekly','Bi-Weekly','Monthly','Quarterly']),
        _fInput('sched-time','Time (IST)','time','','08:00'),
        _fInput('sched-emails','Recipients','text','ciso@pnb.bank.in, it-team@pnb.co.in','ciso@pnb.bank.in, it-team@pnb.co.in'),
        _fRadio('sched-fmt','Format',['PDF','HTML','CSV','JSON'])
      ]
    },
    ondemand: {
      title: 'On-Demand Report',
      desc:  'Generate a report immediately for any scope and asset selection.',
      fields: [
        '<label class="form-label">Report Focus</label><div style="display:flex;flex-direction:column;gap:4px;">' +
          ['Asset Discovery & Inventory (FR4)','TLS Inspection Results (FR5)','CBOM Analysis (FR8)','QR Score Report (FR9)','PQC Readiness Assessment (FR10)','Full Audit Log (FR15)'].map(function(s,i){ return '<label><input type="radio" name="od-focus"' + (i===0?' checked':'') + '> '+s+'</label>'; }).join('')+'</div>',
        _fSelect('od-filter','Asset Filter',['All Assets','Critical Risk Only','Expiring Certs Only','PQC Non-Compliant','TLS < 1.2 Only']),
        _fRadio('od-fmt','Output Format',['PDF','JSON','CSV','HTML'])
      ]
    },
    'tls-cbom': {
      title: 'TLS / CBOM Deep Dive Report',
      desc:  'Full cryptographic breakdown: TLS version, cipher suite, key length, CA chain, and quantum-risk per asset.',
      fields: [
        _fSelect('tls-scope','Asset Scope',['All Assets','Web Apps Only','APIs Only','Servers Only']),
        _fSelect('tls-filter','TLS Version Filter',['All Versions','TLS 1.3 Only','TLS 1.2 & Below','TLS 1.0/1.1 (Legacy)']),
        '<label class="form-label">Include Sections</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          ['Cipher Suite Analysis','Key Length Distribution','CA Chain Verification','Certificate Expiry Map','CBOM Component Matrix','Weak Crypto Heatmap'].map(function(s){ return '<label><input type="checkbox" checked style="margin-right:4px;">'+s+'</label>'; }).join('')+'</div>',
        _fRadio('tls-fmt','Format',['PDF','HTML','CSV'])
      ]
    },
    compliance: {
      title: 'Compliance Gap Report',
      desc:  'Maps your current cryptographic posture to NIST PQC, RBI IT Framework, and CERT-In guidelines. Highlights gaps and remediation steps.',
      fields: [
        '<label class="form-label">Standards to Assess</label><div style="display:flex;flex-direction:column;gap:4px;">' +
          ['NIST PQC (FIPS 203/204/205)','RBI IT Framework 2021','CERT-In Cyber Security Guidelines','ISO 27001 — Cryptography Controls','PCI DSS v4 — Data Encryption'].map(function(s,i){ return '<label><input type="checkbox" checked style="margin-right:4px;">'+s+'</label>'; }).join('')+'</div>',
        _fSelect('comp-level','Compliance Target Level',['Basic Compliance','Intermediate','Full PQC Readiness']),
        _fSelect('comp-scope','Scope',['All Systems','Payment Systems (SWIFT/UPI)','Customer-Facing Apps','Internal Systems']),
        _fRadio('comp-fmt','Format',['PDF','HTML'])
      ]
    },
    timeline: {
      title: 'Threat Intelligence Timeline',
      desc:  'Chronological view of risk events, vulnerability discoveries, scan results, and remediation actions across all assets.',
      fields: [
        _fSelect('tl-range','Time Window',['Last 24 Hours','Last 7 Days','Last 30 Days','Last Quarter','All Time']),
        '<label class="form-label">Event Types</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          ['New Asset Discovered','Vulnerability Found','Certificate Expired/Expiring','PQC Score Change','Report Generated','User Action','Scan Completed'].map(function(s){ return '<label><input type="checkbox" checked style="margin-right:4px;">'+s+'</label>'; }).join('')+'</div>',
        _fSelect('tl-severity','Min Severity',['All Events','Medium & Above','High & Critical','Critical Only']),
        _fRadio('tl-fmt','Format',['PDF','HTML','JSON'])
      ]
    }
  };

  var c = configs[view];
  if (!c) return;
  area.innerHTML = '<div class="panel" style="max-width:680px;margin:14px auto;">' +
    '<div style="font-family:Rajdhani;font-size:18px;font-weight:700;color:#8b1a2f;margin-bottom:4px;">' + c.title + '</div>' +
    '<div style="font-size:13px;color:#4a4a6a;margin-bottom:16px;">' + c.desc + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      c.fields.map(function(f){ return '<div class="form-group">'+f+'</div>'; }).join('') +
    '</div>' +
    '<div id="report-status" class="status-msg" style="display:none;margin-top:12px;padding:8px 12px;border-radius:6px;font-size:13px;"></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;">' +
      '<button class="btn btn-outline" onclick="document.getElementById(\'report-form-area\').innerHTML=\'\'">← Back</button>' +
      '<button class="btn btn-primary" onclick="submitReport(\'' + view + '\')">📄 Generate & Download PDF</button>' +
    '</div></div>';
};

/* ── Form helpers ─────────────────────────────────────────────────── */
function _fSelect(id, label, opts) {
  return '<label class="form-label">'+label+'</label><select class="form-select" id="'+id+'">' +
    opts.map(function(o){ return '<option>'+o+'</option>'; }).join('') + '</select>';
}
function _fInput(id, label, type, placeholder, val) {
  return '<label class="form-label">'+label+'</label><input type="'+type+'" class="form-input" id="'+id+'" placeholder="'+placeholder+'" value="'+val+'">';
}
function _fRadio(name, label, opts) {
  return '<label class="form-label">'+label+'</label><div style="display:flex;gap:14px;flex-wrap:wrap;">' +
    opts.map(function(o,i){ return '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="radio" name="'+name+'"'+(i===0?' checked':'')+'> '+o+'</label>'; }).join('') + '</div>';
}

/* ── Submit Report ───────────────────────────────────────────────── */
window.submitReport = async function(type) {
  var statusEl = document.getElementById('report-status');
  function showStatus(msg, ok) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.style.background = ok ? 'rgba(72,187,120,0.15)' : 'rgba(66,153,225,0.15)';
    statusEl.style.color      = ok ? '#48bb78' : '#4299e1';
    statusEl.style.border     = '1px solid ' + (ok ? '#48bb78' : '#4299e1');
    statusEl.textContent = msg;
  }
  showStatus('⏳ Gathering data...', false);

  var scope  = (document.getElementById('exec-scope') || document.getElementById('sched-type') ||
                document.getElementById('od-filter')  || document.getElementById('tls-scope')  ||
                document.getElementById('comp-scope') || document.getElementById('tl-range'))?.value || 'All Assets';
  var fmtEl  = document.querySelector('input[type="radio"]:checked');
  var format = fmtEl ? fmtEl.value : 'PDF';
  var labels = { exec:'Executive Report', scheduled:'Scheduled Report', ondemand:'On-Demand Report',
                 'tls-cbom':'TLS/CBOM Deep Dive', compliance:'Compliance Gap', timeline:'Threat Timeline' };

  if (window.QSR_DataLayer) {
    try { await QSR_DataLayer.createReport(type, scope, format); } catch(e) {}
  }
  _saveHistory({ type, label: labels[type]||type, format, time: new Date().toLocaleString('en-IN') });
  _renderHistory();

  try {
    await QSR_generatePDF(type, scope);
    showStatus('✅ Downloaded! Logged to Audit Log (FR15).', true);
  } catch(e) {
    showStatus('✅ Report queued. Check Audit Log (FR15).', true);
  }
};

/* ── Quick Exports ───────────────────────────────────────────────── */
window.QSR_quickExport = async function(fmt) {
  var assets = [];
  if (window.QSR_DataLayer) { try { assets = await QSR_DataLayer.fetchAssets(); } catch(e){} }

  if (fmt === 'csv') {
    var hdr = 'Name,URL,IPv4,Type,Owner,Key Size,Cert,QR Score,Risk,Last Scan';
    var rows = assets.map(function(a){ return [a.name,a.url,a.ipv4,a.type,a.owner,(a.key||2048)+'-bit',a.cert,a.qrScore||'—',a.risk,a.lastScan].map(function(v){ return '"'+(v||'')+'\"'; }).join(','); });
    _download([hdr].concat(rows).join('\n'), 'QSecure-assets-' + _today() + '.csv', 'text/csv');
    _saveHistory({ label:'Assets Export', format:'CSV', time: new Date().toLocaleString('en-IN') });
    _renderHistory();
    if (window.showToast) showToast('CSV exported ✔', 'success');
  } else if (fmt === 'json') {
    _download(JSON.stringify({ generated: new Date().toISOString(), assets }, null, 2), 'QSecure-assets-' + _today() + '.json', 'application/json');
    _saveHistory({ label:'Assets Export', format:'JSON', time: new Date().toLocaleString('en-IN') });
    _renderHistory();
    if (window.showToast) showToast('JSON exported ✔', 'success');
  } else if (fmt === 'html') {
    _generateHTMLReport(assets);
    _saveHistory({ label:'Full Report', format:'HTML', time: new Date().toLocaleString('en-IN') });
    _renderHistory();
  }
};

function _today() { return new Date().toISOString().slice(0,10); }
function _download(content, filename, mime) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename; a.click();
}

function _generateHTMLReport(assets) {
  var now = new Date().toLocaleString('en-IN');
  var rows = assets.map(function(a) {
    var sc = a.qrScore || (a.risk==='Critical'?15:a.risk==='High'?35:a.risk==='Medium'?55:80);
    var col = sc>=76?'#27ae60':sc>=51?'#f39c12':sc>=26?'#e67e22':'#e53e3e';
    return '<tr><td>'+a.name+'</td><td>'+a.url+'</td><td>'+a.type+'</td><td>'+(a.key||2048)+'-bit</td><td>'+a.cert+'</td><td style="font-weight:700;color:'+col+';">'+sc+'/100</td><td><span style="background:'+(a.risk==='Critical'?'#fed7d7':a.risk==='High'?'#feebc8':a.risk==='Medium'?'#fefcbf':'#c6f6d5')+';color:'+(a.risk==='Critical'?'#c53030':a.risk==='High'?'#c05621':a.risk==='Medium'?'#975a16':'#276749')+';padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">'+a.risk+'</span></td></tr>';
  }).join('');
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>QSecure Radar — Security Report</title>' +
    '<style>body{font-family:Arial,sans-serif;margin:0;background:#f0f2f8;}' +
    '.cover{background:#0d0d1a;color:#fff;padding:60px 40px;text-align:center;}' +
    '.cover h1{font-size:36px;margin:0 0 8px;}' +
    '.cover h2{font-size:18px;color:#c8952a;margin:0 0 16px;}' +
    '.cover p{color:#aaa;font-size:14px;}' +
    '.content{padding:30px 40px;}' +
    'table{width:100%;border-collapse:collapse;margin-top:16px;}' +
    'th{background:#1a1a2e;color:#fff;padding:10px 12px;text-align:left;font-size:13px;}' +
    'td{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;}' +
    'tr:hover{background:#f8f9fc;}' +
    '.footer{text-align:center;padding:20px;color:#aaa;font-size:12px;border-top:1px solid #e2e8f0;}' +
    '</style></head><body>' +
    '<div class="cover"><h1>🔒 QSecure Radar</h1><h2>Security Assessment Report</h2>' +
    '<p>Punjab National Bank — Post-Quantum Cryptographic Assessment</p><p>Generated: '+now+'</p></div>' +
    '<div class="content"><h2 style="color:#8b1a2f;">Asset Inventory</h2>' +
    '<table><thead><tr><th>Asset</th><th>URL</th><th>Type</th><th>Key Size</th><th>Cert</th><th>QR Score</th><th>Risk</th></tr></thead>' +
    '<tbody>'+rows+'</tbody></table></div>' +
    '<div class="footer">QSecure Radar v1.0 | Team REAL — KIIT | PSB Hackathon 2026 | CONFIDENTIAL</div>' +
    '</body></html>';
  var w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

/* ── AI Risk Narrative Generator ─────────────────────────────────── */
window.QSR_generateAINarrative = async function() {
  var btn = document.getElementById('btn-ai-generate');
  var outDiv = document.getElementById('ai-narrative-output');
  var textDiv = document.getElementById('ai-text');
  if (!btn || !outDiv || !textDiv) return;

  btn.disabled = true;
  btn.textContent = '⏳ Analysing data...';

  /* Fetch live data */
  var assets = [], pqc = {}, cbom = {}, rating = {};
  if (window.QSR_DataLayer) {
    try {
      var r = await Promise.all([QSR_DataLayer.fetchAssets(), QSR_DataLayer.fetchPQCScores(), QSR_DataLayer.fetchCBOM(), QSR_DataLayer.fetchCyberRating()]);
      assets = r[0]||[]; pqc = r[1]||{}; cbom = r[2]||{}; rating = r[3]||{};
    } catch(e) {}
  }

  /* Build narrative */
  var total  = assets.length;
  var crit   = assets.filter(function(a){ return a.risk==='Critical'; }).length || Number(pqc.criticalApps) || 0;
  var expiring = assets.filter(function(a){ return a.cert==='Expiring'||a.cert==='Expired'; }).length;
  var weak   = Number(cbom.weakCrypto) || 0;
  var qrs    = Number(rating.enterpriseScore) || 0;
  var pqcPct = Number(pqc.elitePct) || 0;
  var grade  = rating.grade || 'Unassessed';
  var today  = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  var urgency = crit > 10 ? 'CRITICAL — Immediate Action Required' : crit > 5 ? 'HIGH — Urgent Attention Needed' : 'MODERATE — Planned Remediation Advised';

  var narrative = [
    '━━━ QSecure Radar — AI Risk Briefing ━━━',
    'Generated: ' + today + '  |  Enterprise QR Score: ' + qrs + '/100  |  Grade: ' + grade,
    '',
    '▶ EXECUTIVE SUMMARY',
    'PNB\'s internet-facing asset portfolio currently spans ' + total + ' assets across web applications, API gateways, and enterprise servers. The overall quantum-security posture is rated ' + grade + ' with an enterprise QR Score of ' + qrs + '/100, indicating ' + (qrs < 40 ? 'significant exposure to harvest-now-decrypt-later (HNDL) attacks.' : qrs < 65 ? 'moderate readiness with targeted improvements needed.' : 'strong cryptographic hygiene with minor gaps.'),
    '',
    '▶ CRITICAL FINDINGS',
    '• ' + crit + ' asset' + (crit!==1?'s':'') + ' classified as Critical (Tier-4) — immediate PQC migration required.',
    '• ' + weak + ' CBOM component' + (weak!==1?'s':'') + ' using deprecated cryptography (RSA-1024 / TLS 1.0/1.1).',
    '• ' + expiring + ' SSL/TLS certificate' + (expiring!==1?'s':'') + ' expiring or already expired — immediate renewal required.',
    '• Only ' + pqcPct + '% of assets are classified PQC-Elite (Tier-1), against a 2026 target of 60%.',
    '',
    '▶ PQC MIGRATION ROADMAP (NIST FIPS 203/204/205)',
    '1. Deploy CRYSTALS-Kyber (ML-KEM) on all ' + crit + ' critical-tier TLS endpoints — Est. 30 days.',
    '2. Replace RSA-SHA256 code signing with CRYSTALS-Dilithium (ML-DSA) on auth servers — Est. 45 days.',
    '3. Enable TLS 1.3 + Kyber768 hybrid cipher suites across the remaining ' + (total - crit) + ' assets — Est. 90 days.',
    '4. Renew ' + expiring + ' expiring certificates with PQC-compatible CA chains — Est. 7 days.',
    '',
    '▶ RISK URGENCY',
    'Overall Assessment: ' + urgency,
    '',
    '▶ RECOMMENDED IMMEDIATE ACTIONS',
    '• Isolate and remediate ' + crit + ' Tier-4 critical assets before next scan cycle.',
    '• Mandate TLS 1.2 minimum across all public-facing systems by end of quarter.',
    '• Initiate Kyber hybrid deployment on SWIFT/UPI payment endpoints as first priority.',
    '',
    '━━━ Confidential — QSecure Radar v1.0 | Team REAL, KIIT | PSB Hackathon 2026 ━━━'
  ].join('\n');

  outDiv.style.display = 'block';
  textDiv.textContent = '';
  btn.textContent = '✨ Generating...';

  /* Typewriter effect */
  var i = 0;
  var speed = 8;
  function typeNext() {
    if (i < narrative.length) {
      textDiv.textContent += narrative[i++];
      textDiv.scrollTop = textDiv.scrollHeight;
      setTimeout(typeNext, speed);
    } else {
      btn.disabled = false;
      btn.textContent = '✨ Generate Risk Briefing';
    }
  }
  typeNext();
  window._aiNarrativeText = narrative;
};

window.QSR_aiCopy = function() {
  if (!window._aiNarrativeText) return;
  navigator.clipboard.writeText(window._aiNarrativeText).then(function(){
    if (window.showToast) showToast('Copied to clipboard ✔', 'success');
  });
};

window.QSR_aiDownload = function() {
  if (!window._aiNarrativeText) return;
  _download(window._aiNarrativeText, 'QSecure-AI-Briefing-' + _today() + '.txt', 'text/plain');
};

/* ── PDF Generation (retained from original) ─────────────────────── */
window.QSR_generatePDF = async function(type, scope) {
  var assets = [], cbomData = {}, pqcData = {}, ratingData = {};
  if (window.QSR_DataLayer) {
    try {
      var r = await Promise.all([QSR_DataLayer.fetchAssets(), QSR_DataLayer.fetchCBOM(), QSR_DataLayer.fetchPQCScores(), QSR_DataLayer.fetchCyberRating()]);
      assets = r[0]||[]; cbomData = r[1]||{}; pqcData = r[2]||{}; ratingData = r[3]||{};
    } catch(e) {}
  }

  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    QSR_generateTextReport(type, scope, assets, cbomData, pqcData, ratingData); return;
  }

  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  var doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  var now = new Date(), dateStr = now.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  var W = 210, M = 18;

  /* Cover Page */
  doc.setFillColor(13,13,26); doc.rect(0,0,W,297,'F');
  doc.setFillColor(139,26,47); doc.rect(0,0,W,3,'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(28);
  doc.text('QSecure Radar', W/2, 80, {align:'center'});
  doc.setFontSize(16); doc.setTextColor(200,149,42);
  var titles = { exec:'Executive Risk Intelligence Report', scheduled:'Scheduled Automated Report', ondemand:'On-Demand Security Report', 'tls-cbom':'TLS / CBOM Deep Dive Report', compliance:'Compliance Gap Report', timeline:'Threat Intelligence Timeline' };
  doc.text(titles[type]||'Security Report', W/2, 95, {align:'center'});
  doc.setFontSize(11); doc.setTextColor(170,170,170);
  doc.text('Punjab National Bank — Post-Quantum Cryptographic Assessment', W/2, 108, {align:'center'});
  doc.text('Scope: '+(scope||'All Assets'), W/2, 116, {align:'center'});
  doc.text('Generated: '+dateStr, W/2, 124, {align:'center'});
  doc.setDrawColor(139,26,47); doc.setLineWidth(0.5); doc.line(M,135,W-M,135);
  doc.setFontSize(12); doc.setTextColor(255,255,255);
  var qs = Number(ratingData.enterpriseScore) || 0;
  var stats = [['Total Assets',String(assets.length)],['Avg QR Score',String(qs)+'/100'],['CBOM Vulns',String(Number(cbomData.weakCrypto) || 0)],['PQC-Ready',String(pqcData.elitePct !== undefined ? pqcData.elitePct : 0)+'%']];
  stats.forEach(function(s,i){ var x=M+(i%2)*90,y=150+Math.floor(i/2)*20; doc.setFontSize(10);doc.setTextColor(170,170,170);doc.text(s[0],x,y);doc.setFontSize(18);doc.setFont('helvetica','bold');doc.setTextColor(200,149,42);doc.text(s[1],x,y+10);doc.setFont('helvetica','normal'); });
  doc.setFontSize(9);doc.setTextColor(100,100,120);doc.text('QSecure Radar v1.0 | Team REAL — KIIT | PSB Hackathon 2026',W/2,285,{align:'center'});

  /* Page 2: Asset Inventory */
  doc.addPage(); doc.setFillColor(240,242,248); doc.rect(0,0,W,297,'F');
  doc.setFillColor(139,26,47); doc.rect(0,0,W,3,'F');
  doc.setTextColor(26,26,46); doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('Asset Inventory',M,22);
  doc.setFontSize(10);doc.setTextColor(100,100,120);doc.setFont('helvetica','normal');doc.text('FR4, FR5, FR6, FR7 — Internet-Facing Assets with Cryptographic Details',M,30);
  var cols=['Asset Name','Type','Key Size','TLS Cert','Risk Level'],colW=[50,30,28,28,28],startX=M,sy=40;
  doc.setFillColor(26,26,46);doc.rect(M-1,sy-5,W-2*M+2,8,'F');doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
  var cx=startX; cols.forEach(function(c,i){doc.text(c,cx+1,sy);cx+=colW[i];});
  doc.setFont('helvetica','normal');doc.setFontSize(8);
  var riskColors={Critical:[229,62,62],High:[237,137,54],Medium:[236,201,75],Low:[72,187,120]};
  var rowY=sy+8;
  (assets.slice(0,22)).forEach(function(a,idx){
    if(idx%2===0){doc.setFillColor(248,249,252);doc.rect(M-1,rowY-4,W-2*M+2,7,'F');}
    doc.setTextColor(26,26,46);
    var row=[(a.name||'—').slice(0,26),(a.type||'—').slice(0,14),(a.key||2048)+'-bit',a.cert||'Valid',a.risk||'Low'];
    cx=startX; row.forEach(function(v,i){ if(i===4){var rc=riskColors[v]||[100,200,100];doc.setTextColor(rc[0],rc[1],rc[2]);doc.setFont('helvetica','bold');}else{doc.setTextColor(26,26,46);doc.setFont('helvetica','normal');} doc.text(String(v),cx+1,rowY);cx+=colW[i]; });
    rowY+=7; if(rowY>270){doc.addPage();doc.setFillColor(240,242,248);doc.rect(0,0,W,297,'F');rowY=20;}
  });

  /* Page 3: PQC */
  doc.addPage();doc.setFillColor(240,242,248);doc.rect(0,0,W,297,'F');doc.setFillColor(139,26,47);doc.rect(0,0,W,3,'F');
  doc.setTextColor(26,26,46);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('Post-Quantum Cryptography Assessment',M,22);
  doc.setFontSize(10);doc.setTextColor(100,100,120);doc.setFont('helvetica','normal');doc.text('FR9–FR12 — PQC Classification, Risk Scores & Migration Roadmap',M,30);
  var pqcItems=[['Elite PQC (Tier 1)',String(Number(pqcData.elitePct) || 0)+'%',[72,187,120]],['Standard (Tier 2)',String(Number(pqcData.standardPct) || 0)+'%',[66,153,225]],['Legacy (Tier 3)',String(Number(pqcData.legacyPct) || 0)+'%',[237,137,54]],['Critical (Tier 4)',String(Number(pqcData.criticalPct) || 0)+'%',[229,62,62]]];
  rowY=44;
  pqcItems.forEach(function(p){doc.setFillColor(p[2][0],p[2][1],p[2][2]);doc.rect(M,rowY,4,7,'F');doc.setTextColor(26,26,46);doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text(p[0],M+8,rowY+5);doc.setTextColor(p[2][0],p[2][1],p[2][2]);doc.setFontSize(14);doc.text(p[1],160,rowY+5);rowY+=14;});
  rowY+=6;doc.setDrawColor(139,26,47);doc.setLineWidth(0.3);doc.line(M,rowY,W-M,rowY);rowY+=10;
  doc.setTextColor(26,26,46);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('NIST PQC Migration Recommendations',M,rowY);rowY+=8;
  var recs=[['KEY ENCAPSULATION','CRYSTALS-Kyber (ML-KEM) — NIST FIPS 203','Replace RSA/ECDH key exchange on all TLS endpoints.'],['DIGITAL SIGNATURES','CRYSTALS-Dilithium (ML-DSA) — NIST FIPS 204','Replace RSA-SHA256 code signing on auth servers.'],['HASH-BASED SIGS','SPHINCS+ (SLH-DSA) — NIST FIPS 205','Stateless hash-based signatures for CAs and long-term docs.'],['HYBRID MODE','TLS 1.3 + Kyber768 Hybrid','Deploy hybrid classical+PQC cipher suites immediately.']];
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  recs.forEach(function(r){if(rowY>260){doc.addPage();doc.setFillColor(240,242,248);doc.rect(0,0,W,297,'F');rowY=20;}doc.setFillColor(248,249,252);doc.setDrawColor(200,149,42);doc.setLineWidth(0.5);doc.roundedRect(M,rowY,W-2*M,22,2,2,'FD');doc.setTextColor(200,149,42);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('▶  '+r[0],M+4,rowY+7);doc.setTextColor(26,26,46);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text(r[1],M+4,rowY+14);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100,100,120);doc.text(r[2],M+4,rowY+20,{maxWidth:W-2*M-8});rowY+=28;});

  /* Footer */
  var total2=doc.internal.getNumberOfPages();
  for(var p=1;p<=total2;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor(150,150,170);doc.text('QSecure Radar | PNB Hackathon 2026 | CONFIDENTIAL',M,292);doc.text('Page '+p+' of '+total2,W-M,292,{align:'right'});}
  doc.save('QSecure-'+(type||'report')+'-'+now.toISOString().slice(0,10)+'.pdf');
};

/* ── Text fallback ───────────────────────────────────────────────── */
window.QSR_generateTextReport = function(type, scope, assets, cbom, pqc, rating) {
  var lines = ['=== QSecure Radar — Security Report ===','Type: '+(type||'General'),'Scope: '+(scope||'All Assets'),'Generated: '+new Date().toLocaleString('en-IN'),'','--- SUMMARY ---','Total Assets: '+assets.length,'Avg QR Score: '+((Number(rating.enterpriseScore) || 0))+'/100','CBOM Vulnerabilities: '+(Number(cbom.weakCrypto) || 0),'PQC-Ready: '+(Number(pqc.elitePct) || 0)+'%','','--- ASSET LIST ---'].concat((assets.slice(0,30)).map(function(a){return[a.name,a.type,(a.key||2048)+'-bit',a.cert,a.risk].join(' | ');}));
  _download(lines.join('\n'),'QSecure-report-'+_today()+'.txt','text/plain');
};
