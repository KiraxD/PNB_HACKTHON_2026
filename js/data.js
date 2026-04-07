/* data.js - QSecure Radar runtime defaults
   Intentionally contains no demo/sample records.
   Live data is expected from Supabase-backed services. */

window.QSR = window.QSR || {};

QSR.summary = {
  assetCount: 0,
  avgRiskScore: 0,
  cbomVulns: 0,
  pqcReady: 0,
  expiringCerts: 0,
  criticalCount: 0
};

QSR.recentScans = [];
QSR.assets = [];
QSR.domains = [];
QSR.ssls = [];
QSR.ipSubnets = [];
QSR.software = [];
QSR.nameservers = [];
QSR.cryptoOverview = [];

QSR.cbom = {
  totalApps: 0,
  sitesSurveyed: 0,
  activeCerts: 0,
  weakCrypto: 0,
  certIssues: 0,
  perApp: [],
  keyLengths: [],
  cipherUsage: [],
  certAuthorities: [],
  encryptionProtocols: []
};

QSR.pqcPosture = {
  elitePct: 0,
  standardPct: 0,
  legacyPct: 0,
  criticalPct: 0,
  criticalApps: 0,
  assets: []
};

QSR.cyberRating = {
  enterpriseScore: 0,
  maxScore: 100,
  grade: 'Unassessed',
  tiers: []
};
