/* charts.js - Responsive Canvas Charts for QSecure Radar
   Horizontal bars | Donut | Gauge | Sparkline
   All charts auto-size to their container, no overlapping labels. */

window.QSR = window.QSR || {};

/* ── Canvas Helper: resize canvas to its CSS rendered size ─── */
QSR._fit = function(id) {
  var el = document.getElementById(id);
  if (!el) return null;
  var w = el.parentElement ? el.parentElement.clientWidth : el.clientWidth;
  var h = parseInt(el.getAttribute('data-h') || el.getAttribute('height') || '160');
  var dpr = window.devicePixelRatio || 1;
  el.width  = Math.max(w, 60) * dpr;
  el.height = h * dpr;
  el.style.width  = Math.max(w, 60) + 'px';
  el.style.height = h + 'px';
  var ctx = el.getContext('2d');
  ctx.scale(dpr, dpr);
  return { el:el, ctx:ctx, w:Math.max(w, 60), h:h };
};

/* ── Horizontal Bar Chart (labels LEFT, bars MID, values RIGHT) ── */
QSR.drawBars = function(canvasId, items) {
  if (!items || !items.length) return;
  var c = QSR._fit(canvasId);
  if (!c) return;
  var ctx = c.ctx, W = c.w, H = c.h;
  ctx.clearRect(0, 0, W, H);

  var maxVal = Math.max.apply(null, items.map(function(x){ return x.value || 0; })) || 1;
  var labelW = 110;  /* fixed left column for labels */
  var valW   = 36;   /* fixed right column for values */
  var barAreaW = W - labelW - valW - 8;
  var count  = items.length;
  var slotH  = H / count;
  var barH   = Math.max(12, Math.min(28, slotH * 0.52));
  var barR   = Math.min(4, barH / 2);

  items.forEach(function(item, i) {
    var barW = Math.max(barR * 2, (item.value / maxVal) * barAreaW);
    var y    = i * slotH + (slotH - barH) / 2;
    var x    = labelW;

    /* Label — right-aligned in left column, truncated */
    var label = (item.label || '').substring(0, 16);
    ctx.font = '11px "Exo 2", sans-serif';
    ctx.fillStyle = '#4a4a6a';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, labelW - 8, y + barH / 2);

    /* Bar background track */
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    QSR._roundRect(ctx, x, y, barAreaW, barH, barR);
    ctx.fill();

    /* Bar fill with gradient */
    var grad = ctx.createLinearGradient(x, 0, x + barW, 0);
    var col = item.color || '#4299e1';
    grad.addColorStop(0, col);
    grad.addColorStop(1, QSR._lighten(col, 0.2));
    ctx.fillStyle = grad;
    ctx.beginPath();
    QSR._roundRect(ctx, x, y, barW, barH, barR);
    ctx.fill();

    /* Value — right side */
    ctx.font = 'bold 13px "Rajdhani", sans-serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.value, x + barAreaW + 6, y + barH / 2);
  });
};

/* Helper: rounded rect path */
QSR._roundRect = function(ctx, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/* Helper: lighten hex color */
QSR._lighten = function(hex, amt) {
  var c = parseInt(hex.replace('#',''), 16);
  var r = Math.min(255, (c >> 16) + Math.round(255 * amt));
  var g = Math.min(255, ((c >> 8) & 0xff) + Math.round(255 * amt));
  var b = Math.min(255, (c & 0xff) + Math.round(255 * amt));
  return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
};

/* ── Donut Chart ──────────────────────────────────────────── */
QSR.drawDonut = function(canvasId, segments, centerLabel, centerSub) {
  var c = QSR._fit(canvasId);
  if (!c) return;
  var ctx = c.ctx, W = c.w, H = c.h;
  var cx = W / 2, cy = H / 2;
  var r  = Math.min(W, H) * 0.40;
  var inner = r * 0.62;
  var total = segments.reduce(function(s, seg){ return s + (seg.value || 0); }, 0);
  if (!total) return;
  ctx.clearRect(0, 0, W, H);

  var startAngle = -Math.PI / 2;
  segments.forEach(function(seg) {
    var slice = (seg.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    /* Separation gap */
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r + 1, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle += slice;
  });

  /* Donut hole */
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  /* Center labels */
  if (centerLabel) {
    ctx.fillStyle = '#1a1a2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Rajdhani", sans-serif';
    ctx.fillText(centerLabel, cx, centerSub ? cy - 7 : cy + 2);
    if (centerSub) {
      ctx.font = '11px "Exo 2", sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(centerSub, cx, cy + 11);
    }
  }
};

/* ── Semi-Circle Gauge (0 to maxVal) ─────────────────────── */
QSR.drawGauge = function(canvasId, value, maxValue, color, label) {
  var c = QSR._fit(canvasId);
  if (!c) return;
  var ctx = c.ctx, W = c.w, H = c.h;
  var cx  = W / 2;
  var cy  = H * 0.78;
  var r   = Math.min(W * 0.48, H * 0.75);
  var lw  = Math.max(10, r * 0.18);
  maxValue = maxValue || 100;
  ctx.clearRect(0, 0, W, H);

  /* Background track */
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.strokeStyle = '#e8e8f0';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.stroke();

  /* Colored arc */
  var frac = Math.min(value, maxValue) / maxValue;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI + frac * Math.PI);
  ctx.strokeStyle = color || '#4299e1';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.stroke();

  /* Tick marks */
  var ticks = [0, 25, 50, 75, 100];
  ticks.forEach(function(v) {
    var a = Math.PI + (v / maxValue) * Math.PI;
    var ri = r - lw / 2 - 4, ro = r + lw / 2 + 4;
    ctx.beginPath();
    ctx.moveTo(cx + ri * Math.cos(a), cy + ri * Math.sin(a));
    ctx.lineTo(cx + ro * Math.cos(a), cy + ro * Math.sin(a));
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Tick label */
    var lx = cx + (ro + 14) * Math.cos(a);
    var ly = cy + (ro + 14) * Math.sin(a);
    ctx.font = '10px "Exo 2", sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(v, lx, ly);
  });

  /* Center score text */
  if (label !== undefined) {
    ctx.font = 'bold ' + Math.round(r * 0.4) + 'px "Rajdhani", sans-serif';
    ctx.fillStyle = color || '#1a1a2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, cx, cy - r * 0.1);
    ctx.font = '12px "Exo 2", sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('/ ' + maxValue, cx, cy + r * 0.12);
  }
};

/* ── Sparkline ────────────────────────────────────────────── */
QSR.drawSparkline = function(canvasId, values, color) {
  var c = QSR._fit(canvasId);
  if (!c || !values || !values.length) return;
  var ctx = c.ctx, W = c.w, H = c.h;
  var max = Math.max.apply(null, values);
  var min = Math.min.apply(null, values);
  var range = (max - min) || 1;
  ctx.clearRect(0, 0, W, H);

  /* Fill area */
  var col = color || '#4299e1';
  var grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, col + '44');
  grad.addColorStop(1, col + '00');

  ctx.beginPath();
  values.forEach(function(v, i) {
    var x = (i / (values.length - 1)) * W;
    var y = H - ((v - min) / range) * (H - 4) - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  /* Line */
  ctx.beginPath();
  values.forEach(function(v, i) {
    var x = (i / (values.length - 1)) * W;
    var y = H - ((v - min) / range) * (H - 4) - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
};
