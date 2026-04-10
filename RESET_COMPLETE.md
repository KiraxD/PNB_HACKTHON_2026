# 🎯 Database Reset - Complete Guide

## ✅ STEP 1: CLEARED (DONE!)

All scan and asset data has been **successfully cleared** from Supabase.

**Cleared tables:**

- ✅ assets (0 rows)
- ✅ domains (0 rows)
- ✅ ssl_certs (0 rows)
- ✅ ip_subnets (0 rows)
- ✅ software (0 rows)
- ✅ scan_history (0 rows)
- ✅ cbom (0 rows)
- ✅ cyber_rating (0 rows)
- ✅ pqc_scores (0 rows)
- ✅ And 4 more...

**Command used:**

```bash
node clear-database.js
```

---

## 📊 STEP 2: LOAD FRESH DATA (NEXT)

To populate with fresh sample PNB assets, follow **ONE** of these methods:

### **Method A: Supabase SQL Editor (RECOMMENDED)**

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Select your project: **shinmrlkbaggbwpzhlcl**
3. Click **SQL Editor** (left sidebar)
4. Click **+ New Query**
5. Open file: `supabase/fresh-seed.sql`
6. Copy **ALL** contents
7. Paste into SQL Editor
8. Click **Execute** (or Ctrl+Enter)
9. Wait for success message showing:
   ```
   Assets: 8
   Domains: 4
   SSL Certs: 4
   IP Subnets: 3
   Cyber Ratings: 6
   Scan History: 6
   ```

### **Method B: File Location**

```
c:\Users\KIIT0001\Desktop\pnb\supabase\fresh-seed.sql
```

---

## 🎮 STEP 3: VERIFY IN DASHBOARD

1. Open your dashboard: `http://localhost:3000` (or your hosted URL)
2. Refresh page: **Ctrl+R** or **Cmd+R**
3. Go to **Home** page
4. You should see:
   ```
   Assets Discovered: 8 ✓
   ```
5. In **Asset Inventory**, view all 8 fresh assets:
   - PNB Main Portal (Tier-1, Low risk)
   - Core Banking API (Tier-1, Low risk)
   - Payment Gateway (Tier-2, Medium risk)
   - Mobile App API (Tier-2, Medium risk)
   - Customer Portal (Tier-3, High risk)
   - Admin Dashboard (Tier-4, Critical risk)
   - Identity Server (Tier-2, Medium risk)
   - Data Warehouse (Tier-1, Low risk)

---

## 🔍 STEP 4: RUN FRESH SCANS

1. Click **Unified Scanner** in sidebar
2. Choose scan type:
   - **🔐 Security Scanner** — Vulnerability detection
   - **⚡ TLS Scanner** — Certificate analysis
   - **🎯 Combined Scan** — Both at once
3. Enter domain: `www.netpnb.com` (or any asset domain)
4. Click **▶ SCAN**
5. View results

---

## 📁 Associated Files

| File                      | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `clear-database.js`       | Clears all scan/asset data ✅ DONE       |
| `seed-database.js`        | Node script for seeding (requires auth)  |
| `supabase/fresh-seed.sql` | SQL for fresh sample data ← **USE THIS** |
| `supabase/clear-data.sql` | SQL for clearing ✅ EXECUTED             |
| `DATABASE_RESET.md`       | Full reference guide                     |

---

## 🆘 Troubleshooting

**Q: Dashboard still shows old data after refresh?**
→ Clear browser cache (Ctrl+Shift+Delete) and reload

**Q: Fresh assets don't appear after SQL execution?**
→ Wait 5-10 seconds, then refresh page

**Q: SQL Editor says "permission denied"?**
→ Use admin/service role credentials in Supabase

**Q: Can't find SQL Editor?**
→ In Supabase Dashboard → Left sidebar → Scroll down → **SQL Editor**

---

## ✨ Summary

| Status | Task                                    |
| ------ | --------------------------------------- |
| ✅     | Database cleared (13 tables truncated)  |
| ⏳     | Load fresh sample data (use SQL Editor) |
| ⏳     | Verify dashboard shows 8 assets         |
| ⏳     | Run first scan via Unified Scanner      |

**All ready!** Now load the fresh seed data and you're set. 🚀
