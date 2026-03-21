/* pages-cbom.js - CBOM Page (FR8) */
/* Cryptographic Bill of Materials */

window._cbomPage = function() {
  var d = QSR.cbom;
  return '<div style="background:linear-gradient(135deg,#1a1a2e,#2d2d5e);border-radius:14px;padding:20px;margin-bottom:14px;color:#fff;">' +
    '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;letter-spacing:1px;">Cryptographic Bill of Materials (FR8)</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:14px;">CycloneDX CBOM Standard | CERT-IN Compliant</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;">' +
    [
      ['Applications Scanned', d.totalApps, '#60a5fa'],
      ['Domains Surveyed',      d.sitesSurveyed.toLocaleString(), '#34d399'],
      ['Active Certificates',   d.activeCerts, '#a78bfa'],
      ['Weak Crypto Found',     d.weakCrypto, '#f87171'],
      ['Cert Issues',           d.certIssues, '#fbbf24']
    ].map(function(x) {
      return '<div style="background:rgba(255,255,255,0.1);border-radius:10px;padding:12px;border-left:3px solid '+x[2]+';"><div style="font-size:10px;opacity:0.6;text-transform:uppercase;">'+x[0]+'</div><div style="font-family:Rajdhani;font-size:28px;font-weight:700;color:'+x[2]+';">'+x[1]+'</div></div>';
    }).join('') +
    '</div></div>' +

    '<div class="grid-2" style="margin-bottom:12px;">' +
    '<div class="panel"><div class="panel-title">Key Length Distribution (FR6, FR7)</div><canvas id="chart-cbom-keys" data-h="160" style="width:100%;display:block;"></canvas>' +
    '<div style="margin-top:8px;font-size:12px;color:#e53e3e;font-weight:600;">* RSA &lt; 2048-bit is quantum-vulnerable (Shor algorithm, FR7)</div></div>' +
    '<div class="panel"><div class="panel-title">Cipher Suite Usage (FR5)</div><div id="cbom-ciphers" style="padding:4px;"></div></div>' +
    '</div>' +

    '<div class="grid-2" style="margin-bottom:12px;">' +
    '<div class="panel"><div class="panel-title">Certificate Authorities</div><div style="display:flex;gap:14px;align-items:center;"><canvas id="chart-cbom-ca" data-h="120" style="width:100%;display:block;"></canvas><div id="cbom-ca-legend" style="flex:1;"></div></div></div>' +
    '<div class="panel"><div class="panel-title">TLS Protocol Distribution (FR5)</div><canvas id="chart-cbom-tls" data-h="130" style="width:100%;display:block;"></canvas></div>' +
    '</div>' +

    '<div class="panel"><div class="panel-title">Per-Application CBOM Details</div>' +
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Application</th><th>Key Length</th><th>Cipher Suite</th><th>Certificate Authority</th><th>TLS Version</th><th>Quantum Risk</th></tr></thead>' +
    '<tbody id="cbom-app-tbody"></tbody></table></div>' +
    '<div style="margin-top:12px;display:flex;gap:8px;">' +
    '<button class="btn btn-primary" onclick="exportCBOM()">Export CBOM (CycloneDX JSON)</button>' +
    '<button class="btn btn-outline" onclick="navigateTo(\'reporting\')">Include in Report (FR14)</button>' +
    '</div></div>';
};

window.initCBOM = async function() {
  var d = QSR.cbom;
  if (window.QSR_DataLayer) {
    try { var live = await QSR_DataLayer.fetchCBOM(); if (live) d = live; } catch(e){}
  }

  QSR.drawBars('chart-cbom-keys', d.keyLengths || []);
  QSR.drawDonut('chart-cbom-ca', d.certAuthorities || [], 'CAs', 'Cert');

  /* Cipher bars */
  var cipherEl = document.getElementById('cbom-ciphers');
  if (cipherEl && d.cipherUsage) {
    var max = Math.max.apply(null, d.cipherUsage.map(function(c){ return c.count; }));
    cipherEl.innerHTML = d.cipherUsage.map(function(c) {
      var pct = Math.round(c.count/max*100);
      var weak = c.cipher.includes('WEAK') || c.cipher.includes('RC4') || c.cipher.includes('CBC');
      return '<div class="progress-bar-wrap"><div class="progress-label"><span style="font-weight:600;color:' + (weak?'#e53e3e':'#1a1a2e') + ';">' + c.cipher + (weak?' (Vulnerable)':'') + '</span><span>' + c.count + '</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%;background:'+(weak?'#e53e3e':'#4299e1')+';"></div></div></div>';
    }).join('');
  }

  /* TLS chart */
  QSR.drawBars('chart-cbom-tls', (d.encriptionProtocols||[]).map(function(p){ return { label:p.label, value:p.value, color:p.color }; }));

  /* CA legend */
  var caLeg = document.getElementById('cbom-ca-legend');
  if (caLeg && d.certAuthorities) {
    caLeg.innerHTML = d.certAuthorities.map(function(ca) {
      return '<div class="stat-row"><span class="stat-key"><span style="width:10px;height:10px;background:'+ca.color+';display:inline-block;border-radius:50%;margin-right:6px;"></span>'+ca.name+'</span><span class="stat-val">'+ca.count+'</span></div>';
    }).join('');
  }

  /* CBOM table */
  var tbody = document.getElementById('cbom-app-tbody');
  if (tbody && (d.perApp||[]).length) {
    tbody.innerHTML = d.perApp.map(function(r) {
      var weakKey = (r.keyLength||r.key_length||'').includes('1024');
      var weakTls = (r.tls||r.tls_version||'') === '1.0';
      var risk = (weakKey || weakTls) ? 'High' : 'Low';
      var riskCls = weakKey || weakTls ? 'badge-high' : 'badge-low';
      return '<tr>' +
        '<td style="font-weight:600;">'+(r.app||'—')+'</td>' +
        '<td style="color:'+(weakKey?'#e53e3e':'#48bb78')+';font-weight:700;">'+(r.keyLength||r.key_length||'—')+(weakKey?' &#9888;':'')+'</td>' +
        '<td style="font-size:12px;">'+(r.cipher||'—')+'</td>' +
        '<td>'+(r.ca||'—')+'</td>' +
        '<td style="color:'+(weakTls?'#e53e3e':'#48bb78')+';font-weight:700;">'+(r.tls||r.tls_version||'—')+'</td>' +
        '<td><span class="badge '+riskCls+'">'+risk+'</span></td>' +
        '</tr>';
    }).join('');
  }
};

window.exportCBOM = function() {
  var cbomJson = {
    bomFormat: 'CycloneDX', specVersion: '1.4', version: 1,
    metadata: { timestamp: new Date().toISOString(), component: { name:'PNB Internet Banking', version:'1.0', type:'application' } },
    components: (QSR.cbom.perApp||[]).map(function(r, i) {
      return {
        'bom-ref': 'app-' + (i+1), type: 'library', name: r.app,
        cryptoProperties: {
          assetType: 'tls', algorithm: r.cipher, keyLength: r.keyLength || r.key_length,
          tlsVersion: r.tls || r.tls_version, certificateAuthority: r.ca,
          quantumVulnerable: (r.keyLength||'').includes('1024') || (r.tls||'') === '1.0'
        }
      };
    })
  };
  var blob = new Blob([JSON.stringify(cbomJson, null, 2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'PNB_CBOM_CycloneDX_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  if(window.QSR_DataLayer) { var u = JSON.parse(sessionStorage.getItem('qsr_user')||'{}'); QSR_DataLayer.logScanEvent('CBOM_EXPORTED'); }
};

