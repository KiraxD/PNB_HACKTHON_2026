/* ============================================================
   pages-users.js — User Management Page (FR2 — RBAC)
   Admin-only. Shows all registered users + role assignment.
   ============================================================ */

window._usersPage = function() {
  return '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;margin-bottom:14px;">User Management (FR2 — RBAC)</div>' +
    '<div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">' +
    '<button class="btn btn-primary" onclick="openInviteModal()">+ Invite User</button>' +
    '<div class="search-wrap" style="flex:1;min-width:200px;margin:0;">' +
    '<span class="search-icon">&#128269;</span>' +
    '<input class="search-input" id="user-search" placeholder="Search by name or email..." oninput="filterUsers()">' +
    '</div>' +
    '<select id="role-filter" class="form-select" style="width:180px;" onchange="filterUsers()">' +
    '<option value="">All Roles</option>' +
    '<option value="soc">SOC Analyst</option>' +
    '<option value="admin">Admin</option>' +
    '<option value="compliance">Compliance</option>' +
    '</select></div>' +
    '<div class="panel">' +
    '<div class="table-wrap"><table class="data-table" id="users-table">' +
    '<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>' +
    '<tbody id="users-tbody"><tr><td colspan="7" style="text-align:center;padding:20px;color:#aaa;">Loading users...</td></tr></tbody>' +
    '</table></div></div>' +

    /* Invite Modal */
    '<div id="invite-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:none;align-items:center;justify-content:center;">' +
    '<div style="background:#fff;border-radius:12px;padding:28px;width:420px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
    '<div style="font-family:Rajdhani;font-size:20px;font-weight:700;color:#8b1a2f;margin-bottom:16px;">Invite New User</div>' +
    '<div class="form-group"><label class="form-label" style="color:#333;">Full Name</label>' +
    '<input id="inv-name" class="form-input" placeholder="e.g. Reshob Roychoudhury"></div>' +
    '<div class="form-group"><label class="form-label" style="color:#333;">Email Address</label>' +
    '<input id="inv-email" class="form-input" type="email" placeholder="user@pnb.bank.in"></div>' +
    '<div class="form-group"><label class="form-label" style="color:#333;">Role (FR2)</label>' +
    '<select id="inv-role" class="form-select" style="color:#333;">' +
    '<option value="soc">SOC Analyst</option>' +
    '<option value="compliance">Compliance Officer</option>' +
    '<option value="admin">Infrastructure Admin</option>' +
    '</select></div>' +
    '<div id="invite-status" class="status-msg" style="display:none;padding:8px 12px;border-radius:6px;font-size:13px;margin-bottom:12px;"></div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
    '<button class="btn btn-outline" onclick="closeInviteModal()">Cancel</button>' +
    '<button class="btn btn-primary" id="inv-submit" onclick="submitInvite()">Send Invite</button>' +
    '</div></div></div>';
};

window.initUserManagement = async function() {
  await loadUsers();
};

var _allUsers = [];

async function loadUsers() {
  var tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  var roleColors = { soc:'#4299e1', admin:'#e53e3e', compliance:'#48bb78' };
  var roleLabels = { soc:'SOC Analyst', admin:'Admin', compliance:'Compliance' };

  if (window.QSR_SUPABASE_READY && window.QSR_DB) {
    try {
      /* Supabase: fetch profiles table */
      var { data, error } = await window.QSR_DB.from('profiles')
        .select('id,email,full_name,role,created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      _allUsers = data || [];
    } catch(e) {
      console.warn('[UserManagement]', e.message);
      _allUsers = getDemoUsers();
    }
  } else {
    _allUsers = getDemoUsers();
  }

  renderUsersTable(_allUsers, roleColors, roleLabels);
}

function getDemoUsers() {
  return [
    { id:'u1', email:'reshob@kiit.ac.in',    full_name:'Reshob Roychoudhury', role:'admin',      created_at: new Date().toISOString(), status:'active' },
    { id:'u2', email:'shubham@kiit.ac.in',   full_name:'Shubham',              role:'soc',        created_at: new Date().toISOString(), status:'active' },
    { id:'u3', email:'payal@kiit.ac.in',     full_name:'Payal Majumdar',       role:'compliance', created_at: new Date().toISOString(), status:'active' },
    { id:'u4', email:'priya@kiit.ac.in',     full_name:'Priyadarshini Gupta',  role:'compliance', created_at: new Date().toISOString(), status:'active' },
    { id:'u5', email:'soc.analyst@pnb.co.in',full_name:'PNB SOC Analyst',      role:'soc',        created_at: new Date().toISOString(), status:'active' },
  ];
}

function renderUsersTable(users, roleColors, roleLabels) {
  var tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  roleColors = roleColors || { soc:'#4299e1', admin:'#e53e3e', compliance:'#48bb78' };
  roleLabels = roleLabels || { soc:'SOC Analyst', admin:'Admin', compliance:'Compliance' };

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#aaa;">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(function(u, i) {
    var date = u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—';
    var color = roleColors[u.role] || '#888';
    var label = roleLabels[u.role] || u.role;
    var status = u.status || 'active';
    return '<tr>' +
      '<td style="color:#aaa;">' + (i+1) + '</td>' +
      '<td style="font-weight:600;">' + (u.full_name || '—') + '</td>' +
      '<td style="font-size:12px;">' + u.email + '</td>' +
      '<td><span style="background:' + color + '22;color:' + color + ';padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;">' + label + '</span></td>' +
      '<td><span class="badge ' + (status === 'active' ? 'badge-valid' : 'badge-expired') + '">' + status + '</span></td>' +
      '<td style="font-size:12px;color:#888;">' + date + '</td>' +
      '<td>' +
        '<button class="btn btn-outline" style="padding:4px 10px;font-size:12px;" onclick="changeRole(\'' + u.id + '\',\'' + (u.role) + '\')">Change Role</button>' +
        '&nbsp;<button class="btn" style="padding:4px 10px;font-size:12px;background:#fed7d7;color:#c53030;border:none;" onclick="deactivateUser(\'' + u.id + '\')">Revoke</button>' +
      '</td></tr>';
  }).join('');
}

