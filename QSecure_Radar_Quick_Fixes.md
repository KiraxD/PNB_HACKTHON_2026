# QSecure Radar — Quick-Fix Implementation Guide

**Document Purpose:** Code examples and ready-to-implement fixes for all identified issues.

---

## FIX #1: Restore Session Validation (CRITICAL)

### File: `dashboard.html` - Replace auth guard

**Current (Broken):**

```html
<script>
  (function () {
    var u = sessionStorage.getItem("qsr_user");
    if (!u) {
      window.location.href = "index.html";
      return;
    }
    try {
      var user = JSON.parse(u);
      window._QSR_USER = user;
    } catch (e) {
      window.location.href = "index.html";
    }
  })();
</script>
```

**Fixed:**

```html
<script>
  (async function () {
    // Try to get the actual JWT from Supabase
    if (!window.QSR_DB || !window.QSR_SUPABASE_READY) {
      // Wait for Supabase to initialize
      await new Promise((r) => setTimeout(r, 1000));
    }

    try {
      const {
        data: { session },
        error,
      } = await window.QSR_DB.auth.getSession();

      if (error || !session?.user) {
        console.warn("[Auth] No valid session found");
        window.location.href = "index.html";
        return;
      }

      // Validate user profile in database
      const profile = await (async () => {
        try {
          const { data, error } = await window.QSR_DB.from("profiles")
            .select("id, email, full_name, role, status")
            .eq("id", session.user.id)
            .maybeSingle();

          if (error) throw error;
          return data;
        } catch (e) {
          console.error("[Auth] Profile fetch failed:", e);
          return null;
        }
      })();

      // Check profile status
      if (!profile || profile.status !== "active") {
        console.warn("[Auth] User inactive or not found");
        await window.QSR_DB.auth.signOut();
        window.location.href = "index.html?reason=account_inactive";
        return;
      }

      // Build final user object
      window._QSR_USER = {
        id: session.user.id,
        email: profile.email || session.user.email,
        name: profile.full_name || session.user.email?.split("@")[0],
        role: profile.role || "soc",
        status: profile.status,
        mfa_verified: !!session.user?.factors?.some(
          (f) => f.status === "verified",
        ),
      };

      sessionStorage.setItem("qsr_user", JSON.stringify(window._QSR_USER));

      // Set session timeout (30 minutes)
      window._SESSION_TIMEOUT = 30 * 60 * 1000;
      window._SESSION_START = Date.now();

      // Check periodically
      setInterval(() => {
        const elapsed = Date.now() - window._SESSION_START;
        if (elapsed > window._SESSION_TIMEOUT) {
          alert("Your session has expired. Please sign in again.");
          window.location.href = "index.html";
        }
      }, 60000); // Check every minute
    } catch (error) {
      console.error("[Auth] Validation failed:", error.message);
      window.location.href = "index.html?reason=auth_error";
    }
  })();
</script>
```

---

## FIX #2: Move API Keys to Environment Variables

### File: `js/supabase-client.js`

**Current (Exposed):**

```javascript
const SUPABASE_URL = "https://shinmrlkbaggbwpzhlcl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**Fixed:**

```javascript
// Load from environment (set via Vercel environment variables)
const SUPABASE_URL =
  window.__ENV?.SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.REACT_APP_SUPABASE_URL : "");
const SUPABASE_ANON_KEY =
  window.__ENV?.SUPABASE_ANON_KEY ||
  (typeof process !== "undefined"
    ? process.env.REACT_APP_SUPABASE_ANON_KEY
    : "");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[QSR] Supabase credentials not configured");
  document.body.innerHTML =
    '<div style="padding:20px;color:red;">Configuration Error: Supabase not initialized</div>';
}
```

### File: `.env.local` (Create)

```
REACT_APP_SUPABASE_URL=https://shinmrlkbaggbwpzhlcl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-key-here
```

### File: `vercel.json` - Update build settings

```json
{
  "buildCommand": "echo 'Using environment variables'",
  "env": {
    "REACT_APP_SUPABASE_URL": "@supabase_url",
    "REACT_APP_SUPABASE_ANON_KEY": "@supabase_key"
  }
}
```

---

## FIX #3: SSRF Protection in TLS Scanner

### File: `supabase/functions/tls-scanner/index.ts`

**Add this validation function at the top:**

```typescript
// Blocklist for internal/private addresses
const INTERNAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254", // AWS metadata
  "169.254.169.123", // GCP metadata
  "metadata.google.internal",
  "::ffff:127.0.0.1", // IPv4-mapped IPv6
]);

