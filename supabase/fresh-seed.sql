-- ============================================================
-- QSecure Radar — Fresh Seed Data
-- PSB Hackathon 2026 | Populates with fresh sample data
-- ============================================================

-- Sample Assets (Asset Inventory)
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

-- Sample Domains
INSERT INTO public.domains (domain, registered, registrar, company)
VALUES
  ('netpnb.com', '2010-05-15', 'NCCS', 'Punjab National Bank'),
  ('pnb.co.in', '2008-03-20', 'NCCS', 'Punjab National Bank'),
  ('mobile-api.pnb.co.in', '2015-07-10', 'NCCS', 'Punjab National Bank'),
  ('internal.pnb', '2012-11-01', 'Internal', 'Punjab National Bank');

-- Sample SSL Certificates
INSERT INTO public.ssl_certs (fingerprint, valid_from, common_name, company, ca)
VALUES
  ('SHA256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p', '2024-01-15'::DATE, 'www.netpnb.com', 'Punjab National Bank', 'Let''s Encrypt Authority X3'),
  ('SHA256:2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p1q', '2023-06-20'::DATE, 'api.pnb.co.in', 'Punjab National Bank', 'DigiCert Global Root CA'),
  ('SHA256:3c4d5e6f7g8h9i0j1k2l3m4n5o6p1q2r', '2022-12-01'::DATE, 'pay.netpnb.com', 'Punjab National Bank', 'Sectigo RSA Domain Validation Secure Server CA'),
  ('SHA256:4d5e6f7g8h9i0j1k2l3m4n5o6p1q2r3s', '2021-03-10'::DATE, 'admin.netpnb.com', 'Punjab National Bank', 'self-signed');

-- Sample IP Subnets
INSERT INTO public.ip_subnets (ip, ports, subnet, asn, netname, location)
VALUES
  ('1.2.3.0/24', '80,443,8080,8443', '1.2.3.0/24', 'AS55836', 'PNB-MAIN', 'New Delhi, India'),
  ('192.168.1.0/24', '22,80,443,3306,5432', '192.168.1.0/24', 'AS55836', 'PNB-INTERNAL', 'New Delhi, India'),
  ('10.0.0.0/16', '22,3389', '10.0.0.0/16', 'AS55836', 'PNB-DATACENTER', 'Bangalore, India');

-- Sample Software
INSERT INTO public.software (asset_id, software_name, version, vendor, vulnerability_count)
SELECT id, 'Nginx', '1.24.0', 'NGINX Inc', 2 FROM public.assets WHERE name = 'PNB Main Portal'
UNION ALL
SELECT id, 'OpenSSL', '3.0.8', 'OpenSSL Foundation', 1 FROM public.assets WHERE name = 'Core Banking API'
UNION ALL
SELECT id, 'Apache HTTP Server', '2.4.57', 'Apache Software Foundation', 3 FROM public.assets WHERE name = 'Payment Gateway'
UNION ALL
SELECT id, 'Node.js', '18.19.0', 'OpenJS Foundation', 0 FROM public.assets WHERE name = 'Mobile App API';

-- Sample PQC Scores
INSERT INTO public.pqc_scores (asset_id, score_0_25, score_25_50, score_50_75, score_75_90, score_90_100, pqc_ready_count, total_assets)
SELECT id, 0, 1, 2, 3, 2, 7, 8 FROM public.assets WHERE name = 'PNB Main Portal'
UNION ALL
SELECT id, 0, 0, 1, 2, 5, 8, 8 FROM public.assets WHERE name = 'Core Banking API';

-- Sample Cyber Ratings
INSERT INTO public.cyber_rating (asset_id, overall_rating, tls_score, crypto_score, vulnerability_score, compliance_score, last_assessment)
SELECT id, 85, 90, 88, 80, 82, now() FROM public.assets WHERE name = 'PNB Main Portal'
UNION ALL
SELECT id, 88, 92, 90, 85, 87, now() FROM public.assets WHERE name = 'Core Banking API'
UNION ALL
SELECT id, 72, 75, 70, 72, 70, now() FROM public.assets WHERE name = 'Payment Gateway'
UNION ALL
SELECT id, 65, 68, 62, 65, 60, now() FROM public.assets WHERE name = 'Mobile App API'
UNION ALL
SELECT id, 58, 60, 55, 58, 50, now() FROM public.assets WHERE name = 'Customer Portal'
UNION ALL
SELECT id, 42, 45, 40, 42, 35, now() FROM public.assets WHERE name = 'Admin Dashboard';

