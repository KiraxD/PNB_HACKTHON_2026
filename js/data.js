/* data.js - QSecure Radar Mock Data | PSB Hackathon 2026 | SRS FR1-FR15 */
window.QSR = window.QSR || {};

/* Summary (FR9: QR Score 0-100) */
QSR.summary = {
  assetCount:    128,
  avgRiskScore:  38,
  cbomVulns:     8248,
  pqcReady:      24,
  expiringCerts: 9,
  criticalCount: 14
};

/* Recent audit events (FR15) */
QSR.recentScans = [
  { msg:'SCAN_COMPLETED: netbanking.pnb.co.in - 4 findings', time:'2 min ago',  icon:'ok'    },
  { msg:'VULN_DETECTED: RSA-1024 on api.pnb.co.in',         time:'5 min ago',  icon:'alert' },
  { msg:'CERT_EXPIRY: vpn.pnb.co.in expires in 5 days',     time:'12 min ago', icon:'warn'  },
  { msg:'CBOM_GENERATED: 7 assets processed',               time:'18 min ago', icon:'ok'    },
  { msg:'REPORT_GENERATED: Executive report sent to CISO',  time:'25 min ago', icon:'ok'    },
  { msg:'PQC_SCORE_COMPUTED: 10 assets ranked (0-100)',      time:'40 min ago', icon:'ok'    },
  { msg:'LOGIN_FAILED: unknown@external.com (blocked)',      time:'1 hr ago',   icon:'alert' },
  { msg:'ZERO_TRUST_VALIDATED: SOC scan request approved',  time:'2 hr ago',   icon:'ok'    }
];

/* Assets (FR4, FR6, FR7) */
QSR.assets = [
  { name:'PNB Internet Banking Portal',    url:'https://netbanking.pnb.co.in', ipv4:'103.41.66.20', type:'Web App',       owner:'Digital Banking',  risk:'High',     cert:'Valid',    key:2048, qrScore:38, lastScan:'22/03/2026' },
  { name:'PNB Mobile API Gateway',         url:'https://api.pnb.co.in',         ipv4:'103.41.66.21', type:'API Gateway',   owner:'IT Infra',         risk:'Critical',  cert:'Valid',    key:1024, qrScore:12, lastScan:'22/03/2026' },
  { name:'PNB Corporate Website',          url:'https://www.pnb.co.in',          ipv4:'103.41.66.22', type:'Web App',       owner:'Marketing',        risk:'Medium',    cert:'Valid',    key:4096, qrScore:72, lastScan:'21/03/2026' },
  { name:'PNB VPN Gateway',                url:'https://vpn.pnb.co.in',          ipv4:'34.55.90.21',  type:'VPN Service',   owner:'Network Ops',      risk:'Critical',  cert:'Expired',  key:1024, qrScore:8,  lastScan:'20/03/2026' },
  { name:'PNB Payment Gateway',            url:'https://payments.pnb.co.in',     ipv4:'103.41.66.30', type:'API Gateway',   owner:'Cards & Payment',  risk:'High',      cert:'Expiring', key:2048, qrScore:45, lastScan:'22/03/2026' },
  { name:'PNB Auth Service (SSO)',         url:'https://auth.pnb.co.in',          ipv4:'103.41.66.35', type:'Auth Service',  owner:'IAM Team',         risk:'High',      cert:'Valid',    key:2048, qrScore:51, lastScan:'22/03/2026' },
  { name:'PNB Trade Finance Portal',       url:'https://trade.pnb.co.in',         ipv4:'103.41.66.40', type:'Web App',       owner:'Trade Finance',    risk:'Medium',    cert:'Valid',    key:4096, qrScore:81, lastScan:'21/03/2026' },
  { name:'PNB Loan Management System',    url:'https://loans.pnb.co.in',         ipv4:'103.41.66.45', type:'Web App',       owner:'Retail Banking',   risk:'Low',       cert:'Valid',    key:4096, qrScore:65, lastScan:'21/03/2026' },
  { name:'PNB Customer Service Portal',   url:'https://support.pnb.co.in',       ipv4:'103.41.66.50', type:'Web App',       owner:'CRM Team',         risk:'Low',       cert:'Valid',    key:2048, qrScore:90, lastScan:'20/03/2026' },
  { name:'PNB HR Internal Portal',        url:'https://hr.pnb.internal',         ipv4:'192.168.1.10', type:'Internal App',  owner:'HR Dept',          risk:'Low',       cert:'Valid',    key:2048, qrScore:95, lastScan:'20/03/2026' }
];

