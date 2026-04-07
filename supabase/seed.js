/* ============================================================
   seed.js - Supabase bootstrap helper
   This script no longer inserts demo or hardcoded data.
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('[QSecure Radar] No demo seed data will be inserted.');
  console.log('Load real assets, discovery records, scan history, and scores through controlled imports or live application activity.');
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
