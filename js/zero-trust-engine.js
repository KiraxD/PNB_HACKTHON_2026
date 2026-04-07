/* =================================================================
   zero-trust-engine.js — QSecure Radar Zero Trust Framework
   NIST SP 800-207 Zero Trust Architecture
   "Never Trust, Always Verify, Assume Breach"

   Pillars assessed:
     1. Identity  — Who is the user? How confident are we?
     2. Device    — Is this device posture acceptable?
     3. Network   — Is the network context trustworthy?
     4. Application — Session behavior & access patterns
     5. Data      — What is being accessed and how?

   Runs continuously in the background. Exposes:
     window.ZeroTrust.getScore()     → 0-100
     window.ZeroTrust.getLevel()     → 'CRITICAL'|'LOW'|'MEDIUM'|'HIGH'|'TRUSTED'
     window.ZeroTrust.getPillars()   → detailed pillar scores
     window.ZeroTrust.getAlerts()    → active trust violations
     window.ZeroTrust.assess(domain, scanResult) → per-domain ZT score
   ================================================================= */

(function() {
'use strict';

var ZT = window.ZeroTrust = {};

/* ── Session state ──────────────────────────────────────────── */
var _state = {
  sessionStart:   Date.now(),
  lastActivity:   Date.now(),
  pageVisits:     [],
  scansRun:       [],
  failedActions:  0,
  mfaVerified:    false,
  alerts:         [],
  pillars:        {},
  score:          0,
  level:          'UNKNOWN',
  evaluated:      false
};

/* ── Pillar weights (total = 100) ───────────────────────────── */
var WEIGHTS = { identity:30, device:20, network:20, application:20, data:10 };

/* ── Score → level mapping ──────────────────────────────────── */
function _level(score) {
  if (score >= 80) return 'TRUSTED';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'CRITICAL';
}

/* ── Identity Pillar ────────────────────────────────────────── */
function _assessIdentity() {
  var user  = window._QSR_USER || {};
  var score = 0;
  var findings = [];

  /* MFA check */
  var hasMFA = !!user.mfa_verified || _state.mfaVerified;
  if (hasMFA) { score += 40; findings.push({ ok:true,  label:'MFA Verified',        detail:'Multi-factor authentication confirmed' }); }
  else         { score += 15; findings.push({ ok:false, label:'MFA Not Verified',    detail:'Session lacks MFA — reduced identity trust' }); }

  /* Session age */
  var ageMins = (Date.now() - _state.sessionStart) / 60000;
  if (ageMins < 30)  { score += 30; findings.push({ ok:true,  label:'Fresh Session',       detail:'Signed in < 30min ago' }); }
  else if (ageMins < 120) { score += 15; findings.push({ ok:false, label:'Aging Session',   detail:'Session > 30min — re-verification recommended' }); }
  else               { score += 5;  findings.push({ ok:false, label:'Stale Session',        detail:'Session > 2hrs — re-authentication required' });
    _addAlert('warn', 'Session Age', 'Session is over 2 hours old. Re-authenticate to maintain trust.'); }

  /* Role defined */
  if (user.role) { score += 20; findings.push({ ok:true, label:'Role Assigned', detail:'User role: ' + (user.role||'soc') }); }
  else            { findings.push({ ok:false, label:'No Role', detail:'User has no RBAC role assigned' }); }

  /* Last activity recency */
  var idleMins = (Date.now() - _state.lastActivity) / 60000;
  if (idleMins < 5)  { score += 10; findings.push({ ok:true,  label:'Active Session',      detail:'Last action < 5min ago' }); }
  else if (idleMins > 15) { findings.push({ ok:false, label:'Idle Warning',     detail:'No activity for ' + Math.round(idleMins) + 'min' }); }

  return { score: Math.min(score, 100), findings };
}

/* ── Device Pillar ──────────────────────────────────────────── */
function _assessDevice() {
  var score = 0;
  var findings = [];
  var ua = navigator.userAgent || '';

  /* HTTPS */
  if (location.protocol === 'https:') {
    score += 30; findings.push({ ok:true,  label:'HTTPS Transport',       detail:'Connection is encrypted via TLS' });
  } else {
    findings.push({ ok:false, label:'No HTTPS',                detail:'App loaded over HTTP — encrypted channel required' });
    _addAlert('danger', 'Insecure Transport', 'Application not served over HTTPS. Zero Trust requires encrypted transport.');
  }

  /* Cookies + sessionStorage (basic browser security) */
  if (navigator.cookieEnabled) {
    score += 10; findings.push({ ok:true,  label:'Session Storage OK',    detail:'Browser storage enabled for secure session tokens' });
  }

  /* Modern browser check (no IE) */
  var isModern = !ua.includes('MSIE') && !ua.includes('Trident/');
  if (isModern) { score += 20; findings.push({ ok:true,  label:'Modern Browser',       detail:'No known legacy browser vulnerabilities' }); }
  else           { findings.push({ ok:false, label:'Legacy Browser',       detail:'Internet Explorer detected — high risk' });
    _addAlert('danger', 'Legacy Browser', 'Internet Explorer is not supported. Upgrade to a modern browser.'); }

  /* Screen size / mobile check */
  var isMobile = /Android|iPhone|iPad/i.test(ua);
  if (!isMobile) { score += 20; findings.push({ ok:true,  label:'Desktop Environment', detail:'Desktop device — lower mobile risk surface' }); }
  else            { score += 10; findings.push({ ok:false, label:'Mobile Device',        detail:'Mobile devices have elevated BYOD risk' }); }

  /* Do Not Track flag */
  if (navigator.doNotTrack === '1') {
    score += 10; findings.push({ ok:true,  label:'Enhanced Privacy',      detail:'Do Not Track enabled' });
  } else {
    score += 5; findings.push({ ok:false, label:'No DNT',                 detail:'Do Not Track not enabled' });
  }

  /* Console devtools heuristic (crude check for open devtools) */
  var devtools = false;
  try { var t = new Date(); console.profile(); console.profileEnd(); if (new Date() - t > 100) devtools = true; } catch(e) {}
  if (!devtools) { score += 10; findings.push({ ok:true, label:'No DevTools Detected',  detail:'Browser developer tools appear closed' }); }
  else            { findings.push({ ok:false, label:'DevTools Open',      detail:'Developer tools may expose session tokens' }); }

  return { score: Math.min(score, 100), findings };
}

/* ── Network Pillar ─────────────────────────────────────────── */
function _assessNetwork() {
  var score = 50; /* default mid — we can't truly assess network from browser */
  var findings = [];
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;

  /* Connection type */
  if (conn && conn.type) {
    if (conn.type === 'ethernet' || conn.type === 'wifi') {
      score += 20; findings.push({ ok:true,  label:'Wired/WiFi Network',   detail:'Stable, known connection type' });
    } else if (conn.type === 'cellular') {
      findings.push({ ok:false, label:'Cellular Network',     detail:'Mobile data — higher interception risk' });
    }
  } else {
    score += 10; findings.push({ ok:false, label:'Network Type Unknown',   detail:'Cannot detect connection type — treat with caution' });
  }

  /* Online status */
  if (navigator.onLine) {
    score += 10; findings.push({ ok:true,  label:'Network Reachable',     detail:'Active internet connection confirmed' });
  } else {
    findings.push({ ok:false, label:'Offline',                detail:'No internet — cannot complete continuous verification' });
  }

  /* Check if referrer is same origin */
  var ref = document.referrer;
  if (!ref || ref.startsWith(location.origin)) {
    score += 20; findings.push({ ok:true,  label:'Trusted Origin',        detail:'Navigation from trusted source' });
  } else {
    findings.push({ ok:false, label:'External Referrer',     detail:'Navigated from: ' + ref });
  }

  return { score: Math.min(score, 100), findings };
}

/* ── Application Pillar ─────────────────────────────────────── */
function _assessApplication() {
  var score = 40; /* baseline */
  var findings = [];
  var visits = _state.pageVisits.length;
  var scans  = _state.scansRun.length;

  /* Page activity — normal usage */
  if (visits >= 2 && visits <= 20) {
    score += 20; findings.push({ ok:true,  label:'Normal Navigation',     detail: visits + ' page visits this session' });
  } else if (visits > 20) {
    findings.push({ ok:false, label:'High Navigation Volume',  detail: visits + ' visits — possible scraping attempt' });
    _addAlert('warn', 'High Navigation', 'Unusually high page visit count detected: ' + visits);
  } else {
    score += 10; findings.push({ ok:false, label:'Limited Activity',      detail:'Only ' + visits + ' page visit(s) so far' });
  }

  /* Scan rate */
  var recentScans = _state.scansRun.filter(function(t){ return Date.now()-t < 300000; }).length;
  if (recentScans <= 5) {
    score += 20;
    findings.push({ ok:true,  label:'Normal Scan Rate',       detail: recentScans + ' scans in last 5min' });
  } else {
    score -= 10;
    findings.push({ ok:false, label:'High Scan Rate',         detail: recentScans + ' scans in 5min — possible automated attack' });
    _addAlert('danger', 'Scan Rate Alert', 'Automated scanning pattern detected: ' + recentScans + ' scans in 5min.');
  }

  /* Failed actions */
  if (_state.failedActions === 0) {
    score += 20; findings.push({ ok:true,  label:'No Failed Actions',     detail:'No error-inducing actions this session' });
  } else {
    score -= _state.failedActions * 5;
    findings.push({ ok:false, label:'Failed Actions',          detail: _state.failedActions + ' failed action(s) recorded' });
  }

  return { score: Math.max(0, Math.min(score, 100)), findings };
}

/* ── Data Pillar ─────────────────────────────────────────────── */
function _assessData() {
  var score = 60;
  var findings = [];
  var user = window._QSR_USER || {};

  /* Role-appropriate access */
  var role = user.role || 'soc';
  if (role === 'soc') {
    score += 20; findings.push({ ok:true,  label:'Least Privilege',       detail:'SOC Analyst: read access to scanner + posture data' });
  } else if (role === 'compliance') {
    score += 15; findings.push({ ok:true,  label:'Scoped Access',         detail:'Compliance role: reporting + audit access' });
  } else if (role === 'admin') {
    score += 10; findings.push({ ok:false, label:'Elevated Privileges',   detail:'Admin access — all data accessible. Monitor closely.' });
    _addAlert('warn', 'Admin Session', 'Elevated admin access active. Ensure minimum necessary privilege.');
  }

  /* Data sensitivity in current scans */
  if (_state.scansRun.length === 0) {
    score += 20; findings.push({ ok:true,  label:'No Sensitive Data Access', detail:'No TLS scans performed yet' });
  } else {
    score += 10; findings.push({ ok:true,  label:'Scan Data Accessed',    detail: _state.scansRun.length + ' TLS scan(s) performed this session' });
  }

  return { score: Math.min(score, 100), findings };
}

/* ── Alert management ───────────────────────────────────────── */
function _addAlert(type, title, detail) {
  /* Deduplicate by title */
  if (_state.alerts.find(function(a){ return a.title === title; })) return;
  _state.alerts.push({ type, title, detail, time: new Date().toISOString() });
  /* Show toast if available */
  if (window.showToast && type === 'danger') showToast('[Zero Trust] ' + title + ': ' + detail, 'error');
}

/* ── Main evaluation ─────────────────────────────────────────── */
ZT.evaluate = function() {
  _state.alerts = []; /* reset alerts before re-eval */
  var id  = _assessIdentity();
  var dev = _assessDevice();
  var net = _assessNetwork();
  var app = _assessApplication();
  var dat = _assessData();

  var weighted = Math.round(
    id.score  * WEIGHTS.identity    / 100 +
    dev.score * WEIGHTS.device      / 100 +
    net.score * WEIGHTS.network     / 100 +
    app.score * WEIGHTS.application / 100 +
    dat.score * WEIGHTS.data        / 100
  );

  _state.pillars = {
    identity:    { score: id.score,  findings: id.findings,  weight: WEIGHTS.identity,    label:'Identity',    icon:'👤' },
    device:      { score: dev.score, findings: dev.findings, weight: WEIGHTS.device,      label:'Device',      icon:'💻' },
    network:     { score: net.score, findings: net.findings, weight: WEIGHTS.network,     label:'Network',     icon:'🌐' },
    application: { score: app.score, findings: app.findings, weight: WEIGHTS.application, label:'Application', icon:'⚙️' },
    data:        { score: dat.score, findings: dat.findings, weight: WEIGHTS.data,        label:'Data',        icon:'🗄️' }
  };
  _state.score     = weighted;
  _state.level     = _level(weighted);
  _state.evaluated = true;
  _state.lastEval  = Date.now();

  /* Update header badge */
  _updateHeaderBadge();
  return _state;
};

/* ── Header ZT badge update ─────────────────────────────────── */
function _updateHeaderBadge() {
  var badge = document.getElementById('zt-trust-badge');
  if (!badge) return;
  var lvl = _state.level;
  var col = { TRUSTED:'#48bb78', HIGH:'#4299e1', MEDIUM:'#ecc94b', LOW:'#ed8936', CRITICAL:'#e53e3e', UNKNOWN:'#888' }[lvl] || '#888';
  badge.innerHTML =
    '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(' +
    (lvl==='TRUSTED'?'72,187,120':lvl==='HIGH'?'66,153,225':lvl==='MEDIUM'?'236,201,75':lvl==='LOW'?'237,137,54':'229,62,62') +
    ',0.18);border:1px solid ' + col + ';color:' + col + ';cursor:pointer;" onclick="navigateTo(\'zero-trust\')">' +
    '<span style="width:7px;height:7px;border-radius:50%;background:' + col + ';animation:pulse 2s infinite;"></span>' +
    '🛡 ZT:' + _state.score + ' ' + lvl + '</span>';
}

/* ── Public API ──────────────────────────────────────────────── */
ZT.getScore   = function() { return _state.score; };
ZT.getLevel   = function() { return _state.level; };
ZT.getPillars = function() { return _state.pillars; };
ZT.getAlerts  = function() { return _state.alerts; };
ZT.getState   = function() { return _state; };

/* Track page navigation */
ZT.trackPage = function(page) {
  _state.pageVisits.push({ page, time: Date.now() });
  _state.lastActivity = Date.now();
};

/* Track scan events */
ZT.trackScan = function(host) {
  _state.scansRun.push(Date.now());
  _state.lastActivity = Date.now();
};

/* Track failed action */
ZT.trackFailure = function() {
  _state.failedActions++;
  _state.lastActivity = Date.now();
};

ZT.noteMFAVerified = function(value) {
  _state.mfaVerified = value !== false;
  _state.lastActivity = Date.now();
};

/* ── Per-domain Zero Trust assessment ───────────────────────── */
/* Called after a TLS scan. Evaluates ZT posture of the TARGET domain. */
ZT.assessDomain = function(host, scanResult) {
  var r = scanResult || {};
  var hdrs = r.secHeaders || [];
  var score = 0;
  var findings = [];

  /* 1. HTTPS enforced */
  if (r.hsts) {
    score += 20;
    findings.push({ ok:true,  label:'HSTS Enforced',         detail:'max-age=' + (r.hstsMaxAge||'?') + 's — HTTPS-only enforced' });
  } else {
    findings.push({ ok:false, label:'No HSTS',               detail:'Domain does not enforce HTTPS-only. MITM risk.' });
  }

  /* 2. Modern TLS */
  if (r.tlsVersion >= '1.3') {
    score += 20; findings.push({ ok:true,  label:'TLS 1.3',              detail:'Post-quantum-ready cipher negotiation possible' });
  } else if (r.tlsVersion === '1.2') {
    score += 10; findings.push({ ok:false, label:'TLS 1.2',              detail:'TLS 1.2 — upgrade to 1.3 for ZT compliance' });
  } else {
    findings.push({ ok:false, label:'Legacy TLS ' + (r.tlsVersion||'?'), detail:'Legacy protocol — fails Zero Trust network requirement' });
  }

  /* 3. Content Security Policy */
  var hasCSP = hdrs.find(function(h){ return h.name === 'Content-Security-Policy' && h.ok; });
  if (hasCSP) {
    score += 15; findings.push({ ok:true,  label:'CSP Present',          detail:'Application-layer ZT: CSP restricts script execution' });
  } else {
    findings.push({ ok:false, label:'No CSP',                detail:'No Content-Security-Policy header — XSS vector open' });
  }

  /* 4. X-Frame-Options */
  var hasXFO = hdrs.find(function(h){ return h.name === 'X-Frame-Options' && h.ok; });
  if (hasXFO) {
    score += 10; findings.push({ ok:true,  label:'Clickjacking Protection', detail:'X-Frame-Options prevents UI redress attacks' });
  } else {
    findings.push({ ok:false, label:'No Clickjacking Protection', detail:'Missing X-Frame-Options header' });
  }

  /* 5. Forward Secrecy */
  var hasPFS = r.ciphers && r.ciphers.some(function(c){ return c.forward; });
  if (hasPFS) {
    score += 15; findings.push({ ok:true,  label:'Perfect Forward Secrecy', detail:'Session keys not recoverable retroactively' });
  } else {
    findings.push({ ok:false, label:'No PFS',                detail:'Session data vulnerable to future key compromise' });
  }

  /* 6. Cert validity */
  if (r.daysLeft > 30) {
    score += 10; findings.push({ ok:true,  label:'Certificate Valid',    detail: r.daysLeft + ' days remaining — certificate healthy' });
  } else if (r.daysLeft > 0) {
    score += 5;  findings.push({ ok:false, label:'Cert Expiring Soon',   detail:'Only ' + r.daysLeft + ' days left — renew immediately' });
  } else {
    findings.push({ ok:false, label:'Certificate Expired',   detail:'EXPIRED certificate — do not trust this domain' });
  }

  /* 7. Micro-segmentation signal (CDN = some segmentation) */
  var isCDN = r.server && /cloudflare|akamai|fastly|cloudfront|cdn/i.test(r.server);
  if (isCDN) {
    score += 10; findings.push({ ok:true,  label:'CDN/WAF Detected',     detail:'Edge protection layer: ' + r.server + ' — reduces attack surface' });
  } else {
    findings.push({ ok:false, label:'No CDN/WAF',            detail:'Direct-to-origin — no WAF micro-segmentation detected' });
  }

  var level = score >= 70 ? 'COMPLIANT' : score >= 40 ? 'PARTIAL' : 'NON-COMPLIANT';
  return { host, score, level, findings };
};

/* ── Continuous re-evaluation every 60s ─────────────────────── */
ZT.start = function() {
  ZT.evaluate();
  setInterval(ZT.evaluate, 60000);
};

/* ── Boot ────────────────────────────────────────────────────── */
if (document.readyState === 'complete') {
  ZT.start();
} else {
  window.addEventListener('load', function(){ setTimeout(ZT.start, 800); });
}

})();
