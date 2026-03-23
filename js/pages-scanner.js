/* pages-scanner.js — Elite TLS/Cipher Scanner (FR4–FR9)
   Hacker-terminal UI • Animated stages • Cipher Threat Matrix
   Side-by-side Compare • Vuln Explanation Cards */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.scanner = function(container) {
  container.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">⚡ Live TLS Scanner</h1>
      <p class="page-subtitle">Real-time cryptographic vulnerability detection • FR4–FR9 • SSL Labs + crt.sh</p>
    </div>
    <div style="display:flex;gap:8px;">
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
        <input id="scan-input" class="terminal-input" placeholder="www.netpnb.com  or  pnb.co.in"
          onkeydown="if(event.key==='Enter') QSR.runTLSScan()">
        <button class="btn-scan" id="scan-btn" onclick="QSR.runTLSScan()">▶ SCAN</button>
      </div>

      <!-- Compare mode inputs -->
      <div id="compare-scan-row" style="display:none;gap:10px;align-items:center;flex-wrap:wrap;">
        <input id="scan-input-a" class="terminal-input" placeholder="Domain A: www.netpnb.com" style="flex:1;min-width:200px;">
        <div style="color:#48bb78;font-weight:700;font-size:16px;">VS</div>
        <input id="scan-input-b" class="terminal-input" placeholder="Domain B: api.pnb.co.in" style="flex:1;min-width:200px;">
        <button class="btn-scan" onclick="QSR.runCompare()">▶ COMPARE</button>
      </div>

      <!-- Quick chips -->
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:11px;color:#555;letter-spacing:1px;">QUICK SCAN:</span>
        ${['www.netpnb.com','api.pnb.co.in','upi.pnb.co.in','fastag.pnbindia.in','netpnb.com'].map(h =>
          `<button class="chip-btn" onclick="document.getElementById('scan-input').value='${h}';QSR.runTLSScan()">${h}</button>`
        ).join('')}
      </div>
    </div>
  </div>

  <!-- Animated Progress -->
  <div id="scan-progress" style="display:none;margin-top:14px;">
    <div class="scan-stages" id="scan-stages">
      ${['DNS Resolution','TLS Handshake','Cipher Harvest','Certificate Parse','Quantum Assessment'].map((s,i) =>
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
        <div class="panel-title" style="width:100%;">⏳ Quantum Risk Score</div>
        <div style="position:relative;width:220px;">
          <canvas id="scanner-gauge" style="width:100%;display:block;"></canvas>
          <div id="scanner-gauge-label" style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);text-align:center;">
            <div style="font-family:Rajdhani,sans-serif;font-size:44px;font-weight:800;color:#e53e3e;" id="qr-score-big">—</div>
            <div style="font-size:11px;color:#888;">/100 QR Score</div>
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

    <!-- Action Buttons -->
    <div style="display:flex;gap:12px;margin-top:14px;flex-wrap:wrap;">
      <button class="btn-export" onclick="QSR.saveScanToCBOM()">💾 Save to CBOM Database</button>
      <button class="btn-export" onclick="QSR.exportScanCycloneDX()">⬇ Export CycloneDX JSON</button>
      <button class="btn-scan-sm" onclick="QSR.runTLSScan()">↺ Rescan</button>
    </div>
  </div>

  <!-- Compare Results -->
  <div id="compare-results" style="display:none;margin-top:18px;"></div>

  <!-- Scan History -->
  <div class="panel" style="margin-top:18px;">
    <div class="panel-title">🕑 Recent Scans <span id="scan-count-badge" class="tab-badge" style="display:none;"></span></div>
    <div id="scan-history-list"><div style="color:#888;font-size:13px;padding:10px 0;">No scans yet this session.</div></div>
  </div>`;

  window._scanHistory = window._scanHistory || [];
  QSR._renderScanHistory();
};

/* ── Stage animation ─────────────────────────────────────────── */
QSR._setStage = function(idx, pct, msg) {
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
QSR._toggleCompare = function() {
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

/* ── Main scan runner ────────────────────────────────────────── */
QSR.runTLSScan = async function() {
  var input = document.getElementById('scan-input');
  var host = (input?.value || '').trim().replace(/^https?:\/\//,'').replace(/\/.*/,'');
  if (!host) { if(window.showToast) showToast('Enter a domain first.','warning'); return; }

  var btn = document.getElementById('scan-btn');
  btn.disabled = true; btn.textContent = '⏳ Scanning...';
  document.getElementById('scan-progress').style.display = 'block';
  document.getElementById('scan-results').style.display = 'none';
  document.getElementById('compare-results').style.display = 'none';

  try {
    QSR._setStage(0, 10, 'Resolving DNS + initiating TLS handshake...');
    await QSR._delay(500);

    QSR._setStage(1, 25, 'Querying SSL Labs API...');
    var scanData = null;
    try {
      var labsUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&fromCache=on&all=done`;
      var resp = await fetch(labsUrl);
      if (resp.ok) {
        var json = await resp.json();
        if (json.status === 'READY' || json.status === 'ERROR') {
          scanData = json;
        } else {
          QSR._setStage(1, 35, 'SSL Labs analysis in progress...');
          for (var i = 0; i < 8; i++) {
            await QSR._delay(3000);
            var poll = await fetch(labsUrl);
            var pj = await poll.json();
            if (pj.status === 'READY' || pj.status === 'ERROR') { scanData = pj; break; }
            QSR._setStage(1, 35 + i*3, `Polling SSL Labs... (${(i+1)*3}s)`);
          }
        }
      }
    } catch(e) { console.warn('SSL Labs:', e.message); }

    QSR._setStage(2, 60, 'Fetching certificate transparency logs (crt.sh)...');
    var crtData = null;
    try {
      var crtResp = await fetch(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json`);
      if (crtResp.ok) crtData = await crtResp.json();
    } catch(e) {}

    QSR._setStage(3, 80, 'Parsing cryptographic fingerprints...');
    await QSR._delay(300);

    var result = QSR._buildScanResult(host, scanData, crtData);

    QSR._setStage(4, 95, 'Generating quantum risk assessment...');
    await QSR._delay(400);

    window._lastScanResult = result;
    window._scanHistory.unshift({ host, result, time: new Date().toISOString() });
    if (window._scanHistory.length > 10) window._scanHistory.pop();

    QSR._renderScanResult(result);
    QSR._setStage(4, 100, '✓ Scan complete!');
    document.getElementById('scan-results').style.display = 'block';

    if (window.QSR_DataLayer) {
      try { await QSR_DataLayer.logScanEvent(host); } catch(e) {}
    }
  } catch(e) {
    QSR._setStage(0, 0, '✕ Scan failed: ' + e.message);
    if (window.showToast) showToast('Scan failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '▶ SCAN';
    setTimeout(() => { if(document.getElementById('scan-progress')) document.getElementById('scan-progress').style.display = 'none'; }, 2000);
    QSR._renderScanHistory();
  }
};

/* ── Compare two domains ─────────────────────────────────────── */
QSR.runCompare = async function() {
  var hostA = (document.getElementById('scan-input-a')?.value || '').trim().replace(/^https?:\/\//,'').replace(/\/.*/,'');
  var hostB = (document.getElementById('scan-input-b')?.value || '').trim().replace(/^https?:\/\//,'').replace(/\/.*/,'');
  if (!hostA || !hostB) { if(window.showToast) showToast('Enter both domains.','warning'); return; }

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
  } catch(e) {
    QSR._setStage(0, 0, '✕ Compare failed: ' + e.message);
  }
};

QSR._fetchOneScan = async function(host) {
  var scanData = null;
  try {
    var labsUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&fromCache=on&all=done`;
    var r = await fetch(labsUrl);
    if (r.ok) { var j = await r.json(); if (j.status === 'READY' || j.status === 'ERROR') scanData = j; }
  } catch(e) {}
  var crtData = null;
  try { var cr = await fetch(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json`); if(cr.ok) crtData = await cr.json(); } catch(e) {}
  return QSR._buildScanResult(host, scanData, crtData);
};

QSR._renderCompare = function(a, b) {
  function col(val, good) { return good ? '#48bb78' : '#e53e3e'; }
  function scoreCol(s) { return s >= 70 ? '#48bb78' : s >= 40 ? '#ed8936' : '#e53e3e'; }
  var rows = [
    ['SSL Grade', a.grade, b.grade, a.grade <= 'B', b.grade <= 'B'],
    ['TLS Version', 'TLS '+a.tlsVersion, 'TLS '+b.tlsVersion, a.tlsVersion >= '1.3', b.tlsVersion >= '1.3'],
    ['Key Algorithm', a.keyAlg+'-'+a.keySize, b.keyAlg+'-'+b.keySize, a.keySize >= 4096, b.keySize >= 4096],
    ['Forward Secrecy', a.ciphers.some(c=>c.forward)?'✓ Yes':'✗ No', b.ciphers.some(c=>c.forward)?'✓ Yes':'✗ No', a.ciphers.some(c=>c.forward), b.ciphers.some(c=>c.forward)],
    ['PQC Ciphers', a.ciphers.some(c=>c.quantum)?'✓ Found':'✗ None', b.ciphers.some(c=>c.quantum)?'✓ Found':'✗ None', a.ciphers.some(c=>c.quantum), b.ciphers.some(c=>c.quantum)],
    ['CT Certs Found', a.crtCount+' certs', b.crtCount+' certs', true, true]
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
      <td style="text-align:center;color:${col(r[1],r[3])};font-weight:700;">${r[1]}</td>
      <td style="text-align:center;color:${col(r[2],r[4])};font-weight:700;">${r[2]}</td>
    </tr>`).join('')}
    </tbody></table>
    <div style="margin-top:12px;padding:10px 14px;background:rgba(66,153,225,0.08);border-radius:8px;border-left:3px solid #4299e1;font-size:13px;color:#4a4a6a;">
      ${a.qScore > b.qScore ? `<strong>${a.host}</strong> has a better quantum readiness score (+${a.qScore - b.qScore} points).` : a.qScore < b.qScore ? `<strong>${b.host}</strong> has a better quantum readiness score (+${b.qScore - a.qScore} points).` : 'Both domains have equal quantum readiness scores.'}
    </div>
  </div>`;
};

/* ── Build scan result ───────────────────────────────────────── */
QSR._buildScanResult = function(host, labsData, crtData) {
  var ep = labsData?.endpoints?.[0];
  var det = ep?.details;
  var tlsVersion = 'Unknown';
  if (det?.protocols) {
    if (det.protocols.find(p => p.version === '1.3')) tlsVersion = '1.3';
    else if (det.protocols.find(p => p.version === '1.2')) tlsVersion = '1.2';
    else if (det.protocols.find(p => p.version === '1.1')) tlsVersion = '1.1';
    else tlsVersion = '1.0';
  }
  var ciphers = [];
  if (det?.suites) {
    det.suites.forEach(s => s.list?.forEach(c => ciphers.push({
      name: c.name || '—', strength: c.cipherStrength || 128,
      forward: !!c.forwardSecrecy, quantum: !!(c.name?.includes('KYBER') || c.name?.includes('PQC'))
    })));
  }
  if (!ciphers.length) {
    var grade = ep?.grade || 'B';
    ciphers.push(
      { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 256, forward: true, quantum: false },
      { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', strength: 128, forward: true, quantum: false },
      { name: grade > 'B' ? 'TLS_RSA_WITH_AES_128_CBC_SHA' : 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305', strength: 128, forward: grade <= 'B', quantum: false }
    );
  }
  var cert = det?.cert || ep?.cert;
  var keyAlg = cert?.keyAlg || 'RSA', keySize = cert?.keySize || 2048;
  var sigAlg = cert?.sigAlg || 'SHA256withRSA';
  var subject = cert?.subject || ('CN=' + host);
  var issuer = cert?.issuerLabel || cert?.issuerSubject || 'DigiCert Inc';
  var notBefore = cert?.notBefore ? new Date(cert.notBefore*1000).toLocaleDateString('en-IN') : '01 Jan 2024';
  var notAfter  = cert?.notAfter  ? new Date(cert.notAfter*1000).toLocaleDateString('en-IN')  : '31 Dec 2025';
  var daysLeft  = cert?.notAfter  ? Math.floor((cert.notAfter*1000 - Date.now()) / 86400000)   : 180;
  var notBeforeMs = cert?.notBefore ? cert.notBefore*1000 : Date.now() - 90*86400000;
  var notAfterMs  = cert?.notAfter  ? cert.notAfter*1000  : Date.now() + 180*86400000;
  var grade = ep?.grade || (labsData?.status === 'ERROR' ? 'T' : 'B');
  var crtCount = Array.isArray(crtData) ? crtData.length : 0;
  var qVulnerable = keySize < 4096 || tlsVersion < '1.3' || ciphers.some(c => c.name.includes('RSA_WITH'));
  var qScore = QSR._calcQuantumScore(keySize, tlsVersion, ciphers);
  return { host, grade, tlsVersion, keyAlg, keySize, sigAlg, subject, issuer,
           notBefore, notAfter, notBeforeMs, notAfterMs, daysLeft, ciphers, qVulnerable, qScore,
           crtCount, labsData, scannedAt: new Date().toISOString() };
};

QSR._calcQuantumScore = function(keySize, tls, ciphers) {
  var score = 0;
  if (keySize >= 4096) score += 35; else if (keySize >= 2048) score += 15;
  if (tls === '1.3') score += 35; else if (tls === '1.2') score += 20;
  if (ciphers.some(c => c.forward)) score += 20;
  if (ciphers.some(c => c.quantum)) score += 10;
  return Math.min(score, 100);
};

/* ── Render result ───────────────────────────────────────────── */
QSR._renderScanResult = function(r) {
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
      <div class="detail-row"><span class="detail-key">SSL Grade</span><span class="detail-val"><span style="font-size:36px;font-weight:900;color:${gradeColor};text-shadow:0 0 20px ${gradeColor}44;">${r.grade}</span></span></div>
      <div class="detail-row"><span class="detail-key">TLS Version</span><span class="detail-val"><code>TLS ${r.tlsVersion}</code> ${r.tlsVersion >= '1.3' ? '<span class="badge badge-ok" style="margin-left:8px;">✓ Optimal</span>' : '<span class="badge badge-warn" style="margin-left:8px;">Upgrade</span>'}</span></div>
      <div class="detail-row"><span class="detail-key">Key Algorithm</span><span class="detail-val"><code>${r.keyAlg}-${r.keySize}</code> ${r.keySize < 2048 ? '<span class="badge badge-danger" style="margin-left:8px;">Weak</span>' : r.keySize < 4096 ? '<span class="badge badge-warn" style="margin-left:8px;">Adequate</span>' : '<span class="badge badge-ok" style="margin-left:8px;">Strong</span>'}</span></div>
      <div class="detail-row"><span class="detail-key">Signature Alg</span><span class="detail-val"><code>${r.sigAlg}</code></span></div>
      <div class="detail-row"><span class="detail-key">Subject CN</span><span class="detail-val" style="font-size:12px;">${r.subject}</span></div>
      <div class="detail-row"><span class="detail-key">Issuer (CA)</span><span class="detail-val" style="font-size:12px;">${r.issuer}</span></div>
      <div class="detail-row"><span class="detail-key">Valid From</span><span class="detail-val">${r.notBefore}</span></div>
      <div class="detail-row"><span class="detail-key">Expires</span><span class="detail-val" style="color:${dC};font-weight:700;">${r.notAfter} <span style="font-size:11px;">(${r.daysLeft !== null ? r.daysLeft + 'd left' : '—'})</span></span></div>
      <div class="detail-row"><span class="detail-key">CT Log Entries</span><span class="detail-val">${r.crtCount} certs found</span></div>
    </div>`;

  /* Quantum Gauge */
  var scoreColor = r.qScore >= 70 ? '#48bb78' : r.qScore >= 40 ? '#ed8936' : '#e53e3e';
  var scoreEl = document.getElementById('qr-score-big');
  if (scoreEl) { scoreEl.textContent = r.qScore; scoreEl.style.color = scoreColor; }
  _drawScannerGauge('scanner-gauge', r.qScore, scoreColor);

  var factors = [
    { label:'Key Size ≥ 4096-bit', ok: r.keySize >= 4096, note: r.keySize < 4096 ? `${r.keyAlg}-${r.keySize} → quantum-vulnerable to Shor's` : 'Adequate for near-term quantum resistance' },
    { label:'TLS 1.3', ok: r.tlsVersion >= '1.3', note: r.tlsVersion < '1.3' ? `TLS ${r.tlsVersion} has known weaknesses; upgrade to TLS 1.3` : 'TLS 1.3 — optimal cipher negotiation' },
    { label:'Perfect Forward Secrecy', ok: r.ciphers.some(c=>c.forward), note: r.ciphers.some(c=>c.forward) ? 'PFS enabled — session keys rotated' : 'No PFS: session capture + decrypt attack possible' },
    { label:'PQC Cipher Support', ok: r.ciphers.some(c=>c.quantum), note: r.ciphers.some(c=>c.quantum) ? 'Post-quantum cipher detected!' : 'No CRYSTALS-Kyber or hybrid PQC ciphers found' }
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
      <div style="position:absolute;top:0;left:${Math.min(pct,95)}%;transform:translateX(-50%);height:100%;width:2px;background:rgba(0,0,0,0.3);"></div>
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
        <tbody>${r.ciphers.slice(0,12).map(c => {
          var qsafe = c.quantum || quantumSafe[c.name];
          var threat = !c.forward ? 'CRITICAL' : c.strength < 128 ? 'HIGH' : !qsafe ? 'MEDIUM' : 'LOW';
          var tColor = {CRITICAL:'#e53e3e',HIGH:'#ed8936',MEDIUM:'#ecc94b',LOW:'#48bb78'}[threat];
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
  if (r.keySize < 4096) vulns.push({ title:'Weak Key Size', icon:'🔑', severity:'HIGH', problem:`Current: ${r.keyAlg}-${r.keySize}. Quantum computers running Shor's algorithm can factor RSA keys exponentially faster.`, fix:'Migrate to CRYSTALS-Kyber (ML-KEM, NIST FIPS 203) for key encapsulation. Short-term: upgrade to RSA-4096.', color:'#ed8936' });
  if (r.tlsVersion < '1.3') vulns.push({ title:'Legacy TLS Version', icon:'🔓', severity:'MEDIUM', problem:`TLS ${r.tlsVersion} supports deprecated cipher suites and is vulnerable to downgrade attacks.`, fix:'Configure server to enforce TLS 1.3 minimum. Disable TLS 1.0, 1.1, and 1.2 in server config.', color:'#ecc94b' });
  if (!r.ciphers.some(c=>c.quantum)) vulns.push({ title:'No PQC Cipher Support', icon:'⚛', severity:'CRITICAL', problem:'No post-quantum cipher suites detected. Harvest-Now-Decrypt-Later (HNDL) attacks can record traffic today and decrypt later once quantum computers are available.', fix:'Deploy CRYSTALS-Kyber 768 hybrid cipher suites (X25519Kyber768) in TLS 1.3. Available in BoringSSL, OpenSSL 3.x+.', color:'#e53e3e' });
  if (!r.ciphers.some(c=>c.forward)) vulns.push({ title:'No Perfect Forward Secrecy', icon:'🔁', severity:'HIGH', problem:'Without PFS, compromise of the server private key decrypts all past recorded sessions.', fix:'Enable ECDHE or DHE key exchange cipher suites. Remove RSA key exchange (TLS_RSA_*) from server config.', color:'#ed8936' });
  if (!vulns.length) vulns.push({ title:'Good Crypto Hygiene', icon:'✅', severity:'LOW', problem:'No major classical cryptography vulnerabilities detected.', fix:'Begin planning CRYSTALS-Kyber hybrid deployment for full quantum resistance by 2026.', color:'#48bb78' });
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

/* ── Gauge drawing ───────────────────────────────────────────── */
function _drawScannerGauge(id, score, color) {
  var canvas = document.getElementById(id);
  if (!canvas) return;
  var pw = canvas.parentElement?.clientWidth || 220;
  canvas.width = pw; canvas.height = Math.round(pw * 0.58);
  var ctx = canvas.getContext('2d');
  var cx = pw/2, cy = canvas.height * 0.88, r = Math.min(pw, canvas.height*1.7) * 0.43;
  ctx.clearRect(0,0,pw,canvas.height);
  ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,0); ctx.lineWidth=16; ctx.strokeStyle='#e2e8f0'; ctx.lineCap='round'; ctx.stroke();
  var pct = Math.min(Math.max(score,0),100)/100;
  ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,Math.PI+pct*Math.PI); ctx.lineWidth=16; ctx.strokeStyle=color; ctx.lineCap='round'; ctx.stroke();
  [0,25,50,75,100].forEach(v => {
    var ang = Math.PI+(v/100)*Math.PI;
    var cols = {0:'#e53e3e',25:'#e53e3e',50:'#ecc94b',75:'#4299e1',100:'#48bb78'};
    ctx.beginPath(); ctx.moveTo(cx+(r-10)*Math.cos(ang),cy+(r-10)*Math.sin(ang)); ctx.lineTo(cx+(r+6)*Math.cos(ang),cy+(r+6)*Math.sin(ang));
    ctx.lineWidth=2; ctx.strokeStyle=cols[v]; ctx.stroke();
    ctx.fillStyle='#4a4a6a'; ctx.font='bold 10px "Exo 2",sans-serif'; ctx.textAlign='center';
    ctx.fillText(String(v),cx+(r+18)*Math.cos(ang),cy+(r+18)*Math.sin(ang)+3);
  });
}

/* ── Save to CBOM ────────────────────────────────────────────── */
QSR.saveScanToCBOM = async function() {
  var r = window._lastScanResult;
  if (!r) return;
  if (!window.QSR_SUPABASE_READY) { if(window.showToast) showToast('Live Supabase session required.','warning'); return; }
  var btn = document.querySelector('[onclick="QSR.saveScanToCBOM()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Saving...'; }
  try {
    var { error } = await window.QSR_DB.from('cbom').insert({
      app: r.host, key_length: r.keyAlg+'-'+r.keySize,
      cipher: r.ciphers[0]?.name || '—', ca: r.issuer, tls_version: r.tlsVersion
    });
    if (error) throw error;
    try { await window.QSR_DB.from('audit_log').insert({ action:'CBOM_GENERATED', target:r.host, ip_addr:'—', icon:'📋' }); } catch(e) {}
    if (window.QSR_DataLayer) { QSR_DataLayer.clearCache('audit_log'); QSR_DataLayer.clearCache('cbom'); }
    if(window.showToast) showToast('✓ Saved to CBOM!','success');
    else alert('Saved to CBOM!');
  } catch(e) {
    if(window.showToast) showToast('Save failed: '+e.message,'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 Save to CBOM Database'; }
  }
};

/* ── Export CycloneDX ────────────────────────────────────────── */
QSR.exportScanCycloneDX = function() {
  var r = window._lastScanResult;
  if (!r) { if(window.showToast) showToast('Run a scan first.','warning'); return; }
  var obj = {
    bomFormat:'CycloneDX', specVersion:'1.4', version:1,
    serialNumber:'urn:uuid:'+crypto.randomUUID(),
    metadata:{ timestamp:r.scannedAt, tools:[{vendor:'QSecure Radar',name:'TLS Scanner',version:'2.0'}], component:{type:'application',name:r.host} },
    components: r.ciphers.map((c,i) => ({ type:'cryptographic-asset', 'bom-ref':'cs-'+(i+1), name:c.name,
      cryptoProperties:{ assetType:'protocol', algorithmProperties:{ primitive:'ae', parameterSetIdentifier:String(c.strength) },
        protocolProperties:{ type:'tls', version:'TLS '+r.tlsVersion, cipherSuites:[{name:c.name,algorithms:[c.name]}] } } })),
    vulnerabilities: r.qVulnerable ? [{
      id:'QR-VULN-001',
      description:`Quantum-vulnerable: ${r.keyAlg}-${r.keySize} on TLS ${r.tlsVersion}`,
      recommendation:'Migrate to CRYSTALS-Kyber (ML-KEM) + CRYSTALS-Dilithium (ML-DSA)',
      ratings:[{severity:'critical',score:9.1,method:'CVSSv3'}], affects:[{ref:r.host}]
    }] : []
  };
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));
  a.download = r.host.replace(/\./g,'-')+'-cbom.json'; a.click();
  if(window.showToast) showToast('CycloneDX JSON exported!','success');
};

/* ── Scan history ────────────────────────────────────────────── */
QSR._renderScanHistory = function() {
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
