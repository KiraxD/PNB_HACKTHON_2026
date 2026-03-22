/* pages-cbom.js — Cryptographic Bill of Materials (FR8)
   Live Supabase data + CycloneDX 1.4 JSON export */

window.QSR = window.QSR || {};

QSR.pages = QSR.pages || {};

QSR.pages.cbom = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Cryptographic Bill of Materials</h1>
        <p class="page-subtitle">CycloneDX 1.4 compliant • FR8 — CBOM Generation</p>
      </div>
      <button class="btn-export" id="cbom-export-btn" onclick="QSR.exportCBOM()">
        &#8659; Export CycloneDX JSON
      </button>
    </div>

    <!-- KPI Row -->
    <div class="grid-4" id="cbom-kpis">
      <div class="kpi-tile"><div class="kpi-val" id="k-apps">—</div><div class="kpi-label">Applications</div></div>
      <div class="kpi-tile warn"><div class="kpi-val" id="k-weak">—</div><div class="kpi-label">Weak Keys</div></div>
      <div class="kpi-tile good"><div class="kpi-val" id="k-certs">—</div><div class="kpi-label">Active Certs</div></div>
      <div class="kpi-tile danger"><div class="kpi-val" id="k-issues">—</div><div class="kpi-label">Cert Issues</div></div>
    </div>

    <!-- Charts Row -->
    <div class="grid-2" style="margin-top:18px;">
      <div class="panel">
        <div class="panel-title">Key Length Distribution</div>
        <canvas id="chart-keylength" data-h="180" style="width:100%;display:block;"></canvas>
      </div>
      <div class="panel">
        <div class="panel-title">TLS Protocol Versions</div>
        <canvas id="chart-tls" data-h="180" style="width:100%;display:block;"></canvas>
      </div>
    </div>

    <!-- Per-App CBOM Table -->
    <div class="panel" style="margin-top:18px;">
      <div class="panel-title">Per-Application Cryptographic Inventory</div>
      <div style="overflow-x:auto;">
        <table class="data-table" id="cbom-table">
          <thead><tr>
            <th>Application</th><th>Key Length</th><th>Cipher Suite</th>
            <th>Certificate Authority</th><th>TLS Version</th><th>Risk</th>
          </tr></thead>
          <tbody id="cbom-tbody"><tr><td colspan="6" class="loading-cell">Loading CBOM data...</td></tr></tbody>
        </table>
      </div>
    </div>`;

  /* Load data */
  const dl = window.QSR_DataLayer;
  const cbom = dl ? await dl.fetchCBOM() : (window.QSR.cbom || {});
  const perApp = cbom.perApp || [];

  /* KPI */
  document.getElementById('k-apps').textContent   = cbom.totalApps   || perApp.length || '—';
  document.getElementById('k-weak').textContent   = cbom.weakCrypto  || '—';
  document.getElementById('k-certs').textContent  = cbom.activeCerts || perApp.length || '—';
  document.getElementById('k-issues').textContent = cbom.certIssues  || '—';

  /* Key length chart */
  const keyMap = {};
  perApp.forEach(p => { const k = p.keyLen||'Unknown'; keyMap[k]=(keyMap[k]||0)+1; });
  const keyColors = {'RSA-1024':'#e53e3e','1024-bit':'#e53e3e','RSA-2048':'#ed8936','2048-bit':'#ed8936','RSA-4096':'#48bb78','4096-bit':'#48bb78'};
  QSR.drawBars('chart-keylength', Object.entries(keyMap).map(([l,v])=>({ label:l, value:v, color:keyColors[l]||'#4299e1' })));

  /* TLS version chart */
  const tlsMap = {};
  perApp.forEach(p => { const t = p.tls||'Unknown'; tlsMap[t]=(tlsMap[t]||0)+1; });
  const tlsColors = {'1.0':'#e53e3e','1.1':'#ed8936','1.2':'#4299e1','1.3':'#48bb78'};
  QSR.drawBars('chart-tls', Object.entries(tlsMap).map(([l,v])=>({ label:'TLS '+l, value:v, color:tlsColors[l]||'#a0aec0' })));

  /* Risk badge helper */
  function riskBadge(keyLen, tls) {
    if (keyLen === 'RSA-1024' || keyLen === '1024-bit' || tls === '1.0') return '<span class="badge badge-danger">Critical</span>';
    if (tls === '1.2') return '<span class="badge badge-warn">Medium</span>';
    return '<span class="badge badge-ok">Low</span>';
  }

  /* Table */
  const tbody = document.getElementById('cbom-tbody');
  if (!perApp.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No CBOM data found. Run a scan first.</td></tr>';
  } else {
    tbody.innerHTML = perApp.map(p => `
      <tr>
        <td><strong>${p.app||'—'}</strong></td>
        <td><code>${p.keyLen||'—'}</code></td>
        <td style="font-size:12px;max-width:200px;word-break:break-all;">${p.cipher||'—'}</td>
        <td>${p.ca||'—'}</td>
        <td>${p.tls||'—'}</td>
        <td>${riskBadge(p.keyLen, p.tls)}</td>
      </tr>`).join('');
  }

  /* Store for export */
  window._cbomData = { cbom, perApp };
};

/* ── CycloneDX 1.4 JSON Export ── */
QSR.exportCBOM = function() {
  const { cbom, perApp } = window._cbomData || { cbom:{}, perApp:[] };
  const now = new Date().toISOString();

  const cyclonedx = {
    "bomFormat": "CycloneDX",
    "specVersion": "1.4",
    "version": 1,
    "serialNumber": "urn:uuid:" + crypto.randomUUID(),
    "metadata": {
      "timestamp": now,
      "tools": [{ "vendor": "QSecure Radar", "name": "CBOM Generator", "version": "1.0.0" }],
      "component": {
        "type": "application",
        "name": "Punjab National Bank — Internet Banking Infrastructure",
        "version": "2024.1",
        "description": "PSB Hackathon 2026 — Post-Quantum Cryptographic Assessment"
      }
    },
    "components": perApp.map((p, i) => ({
      "type": "cryptographic-asset",
      "bom-ref": "crypto-" + (i+1),
      "name": p.app || ("Component-" + (i+1)),
      "cryptoProperties": {
        "assetType": "certificate",
        "algorithmProperties": {
          "primitive": "asymmetric-encryption",
          "parameterSetIdentifier": p.keyLen || "RSA-2048",
          "executionEnvironment": "software-plain-ram"
        },
        "certificateProperties": {
          "subjectName": p.app,
          "issuerName": p.ca || "DigiCert Inc",
          "notValidBefore": "2024-01-01T00:00:00Z",
          "notValidAfter":  "2025-12-31T23:59:59Z",
          "signatureAlgorithm": p.cipher || "SHA256withRSA",
          "certificateFormat": "X.509"
        }
      },
      "relatedCryptoMaterialProperties": {
        "type": "private-key",
        "size": parseInt((p.keyLen||'2048').replace(/[^0-9]/g,'')) || 2048,
        "algorithmRef": "crypto-" + (i+1)
      }
    })),
    "dependencies": [],
    "vulnerabilities": perApp
      .filter(p => p.keyLen === 'RSA-1024' || p.keyLen === '1024-bit' || p.tls === '1.0')
      .map((p, i) => ({
        "bom-ref": "vuln-" + (i+1),
        "id": "PQC-RISK-" + String(i+1).padStart(3,'0'),
        "source": { "name": "NIST FIPS 140-3", "url": "https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.140-3.pdf" },
        "ratings": [{ "source": { "name": "QSecure Radar" }, "score": 9.1, "severity": "critical", "method": "CVSSv3" }],
        "description": `Quantum-vulnerable cryptography detected: ${p.keyLen} key in ${p.app}. Susceptible to Shor's algorithm.`,
        "recommendation": "Migrate to CRYSTALS-Kyber (ML-KEM) for key exchange and CRYSTALS-Dilithium (ML-DSA) for signatures.",
        "affects": [{ "ref": p.app }]
      }))
  };

  const blob = new Blob([JSON.stringify(cyclonedx, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pnb-cbom-cyclonedx-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  if (window.QSR && QSR.toast) QSR.toast('CycloneDX 1.4 JSON exported!', 'success');
};
