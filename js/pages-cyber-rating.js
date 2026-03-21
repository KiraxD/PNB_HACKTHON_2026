/* pages-cyber-rating.js - Cyber Rating Page (FR10, FR14) */
/* QR Score range: 0-100 per SRS FR9 */

window._cyberRatingPage = function() {
  return '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;margin-bottom:14px;">Cyber Rating Dashboard (FR10, FR14)</div>' +

    '<div class="grid-2" style="margin-bottom:12px;">' +

    /* Gauge panel */
    '<div class="panel" style="text-align:center;">' +
    '<div class="panel-title">Enterprise QR Score (FR9 - Scale: 0 to 100)</div>' +
    '<canvas id="chart-gauge" data-h="200" style="width:100%;display:block;"></canvas>' +
    '<div id="gauge-score-label" style="font-family:Rajdhani;font-size:48px;font-weight:700;color:#e53e3e;line-height:1;margin-top:-30px;">42</div>' +
    '<div style="font-size:13px;color:#4a4a6a;margin-bottom:4px;">out of 100</div>' +
    '<div id="gauge-grade" style="font-family:Rajdhani;font-size:18px;font-weight:700;background:rgba(229,62,62,0.1);color:#e53e3e;padding:6px 20px;border-radius:20px;display:inline-block;margin-bottom:8px;">Tier 3 - Satisfactory</div>' +
    '<div style="font-size:12px;color:#888;">Lower score = higher quantum risk | 76-100 = Elite PQC</div>' +
    '</div>' +

    /* Tier breakdown */
    '<div class="panel"><div class="panel-title">PQC Tier Classification (FR10)</div>' +
    '<div class="table-wrap"><table class="data-table" id="tier-table"><thead><tr><th>Tier</th><th>Score Range</th><th>Assets</th><th>Status</th></tr></thead>' +
    '<tbody id="tier-tbody"><tr><td colspan="4" style="text-align:center;padding:20px;color:#aaa;">Loading...</td></tr></tbody>' +
    '</table></div>' +
    '<div style="margin-top:12px;font-size:12px;color:#4a4a6a;line-height:1.6;">' +
    '<strong>NIST PQC Migration Targets (FR12):</strong><br>' +
    'CRYSTALS-Kyber (ML-KEM) for key encapsulation<br>' +
    'CRYSTALS-Dilithium (ML-DSA) for digital signatures<br>' +
    'SPHINCS+ for hash-based signatures' +
    '</div></div>' +
    '</div>' +

    /* Per-asset table */
    '<div class="panel"><div class="panel-title">Per-Asset PQC Score Breakdown (FR9)</div>' +
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Asset</th><th>QR Score (0-100)</th><th>Grade</th><th>TLS Ver</th><th>Score Bar</th></tr></thead>' +
    '<tbody id="asset-score-tbody"><tr><td colspan="5" style="text-align:center;padding:20px;color:#aaa;">Loading assets...</td></tr></tbody>' +
    '</table></div></div>';
};

