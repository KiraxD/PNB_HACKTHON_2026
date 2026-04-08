#!/usr/bin/env node
/**
 * QSecure Radar — Database Seed via SQL
 * Executes raw SQL to bypass RLS restrictions
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shinmrlkbaggbwpzhlcl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaW5tcmxrYmFnZ2J3cHpobGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjQ5OTksImV4cCI6MjA4OTcwMDk5OX0.xYRrKNOdUD3g-APqEGSx9yG6qg6YpCeziIGY-gqPYhA';

const seedSQL = `
-- Load fresh sample assets
INSERT INTO public.assets (name, url, ipv4, type, owner, risk, cert_status, key_length, qr_score, pqc_bucket, last_scan)
VALUES
  ('PNB Main Portal', 'www.netpnb.com', '1.2.3.4', 'Web Server', 'ITOP', 'Low', 'Valid', 2048, 85, 'Tier-1', now()),
  ('Core Banking API', 'api.pnb.co.in', '1.2.3.5', 'API Gateway', 'Banking', 'Low', 'Valid', 2048, 88, 'Tier-1', now()),
  ('Payment Gateway', 'pay.netpnb.com', '1.2.3.6', 'Web Application', 'Commerce', 'Medium', 'Valid', 2048, 72, 'Tier-2', now()),
  ('Mobile App API', 'mobile-api.pnb.co.in', '1.2.3.7', 'API Gateway', 'Mobile', 'Medium', 'Expiring', 2048, 65, 'Tier-2', now()),
  ('Customer Portal', 'customer.netpnb.com', '1.2.3.8', 'Web Server', 'CRM', 'High', 'Valid', 2048, 58, 'Tier-3', now()),
  ('Admin Dashboard', 'admin.netpnb.com', '1.2.3.9', 'Admin Panel', 'Operations', 'Critical', 'Expired', 1024, 42, 'Tier-4', now()),
  ('Identity Server', 'auth.pnb.co.in', '1.2.3.10', 'Auth Server', 'Security', 'Medium', 'Valid', 2048, 78, 'Tier-2', now()),
  ('Data Warehouse', 'dw.internal.pnb', '192.168.1.10', 'Database', 'Analytics', 'Low', 'Valid', 4096, 92, 'Tier-1', now());

-- Load domains
INSERT INTO public.domains (domain, registered, registrar, company)
VALUES
  ('netpnb.com', '2010-05-15', 'NCCS', 'Punjab National Bank'),
  ('pnb.co.in', '2008-03-20', 'NCCS', 'Punjab National Bank'),
  ('mobile-api.pnb.co.in', '2015-07-10', 'NCCS', 'Punjab National Bank'),
  ('internal.pnb', '2012-11-01', 'Internal', 'Punjab National Bank');

-- Verify load
SELECT 'Assets' as entity, COUNT(*) as count FROM public.assets
UNION ALL SELECT 'Domains', COUNT(*) FROM public.domains;
`;

async function seedDatabase() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('\n📥 Loading fresh seed data via SQL...\n');
    
    const { data, error } = await supabase.rpc('exec', { sql: seedSQL });
    
    if (error) {
      console.log(`\n⚠️  Could not use RPC exec method: ${error.message}`);
      console.log('\n❗ MANUAL SETUP REQUIRED:\n');
      console.log('Due to Row-Level Security policies, please follow these steps:\n');
      console.log('  1. Go to Supabase Dashboard → SQL Editor');
      console.log('  2. Click "New Query"');
      console.log('  3. Copy contents of: supabase/fresh-seed.sql');
      console.log('  4. Paste into editor and click Execute');
      console.log('  5. Refresh your dashboard\n');
      process.exit(0);
    }
    
    console.log('✨ Seed data loaded!');
    process.exit(0);
  } catch (error) {
    console.log('\n❗ ALTERNATIVE: Manual SQL Execution\n');
    console.log('To load fresh seed data, use Supabase SQL Editor:\n');
    console.log('  1. Dashboard → SQL Editor → New Query');
    console.log('  2. Copy supabase/fresh-seed.sql');
    console.log('  3. Paste and Execute\n');
    process.exit(0);
  }
}

seedDatabase();
