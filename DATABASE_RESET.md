# 🔄 Database Reset Instructions

## Quick Start: Clear All Data & Load Fresh

### Step 1: Clear Previous Scan & Asset Data

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/clear-data.sql`
5. Paste it into the editor
6. Click **Execute** (or Ctrl+Enter)
7. ✅ Wait for "All tables are empty" verification message

### Step 2: Load Fresh Sample Data

1. Click **New Query** again
2. Copy the entire contents of `supabase/fresh-seed.sql`
3. Paste it into the editor
4. Click **Execute**
5. ✅ Wait for "SEED DATA LOADED" message showing record counts

### Step 3: Verify in Dashboard

1. Go to your QSecure Radar dashboard (localhost:3000 or hosted URL)
2. Refresh the page (Ctrl+R or Cmd+R)
3. Home page should show:
   - **Assets Discovered**: 8
   - Fresh asset inventory with sample PNB infrastructure

---

## 📁 Files You Need

Location: `supabase/`

- `clear-data.sql` — Removes all scan, asset, and test data
- `fresh-seed.sql` — Populates with 8 sample PNB assets + related data
- `CLEANUP_GUIDE.md` — Detailed documentation

---

## ✅ What Gets Reset

**Cleared:**

- All assets from Asset Inventory
- All domains and DNS records
- All SSL certificates
- All scan history and results
- All vulnerabilities and CBOM data
- All cyber ratings and PQC scores
- All reports and audit logs

**Preserved:**

- User accounts and authentication
- Database schema
- RLS (Row-Level Security) policies

---

## 🎯 Fresh Assets Loaded

1. **PNB Main Portal** (www.netpnb.com) - Tier 1, Low Risk
2. **Core Banking API** (api.pnb.co.in) - Tier 1, Low Risk
3. **Payment Gateway** - Tier 2, Medium Risk
4. **Mobile App API** - Tier 2, Medium Risk
5. **Customer Portal** - Tier 3, High Risk
6. **Admin Dashboard** - Tier 4, Critical Risk
7. **Identity Server** - Tier 2, Medium Risk
8. **Data Warehouse** - Tier 1, Low Risk

Each asset includes:

- SSL certificates
- Vulnerable software components
- Cyber ratings
- PQC readiness scores
- Scan history

---

## 🚀 Run Fresh Scans

After loading fresh data:

1. Click **Unified Scanner** in sidebar
2. Choose a tab:
   - **🔐 Security Scanner** — Vulnerability analysis
   - **⚡ TLS Scanner** — Certificate & crypto analysis
   - **🎯 Combined Scan** — Both simultaneously
3. Enter domain and click **SCAN**

---

## 💾 Database Connection

**Supabase Project**: `https://shinmrlkbaggbwpzhlcl.supabase.co`

To run SQL directly in Node.js:

```javascript
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, key);
const { data, error } = await supabase.from("assets").select("*");
```

---

## ⚠️ Important

- ✅ Always run `clear-data.sql` **before** `fresh-seed.sql`
- ✅ Verify clear operation completed before loading seed
- ✅ Browser cache may show old data — clear and refresh
- ✅ No automatic backup — be sure before clearing

---

For more details, see `supabase/CLEANUP_GUIDE.md`
