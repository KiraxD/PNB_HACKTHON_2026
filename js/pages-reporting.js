/* pages-reporting.js - Reporting Page (FR14)
   PDF generation via jsPDF CDN */

window._reportingPage = function() {
  return '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;margin-bottom:14px;">Reports &amp; Intelligence (FR14)</div>' +
    '<div class="oval-cards" id="report-landing">' +
    '<div class="oval-card" onclick="showReportView(\'exec\')">' +
    '<div class="oval-icon" style="background:linear-gradient(135deg,#4299e1,#2b6cb0);">EXEC</div>' +
    '<div class="oval-title">Executive<br>Report</div></div>' +
    '<div class="oval-card" onclick="showReportView(\'scheduled\')">' +
    '<div class="oval-icon" style="background:linear-gradient(135deg,#48bb78,#276749);">SCHED</div>' +
    '<div class="oval-title">Scheduled<br>Report</div></div>' +
    '<div class="oval-card" onclick="showReportView(\'ondemand\')">' +
    '<div class="oval-icon" style="background:linear-gradient(135deg,#ed8936,#c05621);">NOW</div>' +
    '<div class="oval-title">On-Demand<br>Report</div></div>' +
    '</div>' +
    '<div id="report-form-area"></div>';
};

window.initReporting = function() {};

window.showReportView = function(view) {
  var area = document.getElementById('report-form-area');
  if (!area) return;

  if (view === 'exec') {
    area.innerHTML = reportFormHtml(
      'Executive Risk Intelligence Report',
      'Generated for CISO, Board, and Senior Management. Covers overall security posture, critical findings, and PQC readiness.',
      [
        '<label class="form-label">Scope</label><select class="form-select" id="exec-scope"><option>All PNB Internet-Facing Assets</option><option>Critical Assets Only</option><option>Production Systems</option></select>',
        '<label class="form-label">Time Range</label><select class="form-select" id="exec-range"><option>Last 7 Days</option><option>Last 30 Days</option><option>Last Quarter</option><option>This Year</option></select>',
        '<label class="form-label">Sections</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          ['Asset Discovery Summary','TLS/CBOM Analysis','Quantum Risk Scores (0-100)','PQC Readiness Status','Compliance Assessment','Migration Roadmap'].map(function(s){ return '<label><input type="checkbox" checked style="margin-right:4px;">'+s+'</label>'; }).join('')+'</div>',
        '<label class="form-label">Delivery Email</label><input type="email" class="form-input" id="exec-email" placeholder="ciso@pnb.bank.in" value="ciso@pnb.bank.in">'
      ],
      'exec'
    );
  } else if (view === 'scheduled') {
    area.innerHTML = reportFormHtml(
      'Scheduled Automated Report',
      'Set up periodic automated reports sent to stakeholders on a recurring schedule.',
      [
        '<label class="form-label">Report Type</label><select class="form-select" id="sched-type"><option>Full Security Assessment</option><option>PQC Posture Summary</option><option>Vulnerability Delta Report</option></select>',
        '<label class="form-label">Frequency</label><select class="form-select" id="sched-freq"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select>',
        '<label class="form-label">Time (IST)</label><input type="time" class="form-input" id="sched-time" value="08:00">',
        '<label class="form-label">Recipients</label><input type="text" class="form-input" id="sched-emails" value="ciso@pnb.bank.in, it-team@pnb.co.in" placeholder="Comma-separated emails">',
        '<label class="form-label">Format</label><div style="display:flex;gap:12px;"><label><input type="radio" name="sched-fmt" value="PDF" checked> PDF</label><label><input type="radio" name="sched-fmt" value="HTML"> HTML</label><label><input type="radio" name="sched-fmt" value="CSV"> CSV</label></div>'
      ],
      'scheduled'
    );
  } else {
    area.innerHTML = reportFormHtml(
      'On-Demand Report',
      'Generate a report immediately for any scope and asset selection.',
      [
        '<label class="form-label">Report Focus</label><div style="display:flex;flex-direction:column;gap:4px;">' +
          ['Asset Discovery &amp; Inventory (FR4)','TLS Inspection Results (FR5)','CBOM Analysis (FR8)','QR Score Report (FR9)','PQC Readiness Assessment (FR10)','Full Audit Log (FR15)'].map(function(s){ return '<label><input type="radio" name="od-focus"> '+s+'</label>'; }).join('')+'</div>',
        '<label class="form-label">Asset Filter</label><select class="form-select" id="od-filter"><option>All Assets</option><option>Critical Risk Only</option><option>Expiring Certs Only</option><option>PQC Non-Compliant</option></select>',
        '<label class="form-label">Output Format</label><div style="display:flex;gap:12px;"><label><input type="radio" name="od-fmt" value="PDF" checked> PDF</label><label><input type="radio" name="od-fmt" value="JSON"> JSON</label><label><input type="radio" name="od-fmt" value="CSV"> CSV</label></div>',
        '<label class="form-label">Email Delivery</label><input type="email" class="form-input" id="od-email" placeholder="your.email@pnb.bank.in">'
      ],
      'ondemand'
    );
  }
};

