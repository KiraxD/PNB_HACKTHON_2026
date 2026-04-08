/**
 * OWASP Security Scanner Integration
 * Integration example for pages-scanner.js
 * 
 * Shows how to integrate the unified security scanner with the existing UI
 */

// Store for scan results
let currentScanResults = null;
let scanInProgress = false;

// Initialize scanner on page load
export function initializeOwaspScanner() {
  const scanBtn = document.getElementById('scan-domain-btn');
  const hostInput = document.getElementById('host-input');

  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      const host = hostInput.value.trim();
      if (host) {
        performFullSecurityScan(host);
      }
    });
  }

  // Allow Enter key to start scan
  if (hostInput) {
    hostInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const host = hostInput.value.trim();
        if (host) performFullSecurityScan(host);
      }
    });
  }
}

/**
 * MAIN SCAN FUNCTION - Performs complete security assessment
 */
async function performFullSecurityScan(host) {
  if (scanInProgress) {
    showWarning('Scan already in progress...');
    return;
  }

  scanInProgress = true;
  const scanBtn = document.getElementById('scan-domain-btn');
  const originalText = scanBtn.textContent;
  scanBtn.textContent = '🔍 Scanning...';
  scanBtn.disabled = true;

  try {
    // Clear previous results
    clearResults();

    // Show loading indicators
    showLoadingState();

    // Perform scan
    const response = await fetch(
      `/api/unified-scanner?host=${encodeURIComponent(host)}&analysisType=full`,
      { timeout: 45000 }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Scan failed');
    }

    const data = await response.json();
    currentScanResults = data.results;

    // Update UI with results
    updateScanResults(data.results);

    // Mark scan as complete
    showToast('✅ Security scan completed successfully', 'success');

  } catch (error) {
    showError(`❌ Scan failed: ${error.message}`);
    console.error('Scan error:', error);
  } finally {
    scanInProgress = false;
    scanBtn.textContent = originalText;
    scanBtn.disabled = false;
  }
}

/**
 * UPDATE UI - Main results display
 */
function updateScanResults(results) {
  // 1. Risk Overview Card
  updateRiskOverviewCard(results.overallAssessment);

  // 2. Tabs for different analyses
  setupAnalysisTabs(results);

  // 3. OWASP Findings
  if (results.analyses.owasp) {
    updateOWASPTab(results.analyses.owasp);
  }

  // 4. Cryptography Analysis
  if (results.analyses.cryptography) {
    updateCryptoTab(results.analyses.cryptography);
  }

  // 5. Security Headers
  if (results.analyses.securityHeaders) {
    updateHeadersTab(results.analyses.securityHeaders);
  }

  // 6. Quantum Readiness
  if (results.analyses.quantumReadiness) {
    updateQuantumTab(results.analyses.quantumReadiness);
  }

  // 7. Threats
  if (results.analyses.threats) {
    updateThreatsTab(results.analyses.threats);
  }

  // 8. Remediation Plan
  updateRemediationTab(results.remediationPlan);

  // 9. Export options
  setupExportButtons(results);
}

/**
 * RISK OVERVIEW CARD
 */
