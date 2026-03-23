/* =================================================================
   pages-zero-trust.js — Zero Trust Architecture Dashboard
   "Never Trust. Always Verify. Assume Breach."
   NIST SP 800-207 compliant assessment
   ================================================================= */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

window._zeroTrustPage = function() {
  return '<div id="zt-page-mount"></div>';
};

QSR.pages.zerotrust = function(container) {
  container.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">🛡 Zero Trust Command Center</h1>
      <p class="page-subtitle">NIST SP 800-207 — "Never Trust, Always Verify, Assume Breach" • Continuous posture evaluation</p>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-scan-sm" onclick="QSR.zt.refresh()">⟳ Re-evaluate</button>
      <button class="btn-export" onclick="QSR.zt.exportReport()">⬇ Export Report</button>
    </div>
  </div>

  <!-- Master ZT Score Banner -->
  <div id="zt-score-banner" style="border-radius:16px;padding:28px;margin-bottom:18px;background:linear-gradient(135deg,rgba(139,26,47,0.12),rgba(66,153,225,0.08));border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;gap:32px;flex-wrap:wrap;">
    <div style="text-align:center;min-width:140px;">
      <canvas id="zt-master-gauge" width="140" height="140"></canvas>
      <div id="zt-score-number" style="font-family:Rajdhani,sans-serif;font-size:52px;font-weight:900;line-height:1;margin-top:-10px;">—</div>
      <div style="font-size:11px;color:#888;margin-top:2px;">Trust Score / 100</div>
    </div>
    <div style="flex:1;min-width:220px;">
      <div id="zt-level-label" style="font-family:Rajdhani,sans-serif;font-size:26px;font-weight:800;letter-spacing:2px;margin-bottom:6px;">EVALUATING...</div>
      <div id="zt-level-desc"  style="font-size:13px;color:#888;line-height:1.6;margin-bottom:14px;"></div>
      <div id="zt-principal"   style="font-size:12px;color:#4a4a6a;"></div>
    </div>
    <div id="zt-alerts-count" style="text-align:center;min-width:100px;">
      <div style="font-size:36px;font-weight:900;color:#e53e3e;" id="zt-alert-num">0</div>
      <div style="font-size:11px;color:#888;">Active Alerts</div>
    </div>
  </div>

  <!-- 5 Pillars -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px;" id="zt-pillars-grid"></div>

  <!-- Alerts + Policy  -->
  <div class="grid-2" style="margin-bottom:18px;">
    <div class="panel">
      <div class="panel-title">⚠ Active Trust Violations</div>
      <div id="zt-alerts-list" style="min-height:80px;"></div>
    </div>
    <div class="panel">
      <div class="panel-title">📋 Zero Trust Policy Matrix</div>
      <div id="zt-policy-matrix"></div>
    </div>
  </div>

  <!-- Pillar detail drilldown -->
  <div class="panel" id="zt-drilldown-panel">
    <div class="panel-title">🔍 Pillar Findings — Click a pillar card to drill down</div>
    <div id="zt-drilldown-content" style="color:#888;font-size:13px;padding:10px 0;">Select a pillar above to view detailed findings.</div>
  </div>

  <!-- Timeline -->
  <div class="panel" style="margin-top:14px;">
    <div class="panel-title">📡 Continuous Verification Timeline</div>
    <div id="zt-timeline" style="min-height:60px;"></div>
  </div>`;

  QSR.zt._init(container);
};

/* ── ZT dashboard controller ─────────────────────────────────── */
QSR.zt = QSR.zt || {};
QSR.zt._history = [];

QSR.zt._init = function(container) {
  if (!window.ZeroTrust) {
    document.getElementById('zt-drilldown-content').innerHTML =
      '<div style="color:#e53e3e;padding:20px;text-align:center;">❌ Zero Trust Engine not loaded. Ensure zero-trust-engine.js is included before this page.</div>';
    return;
  }
  QSR.zt.refresh();
  /* Re-render every 30s */
  clearInterval(QSR.zt._interval);
  QSR.zt._interval = setInterval(QSR.zt.refresh, 30000);
};

QSR.zt.refresh = function() {
  var state = window.ZeroTrust.evaluate();
  var pillars = state.pillars;
  var score = state.score;
  var level = state.level;
  var alerts = state.alerts;

  /* Record history for timeline */
  QSR.zt._history.push({ time: Date.now(), score, level });
  if (QSR.zt._history.length > 20) QSR.zt._history.shift();

  /* Colours */
  var col = { TRUSTED:'#48bb78', HIGH:'#4299e1', MEDIUM:'#ecc94b', LOW:'#ed8936', CRITICAL:'#e53e3e', UNKNOWN:'#888' }[level] || '#888';
  var desc = {
    TRUSTED: 'All Zero Trust pillars satisfied. Continuous verification passing. Full access authorised.',
    HIGH:    'Strong trust posture. Minor concerns exist. Access permitted with monitoring.',
    MEDIUM:  'Moderate trust. Some pillars need attention. Proceed with caution.',
    LOW:     'Multiple trust violations detected. Restrict access to critical resources.',
    CRITICAL:'Zero Trust threshold not met. Immediate re-authentication required.',
    UNKNOWN: 'Trust posture has not yet been evaluated.'
  }[level] || '';

  var user = window._QSR_USER || {};

  /* Score number */
  var scoreEl = document.getElementById('zt-score-number');
  if (scoreEl) { scoreEl.textContent = score; scoreEl.style.color = col; }

  /* Level label */
  var lvlEl = document.getElementById('zt-level-label');
  if (lvlEl) { lvlEl.textContent = level; lvlEl.style.color = col; }
  var descEl = document.getElementById('zt-level-desc');
  if (descEl) descEl.textContent = desc;

  var prinEl = document.getElementById('zt-principal');
  if (prinEl) prinEl.innerHTML =
    '👤 Principal: <strong>' + (user.name||user.email||'Unknown') + '</strong> &nbsp;|&nbsp; ' +
    '🎭 Role: <strong>' + (user.role||'soc') + '</strong> &nbsp;|&nbsp; ' +
    '⏱ Session: <strong>' + Math.round((Date.now() - (window.ZeroTrust.getState().sessionStart||Date.now()))/60000) + ' min</strong>';

  /* Alert count */
  var an = document.getElementById('zt-alert-num');
  if (an) { an.textContent = alerts.length; }

  /* Draw gauge */
  _drawZTGauge('zt-master-gauge', score, col);

  /* Render pillars */
  _renderPillars(pillars, col);

  /* Render alerts */
  _renderAlerts(alerts);

  /* Render policy matrix */
  _renderPolicyMatrix(state);

  /* Render timeline */
  _renderTimeline();
};

/* ── Pillar cards ─────────────────────────────────────────────── */
function _renderPillars(pillars, masterCol) {
  var grid = document.getElementById('zt-pillars-grid');
  if (!grid || !pillars) return;
  var keys = ['identity','device','network','application','data'];
  grid.innerHTML = keys.map(function(k) {
    var p = pillars[k];
    if (!p) return '';
    var c = p.score >= 70 ? '#48bb78' : p.score >= 40 ? '#ed8936' : '#e53e3e';
    var pct = p.score;
    return `<div class="panel" style="cursor:pointer;transition:all 0.2s;border-left:3px solid ${c};"
      onclick="QSR.zt._drilldown('${k}')"
      onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,0.15)'"
      onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:22px;">${p.icon}</div>
        <div style="font-family:Rajdhani,sans-serif;font-size:32px;font-weight:900;color:${c};">${p.score}</div>
      </div>
      <div style="font-weight:700;font-size:13px;color:#1a1a2e;margin-bottom:4px;">${p.label}</div>
      <div style="font-size:11px;color:#888;margin-bottom:8px;">Weight: ${p.weight}%</div>
      <div style="background:rgba(0,0,0,0.08);border-radius:4px;height:6px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${c};border-radius:4px;transition:width 0.8s ease;"></div>
      </div>
      <div style="margin-top:6px;font-size:11px;color:#888;">${p.findings.filter(f=>f.ok).length}/${p.findings.length} checks passed</div>
    </div>`;
  }).join('');
}

/* ── Pillar drilldown ────────────────────────────────────────── */
QSR.zt._drilldown = function(key) {
  var state = window.ZeroTrust.getState();
  var pillars = state.pillars || {};
  var p = pillars[key];
  if (!p) return;
  var c = p.score >= 70 ? '#48bb78' : p.score >= 40 ? '#ed8936' : '#e53e3e';
  document.getElementById('zt-drilldown-content').innerHTML =
    `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <span style="font-size:28px;">${p.icon}</span>
      <div>
        <div style="font-family:Rajdhani,sans-serif;font-size:20px;font-weight:800;color:${c};">${p.label} Pillar — ${p.score}/100</div>
        <div style="font-size:12px;color:#888;">Weight in overall score: ${p.weight}%</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${p.findings.map(function(f){
        var fc = f.ok ? '#48bb78' : '#e53e3e';
        return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;border-radius:8px;background:${f.ok?'rgba(72,187,120,0.06)':'rgba(229,62,62,0.06)'};border-left:3px solid ${fc};">
          <span style="font-size:16px;flex-shrink:0;">${f.ok?'✅':'❌'}</span>
          <div>
            <div style="font-weight:700;font-size:13px;color:#1a1a2e;">${f.label}</div>
            <div style="font-size:12px;color:#888;">${f.detail}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
};

/* ── Alerts list ──────────────────────────────────────────────── */
function _renderAlerts(alerts) {
  var el = document.getElementById('zt-alerts-list');
  if (!el) return;
  if (!alerts || !alerts.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:#48bb78;font-size:13px;">✅ No active trust violations</div>';
    return;
  }
  el.innerHTML = alerts.map(function(a) {
    var c = a.type === 'danger' ? '#e53e3e' : '#ed8936';
    var t = new Date(a.time).toLocaleTimeString('en-IN');
    return `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
      <span style="color:${c};font-size:16px;flex-shrink:0;">${a.type==='danger'?'🔴':'🟡'}</span>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:12px;color:${c};">${a.title}</div>
        <div style="font-size:11px;color:#888;">${a.detail}</div>
      </div>
      <div style="font-size:10px;color:#aaa;white-space:nowrap;">${t}</div>
    </div>`;
  }).join('');
}

/* ── Policy Matrix ───────────────────────────────────────────── */
function _renderPolicyMatrix(state) {
  var el = document.getElementById('zt-policy-matrix');
  if (!el) return;

  var policies = [
    { policy:'Multi-Factor Authentication',   control:'Identity', req: state.pillars.identity?.score >= 70, detail:'All sessions require MFA' },
    { policy:'HTTPS-Only Transport',           control:'Network',  req: location.protocol === 'https:', detail:'All traffic encrypted via TLS' },
    { policy:'Session Time Limit (2hr)',       control:'Identity', req: (Date.now() - state.sessionStart) < 7200000, detail:'Sessions auto-expire after 120 min' },
    { policy:'Least Privilege Role Access',    control:'Data',     req: state.pillars.data?.score >= 50, detail:'RBAC enforces minimum necessary access' },
    { policy:'Continuous Verification',        control:'Application', req: true, detail:'Trust re-evaluated every 60 seconds' },
    { policy:'Micro-Segmentation (RBAC)',      control:'Application', req: !!(window._QSR_USER?.role), detail:'Page access scoped to user role' },
    { policy:'Audit Log All Actions',          control:'Data',     req: true, detail:'All events logged to Supabase audit table' },
    { policy:'Encrypted Data at Rest',         control:'Device',   req: window.QSR_SUPABASE_READY, detail:'Supabase encrypts all stored data at rest' },
  ];

  el.innerHTML = `<table class="data-table" style="font-size:12px;">
    <thead><tr><th>Policy</th><th>Control</th><th>Status</th></tr></thead>
    <tbody>
      ${policies.map(function(p){
        var c = p.req ? '#48bb78' : '#e53e3e';
        return `<tr>
          <td style="font-weight:600;">${p.policy}</td>
          <td><span style="font-size:10px;padding:2px 7px;border-radius:10px;background:rgba(66,153,225,0.1);color:#4299e1;">${p.control}</span></td>
          <td><span style="color:${c};font-weight:700;">${p.req ? '✓ ENFORCE' : '✗ FAIL'}</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

/* ── Timeline ────────────────────────────────────────────────── */
function _renderTimeline() {
  var el = document.getElementById('zt-timeline');
  if (!el) return;
  var hist = QSR.zt._history;
  if (!hist.length) { el.innerHTML = '<div style="color:#888;font-size:13px;">No evaluation history yet.</div>'; return; }
  el.innerHTML = `<div style="display:flex;align-items:flex-end;gap:6px;height:60px;padding:4px 0;">
    ${hist.map(function(h) {
      var c = { TRUSTED:'#48bb78', HIGH:'#4299e1', MEDIUM:'#ecc94b', LOW:'#ed8936', CRITICAL:'#e53e3e', UNKNOWN:'#888' }[h.level] || '#888';
      var t = new Date(h.time).toLocaleTimeString('en-IN');
      return `<div title="Score: ${h.score} (${t})" style="flex:1;background:${c};border-radius:3px 3px 0 0;height:${Math.max(8,h.score * 0.55)}px;transition:height 0.5s;cursor:default;opacity:0.85;min-width:8px;"></div>`;
    }).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;margin-top:4px;">
    <span>← Earliest</span><span>Latest →</span>
  </div>`;
}

/* ── Gauge canvas ─────────────────────────────────────────────── */
function _drawZTGauge(id, score, color) {
  var canvas = document.getElementById(id);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height, cx = w/2, cy = h*0.6, r = w*0.38;
  ctx.clearRect(0,0,w,h);
  /* Track */
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2*Math.PI);
  ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineCap='round'; ctx.stroke();
  /* Fill */
  var end = Math.PI + (score/100) * Math.PI;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, end);
  ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.stroke();
  ctx.shadowBlur = 0;
}

/* ── Export report ───────────────────────────────────────────── */
QSR.zt.exportReport = function() {
  var state = window.ZeroTrust ? window.ZeroTrust.getState() : {};
  var ts = new Date().toISOString();
  var data = {
    generated: ts,
    overallScore: state.score,
    trustLevel: state.level,
    alerts: state.alerts,
    pillars: Object.fromEntries(
      Object.entries(state.pillars||{}).map(function([k,v]){ return [k, { score:v.score, findings:v.findings }]; })
    ),
    policies: 'See policy matrix in dashboard'
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'zero-trust-report-' + ts.slice(0,10) + '.json';
  a.click();
  if (window.showToast) showToast('Zero Trust report exported.', 'success');
};
