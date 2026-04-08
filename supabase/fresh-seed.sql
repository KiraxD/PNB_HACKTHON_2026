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
INSERT INTO public.software (product, version, type, port, host, company)
VALUES
  ('Nginx', '1.24.0', 'Web Server', 443, 'www.netpnb.com', 'NGINX Inc'),
  ('OpenSSL', '3.0.8', 'Crypto Library', 443, 'api.pnb.co.in', 'OpenSSL Foundation'),
  ('Apache HTTP Server', '2.4.57', 'Web Server', 443, 'pay.netpnb.com', 'Apache Software Foundation'),
  ('Node.js', '18.19.0', 'Runtime', 8080, 'mobile-api.pnb.co.in', 'OpenJS Foundation');

-- Sample PQC Scores
INSERT INTO public.pqc_scores (asset_id, asset_name, score, status, pqc_support)
SELECT id, name, 85, 'Compliant', true FROM public.assets WHERE name = 'PNB Main Portal'
UNION ALL
SELECT id, name, 88, 'Compliant', true FROM public.assets WHERE name = 'Core Banking API'
UNION ALL
SELECT id, name, 72, 'Partial', false FROM public.assets WHERE name = 'Payment Gateway'
UNION ALL
SELECT id, name, 65, 'Partial', false FROM public.assets WHERE name = 'Mobile App API'
UNION ALL
SELECT id, name, 58, 'Non-Compliant', false FROM public.assets WHERE name = 'Customer Portal'
UNION ALL
SELECT id, name, 42, 'Non-Compliant', false FROM public.assets WHERE name = 'Admin Dashboard';

-- Sample Cyber Ratings
INSERT INTO public.cyber_rating (enterprise_score, max_score, grade)
VALUES
  (85, 100, 'A'),
  (88, 100, 'A'),
  (72, 100, 'B'),
  (65, 100, 'B'),
  (58, 100, 'C'),
  (42, 100, 'D');

-- Sample CBOM (Cryptographic BOM)
INSERT INTO public.cbom (asset_id, app, key_length, cipher, ca, tls_version)
SELECT id, 'Nginx SSL Module', '2048', 'AES-256-GCM', 'Let''s Encrypt', 'TLSv1.3' FROM public.assets WHERE name = 'PNB Main Portal'
UNION ALL
SELECT id, 'OpenSSL Crypto', '2048', 'AES-256-GCM', 'DigiCert', 'TLSv1.3' FROM public.assets WHERE name = 'Core Banking API'
UNION ALL
SELECT id, 'Apache SSL Module', '2048', 'AES-128-GCM', 'Sectigo', 'TLSv1.2' FROM public.assets WHERE name = 'Payment Gateway';

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
) as counts;

-- Show loaded data summary
SELECT 'Assets' as entity, COUNT(*) as count FROM public.assets
UNION ALL SELECT 'Domains', COUNT(*) FROM public.domains
UNION ALL SELECT 'SSL Certs', COUNT(*) FROM public.ssl_certs
UNION ALL SELECT 'IP Subnets', COUNT(*) FROM public.ip_subnets
UNION ALL SELECT 'Software', COUNT(*) FROM public.software
UNION ALL SELECT 'PQC Scores', COUNT(*) FROM public.pqc_scores
UNION ALL SELECT 'Cyber Ratings', COUNT(*) FROM public.cyber_rating
UNION ALL SELECT 'CBOM Records', COUNT(*) FROM public.cbom;