-- Sample CBOM Vulnerabilities
INSERT INTO public.cbom (asset_id, component_name, component_version, cpe, cve_list, severity, remediation_status)
SELECT id, 'Nginx SSL Module', '1.24.0', 'cpe:2.3:a:nginx:nginx:1.24.0:*:*:*:*:*:*:*', '["CVE-2023-44487","CVE-2023-42119"]', 'High', 'Pending' FROM public.assets WHERE name = 'PNB Main Portal'
UNION ALL
SELECT id, 'OpenSSL Crypto Library', '3.0.8', 'cpe:2.3:a:openssl:openssl:3.0.8:*:*:*:*:*:*:*', '["CVE-2023-5678"]', 'Medium', 'Patched' FROM public.assets WHERE name = 'Core Banking API'
UNION ALL
SELECT id, 'Apache HTTP Server', '2.4.57', 'cpe:2.3:a:apache:http_server:2.4.57:*:*:*:*:*:*:*', '["CVE-2023-9999","CVE-2023-8888","CVE-2023-7777"]', 'High', 'Pending' FROM public.assets WHERE name = 'Payment Gateway';

-- Sample Scan History
INSERT INTO public.scan_history (scan_type, target, target_type, scan_status, risk_level, vulnerabilities_found, scan_date, report_url)
VALUES
  ('TLS Scanner', 'www.netpnb.com', 'domain', 'completed', 'Low', 2, now() - INTERVAL '2 days', '/reports/tls-netpnb-2026-04-07.pdf'),
  ('Security Scanner', 'api.pnb.co.in', 'domain', 'completed', 'Medium', 5, now() - INTERVAL '1 days', '/reports/security-api-2026-04-08.pdf'),
  ('Asset Discovery', 'pnb.co.in', 'domain', 'in_progress', 'Unknown', 0, now() - INTERVAL '4 hours', NULL),
  ('TLS Scanner', 'pay.netpnb.com', 'domain', 'completed', 'Medium', 8, now() - INTERVAL '6 hours', '/reports/tls-pay-2026-04-08.pdf'),
  ('Security Scanner', 'customer.netpnb.com', 'domain', 'failed', 'High', 0, now() - INTERVAL '12 hours', NULL),
  ('CBOM Analysis', 'www.netpnb.com', 'domain', 'completed', 'High', 3, now() - INTERVAL '15 hours', '/reports/cbom-netpnb-2026-04-08.pdf');

-- Verification: Count records in each table
SELECT 'SEED DATA LOADED' as status, COUNT(*) as total_records FROM (
  SELECT COUNT(*) FROM public.assets
  UNION ALL SELECT COUNT(*) FROM public.domains
  UNION ALL SELECT COUNT(*) FROM public.ssl_certs
  UNION ALL SELECT COUNT(*) FROM public.ip_subnets
  UNION ALL SELECT COUNT(*) FROM public.software
  UNION ALL SELECT COUNT(*) FROM public.pqc_scores
  UNION ALL SELECT COUNT(*) FROM public.cyber_rating
  UNION ALL SELECT COUNT(*) FROM public.cbom
  UNION ALL SELECT COUNT(*) FROM public.scan_history
) as counts;

-- Show loaded data summary
SELECT 'Assets' as entity, COUNT(*) as count FROM public.assets
UNION ALL SELECT 'Domains', COUNT(*) FROM public.domains
UNION ALL SELECT 'SSL Certs', COUNT(*) FROM public.ssl_certs
UNION ALL SELECT 'IP Subnets', COUNT(*) FROM public.ip_subnets
UNION ALL SELECT 'Software', COUNT(*) FROM public.software
UNION ALL SELECT 'PQC Scores', COUNT(*) FROM public.pqc_scores
UNION ALL SELECT 'Cyber Ratings', COUNT(*) FROM public.cyber_rating
UNION ALL SELECT 'CBOM Records', COUNT(*) FROM public.cbom
UNION ALL SELECT 'Scan History', COUNT(*) FROM public.scan_history;
