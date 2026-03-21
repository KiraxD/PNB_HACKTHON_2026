/* pages-auditlog.js — Real-Time Audit Log (FR15)
   Live Supabase data + Realtime subscription + CSV export */

window.QSR = window.QSR || {};
window.QSR.pages = window.QSR.pages || {};

QSR.pages.auditlog = async function(container) {
  /* Cancel any existing realtime subscription */
  if (window._auditChannel) {
    try { window._auditChannel.unsubscribe(); } catch(e) {}
    window._auditChannel = null;
  }

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Security Audit Log</h1>
        <p class="page-subtitle">Real-time event stream powered by Supabase • FR15</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span id="realtime-dot" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#48bb78;">
          <span style="width:8px;height:8px;border-radius:50%;background:#48bb78;animation:pulse 2s infinite;"></span>
          Live
        </span>
        <button class="btn-export" onclick="QSR.exportAuditCSV()">&#8659; Export CSV</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="panel" style="padding:14px 18px;margin-bottom:14px;">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <input id="audit-search" class="form-input" style="width:220px;" placeholder="Search events..." oninput="QSR._filterAudit()">
        <select id="audit-type" class="form-input" style="width:160px;" onchange="QSR._filterAudit()">
          <option value="">All Actions</option>
          <option>SCAN_COMPLETED</option><option>CERT_EXPIRY_ALERT</option>
          <option>USER_LOGIN</option><option>CBOM_GENERATED</option>
          <option>PQC_ASSESSMENT</option><option>WEAK_KEY_DETECTED</option>
          <option>REPORT_GENERATED</option><option>POLICY_VIOLATION</option>
        </select>
        <button class="btn-secondary" onclick="QSR.pages.auditlog(document.getElementById('main-content'))">Refresh</button>
        <span id="audit-count" style="font-size:12px;color:#888;margin-left:auto;"></span>
      </div>
    </div>

    <!-- Live event feed -->
    <div class="panel">
      <div class="panel-title">Event Stream</div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr>
            <th>Time</th><th>Action</th><th>Target</th>
            <th>IP Address</th><th>Severity</th>
          </tr></thead>
          <tbody id="audit-tbody">
            <tr><td colspan="5" class="loading-cell">Loading audit log...</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  /* Load initial data */
  await QSR._loadAudit(50);

  /* Subscribe to Realtime if Supabase is ready */
  if (window.QSR_DB && window.QSR_SUPABASE_READY) {
    window._auditChannel = window.QSR_DB
      .channel('audit-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
        QSR._prependAuditRow(payload.new);
      })
      .subscribe();
  }
};

QSR._loadAudit = async function(limit) {
  const dl = window.QSR_DataLayer;
  let rows = [];

  if (dl && window.QSR_SUPABASE_READY) {
    try {
      const { data } = await window.QSR_DB.from('audit_log')
        .select('*').order('created_at', { ascending: false }).limit(limit || 50);
      rows = data || [];
    } catch(e) { rows = []; }
  }

  /* Fallback to mock */
  if (!rows.length && window.QSR && window.QSR.recentScans) {
    rows = window.QSR.recentScans.map((s,i) => ({
      id: i, action: s.msg, target: '', ip_addr: '192.168.1.1',
      icon: s.icon || 'LOG', created_at: new Date(Date.now() - i*600000).toISOString()
    }));
  }

  window._auditRows = rows;
  QSR._renderAudit(rows);
};

QSR._renderAudit = function(rows) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  const count = document.getElementById('audit-count');
  if (count) count.textContent = rows.length + ' events';

  const severityMap = {
    'POLICY_VIOLATION': 'danger', 'WEAK_KEY_DETECTED': 'danger',
    'CERT_EXPIRY_ALERT': 'warn',  'PQC_ASSESSMENT': 'warn',
    'USER_LOGIN': 'info',         'MFA_VERIFIED': 'info',
    'SCAN_COMPLETED': 'ok',       'CBOM_GENERATED': 'ok',
    'REPORT_GENERATED': 'ok',     'TLS_SCAN': 'ok'
  };

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">No audit events found.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const sev = severityMap[r.action] || 'info';
    const dt = r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '—';
    return `<tr>
      <td style="font-size:12px;white-space:nowrap;">${dt}</td>
      <td><code style="font-size:12px;">${r.action||'—'}</code></td>
      <td style="font-size:13px;">${r.target||'—'}</td>
      <td><code style="font-size:12px;">${r.ip_addr||'—'}</code></td>
      <td><span class="badge badge-${sev}">${sev.toUpperCase()}</span></td>
    </tr>`;
  }).join('');
};

QSR._prependAuditRow = function(r) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  const sev = 'info';
  const dt = r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : 'Just now';
  const row = document.createElement('tr');
  row.style.animation = 'fadeIn 0.4s ease';
  row.innerHTML = `
    <td style="font-size:12px;white-space:nowrap;">${dt}</td>
    <td><code style="font-size:12px;">${r.action||'—'}</code></td>
    <td>${r.target||'—'}</td>
    <td><code style="font-size:12px;">${r.ip_addr||'—'}</code></td>
    <td><span class="badge badge-info">NEW</span></td>`;
  tbody.insertBefore(row, tbody.firstChild);
  if (window._auditRows) window._auditRows.unshift(r);
};

QSR._filterAudit = function() {
  const search = (document.getElementById('audit-search')?.value || '').toLowerCase();
  const type   = document.getElementById('audit-type')?.value || '';
  const rows   = (window._auditRows || []).filter(r => {
    const matchSearch = !search || (r.action||'').toLowerCase().includes(search) || (r.target||'').toLowerCase().includes(search);
    const matchType   = !type   || r.action === type;
    return matchSearch && matchType;
  });
  QSR._renderAudit(rows);
};

QSR.exportAuditCSV = function() {
  const rows = window._auditRows || [];
  const headers = ['Timestamp','Action','Target','IP Address','User'];
  const csv = [headers.join(','),
    ...rows.map(r => [
      '"' + (r.created_at||'') + '"',
      '"' + (r.action||'') + '"',
      '"' + (r.target||'') + '"',
      '"' + (r.ip_addr||'') + '"',
      '"' + (r.user_id||'system') + '"'
    ].join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pnb-audit-log-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
};
