# 🛡️ QSecure Radar

**Next-Generation Quantum Risk Assessment & Cyber Posture Management Platform**  
*PNB Hackathon 2026 — Submission*

---

## What Is QSecure Radar?

QSecure Radar is an **agentless, real-time cryptographic intelligence platform** designed to continuously audit the cryptographic posture of financial institution infrastructure and transition them into the **post-quantum era** before Q-Day arrives.

It profiles domains entirely from the **outside-in** — no agents, no credentials, no source-code access required.

---

## 🚀 Platform Modules

| Module | Description |
|---|---|
| **Dashboard** | Real-time KPIs: avg QR score, PQC-ready count, domain split, risk distribution |
| **Unified Scanner** | Custom 5-stage cryptographic profiling engine (DNS → TLS → Cipher → X.509 → PQC) |
| **Asset Inventory** | Full cryptographic details per asset; PNB vs. 3rd-Party domain bucketing |
| **CBOM** | Dynamic Cryptographic Bill of Materials across the enterprise |
| **PQC Posture** | NIST FIPS 203-aligned quantum readiness tiers (Elite-PQC, Standard, Legacy, Critical) |
| **Cyber Rating** | Normalized 0–100 enterprise security score per NIST SP 800-131A Rev2 |
| **Audit Log** | Immutable, zero-trust event provenance for all scan actions |

---

## 🔬 Scanner Engine — Technical Architecture

The core scanner is a **custom-built, serverless TLS profiling engine** running on **Deno Edge Functions (Supabase)**. It performs:

1. **DNS-over-HTTPS (DoH)** — Cloudflare 1.1.1.1 resolves `A`, `AAAA`, `MX`, `NS`, and `CAA` records
2. **Raw TCP/TLS Handshake** — `Deno.connectTls()` negotiates the actual protocol version (TLS 1.2 vs 1.3)
3. **X.509 ASN.1 Extraction** — Parses byte-level certificates to extract Key Type, Key Length, SANs, and CA chain
4. **Cipher Harvest** — Maps exact cipher suites (e.g., `TLS_AES_256_GCM_SHA384`) and detects deprecated ones
5. **Quantum Assessment** — Scores the endpoint 0–100 based on NIST FIPS 203 / SP 800-131A heuristics

---

## 📡 Real-Time Cross-Tab Sync

After every scan, a **`qsr:data-sync`** CustomEvent fires and propagates across the entire application:

- **Active tab**: silently re-fetches data and patches DOM in-place (zero flash, zero scroll reset)
- **Inactive tabs**: receive a pulsing green `.sync-badge` dot on the sidebar nav item, cleared when visited

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla JS, HTML5 Canvas, CSS3 — no framework overhead |
| **Backend / DB** | Supabase (PostgreSQL + Row Level Security) |
| **Auth** | Supabase Auth (email/password) |
| **Edge Compute** | Deno Edge Functions for TLS scanning |
| **DNS** | Cloudflare DNS-over-HTTPS (1.1.1.1) |
| **Deployment** | Vercel (zero-config CDN deployment) |

---

## 🔐 PQC Scoring Algorithm

| Score | Tier | Meaning |
|---|---|---|
| 76–100 | **Elite-PQC** | Hybrid ML-KEM / Kyber or strong TLS 1.3 + modern key exchange |
| 51–75 | **Standard** | TLS 1.3, RSA ≥ 2048, no deprecated ciphers |
| 26–50 | **Legacy** | TLS 1.2, weaker key lengths, some cipher concerns |
| 0–25 | **Critical** | TLS ≤ 1.1, RC4/3DES, RSA < 2048 — immediate action required |

---

## ⚡ Quick Start (Local Dev)

```bash
# Clone the repo
git clone https://github.com/KiraxD/PNB_HACKTHON_2026.git
cd PNB_HACKTHON_2026

# Add environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL and Anon Key

# Open dashboard
open dashboard.html
```

---

## 📋 Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

---

## 📄 License

Built for the **PNB Hackathon 2026**. All rights reserved.
