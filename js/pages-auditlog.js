/* ============================================================
   pages-auditlog.js — Audit Log Page (FR15)
   Real-time feed from Supabase audit_log table.
   ============================================================ */

window._auditLogPage = function() {
  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
    '<div>' +
    '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;">Security Audit Log (FR15)</div>' +
    '<div style="font-size:13px;color:#4a4a6a;">All critical events logged per NIST PQC & CERT-IN compliance</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;">' +
    '<button class="btn btn-outline" onclick="refreshAuditLog()">&#8635; Refresh</button>' +
    '<button class="btn btn-primary" onclick="exportAuditLog()">Export CSV</button>' +
    '</div>' +
    '</div>' +

    /* Filter bar */
    '<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">' +
    '<div class="search-wrap" style="flex:1;min-width:200px;margin:0;">' +
    '<span class="search-icon">&#128269;</span>' +
    '<input class="search-input" id="audit-search" placeholder="Search events, targets, users..." oninput="filterAuditLog()">' +
    '</div>' +
    '<select id="audit-type-filter" class="form-select" style="width:170px;" onchange="filterAuditLog()">' +
    '<option value="">All Event Types</option>' +
    '<option value="LOGIN">Authentication</option>' +
    '<option value="SCAN">Scan Events</option>' +
    '<option value="REPORT">Reports</option>' +
    '<option value="USER">User Management</option>' +
    '<option value="VULN">Vulnerabilities</option>' +
    '</select>' +
    '<input type="date" id="audit-date-filter" class="form-input" style="width:160px;" onchange="filterAuditLog()">' +
    '</div>' +

    /* Stats strip */
    '<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">' +
    ['Total Events','Login Events','Scan Events','Alerts'].map(function(label, i) {
      var ids = ['audit-total','audit-logins','audit-scans','audit-alerts'];
      var colors = ['#4299e1','#48bb78','#f5a623','#e53e3e'];
      return '<div style="flex:1;min-width:100px;background:rgba(255,255,255,0.88);border-left:4px solid ' + colors[i] + ';border-radius:8px;padding:10px 14px;">' +
        '<div style="font-size:11px;color:#4a4a6a;text-transform:uppercase;">' + label + '</div>' +
        '<div id="' + ids[i] + '" style="font-family:Rajdhani;font-size:28px;font-weight:700;color:' + colors[i] + ';">—</div>' +
        '</div>';
    }).join('') + '</div>' +

    /* Table */
    '<div class="panel">' +
    '<div class="table-wrap"><table class="data-table" id="audit-table">' +
    '<thead><tr><th>&#128197; Time</th><th>Event</th><th>Target / Detail</th><th>User</th><th>IP Address</th><th>Severity</th></tr></thead>' +
    '<tbody id="audit-tbody">' +
    '<tr><td colspan="6" style="text-align:center;padding:30px;color:#aaa;">Loading audit events...</td></tr>' +
    '</tbody></table></div></div>';
};

var _allAuditRows = [];

window.initAuditLog = async function() {
  await refreshAuditLog();

  /* Start realtime subscription if Supabase available */
  if (window.QSR_SUPABASE_READY && window.QSR_DB) {
    window.QSR_DB.channel('audit-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, function(payload) {
        _allAuditRows.unshift(mapAuditRow(payload.new));
        renderAuditTable(_allAuditRows);
        updateAuditStats(_allAuditRows);
      })
      .subscribe();
  }
};