window.filterUsers = function() {
  var q = (document.getElementById('user-search')?.value || '').toLowerCase();
  var roleF = document.getElementById('role-filter')?.value || '';
  var filtered = _allUsers.filter(function(u) {
    var match = !q || (u.full_name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
    var roleMatch = !roleF || u.role === roleF;
    return match && roleMatch;
  });
  renderUsersTable(filtered);
};

window.openInviteModal = function() {
  var m = document.getElementById('invite-modal');
  if (m) { m.style.display = 'flex'; }
};
window.closeInviteModal = function() {
  var m = document.getElementById('invite-modal');
  if (m) { m.style.display = 'none'; }
};

window.submitInvite = async function() {
  var name  = document.getElementById('inv-name')?.value.trim();
  var email = document.getElementById('inv-email')?.value.trim();
  var role  = document.getElementById('inv-role')?.value;
  var statusEl = document.getElementById('invite-status');
  var btn = document.getElementById('inv-submit');

  if (!email) { showInvStatus('Email is required.', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Sending...';

  try {
    if (window.QSR_SUPABASE_READY && window.QSR_DB) {
      /* Supabase: invite user via admin API — FR2 */
      var { data, error } = await window.QSR_DB.auth.signUp({
        email,
        password: 'ChangeMe@' + Math.random().toString(36).slice(2,8),
        options: { data: { full_name: name, role } }
      });
      if (error) throw error;
      showInvStatus('Invite sent to ' + email + '!', 'success');
    } else {
      await new Promise(r => setTimeout(r, 800));
      showInvStatus('Demo mode: invite sent to ' + email, 'success');
    }
    /* Log to audit (FR15) */
    var user = JSON.parse(sessionStorage.getItem('qsr_user') || '{}');
    if (window.QSR_Auth) window.QSR_Auth.logAction('USER_INVITED', user.id, email, '&#128101;');
    setTimeout(function() { closeInviteModal(); loadUsers(); }, 1200);
  } catch(e) {
    showInvStatus(e.message, 'error');
  }
  btn.disabled = false; btn.textContent = 'Send Invite';
};

function showInvStatus(msg, type) {
  var el = document.getElementById('invite-status');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = type === 'success' ? 'rgba(72,187,120,0.15)' : 'rgba(229,62,62,0.15)';
  el.style.color      = type === 'success' ? '#48bb78' : '#e53e3e';
  el.style.border     = '1px solid ' + (type === 'success' ? '#48bb78' : '#e53e3e');
}

window.changeRole = async function(userId, currentRole) {
  var roles = ['soc', 'admin', 'compliance'];
  var labels = { soc:'SOC Analyst', admin:'Admin', compliance:'Compliance' };
  var next = roles[(roles.indexOf(currentRole) + 1) % roles.length];
  if (!confirm('Change role to ' + labels[next] + '?')) return;

  if (window.QSR_SUPABASE_READY && window.QSR_DB) {
    await window.QSR_DB.from('profiles').update({ role: next }).eq('id', userId);
  }
  var user = JSON.parse(sessionStorage.getItem('qsr_user') || '{}');
  if (window.QSR_Auth) window.QSR_Auth.logAction('ROLE_CHANGED:' + next.toUpperCase(), user.id, userId, '&#128101;');
  await loadUsers();
};

window.deactivateUser = async function(userId) {
  if (!confirm('Revoke access for this user? This cannot be undone.')) return;
  if (window.QSR_SUPABASE_READY && window.QSR_DB) {
    /* Mark profile as inactive */
    await window.QSR_DB.from('profiles').update({ role: 'revoked' }).eq('id', userId);
  }
  var user = JSON.parse(sessionStorage.getItem('qsr_user') || '{}');
  if (window.QSR_Auth) window.QSR_Auth.logAction('USER_REVOKED', user.id, userId, '&#128683;');
  await loadUsers();
};
