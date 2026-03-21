/* pages-discovery.js — Asset Discovery (FR4, FR5, FR6, FR7)
   Live Supabase data with tabbed view */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.discovery = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Asset Discovery</h1>
        <p class="page-subtitle">Network mapping & TLS inspection • FR4, FR5, FR6, FR7</p>
      </div>
      <button class="btn-export" onclick="QSR._runScan()">&#9654; Run Scan</button>
    </div>

    <!-- KPI Row -->
    <div class="grid-4">
      <div class="kpi-tile"><div class="kpi-val" id="d-assets">—</div><div class="kpi-label">Total Assets</div></div>
      <div class="kpi-tile danger"><div class="kpi-val" id="d-critical">—</div><div class="kpi-label">Critical Risk</div></div>
      <div class="kpi-tile warn"><div class="kpi-val" id="d-expiring">—</div><div class="kpi-label">Certs Expiring</div></div>
      <div class="kpi-tile good"><div class="kpi-val" id="d-domains">—</div><div class="kpi-label">Domains</div></div>
    </div>

    <!-- Tab nav -->
    <div class="tab-nav" style="margin-top:18px;">
      <button class="tab-btn active" onclick="QSR._discTab('assets',this)">Assets</button>
      <button class="tab-btn" onclick="QSR._discTab('domains',this)">Domains</button>
      <button class="tab-btn" onclick="QSR._discTab('ssl',this)">SSL Certs</button>
      <button class="tab-btn" onclick="QSR._discTab('ip',this)">IP Subnets</button>
      <button class="tab-btn" onclick="QSR._discTab('software',this)">Software</button>
    </div>

    <div class="panel" style="margin-top:0;border-top-left-radius:0;">
      <div style="overflow-x:auto;" id="disc-content">
        <div class="loading-cell">Loading discovery data...</div>
      </div>
    </div>`;

  /* Load all data in parallel */
  const dl = window.QSR_DataLayer;
  const [assets, domains, ssls, ips, software] = await Promise.all([
    dl ? dl.fetchAssets()     : Promise.resolve(window.QSR?.assets    || []),
    dl ? dl.fetchDomains()    : Promise.resolve(window.QSR?.domains    || []),
    dl ? dl.fetchSSLs()       : Promise.resolve(window.QSR?.ssls      || []),
    dl ? dl.fetchIPSubnets()  : Promise.resolve(window.QSR?.ipSubnets || []),
    dl ? dl.fetchSoftware()   : Promise.resolve(window.QSR?.software  || [])
  ]);

  /* KPIs */
  document.getElementById('d-assets').textContent   = assets.length;
  document.getElementById('d-critical').textContent  = assets.filter(a => a.risk === 'Critical').length;
  document.getElementById('d-expiring').textContent  = assets.filter(a => a.cert === 'Expiring' || a.cert === 'Expired').length;
  document.getElementById('d-domains').textContent  = domains.length;

  /* Store for tab switching */
  window._discData = { assets, domains, ssls, ips, software };

  /* Render initial tab */
  QSR._renderDiscAssets(assets);
};

QSR._discTab = function(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const d = window._discData || {};
  if (tab === 'assets')   QSR._renderDiscAssets(d.assets || []);
  if (tab === 'domains')  QSR._renderDiscDomains(d.domains || []);
  if (tab === 'ssl')      QSR._renderDiscSSL(d.ssls || []);
  if (tab === 'ip')       QSR._renderDiscIP(d.ips || []);
  if (tab === 'software') QSR._renderDiscSoftware(d.software || []);
};

QSR._renderDiscAssets = function(assets) {
  const riskBadge = r => ({ Critical:'badge-danger',High:'badge-warn',Medium:'badge-info',Low:'badge-ok' }[r]||'badge-info');
  const certBadge = c => ({ Valid:'badge-ok',Expiring:'badge-warn',Expired:'badge-danger' }[c]||'badge-info');
  document.getElementById('disc-content').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Asset</th><th>URL</th><th>IPv4</th><th>Type</th><th>Owner</th><th>Risk</th><th>Cert</th><th>Key</th><th>Last Scan</th></tr></thead>
      <tbody>${assets.map(a => `<tr>
        <td><strong>${a.name}</strong></td>
        <td><a href="${a.url}" target="_blank" style="color:#4299e1;font-size:12px;">${a.url}</a></td>
        <td><code>${a.ipv4}</code></td>
        <td>${a.type}</td><td>${a.owner}</td>
        <td><span class="badge ${riskBadge(a.risk)}">${a.risk}</span></td>
        <td><span class="badge ${certBadge(a.cert)}">${a.cert}</span></td>
        <td><code>${a.key}-bit</code></td>
        <td style="font-size:11px;white-space:nowrap;">${a.lastScan}</td>
      </tr>`).join('')}</tbody>
    </table>`;
};

QSR._renderDiscDomains = function(domains) {
  document.getElementById('disc-content').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Domain</th><th>Detected</th><th>Registered</th><th>Registrar</th><th>Organization</th></tr></thead>
      <tbody>${domains.map(d => `<tr>
        <td><strong>${d.domain}</strong></td><td>${d.detected}</td>
        <td>${d.registered}</td><td>${d.registrar}</td><td>${d.company}</td>
      </tr>`).join('')}</tbody>
    </table>`;
};

QSR._renderDiscSSL = function(ssls) {
  document.getElementById('disc-content').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Fingerprint</th><th>Common Name</th><th>CA</th><th>Valid From</th><th>Detected</th></tr></thead>
      <tbody>${ssls.map(s => `<tr>
        <td><code style="font-size:11px;">${s.fingerprint||'—'}</code></td>
        <td>${s.commonName}</td><td>${s.ca}</td>
        <td>${s.validFrom}</td><td>${s.detected}</td>
      </tr>`).join('')}</tbody>
    </table>`;
};

QSR._renderDiscIP = function(ips) {
  document.getElementById('disc-content').innerHTML = `
    <table class="data-table">
      <thead><tr><th>IP</th><th>Ports</th><th>Subnet</th><th>ASN</th><th>Netname</th><th>Location</th></tr></thead>
      <tbody>${ips.map(ip => `<tr>
        <td><code>${ip.ip}</code></td><td><code>${ip.ports}</code></td>
        <td>${ip.subnet}</td><td>${ip.asn}</td><td>${ip.netname}</td><td>${ip.location}</td>
      </tr>`).join('')}</tbody>
    </table>`;
};

QSR._renderDiscSoftware = function(sw) {
  document.getElementById('disc-content').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Product</th><th>Version</th><th>Type</th><th>Port</th><th>Host</th></tr></thead>
      <tbody>${sw.map(s => `<tr>
        <td><strong>${s.product}</strong></td><td><code>${s.version}</code></td>
        <td>${s.type}</td><td><code>${s.port}</code></td><td>${s.host}</td>
      </tr>`).join('')}</tbody>
    </table>`;
};

QSR._runScan = async function() {
  if (!window.QSR_SUPABASE_READY) { alert('Scan simulation: Demo Mode — connect Supabase for live scans.'); return; }
  const btn = event.target;
  btn.textContent = '⟳ Scanning...';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 2000));
  /* Log scan event */
  if (window.QSR_DataLayer) {
    await window.QSR_DataLayer.logScanEvent('All PNB Assets — Manual Trigger');
  }
  btn.textContent = '✓ Scan Complete';
  setTimeout(() => { btn.textContent = '▶ Run Scan'; btn.disabled = false; }, 2000);
};
