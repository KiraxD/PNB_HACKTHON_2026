/* pages-cyber-rating.js - Cyber Rating Dashboard (FR10, FR14) */

window._cyberRatingPage = function() {
  return `
  <div class="page-header">
    <div>
      <h1 class="page-title">Cyber Rating Dashboard</h1>
      <p class="page-subtitle">Enterprise PQC posture and readiness scoring.</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
    <div class="panel" style="display:flex;flex-direction:column;align-items:center;padding:20px;">
      <div class="panel-title" style="width:100%;text-align:left;">Enterprise PQC Readiness Score (0-100)</div>
      <div style="position:relative;width:100%;max-width:280px;margin:0 auto;">
        <canvas id="chart-gauge" style="width:100%;display:block;"></canvas>
        <div style="position:absolute;bottom:12%;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none;">
          <div id="gauge-score-label" style="font-family:Rajdhani,sans-serif;font-size:46px;font-weight:800;line-height:1;color:#e53e3e;">0</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">out of 100</div>
        </div>
      </div>
      <div id="gauge-grade" style="font-family:Rajdhani,sans-serif;font-size:15px;font-weight:700;background:rgba(66,153,225,0.08);color:#4299e1;padding:5px 18px;border-radius:20px;margin-top:10px;text-align:center;white-space:nowrap;">
        Unassessed
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:8px;text-align:center;line-height:1.5;">
        76-100 = Elite PQC | 51-75 = Standard<br>
        26-50 = Transitional | 0-25 = Critical
      </div>
    </div>

    <div class="panel" style="overflow:hidden;">
      <div class="panel-title">PQC Tier Classification</div>
      <div style="overflow-x:auto;">
        <table class="data-table" id="tier-table" style="min-width:360px;">
          <thead><tr>
            <th>Tier</th><th>Range</th><th style="text-align:center;">Assets</th><th>Description</th>
          </tr></thead>
          <tbody id="tier-tbody">
            <tr><td colspan="4" style="text-align:center;padding:20px;color:#aaa;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;padding:10px 12px;background:rgba(66,153,225,0.06);border-radius:8px;border-left:3px solid #4299e1;font-size:12px;color:#4a4a6a;line-height:1.7;">
        <strong>NIST PQC targets:</strong><br>
        ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205)
      </div>
    </div>
  </div>

  <div class="panel" style="margin-top:0;border-top-left-radius:0;">
    <div class="panel-title">Per-Asset PQC Score Breakdown</div>
    <div class="tab-nav" style="margin-bottom:14px;margin-top:-10px;">
      <button class="tab-btn active" data-cr-bucket="all"   onclick="QSR._setCRBucket(this,'all')">All Domains</button>
      <button class="tab-btn"        data-cr-bucket="pnb"   onclick="QSR._setCRBucket(this,'pnb')">&#127981; PNB Domains</button>
      <button class="tab-btn"        data-cr-bucket="third" onclick="QSR._setCRBucket(this,'third')">&#127760; 3rd-Party Targets</button>
    </div>
    <div style="overflow-x:auto;">
      <table class="data-table" id="asset-score-table" style="min-width:540px;">
        <thead><tr>
          <th>Asset</th>
          <th style="text-align:center;width:96px;">PQC Score</th>
          <th>Grade</th>
          <th style="width:70px;">TLS</th>
          <th>PQC Ready</th>
          <th style="min-width:120px;">Score Bar</th>
        </tr></thead>
        <tbody id="asset-score-tbody">
          <tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">Loading assets...</td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
};

window.initCyberRating = async function() {
  var rating = { enterpriseScore: 0, grade: 'Unassessed', tiers: [] };
  var pqc = { assets: [] };

  if (window.QSR_DataLayer) {
    try {
      var liveRating = await QSR_DataLayer.fetchCyberRating();
      if (liveRating) rating = liveRating;
      var livePQC = await QSR_DataLayer.fetchPQCScores();
      if (livePQC) pqc = livePQC;
    } catch (e) {
      console.warn('[CyberRating]', e);
    }
  }

  var score = Number(rating.enterpriseScore) || 0;
  var grade = rating.grade || 'Unassessed';
  var scoreColor = score >= 76 ? '#48bb78' : score >= 51 ? '#4299e1' : score >= 26 ? '#ecc94b' : '#e53e3e';

  var scoreEl = document.getElementById('gauge-score-label');
  var gradeEl = document.getElementById('gauge-grade');
  if (scoreEl) {
    scoreEl.textContent = score;
    scoreEl.style.color = scoreColor;
  }
  if (gradeEl) {
    gradeEl.textContent = grade;
    gradeEl.style.color = scoreColor;
    gradeEl.style.background = scoreColor + '18';
  }

  _drawCyberGauge('chart-gauge', score, scoreColor);

  var tierTbody = document.getElementById('tier-tbody');
  var tiers = rating.tiers || [];
  if (tierTbody) {
    if (!tiers.length) {
      tierTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#aaa;">No tier data available yet.</td></tr>';
    } else {
      tierTbody.innerHTML = tiers.map(function(t) {
        return '<tr>' +
          '<td style="font-weight:700;color:' + t.color + ';white-space:nowrap;">' + t.tier + '</td>' +
          '<td style="font-family:Rajdhani,sans-serif;font-size:15px;font-weight:700;white-space:nowrap;">' + t.range + '</td>' +
          '<td style="text-align:center;font-family:Rajdhani,sans-serif;font-size:20px;font-weight:800;color:' + t.color + ';">' + t.count + '</td>' +
          '<td style="font-size:12px;color:#4a4a6a;white-space:normal;line-height:1.4;max-width:180px;">' + t.desc + '</td>' +
          '</tr>';
      }).join('');
    }
  }

  QSR._cr_domainFilter = 'all';

  window.QSR._setCRBucket = function(btn, bucket) {
    QSR._cr_domainFilter = bucket;
    document.querySelectorAll('.tab-btn[data-cr-bucket]').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    QSR._renderCRTable();
  };

  QSR._crAssets = pqc.assets || [];

  window.QSR._renderCRTable = function() {
    var assetTbody = document.getElementById('asset-score-tbody');
    if (!assetTbody) return;
    
    var filtered = QSR._crAssets.filter(function(a) {
      var isPNB = a.name ? window.isPNBDomain(a.name) : false;
      var bucket = QSR._cr_domainFilter || 'all';
      return (bucket === 'all') || (bucket === 'pnb' && isPNB) || (bucket === 'third' && !isPNB);
    });

    if (!filtered || !filtered.length) {
      assetTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">No assessed assets match the filter.</td></tr>';
      return;
    }

    var tlsMap = { 'Elite-PQC': '1.3', Standard: '1.3', Legacy: '1.2', Critical: '1.0' };
    assetTbody.innerHTML = filtered.map(function(a) {
      var s = a.score || 0;
      var pct = Math.min(s, 100);
      var c = s >= 76 ? '#48bb78' : s >= 51 ? '#4299e1' : s >= 26 ? '#ecc94b' : '#e53e3e';
      var tls = (a.tls && a.tls !== '-') ? a.tls : (tlsMap[a.status] || '1.2');
      var pqcBadge = a.pqcSupport
        ? '<span class="badge badge-ok">YES</span>'
        : '<span class="badge badge-danger">NO</span>';
      
      var isPNB = a.name ? window.isPNBDomain(a.name) : false;
      var bucketBadge = isPNB ? '<span class="domain-badge domain-pnb" style="font-size:10px;margin-left:6px;">&#127981; PNB</span>' : 
                                '<span class="domain-badge domain-third" style="font-size:10px;margin-left:6px;">&#127760; 3rd</span>';
                                
      return '<tr>' +
        '<td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + a.name + '">' + a.name + ' ' + bucketBadge + '</td>' +
        '<td style="text-align:center;"><span style="font-family:Rajdhani,sans-serif;font-size:22px;font-weight:800;color:' + c + ';">' + s + '</span><span style="font-size:11px;color:#aaa;">/100</span></td>' +
        '<td><span class="badge" style="background:' + c + '20;color:' + c + ';border:1px solid ' + c + ';white-space:nowrap;">' + a.status + '</span></td>' +
        '<td style="font-family:monospace;font-size:13px;text-align:center;">' + tls + '</td>' +
        '<td style="text-align:center;">' + pqcBadge + '</td>' +
        '<td style="min-width:120px;padding-right:12px;"><div class="progress-bar" style="height:8px;border-radius:4px;background:rgba(0,0,0,0.08);overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:' + c + ';border-radius:4px;transition:width 0.8s ease;"></div></div><div style="font-size:10px;color:#aaa;margin-top:3px;text-align:right;">' + pct + '%</div></td>' +
        '</tr>';
    }).join('');
  };

  QSR._renderCRTable();
};

function _drawCyberGauge(canvasId, score, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  var cssW = canvas.parentElement.clientWidth || 280;
  var cssH = Math.round(cssW * 0.58);
  canvas.width = cssW;
  canvas.height = cssH;

  var ctx = canvas.getContext('2d');
  var cx = cssW / 2;
  var cy = cssH * 0.88;
  var r = Math.min(cssW, cssH * 1.7) * 0.43;

  ctx.clearRect(0, 0, cssW, cssH);

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineCap = 'round';
  ctx.stroke();

  var pct = Math.min(Math.max(score, 0), 100) / 100;
  var endAngle = Math.PI + pct * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, endAngle);
  ctx.lineWidth = 16;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();

  var ticks = [0, 25, 50, 75, 100];
  var tickColors = { 0:'#e53e3e', 25:'#e53e3e', 50:'#ecc94b', 75:'#4299e1', 100:'#48bb78' };
  ctx.font = 'bold 11px "Exo 2", sans-serif';
  ctx.textAlign = 'center';
  ticks.forEach(function(v) {
    var ang = Math.PI + (v / 100) * Math.PI;
    var x1 = cx + (r - 10) * Math.cos(ang);
    var y1 = cy + (r - 10) * Math.sin(ang);
    var x2 = cx + (r + 6) * Math.cos(ang);
    var y2 = cy + (r + 6) * Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = tickColors[v] || '#4a4a6a';
    ctx.stroke();
    ctx.fillStyle = '#4a4a6a';
    ctx.fillText(String(v), cx + (r + 20) * Math.cos(ang), cy + (r + 20) * Math.sin(ang) + 3);
  });
}