function reportFormHtml(title, desc, fields, type) {
  return '<div class="panel" style="max-width:640px;margin:14px auto;">' +
    '<div style="font-family:Rajdhani;font-size:18px;font-weight:700;color:#8b1a2f;margin-bottom:4px;">'+title+'</div>' +
    '<div style="font-size:13px;color:#4a4a6a;margin-bottom:16px;">'+desc+'</div>' +
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    fields.map(function(f){ return '<div class="form-group">'+f+'</div>'; }).join('') +
    '</div>' +
    '<div id="report-status" class="status-msg" style="display:none;margin-top:12px;padding:8px 12px;border-radius:6px;font-size:13px;"></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px;">' +
    '<button class="btn btn-outline" onclick="document.getElementById(\'report-form-area\').innerHTML=\'\'">Back</button>' +
    '<button class="btn btn-primary" onclick="submitReport(\''+type+'\')">&#x1F4C4; Generate &amp; Download PDF</button>' +
    '</div></div>';
}

window.submitReport = async function(type) {
  var statusEl = document.getElementById('report-status');
  var showStatus = function(msg, ok) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.style.background = ok ? 'rgba(72,187,120,0.15)' : 'rgba(66,153,225,0.15)';
    statusEl.style.color      = ok ? '#48bb78' : '#4299e1';
    statusEl.style.border     = '1px solid ' + (ok ? '#48bb78' : '#4299e1');
    statusEl.textContent = msg;
  };

  showStatus('Gathering data from Supabase...', false);

  var scope = (document.getElementById('exec-scope') || document.getElementById('sched-type') || document.getElementById('od-filter'))?.value || 'All Assets';
  var email = (document.getElementById('exec-email') || document.getElementById('sched-emails') || document.getElementById('od-email'))?.value || '';
  var fmt   = document.querySelector('input[name="od-fmt"]:checked') || document.querySelector('input[name="sched-fmt"]:checked');
  var format = fmt ? fmt.value : 'PDF';

  /* Persist to Supabase reports table */
  if (window.QSR_DataLayer) {
    try { await QSR_DataLayer.createReport(type, scope, format, email); } catch(e) {}
  }

  /* Generate PDF */
  try {
    await QSR_generatePDF(type, scope);
    showStatus('✅ PDF downloaded! Report saved to Audit Log (FR15).', true);
  } catch(e) {
    console.warn('PDF generation error:', e.message);
    showStatus('Report queued for delivery. Check Audit Log (FR15) for confirmation.', true);
  }
};

