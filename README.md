# QSecure Radar — PNB_HACKTHON_2026
**Team REAL | KIIT | PSB Hackathon 2026**

Post-Quantum Cryptographic Assessment Platform for Punjab National Bank.

[![License: MIT](https://img.shields.io/badge/License-MIT-crimson.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/PSB%20Hackathon-2026-gold)](https://github.com/KiraxD/PNB_HACKTHON_2026)

---

## What is QSecure Radar?

QSecure Radar evaluates internet-facing PNB banking systems for cryptographic resilience against quantum computing threats (Shor's algorithm). It implements all 15 functional requirements from the SRS.

| SRS Requirement | Implementation |
|----------------|----------------|
| FR1 — MFA | Supabase Auth + 6-digit OTP |
| FR2 — RBAC | SOC Analyst / Admin / Compliance roles |
| FR3 — Zero Trust | RLS policies, JWT sessions, auth guard |
| FR4 — Asset Discovery | DNS enumeration, domain/IP/software tabs |
| FR5 — TLS Inspection | TLS version, cipher, key exchange details |
| FR6 — RSA/ECC Analysis | Key parameter extraction per asset |
| FR7 — Weak Key Detection | RSA < 2048-bit flagged |
| FR8 — CBOM | CycloneDX JSON export |
| FR9 — QR Score (0–100) | Quantum Risk Score per NIST PQC |
| FR10 — PQC Tiers | Elite-PQC / Standard / Legacy / Critical |
| FR11 — Quantum Labels | Per-asset security classification |
| FR12 — Migration Guidance | CRYSTALS-Kyber / Dilithium / SPHINCS+ |
| FR13 — Re-scanning | Periodic scan scheduling |
| FR14 — Reports | Executive / Scheduled / On-Demand |
| FR15 — Audit Log | Real-time Supabase subscription + CSV export |

---

## Tech Stack

- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript (SPA)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Charts:** Responsive Canvas API (no external chart libraries)
- **Graph:** D3.js (force-directed asset relationship map)
- **Fonts:** Rajdhani + Exo 2 (Google Fonts)

---

## Quick Start

### 1. Configure Supabase
Edit `js/supabase-client.js`:
```js
const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 2. Apply schema
Run `supabase/schema.sql` in the Supabase SQL Editor.

### 3. Seed data (optional)
```bash
cd supabase
npm install @supabase/supabase-js
SUPABASE_SERVICE_KEY=... node seed.js
```

### 4. Open the app
Open `index.html` in your browser. Demo Mode works without Supabase.

**Demo credentials:** any email + 5+ char password, OTP: `123456`

---

## Project Structure

```
pnb/
├── index.html              # Login + MFA + Create Account
├── dashboard.html          # SPA shell
├── css/
│   ├── styles.css          # Premium design system
│   └── login.css           # Login page styles
├── js/
│   ├── supabase-client.js  # SET YOUR KEYS HERE
│   ├── data-layer.js       # Live Supabase + mock fallback
│   ├── data.js             # Mock data (demo mode)
│   ├── app.js              # SPA router + Home + Inventory
│   ├── charts.js           # Responsive canvas charts
│   ├── network-graph.js    # D3.js force graph
│   ├── pages-discovery.js  # Asset Discovery (FR4,FR5)
│   ├── pages-cbom.js       # CBOM (FR8)
│   ├── pages-pqc.js        # PQC Posture (FR9-FR12)
│   ├── pages-cyber-rating.js # Cyber Rating (FR10)
│   ├── pages-reporting.js  # Reports (FR14)
│   ├── pages-auditlog.js   # Audit Log (FR15)
│   └── pages-users.js      # User Management (FR2)
├── supabase/
│   ├── schema.sql          # 13 tables + RLS
│   └── seed.js             # One-time data seeder
└── assets/
    └── bg-circuit.svg
```

---

## Team REAL

| Member | Role |
|--------|------|
| Reshob Roychoudhury | Team Lead |
| Shubham | Developer |
| Payal Majumdar | Tester |
| Priyadarshini Gupta | Tester |

**Institute:** Kalinga Institute of Industrial Technology (KIIT)