/* Domains (FR4) */
QSR.domains = [
  { domain:'pnb.co.in',           detected:'01 Mar 2026', registered:'2000-03-15', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'netbanking.pnb.co.in',detected:'01 Mar 2026', registered:'2005-07-21', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'api.pnb.co.in',       detected:'05 Mar 2026', registered:'2015-01-10', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'vpn.pnb.co.in',       detected:'05 Mar 2026', registered:'2012-11-05', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'payments.pnb.co.in',  detected:'08 Mar 2026', registered:'2018-04-20', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'auth.pnb.co.in',      detected:'10 Mar 2026', registered:'2019-09-12', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'trade.pnb.co.in',     detected:'12 Mar 2026', registered:'2010-06-30', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'loans.pnb.co.in',     detected:'14 Mar 2026', registered:'2016-02-18', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'support.pnb.co.in',   detected:'15 Mar 2026', registered:'2017-08-22', registrar:'NIXI', company:'Punjab National Bank' },
  { domain:'mail.pnb.co.in',      detected:'18 Mar 2026', registered:'2003-05-10', registrar:'NIXI', company:'Punjab National Bank' }
];

/* SSL Certs (FR7) */
QSR.ssls = [
  { fingerprint:'A3:2F:1C:9B:44:7E:D2:80', detected:'01 Mar 2026', validFrom:'2024-01-01', commonName:'*.pnb.co.in',        company:'PNB', ca:'DigiCert'      },
  { fingerprint:'B1:4E:2A:8C:55:9F:C3:71', detected:'05 Mar 2026', validFrom:'2024-03-15', commonName:'api.pnb.co.in',       company:'PNB', ca:"Let's Encrypt" },
  { fingerprint:'C2:5F:3B:9D:66:AG:D4:82', detected:'08 Mar 2026', validFrom:'2023-06-01', commonName:'vpn.pnb.co.in',       company:'PNB', ca:'COMODO'        },
  { fingerprint:'D3:6G:4C:AE:77:BH:E5:93', detected:'10 Mar 2026', validFrom:'2024-06-01', commonName:'payments.pnb.co.in',  company:'PNB', ca:'GlobalSign'    },
  { fingerprint:'E4:7H:5D:BF:88:CI:F6:04', detected:'12 Mar 2026', validFrom:'2024-08-15', commonName:'auth.pnb.co.in',      company:'PNB', ca:'DigiCert'      }
];