window.refreshAuditLog = async function() {
  var tbody = document.getElementById('audit-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">&#8635; Fetching events...</td></tr>';

  if (window.QSR_SUPABASE_READY && window.QSR_DB) {
    try {
      var { data, error } = await window.QSR_DB.from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      _allAuditRows = (data || []).map(mapAuditRow);
    } catch(e) {
      console.warn('[AuditLog]', e.message);
      _allAuditRows = getDemoAuditRows();
    }
  } else {
    _allAuditRows = getDemoAuditRows();
  }

  renderAuditTable(_allAuditRows);
  updateAuditStats(_allAuditRows);
};

function mapAuditRow(r) {
  return {
    time:     r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '—',
    event:    r.action || '—',
    target:   r.target || '—',
    user:     r.user_id ? r.user_id.substring(0, 8) + '...' : 'system',
    ip:       r.ip_addr || '—',
    severity: getSeverity(r.action),
    raw:      r
  };
}

function getSeverity(action) {
  if (!action) return 'info';
  action = action.toUpperCase();
  if (action.includes('VULN') || action.includes('CRITICAL') || action.includes('REVOKE')) return 'critical';
  if (action.includes('FAIL') || action.includes('ALERT') || action.includes('EXPIR')) return 'high';
  if (action.includes('SCAN') || action.includes('REPORT') || action.includes('ROLE')) return 'medium';
  return 'info';
}

function getDemoAuditRows() {
  var now = new Date();
  function t(minAgo) { return new Date(now - minAgo * 60000).toLocaleString('en-IN'); }
  return [
    { time:t(1),   event:'LOGIN_MFA_SUCCESS',              target:'hackathon@pnb.bank.in',       user:'reshob..',  ip:'103.41.66.10', severity:'info'     },
    { time:t(3),   event:'SCAN_INITIATED',                 target:'netbanking.pnb.co.in',        user:'reshob..',  ip:'103.41.66.10', severity:'medium'   },
    { time:t(5),   event:'VULN_DETECTED: RSA-1024',        target:'api.pnb.co.in',               user:'system',   ip:'—',            severity:'critical' },
    { time:t(8),   event:'CERT_EXPIRY_WARNING',            target:'vpn.pnb.co.in (5 days)',      user:'system',   ip:'—',            severity:'high'     },
    { time:t(12),  event:'CBOM_GENERATED',                 target:'7 assets processed',          user:'reshob..',  ip:'103.41.66.10', severity:'medium'   },
    { time:t(18),  event:'REPORT_GENERATED:EXECUTIVE',     target:'Sent to CISO',                user:'reshob..',  ip:'103.41.66.10', severity:'info'     },
    { time:t(25),  event:'PQC_SCORE_COMPUTED',             target:'10 assets ranked (0-100)',    user:'system',   ip:'—',            severity:'info'     },
    { time:t(40),  event:'USER_INVITED',                   target:'soc.analyst@pnb.co.in',       user:'reshob..',  ip:'103.41.66.10', severity:'medium'   },
    { time:t(55),  event:'ROLE_CHANGED:COMPLIANCE',        target:'priya@kiit.ac.in',            user:'reshob..',  ip:'103.41.66.10', severity:'medium'   },
    { time:t(90),  event:'SCAN_COMPLETED',                 target:'pnb.co.in — 12 findings',     user:'system',   ip:'—',            severity:'info'     },
    { time:t(120), event:'ZERO_TRUST_VALIDATED',           target:'SOC scan request approved',   user:'system',   ip:'—',            severity:'info'     },
    { time:t(180), event:'LOGIN_FAILED',                   target:'unknown@external.com',        user:'unknown',  ip:'45.55.10.22',  severity:'high'     },
    { time:t(240), event:'SYSTEM_INIT',                    target:'QSecure Radar v1.0 started',  user:'system',   ip:'—',            severity:'info'     },
  ];
}

function renderAuditTable(rows) {
  var tbody = document.getElementById('audit-tbody');
  if (!tbody) return;

  var sevConfig = {
    critical: { cls:'badge-critical', icon:'&#128681;' },
    high:     { cls:'badge-high',     icon:'&#9888;'   },
    medium:   { cls:'badge-medium',   icon:'&#8505;'   },
    info:     { cls:'badge-low',      icon:'&#9989;'   }
  };

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">No events found.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function(r) {
    var sev = sevConfig[r.severity] || sevConfig.info;
    return '<tr>' +
      '<td style="font-size:11px;white-space:nowrap;color:#888;">' + r.time + '</td>' +
      '<td style="font-weight:600;font-size:12px;max-width:260px;white-space:normal;">' + r.event + '</td>' +
      '<td style="font-size:12px;color:#4a4a6a;max-width:200px;white-space:normal;">' + r.target + '</td>' +
      '<td style="font-size:11px;color:#888;">' + r.user + '</td>' +
      '<td style="font-size:11px;font-family:monospace;color:#4a4a6a;">' + r.ip + '</td>' +
      '<td><span class="badge ' + sev.cls + '">' + sev.icon + ' ' + r.severity + '</span></td>' +
      '</tr>';
  }).join('');
}

function updateAuditStats(rows) {
  var setEl = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('audit-total',  rows.length);
  setEl('audit-logins', rows.filter(function(r) { return r.event.includes('LOGIN'); }).length);
  setEl('audit-scans',  rows.filter(function(r) { return r.event.includes('SCAN'); }).length);
  setEl('audit-alerts', rows.filter(function(r) { return r.severity === 'critical' || r.severity === 'high'; }).length);
}

window.filterAuditLog = function() {
  var q    = (document.getElementById('audit-search')?.value || '').toLowerCase();
  var type = document.getElementById('audit-type-filter')?.value || '';
  var date = document.getElementById('audit-date-filter')?.value || '';

  var filtered = _allAuditRows.filter(function(r) {
    var text = (r.event + r.target + r.user).toLowerCase();
    var matchQ    = !q    || text.includes(q);
    var matchType = !type || r.event.includes(type);
    var matchDate = !date || r.time.startsWith(new Date(date).toLocaleDateString('en-IN'));
    return matchQ && matchType && matchDate;
  });

  renderAuditTable(filtered);
};

window.exportAuditLog = function() {
  var headers = ['Time','Event','Target','User','IP','Severity'];
  var rows = _allAuditRows.map(function(r) {
    return [r.time, r.event, r.target, r.user, r.ip, r.severity].map(function(v) {
      return '"' + (v||'').replace(/"/g,'""') + '"';
    }).join(',');
  });
  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv], { type:'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'QSecureRadar_AuditLog_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
};

