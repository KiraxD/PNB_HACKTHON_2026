/* pages-discovery.js - Asset Discovery Page (FR4, FR5) */

window._discoveryPage = function() {
  var tabs = ['Domains','SSL Certs','IP Subnets','Software'];
  var tabHtml = tabs.map(function(t,i) {
    return '<button class="tab-btn'+(i===0?' active':'')+'" data-tab="'+t.toLowerCase().replace(' ','-')+'" onclick="switchDiscoveryTab(\''+t.toLowerCase().replace(' ','-')+'\')">' + t +
      '<span class="tab-badge" id="badge-'+t.toLowerCase().replace(' ','-')+'">—</span></button>';
  }).join('');
  return '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;margin-bottom:14px;">Asset Discovery (FR4 - DNS Enumeration, FR5 - TLS Inspection)</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
    '<button class="btn btn-primary" onclick="runDiscoveryScan()">Run New Scan (FR13)</button>' +
    '<div class="search-wrap" style="flex:1;min-width:200px;margin:0;"><span class="search-icon">&#128269;</span><input class="search-input" id="disc-search" placeholder="Search discovered assets..." oninput="filterDiscovery()"></div>' +
    '</div>' +
    '<div class="tab-bar" id="disc-tabs">' + tabHtml + '</div>' +

    /* Panel */
    '<div class="panel" style="margin-top:0;">' +
    '<div id="disc-content"><div style="text-align:center;padding:20px;color:#aaa;">Loading...</div></div>' +
    '</div>' +

    /* Network Graph */
    '<div class="panel"><div class="panel-title">Asset Relationship Network (FR5 - TLS Service Mapping)</div>' +
    '<div style="display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap;">' +
    '<button class="btn btn-outline" onclick="if(window.initNetworkGraph)window.initNetworkGraph()">Render Graph</button>' +
    '<span style="font-size:12px;color:#888;align-self:center;">Nodes = assets, Edges = TLS relationships. Drag to explore.</span>' +
    '</div>' +
    '<div id="network-graph-container" style="height:380px;background:rgba(0,0,0,0.04);border-radius:8px;overflow:hidden;"></div>' +
    '</div>';
};

var _discData = {};
var _discTab  = 'domains';

window.initAssetDiscovery = async function() {
  /* Fetch all discovery data */
  if (window.QSR_DataLayer) {
    var [domains, ssls, ips, software] = await Promise.all([
      QSR_DataLayer.fetchDomains(),
      QSR_DataLayer.fetchSSLs(),
      QSR_DataLayer.fetchIPSubnets(),
      QSR_DataLayer.fetchSoftware()
    ]);
    _discData = { domains:domains, 'ssl-certs':ssls, 'ip-subnets':ips, software:software };
  } else {
    _discData = { domains:QSR.domains||[], 'ssl-certs':QSR.ssls||[], 'ip-subnets':QSR.ipSubnets||[], software:QSR.software||[] };
  }

  /* Update badges */
  Object.keys(_discData).forEach(function(k) {
    var el = document.getElementById('badge-'+k);
    if(el) el.textContent = _discData[k].length;
  });

  switchDiscoveryTab('domains');
};

window.switchDiscoveryTab = function(tab) {
  _discTab = tab;
  document.querySelectorAll('#disc-tabs .tab-btn').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-tab')===tab); });
  renderDiscoveryTab(tab, _discData[tab]||[]);
};

function renderDiscoveryTab(tab, rows) {
  var container = document.getElementById('disc-content');
  if (!container) return;
  if (!rows.length) { container.innerHTML = '<div style="text-align:center;padding:24px;color:#aaa;">No data found. Run a scan to populate this tab.</div>'; return; }

  var cols, rowFn;
  if (tab === 'domains') {
    cols = ['Domain','Detected','Registered','Registrar','Company'];
    rowFn = function(d) { return '<td>'+d.domain+'</td><td>'+d.detected+'</td><td>'+(d.registered||'—')+'</td><td>'+(d.registrar||'—')+'</td><td>'+(d.company||'—')+'</td>'; };
  } else if (tab === 'ssl-certs') {
    cols = ['Fingerprint','Detected','Valid From','Common Name','CA'];
    rowFn = function(d) { return '<td style="font-family:monospace;font-size:11px;">'+(d.fingerprint||'—')+'</td><td>'+(d.detected||'—')+'</td><td>'+(d.validFrom||d.valid_from||'—')+'</td><td>'+(d.commonName||d.common_name||'—')+'</td><td>'+(d.ca||'—')+'</td>'; };
  } else if (tab === 'ip-subnets') {
    cols = ['IP Address','Ports','Subnet','ASN','Netname','Location'];
    rowFn = function(d) { return '<td style="font-family:monospace;">'+(d.ip||'—')+'</td><td>'+(d.ports||'—')+'</td><td style="font-family:monospace;">'+(d.subnet||'—')+'</td><td>'+(d.asn||'—')+'</td><td>'+(d.netname||'—')+'</td><td>'+(d.location||'—')+'</td>'; };
  } else {
    cols = ['Product','Version','Type','Port','Host'];
    rowFn = function(d) { return '<td style="font-weight:600;">'+(d.product||'—')+'</td><td style="font-family:monospace;">'+(d.version||'—')+'</td><td>'+(d.type||'—')+'</td><td style="font-family:monospace;">'+(d.port||'—')+'</td><td>'+(d.host||'—')+'</td>'; };
  }

  var thead = '<thead><tr>'+cols.map(function(c){ return '<th>'+c+'</th>'; }).join('')+'</tr></thead>';
  var tbody = '<tbody>'+rows.map(function(d){ return '<tr>'+rowFn(d)+'</tr>'; }).join('')+'</tbody>';
  container.innerHTML = '<div class="table-wrap"><table class="data-table">'+thead+tbody+'</table></div>';
}

window.filterDiscovery = function() {
  var q = (document.getElementById('disc-search')?.value||'').toLowerCase();
  var filtered = (_discData[_discTab]||[]).filter(function(d){ return JSON.stringify(d).toLowerCase().includes(q); });
  renderDiscoveryTab(_discTab, filtered);
};

window.runDiscoveryScan = async function() {
  var btn = event.target;
  btn.textContent = 'Scanning...'; btn.disabled = true;
  await new Promise(function(r){ setTimeout(r, 2000); });
  if(window.QSR_DataLayer) await QSR_DataLayer.logScanEvent('FULL_ASSET_SCAN');
  btn.textContent = 'Run New Scan (FR13)'; btn.disabled = false;
  window.initAssetDiscovery();
};

