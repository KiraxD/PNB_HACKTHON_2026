-- ============================================================
-- QSecure Radar Seed Data — Realistic PNB Banking Data
-- Run in Supabase SQL Editor for project shinmrlkbaggbwpzhlcl
-- ============================================================

-- Assets (10 real PNB internet-facing assets)
INSERT INTO public.assets (name, url, ipv4, type, owner, risk, cert_status, key_length, last_scan) VALUES
('PNB Internet Banking Portal',   'https://www.netpnb.com',           '203.197.164.42',  'Web App',  'Retail Banking',     'High',     'Valid',    2048, now() - interval '2 hours'),
('PNB Corporate Banking',         'https://www.pnbnet.net.in',        '203.197.164.45',  'Web App',  'Corporate Banking',  'Critical', 'Expiring', 1024, now() - interval '4 hours'),
('PNB Mobile API Gateway',        'https://api.pnb.co.in',            '103.39.84.12',    'API',      'Mobile Team',        'High',     'Valid',    2048, now() - interval '1 hour'),
('PNB UPI Payment Service',       'https://upi.pnb.co.in',            '103.39.84.15',    'API',      'Payments',           'Medium',   'Valid',    4096, now() - interval '3 hours'),
('PNB Customer Portal',           'https://customer.pnb.co.in',       '203.197.164.50',  'Web App',  'Retail Division',    'Medium',   'Valid',    2048, now() - interval '6 hours'),
('PNB FASTag Portal',             'https://fastag.pnbindia.in',        '103.39.84.20',    'Web App',  'Transport Division', 'Low',      'Valid',    4096, now() - interval '8 hours'),
('PNB HRMS System',               'https://hrms.pnb.co.in',           '10.10.5.22',      'Internal', 'HR Division',        'Critical', 'Expired',  1024, now() - interval '12 hours'),
('PNB Swift Gateway',             'https://swift.pnb.co.in',          '203.197.164.60',  'Service',  'Treasury',           'Critical', 'Valid',    2048, now() - interval '2 hours'),
('PNB Core Banking (CBS)',         'https://cbs.pnb.co.in',            '10.10.1.5',       'Internal', 'IT Division',        'High',     'Valid',    2048, now() - interval '1 day'),
('PNB e-Locker Portal',           'https://elocker.pnb.co.in',        '203.197.164.55',  'Web App',  'Digital Banking',    'Low',      'Valid',    4096, now() - interval '5 hours')
ON CONFLICT DO NOTHING;

-- Domains
INSERT INTO public.domains (domain, registered, registrar, company) VALUES
('netpnb.com',          '1998-04-15', 'GoDaddy',       'Punjab National Bank'),
('pnbnet.net.in',       '2001-06-20', 'NIXI',          'Punjab National Bank'),
('pnb.co.in',           '1996-11-08', 'NIXI',          'Punjab National Bank'),
('pnbindia.in',         '2010-03-12', 'NIC India',     'Punjab National Bank'),
('pnbmetlife.co.in',    '2008-07-30', 'MarkMonitor',   'PNB MetLife'),
('pnbhousing.com',      '2012-09-05', 'GoDaddy',       'PNB Housing Finance'),
('pnbgilts.com',        '2005-01-18', 'NIXI',          'PNB Gilts Ltd'),
('pnbcards.in',         '2015-04-22', 'NIC India',     'Punjab National Bank'),
('pnbrewards.in',       '2018-08-14', 'MarkMonitor',   'Punjab National Bank'),
('pnbmf.in',            '2019-02-10', 'NIXI',          'PNB Mutual Fund')
ON CONFLICT DO NOTHING;

-- SSL Certificates
INSERT INTO public.ssl_certs (fingerprint, valid_from, common_name, company, ca) VALUES
('AA:BB:CC:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11', '2024-01-15', 'netpnb.com',          'Punjab National Bank', 'DigiCert Inc'),
('BB:CC:DD:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22', '2023-06-01', 'pnbnet.net.in',       'Punjab National Bank', 'GlobalSign'),
('CC:DD:EE:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33', '2024-03-10', 'api.pnb.co.in',       'Punjab National Bank', 'Let''s Encrypt'),
('DD:EE:FF:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44', '2024-05-20', 'upi.pnb.co.in',       'Punjab National Bank', 'Sectigo'),
('EE:FF:00:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55', '2023-11-08', 'customer.pnb.co.in',  'Punjab National Bank', 'DigiCert Inc'),
('FF:00:11:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66', '2024-02-14', 'fastag.pnbindia.in',  'Punjab National Bank', 'Entrust'),
('00:11:22:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77', '2022-04-01', 'hrms.pnb.co.in',      'Punjab National Bank', 'DigiCert Inc'),
('11:22:33:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88', '2024-04-30', 'swift.pnb.co.in',     'Punjab National Bank', 'GlobalSign'),
('22:33:44:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99', '2024-01-01', 'cbs.pnb.co.in',       'Punjab National Bank', 'DigiCert Inc'),
('33:44:55:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA', '2024-06-01', 'elocker.pnb.co.in',   'Punjab National Bank', 'Sectigo')
ON CONFLICT DO NOTHING;