function updateRiskOverviewCard(riskAssessment) {
  const container = document.getElementById('risk-overview');
  if (!container) return;

  const riskColor = {
    'LOW': '#28a745',
    'MEDIUM': '#ffc107',
    'HIGH': '#fd7e14',
    'CRITICAL': '#dc3545'
  }[riskAssessment.riskLevel] || '#6c757d';

  const riskIcon = {
    'LOW': '✓',
    'MEDIUM': '⚠',
    'HIGH': '⚠',
    'CRITICAL': '✕'
  }[riskAssessment.riskLevel];

  let html = `
    <div class="risk-overview-card" style="border-left: 4px solid ${riskColor}">
      <div class="risk-header">
        <span class="risk-icon" style="color: ${riskColor}; font-size: 32px">${riskIcon}</span>
        <div class="risk-text">
          <h2 style="color: ${riskColor}">${riskAssessment.riskLevel} RISK</h2>
          <p class="risk-score" style="font-size: 24px; color: ${riskColor}">
            <strong>${riskAssessment.overallRiskScore}</strong>/100
          </p>
        </div>
      </div>
      
      <div class="risk-details">
        <div class="detail-item">
          <span class="detail-label">Critical Issues:</span>
          <span class="detail-value" style="color: #dc3545; font-weight: bold">
            ${riskAssessment.criticalIssues}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">High Issues:</span>
          <span class="detail-value" style="color: #fd7e14; font-weight: bold">
            ${riskAssessment.highIssues}
          </span>
        </div>
      </div>

      <div class="risk-actions">
        <button class="btn btn-primary" onclick="downloadReport()">
          📥 Download Report
        </button>
        <button class="btn btn-secondary" onclick="shareResults()">
          🔗 Share Results
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * ANALYSIS TABS
 */
function setupAnalysisTabs(results) {
  const tabContainer = document.getElementById('analysis-tabs');
  if (!tabContainer) return;

  const tabs = [
    { id: 'owasp', name: 'OWASP Top 10', icon: '⚠️' },
    { id: 'crypto', name: 'Cryptography', icon: '🔐' },
    { id: 'headers', name: 'Headers', icon: '📋' },
    { id: 'quantum', name: 'Quantum Ready', icon: '⚛️' },
    { id: 'threats', name: 'Threats', icon: '🎯' },
    { id: 'remediation', name: 'Remediation', icon: '✓' }
  ];

  let tabsHtml = '<ul class="tabs-list">';
  tabs.forEach(tab => {
    tabsHtml += `
      <li class="tab-item">
        <button class="tab-btn" onclick="switchAnalysisTab('${tab.id}')">
          <span class="tab-icon">${tab.icon}</span>
          <span class="tab-name">${tab.name}</span>
        </button>
      </li>
    `;
  });
  tabsHtml += '</ul>';

  tabContainer.innerHTML = tabsHtml;

  // Create tab content containers
  const contentContainer = document.getElementById('analysis-content');
  if (contentContainer) {
    tabs.forEach(tab => {
      let content = document.getElementById(`tab-${tab.id}`);
      if (!content) {
        content = document.createElement('div');
        content.id = `tab-${tab.id}`;
        content.className = 'tab-content';
        contentContainer.appendChild(content);
      }
    });
  }

  // Show first tab by default
  switchAnalysisTab('owasp');
}

/**
 * OWASP TAB
 */
function updateOWASPTab(owaspAnalysis) {
  const container = document.getElementById('tab-owasp');
  if (!container) return;

  let html = `
    <div class="tab-section">
      <h3>OWASP Top 10 Findings</h3>
      <div class="analysis-summary">
        <div class="summary-item">
          <span class="summary-label">Total Findings:</span>
          <span class="summary-value">${owaspAnalysis.findingCount}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Compliance:</span>
          <span class="summary-status ${owaspAnalysis.complianceLevel.replace(/_/g, '-').toLowerCase()}">
            ${owaspAnalysis.complianceLevel.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div class="findings-list">
  `;

  owaspAnalysis.findings.forEach(finding => {
    const severityClass = `severity-${finding.severity.toLowerCase()}`;
    html += `
      <div class="finding-card ${severityClass}">
        <div class="finding-header">
          <span class="badge badge-${finding.severity.toLowerCase()}">
            ${finding.owaspId} - ${finding.severity}
          </span>
          <span class="cvss-score">CVSS ${finding.cvssScore}</span>
        </div>
        <h4>${finding.title}</h4>
        <p class="finding-description">${finding.description || ''}</p>
        ${finding.issues ? `
          <div class="finding-issues">
            <strong>Issues:</strong>
            <ul>
              ${finding.issues.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="finding-recommendation">
          <strong>Recommendation:</strong> ${finding.recommendation}
        </div>
        <div class="finding-actions">
          <button class="btn-small" onclick="copyToClipboard('${finding.recommendation}')">
            📋 Copy
          </button>
          <a href="https://owasp.org/Top10/" target="_blank" class="btn-small">
            📖 Learn More
          </a>
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  container.innerHTML = html;
}

/**
 * CRYPTOGRAPHY TAB
 */
function updateCryptoTab(cryptoAnalysis) {
  const container = document.getElementById('tab-crypto');
  if (!container) return;

  const scoreColor = cryptoAnalysis.cryptoScore >= 80 ? '#28a745' :
                     cryptoAnalysis.cryptoScore >= 60 ? '#ffc107' :
                     cryptoAnalysis.cryptoScore >= 40 ? '#fd7e14' : '#dc3545';

  let html = `
    <div class="tab-section">
      <h3>Cryptographic Analysis</h3>
      
      <div class="crypto-scorecard">
        <div class="score-display">
          <div class="score-circle" style="background-color: ${scoreColor}">
            <span class="score-number">${cryptoAnalysis.cryptoScore}</span>
            <span class="score-label">/100</span>
          </div>
          <div class="score-details">
            <p><strong>${cryptoAnalysis.keyAlgorithm}</strong> - ${cryptoAnalysis.keyBits} bits</p>
            <p>TLS: <strong>${cryptoAnalysis.tlsVersion}</strong></p>
            <p>Cipher: <strong>${cryptoAnalysis.cipherSuite}</strong></p>
          </div>
        </div>
      </div>
  `;

  // Display issues
  if (cryptoAnalysis.issues.length > 0) {
    html += '<div class="crypto-issues"><h4>Issues Found:</h4>';
    cryptoAnalysis.issues.forEach(issue => {
      html += `
        <div class="issue-item ${issue.severity.toLowerCase()}">
          <strong>${issue.type}</strong>
          <p>${issue.impact || issue.description}</p>
          ${issue.recommendation ? `
            <div class="issue-recommendation">
              <strong>→</strong> ${issue.recommendation}
            </div>
          ` : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  // Display strengths
  if (cryptoAnalysis.strengths.length > 0) {
    html += '<div class="crypto-strengths"><h4>✓ Strengths:</h4>';
    cryptoAnalysis.strengths.forEach(strength => {
      html += `
        <div class="strength-item">
          <span class="strength-type">${strength.type}</span>
          <span class="strength-rating">${strength.rating}</span>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

/**
 * SECURITY HEADERS TAB
 */
function updateHeadersTab(headersAnalysis) {
  const container = document.getElementById('tab-headers');
  if (!container) return;

  let html = `
    <div class="tab-section">
      <h3>Security Headers Validation</h3>
      <div class="headers-summary">
        <div class="summary-badge">
          <span class="badge-label">Present</span>
          <span class="badge-value success">${headersAnalysis.presentHeaders}</span>
        </div>
        <div class="summary-badge">
          <span class="badge-label">Missing</span>
          <span class="badge-value danger">${headersAnalysis.missingHeaders}</span>
        </div>
      </div>

      <table class="headers-detailed-table">
        <thead>
          <tr>
            <th>Header Name</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
  `;

  headersAnalysis.analysis.forEach(header => {
    const statusIcon = header.status === 'PRESENT' ? '✓' : '✕';
    const statusClass = header.status === 'PRESENT' ? 'present' : 'missing';

    html += `
      <tr class="header-row header-${statusClass}">
        <td class="header-name-col">
          <strong>${header.name}</strong>
          <span class="header-code">${header.header}</span>
        </td>
        <td class="header-status-col">
          <span class="status-badge ${statusClass}">${statusIcon} ${header.status}</span>
        </td>
        <td class="header-details-col">
          ${header.status === 'PRESENT' ? `
            <span class="header-value">${header.value.substring(0, 60)}${header.value.length > 60 ? '...' : ''}</span>
          ` : `
            <button class="btn-add-header" onclick="suggestHeader('${header.header}', '${header.recommendation || ''}')">
              Add Header →
            </button>
          `}
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * QUANTUM READINESS TAB
 */
function updateQuantumTab(quantumAnalysis) {
  const container = document.getElementById('tab-quantum');
  if (!container) return;

  const levelColor = {
    'READY': '#28a745',
    'DEVELOPING': '#ffc107',
    'NEEDS_WORK': '#dc3545'
  }[quantumAnalysis.level] || '#6c757d';

  let html = `
    <div class="tab-section">
      <h3>Post-Quantum Cryptography Readiness</h3>
      
      <div class="quantum-readiness-card">
        <div class="readiness-meter">
          <div class="meter-background">
            <div class="meter-fill" style="width: ${quantumAnalysis.readinessScore}%; background-color: ${levelColor}"></div>
          </div>
          <div class="meter-info">
            <span class="meter-score"><strong>${quantumAnalysis.readinessScore}%</strong></span>
            <span class="meter-level" style="color: ${levelColor}"><strong>${quantumAnalysis.level}</strong></span>
          </div>
        </div>

        ${quantumAnalysis.estimatedQuantumBreakDate ? `
          <div class="quantum-warning">
            <p><strong>⚠️ Estimated Quantum Break Date:</strong></p>
            <p style="font-size: 18px; color: #dc3545">
              ${new Date(quantumAnalysis.estimatedQuantumBreakDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        ` : ''}
      </div>

      <div class="quantum-recommendations">
        <h4>Recommendations for Quantum Readiness:</h4>
        <ul>
  `;

  quantumAnalysis.recommendations.forEach(rec => {
    html += `<li>${rec}</li>`;
  });

  html += `
        </ul>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * THREATS TAB
 */
function updateThreatsTab(threatAnalysis) {
  const container = document.getElementById('tab-threats');
  if (!container) return;

  const threatColor = {
    'CRITICAL': '#dc3545',
    'HIGH': '#fd7e14',
    'MEDIUM': '#ffc107',
    'LOW': '#28a745'
  }[threatAnalysis.threatLevel] || '#6c757d';

  let html = `
    <div class="tab-section">
      <h3>Threat Model Assessment</h3>
      
      <div class="threat-summary-card">
        <div class="threat-level" style="color: ${threatColor}">
          <span class="threat-icon" style="font-size: 32px;">🎯</span>
          <div class="threat-info">
            <span class="threat-level-text">${threatAnalysis.threatLevel}</span>
            <span class="threat-count">${threatAnalysis.threatCount} Threats</span>
          </div>
        </div>
      </div>

      <div class="threats-detailed-list">
  `;

  threatAnalysis.threats.forEach(threat => {
    html += `
      <div class="threat-item threat-${threat.severity.toLowerCase()}">
        <div class="threat-type"><strong>${threat.threatType}</strong></div>
        <div class="threat-impact">
          <strong>Impact:</strong> ${threat.impact}
        </div>
        ${threat.daysRemaining !== undefined ? `
          <div class="threat-timing">
            Days Remaining: <strong>${threat.daysRemaining}</strong>
          </div>
        ` : ''}
        ${threat.recommendation ? `
          <div class="threat-mitigation">
            <strong>Mitigation:</strong> ${threat.recommendation}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div></div>';
  container.innerHTML = html;
}

/**
 * REMEDIATION TAB
 */
function updateRemediationTab(remediationPlan) {
  const container = document.getElementById('tab-remediation');
  if (!container) return;

  let html = '<div class="tab-section"><h3>Remediation Plan</h3>';

  Object.entries(remediationPlan).forEach(([priority, section]) => {
    const priorityColors = {
      'immediate': '#dc3545',
      'urgent': '#fd7e14',
      'scheduled': '#ffc107'
    };

    html += `
      <div class="remediation-section" style="border-left: 4px solid ${priorityColors[priority] || '#6c757d'}">
        <h4 style="color: ${priorityColors[priority] || '#6c757d'}">${section.timeframe}</h4>
        <ul class="action-list">
    `;

    section.actions.forEach((action, index) => {
      html += `
        <li class="action-item">
          <span class="action-number">${index + 1}</span>
          <span class="action-text">${action}</span>
          <button class="btn-action" onclick="copyToClipboard('${action.replace(/'/g, "\\'")}')">
            📋
          </button>
        </li>
      `;
    });

    html += '</ul></div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * UTILITY FUNCTIONS
 */

function switchAnalysisTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  // Show selected tab
  const selectedTab = document.getElementById(`tab-${tabId}`);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }

  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.tab-btn')?.classList.add('active');
}

function clearResults() {
  const resultsContainer = document.getElementById('scan-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = '';
  }
}

function showLoadingState() {
  const resultsContainer = document.getElementById('scan-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Performing comprehensive security scan...</p>
        <div class="progress-indicators">
          <div class="progress-item">Analyzing OWASP Top 10...</div>
          <div class="progress-item">Checking cryptography...</div>
          <div class="progress-item">Validating headers...</div>
          <div class="progress-item">Assessing threats...</div>
        </div>
      </div>
    `;
  }
}

function downloadReport() {
  if (!currentScanResults) return;

  const report = JSON.stringify(currentScanResults, null, 2);
  const blob = new Blob([report], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `security-report-${new Date().getTime()}.json`;
  a.click();
}

function shareResults() {
  if (!currentScanResults) return;
  const json = JSON.stringify(currentScanResults);
  const encoded = btoa(json);
  const shareUrl = `${window.location.origin}?results=${encoded}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Security Scan Report',
      url: shareUrl
    });
  } else {
    copyToClipboard(shareUrl);
    showToast('Share link copied to clipboard', 'success');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard', 'success');
  });
}

function showToast(message, type = 'info') {
  // Integration with your existing toast system
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function showError(message) {
  showToast(message, 'error');
}

function showWarning(message) {
  showToast(message, 'warning');
}

// Export initialization function
export { initializeOwaspScanner, performFullSecurityScan };