/* IP Subnets (FR5) */
QSR.ipSubnets = [
  { ip:'103.41.66.20', ports:'443,80',   subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',     location:'New Delhi, IN', company:'PNB',      detected:'01 Mar 2026' },
  { ip:'103.41.66.21', ports:'443,8443', subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',     location:'New Delhi, IN', company:'PNB',      detected:'05 Mar 2026' },
  { ip:'34.55.90.21',  ports:'1194,443', subnet:'34.55.90.0/24',  asn:'AS15169', netname:'GOOGLE-GCP', location:'Mumbai, IN',    company:'GCP (PNB)',detected:'08 Mar 2026' },
  { ip:'103.41.66.30', ports:'443',      subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',     location:'New Delhi, IN', company:'PNB',      detected:'10 Mar 2026' },
  { ip:'103.41.66.35', ports:'443,8080', subnet:'103.41.66.0/24', asn:'AS45916', netname:'PNBNET',     location:'New Delhi, IN', company:'PNB',      detected:'12 Mar 2026' }
];

/* Software (FR4) */
QSR.software = [
  { product:'nginx',         version:'1.22.1', type:'Web Server',    port:443,  host:'netbanking.pnb.co.in', company:'PNB', detected:'01 Mar 2026' },
  { product:'OpenSSL',       version:'1.1.1t', type:'Crypto Library',port:443,  host:'api.pnb.co.in',        company:'PNB', detected:'05 Mar 2026' },
  { product:'Apache Tomcat', version:'9.0.74', type:'App Server',    port:8080, host:'payments.pnb.co.in',   company:'PNB', detected:'08 Mar 2026' },
  { product:'OpenVPN',       version:'2.5.8',  type:'VPN',           port:1194, host:'vpn.pnb.co.in',        company:'PNB', detected:'10 Mar 2026' },
  { product:'Keycloak',      version:'21.0.1', type:'IAM',           port:8443, host:'auth.pnb.co.in',       company:'PNB', detected:'12 Mar 2026' }
];

/* Nameservers (FR5) */
QSR.nameservers = [
  { hostname:'ns1.pnb.co.in',  type:'NS',  ip:'103.41.66.1',  ipv6:'2401:4900::1', ttl:'86400' },
  { hostname:'ns2.pnb.co.in',  type:'NS',  ip:'103.41.66.2',  ipv6:'2401:4900::2', ttl:'86400' },
  { hostname:'pnb.co.in',      type:'A',   ip:'103.41.66.20', ipv6:'—',             ttl:'3600'  },
  { hostname:'mail.pnb.co.in', type:'MX',  ip:'103.41.66.60', ipv6:'—',             ttl:'3600'  }
];

/* Crypto Overview (FR6) */
QSR.cryptoOverview = [
  { asset:'netbanking.pnb.co.in', keyLen:'2048-bit', cipher:'TLS_ECDHE_RSA_AES_256_GCM_SHA384', tls:'1.3', ca:'DigiCert',      ago:'2 min ago' },
  { asset:'api.pnb.co.in',        keyLen:'1024-bit', cipher:'TLS_RSA_AES_128_CBC_SHA',           tls:'1.0', ca:"Let's Encrypt", ago:'5 min ago' },
  { asset:'www.pnb.co.in',        keyLen:'4096-bit', cipher:'TLS_ECDHE_RSA_CHACHA20_POLY1305',   tls:'1.3', ca:'GlobalSign',    ago:'10 min ago'},
  { asset:'vpn.pnb.co.in',        keyLen:'1024-bit', cipher:'TLS_DHE_RSA_AES_256_CBC_SHA256',    tls:'1.2', ca:'COMODO',        ago:'15 min ago'},
  { asset:'payments.pnb.co.in',   keyLen:'2048-bit', cipher:'TLS_ECDHE_RSA_AES_128_GCM_SHA256',  tls:'1.3', ca:'DigiCert',      ago:'20 min ago'}
];

/* CBOM (FR8) */
QSR.cbom = {
  totalApps:     42,
  sitesSurveyed: 212450,
  activeCerts:   89,
  weakCrypto:    23,
  certIssues:    9,
  perApp: [
    { app:'netbanking.pnb.co.in', keyLength:'2048-bit', cipher:'TLS_ECDHE_RSA_AES_256_GCM_SHA384', ca:'DigiCert',      tls:'1.3' },
    { app:'api.pnb.co.in',        keyLength:'1024-bit', cipher:'TLS_RSA_AES_128_CBC_SHA',           ca:"Let's Encrypt", tls:'1.0' },
    { app:'www.pnb.co.in',        keyLength:'4096-bit', cipher:'TLS_ECDHE_RSA_CHACHA20_POLY1305',   ca:'GlobalSign',    tls:'1.3' },
    { app:'vpn.pnb.co.in',        keyLength:'1024-bit', cipher:'TLS_DHE_RSA_AES_256_CBC_SHA256',    ca:'COMODO',        tls:'1.2' },
    { app:'payments.pnb.co.in',   keyLength:'2048-bit', cipher:'TLS_ECDHE_RSA_AES_128_GCM_SHA256',  ca:'DigiCert',      tls:'1.3' }
  ],
  keyLengths: [
    { label:'1024-bit (WEAK)',  value:2, color:'#e53e3e' },
    { label:'2048-bit',         value:3, color:'#ed8936' },
    { label:'4096-bit (STRONG)',value:2, color:'#48bb78' }
  ],
  cipherUsage: [
    { cipher:'AES-256-GCM', count:18 },{ cipher:'AES-128-GCM', count:12 },
    { cipher:'ChaCha20',    count:6  },{ cipher:'AES-128-CBC',  count:4  },
    { cipher:'RC4 (WEAK)',  count:2  }
  ],
  certAuthorities: [
    { name:'DigiCert',      count:28, color:'#4299e1' },
    { name:"Let's Encrypt",  count:18, color:'#48bb78' },
    { name:'GlobalSign',    count:12, color:'#ed8936' },
    { name:'COMODO',        count:8,  color:'#e53e3e'  }
  ],
  encriptionProtocols: [
    { label:'TLS 1.3', value:50, color:'#48bb78' },
    { label:'TLS 1.2', value:30, color:'#4299e1' },
    { label:'TLS 1.1', value:12, color:'#ed8936' },
    { label:'TLS 1.0', value:8,  color:'#e53e3e' }
  ]
};

/* PQC Posture (FR9, FR10, FR11) - QR Score 0-100 */
QSR.pqcPosture = {
  elitePct: 20, standardPct: 35, legacyPct: 30, criticalPct: 15, criticalApps: 14,
  assets: [
    { name:'netbanking.pnb.co.in', score:38, status:'Critical',  pqcSupport:false },
    { name:'api.pnb.co.in',        score:12, status:'Critical',  pqcSupport:false },
    { name:'www.pnb.co.in',        score:72, status:'Standard',  pqcSupport:false },
    { name:'vpn.pnb.co.in',        score:8,  status:'Critical',  pqcSupport:false },
    { name:'payments.pnb.co.in',   score:45, status:'Legacy',    pqcSupport:false },
    { name:'auth.pnb.co.in',       score:51, status:'Legacy',    pqcSupport:false },
    { name:'trade.pnb.co.in',      score:81, status:'Standard',  pqcSupport:true  },
    { name:'loans.pnb.co.in',      score:65, status:'Standard',  pqcSupport:false },
    { name:'support.pnb.co.in',    score:90, status:'Elite-PQC', pqcSupport:true  },
    { name:'hr.pnb.internal',      score:95, status:'Elite-PQC', pqcSupport:true  }
  ]
};

/* Cyber Rating (FR10, FR14) - Enterprise score 0-100 */
QSR.cyberRating = {
  enterpriseScore: 42,
  maxScore: 100,
  grade: 'Tier 3 - Satisfactory',
  tiers: [
    { tier:'Tier 1 - Elite PQC',    range:'81-100', count:2,  color:'#48bb78', desc:'Fully quantum-safe, CRYSTALS-Kyber deployed' },
    { tier:'Tier 2 - Standard',     range:'51-80',  count:3,  color:'#4299e1', desc:'TLS 1.3, RSA-2048 min, no HNDL exposure'   },
    { tier:'Tier 3 - Satisfactory', range:'26-50',  count:3,  color:'#ecc94b', desc:'Mixed TLS, RSA-2048, minor issues'          },
    { tier:'Tier 4 - Critical',     range:'0-25',   count:2,  color:'#e53e3e', desc:'RSA-1024 or weak ciphers, immediate action' }
  ]
};
