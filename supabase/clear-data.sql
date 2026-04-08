-- ============================================================
-- QSecure Radar — Clear All Scan & Asset Data
-- PSB Hackathon 2026 | Run this in Supabase SQL Editor
-- This clears all scan results, asset inventory, and related data
-- ============================================================

-- Disable foreign key constraints temporarily
SET CONSTRAINTS ALL DEFERRED;

-- Clear scan and asset data (preserves schema)
TRUNCATE TABLE public.scan_history CASCADE;
TRUNCATE TABLE public.assets CASCADE;
TRUNCATE TABLE public.domains CASCADE;
TRUNCATE TABLE public.ssl_certs CASCADE;
TRUNCATE TABLE public.ip_subnets CASCADE;
TRUNCATE TABLE public.software CASCADE;
TRUNCATE TABLE public.nameservers CASCADE;
TRUNCATE TABLE public.crypto_overview CASCADE;
TRUNCATE TABLE public.cbom CASCADE;
TRUNCATE TABLE public.pqc_scores CASCADE;
TRUNCATE TABLE public.cyber_rating CASCADE;
TRUNCATE TABLE public.reports CASCADE;
TRUNCATE TABLE public.audit_log CASCADE;

-- Re-enable constraints
SET CONSTRAINTS ALL IMMEDIATE;

-- Verify all tables are empty
SELECT 'scan_history' as table_name, COUNT(*) as row_count FROM public.scan_history
UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets
UNION ALL
SELECT 'domains', COUNT(*) FROM public.domains
UNION ALL
SELECT 'ssl_certs', COUNT(*) FROM public.ssl_certs
UNION ALL
SELECT 'ip_subnets', COUNT(*) FROM public.ip_subnets
UNION ALL
SELECT 'software', COUNT(*) FROM public.software
UNION ALL
SELECT 'nameservers', COUNT(*) FROM public.nameservers
UNION ALL
SELECT 'crypto_overview', COUNT(*) FROM public.crypto_overview
UNION ALL
SELECT 'cbom', COUNT(*) FROM public.cbom
UNION ALL
SELECT 'pqc_scores', COUNT(*) FROM public.pqc_scores
UNION ALL
SELECT 'cyber_rating', COUNT(*) FROM public.cyber_rating
UNION ALL
SELECT 'reports', COUNT(*) FROM public.reports
UNION ALL
SELECT 'audit_log', COUNT(*) FROM public.audit_log;
