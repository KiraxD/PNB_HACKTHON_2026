#!/usr/bin/env node
/**
 * QSecure Radar — Database Seed Script
 * Populates fresh sample assets and infrastructure data
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shinmrlkbaggbwpzhlcl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaW5tcmxrYmFnZ2J3cHpobGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjQ5OTksImV4cCI6MjA4OTcwMDk5OX0.xYRrKNOdUD3g-APqEGSx9yG6qg6YpCeziIGY-gqPYhA';

async function seedDatabase() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('\n📥 Loading fresh seed data...\n');
    
    // Sample Assets
    const assetsData = [
      { name: 'PNB Main Portal', url: 'www.netpnb.com', ipv4: '1.2.3.4', type: 'Web Server', owner: 'ITOP', risk: 'Low', cert_status: 'Valid', key_length: 2048, qr_score: 85, pqc_bucket: 'Tier-1' },
      { name: 'Core Banking API', url: 'api.pnb.co.in', ipv4: '1.2.3.5', type: 'API Gateway', owner: 'Banking', risk: 'Low', cert_status: 'Valid', key_length: 2048, qr_score: 88, pqc_bucket: 'Tier-1' },
      { name: 'Payment Gateway', url: 'pay.netpnb.com', ipv4: '1.2.3.6', type: 'Web Application', owner: 'Commerce', risk: 'Medium', cert_status: 'Valid', key_length: 2048, qr_score: 72, pqc_bucket: 'Tier-2' },
      { name: 'Mobile App API', url: 'mobile-api.pnb.co.in', ipv4: '1.2.3.7', type: 'API Gateway', owner: 'Mobile', risk: 'Medium', cert_status: 'Expiring', key_length: 2048, qr_score: 65, pqc_bucket: 'Tier-2' },
      { name: 'Customer Portal', url: 'customer.netpnb.com', ipv4: '1.2.3.8', type: 'Web Server', owner: 'CRM', risk: 'High', cert_status: 'Valid', key_length: 2048, qr_score: 58, pqc_bucket: 'Tier-3' },
      { name: 'Admin Dashboard', url: 'admin.netpnb.com', ipv4: '1.2.3.9', type: 'Admin Panel', owner: 'Operations', risk: 'Critical', cert_status: 'Expired', key_length: 1024, qr_score: 42, pqc_bucket: 'Tier-4' },
      { name: 'Identity Server', url: 'auth.pnb.co.in', ipv4: '1.2.3.10', type: 'Auth Server', owner: 'Security', risk: 'Medium', cert_status: 'Valid', key_length: 2048, qr_score: 78, pqc_bucket: 'Tier-2' },
      { name: 'Data Warehouse', url: 'dw.internal.pnb', ipv4: '192.168.1.10', type: 'Database', owner: 'Analytics', risk: 'Low', cert_status: 'Valid', key_length: 4096, qr_score: 92, pqc_bucket: 'Tier-1' }
    ];
    
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .insert(assetsData)
      .select();
    
    if (assetsError) {
      console.log(`   ⚠️  Assets: ${assetsError.message}`);
    } else {
      console.log(`   ✅ Assets (${assets.length} inserted)`);
    }
    
    // Domains
    const domainsData = [
      { domain: 'netpnb.com', registered: '2010-05-15', registrar: 'NCCS', company: 'Punjab National Bank' },
      { domain: 'pnb.co.in', registered: '2008-03-20', registrar: 'NCCS', company: 'Punjab National Bank' },
      { domain: 'mobile-api.pnb.co.in', registered: '2015-07-10', registrar: 'NCCS', company: 'Punjab National Bank' },
      { domain: 'internal.pnb', registered: '2012-11-01', registrar: 'Internal', company: 'Punjab National Bank' }
    ];
    
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .insert(domainsData)
      .select();
    
    if (domainsError) {
      console.log(`   ⚠️  Domains: ${domainsError.message}`);
    } else {
      console.log(`   ✅ Domains (${domains.length} inserted)`);
    }
    
    // SSL Certificates
    const certsData = [
      { fingerprint: 'SHA256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p', valid_from: '2024-01-15', valid_to: '2025-01-15', common_name: 'www.netpnb.com', company: 'Punjab National Bank', ca: 'Let\'s Encrypt Authority X3' },
      { fingerprint: 'SHA256:2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p1q', valid_from: '2023-06-20', valid_to: '2024-06-20', common_name: 'api.pnb.co.in', company: 'Punjab National Bank', ca: 'DigiCert Global Root CA' },
      { fingerprint: 'SHA256:3c4d5e6f7g8h9i0j1k2l3m4n5o6p1q2r', valid_from: '2022-12-01', valid_to: '2023-12-01', common_name: 'pay.netpnb.com', company: 'Punjab National Bank', ca: 'Sectigo RSA Domain Validation' },
      { fingerprint: 'SHA256:4d5e6f7g8h9i0j1k2l3m4n5o6p1q2r3s', valid_from: '2021-03-10', valid_to: '2022-03-10', common_name: 'admin.netpnb.com', company: 'Punjab National Bank', ca: 'self-signed' }
    ];
    
    const { data: certs, error: certsError } = await supabase
      .from('ssl_certs')
      .insert(certsData)
      .select();
    
    if (certsError) {
      console.log(`   ⚠️  SSL Certs: ${certsError.message}`);
    } else {
      console.log(`   ✅ SSL Certs (${certs.length} inserted)`);
    }
    
    // IP Subnets
    const subnetsData = [
      { ip: '1.2.3.0/24', ports: '80,443,8080,8443', subnet: '1.2.3.0/24', asn: 'AS55836', netname: 'PNB-MAIN', location: 'New Delhi, India' },
      { ip: '192.168.1.0/24', ports: '22,80,443,3306,5432', subnet: '192.168.1.0/24', asn: 'AS55836', netname: 'PNB-INTERNAL', location: 'New Delhi, India' },
      { ip: '10.0.0.0/16', ports: '22,3389', subnet: '10.0.0.0/16', asn: 'AS55836', netname: 'PNB-DATACENTER', location: 'Bangalore, India' }
    ];
    
    const { data: subnets, error: subnetsError } = await supabase
      .from('ip_subnets')
      .insert(subnetsData)
      .select();
    
    if (subnetsError) {
      console.log(`   ⚠️  IP Subnets: ${subnetsError.message}`);
    } else {
      console.log(`   ✅ IP Subnets (${subnets.length} inserted)`);
    }
    
    // Cyber Ratings
    const ratingsData = [
      { asset_id: assets[0].id, overall_rating: 85, tls_score: 90, crypto_score: 88, vulnerability_score: 80, compliance_score: 82 },
      { asset_id: assets[1].id, overall_rating: 88, tls_score: 92, crypto_score: 90, vulnerability_score: 85, compliance_score: 87 },
      { asset_id: assets[2].id, overall_rating: 72, tls_score: 75, crypto_score: 70, vulnerability_score: 72, compliance_score: 70 },
      { asset_id: assets[3].id, overall_rating: 65, tls_score: 68, crypto_score: 62, vulnerability_score: 65, compliance_score: 60 },
      { asset_id: assets[4].id, overall_rating: 58, tls_score: 60, crypto_score: 55, vulnerability_score: 58, compliance_score: 50 },
      { asset_id: assets[5].id, overall_rating: 42, tls_score: 45, crypto_score: 40, vulnerability_score: 42, compliance_score: 35 }
    ];
    
    const { data: ratings, error: ratingsError } = await supabase
      .from('cyber_rating')
      .insert(ratingsData)
      .select();
    
    if (ratingsError) {
      console.log(`   ⚠️  Cyber Ratings: ${ratingsError.message}`);
    } else {
      console.log(`   ✅ Cyber Ratings (${ratings.length} inserted)`);
    }
    
    // Scan History
    const scansData = [
      { scan_type: 'TLS Scanner', target: 'www.netpnb.com', target_type: 'domain', scan_status: 'completed', risk_level: 'Low', vulnerabilities_found: 2, report_url: '/reports/tls-netpnb-2026-04-07.pdf' },
      { scan_type: 'Security Scanner', target: 'api.pnb.co.in', target_type: 'domain', scan_status: 'completed', risk_level: 'Medium', vulnerabilities_found: 5, report_url: '/reports/security-api-2026-04-08.pdf' },
      { scan_type: 'Asset Discovery', target: 'pnb.co.in', target_type: 'domain', scan_status: 'in_progress', risk_level: 'Unknown', vulnerabilities_found: 0, report_url: null },
      { scan_type: 'TLS Scanner', target: 'pay.netpnb.com', target_type: 'domain', scan_status: 'completed', risk_level: 'Medium', vulnerabilities_found: 8, report_url: '/reports/tls-pay-2026-04-08.pdf' },
      { scan_type: 'Security Scanner', target: 'customer.netpnb.com', target_type: 'domain', scan_status: 'failed', risk_level: 'High', vulnerabilities_found: 0, report_url: null },
      { scan_type: 'CBOM Analysis', target: 'www.netpnb.com', target_type: 'domain', scan_status: 'completed', risk_level: 'High', vulnerabilities_found: 3, report_url: '/reports/cbom-netpnb-2026-04-08.pdf' }
    ];
    
    const { data: scans, error: scansError } = await supabase
      .from('scan_history')
      .insert(scansData)
      .select();
    
    if (scansError) {
      console.log(`   ⚠️  Scan History: ${scansError.message}`);
    } else {
      console.log(`   ✅ Scan History (${scans.length} inserted)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ Fresh seed data loaded successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Loaded data summary:');
    console.log(`   • Assets: 8`);
    console.log(`   • Domains: 4`);
    console.log(`   • SSL Certificates: 4`);
    console.log(`   • IP Subnets: 3`);
    console.log(`   • Cyber Ratings: 6`);
    console.log(`   • Scan History: 6`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Refresh dashboard to see 8 fresh assets');
    console.log('   2. Click "Unified Scanner" in sidebar');
    console.log('   3. Enter a domain (e.g., www.netpnb.com)');
    console.log('   4. Run TLS, Security, or Combined scan\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
