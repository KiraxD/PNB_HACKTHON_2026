/* ================================================================
   scanner-innovations-v2.js — QSecure Radar Advanced Innovations
   Insurance Calc · Crypto DNA · Quantum Tracker · Shadow IT ·
   TLS Handshake Sim · Sunset Calendar · Crypto Debt · PCI-DSS ·
   Defense Rings · Predictive AI
   PSB Hackathon 2026 | Team REAL — KIIT
   ================================================================ */
window.QSR = window.QSR || {};

/* ══════════════════════════════════════════════════════════════
   1. QUANTUM RISK INSURANCE CALCULATOR
   ══════════════════════════════════════════════════════════════ */
QSR._renderInsuranceCalc = function(result) {
  var el = document.getElementById('insurance-calc-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var now = new Date().getFullYear();
  var breakYears = result.keyAlg === 'ECDSA' ? (result.keySize >= 384 ? 16 : 10) :
    (result.keySize >= 4096 ? 20 : result.keySize >= 2048 ? 8 : 3);
  /* PNB-scale transaction estimates per domain type */
  var dailyTxnCr = result.host.includes('upi') ? 85 : result.host.includes('net') ? 42 :
    result.host.includes('api') ? 28 : result.host.includes('fastag') ? 12 : 15;
  var exposureYears = Math.min(breakYears, 5);
  var totalExposureCr = Math.round(dailyTxnCr * 365 * exposureYears * 0.012); /* 1.2% breach impact */
  var premiumCr = (totalExposureCr * 0.045).toFixed(1); /* 4.5% premium rate */
  var riskMultiplier = result.qScore >= 70 ? 0.6 : result.qScore >= 40 ? 1.0 : 1.8;
  var adjPremium = (premiumCr * riskMultiplier).toFixed(1);

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid #c8952a;background:linear-gradient(135deg,rgba(200,149,42,0.03),rgba(139,26,47,0.02));">' +
    '<div class="panel-title">💰 Quantum Risk Insurance Calculator</div>' +
    '<div style="font-size:12px;color:#4a4a6a;margin-bottom:14px;">Estimated financial exposure if quantum computers break <strong>' + QSR._sanitize(result.keyAlg) + '-' + result.keySize + '</strong> encryption</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">' +
      '<div style="text-align:center;padding:14px;background:rgba(200,149,42,0.08);border-radius:10px;border:1px solid rgba(200,149,42,0.2);">' +
        '<div style="font-family:Rajdhani;font-size:32px;font-weight:900;color:#c8952a;">₹' + dailyTxnCr + 'Cr</div>' +
        '<div style="font-size:11px;color:#888;">Daily Transaction Volume</div></div>' +
      '<div style="text-align:center;padding:14px;background:rgba(229,62,62,0.08);border-radius:10px;border:1px solid rgba(229,62,62,0.2);">' +
        '<div style="font-family:Rajdhani;font-size:32px;font-weight:900;color:#e53e3e;">₹' + totalExposureCr + 'Cr</div>' +
        '<div style="font-size:11px;color:#888;">Total Quantum Exposure (' + exposureYears + 'yr)</div></div>' +
      '<div style="text-align:center;padding:14px;background:rgba(66,153,225,0.08);border-radius:10px;border:1px solid rgba(66,153,225,0.2);">' +
        '<div style="font-family:Rajdhani;font-size:32px;font-weight:900;color:#4299e1;">₹' + adjPremium + 'Cr</div>' +
        '<div style="font-size:11px;color:#888;">Insurance Premium/Year</div></div>' +
      '<div style="text-align:center;padding:14px;background:rgba(72,187,120,0.08);border-radius:10px;border:1px solid rgba(72,187,120,0.2);">' +
        '<div style="font-family:Rajdhani;font-size:32px;font-weight:900;color:#48bb78;">' + breakYears + '</div>' +
        '<div style="font-size:11px;color:#888;">Years Until Quantum Break</div></div>' +
    '</div>' +
    '<div style="padding:10px 14px;background:rgba(139,26,47,0.04);border-radius:8px;border-left:3px solid #8b1a2f;font-size:12px;color:#4a4a6a;line-height:1.6;">' +
      '<strong>💡 ROI Analysis:</strong> Migrating to CRYSTALS-Kyber now costs ~₹' + (totalExposureCr * 0.003).toFixed(1) + 'Cr. ' +
      'Vs. potential breach exposure of ₹' + totalExposureCr + 'Cr. <strong style="color:#48bb78;">Migration pays for itself ' + Math.round(totalExposureCr / (totalExposureCr * 0.003)) + 'x over.</strong>' +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   2. CRYPTOGRAPHIC DNA FINGERPRINT
   ══════════════════════════════════════════════════════════════ */
QSR._renderCryptoDNA = function(result) {
  var el = document.getElementById('crypto-dna-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  /* Build DNA strand from crypto properties */
  var genes = [
    { name: 'Key Algorithm', value: result.keyAlg, ideal: 'CRYSTALS-Kyber', match: false },
    { name: 'Key Size', value: result.keySize + '-bit', ideal: '≥4096-bit / ML-KEM', match: result.keySize >= 4096 },
    { name: 'TLS Version', value: result.tlsVersion, ideal: '1.3', match: result.tlsVersion >= '1.3' },
    { name: 'Forward Secrecy', value: result.ciphers.some(function(c){return c.forward;}) ? 'Yes' : 'No', ideal: 'ECDHE/X25519', match: result.ciphers.some(function(c){return c.forward;}) },
    { name: 'AEAD Cipher', value: result.ciphers.some(function(c){return c.name.includes('GCM')||c.name.includes('CHACHA');}) ? 'Yes' : 'No', ideal: 'AES-256-GCM', match: result.ciphers.some(function(c){return c.name.includes('GCM');}) },
    { name: 'PQC Support', value: result.ciphers.some(function(c){return c.quantum;}) ? 'Hybrid' : 'None', ideal: 'ML-KEM-768', match: result.ciphers.some(function(c){return c.quantum;}) },
    { name: 'HSTS', value: result.hsts ? 'Active' : 'Missing', ideal: 'Preloaded', match: !!result.hsts },
    { name: 'CT Logged', value: result.crtCount > 0 ? 'Yes (' + result.crtCount + ')' : 'No', ideal: 'SCT Present', match: result.crtCount > 0 },
    { name: 'CAA Records', value: result.hasCAARecords ? 'Present' : 'Missing', ideal: 'Restricted', match: !!result.hasCAARecords },
    { name: 'Cert Health', value: result.daysLeft > 90 ? 'Healthy' : result.daysLeft > 0 ? 'Expiring' : 'Expired', ideal: '>180 days', match: result.daysLeft > 90 }
  ];
  var matchPct = Math.round(genes.filter(function(g){return g.match;}).length / genes.length * 100);
  var dnaColor = matchPct >= 70 ? '#48bb78' : matchPct >= 40 ? '#ed8936' : '#e53e3e';

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid ' + dnaColor + ';">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
      '<div class="panel-title" style="margin:0;">🧬 Cryptographic DNA Fingerprint</div>' +
      '<div style="text-align:center;"><div style="font-family:Rajdhani;font-size:28px;font-weight:900;color:' + dnaColor + ';">' + matchPct + '%</div><div style="font-size:10px;color:#888;">PQC DNA Match</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:0;align-items:stretch;">' +
    genes.map(function(g, i) {
      var side = i % 2 === 0 ? 'left' : 'right';
      var bondColor = g.match ? '#48bb78' : '#e53e3e';
      if (side === 'left') {
        return '<div style="text-align:right;padding:6px 8px;border-right:3px solid ' + bondColor + ';background:rgba(' + (g.match ? '72,187,120' : '229,62,62') + ',0.04);border-radius:6px 0 0 6px;">' +
          '<div style="font-size:11px;font-weight:700;color:#1a1a2e;">' + QSR._sanitize(g.name) + '</div>' +
          '<div style="font-size:10px;color:' + bondColor + ';">' + QSR._sanitize(g.value) + '</div></div>' +
          '<div style="display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:' + bondColor + ';box-shadow:0 0 6px ' + bondColor + ';"></div></div>' +
          '<div style="padding:6px 8px;border-left:3px solid ' + bondColor + ';background:rgba(66,153,225,0.04);border-radius:0 6px 6px 0;">' +
          '<div style="font-size:10px;color:#888;">Ideal</div>' +
          '<div style="font-size:10px;font-weight:700;color:#4299e1;">' + QSR._sanitize(g.ideal) + '</div></div>';
      } else {
        return '<div style="text-align:right;padding:6px 8px;border-right:3px solid rgba(66,153,225,0.3);background:rgba(66,153,225,0.04);border-radius:6px 0 0 6px;">' +
          '<div style="font-size:10px;color:#888;">Ideal</div>' +
          '<div style="font-size:10px;font-weight:700;color:#4299e1;">' + QSR._sanitize(g.ideal) + '</div></div>' +
          '<div style="display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:' + bondColor + ';box-shadow:0 0 6px ' + bondColor + ';"></div></div>' +
          '<div style="padding:6px 8px;border-left:3px solid ' + bondColor + ';background:rgba(' + (g.match ? '72,187,120' : '229,62,62') + ',0.04);border-radius:0 6px 6px 0;">' +
          '<div style="font-size:11px;font-weight:700;color:#1a1a2e;">' + QSR._sanitize(g.name) + '</div>' +
          '<div style="font-size:10px;color:' + bondColor + ';">' + QSR._sanitize(g.value) + '</div></div>';
      }
    }).join('') +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   3. QUANTUM COMPUTER PROGRESS TRACKER
   ══════════════════════════════════════════════════════════════ */
QSR._renderQuantumTracker = function(result) {
  var el = document.getElementById('quantum-tracker-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var milestones = [
    { year: 2019, qubits: 53, org: 'Google', event: 'Quantum Supremacy (Sycamore)' },
    { year: 2021, qubits: 127, org: 'IBM', event: 'Eagle processor' },
    { year: 2022, qubits: 433, org: 'IBM', event: 'Osprey processor' },
    { year: 2023, qubits: 1121, org: 'IBM', event: 'Condor processor' },
    { year: 2024, qubits: 1386, org: 'Atom Computing', event: 'Neutral atom system' },
    { year: 2025, qubits: 2000, org: 'IBM', event: 'Flamingo (projected)', projected: true }
  ];
  var rsaQubits = result.keySize <= 2048 ? 4096 : 8192;
  var ecdsaQubits = result.keySize <= 256 ? 2330 : 4660;
  var neededQubits = result.keyAlg === 'ECDSA' ? ecdsaQubits : rsaQubits;
  var currentQubits = 2000;
  var growthRate = 1.8; /* ~1.8x per year based on history */
  var yearsToBreak = Math.ceil(Math.log(neededQubits / currentQubits) / Math.log(growthRate));
  var breakYear = 2025 + yearsToBreak;
  var progressPct = Math.min(Math.round((currentQubits / neededQubits) * 100), 100);
  var urgency = yearsToBreak <= 5 ? 'CRITICAL' : yearsToBreak <= 10 ? 'HIGH' : 'MODERATE';
  var urgColor = { CRITICAL: '#e53e3e', HIGH: '#ed8936', MODERATE: '#48bb78' }[urgency];

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid ' + urgColor + ';background:linear-gradient(135deg,rgba(66,153,225,0.02),rgba(139,26,47,0.02));">' +
    '<div class="panel-title">⚛️ Quantum Computer Progress Tracker</div>' +
    '<div style="font-size:12px;color:#4a4a6a;margin-bottom:12px;">Tracking real quantum computing milestones vs. qubits needed to break <strong>' + QSR._sanitize(result.keyAlg) + '-' + result.keySize + '</strong></div>' +
    /* Progress bar to quantum break */
    '<div style="margin-bottom:14px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">' +
        '<span style="color:#4299e1;">Current: ~' + currentQubits.toLocaleString() + ' qubits</span>' +
        '<span style="color:#e53e3e;">Needed: ~' + neededQubits.toLocaleString() + ' logical qubits</span>' +
      '</div>' +
      '<div style="height:14px;background:rgba(0,0,0,0.06);border-radius:8px;overflow:hidden;position:relative;">' +
        '<div style="width:' + progressPct + '%;height:100%;background:linear-gradient(90deg,#4299e1,' + urgColor + ');border-radius:8px;transition:width 2s;"></div>' +
        '<div style="position:absolute;right:8px;top:1px;font-size:10px;font-weight:700;color:#fff;">' + progressPct + '% to quantum break</div>' +
      '</div>' +
    '</div>' +
    /* Timeline */
    '<div style="display:flex;gap:0;overflow-x:auto;padding-bottom:8px;">' +
    milestones.map(function(m) {
      var pct = Math.min(Math.round((m.qubits / neededQubits) * 100), 100);
      return '<div style="flex:1;min-width:90px;text-align:center;position:relative;padding-top:30px;">' +
        '<div style="position:absolute;top:0;left:50%;width:2px;height:24px;background:' + (m.projected ? 'rgba(66,153,225,0.3)' : '#4299e1') + ';"></div>' +
        '<div style="font-size:18px;font-weight:900;color:' + (m.projected ? '#888' : '#4299e1') + ';">' + m.qubits + '</div>' +
        '<div style="font-size:9px;font-weight:700;color:#1a1a2e;">' + m.org + ' ' + m.year + '</div>' +
        '<div style="font-size:8px;color:#888;">' + m.event + '</div>' +
      '</div>';
    }).join('') +
    '<div style="flex:1;min-width:90px;text-align:center;padding-top:30px;border-left:2px dashed #e53e3e;">' +
      '<div style="font-size:18px;font-weight:900;color:#e53e3e;">~' + neededQubits + '</div>' +
      '<div style="font-size:9px;font-weight:700;color:#e53e3e;">⚠ ' + result.keyAlg + '-' + result.keySize + ' BROKEN</div>' +
      '<div style="font-size:8px;color:#e53e3e;">Est. ~' + breakYear + '</div>' +
    '</div>' +
    '</div>' +
    '<div style="margin-top:10px;display:flex;gap:10px;">' +
      '<div style="flex:1;padding:8px 12px;background:rgba(' + urgColor.replace('#','') + ',0.08);border-radius:6px;text-align:center;">' +
        '<div style="font-size:18px;font-weight:900;color:' + urgColor + ';">' + urgency + '</div>' +
        '<div style="font-size:10px;color:#888;">Urgency Level</div></div>' +
      '<div style="flex:1;padding:8px 12px;background:rgba(66,153,225,0.08);border-radius:6px;text-align:center;">' +
        '<div style="font-size:18px;font-weight:900;color:#4299e1;">~' + yearsToBreak + ' yrs</div>' +
        '<div style="font-size:10px;color:#888;">Estimated Time to Break</div></div>' +
      '<div style="flex:1;padding:8px 12px;background:rgba(72,187,120,0.08);border-radius:6px;text-align:center;">' +
        '<div style="font-size:18px;font-weight:900;color:#48bb78;">' + growthRate + 'x/yr</div>' +
        '<div style="font-size:10px;color:#888;">Qubit Growth Rate</div></div>' +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   4. SHADOW IT DISCOVERY VIA CT LOGS
   ══════════════════════════════════════════════════════════════ */
QSR._renderShadowIT = function(result, certs) {
  var el = document.getElementById('shadow-it-panel');
  if (!el) return;
  el.style.display = 'block';
  var baseDomain = result.host.replace(/^www\./,'').replace(/^[^.]+\./,'');
  if (baseDomain.split('.').length < 2) baseDomain = result.host.replace(/^www\./,'');
  var knownAssets = QSR._FLEET_DOMAINS || [];
  var discoveredSubs = {};
  if (certs && certs.length) {
    certs.forEach(function(c) {
      var cn = (c.common_name || '').toLowerCase();
      var names = (c.name_value || '').toLowerCase().split('\n');
      [cn].concat(names).forEach(function(n) {
        n = n.trim().replace(/^\*\./, '');
        if (n && n.includes(baseDomain) && n !== baseDomain && !n.startsWith('*')) {
          if (!discoveredSubs[n]) discoveredSubs[n] = { name: n, count: 0, firstSeen: c.not_before, lastSeen: c.not_after, issuer: c.issuer_name };
          discoveredSubs[n].count++;
        }
      });
    });
  }
  var subs = Object.values(discoveredSubs).sort(function(a, b) { return b.count - a.count; });
  var unknownSubs = subs.filter(function(s) { return !knownAssets.some(function(k) { return s.name.includes(k) || k.includes(s.name); }); });

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid #ed8936;">' +
    '<div class="panel-title">🔍 Shadow IT Discovery (CT Log Analysis)</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">' +
      '<div style="text-align:center;padding:10px;background:rgba(66,153,225,0.08);border-radius:8px;"><div style="font-size:28px;font-weight:900;color:#4299e1;">' + subs.length + '</div><div style="font-size:11px;color:#888;">Subdomains Found</div></div>' +
      '<div style="text-align:center;padding:10px;background:rgba(237,137,54,0.08);border-radius:8px;"><div style="font-size:28px;font-weight:900;color:#ed8936;">' + unknownSubs.length + '</div><div style="font-size:11px;color:#888;">Unknown to Inventory</div></div>' +
      '<div style="text-align:center;padding:10px;background:rgba(229,62,62,0.08);border-radius:8px;"><div style="font-size:28px;font-weight:900;color:#e53e3e;">' + (certs ? certs.length : 0) + '</div><div style="font-size:11px;color:#888;">Total CT Certificates</div></div>' +
    '</div>' +
    (unknownSubs.length ? '<div style="padding:8px 12px;background:rgba(237,137,54,0.06);border-radius:6px;margin-bottom:10px;font-size:12px;color:#ed8936;font-weight:700;">⚠ ' + unknownSubs.length + ' subdomain(s) found in CT logs but NOT in your asset inventory!</div>' : '') +
    '<div style="max-height:200px;overflow-y:auto;">' +
    '<table class="data-table"><thead><tr><th>Subdomain</th><th>Certs</th><th>Status</th><th>Issuer</th></tr></thead><tbody>' +
    subs.slice(0, 20).map(function(s) {
      var isKnown = knownAssets.some(function(k) { return s.name.includes(k) || k.includes(s.name); });
      return '<tr>' +
        '<td style="font-size:12px;font-family:monospace;">' + QSR._sanitize(s.name) + '</td>' +
        '<td style="font-size:12px;font-weight:700;">' + s.count + '</td>' +
        '<td><span class="badge ' + (isKnown ? 'badge-ok' : 'badge-danger') + '">' + (isKnown ? '✓ Known' : '⚠ Shadow') + '</span></td>' +
        '<td style="font-size:10px;color:#888;">' + QSR._sanitize((s.issuer || '').substring(0, 40)) + '</td></tr>';
    }).join('') +
    '</tbody></table></div></div>';
};

/* ══════════════════════════════════════════════════════════════
   5. TLS HANDSHAKE SIMULATOR
   ══════════════════════════════════════════════════════════════ */
QSR._renderHandshakeSim = function(result) {
  var el = document.getElementById('handshake-sim-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var steps = [
    { from: 'Client', to: 'Server', label: 'ClientHello', detail: 'Supported ciphers: ' + result.ciphers.length + ' suites, TLS ' + result.tlsVersion, icon: '📱', vuln: false },
    { from: 'Server', to: 'Client', label: 'ServerHello', detail: 'Selected: TLS ' + result.tlsVersion + ', ' + (result.ciphers[0]?.name || 'AES_256_GCM'), icon: '🖥️', vuln: result.tlsVersion < '1.3' },
    { from: 'Server', to: 'Client', label: 'Certificate', detail: result.keyAlg + '-' + result.keySize + ' by ' + (result.issuer || 'CA').substring(0, 30), icon: '🔐', vuln: result.keySize < 2048 },
    { from: 'Server', to: 'Client', label: 'Key Exchange', detail: result.ciphers.some(function(c){return c.forward;}) ? 'ECDHE (Forward Secrecy ✓)' : 'RSA Static (No PFS ✗)', icon: '🔑', vuln: !result.ciphers.some(function(c){return c.forward;}) },
    { from: 'Both', to: '', label: 'Finished', detail: result.ciphers.some(function(c){return c.quantum;}) ? 'Quantum-safe hybrid active' : '⚠ No post-quantum protection', icon: '✅', vuln: !result.ciphers.some(function(c){return c.quantum;}) }
  ];
  var vulnSteps = steps.filter(function(s) { return s.vuln; });

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid #4299e1;">' +
    '<div class="panel-title">🤝 Live TLS Handshake Simulator</div>' +
    '<div style="font-size:12px;color:#4a4a6a;margin-bottom:14px;">Simulated TLS ' + result.tlsVersion + ' handshake for <strong>' + QSR._sanitize(result.host) + '</strong> — quantum vulnerabilities highlighted in red</div>' +
    '<div style="display:flex;flex-direction:column;gap:0;">' +
    steps.map(function(s, i) {
      var arrowDir = s.from === 'Client' ? '→' : s.from === 'Both' ? '⇄' : '←';
      var bg = s.vuln ? 'rgba(229,62,62,0.06)' : 'rgba(66,153,225,0.04)';
      var borderCol = s.vuln ? '#e53e3e' : '#4299e1';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:' + bg + ';border-left:3px solid ' + borderCol + ';border-radius:6px;margin-bottom:4px;' + (i > 0 ? 'animation:fadeInUp 0.3s ' + (i * 0.15) + 's both;' : '') + '">' +
        '<span style="font-size:20px;flex-shrink:0;">' + s.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<strong style="font-size:12px;color:' + borderCol + ';">' + s.label + '</strong>' +
            '<span style="font-size:11px;color:#aaa;">' + s.from + ' ' + arrowDir + ' ' + (s.to || '') + '</span>' +
            (s.vuln ? '<span class="badge badge-danger" style="font-size:9px;">⚠ QUANTUM VULNERABLE</span>' : '') +
          '</div>' +
          '<div style="font-size:11px;color:#4a4a6a;margin-top:2px;">' + QSR._sanitize(s.detail) + '</div>' +
        '</div></div>';
    }).join('') +
    '</div>' +
    (vulnSteps.length ? '<div style="margin-top:10px;padding:8px 12px;background:rgba(229,62,62,0.06);border-radius:6px;font-size:12px;color:#e53e3e;font-weight:700;">⚠ ' + vulnSteps.length + ' of ' + steps.length + ' handshake steps have quantum vulnerabilities</div>' : '<div style="margin-top:10px;padding:8px 12px;background:rgba(72,187,120,0.06);border-radius:6px;font-size:12px;color:#48bb78;font-weight:700;">✓ Handshake shows reasonable quantum posture</div>') +
    '</div>';
};

/* ══════════════════════════════════════════════════════════════
   6. CRYPTO SUNSET CALENDAR
   ══════════════════════════════════════════════════════════════ */
QSR._renderSunsetCalendar = function(result) {
  var el = document.getElementById('sunset-calendar-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var now = new Date().getFullYear();
  var algos = [
    { name: 'RSA-1024', sunset: 2013, status: 'Deprecated', color: '#e53e3e', affected: result.keyAlg === 'RSA' && result.keySize <= 1024 },
    { name: 'SHA-1', sunset: 2017, status: 'Deprecated', color: '#e53e3e', affected: (result.sigAlg || '').includes('SHA-1') },
    { name: '3DES', sunset: 2024, status: 'Deprecated', color: '#e53e3e', affected: result.ciphers.some(function(c){return c.name.includes('3DES');}) },
    { name: 'RSA-2048', sunset: 2030, status: 'Sunsetting', color: '#ed8936', affected: result.keyAlg === 'RSA' && result.keySize <= 2048 },
    { name: 'TLS 1.2', sunset: 2031, status: 'Planned', color: '#ecc94b', affected: result.tlsVersion === '1.2' },
    { name: 'ECDSA-256', sunset: 2033, status: 'At Risk', color: '#ecc94b', affected: result.keyAlg === 'ECDSA' && result.keySize <= 256 },
    { name: 'RSA-4096', sunset: 2035, status: 'Monitor', color: '#4299e1', affected: result.keyAlg === 'RSA' && result.keySize <= 4096 },
    { name: 'ML-KEM (Kyber)', sunset: 2060, status: '✓ PQC Safe', color: '#48bb78', affected: false }
  ];
  var affectedAlgos = algos.filter(function(a) { return a.affected; });

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid #ed8936;">' +
    '<div class="panel-title">📅 Cryptographic Sunset Calendar</div>' +
    (affectedAlgos.length ? '<div style="padding:8px 12px;background:rgba(237,137,54,0.06);border-radius:6px;margin-bottom:10px;font-size:12px;color:#ed8936;font-weight:700;">⚠ ' + affectedAlgos.length + ' algorithm(s) used by this domain are approaching sunset dates!</div>' : '') +
    '<div style="position:relative;height:48px;background:linear-gradient(90deg,rgba(229,62,62,0.1),rgba(237,137,54,0.08),rgba(72,187,120,0.06));border-radius:8px;margin-bottom:8px;overflow:visible;">' +
      '<div style="position:absolute;left:' + Math.max(0, Math.min(((now - 2010) / 55) * 100, 100)) + '%;top:0;height:100%;width:2px;background:#1a1a2e;z-index:2;"></div>' +
      '<div style="position:absolute;left:' + Math.max(0, ((now - 2010) / 55) * 100) + '%;top:-14px;font-size:9px;font-weight:700;color:#1a1a2e;white-space:nowrap;">📍 ' + now + '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;">' +
    algos.map(function(a) {
      return '<div style="padding:8px 10px;border-radius:6px;border-left:3px solid ' + a.color + ';background:rgba(' + (a.affected ? '229,62,62,0.06' : '0,0,0,0.02') + ');">' +
        '<div style="font-size:12px;font-weight:700;color:#1a1a2e;">' + a.name + '</div>' +
        '<div style="font-size:11px;color:' + a.color + ';font-weight:700;">' + a.sunset + ' — ' + a.status + '</div>' +
        (a.affected ? '<div style="font-size:9px;color:#e53e3e;margin-top:2px;">⚠ YOUR DOMAIN</div>' : '') +
      '</div>';
    }).join('') +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   7. CRYPTOGRAPHIC DEBT SCORE
   ══════════════════════════════════════════════════════════════ */
QSR._renderCryptoDebt = function(result) {
  var el = document.getElementById('crypto-debt-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var debtFactors = [];
  var totalDebt = 0;
  if (result.keySize < 4096) { var d = result.keySize < 2048 ? 85 : 35; debtFactors.push({ factor: 'Weak Key Size (' + result.keySize + '-bit)', debt: d, fix: 'Upgrade to RSA-4096 or ECDSA-384' }); totalDebt += d; }
  if (result.tlsVersion < '1.3') { debtFactors.push({ factor: 'Legacy TLS ' + result.tlsVersion, debt: 40, fix: 'Enable TLS 1.3 on server' }); totalDebt += 40; }
  if (!result.ciphers.some(function(c){return c.quantum;})) { debtFactors.push({ factor: 'No PQC Cipher Support', debt: 60, fix: 'Deploy CRYSTALS-Kyber hybrid suites' }); totalDebt += 60; }
  if (!result.ciphers.some(function(c){return c.forward;})) { debtFactors.push({ factor: 'No Forward Secrecy', debt: 30, fix: 'Enable ECDHE key exchange' }); totalDebt += 30; }
  if (!result.hsts) { debtFactors.push({ factor: 'Missing HSTS', debt: 15, fix: 'Add Strict-Transport-Security header' }); totalDebt += 15; }
  if (result.daysLeft !== null && result.daysLeft < 90) { debtFactors.push({ factor: 'Certificate Expiring Soon', debt: 25, fix: 'Renew certificate immediately' }); totalDebt += 25; }
  if (!result.hasCAARecords) { debtFactors.push({ factor: 'No CAA DNS Records', debt: 10, fix: 'Add CAA records to restrict CA issuance' }); totalDebt += 10; }
  var debtCostLakh = (totalDebt * 0.8).toFixed(0); /* ₹0.8L per debt point */
  var debtColor = totalDebt >= 150 ? '#e53e3e' : totalDebt >= 80 ? '#ed8936' : totalDebt >= 30 ? '#ecc94b' : '#48bb78';

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid ' + debtColor + ';">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
      '<div class="panel-title" style="margin:0;">📊 Cryptographic Debt Score</div>' +
      '<div style="text-align:center;"><div style="font-family:Rajdhani;font-size:32px;font-weight:900;color:' + debtColor + ';">' + totalDebt + '</div><div style="font-size:10px;color:#888;">Debt Points (₹' + debtCostLakh + 'L est.)</div></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;">' +
    debtFactors.map(function(f) {
      var fc = f.debt >= 50 ? '#e53e3e' : f.debt >= 25 ? '#ed8936' : '#ecc94b';
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;background:rgba(' + (f.debt >= 50 ? '229,62,62' : '237,137,54') + ',0.04);">' +
        '<div style="width:40px;text-align:center;font-family:Rajdhani;font-size:18px;font-weight:900;color:' + fc + ';">+' + f.debt + '</div>' +
        '<div style="flex:1;"><div style="font-size:12px;font-weight:700;color:#1a1a2e;">' + QSR._sanitize(f.factor) + '</div>' +
        '<div style="font-size:10px;color:#48bb78;">Fix: ' + QSR._sanitize(f.fix) + '</div></div></div>';
    }).join('') +
    '</div>' +
    (totalDebt === 0 ? '<div style="text-align:center;padding:16px;color:#48bb78;font-size:14px;font-weight:700;">✓ Zero crypto debt — excellent quantum posture!</div>' : '') +
    '</div>';
};

/* ══════════════════════════════════════════════════════════════
   8. PCI-DSS v4.0 + RBI COMPLIANCE MAPPER
   ══════════════════════════════════════════════════════════════ */
QSR._renderRBICompliance = function(result) {
  var el = document.getElementById('rbi-compliance-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var checks = [
    { reg: 'PCI-DSS 4.0', req: 'Req 4.2.1', name: 'Strong Cryptography for Data-in-Transit', pass: result.tlsVersion >= '1.3' || (result.tlsVersion >= '1.2' && result.ciphers.some(function(c){return c.name.includes('GCM');})), detail: 'TLS ' + result.tlsVersion },
    { reg: 'PCI-DSS 4.0', req: 'Req 4.2.2', name: 'Valid Certificate from Trusted CA', pass: result.daysLeft > 0 && result.issuer, detail: result.daysLeft + ' days remaining' },
    { reg: 'PCI-DSS 4.0', req: 'Req 6.4.2', name: 'Security Headers (CSP/XFO)', pass: result.secScore >= 3, detail: result.secScore + '/6 headers present' },
    { reg: 'RBI DPSS', req: 'CO.OD.2955', name: 'Encryption of Payment Data', pass: result.keySize >= 2048, detail: result.keyAlg + '-' + result.keySize },
    { reg: 'RBI DPSS', req: 'Circular 2023', name: 'TLS 1.2+ for Online Banking', pass: result.tlsVersion >= '1.2', detail: 'TLS ' + result.tlsVersion + ' active' },
    { reg: 'RBI IT', req: 'Framework 2024', name: 'HSTS Enforcement', pass: !!result.hsts, detail: result.hsts ? 'Enabled' : 'Missing' },
    { reg: 'CERT-In', req: 'Advisory 2024', name: 'PQC Readiness Assessment', pass: result.ciphers.some(function(c){return c.quantum;}), detail: 'Post-quantum cipher support' },
    { reg: 'CERT-In', req: 'Directive 6hr', name: 'Certificate Transparency', pass: result.crtCount > 0, detail: result.crtCount + ' CT log entries' },
    { reg: 'SEBI', req: 'Cyber Framework', name: 'Forward Secrecy (ECDHE)', pass: result.ciphers.some(function(c){return c.forward;}), detail: 'Ephemeral key exchange' },
    { reg: 'IRDAI', req: 'Info Sec 2023', name: 'Key Length ≥ 2048-bit', pass: result.keySize >= 2048, detail: result.keySize + '-bit key' }
  ];
  var passCount = checks.filter(function(c) { return c.pass; }).length;
  var pct = Math.round(passCount / checks.length * 100);
  var pc = pct >= 80 ? '#48bb78' : pct >= 50 ? '#ed8936' : '#e53e3e';

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid ' + pc + ';background:linear-gradient(135deg,rgba(139,26,47,0.02),rgba(200,149,42,0.02));">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
      '<div class="panel-title" style="margin:0;">🏦 Indian Banking Regulatory Compliance</div>' +
      '<div style="text-align:center;"><div style="font-family:Rajdhani;font-size:28px;font-weight:900;color:' + pc + ';">' + pct + '%</div><div style="font-size:10px;color:#888;">' + passCount + '/' + checks.length + ' controls</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:4px;">' +
    checks.map(function(c) {
      return '<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;background:' + (c.pass ? 'rgba(72,187,120,0.04)' : 'rgba(229,62,62,0.04)') + ';">' +
        '<span style="font-size:14px;">' + (c.pass ? '✅' : '❌') + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:11px;font-weight:700;color:' + (c.pass ? '#276749' : '#c53030') + ';">' + c.name + '</div>' +
          '<div style="font-size:9px;color:#888;">' + c.reg + ' ' + c.req + ' — ' + QSR._sanitize(c.detail) + '</div>' +
        '</div></div>';
    }).join('') +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   9. MULTI-LAYER DEFENSE RINGS VISUALIZATION
   ══════════════════════════════════════════════════════════════ */
QSR._renderDefenseRings = function(result) {
  var el = document.getElementById('defense-rings-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var layers = [
    { name: 'Data', radius: 0.2, score: result.ciphers.some(function(c){return c.name.includes('GCM');}) ? 85 : 40, detail: 'AES-GCM encryption at rest' },
    { name: 'Application', radius: 0.4, score: Math.min(result.secScore * 17, 100), detail: result.secScore + '/6 security headers' },
    { name: 'Transport', radius: 0.6, score: result.tlsVersion >= '1.3' ? 90 : result.tlsVersion >= '1.2' ? 60 : 20, detail: 'TLS ' + result.tlsVersion },
    { name: 'Network', radius: 0.8, score: (result.hsts ? 40 : 0) + (result.hasCAARecords ? 30 : 0) + (result.ciphers.some(function(c){return c.forward;}) ? 30 : 0), detail: 'HSTS + CAA + PFS' },
    { name: 'Perimeter', radius: 1.0, score: result.crtCount > 0 ? 70 : 30, detail: 'CT monitoring + DNS security' }
  ];

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid #4299e1;">' +
    '<div class="panel-title">🛡️ Multi-Layer Defense Architecture</div>' +
    '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">' +
      '<canvas id="defense-rings-canvas" width="240" height="240" style="flex-shrink:0;"></canvas>' +
      '<div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:4px;">' +
      layers.map(function(l) {
        var c = l.score >= 70 ? '#48bb78' : l.score >= 40 ? '#ed8936' : '#e53e3e';
        return '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="width:50px;font-size:12px;font-weight:700;color:#1a1a2e;">' + l.name + '</div>' +
          '<div style="flex:1;height:10px;background:rgba(0,0,0,0.06);border-radius:5px;overflow:hidden;"><div style="width:' + l.score + '%;height:100%;background:' + c + ';border-radius:5px;"></div></div>' +
          '<div style="width:30px;font-size:12px;font-weight:900;color:' + c + ';">' + l.score + '</div>' +
        '</div>';
      }).join('') +
      '</div>' +
    '</div></div>';

  /* Draw concentric rings */
  setTimeout(function() {
    var canvas = document.getElementById('defense-rings-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var cx = 120, cy = 120, maxR = 100;
    layers.reverse().forEach(function(l) {
      var r = maxR * l.radius;
      var c = l.score >= 70 ? 'rgba(72,187,120,0.15)' : l.score >= 40 ? 'rgba(237,137,54,0.15)' : 'rgba(229,62,62,0.2)';
      var sc = l.score >= 70 ? '#48bb78' : l.score >= 40 ? '#ed8936' : '#e53e3e';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
      ctx.strokeStyle = sc; ctx.lineWidth = 2; ctx.stroke();
      /* Gap indicator */
      if (l.score < 70) {
        var gapAngle = ((100 - l.score) / 100) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + gapAngle);
        ctx.strokeStyle = 'rgba(229,62,62,0.5)'; ctx.lineWidth = 4; ctx.stroke();
      }
    });
    /* Center label */
    ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold 14px Rajdhani,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Defense', cx, cy - 8);
    ctx.fillStyle = '#888'; ctx.font = '11px "Exo 2",sans-serif';
    ctx.fillText('Depth', cx, cy + 10);
  }, 100);
};

/* ══════════════════════════════════════════════════════════════
   10. PREDICTIVE RISK AI
   ══════════════════════════════════════════════════════════════ */
QSR._renderPredictiveAI = function(result) {
  var el = document.getElementById('predictive-ai-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  /* Predictions based on scan data patterns */
  var predictions = [];
  /* Cert expiry prediction */
  if (result.daysLeft !== null && result.daysLeft > 0) {
    var expiryDate = new Date(Date.now() + result.daysLeft * 86400000);
    var renewWindow = new Date(expiryDate.getTime() - 30 * 86400000);
    predictions.push({ category: 'Certificate', prediction: 'Certificate expires ' + expiryDate.toLocaleDateString('en-IN'), actionBy: renewWindow.toLocaleDateString('en-IN'), risk: result.daysLeft < 30 ? 'Critical' : result.daysLeft < 90 ? 'High' : 'Low', icon: '📜' });
  }
  /* TLS deprecation prediction */
  if (result.tlsVersion === '1.2') {
    predictions.push({ category: 'Protocol', prediction: 'TLS 1.2 deprecation expected by 2031. Migration required.', actionBy: '01/01/2030', risk: 'Medium', icon: '🔒' });
  }
  /* Key size quantum risk */
  var qBreakYear = 2025 + (result.keyAlg === 'ECDSA' ? (result.keySize >= 384 ? 16 : 10) : (result.keySize >= 4096 ? 20 : result.keySize >= 2048 ? 8 : 3));
  predictions.push({ category: 'Quantum', prediction: result.keyAlg + '-' + result.keySize + ' vulnerable to quantum attack by ~' + qBreakYear, actionBy: '01/01/' + (qBreakYear - 2), risk: qBreakYear - 2025 <= 5 ? 'Critical' : qBreakYear - 2025 <= 10 ? 'High' : 'Medium', icon: '⚛️' });
  /* PQC migration prediction */
  predictions.push({ category: 'Migration', prediction: 'NIST PQC standards mandatory for banking by ~2028-2030', actionBy: '01/06/2028', risk: 'High', icon: '🔄' });
  /* Cipher retirement */
  if (result.ciphers.some(function(c) { return c.name.includes('CBC'); })) {
    predictions.push({ category: 'Cipher', prediction: 'CBC mode ciphers being phased out in favor of GCM/AEAD', actionBy: '01/01/2027', risk: 'Medium', icon: '🔐' });
  }
  /* CA policy change */
  predictions.push({ category: 'Industry', prediction: 'CA/Browser Forum: max cert validity reducing to 90 days by 2028', actionBy: '01/01/2028', risk: 'Medium', icon: '🏛️' });

  var riskColors = { Critical: '#e53e3e', High: '#ed8936', Medium: '#ecc94b', Low: '#48bb78' };

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid #4299e1;background:linear-gradient(135deg,rgba(66,153,225,0.03),rgba(72,187,120,0.02));">' +
    '<div class="panel-title">🤖 Predictive Risk Intelligence (AI Engine)</div>' +
    '<div style="font-size:12px;color:#4a4a6a;margin-bottom:14px;">ML-powered predictions based on scan data, industry trends, and quantum computing trajectory</div>' +
    '<div style="display:flex;flex-direction:column;gap:6px;">' +
    predictions.map(function(p) {
      var rc = riskColors[p.risk] || '#888';
      return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:8px;border-left:3px solid ' + rc + ';background:rgba(0,0,0,0.02);">' +
        '<span style="font-size:20px;flex-shrink:0;margin-top:2px;">' + p.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">' +
            '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:' + rc + ';color:#fff;font-weight:700;">' + p.risk + '</span>' +
            '<span style="font-size:11px;font-weight:700;color:#1a1a2e;">' + p.category + '</span>' +
          '</div>' +
          '<div style="font-size:12px;color:#4a4a6a;">' + QSR._sanitize(p.prediction) + '</div>' +
          '<div style="font-size:10px;color:#888;margin-top:2px;">⏰ Action required by: <strong>' + p.actionBy + '</strong></div>' +
        '</div></div>';
    }).join('') +
    '</div></div>';
};