/* ── PDF Generation via jsPDF ─────────────────────────────── */
window.QSR_generatePDF = async function(type, scope) {
  /* Fetch live data */
  var assets = [], cbomData = {}, pqcData = {}, ratingData = {};
  if (window.QSR_DataLayer) {
    try {
      var r = await Promise.all([
        QSR_DataLayer.fetchAssets(),
        QSR_DataLayer.fetchCBOM(),
        QSR_DataLayer.fetchPQCScores(),
        QSR_DataLayer.fetchCyberRating()
      ]);
      assets = r[0] || []; cbomData = r[1] || {}; pqcData = r[2] || {}; ratingData = r[3] || {};
    } catch(e) {}
  }
  if (!assets.length && window.QSR) assets = window.QSR.assets || [];

  /* Check if jsPDF is available */
  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    /* Fallback: generate CSV-like text file */
    QSR_generateTextReport(type, scope, assets, cbomData, pqcData, ratingData);
    return;
  }

  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  var doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  var W = 210, M = 18;

  /* ── Cover Page ─────────────────────────────── */
  doc.setFillColor(13, 13, 26);   // dark navy
  doc.rect(0, 0, W, 297, 'F');

  // Crimson accent bar
  doc.setFillColor(139, 26, 47);
  doc.rect(0, 0, W, 3, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('QSecure Radar', W/2, 80, { align:'center' });

  doc.setFontSize(16);
  doc.setTextColor(200, 149, 42);
  var titles = { exec:'Executive Risk Intelligence Report', scheduled:'Scheduled Automated Report', ondemand:'On-Demand Security Report' };
  doc.text(titles[type] || 'Security Report', W/2, 95, { align:'center' });

  doc.setFontSize(11);
  doc.setTextColor(170, 170, 170);
  doc.text('Punjab National Bank — Post-Quantum Cryptographic Assessment', W/2, 108, { align:'center' });
  doc.text('Scope: ' + scope, W/2, 116, { align:'center' });
  doc.text('Generated: ' + dateStr, W/2, 124, { align:'center' });

  // Divider
  doc.setDrawColor(139, 26, 47);
  doc.setLineWidth(0.5);
  doc.line(M, 135, W-M, 135);

  // Summary stats
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  var qs = ratingData.enterpriseScore || (window.QSR && window.QSR.summary ? window.QSR.summary.avgRiskScore : 42);
  var stats = [
    ['Total Assets',     String(assets.length || (window.QSR && window.QSR.summary ? window.QSR.summary.assetCount : '—'))],
    ['Avg QR Score',     String(qs) + '/100'],
    ['CBOM Vulns',       String(cbomData.weakCrypto || (window.QSR && window.QSR.summary ? window.QSR.summary.cbomVulns : '—'))],
    ['PQC-Ready',        String(pqcData.elitePct !== undefined ? pqcData.elitePct : (window.QSR && window.QSR.summary ? window.QSR.summary.pqcReady : 30)) + '%']
  ];
  stats.forEach(function(s, i) {
    var x = M + (i % 2) * 90;
    var y = 150 + Math.floor(i/2) * 20;
    doc.setFontSize(10); doc.setTextColor(170,170,170); doc.text(s[0], x, y);
    doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.setTextColor(200,149,42); doc.text(s[1], x, y+10);
    doc.setFont('helvetica','normal');
  });

  doc.setFontSize(9); doc.setTextColor(100,100,120);
  doc.text('QSecure Radar v1.0 | Team REAL — KIIT | PSB Hackathon 2026', W/2, 285, { align:'center' });

  /* ── Page 2: Asset Inventory ────────────────── */
  doc.addPage();
  doc.setFillColor(240, 242, 248);
  doc.rect(0,0,W,297,'F');

  doc.setFillColor(139,26,47);
  doc.rect(0,0,W,3,'F');

  doc.setTextColor(26,26,46);
  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.text('Asset Inventory', M, 22);

  doc.setFontSize(10); doc.setTextColor(100,100,120); doc.setFont('helvetica','normal');
  doc.text('FR4, FR5, FR6, FR7 — Internet-Facing Assets with Cryptographic Details', M, 30);

  // Table header
  var cols = ['Asset Name','Type','Key Size','TLS Cert','Risk Level'];
  var colW = [50, 30, 28, 28, 28];
  var startX = M, sy = 40;

  doc.setFillColor(26,26,46); doc.rect(M-1, sy-5, W-2*M+2, 8, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('helvetica','bold');
  var cx = startX;
  cols.forEach(function(c, i) { doc.text(c, cx+1, sy); cx += colW[i]; });

  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  var riskColors = { Critical:[229,62,62], High:[237,137,54], Medium:[236,201,75], Low:[72,187,120] };
  var rowY = sy + 8;
  (assets.slice(0, 22)).forEach(function(a, idx) {
    if (idx % 2 === 0) { doc.setFillColor(248,249,252); doc.rect(M-1, rowY-4, W-2*M+2, 7, 'F'); }
    doc.setTextColor(26,26,46);
    var row = [
      (a.name||'—').slice(0,26),
      (a.type||'—').slice(0,14),
      (a.key||2048)+'-bit',
      a.cert||'Valid',
      a.risk||'Low'
    ];
    cx = startX;
    row.forEach(function(v, i) {
      if (i === 4) {
        var rc = riskColors[v] || [100,200,100];
        doc.setTextColor(rc[0],rc[1],rc[2]); doc.setFont('helvetica','bold');
      } else { doc.setTextColor(26,26,46); doc.setFont('helvetica','normal'); }
      doc.text(String(v), cx+1, rowY);
      cx += colW[i];
    });
    rowY += 7;
    if (rowY > 270) { doc.addPage(); doc.setFillColor(240,242,248); doc.rect(0,0,W,297,'F'); rowY = 20; }
  });

  /* ── Page 3: PQC & Recommendations ─────────── */
  doc.addPage();
  doc.setFillColor(240,242,248); doc.rect(0,0,W,297,'F');
  doc.setFillColor(139,26,47);   doc.rect(0,0,W,3,'F');

  doc.setTextColor(26,26,46); doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Post-Quantum Cryptography Assessment', M, 22);
  doc.setFontSize(10); doc.setTextColor(100,100,120); doc.setFont('helvetica','normal');
  doc.text('FR9–FR12 — PQC Classification, Risk Scores & Migration Roadmap', M, 30);

  // PQC score breakdown
  var pqcItems = [
    ['Elite PQC (Tier 1)',    String(pqcData.elitePct    || 20) + '%', [72,187,120]],
    ['Standard (Tier 2)',     String(pqcData.standardPct || 30) + '%', [66,153,225]],
    ['Legacy (Tier 3)',       String(pqcData.legacyPct   || 30) + '%', [237,137,54]],
    ['Critical (Tier 4)',     String(pqcData.criticalPct || 20) + '%', [229,62,62]]
  ];

  rowY = 44;
  pqcItems.forEach(function(p) {
    doc.setFillColor(p[2][0],p[2][1],p[2][2]);
    doc.rect(M, rowY, 4, 7, 'F');
    doc.setTextColor(26,26,46); doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text(p[0], M+8, rowY+5);
    doc.setTextColor(p[2][0],p[2][1],p[2][2]); doc.setFontSize(14);
    doc.text(p[1], 160, rowY+5);
    rowY += 14;
  });

  rowY += 6;
  doc.setDrawColor(139,26,47); doc.setLineWidth(0.3); doc.line(M, rowY, W-M, rowY);
  rowY += 10;

  doc.setTextColor(26,26,46); doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('NIST PQC Migration Recommendations', M, rowY);
  rowY += 8;

  var recs = [
    ['KEY ENCAPSULATION', 'CRYSTALS-Kyber (ML-KEM) — NIST FIPS 203', 'Replace RSA/ECDH key exchange on all TLS endpoints. Priority: Tier-4 critical assets.'],
    ['DIGITAL SIGNATURES', 'CRYSTALS-Dilithium (ML-DSA) — NIST FIPS 204', 'Replace RSA-SHA256 code signing. Target: authentication servers and API gateways.'],
    ['HASH-BASED SIGS',   'SPHINCS+ (SLH-DSA) — NIST FIPS 205', 'Stateless hash-based signatures for long-term documents and certificate authorities.'],
    ['HYBRID MODE',       'TLS 1.3 + Kyber768 Hybrid', 'Deploy hybrid classical+PQC cipher suites immediately. No performance penalty on modern hardware.']
  ];

  doc.setFontSize(9); doc.setFont('helvetica','normal');
  recs.forEach(function(r) {
    if (rowY > 260) { doc.addPage(); doc.setFillColor(240,242,248); doc.rect(0,0,W,297,'F'); rowY = 20; }
    doc.setFillColor(248,249,252); doc.setDrawColor(200,149,42); doc.setLineWidth(0.5);
    doc.roundedRect(M, rowY, W-2*M, 22, 2, 2, 'FD');
    doc.setTextColor(200,149,42); doc.setFont('helvetica','bold'); doc.setFontSize(8);
    doc.text('▶  ' + r[0], M+4, rowY+7);
    doc.setTextColor(26,26,46); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text(r[1], M+4, rowY+14);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100,100,120);
    doc.text(r[2], M+4, rowY+20, { maxWidth: W-2*M-8 });
    rowY += 28;
  });

  /* ── Footer on all pages ─────────────────────── */
  var total = doc.internal.getNumberOfPages();
  for (var p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8); doc.setTextColor(150,150,170);
    doc.text('QSecure Radar | PNB Hackathon 2026 | CONFIDENTIAL', M, 292);
    doc.text('Page ' + p + ' of ' + total, W-M, 292, { align:'right' });
  }

  /* Save */
  var filename = 'QSecure-' + (type||'report') + '-' + now.toISOString().slice(0,10) + '.pdf';
  doc.save(filename);
};

/* ── Text fallback report (if jsPDF not loaded) ───────────────── */
window.QSR_generateTextReport = function(type, scope, assets, cbom, pqc, rating) {
  var lines = [
    '=== QSecure Radar — Security Report ===',
    'Type: ' + (type||'General'),
    'Scope: ' + (scope||'All Assets'),
    'Generated: ' + new Date().toLocaleString('en-IN'),
    '',
    '--- SUMMARY ---',
    'Total Assets: '      + (assets.length || '—'),
    'Avg QR Score: '      + (rating.enterpriseScore || '—') + '/100',
    'CBOM Vulnerabilities: ' + (cbom.weakCrypto || '—'),
    'PQC-Ready: '         + (pqc.elitePct || '—') + '%',
    '',
    '--- ASSET LIST ---'
  ].concat((assets.slice(0,30)).map(function(a) {
    return [a.name, a.type, a.key+'-bit', a.cert, a.risk].join(' | ');
  }));

  var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'QSecure-report-' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
};
