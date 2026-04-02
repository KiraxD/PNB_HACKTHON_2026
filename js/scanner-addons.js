/* ================================================================
   scanner-addons.js — QSecure Radar Scanner Innovations
   Fleet Scanner · HNDL Timeline · PQC Migration Cost ·
   Cert Chain · Threat Radar · Scan Diff · NIST Compliance ·
   DNS Intelligence · Security Utilities
   QSecure Radar | PSB Hackathon 2026 | Team REAL
   ================================================================ */

window.QSR = window.QSR || {};

/* ══════════════════════════════════════════════════════════════
   SECURITY UTILITIES — XSS Prevention + Rate Limiting
   ══════════════════════════════════════════════════════════════ */

QSR._sanitize = function(str) {
  if (str === null || str === undefined) return '';
  var div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
};

QSR._rateLimiter = {
  _scans: [],
  MAX_PER_MIN: 12,
  check: function() {
    var now = Date.now();
    this._scans = this._scans.filter(function(t){ return now - t < 60000; });
    if (this._scans.length >= this.MAX_PER_MIN) return false;
    this._scans.push(now);
    return true;
  }
};

/* ══════════════════════════════════════════════════════════════
   1. FLEET SCANNER — Scan all PNB domains in parallel
   ══════════════════════════════════════════════════════════════ */

QSR._FLEET_DOMAINS = [
  'www.netpnb.com','api.pnb.co.in','upi.pnb.co.in',
  'fastag.pnbindia.in','netpnb.com'
];

QSR.runFleetScan = async function() {
  if (!QSR._rateLimiter.check()) {
    if (window.showToast) showToast('Rate limit: max 12 scans/min. Wait and retry.','warning');
    return;
  }
  var panel = document.getElementById('fleet-results');
  var btn   = document.getElementById('btn-fleet-scan');
  if (!panel || !btn) return;
  btn.disabled = true; btn.innerHTML = '⏳ Fleet scanning...';
  panel.style.display = 'block';
  panel.innerHTML = '<div style="text-align:center;padding:30px;color:#4299e1;font-size:14px;">⏳ Scanning ' + QSR._FLEET_DOMAINS.length + ' domains in parallel...</div>';

  try {
    var results = await Promise.allSettled(
      QSR._FLEET_DOMAINS.map(function(h){ return QSR._fetchOneScan(h).then(function(r){ return {host:h, result:r, ok:true}; }); })
    );
    var completed = results.map(function(r){
      return r.status === 'fulfilled' ? r.value : {host:'?', result:null, ok:false};
    }).filter(function(r){ return r.ok && r.result; });
    QSR._renderFleetResults(completed);
  } catch(e) {
    panel.innerHTML = '<div style="color:#e53e3e;padding:20px;">Fleet scan failed: '+QSR._sanitize(e.message)+'</div>';
  } finally {
    btn.disabled = false; btn.innerHTML = '🚀 Fleet Scan All PNB';
  }
};