window.initCyberRating = async function() {
  var rating = QSR.cyberRating;
  var pqc    = QSR.pqcPosture;

  /* Fetch live data if available */
  if (window.QSR_DataLayer) {
    try {
      var liveRating = await window.QSR_DataLayer.fetchCyberRating();
      if (liveRating) rating = liveRating;
      var livePQC = await window.QSR_DataLayer.fetchPQCScores();
      if (livePQC) pqc = livePQC;
    } catch(e) { console.warn('[CyberRating]', e); }
  }

  var score = rating.enterpriseScore || 42;
  var grade = rating.grade || 'Tier 3 - Satisfactory';

  /* Score color by tier */
  var scoreColor = score >= 76 ? '#48bb78' : score >= 51 ? '#4299e1' : score >= 26 ? '#ecc94b' : '#e53e3e';

  /* Update labels */
  var scoreEl = document.getElementById('gauge-score-label');
  var gradeEl = document.getElementById('gauge-grade');
  if (scoreEl) { scoreEl.textContent = score; scoreEl.style.color = scoreColor; }
  if (gradeEl) { gradeEl.textContent = grade; gradeEl.style.color = scoreColor; gradeEl.style.background = scoreColor + '18'; }

  /* Draw gauge (0-100, arc sweeps left-to-right) */
  QSR.drawGauge('chart-gauge', score, 100, scoreColor, score);

  /* Tier classification table */
  var tierTbody = document.getElementById('tier-tbody');
  if (tierTbody) {
    var tiers = rating.tiers || QSR.cyberRating.tiers;
    tierTbody.innerHTML = tiers.map(function(t) {
      return '<tr>' +
        '<td style="font-weight:700;color:'+t.color+';">' + t.tier + '</td>' +
        '<td style="font-family:Rajdhani;font-size:16px;font-weight:700;">' + t.range + '</td>' +
        '<td style="font-family:Rajdhani;font-size:18px;font-weight:700;color:'+t.color+';">' + t.count + '</td>' +
        '<td style="font-size:12px;color:#4a4a6a;">' + t.desc + '</td>' +
        '</tr>';
    }).join('');
  }

  /* Per-asset table */
  var assetTbody = document.getElementById('asset-score-tbody');
  if (assetTbody && pqc && pqc.assets) {
    var tlsMap = { 'Elite-PQC':'1.3', Standard:'1.3', Legacy:'1.2', Critical:'1.0' };
    assetTbody.innerHTML = pqc.assets.map(function(a) {
      var s = a.score || 0;
      var c = s >= 76 ? '#48bb78' : s >= 51 ? '#4299e1' : s >= 26 ? '#ecc94b' : '#e53e3e';
      var pct = Math.min(s, 100);
      return '<tr>' +
        '<td style="font-weight:600;">' + a.name + '</td>' +
        '<td><span style="font-family:Rajdhani;font-size:20px;font-weight:700;color:'+c+';">' + s + '</span><span style="font-size:10px;color:#aaa;">/100</span></td>' +
        '<td><span class="badge" style="background:'+c+'22;color:'+c+';border:1px solid '+c+';">' + a.status + '</span></td>' +
        '<td style="font-family:monospace;">' + (tlsMap[a.status]||'1.2') + '</td>' +
        '<td style="min-width:120px;"><div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%;background:'+c+';"></div></div></td>' +
        '</tr>';
    }).join('');
  }
};

/* Draw semi-circle gauge 0-100 */
function drawGauge100(canvasId, score, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var cx = W/2, cy = H * 0.78;
  var r = Math.min(W, H) * 0.58;
  ctx.clearRect(0, 0, W, H);

  /* Background arc */
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.lineWidth = 18; ctx.strokeStyle = '#e8e8f0';
  ctx.lineCap = 'round'; ctx.stroke();

  /* Score arc (0=left, 100=right) */
  var pct = Math.min(score, 100) / 100;
  var endAngle = Math.PI + pct * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, endAngle);
  ctx.lineWidth = 18; ctx.strokeStyle = color;
  ctx.lineCap = 'round'; ctx.stroke();

  /* Tick marks at 0, 25, 50, 75, 100 */
  [0, 25, 50, 75, 100].forEach(function(v) {
    var angle = Math.PI + (v/100) * Math.PI;
    var x1 = cx + (r - 12) * Math.cos(angle);
    var y1 = cy + (r - 12) * Math.sin(angle);
    var x2 = cx + (r + 4)  * Math.cos(angle);
    var y2 = cy + (r + 4)  * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = 2; ctx.strokeStyle = '#4a4a6a'; ctx.stroke();
    /* Label */
    ctx.fillStyle = '#4a4a6a'; ctx.font = '10px Exo 2, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(v, cx + (r + 18) * Math.cos(angle), cy + (r + 18) * Math.sin(angle));
  });
}

