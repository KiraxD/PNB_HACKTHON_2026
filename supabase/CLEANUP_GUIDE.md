# 🗑️ Database Cleanup & Refresh Guide

## Quick Steps to Clear All Scan & Asset Data

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy & paste the contents of **`clear-data.sql`**
5. Click **Execute** (or press Ctrl+Enter)
6. Wait for verification results showing all tables empty

### Option 2: Using Supabase CLI

```bash
# Make sure you're in project directory
cd c:\Users\KIIT0001\Desktop\pnb

# Connect to Supabase
supabase start  # if running locally
# or connect to production

# Run clear script
supabase sql --file supabase/clear-data.sql
```

---

## 📊 Load Fresh Test Data

After clearing, populate with sample data:

### Via Supabase SQL Editor:

1. Click **New Query**
2. Copy & paste contents of **`fresh-seed.sql`**
3. Click **Execute**
4. Verify the record counts appear

### Via CLI:

```bash
supabase sql --file supabase/fresh-seed.sql
```

---

## 📝 What Gets Cleared

All scan and asset data is wiped:

- ✅ `assets` — Asset inventory entries
- ✅ `domains` — Domain records
- ✅ `ssl_certs` — Certificate data
- ✅ `ip_subnets` — IP ranges
- ✅ `software` — Software inventory
- ✅ `nameservers` — nameserver records
- ✅ `crypto_overview` — Cryptographic analysis
- ✅ `cbom` — Component BOM vulnerabilities
- ✅ `pqc_scores` — PQC readiness scores
- ✅ `cyber_rating` — Security ratings
- ✅ `scan_history` — Previous scan results
- ✅ `reports` — Generated reports
- ✅ `audit_log` — Activity logs

**Preserved:** Database schema, user profiles, auth

---

## ✨ What Fresh Seed Loads

### Assets (8 samples):

- PNB Main Portal (Low risk, Tier-1)
- Core Banking API (Low risk, Tier-1)
- Payment Gateway (Medium risk, Tier-2)
- Mobile App API (Medium risk, Tier-2)
- Customer Portal (High risk, Tier-3)
- Admin Dashboard (Critical risk, Tier-4)
- Identity Server (Medium risk, Tier-2)
- Data Warehouse (Low risk, Tier-1)

### Supporting Data:

- 4 Domain registrations
- 4 SSL Certificates
- 3 IP Subnets
- 4 Software components
- 2 PQC scores
- 6 Cyber ratings
- 3 CBOM vulnerabilities
- 6 Scan history records

---

## 🔄 Complete Reset Workflow

```bash
# Step 1: Clear all data
# (Run clear-data.sql in Supabase SQL Editor)

# Step 2: Load fresh sample data
# (Run fresh-seed.sql in Supabase SQL Editor)

# Step 3: Verify dashboard loads correctly
# Go to localhost:3000 (or your hosted URL) → Home
# Should show fresh asset count and metrics

# Step 4: Run fresh scans on new assets
# Click "Unified Scanner" → Enter domain → SCAN
```

---

## ⚠️ Important Notes

- **RLS Policies**: Clear operation respects Row-Level Security
- **Foreign Keys**: CASCADING deletes handled automatically
- **Backups**: No backup is created; be sure before executing
- **Audit Trail**: All deletions ARE logged in audit tables if enabled

---

## 🆘 Troubleshooting

**Error: "permission denied for schema public"**
→ You need admin/superuser role in Supabase

**Error: "violates foreign key constraint"**
→ CASCADE is enabled; ensure all tables cleared in correct order

**Dashboard shows old data after clear**
→ Clear browser cache (Ctrl+Shift+Delete) and refresh page

---

**Files:**

- `clear-data.sql` — Remove all scan/asset data
- `fresh-seed.sql` — Load 8 sample assets + verification data
- `schema.sql` — Full database schema (run this first if creating from scratch)
- `seed.sql` — Original demo seed (currently intentionally empty)
