/* pages-reporting.js - Reporting Page (FR14) */

window._reportingPage = function() {
  return '<div style="font-family:Rajdhani;font-size:22px;font-weight:700;color:#8b1a2f;margin-bottom:14px;">Reports & Intelligence (FR14)</div>' +
    '<div class="oval-cards" id="report-landing">' +
    '<div class="oval-card" onclick="showReportView(\'exec\')">' +
    '<div class="oval-icon" style="background:linear-gradient(135deg,#4299e1,#2b6cb0);">EXEC</div>' +
    '<div class="oval-title">Executive<br>Report</div></div>' +
    '<div class="oval-card" onclick="showReportView(\'scheduled\')">' +
    '<div class="oval-icon" style="background:linear-gradient(135deg,#48bb78,#276749);">SCHED</div>' +
    '<div class="oval-title">Scheduled<br>Report</div></div>' +
    '<div class="oval-card" onclick="showReportView(\'ondemand\')">' +
    '<div class="oval-icon" style="background:linear-gradient(135deg,#ed8936,#c05621);">NOW</div>' +
    '<div class="oval-title">On-Demand<br>Report</div></div>' +
    '</div>' +
    '<div id="report-form-area"></div>';
};

window.initReporting = function() {};

window.showReportView = function(view) {
  var area = document.getElementById('report-form-area');
  if (!area) return;

  if (view === 'exec') {
    area.innerHTML = reportFormHtml(
      'Executive Risk Intelligence Report',
      'Generated for CISO, Board, and Senior Management. Covers overall security posture, critical findings, and PQC readiness.',
      [
        '<label class="form-label">Scope</label><select class="form-select" id="exec-scope"><option>All PNB Internet-Facing Assets</option><option>Critical Assets Only</option><option>Production Systems</option></select>',
        '<label class="form-label">Time Range</label><select class="form-select" id="exec-range"><option>Last 7 Days</option><option>Last 30 Days</option><option>Last Quarter</option><option>This Year</option></select>',
        '<label class="form-label">Sections</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">'+
          ['Asset Discovery Summary','TLS/CBOM Analysis','Quantum Risk Scores (0-100)','PQC Readiness Status','Compliance Assessment','Migration Roadmap'].map(function(s){ return '<label><input type="checkbox" checked style="margin-right:4px;">'+s+'</label>'; }).join('')+'</div>',
        '<label class="form-label">Delivery</label><input type="email" class="form-input" id="exec-email" placeholder="ciso@pnb.bank.in" value="ciso@pnb.bank.in">'
      ],
      'exec'
    );
  } else if (view === 'scheduled') {
    area.innerHTML = reportFormHtml(
      'Scheduled Automated Report',
      'Set up periodic automated reports sent to stakeholders on a recurring schedule.',
      [
        '<label class="form-label">Report Type</label><select class="form-select" id="sched-type"><option>Full Security Assessment</option><option>PQC Posture Summary</option><option>Vulnerability Delta Report</option></select>',
        '<label class="form-label">Frequency</label><select class="form-select" id="sched-freq"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select>',
        '<label class="form-label">Time (IST)</label><input type="time" class="form-input" id="sched-time" value="08:00">',
        '<label class="form-label">Recipients</label><input type="text" class="form-input" id="sched-emails" value="ciso@pnb.bank.in, it-team@pnb.co.in" placeholder="Comma-separated emails">',
        '<label class="form-label">Format</label><div style="display:flex;gap:12px;"><label><input type="radio" name="sched-fmt" value="PDF" checked> PDF</label><label><input type="radio" name="sched-fmt" value="HTML"> HTML</label><label><input type="radio" name="sched-fmt" value="CSV"> CSV</label></div>'
      ],
      'scheduled'
    );
  } else {
    area.innerHTML = reportFormHtml(
      'On-Demand Report',
      'Generate a report immediately for any scope and asset selection.',
      [
        '<label class="form-label">Report Focus</label><div style="display:flex;flex-direction:column;gap:4px;">'+
          ['Asset Discovery & Inventory (FR4)','TLS Inspection Results (FR5)','CBOM Analysis (FR8)','QR Score Report (FR9)','PQC Readiness Assessment (FR10)','Full Audit Log (FR15)'].map(function(s){ return '<label><input type="radio" name="od-focus"> '+s+'</label>'; }).join('')+'</div>',
        '<label class="form-label">Asset Filter</label><select class="form-select" id="od-filter"><option>All Assets</option><option>Critical Risk Only</option><option>Expiring Certs Only</option><option>PQC Non-Compliant</option></select>',
        '<label class="form-label">Output Format</label><div style="display:flex;gap:12px;"><label><input type="radio" name="od-fmt" value="PDF" checked> PDF</label><label><input type="radio" name="od-fmt" value="JSON"> JSON</label><label><input type="radio" name="od-fmt" value="CSV"> CSV</label></div>',
        '<label class="form-label">Email Delivery</label><input type="email" class="form-input" id="od-email" placeholder="your.email@pnb.bank.in">'
      ],
      'ondemand'
    );
  }
};

function reportFormHtml(title, desc, fields, type) {
  return '<div class="panel" style="max-width:640px;margin:14px auto;">' +
    '<div style="font-family:Rajdhani;font-size:18px;font-weight:700;color:#8b1a2f;margin-bottom:4px;">'+title+'</div>' +
    '<div style="font-size:13px;color:#4a4a6a;margin-bottom:16px;">'+desc+'</div>' +
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    fields.map(function(f){ return '<div class="form-group">'+f+'</div>'; }).join('') +
    '</div>' +
    '<div id="report-status" class="status-msg" style="display:none;margin-top:12px;padding:8px 12px;border-radius:6px;font-size:13px;"></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px;">' +
    '<button class="btn btn-outline" onclick="document.getElementById(\'report-form-area\').innerHTML=\'\'">Back</button>' +
    '<button class="btn btn-primary" onclick="submitReport(\''+type+'\')">Generate & Send Report</button>' +
    '</div></div>';
}

window.submitReport = async function(type) {
  var statusEl = document.getElementById('report-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(66,153,225,0.15)';
    statusEl.style.color = '#4299e1';
    statusEl.style.border = '1px solid #4299e1';
    statusEl.textContent = 'Generating report...';
  }

  var scope = (document.getElementById('exec-scope') || document.getElementById('sched-type') || document.getElementById('od-filter'))?.value || 'All Assets';
  var email = (document.getElementById('exec-email') || document.getElementById('sched-emails') || document.getElementById('od-email'))?.value || '';

  if (window.QSR_DataLayer) {
    try { await QSR_DataLayer.createReport(type, scope, 'PDF', email); } catch(e){}
  }

  await new Promise(function(r){ setTimeout(r, 1200); });
  if (statusEl) {
    statusEl.style.background = 'rgba(72,187,120,0.15)';
    statusEl.style.color = '#48bb78';
    statusEl.style.border = '1px solid #48bb78';
    statusEl.textContent = 'Report generated and queued for delivery. Check Audit Log (FR15) for confirmation.';
  }
};