QSR._renderFleetResults = function(results) {
  var panel = document.getElementById('fleet-results');
  if (!panel || !results.length) return;
  var avgScore = Math.round(results.reduce(function(s,r){ return s+(r.result.qScore||0); },0)/results.length);
  var worst = results.reduce(function(w,r){ return (r.result.qScore||100) < (w.result.qScore||100) ? r : w; }, results[0]);
  var best  = results.reduce(function(b,r){ return (r.result.qScore||0) > (b.result.qScore||0) ? r : b; }, results[0]);
  var vulnCount = results.filter(function(r){ return r.result.qVulnerable; }).length;
  var scoreCol = function(s){ return s >= 70 ? '#48bb78' : s >= 40 ? '#ed8936' : '#e53e3e'; };

  panel.innerHTML =
    '<div class="panel" style="border-left:4px solid #4299e1;">' +
    '<div class="panel-title">🚀 Fleet Scan Results — ' + results.length + ' Domains Analysed</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;">' +
      '<div style="background:rgba(66,153,225,0.08);padding:12px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:900;color:'+scoreCol(avgScore)+';">'+avgScore+'</div><div style="font-size:11px;color:#888;">Avg QR Score</div></div>' +
      '<div style="background:rgba(229,62,62,0.08);padding:12px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:900;color:#e53e3e;">'+vulnCount+'</div><div style="font-size:11px;color:#888;">Quantum Vulnerable</div></div>' +
      '<div style="background:rgba(72,187,120,0.08);padding:12px;border-radius:8px;text-align:center;"><div style="font-size:14px;font-weight:700;color:#48bb78;margin-top:4px;">'+QSR._sanitize(best.host)+'</div><div style="font-size:11px;color:#888;">Best: QR '+best.result.qScore+'</div></div>' +
      '<div style="background:rgba(237,137,54,0.08);padding:12px;border-radius:8px;text-align:center;"><div style="font-size:14px;font-weight:700;color:#ed8936;margin-top:4px;">'+QSR._sanitize(worst.host)+'</div><div style="font-size:11px;color:#888;">Worst: QR '+worst.result.qScore+'</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">' +
    results.map(function(r){
      var s = r.result; var c = scoreCol(s.qScore);
      return '<div style="border:1px solid rgba(0,0,0,0.08);border-left:4px solid '+c+';border-radius:8px;padding:12px;background:rgba(255,255,255,0.6);cursor:pointer;" onclick="document.getElementById(\'scan-input\').value=\''+QSR._sanitize(r.host)+'\';QSR.runTLSScan();">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<strong style="font-size:13px;">'+QSR._sanitize(r.host)+'</strong>' +
          '<span style="font-family:Rajdhani;font-size:24px;font-weight:900;color:'+c+';">'+s.qScore+'</span>' +
        '</div>' +
        '<div style="font-size:11px;color:#888;">Grade: <strong>'+QSR._sanitize(s.grade)+'</strong> · TLS '+QSR._sanitize(s.tlsVersion)+' · '+QSR._sanitize(s.keyAlg)+'-'+s.keySize+'</div>' +
        '<div style="margin-top:4px;">'+(s.qVulnerable?'<span class="badge badge-danger">⚠ Quantum Vulnerable</span>':'<span class="badge badge-ok">✓ Adequate</span>')+'</div>' +
      '</div>';
    }).join('') +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   2. DNS INTELLIGENCE — CAA, SPF, DMARC
   ══════════════════════════════════════════════════════════════ */

QSR._parseDNSSecurity = function(host, caaRecords, txtRecords) {
  var intel = { caa:[], spf:null, dmarc:null, dnssec:false, score:0, findings:[] };
  if (caaRecords && caaRecords.length) {
    intel.caa = caaRecords;
    intel.score += 20;
    intel.findings.push({ok:true, label:'CAA Records Present', detail:caaRecords.length+' CA authorization records found'});
  } else {
    intel.findings.push({ok:false, label:'No CAA Records', detail:'Any CA can issue certificates for this domain'});
  }
  if (txtRecords) {
    txtRecords.forEach(function(t){
      if (t.startsWith('v=spf1')) { intel.spf = t; intel.score += 15; intel.findings.push({ok:true, label:'SPF Record', detail:'Email sender policy configured'}); }
      if (t.startsWith('v=DMARC1')) { intel.dmarc = t; intel.score += 15; intel.findings.push({ok:true, label:'DMARC Record', detail:'Email authentication policy active'}); }
    });
  }
  if (!intel.spf) intel.findings.push({ok:false, label:'No SPF Record', detail:'Email spoofing protection missing'});
  if (!intel.dmarc) intel.findings.push({ok:false, label:'No DMARC Record', detail:'No DMARC policy — phishing risk'});
  return intel;
};

QSR._renderDNSIntelligence = function(dnsIntel, dnsData) {
  var el = document.getElementById('dns-intel-panel');
  if (!el || !dnsIntel) return;
  el.style.display = 'block';
  var sc = dnsIntel.score >= 40 ? '#48bb78' : dnsIntel.score >= 20 ? '#ed8936' : '#e53e3e';
  el.innerHTML =
    '<div class="panel" style="border-left:4px solid '+sc+';">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div class="panel-title" style="margin:0;">🌐 DNS Security Intelligence</div>' +
      '<div style="font-family:Rajdhani;font-size:28px;font-weight:900;color:'+sc+';">'+dnsIntel.score+'<span style="font-size:12px;color:#888;">/50</span></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;">' +
    dnsIntel.findings.map(function(f){
      return '<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:'+(f.ok?'rgba(72,187,120,0.05)':'rgba(229,62,62,0.05)')+';">' +
        '<span style="font-size:14px;">'+(f.ok?'✅':'❌')+'</span>' +
        '<div><div style="font-weight:700;font-size:12px;color:'+(f.ok?'#48bb78':'#e53e3e')+';">'+QSR._sanitize(f.label)+'</div>' +
        '<div style="font-size:11px;color:#888;">'+QSR._sanitize(f.detail)+'</div></div></div>';
    }).join('') +
    '</div>' +
    (dnsData && dnsData.ns && dnsData.ns.length ? '<div style="margin-top:10px;padding:8px;background:rgba(66,153,225,0.06);border-radius:6px;font-size:11px;color:#4299e1;">NS: '+dnsData.ns.map(function(n){return QSR._sanitize(n);}).join(' · ')+'</div>' : '') +
    '</div>';
};

/* ══════════════════════════════════════════════════════════════
   3. HNDL ATTACK TIMELINE SIMULATOR
   ══════════════════════════════════════════════════════════════ */

QSR._renderHNDLTimeline = function(result) {
  var el = document.getElementById('hndl-timeline-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var now = new Date().getFullYear();
  /* Estimate quantum break year based on key algorithm/size */
  var breakYear = now + 15; /* default */
  if (result.keyAlg === 'RSA') {
    if (result.keySize <= 1024) breakYear = now + 3;
    else if (result.keySize <= 2048) breakYear = now + 8;
    else if (result.keySize <= 4096) breakYear = now + 14;
    else breakYear = now + 20;
  } else if (result.keyAlg === 'ECDSA') {
    if (result.keySize <= 256) breakYear = now + 10;
    else breakYear = now + 16;
  }
  var harvestRisk = breakYear - now <= 10 ? 'HIGH' : breakYear - now <= 15 ? 'MEDIUM' : 'LOW';
  var hrColor = {HIGH:'#e53e3e',MEDIUM:'#ed8936',LOW:'#48bb78'}[harvestRisk];
  var yearsLeft = breakYear - now;
  var totalSpan = Math.max(yearsLeft + 5, 20);
  var harvestPct = 0;
  var breakPct = Math.round((yearsLeft / totalSpan) * 100);
  var decryptPct = Math.min(breakPct + 15, 100);

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid '+hrColor+';">' +
    '<div class="panel-title">⏰ Harvest Now, Decrypt Later (HNDL) Attack Timeline</div>' +
    '<div style="font-size:12px;color:#4a4a6a;margin-bottom:14px;">If adversaries record encrypted traffic <strong>today</strong>, when could they decrypt it with quantum computers?</div>' +
    '<div style="position:relative;height:60px;background:linear-gradient(90deg,rgba(229,62,62,0.15),rgba(237,137,54,0.1),rgba(72,187,120,0.1));border-radius:8px;overflow:hidden;margin-bottom:8px;">' +
      /* Today marker */
      '<div style="position:absolute;left:2%;top:0;height:100%;width:3px;background:#e53e3e;z-index:2;"></div>' +
      '<div style="position:absolute;left:2%;top:2px;font-size:10px;font-weight:700;color:#e53e3e;white-space:nowrap;">📡 TODAY<br>Harvest begins</div>' +
      /* Quantum break marker */
      '<div style="position:absolute;left:'+breakPct+'%;top:0;height:100%;width:3px;background:#ed8936;z-index:2;"></div>' +
      '<div style="position:absolute;left:'+breakPct+'%;top:2px;font-size:10px;font-weight:700;color:#ed8936;white-space:nowrap;">⚛ '+breakYear+'<br>Quantum break</div>' +
      /* Decrypt possible */
      '<div style="position:absolute;left:'+decryptPct+'%;top:0;height:100%;width:3px;background:#48bb78;z-index:2;"></div>' +
      '<div style="position:absolute;left:'+Math.min(decryptPct,85)+'%;bottom:2px;font-size:10px;font-weight:700;color:#276749;white-space:nowrap;">🔓 Data exposed</div>' +
      /* Danger zone */
      '<div style="position:absolute;left:2%;top:40px;width:'+(breakPct-2)+'%;height:16px;background:repeating-linear-gradient(45deg,rgba(229,62,62,0.1),rgba(229,62,62,0.1) 5px,transparent 5px,transparent 10px);border-radius:4px;"></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;">' +
      '<div style="text-align:center;padding:10px;background:rgba(229,62,62,0.06);border-radius:8px;"><div style="font-size:24px;font-weight:900;color:#e53e3e;">'+yearsLeft+'</div><div style="font-size:11px;color:#888;">Years until quantum break</div></div>' +
      '<div style="text-align:center;padding:10px;background:rgba('+hrColor.replace('#','')+',0.06);border-radius:8px;"><div style="font-size:16px;font-weight:900;color:'+hrColor+';">'+harvestRisk+'</div><div style="font-size:11px;color:#888;">HNDL Risk Level</div></div>' +
      '<div style="text-align:center;padding:10px;background:rgba(66,153,225,0.06);border-radius:8px;"><div style="font-size:14px;font-weight:700;color:#4299e1;">'+QSR._sanitize(result.keyAlg)+'-'+result.keySize+'</div><div style="font-size:11px;color:#888;">Current Algorithm</div></div>' +
    '</div>' +
    '<div style="margin-top:10px;padding:8px 12px;background:rgba(139,26,47,0.06);border-radius:6px;border-left:3px solid #8b1a2f;font-size:12px;color:#4a4a6a;">' +
      '<strong>⚠ Banking Impact:</strong> Financial data encrypted today with '+QSR._sanitize(result.keyAlg)+'-'+result.keySize+' could be decrypted by ~'+breakYear+'. Customer PII, transaction records, and auth tokens harvested now will be vulnerable. CRYSTALS-Kyber migration must begin immediately.' +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   4. PQC MIGRATION COST ESTIMATOR
   ══════════════════════════════════════════════════════════════ */

QSR._renderMigrationCost = function(result) {
  var el = document.getElementById('migration-cost-panel');
  if (!el || !result) return;
  el.style.display = 'block';
  var days = 5, cost = 0, priority = 'Medium', pColor = '#ed8936';
  var tasks = [];
  if (result.tlsVersion < '1.3') { days += 10; tasks.push({task:'Upgrade to TLS 1.3',effort:'10 days',status:'Required'}); }
  else { tasks.push({task:'TLS 1.3 Configuration',effort:'Verified',status:'✓ Done'}); }
  if (result.keySize < 4096) { days += 8; tasks.push({task:'Upgrade key to RSA-4096 / ECDSA-384',effort:'8 days',status:'Required'}); }
  if (!result.ciphers.some(function(c){return c.quantum;})) { days += 15; tasks.push({task:'Deploy CRYSTALS-Kyber hybrid cipher suites',effort:'15 days',status:'Critical'}); priority='High'; pColor='#e53e3e'; }
  if (!result.hsts) { days += 2; tasks.push({task:'Enable HSTS with preload',effort:'2 days',status:'Required'}); }
  if (result.secScore < 4) { days += 3; tasks.push({task:'Add missing security headers (CSP, XFO)',effort:'3 days',status:'Required'}); }
  tasks.push({task:'CRYSTALS-Dilithium signature migration',effort:'12 days',status:'Planned'});
  days += 12;
  cost = days * 15000; /* ₹15K/day estimate */
  if (result.qScore >= 70) { priority = 'Low'; pColor = '#48bb78'; }

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid '+pColor+';">' +
    '<div class="panel-title">💰 PQC Migration Cost & Effort Estimator</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">' +
      '<div style="text-align:center;padding:12px;background:rgba(66,153,225,0.08);border-radius:8px;"><div style="font-size:28px;font-weight:900;color:#4299e1;">'+days+'</div><div style="font-size:11px;color:#888;">Est. Person-Days</div></div>' +
      '<div style="text-align:center;padding:12px;background:rgba(72,187,120,0.08);border-radius:8px;"><div style="font-size:20px;font-weight:900;color:#48bb78;">₹'+(cost/100000).toFixed(1)+'L</div><div style="font-size:11px;color:#888;">Est. Cost (INR)</div></div>' +
      '<div style="text-align:center;padding:12px;background:rgba('+pColor.replace('#','')+',0.08);border-radius:8px;"><div style="font-size:18px;font-weight:900;color:'+pColor+';">'+priority+'</div><div style="font-size:11px;color:#888;">Priority Level</div></div>' +
    '</div>' +
    '<table class="data-table"><thead><tr><th>Migration Task</th><th>Effort</th><th>Status</th></tr></thead><tbody>' +
    tasks.map(function(t){
      var sc = t.status === 'Critical' ? '#e53e3e' : t.status === 'Required' ? '#ed8936' : t.status.startsWith('✓') ? '#48bb78' : '#4299e1';
      return '<tr><td style="font-size:12px;">'+QSR._sanitize(t.task)+'</td><td style="font-size:12px;font-weight:700;">'+t.effort+'</td><td><span style="color:'+sc+';font-weight:700;font-size:12px;">'+t.status+'</span></td></tr>';
    }).join('') +
    '</tbody></table></div>';
};

/* ══════════════════════════════════════════════════════════════
   5. CERTIFICATE CHAIN DEEP ANALYSIS
   ══════════════════════════════════════════════════════════════ */

QSR._renderCertChain = function(result, certs) {
  var el = document.getElementById('cert-chain-panel');
  if (!el) return;
  el.style.display = 'block';
  var chain = [];
  if (certs && certs.length) {
    /* Group certs by issuer to reconstruct chain */
    var issuers = {};
    certs.slice(0, 20).forEach(function(c){
      var iss = c.issuer_name || 'Unknown';
      if (!issuers[iss]) issuers[iss] = [];
      issuers[iss].push(c);
    });
    var sortedIssuers = Object.entries(issuers).sort(function(a,b){ return b[1].length - a[1].length; });
    chain = sortedIssuers.slice(0, 4).map(function(entry, idx){
      var iss = entry[0], cList = entry[1];
      var newest = cList[0];
      var level = idx === 0 ? 'End Entity' : idx === 1 ? 'Intermediate CA' : idx === 2 ? 'Root CA' : 'Cross-signed';
      var icon  = idx === 0 ? '🔒' : idx === 1 ? '🏛' : '🌍';
      return {level:level, icon:icon, issuer:iss, count:cList.length,
              notBefore: newest.not_before || '—', notAfter: newest.not_after || '—',
              serial: newest.serial_number || '—'};
    });
  }
  if (!chain.length) {
    chain = [{level:'End Entity',icon:'🔒',issuer:result.issuer||'Unknown CA',count:result.crtCount||0,notBefore:result.notBefore,notAfter:result.notAfter,serial:'—'}];
  }

  el.innerHTML =
    '<div class="panel">' +
    '<div class="panel-title">🔗 Certificate Trust Chain Analysis</div>' +
    '<div style="display:flex;flex-direction:column;gap:0;">' +
    chain.map(function(c, i){
      return '<div style="display:flex;align-items:stretch;gap:0;">' +
        '<div style="display:flex;flex-direction:column;align-items:center;width:30px;flex-shrink:0;">' +
          '<div style="width:12px;height:12px;border-radius:50%;background:'+(i===0?'#4299e1':i===1?'#48bb78':'#ed8936')+';border:2px solid #fff;box-shadow:0 0 0 2px '+(i===0?'#4299e1':i===1?'#48bb78':'#ed8936')+';z-index:1;"></div>' +
          (i < chain.length-1 ? '<div style="width:2px;flex:1;background:rgba(0,0,0,0.12);"></div>' : '') +
        '</div>' +
        '<div style="flex:1;padding:8px 12px;margin-bottom:8px;background:rgba(66,153,225,0.04);border-radius:8px;border-left:3px solid '+(i===0?'#4299e1':i===1?'#48bb78':'#ed8936')+';">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div><span style="font-size:16px;">'+c.icon+'</span> <strong style="font-size:12px;">'+QSR._sanitize(c.level)+'</strong></div>' +
            '<span style="font-size:11px;color:#888;">'+c.count+' certs</span>' +
          '</div>' +
          '<div style="font-size:11px;color:#4a4a6a;margin-top:4px;">'+QSR._sanitize(c.issuer).substring(0,80)+'</div>' +
          '<div style="font-size:10px;color:#aaa;margin-top:2px;">Valid: '+QSR._sanitize(c.notBefore)+' → '+QSR._sanitize(c.notAfter)+'</div>' +
        '</div></div>';
    }).join('') +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   6. ANIMATED THREAT RADAR
   ══════════════════════════════════════════════════════════════ */

QSR._drawThreatRadar = function(canvasId, score, threats) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var size = 220;
  var dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  var cx = size/2, cy = size/2, maxR = size * 0.42;
  var scoreColor = score >= 70 ? '#48bb78' : score >= 40 ? '#ed8936' : '#e53e3e';

  var _frame = 0;
  var _rafId = null;
  /* Cancel any previous radar animation on this canvas */
  if (canvas._radarRaf) cancelAnimationFrame(canvas._radarRaf);

  function draw() {
    ctx.clearRect(0, 0, size, size);
    /* Background gradient */
    var bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR + 10);
    bgGrad.addColorStop(0, 'rgba(13,13,26,0.05)');
    bgGrad.addColorStop(1, 'rgba(13,13,26,0)');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, size, size);
    /* Concentric rings */
    [0.25, 0.5, 0.75, 1.0].forEach(function(f) {
      ctx.beginPath(); ctx.arc(cx, cy, maxR * f, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(66,153,225,0.12)'; ctx.lineWidth = 1; ctx.stroke();
    });
    /* Cross lines */
    ctx.strokeStyle = 'rgba(66,153,225,0.06)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
    /* Sweep cone */
    var angle = (_frame % 360) * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxR, angle - 0.4, angle, false);
    ctx.closePath();
    var coneGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    coneGrad.addColorStop(0, 'rgba(66,153,225,0.2)');
    coneGrad.addColorStop(1, 'rgba(66,153,225,0)');
    ctx.fillStyle = coneGrad; ctx.fill();
    /* Sweep line */
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
    ctx.strokeStyle = 'rgba(66,153,225,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    /* Threat blips */
    if (threats && threats.length) {
      threats.forEach(function(t, i) {
        var bAngle = (i * 137.5) * Math.PI / 180;
        var bR = maxR * (0.3 + (1 - (t.severity || 0.5)) * 0.6);
        var bx = cx + bR * Math.cos(bAngle);
        var by = cy + bR * Math.sin(bAngle);
        var bColor = t.severity > 0.7 ? '#e53e3e' : t.severity > 0.4 ? '#ed8936' : '#48bb78';
        var pulseR = 3 + Math.sin(_frame * 0.06 + i) * 1.5;
        /* Glow */
        ctx.beginPath(); ctx.arc(bx, by, pulseR + 4, 0, Math.PI * 2);
        ctx.fillStyle = bColor; ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1;
        /* Dot */
        ctx.beginPath(); ctx.arc(bx, by, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = bColor; ctx.fill();
      });
    }
    /* Center score */
    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 32px Rajdhani,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(score), cx, cy - 4);
    ctx.fillStyle = '#888'; ctx.font = '11px "Exo 2",sans-serif';
    ctx.fillText('/100 QR', cx, cy + 16);
    /* Outer ring glow */
    ctx.beginPath(); ctx.arc(cx, cy, maxR + 1, 0, Math.PI * 2);
    ctx.strokeStyle = scoreColor;
    ctx.globalAlpha = 0.25 + Math.sin(_frame * 0.03) * 0.1;
    ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;

    _frame += 1.5;
    if (_frame < 900) {
      canvas._radarRaf = requestAnimationFrame(draw);
    }
  }
  draw();
};

/* ══════════════════════════════════════════════════════════════
   7. SCAN DIFF & REGRESSION TRACKER
   ══════════════════════════════════════════════════════════════ */

QSR._renderScanDiff = function(current, previous) {
  var el = document.getElementById('scan-diff-panel');
  if (!el || !previous) return;
  el.style.display = 'block';

  function diffItem(label, cur, prev, higherBetter) {
    var changed = String(cur) !== String(prev);
    var improved = higherBetter ? cur > prev : cur < prev;
    var icon = !changed ? '=' : improved ? '↑' : '↓';
    var color = !changed ? '#888' : improved ? '#48bb78' : '#e53e3e';
    return {label:label, cur:String(cur), prev:String(prev), icon:icon, color:color, changed:changed};
  }

  var diffs = [
    diffItem('QR Score', current.qScore, previous.qScore || previous.q_score, true),
    diffItem('TLS Grade', current.grade, previous.grade, false),
    diffItem('TLS Version', current.tlsVersion, previous.tlsVersion || previous.tls_version, true),
    diffItem('Key Size', current.keySize, previous.keySize || previous.key_size, true),
    diffItem('Days Until Expiry', current.daysLeft, previous.daysLeft || previous.days_left, true),
    diffItem('CT Cert Count', current.crtCount, previous.crtCount || previous.cert_count, false)
  ];
  var regressions = diffs.filter(function(d){ return d.changed && d.icon === '↓'; });
  var improvements = diffs.filter(function(d){ return d.changed && d.icon === '↑'; });
  var bannerColor = regressions.length ? '#e53e3e' : improvements.length ? '#48bb78' : '#4299e1';

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid '+bannerColor+';">' +
    '<div class="panel-title">📊 Scan Diff — vs Previous Scan</div>' +
    (regressions.length ? '<div style="padding:8px 12px;background:rgba(229,62,62,0.08);border-radius:6px;margin-bottom:10px;font-size:12px;color:#e53e3e;font-weight:700;">⚠ '+regressions.length+' security regression(s) detected since last scan!</div>' : '') +
    (improvements.length ? '<div style="padding:8px 12px;background:rgba(72,187,120,0.08);border-radius:6px;margin-bottom:10px;font-size:12px;color:#48bb78;font-weight:700;">✓ '+improvements.length+' improvement(s) since last scan</div>' : '') +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">' +
    diffs.map(function(d){
      return '<div style="padding:8px 10px;background:rgba(0,0,0,0.02);border-radius:6px;border-left:3px solid '+d.color+';">' +
        '<div style="font-size:11px;color:#888;">'+QSR._sanitize(d.label)+'</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<span style="font-size:18px;font-weight:900;color:'+d.color+';">'+d.icon+'</span>' +
          '<div><div style="font-size:13px;font-weight:700;">'+QSR._sanitize(d.cur)+'</div>' +
          (d.changed ? '<div style="font-size:10px;color:#aaa;text-decoration:line-through;">'+QSR._sanitize(d.prev)+'</div>' : '') +
        '</div></div></div>';
    }).join('') +
    '</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   8. NIST SP 800-208 COMPLIANCE MAP
   ══════════════════════════════════════════════════════════════ */

QSR._renderNISTCompliance = function(result) {
  var el = document.getElementById('nist-compliance-panel');
  if (!el || !result) return;
  el.style.display = 'block';

  var checks = [
    {req:'SP 800-52r2', name:'TLS 1.3 Required', pass: result.tlsVersion >= '1.3', detail: result.tlsVersion >= '1.3' ? 'TLS 1.3 active' : 'TLS '+result.tlsVersion+' — upgrade required'},
    {req:'SP 800-131A', name:'Key Size ≥ 2048-bit', pass: result.keySize >= 2048, detail: result.keyAlg+'-'+result.keySize},
    {req:'SP 800-208', name:'PQC Algorithm Support', pass: result.ciphers && result.ciphers.some(function(c){return c.quantum;}), detail: 'CRYSTALS-Kyber hybrid required'},
    {req:'SP 800-57', name:'Forward Secrecy (ECDHE/DHE)', pass: result.ciphers && result.ciphers.some(function(c){return c.forward;}), detail: 'Ephemeral key exchange'},
    {req:'SP 800-63B', name:'HSTS Enforcement', pass: !!result.hsts, detail: result.hsts ? 'HSTS active' : 'No HSTS header'},
    {req:'FIPS 203', name:'ML-KEM (Kyber) Readiness', pass:false, detail:'Post-quantum KEM not yet deployed'},
    {req:'FIPS 204', name:'ML-DSA (Dilithium) Readiness', pass:false, detail:'Post-quantum signatures not deployed'},
    {req:'FIPS 205', name:'SLH-DSA (SPHINCS+) Support', pass:false, detail:'Hash-based signatures for CAs'}
  ];
  var passCount = checks.filter(function(c){return c.pass;}).length;
  var total = checks.length;
  var pct = Math.round(passCount/total*100);
  var pc = pct >= 70 ? '#48bb78' : pct >= 40 ? '#ed8936' : '#e53e3e';

  el.innerHTML =
    '<div class="panel" style="border-left:4px solid '+pc+';">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
      '<div class="panel-title" style="margin:0;">📋 NIST PQC Compliance Assessment</div>' +
      '<div style="text-align:center;"><div style="font-family:Rajdhani;font-size:28px;font-weight:900;color:'+pc+';">'+pct+'%</div><div style="font-size:10px;color:#888;">'+passCount+'/'+total+' controls</div></div>' +
    '</div>' +
    '<div style="background:rgba(0,0,0,0.06);border-radius:6px;height:8px;margin-bottom:14px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:'+pc+';border-radius:6px;transition:width 1s;"></div></div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px;">' +
    checks.map(function(c){
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;background:'+(c.pass?'rgba(72,187,120,0.05)':'rgba(229,62,62,0.05)')+';">' +
        '<span style="font-size:16px;flex-shrink:0;">'+(c.pass?'✅':'❌')+'</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:700;color:'+(c.pass?'#276749':'#c53030')+';">'+QSR._sanitize(c.name)+'</div>' +
          '<div style="font-size:10px;color:#888;">'+QSR._sanitize(c.req)+' — '+QSR._sanitize(c.detail)+'</div>' +
        '</div></div>';
    }).join('') +
    '</div></div>';
};
