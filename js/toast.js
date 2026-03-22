/* ============================================================
   toast.js — QSecure Radar Global Toast Notification System
   Replaces all alert() calls with premium animated toasts.
   Usage: QSR.toast(message, type, duration)
   Types: 'success' | 'error' | 'warning' | 'info'
   ============================================================ */
(function() {
  'use strict';

  var _root = null;

  var THEME = {
    success: { bg:'rgba(10,40,24,0.97)', border:'#48bb78', icon:'✓', label:'SUCCESS', text:'#68d391' },
    error:   { bg:'rgba(50,10,10,0.97)', border:'#fc8181', icon:'✕', label:'ERROR',   text:'#fc8181' },
    warning: { bg:'rgba(50,34,10,0.97)', border:'#f6ad55', icon:'!', label:'WARNING', text:'#f6ad55' },
    info:    { bg:'rgba(10,28,50,0.97)', border:'#63b3ed', icon:'i', label:'INFO',    text:'#63b3ed' }
  };

  function _getRoot() {
    if (!_root) {
      _root = document.createElement('div');
      _root.id = 'qsr-toast-root';
      Object.assign(_root.style, {
        position:'fixed', top:'16px', right:'16px', zIndex:'99999',
        display:'flex', flexDirection:'column', gap:'10px',
        pointerEvents:'none', maxWidth:'400px', width:'calc(100% - 32px)'
      });
      document.body.appendChild(_root);
    }
    return _root;
  }

  function _injectStyle() {
    if (document.getElementById('qsr-toast-style')) return;
    var s = document.createElement('style');
    s.id = 'qsr-toast-style';
    s.textContent = [
      '@keyframes qsr-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}',
      '@keyframes qsr-in{from{transform:translateX(calc(100% + 24px));opacity:0}to{transform:translateX(0);opacity:1}}',
      '#qsr-toast-root .qsr-t{animation:qsr-in 0.38s cubic-bezier(0.34,1.4,0.64,1) forwards}',
      '#qsr-toast-root .qsr-t.qsr-out{transform:translateX(calc(100% + 24px))!important;opacity:0!important;transition:transform 0.35s ease,opacity 0.3s ease}'
    ].join('');
    document.head.appendChild(s);
  }

  function dismiss(el) {
    el.classList.add('qsr-out');
    setTimeout(function() { el.parentNode && el.parentNode.removeChild(el); }, 380);
  }

  function show(msg, type, duration) {
    type     = THEME[type] ? type : 'info';
    duration = (duration === 0) ? 0 : (duration || 4500);
    var t = THEME[type];

    _injectStyle();

    var el = document.createElement('div');
    el.className = 'qsr-t';
    el.style.cssText = [
      'background:' + t.bg,
      'border:1px solid ' + t.border,
      'border-left:4px solid ' + t.border,
      'border-radius:10px',
      'padding:14px 16px',
      'display:flex',
      'align-items:flex-start',
      'gap:12px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.04)',
      'pointer-events:all',
      'font-family:Exo 2,system-ui,sans-serif',
      'position:relative',
      'overflow:hidden'
    ].join(';');

    el.innerHTML =
      '<div style="width:22px;height:22px;border-radius:50%;background:' + t.border + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:900;color:#0d0d1a;margin-top:1px;">' + t.icon + '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:10px;font-weight:800;color:' + t.border + ';letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">' + t.label + '</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.88);line-height:1.5;word-break:break-word;">' + msg + '</div>' +
      '</div>' +
      '<button style="background:none;border:none;color:rgba(255,255,255,0.35);font-size:20px;line-height:1;cursor:pointer;padding:0;flex-shrink:0;transition:color 0.2s;margin-top:-2px;"' +
        ' onmouseover="this.style.color=\'rgba(255,255,255,0.8)\'" onmouseout="this.style.color=\'rgba(255,255,255,0.35)\'"' +
        ' onclick="(function(el){el.classList.add(\'qsr-out\');setTimeout(function(){el.parentNode&&el.parentNode.removeChild(el)},380);})(this.closest(\'.qsr-t\'))">×</button>' +
      (duration > 0
        ? '<div style="position:absolute;bottom:0;left:0;height:2px;background:' + t.border + ';width:100%;transform-origin:left;animation:qsr-bar ' + (duration / 1000).toFixed(1) + 's linear forwards;"></div>'
        : '');

    _getRoot().appendChild(el);

    if (duration > 0) {
      setTimeout(function() { el.parentNode && dismiss(el); }, duration);
    }
    return el;
  }

  /* Public API */
  window.QSR = window.QSR || {};
  window.QSR.toast = show;
})();