// Patterns for private IP ranges
const PRIVATE_IP_PATTERNS = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^127\./, // 127.0.0.0/8
  /^fc[0-9a-f][0-9a-f]/i, // IPv6 fc00::/7
  /^fe80:/i, // IPv6 link-local
  /^ff[0-9a-f][0-9a-f]:/i, // IPv6 multicast
];

function validateHostname(host: string): { valid: boolean; error?: string } {
  // Check blocklist
  if (INTERNAL_HOSTS.has(host.toLowerCase())) {
    return { valid: false, error: "Internal hostname blocked" };
  }

  // Check private IP patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(host)) {
      return { valid: false, error: "Private IP range blocked" };
    }
  }

  // Check for localhost variations
  if (/^localnet|^intranet|^lan|^internal/.test(host)) {
    return { valid: false, error: "Reserved hostname pattern" };
  }

  // Valid
  return { valid: true };
}

// Add rate limiting
const RATE_LIMITS = new Map<string, number[]>(); // user_id -> timestamps

function checkRateLimit(userId: string): boolean {
  const LIMIT = 10; // scans per minute
  const WINDOW = 60000; // 1 minute

  const now = Date.now();
  const timestamps = RATE_LIMITS.get(userId) || [];

  // Remove old entries
  const filtered = timestamps.filter((t) => now - t < WINDOW);

  if (filtered.length >= LIMIT) {
    return false;
  }

  filtered.push(now);
  RATE_LIMITS.set(userId, filtered);

  return true;
}
```

**Update the main handler:**

```typescript
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: CORS_HEADERS });

  try {
    // Get user ID from auth header for rate limiting
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // For now, use token as rate limit key (in production, decode JWT)
    if (!checkRateLimit(token.substring(0, 20))) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { host, port } = await req.json();

    if (!host || typeof host !== "string") {
      return new Response(JSON.stringify({ error: "Missing host" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Sanitize hostname
    const cleanHost = host
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/[^a-zA-Z0-9.-]/g, "")
      .toLowerCase();

    if (!cleanHost || cleanHost.length > 253) {
      return new Response(JSON.stringify({ error: "Invalid hostname" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // NEW: Validate against SSRF
    const validation = validateHostname(cleanHost);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const result = await scanTLS(cleanHost, port || 443);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
```

---

## FIX #4: Add Missing RLS Policies

### File: `supabase/schema.sql`

**Add these policies at the end:**

```sql
-- ── Missing DELETE policies ───────────────────────────────────
CREATE POLICY "crypto_delete_auth" ON public.crypto_overview
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "cbom_delete_auth" ON public.cbom
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "pqc_delete_auth" ON public.pqc_scores
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "cyberrating_delete_auth" ON public.cyber_rating
  FOR DELETE USING (auth.role() = 'authenticated');

-- ── READ-ONLY for compliance role ──────────────────────────────
-- Compliance users can read only compliance/audit data
CREATE POLICY "audit_select_compliance" ON public.audit_log
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'compliance'
    )
  );

-- ── Audit log: compliance role cannot write ─────────────────────
CREATE POLICY "audit_insert_soc_only" ON public.audit_log
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('soc', 'admin')
    )
  );
```

---

## FIX #5: Auto-Save Scanner Results

### File: `js/pages-scanner.js`

**Update the results display function:**

```javascript
async function displayScanResults(result) {
  // Display in UI
  QSR._renderScanResults(result);

  // NEW: Auto-save to database
  await saveScanResultsToDatabase(result);
}

async function saveScanResultsToDatabase(result) {
  if (!window.QSR_DB || !window._QSR_USER) {
    console.warn("[Scanner] Cannot save: DB or user not ready");
    return;
  }

  try {
    const scanEntry = {
      user_id: window._QSR_USER.id,
      host: result.host,
      grade: result.grade || determineGrade(result.risk_score),
      tls_version: result.tls_version,
      key_alg: result.key_algorithm,
      key_size: result.key_size,
      q_score: Math.round(result.risk_score), // QR score
      q_vulnerable: result.vulnerabilities.length > 0,
      issuer: result.issuer,
      not_after: result.not_after,
      days_left: result.days_left,
      cert_count: (result.san || []).length,
      sources: JSON.stringify({
        tls: result.tls_version_secure,
        cert: result.cert_chain_valid,
        headers: result.headers_verified,
        waf: result.waf_detection.detected,
        cdn: result.cdn_detected,
      }),
      raw_result: JSON.stringify(result),
      scanned_at: new Date().toISOString(),
    };

    const { data, error } = await window.QSR_DB.from("scan_history").insert([
      scanEntry,
    ]);

    if (error) {
      console.error("[Scanner] Failed to save scan:", error.message);
      showToast(
        `Scan saved locally (DB save failed: ${error.message})`,
        "warning",
      );
      return;
    }

    console.log("[Scanner] Scan saved to database:", data);

    // Emit audit log
    await auditLog("scan_completed", `host:${result.host}`, {
      risk_score: result.risk_score,
      vulnerabilities: result.vulnerabilities,
      key_algorithm: result.key_algorithm,
    });
  } catch (e) {
    console.error("[Scanner] Save failed:", e.message);
  }
}

function determineGrade(riskScore) {
  if (riskScore >= 76) return "A";
  if (riskScore >= 60) return "B";
  if (riskScore >= 45) return "C";
  if (riskScore >= 25) return "D";
  return "F";
}

async function auditLog(action, target, details) {
  if (!window.QSR_DB) return;

  try {
    await window.QSR_DB.from("audit_log").insert({
      user_id: window._QSR_USER.id,
      action: action,
      target: target,
      details: JSON.stringify(details),
    });
  } catch (e) {
    console.warn("[Audit] Failed to log:", e.message);
  }
}
```

---

## FIX #6: Add Database Indexes

### File: `supabase/schema.sql`

**Add these indexes:**

```sql
-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
  ON public.audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON public.audit_log(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_risk
  ON public.assets(risk);

CREATE INDEX IF NOT EXISTS idx_assets_owner
  ON public.assets(owner);

CREATE INDEX IF NOT EXISTS idx_domains_domain
  ON public.domains(domain);

CREATE INDEX IF NOT EXISTS idx_ssl_certs_fingerprint
  ON public.ssl_certs(fingerprint);

CREATE INDEX IF NOT EXISTS idx_pqc_scores_status
  ON public.pqc_scores(status, assessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_crypto_overview_asset_id
  ON public.crypto_overview(asset_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_cbom_asset_id
  ON public.cbom(asset_id);

CREATE INDEX IF NOT EXISTS idx_scan_history_host
  ON public.scan_history(host, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_created_by
  ON public.reports(created_by, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assets_risk_last_scan
  ON public.assets(risk, last_scan DESC);
```

---

## FIX #7: Enforce Zero Trust Policies

### File: `js/zero-trust-engine.js`

**Add enforcement function:**

```javascript
ZT.enforcePolicy = async function () {
  const score = ZT.getScore();
  const level = ZT.getLevel();
  const alerts = ZT.getAlerts();

  // CRITICAL: Force logout
  if (level === "CRITICAL" && score < 20) {
    showToast("Critical security violation detected. Signing out.", "error");
    await QSR_Auth.signOut();
    window.location.href = "index.html?reason=security_violation";
    return false;
  }

  // HIGH: Re-verify or warn
  if (level === "LOW" && score < 40) {
    // Check for critical alert types
    const hasCriticalAlert = alerts.some((a) => a.severity === "danger");
    if (hasCriticalAlert) {
      const shouldContinue = confirm(
        "Security warning detected. Re-authenticate to continue?\n\n" +
          alerts.map((a) => "  - " + a.title).join("\n"),
      );

      if (!shouldContinue) {
        window.location.href = "index.html";
        return false;
      }
    }
  }

  return true;
};

// Call enforcement on page navigation
window.addEventListener("beforeunload", async (e) => {
  if (!(await ZT.enforcePolicy())) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// Check periodically (every 30 seconds)
setInterval(async () => {
  ZT.assess();
  await ZT.enforcePolicy();
}, 30000);
```

---

## FIX #8: Centralized QR Score Calculation

### File: `js/qr-scoring.js` (Create new file)

```javascript
/* ============================================================
   qr-scoring.js - Unified Quantum Risk Score Calculation
   Single source of truth for all QR score computations
   ============================================================ */

window.QSRScoring = (function () {
  // Configuration: Score weights
  const SCORE_CONFIG = {
    version: "2.0.0",
    weights: {
      tlsVersion: 0.25,
      cipherStrength: 0.3,
      keyLength: 0.25,
      certificateHealth: 0.15,
      securityHeaders: 0.05,
    },
  };

  // TLS version scoring
  function scoreTLSVersion(tlsVersion) {
    if (!tlsVersion) return 0;
    if (tlsVersion >= 1.3) return 100;
    if (tlsVersion >= 1.2) return 60;
    if (tlsVersion >= 1.0) return 20;
    return 0;
  }

  // Cipher strength scoring
  function scoreCipherStrength(cipherAnalysis) {
    if (!cipherAnalysis) return 50;
    if (cipherAnalysis.strength === "pqc-ready") return 100;
    if (cipherAnalysis.strength === "strong") return 80;
    if (cipherAnalysis.strength === "medium") return 50;
    if (cipherAnalysis.strength === "weak") return 20;
    return 0;
  }

  // Key length scoring
  function scoreKeyLength(keySize, algorithm) {
    if (!keySize) return 40;
    if (algorithm === "ECDSA") {
      if (keySize >= 384) return 90;
      if (keySize >= 256) return 70;
      return 40;
    }
    // RSA
    if (keySize >= 4096) return 100;
    if (keySize >= 3072) return 85;
    if (keySize >= 2048) return 70;
    if (keySize >= 1024) return 30;
    return 10;
  }

  // Certificate health scoring
  function scoreCertificateHealth(daysLeft, certChainValid, hasCAA) {
    let score = 0;
    if (daysLeft > 90) score += 50;
    else if (daysLeft > 30) score += 30;
    else if (daysLeft > 0) score += 10;
    else return 0; // Expired

    if (certChainValid) score += 30;
    if (hasCAA) score += 20;

    return Math.min(score, 100);
  }

  // Security headers scoring
  function scoreSecurityHeaders(securityHeaders) {
    if (!securityHeaders) return 30;
    let score = 0;
    if (securityHeaders.hsts_enabled) score += 25;
    if (securityHeaders.csp_enabled) score += 25;
    if (securityHeaders.x_frame_options) score += 25;
    if (securityHeaders.x_content_type_options) score += 25;
    return Math.min(score, 100);
  }

  /**
   * Calculate unified QR score from scan result
   * @param {EnhancedScanResult} result - From TLS scanner
   * @returns {number} 0-100 score
   */
  function calculateScore(result) {
    if (!result) return 0;

    const scores = {
      tls: scoreTLSVersion(result.tls_version),
      cipher: scoreCipherStrength(result.cipher_analysis),
      key: scoreKeyLength(result.key_size, result.key_algorithm),
      cert: scoreCertificateHealth(
        result.days_left,
        result.cert_chain_valid,
        result.dns_analysis?.caa_records,
      ),
      headers: scoreSecurityHeaders(result.security_headers),
    };

    // Weighted sum
    const weighted =
      scores.tls * SCORE_CONFIG.weights.tlsVersion +
      scores.cipher * SCORE_CONFIG.weights.cipherStrength +
      scores.key * SCORE_CONFIG.weights.keyLength +
      scores.cert * SCORE_CONFIG.weights.certificateHealth +
      scores.headers * SCORE_CONFIG.weights.securityHeaders;

    return Math.round(weighted);
  }

  /**
   * Get PQC tier from score
   * @param {number} score - QR score 0-100
   * @returns {string} Tier name
   */
  function getTier(score) {
    if (score >= 76) return "Elite-PQC";
    if (score >= 51) return "Standard";
    if (score >= 26) return "Legacy";
    return "Critical";
  }

  /**
   * Get risk level from score
   * @param {number} score
   * @returns {string} Risk level
   */
  function getRiskLevel(score) {
    if (score >= 76) return "Low";
    if (score >= 51) return "Medium";
    if (score >= 26) return "High";
    return "Critical";
  }

  return {
    calculateScore: calculateScore,
    getTier: getTier,
    getRiskLevel: getRiskLevel,
    getConfig: () => SCORE_CONFIG,
    scoreBreakdown: (result) => ({
      tlsVersion: scoreTLSVersion(result.tls_version),
      cipher: scoreCipherStrength(result.cipher_analysis),
      keyLength: scoreKeyLength(result.key_size, result.key_algorithm),
      certificate: scoreCertificateHealth(
        result.days_left,
        result.cert_chain_valid,
        result.dns_analysis?.caa_records,
      ),
      securityHeaders: scoreSecurityHeaders(result.security_headers),
      final: calculateScore(result),
    }),
  };
})();
```

**Update callers to use this:**

```javascript
// In pages-scanner.js
const qrScore = window.QSRScoring.calculateScore(scanResult);
const tier = window.QSRScoring.getTier(qrScore);
const risk = window.QSRScoring.getRiskLevel(qrScore);

// In data-layer.js
function heuristicAssetScore(asset) {
  // Build mockup scan result from asset data
  const mockResult = {
    tls_version: asset.tls_version || 1.2,
    cipher_analysis: { strength: "medium" },
    key_algorithm: "RSA",
    key_size: asset.key_length,
    days_left: asset.cert_days_left,
    cert_chain_valid: asset.cert_status === "Valid",
  };
  return window.QSRScoring.calculateScore(mockResult);
}
```

---

## FIX #9: CORS Whitelist & Security Headers

### File: `supabase/functions/tls-scanner/index.ts`

```typescript
// Get origin for CORS
function getOrigin(req: Request): string | null {
  return req.headers.get("origin");
}

// Allowed origins
const ALLOWED_ORIGINS = new Set([
  "https://shinmrlkbaggbwpzhlcl.supabase.co",
  "https://qsecure-radar.vercel.app",
  // Add PNB's actual domain:
  // 'https://pnb.banking-app.co.in'
]);

function getCORSHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.has(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "3600",
  };
}

Deno.serve(async (req: Request) => {
  const origin = getOrigin(req);
  const corsHeaders = getCORSHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ... rest of handler
});
```

---

## Implementation Checklist

```
PRIORITY 1 (Week 1):
☐ Fix #1 - Session Validation (2-3h)
☐ Fix #2 - API Keys to env vars (1h)
☐ Fix #3 - SSRF Protection (2h)
☐ Fix #4 - Missing RLS Policies (30m)
☐ Rotate API key in Supabase (1h)
☐ Test authentication flow thoroughly (1h)

PRIORITY 2 (Week 2):
☐ Fix #5 - Auto-save scan results (2-3h)
☐ Fix #6 - Add database indexes (1-2h)
☐ Fix #7 - Enforce Zero Trust (2h)
☐ Improve error handling (2-3h)
☐ Add retry logic to queries (1h)

PRIORITY 3 (Week 3):
☐ Fix #8 - Centralize QR scoring (2-3h)
☐ Fix #9 - CORS & security headers (1-2h)
☐ Add pagination (2h)
☐ Implement audit trail enrichment (2-3h)
☐ Add rate limiting headers (1h)

PRIORITY 4 (Week 4+):
☐ Implement scheduled re-scanning (3-4h)
☐ Add CI/CD pipeline (4-6h)
☐ TypeScript migration (8-16h)
☐ Security audit & penetration test (varies)
```

---

**Last Updated:** April 8, 2026  
**Status:** READY FOR IMPLEMENTATION
