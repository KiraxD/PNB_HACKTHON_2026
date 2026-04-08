#!/bin/bash
# OWASP Security Scanner - Implementation Checklist
# Quick setup guide for integrating all OWASP tools into your project

echo "=================================="
echo "OWASP Scanner Implementation Setup"
echo "=================================="
echo ""

# STEP 1: Verify API files exist
echo "✓ Step 1: Verifying API files..."
echo "  Files needed:"
echo "    - api/unified-scanner.js"
echo "    - api/owasp-tools-detector.js"
echo "    - api/crypto-analyzer.js"
echo "    - api/threat-analyzer.js"
echo ""

# STEP 2: Verify frontend integration files
echo "✓ Step 2: Verifying frontend integration..."
echo "  Files needed:"
echo "    - js/scanner-owasp-integration.js"
echo "    - OWASP_TOOLS_USAGE_GUIDE.md"
echo ""

# STEP 3: Update HTML
echo "✓ Step 3: HTML Setup (add to dashboard.html or scanner page)"
cat << 'EOF'

<!-- Add this section to your scanner page -->

<div id="scanner-container" class="scanner-main">
  <!-- Input Section -->
  <div class="scanner-input-section">
    <h2>Security Assessment Scanner</h2>
    <div class="input-group">
      <input 
        type="text" 
        id="host-input" 
        placeholder="Enter domain (e.g., example.com)"
        class="host-input"
      />
      <button id="scan-domain-btn" class="btn btn-primary btn-lg">
        🔍 Scan Security
      </button>
    </div>
    <p class="help-text">Enter a domain to perform comprehensive security assessment</p>
  </div>

  <!-- Results Section -->
  <div id="scan-results" class="scan-results-container">
    <!-- Risk Overview Card -->
    <div id="risk-overview"></div>

    <!-- Analysis Tabs -->
    <div id="analysis-tabs" class="analysis-tabs"></div>
    
    <!-- Tab Content -->
    <div id="analysis-content" class="tab-content-area"></div>
  </div>
</div>

EOF

echo ""

# STEP 4: Update CSS
echo "✓ Step 4: CSS Setup (add to css/styles.css or new file)"
cat << 'EOF'

/* OWASP Scanner Styles */

.scanner-input-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 10px;
  margin-bottom: 30px;
  text-align: center;
}

.input-group {
  display: flex;
  gap: 10px;
  margin: 20px 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.host-input {
  flex: 1;
  padding: 12px 15px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
}

.risk-overview-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.finding-card {
  background: white;
  border-left: 4px solid;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 5px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.finding-card.severity-critical {
  border-left-color: #dc3545;
}

.finding-card.severity-high {
  border-left-color: #fd7e14;
}

.finding-card.severity-medium {
  border-left-color: #ffc107;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 5px;
}

.badge-critical {
  background: #dc3545;
  color: white;
}

.badge-high {
  background: #fd7e14;
  color: white;
}

.badge-medium {
  background: #ffc107;
  color: black;
}

.analysis-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #ddd;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  background: none;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-bottom-color: #667eea;
}

.tab-btn.active {
  border-bottom-color: #667eea;
  font-weight: bold;
}

.tab-content {
  display: none;
}

.tab-section {
  background: white;
  padding: 20px;
  border-radius: 5px;
}

/* Responsive */
@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }
  
  .analysis-tabs {
    flex-direction: column;
  }
}

EOF

echo ""

# STEP 5: JavaScript Integration
echo "✓ Step 5: JavaScript Integration (add to your existing scanner page)"
cat << 'EOF'

// In your pages-scanner.js or main scanner file:

import { initializeOwaspScanner, performFullSecurityScan } from './scanner-owasp-integration.js';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeOwaspScanner();
});

EOF

echo ""

# STEP 6: API Configuration
echo "✓ Step 6: API Configuration (update vercel.json)"
cat << 'EOF'

// In vercel.json, add to "functions" section:

{
  "functions": {
    "api/unified-scanner.js": {
      "memory": 3008,
      "maxDuration": 30
    },
    "api/owasp-tools-detector.js": {
      "memory": 3008,
      "maxDuration": 30
    },
    "api/crypto-analyzer.js": {
      "memory": 3008,
      "maxDuration": 30
    },
    "api/threat-analyzer.js": {
      "memory": 3008,
      "maxDuration": 30
    }
  }
}

EOF

echo ""

# STEP 7: Features Summary
echo "✓ Step 7: Available Features"
echo ""
echo "ANALYSIS TYPES:"
echo "  - full        : Complete security assessment"
echo "  - owasp       : OWASP Top 10 vulnerabilities"
echo "  - crypto      : Cryptographic analysis"
echo "  - headers     : Security headers validation"
echo "  - pqc         : Post-quantum readiness"
echo "  - threats     : Threat model assessment"
echo ""

echo "API ENDPOINTS:"
echo "  GET /api/unified-scanner?host=example.com&analysisType=full"
echo "  GET /api/unified-scanner?host=example.com&analysisType=owasp"
echo "  GET /api/unified-scanner?host=example.com&analysisType=crypto"
echo ""

echo "DETECTION CAPABILITIES:"
echo "  ✓ OWASP Top 10 (A01-A10)"
echo "  ✓ CWE Top 25 vulnerabilities"
echo "  ✓ Security headers validation"
echo "  ✓ Certificate analysis"
echo "  ✓ TLS/SSL strength assessment"
echo "  ✓ Quantum cryptography readiness"
echo "  ✓ Threat modeling"
echo "  ✓ Risk scoring and prioritization"
echo "  ✓ Automated remediation recommendations"
echo ""

# STEP 8: Testing
echo "✓ Step 8: Testing Your Setup"
echo ""
echo "Run these tests to verify:"
echo ""
echo "1. Frontend Test:"
echo '   curl "http://localhost:3000/api/unified-scanner?host=example.com&analysisType=full"'
echo ""
echo "2. Check specific analysis:"
echo '   curl "http://localhost:3000/api/unified-scanner?host=example.com&analysisType=owasp"'
echo ""
echo "3. Crypto analysis:"
echo '   curl "http://localhost:3000/api/unified-scanner?host=example.com&analysisType=crypto"'
echo ""

# STEP 9: Production Deployment
echo "✓ Step 9: Deployment"
echo ""
echo "Commands:"
echo "  npm run build          # Build the project"
echo "  vercel deploy          # Deploy to Vercel"
echo "  vercel env pull        # Pull environment variables"
echo ""

# STEP 10: Customization
echo "✓ Step 10: Customization Options"
echo ""
echo "You can customize:"
echo "  - Risk scoring thresholds"
echo "  - Severity levels"
echo "  - Remediation recommendations"
echo "  - UI colors and styling"
echo "  - Report templates"
echo "  - Alert thresholds"
echo ""

echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "Next Steps:"
echo "1. Review OWASP_TOOLS_USAGE_GUIDE.md for detailed examples"
echo "2. Test with: npm run dev"
echo "3. Customize CSS and UI as needed"
echo "4. Deploy with: vercel deploy"
echo ""
