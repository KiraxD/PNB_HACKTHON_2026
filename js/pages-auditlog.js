/* pages-auditlog.js — Elite Security Audit Log (FR15)
   Live event stream • Timeline view • Severity badges */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.auditlog = async function(container) {
  if (window._auditChannel) {
    try { window._auditChannel.unsubscribe(); } catch(e) {}
    window._auditChannel = null;
  }

  container.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">📋 Security Audit Log</h1>
      <p class="page-subtitle">Real-time event stream powered by Supabase Realtime • FR15</p>
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <span id="realtime-dot" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#48bb78;font-weight:600;">
        <span class="live-dot"></span>LIVE
      </span>
      <button class="btn-secondary" id="view-toggle-btn" onclick="QSR._toggleAuditView()">⋮ Timeline View</button>
      <button class="btn-export" onclick="QSR.exportAuditCSV()">⬇ Export CSV</button>
    </div>
  </div>

  <!-- Stats Strip -->
  <div class="audit-stats-strip">
    <div class="audit-stat"><div class="audit-stat-val" id="as-total">—</div><div class="audit-stat-label">Total Events</div></div>
    <div class="audit-stat"><div class="audit-stat-val" id="as-critical">—</div><div class="audit-stat-label">Critical</div></div>
    <div class="audit-stat"><div class="audit-stat-val" id="as-scans">—</div><div class="audit-stat-label">Scans Run</div></div>
    <div class="audit-stat"><div class="audit-stat-val" id="as-reports">—</div><div class="audit-stat-label">Reports Generated</div></div>
    <div class="audit-stat"><div class="audit-stat-val" id="as-logins">—</div><div class="audit-stat-label">User Logins</div></div>
  </div>

  <!-- Filters -->
  <div class="panel" style="padding:12px 16px;margin-bottom:14px;">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <div class="search-wrap" style="flex:1;min-width:180px;margin:0;">
        <span class="search-icon">🔍</span>
        <input id="audit-search" class="search-input" placeholder="Search events, targets..." oninput="QSR._filterAudit()">
      </div>
      <select id="audit-type" class="form-select" style="width:170px;" onchange="QSR._filterAudit()">
        <option value="">All Actions</option>
        <option>SCAN_COMPLETED</option><option>CERT_EXPIRY_ALERT</option>
        <option>USER_LOGIN</option><option>CBOM_GENERATED</option>
        <option>PQC_ASSESSMENT</option><option>WEAK_KEY_DETECTED</option>
        <option>REPORT_GENERATED</option><option>POLICY_VIOLATION</option>
      </select>
      <select id="audit-sev" class="form-select" style="width:120px;" onchange="QSR._filterAudit()">
        <option value="">All Severity</option>
        <option value="danger">Critical</option>
        <option value="warn">Warning</option>
        <option value="ok">OK</option>
        <option value="info">Info</option>
      </select>
      <span id="audit-count" style="font-size:12px;color:#888;margin-left:auto;white-space:nowrap;"></span>
    </div>
  </div>

  <!-- Table view -->
  <div id="audit-table-view" class="panel">
    <div class="panel-title">⚡ Event Stream</div>
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr>
          <th width="24"></th><th>Time</th><th>Action</th><th>Target</th><th>IP Address</th><th>Severity</th>
        </tr></thead>
        <tbody id="audit-tbody"><tr><td colspan="6" class="loading-cell">Loading audit log...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- Timeline view (hidden by default) -->
  <div id="audit-timeline-view" class="panel" style="display:none;">
    <div class="panel-title">📅 Timeline View</div>
    <div id="audit-timeline-inner" style="position:relative;padding-left:28px;"></div>
  </div>`;

  await QSR._loadAudit(60);

  if (window.QSR_DB && window.QSR_SUPABASE_READY) {
    window._auditChannel = window.QSR_DB
      .channel('audit-realtime-elite')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'audit_log' }, (payload) => {
        QSR._prependAuditRow(payload.new);
        if (window._auditRows) window._auditRows.unshift(payload.new);
        QSR._updateAuditStats(window._auditRows || []);
      })
      .subscribe();
  }
};

QSR._toggleAuditView = function() {
  var table = document.getElementById('audit-table-view');
  var tl    = document.getElementById('audit-timeline-view');
  var btn   = document.getElementById('view-toggle-btn');
  if (tl.style.display === 'none') {
    table.style.display = 'none'; tl.style.display = 'block';
    btn.textContent = '⊞ Table View';
    QSR._renderTimeline(window._auditRows || []);
  } else {
    table.style.display = 'block'; tl.style.display = 'none';
    btn.textContent = '⋮ Timeline View';
  }
};

QSR._loadAudit = async function(limit) {
  var rows = [];
  if (window.QSR_DataLayer && window.QSR_SUPABASE_READY) {
    try {
      var { data } = await window.QSR_DB.from('audit_log')
        .select('*').order('created_at', { ascending:false }).limit(limit || 60);
      rows = data || [];
    } catch(e) {}
  }
  if (!rows.length && window.QSR?.recentScans) {
    rows = window.QSR.recentScans.map((s,i) => ({
      id:i, action:s.msg, target:'', ip_addr:'192.168.1.1',
      icon:s.icon||'LOG', created_at:new Date(Date.now()-i*600000).toISOString()
    }));
  }
  window._auditRows = rows;
  QSR._updateAuditStats(rows);
  QSR._renderAudit(rows);
};

QSR._updateAuditStats = function(rows) {
  var sev = QSR._sevMap();
  function set(id, v) { var el = document.getElementById(id); if(el) el.textContent = v; }
  set('as-total',    rows.length);
  set('as-critical', rows.filter(r => sev[r.action] === 'danger').length);
  set('as-scans',    rows.filter(r => (r.action||'').includes('SCAN')).length);
  set('as-reports',  rows.filter(r => (r.action||'').includes('REPORT')).length);
  set('as-logins',   rows.filter(r => (r.action||'').includes('LOGIN')).length);
};

QSR._sevMap = function() {
  return {
    'POLICY_VIOLATION':'danger','WEAK_KEY_DETECTED':'danger',
    'CERT_EXPIRY_ALERT':'warn','PQC_ASSESSMENT':'warn',
    'USER_LOGIN':'info','MFA_VERIFIED':'info',
    'SCAN_COMPLETED':'ok','CBOM_GENERATED':'ok',
    'REPORT_GENERATED':'ok','TLS_SCAN':'ok','SCAN_INITIATED':'info'
  };
};

QSR._renderAudit = function(rows) {
  var tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  var count = document.getElementById('audit-count');
  if (count) count.textContent = rows.length + ' events';
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No audit events found.</td></tr>';
    return;
  }
  var sevMap = QSR._sevMap();
  var sevMeta = {
    danger:{ color:'#e53e3e', bg:'rgba(229,62,62,0.1)', icon:'🔴', label:'CRITICAL' },
    warn:  { color:'#ed8936', bg:'rgba(237,137,54,0.1)', icon:'🟡', label:'WARNING'  },
    ok:    { color:'#48bb78', bg:'rgba(72,187,120,0.1)', icon:'🟢', label:'OK'       },
    info:  { color:'#4299e1', bg:'rgba(66,153,225,0.1)', icon:'🔵', label:'INFO'     }
  };
  tbody.innerHTML = rows.map(r => {
    var sev = sevMap[r.action] || 'info';
    var sm  = sevMeta[sev] || sevMeta.info;
    var dt  = r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '—';
    return `<tr style="border-left:3px solid ${sm.color};">
      <td style="padding:8px 4px;text-align:center;font-size:14px;">${sm.icon}</td>
      <td style="font-size:11px;white-space:nowrap;color:#888;">${dt}</td>
      <td><code style="font-size:11px;background:rgba(0,0,0,0.06);padding:2px 6px;border-radius:4px;">${r.action||'—'}</code></td>
      <td style="font-size:13px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.target||'—'}</td>
      <td><code style="font-size:11px;">${r.ip_addr||'—'}</code></td>
      <td><span class="badge" style="background:${sm.bg};color:${sm.color};border:1px solid ${sm.color};">${sm.label}</span></td>
    </tr>`;
  }).join('');
};

QSR._renderTimeline = function(rows) {
  var inner = document.getElementById('audit-timeline-inner');
  if (!inner) return;
  var sevMap = QSR._sevMap();
  var sevMeta = {
    danger:{ color:'#e53e3e', icon:'🔴' },
    warn:  { color:'#ed8936', icon:'🟡' },
    ok:    { color:'#48bb78', icon:'✅'  },
    info:  { color:'#4299e1', icon:'ℹ️'  }
  };
  inner.innerHTML = `<div style="position:absolute;left:10px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom, #8b1a2f, rgba(139,26,47,0.1));"></div>` +
    rows.slice(0,30).map(r => {
      var sev = sevMap[r.action] || 'info';
      var sm  = sevMeta[sev];
      var dt  = r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '—';
      return `<div class="tl-item" style="border-left-color:${sm.color}">
        <div class="tl-dot" style="background:${sm.color};"></div>
        <div class="tl-time">${dt}</div>
        <div class="tl-body">
          <div style="font-weight:700;font-size:13px;color:#1a1a2e;">${r.action||'Event'}</div>
          ${r.target ? `<div style="font-size:12px;color:#888;margin-top:2px;">${r.target}</div>` : ''}
        </div>
      </div>`;
    }).join('');
};

QSR._prependAuditRow = function(r) {
  var tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  var sevMap = QSR._sevMap();
  var sev    = sevMap[r.action] || 'info';
  var sevMeta = { danger:{color:'#e53e3e',bg:'rgba(229,62,62,0.1)',icon:'🔴',label:'CRITICAL'}, warn:{color:'#ed8936',bg:'rgba(237,137,54,0.1)',icon:'🟡',label:'WARNING'}, ok:{color:'#48bb78',bg:'rgba(72,187,120,0.1)',icon:'🟢',label:'OK'}, info:{color:'#4299e1',bg:'rgba(66,153,225,0.1)',icon:'🔵',label:'INFO'} };
  var sm = sevMeta[sev] || sevMeta.info;
  var dt = r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : 'Just now';
  var row = document.createElement('tr');
  row.className = 'alert-item-live';
  row.style.borderLeft = '3px solid ' + sm.color;
  row.innerHTML = `
    <td style="padding:8px 4px;text-align:center;">${sm.icon}</td>
    <td style="font-size:11px;white-space:nowrap;color:#888;">${dt}</td>
    <td><code style="font-size:11px;background:rgba(0,0,0,0.06);padding:2px 6px;border-radius:4px;">${r.action||'—'}</code></td>
    <td style="font-size:13px;">${r.target||'—'}</td>
    <td><code style="font-size:11px;">${r.ip_addr||'—'}</code></td>
    <td><span class="badge" style="background:${sm.bg};color:${sm.color};border:1px solid ${sm.color};">${sm.label}</span></td>`;
  tbody.insertBefore(row, tbody.firstChild);
};

QSR._filterAudit = function() {
  var search = (document.getElementById('audit-search')?.value || '').toLowerCase();
  var type   = document.getElementById('audit-type')?.value  || '';
  var sevF   = document.getElementById('audit-sev')?.value   || '';
  var sevMap = QSR._sevMap();
  var filtered = (window._auditRows || []).filter(r => {
    var ms = !search || (r.action||'').toLowerCase().includes(search) || (r.target||'').toLowerCase().includes(search);
    var mt = !type   || r.action === type;
    var mv = !sevF   || sevMap[r.action] === sevF;
    return ms && mt && mv;
  });
  QSR._renderAudit(filtered);
};

QSR.exportAuditCSV = function() {
  var rows = window._auditRows || [];
  var csv = [['Timestamp','Action','Target','IP Address','User'].join(','),
    ...rows.map(r => [r.created_at, r.action, r.target, r.ip_addr, r.user_id||'system'].map(v=>`"${v||''}"`).join(','))
  ].join('\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download = 'pnb-audit-log-'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
  if(window.showToast) showToast('Audit CSV exported!','success');
};
