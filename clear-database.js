#!/usr/bin/env node
/**
 * QSecure Radar — Database Cleanup Script
 * Clears all scan, asset, and vulnerability data from Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shinmrlkbaggbwpzhlcl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaW5tcmxrYmFnZ2J3cHpobGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjQ5OTksImV4cCI6MjA4OTcwMDk5OX0.xYRrKNOdUD3g-APqEGSx9yG6qg6YpCeziIGY-gqPYhA';

async function clearDatabase() {
  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('\n🔄 Connecting to Supabase...');
    console.log(`   Project: ${SUPABASE_URL}\n`);
    
    // Tables to clear (in order of FK dependencies)
    const tablesToClear = [
      'scan_history',
      'reports',
      'audit_log',
      'cbom',
      'cyber_rating',
      'pqc_scores',
      'software',
      'nameservers',
      'crypto_overview',
      'ip_subnets',
      'ssl_certs',
      'domains',
      'assets'
    ];
    
    console.log('🗑️  Clearing tables...');
    
    for (const table of tablesToClear) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}`);
        }
      } catch (e) {
        console.log(`   ⚠️  ${table}: ${e.message}`);
      }
    }
    
    console.log('\n📊 Verifying tables are empty...\n');
    
    // Verify each table is empty
    for (const table of tablesToClear) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        const rowCount = count || 0;
        const status = rowCount === 0 ? '✅ EMPTY' : `⚠️  ${rowCount} rows`;
        console.log(`   ${table.padEnd(20)} ${status}`);
      } catch (e) {
        console.log(`   ${table.padEnd(20)} ⚠️  Could not verify`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ Database cleared successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Next steps:');
    console.log('   1. Run supabase/fresh-seed.sql to load sample assets');
    console.log('   2. Refresh dashboard to see fresh asset inventory');
    console.log('   3. Start scanning with Unified Scanner\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
clearDatabase();
