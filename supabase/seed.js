/* ============================================================
   seed.js — One-time data seeder for Supabase
   QSecure Radar | PSB Hackathon 2026
   Run: node supabase/seed.js  (requires SUPABASE_URL & SERVICE_ROLE_KEY)
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

// ─── Fill these in before running ────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';
// ─────────────────────────────────────────────────────────────

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedTable(table, rows) {
  console.log(`  → Seeding ${table} (${rows.length} rows)...`);
  const { error } = await db.from(table).insert(rows);
  if (error) console.error(`    ✗ ${table}:`, error.message);
  else       console.log(`    ✓ ${table} seeded.`);
}

async function main() {
  console.log('\n[QSecure Radar] Starting Supabase seed\n' + '─'.repeat(50));

  /* ── Assets (FR4) ─────────────────────────────────────────── */
  await seedTable('assets', [
    { name:'PNB Internet Banking Portal',       url:'https://netbanking.pnb.co.in',  ipv4:'103.41.66.20', ipv6:'2401:4900::1',     type:'Web App',       owner:'Digital Banking', risk:'High',     cert_status:'Valid',    key_length:2048 },
    { name:'PNB Mobile API Gateway',            url:'https://api.pnb.co.in',          ipv4:'103.41.66.21', ipv6:'2401:4900::2',     type:'API Gateway',   owner:'IT Infra',        risk:'Critical',  cert_status:'Valid',    key_length:1024 },
    { name:'PNB Corporate Website',             url:'https://www.pnb.co.in',          ipv4:'103.41.66.22', ipv6:'—',                type:'Web App',       owner:'Marketing',       risk:'Medium',    cert_status:'Valid',    key_length:4096 },
    { name:'PNB VPN Gateway',                   url:'https://vpn.pnb.co.in',          ipv4:'34.55.90.21',  ipv6:'—',                type:'VPN Service',   owner:'Network Ops',     risk:'Critical',  cert_status:'Expired',  key_length:1024 },
    { name:'PNB Payment Gateway',               url:'https://payments.pnb.co.in',     ipv4:'103.41.66.30', ipv6:'2401:4900::5',     type:'API Gateway',   owner:'Cards & Payment', risk:'High',     cert_status:'Expiring', key_length:2048 },
    { name:'PNB Auth Service (SSO)',            url:'https://auth.pnb.co.in',          ipv4:'103.41.66.35', ipv6:'2401:4900::6',     type:'Auth Service',  owner:'IAM Team',        risk:'High',     cert_status:'Valid',    key_length:2048 },
    { name:'PNB Trade Finance Portal',          url:'https://trade.pnb.co.in',         ipv4:'103.41.66.40', ipv6:'—',                type:'Web App',       owner:'Trade Finance',   risk:'Medium',    cert_status:'Valid',    key_length:4096 },
    { name:'PNB Loan Management System',        url:'https://loans.pnb.co.in',         ipv4:'103.41.66.45', ipv6:'2401:4900::8',     type:'Web App',       owner:'Retail Banking',  risk:'Low',      cert_status:'Valid',    key_length:4096 },
    { name:'PNB Customer Service Portal',       url:'https://support.pnb.co.in',       ipv4:'103.41.66.50', ipv6:'—',                type:'Web App',       owner:'CRM Team',        risk:'Low',      cert_status:'Valid',    key_length:2048 },
    { name:'PNB HR Internal Portal',            url:'https://hr.pnb.internal',         ipv4:'192.168.1.10', ipv6:'—',                type:'Internal App',  owner:'HR Dept',         risk:'Low',      cert_status:'Valid',    key_length:2048 },
  ]);

  /* ── Domains (FR4) ─────────────────────────────────────────── */
  await seedTable('domains', [
    { domain:'pnb.co.in',           registered:'2000-03-15', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'netbanking.pnb.co.in',registered:'2005-07-21', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'api.pnb.co.in',       registered:'2015-01-10', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'vpn.pnb.co.in',       registered:'2012-11-05', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'payments.pnb.co.in',  registered:'2018-04-20', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'auth.pnb.co.in',      registered:'2019-09-12', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'trade.pnb.co.in',     registered:'2010-06-30', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'loans.pnb.co.in',     registered:'2016-02-18', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'support.pnb.co.in',   registered:'2017-08-22', registrar:'NIXI', company:'Punjab National Bank' },
    { domain:'mail.pnb.co.in',      registered:'2003-05-10', registrar:'NIXI', company:'Punjab National Bank' },
  ]);

  /* ── SSL Certs (FR7) ──────────────────────────────────────── */
  await seedTable('ssl_certs', [
    { fingerprint:'A3:2F:1C:9B:44:7E:D2:80:FA', valid_from:'2024-01-01', common_name:'*.pnb.co.in',          company:'PNB', ca:'DigiCert' },
    { fingerprint:'B1:4E:2A:8C:55:9F:C3:71:GB', valid_from:'2024-03-15', common_name:'api.pnb.co.in',        company:'PNB', ca:"Let's Encrypt" },
    { fingerprint:'C2:5F:3B:9D:66:AG:D4:82:HC', valid_from:'2023-06-01', common_name:'vpn.pnb.co.in',        company:'PNB', ca:'COMODO' },
    { fingerprint:'D3:6G:4C:AE:77:BH:E5:93:ID', valid_from:'2024-06-01', common_name:'payments.pnb.co.in',   company:'PNB', ca:'GlobalSign' },
    { fingerprint:'E4:7H:5D:BF:88:CI:F6:04:JE', valid_from:'2024-08-15', common_name:'auth.pnb.co.in',       company:'PNB', ca:'DigiCert' },
  ]);

  /* ── IP Subnets (FR5) ─────────────────────────────────────── */
  await seedTable('ip_subnets', [
    { ip:'103.41.66.20', ports:'443,80',   subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',    location:'New Delhi, IN',  company:'PNB' },
    { ip:'103.41.66.21', ports:'443,8443', subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',    location:'New Delhi, IN',  company:'PNB' },
    { ip:'34.55.90.21',  ports:'1194,443', subnet:'34.55.90.0/24',  asn:'AS15169', netname:'GOOGLE-GCP', location:'Mumbai, IN',    company:'GCP (PNB)' },
    { ip:'103.41.66.30', ports:'443',      subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',    location:'New Delhi, IN',  company:'PNB' },
    { ip:'103.41.66.35', ports:'443,8080', subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',    location:'New Delhi, IN',  company:'PNB' },
    { ip:'192.168.1.10', ports:'443',      subnet:'192.168.1.0/24', asn:'Private', netname:'PNB-INTRA', location:'Internal',       company:'PNB' },
  ]);

  /* ── Software (FR4) ───────────────────────────────────────── */
  await seedTable('software', [
    { product:'nginx',         version:'1.22.1', type:'Web Server',    port:443,  host:'netbanking.pnb.co.in', company:'PNB' },
    { product:'OpenSSL',       version:'1.1.1t', type:'Crypto Library', port:443,  host:'api.pnb.co.in',        company:'PNB' },
    { product:'Apache Tomcat', version:'9.0.74', type:'App Server',    port:8080, host:'payments.pnb.co.in',   company:'PNB' },
    { product:'OpenVPN',       version:'2.5.8',  type:'VPN',           port:1194, host:'vpn.pnb.co.in',        company:'PNB' },
    { product:'HAProxy',       version:'2.6.0',  type:'Load Balancer', port:80,   host:'lb.pnb.co.in',         company:'PNB' },
    { product:'Keycloak',      version:'21.0.1', type:'IAM',           port:8443, host:'auth.pnb.co.in',       company:'PNB' },
    { product:'PostgreSQL',    version:'15.2',   type:'Database',      port:5432, host:'db.pnb.internal',      company:'PNB' },
    { product:'Redis',         version:'7.0.11', type:'Cache',         port:6379, host:'cache.pnb.internal',   company:'PNB' },
  ]);

  /* ── Nameservers ──────────────────────────────────────────── */
  await seedTable('nameservers', [
    { hostname:'ns1.pnb.co.in',    type:'NS', ip:'103.41.66.1',  ipv6:'2401:4900::1', ttl:'86400' },
    { hostname:'ns2.pnb.co.in',    type:'NS', ip:'103.41.66.2',  ipv6:'2401:4900::2', ttl:'86400' },
    { hostname:'pnb.co.in',        type:'A',  ip:'103.41.66.20', ipv6:'—',             ttl:'3600'  },
    { hostname:'mail.pnb.co.in',   type:'MX', ip:'103.41.66.60', ipv6:'—',             ttl:'3600'  },
    { hostname:'_dmarc.pnb.co.in', type:'TXT',ip:'—',            ipv6:'—',             ttl:'3600'  },
  ]);

  /* ── Crypto Overview (FR5, FR6) ───────────────────────────── */
  await seedTable('crypto_overview', [
    { key_len:'2048-bit', cipher:'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', tls:'1.3', ca:'DigiCert',     scanned_at: new Date().toISOString() },
    { key_len:'1024-bit', cipher:'TLS_RSA_WITH_AES_128_CBC_SHA',           tls:'1.0', ca:"Let's Encrypt", scanned_at: new Date().toISOString() },
    { key_len:'4096-bit', cipher:'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305',   tls:'1.3', ca:'GlobalSign',   scanned_at: new Date().toISOString() },
    { key_len:'2048-bit', cipher:'TLS_DHE_RSA_WITH_AES_256_CBC_SHA256',    tls:'1.2', ca:'COMODO',       scanned_at: new Date().toISOString() },
    { key_len:'1024-bit', cipher:'TLS_RSA_WITH_RC4_128_SHA',               tls:'1.0', ca:'GlobalSign',   scanned_at: new Date().toISOString() },
  ]);

  /* ── CBOM (FR8) ───────────────────────────────────────────── */
  await seedTable('cbom', [
    { app:'netbanking.pnb.co.in', key_length:'2048-bit', cipher:'TLS_ECDHE_RSA_AES_256_GCM_SHA384', ca:'DigiCert',      tls_version:'1.3' },
    { app:'api.pnb.co.in',        key_length:'1024-bit', cipher:'TLS_RSA_AES_128_CBC_SHA',           ca:"Let's Encrypt", tls_version:'1.0' },
    { app:'www.pnb.co.in',        key_length:'4096-bit', cipher:'TLS_ECDHE_RSA_CHACHA20_POLY1305',   ca:'GlobalSign',    tls_version:'1.3' },
    { app:'vpn.pnb.co.in',        key_length:'1024-bit', cipher:'TLS_DHE_RSA_AES_256_CBC_SHA256',    ca:'COMODO',        tls_version:'1.2' },
    { app:'payments.pnb.co.in',   key_length:'2048-bit', cipher:'TLS_ECDHE_RSA_AES_128_GCM_SHA256',  ca:'DigiCert',      tls_version:'1.3' },
    { app:'auth.pnb.co.in',       key_length:'2048-bit', cipher:'TLS_ECDHE_ECDSA_AES_256_GCM_SHA384',ca:'DigiCert',      tls_version:'1.3' },
    { app:'trade.pnb.co.in',      key_length:'4096-bit', cipher:'TLS_RSA_AES_256_GCM_SHA384',        ca:'GlobalSign',    tls_version:'1.2' },
  ]);

  /* ── PQC Scores (FR9 — Quantum Risk Score 0-100) ────────────
     SRS FR9: score range is 0–100 (not 0–1000)
     Higher = better PQC readiness per NIST PQC guidelines        */
  await seedTable('pqc_scores', [
    { asset_name:'netbanking.pnb.co.in', score:38, status:'Critical',     pqc_support:false },
    { asset_name:'api.pnb.co.in',        score:12, status:'Critical',     pqc_support:false },
    { asset_name:'www.pnb.co.in',        score:72, status:'Standard',     pqc_support:false },
    { asset_name:'vpn.pnb.co.in',        score:8,  status:'Critical',     pqc_support:false },
    { asset_name:'payments.pnb.co.in',   score:45, status:'Legacy',       pqc_support:false },
    { asset_name:'auth.pnb.co.in',       score:51, status:'Legacy',       pqc_support:false },
    { asset_name:'trade.pnb.co.in',      score:81, status:'Standard',     pqc_support:true  },
    { asset_name:'loans.pnb.co.in',      score:65, status:'Standard',     pqc_support:false },
    { asset_name:'support.pnb.co.in',    score:90, status:'Elite-PQC',    pqc_support:true  },
    { asset_name:'hr.pnb.internal',      score:95, status:'Elite-PQC',    pqc_support:true  },
  ]);

  /* ── Cyber Rating (FR10, FR14) — score 0-100 per SRS ──────── */
  await seedTable('cyber_rating', [
    { enterprise_score:42, max_score:100, grade:'Tier 3 — Satisfactory', calculated_at: new Date().toISOString() }
  ]);

  /* ── Audit Log (FR15) ─────────────────────────────────────── */
  await seedTable('audit_log', [
    { action:'SYSTEM_INIT',                  target:'QSecure Radar v1.0', icon:'🚀' },
    { action:'SCAN_COMPLETED: pnb.co.in',    target:'103.41.66.20',        icon:'✅' },
    { action:'VULN_DETECTED: RSA-1024',      target:'api.pnb.co.in',       icon:'🚨' },
    { action:'CERT_EXPIRY: vpn.pnb.co.in',  target:'Expires in 5 days',   icon:'⚠️' },
    { action:'CBOM_GENERATED',               target:'7 assets processed',  icon:'📜' },
    { action:'REPORT_GENERATED: EXECUTIVE',  target:'Sent to CISO',        icon:'📊' },
    { action:'PQC_SCORE_COMPUTED',           target:'10 assets ranked',    icon:'⚡' },
    { action:'ZERO_TRUST_VALIDATED',         target:'SOC scan request',    icon:'🛡️' },
  ]);

  console.log('\n' + '─'.repeat(50));
  console.log('[QSecure Radar] Seed complete!\n');
  console.log('Next steps:');
  console.log('  1. Open js/supabase-client.js and set SUPABASE_URL + SUPABASE_ANON_KEY');
  console.log('  2. Open index.html in browser and log in');
  console.log('  3. Create a test user in Supabase Dashboard → Auth → Users\n');
}

main().catch(console.error);