-- IP Subnets
INSERT INTO public.ip_subnets (ip, ports, subnet, asn, netname, location) VALUES
('203.197.164.42',  '443,80,22',   '203.197.164.0/24', 'AS9829',  'NIC-INDIA',   'New Delhi, IN'),
('203.197.164.45',  '443,8443',    '203.197.164.0/24', 'AS9829',  'NIC-INDIA',   'New Delhi, IN'),
('103.39.84.12',    '443,3000',    '103.39.84.0/24',   'AS45271', 'CDAC-INDIA',  'Mumbai, IN'),
('103.39.84.15',    '443,8080',    '103.39.84.0/24',   'AS45271', 'CDAC-INDIA',  'Mumbai, IN'),
('203.197.164.50',  '443,80',      '203.197.164.0/24', 'AS9829',  'NIC-INDIA',   'New Delhi, IN'),
('103.39.84.20',    '443',         '103.39.84.0/24',   'AS45271', 'CDAC-INDIA',  'Hyderabad, IN'),
('10.10.5.22',      '8080,8443',   '10.10.5.0/24',     'private', 'PNB-INTERNAL','New Delhi, IN'),
('203.197.164.60',  '443,9443',    '203.197.164.0/24', 'AS9829',  'NIC-INDIA',   'New Delhi, IN'),
('10.10.1.5',       '1433,8080',   '10.10.1.0/24',     'private', 'PNB-CBS',     'New Delhi, IN'),
('203.197.164.55',  '443,80',      '203.197.164.0/24', 'AS9829',  'NIC-INDIA',   'Chennai, IN')
ON CONFLICT DO NOTHING;

-- Software
INSERT INTO public.software (product, version, type, port, host) VALUES
('Apache Tomcat',     '9.0.65',  'Web Server',    8080, 'netpnb.com'),
('nginx',             '1.22.1',  'Reverse Proxy', 80,   'pnb.co.in'),
('Oracle WebLogic',   '14.1.1',  'App Server',    7001, 'pnbnet.net.in'),
('OpenSSL',           '1.1.1t',  'TLS Library',   443,  'api.pnb.co.in'),
('IBM MQ',            '9.3.0',   'Messaging',     1414, 'swift.pnb.co.in'),
('Oracle DB',         '19.3',    'Database',      1521, 'cbs.pnb.co.in'),
('Spring Boot',       '2.7.12',  'Framework',     8443, 'upi.pnb.co.in'),
('Node.js',           '18.17.0', 'Runtime',       3000, 'api.pnb.co.in'),
('Kubernetes',        '1.27.4',  'Orchestration', 6443, 'k8s.pnb.co.in'),
('Redis',             '7.0.12',  'Cache',         6379, 'api.pnb.co.in')
ON CONFLICT DO NOTHING;

-- PQC Scores (0-100 per SRS FR9)
INSERT INTO public.pqc_scores (asset_name, score, status, pqc_support) VALUES
('PNB Internet Banking Portal',  42, 'Legacy',    false),
('PNB Corporate Banking',        18, 'Critical',  false),
('PNB Mobile API Gateway',       65, 'Standard',  false),
('PNB UPI Payment Service',      81, 'Elite-PQC', true),
('PNB Customer Portal',          55, 'Standard',  false),
('PNB FASTag Portal',            88, 'Elite-PQC', true),
('PNB HRMS System',              12, 'Critical',  false),
('PNB Swift Gateway',            38, 'Legacy',    false),
('PNB Core Banking (CBS)',        25, 'Critical',  false),
('PNB e-Locker Portal',          79, 'Elite-PQC', true)
ON CONFLICT DO NOTHING;

-- Cyber Rating
INSERT INTO public.cyber_rating (enterprise_score, grade) VALUES
(42, 'Tier 3 - Satisfactory')
ON CONFLICT DO NOTHING;

-- CBOM entries (using asset IDs from assets)
INSERT INTO public.cbom (app, key_length, cipher, ca, tls_version)
SELECT a.name, 
  CASE WHEN a.key_length = 1024 THEN 'RSA-1024' WHEN a.key_length = 4096 THEN 'RSA-4096' ELSE 'RSA-2048' END,
  CASE WHEN a.risk = 'Critical' THEN 'TLS_RSA_WITH_RC4_128_SHA (WEAK)' 
       WHEN a.risk = 'High' THEN 'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256'
       ELSE 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384' 
  END,
  'DigiCert Inc',
  CASE WHEN a.risk = 'Critical' THEN '1.0' WHEN a.risk = 'High' THEN '1.2' ELSE '1.3' END
FROM public.assets a
ON CONFLICT DO NOTHING;

-- Audit Log (recent events)
INSERT INTO public.audit_log (action, target, ip_addr, icon) VALUES
('SCAN_COMPLETED',      'All PNB Assets',              '203.197.164.42', '🔍'),
('CERT_EXPIRY_ALERT',   'pnbnet.net.in (45 days)',     '203.197.164.45', '⚠️'),
('USER_LOGIN',          'hackathon@pnb.bank.in',       '192.168.1.10',   '🔐'),
('CBOM_GENERATED',      'PNB Internet Banking Portal', '203.197.164.42', '📋'),
('PQC_ASSESSMENT',      'PNB Corporate Banking',       '203.197.164.45', '⚛️'),
('WEAK_KEY_DETECTED',   'hrms.pnb.co.in (RSA-1024)',   '10.10.5.22',     '🔴'),
('REPORT_GENERATED',    'Executive Risk Report Q1',    '192.168.1.10',   '📊'),
('TLS_SCAN',            'swift.pnb.co.in',             '203.197.164.60', '🔒'),
('POLICY_VIOLATION',    'Old TLS 1.0 on CBS',          '10.10.1.5',      '🚨'),
('MFA_VERIFIED',        'admin@pnb.bank.in',           '192.168.1.15',   '✅')
ON CONFLICT DO NOTHING;
