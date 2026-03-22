/* ============================================================
   data-layer.js — Live Supabase Data Fetching
   Replaces mock data.js when Supabase is configured.
   Falls back to QSR (data.js mock) if not connected.
   QSecure Radar | PSB Hackathon 2026
   ============================================================ */

window.QSR_DataLayer = (function() {

  /* ── Helper: check if DB is ready ─────────────────────────── */
  function db() { return window.QSR_DB; }
  function ready() { return !!db() && window.QSR_SUPABASE_READY; }

  /* ── In-memory cache (5-min TTL) ──────────────────────────── */
  var _cache = {};
  var CACHE_TTL = 5 * 60 * 1000;

  function getCached(key) {
    var entry = _cache[key];
    if (entry && (Date.now() - entry.ts) < CACHE_TTL) return entry.data;
    return null;
  }
  function setCache(key, data) { _cache[key] = { ts: Date.now(), data: data }; }
  function clearCache(table) {
    if (table) {
      Object.keys(_cache).forEach(function(k) { if (k.startsWith(table)) delete _cache[k]; });
    } else { _cache = {}; }
  }

  /* ── Generic query wrapper with cache + fallback ───────────── */
  async function query(table, fallbackKey, opts) {
    var cacheKey = table + JSON.stringify(opts || {});
    var cached = getCached(cacheKey);
    if (cached) { return cached; }

    if (!ready()) {
      var fb = fallbackKey ? (window.QSR[fallbackKey] || []) : [];
      return Array.isArray(fb) ? fb : [];
    }
    try {
      var q = db().from(table).select(opts?.select || '*');
      if (opts?.order)  q = q.order(opts.order, { ascending: opts.asc !== false });
      if (opts?.limit)  q = q.limit(opts.limit);
      if (opts?.filter) opts.filter.forEach(f => { q = q.eq(f.col, f.val); });
      var { data, error } = await q;
      if (error) throw error;
      var result = data || [];
      setCache(cacheKey, result);
      return result;
    } catch(e) {
      console.warn(`[DataLayer] Supabase error on "${table}":`, e.message, '→ using fallback');
      var fb = fallbackKey ? (window.QSR[fallbackKey] || []) : [];
      return Array.isArray(fb) ? fb : [];
    }
  }

  /* ── Assets (FR4, FR5, FR6, FR7) ──────────────────────────── */
  async function fetchAssets() {
    var raw = await query('assets', 'assets', { order: 'created_at', asc: false });
    return raw.map(a => ({
      name:     a.name,
      url:      a.url      || '#',
      ipv4:     a.ipv4     || '—',
      ipv6:     a.ipv6     || '—',
      type:     a.type     || 'Web App',
      owner:    a.owner    || 'IT Dept',
      risk:     a.risk     || 'Low',
      cert:     a.cert_status || 'Valid',
      key:      a.key_length || 2048,
      qrScore:  a.qr_score   || undefined,
      lastScan: a.last_scan ? new Date(a.last_scan).toLocaleString('en-IN') : 'Never'
    }));
  }

  /* ── Domains (FR4 — DNS enumeration) ──────────────────────── */
  async function fetchDomains() {
    var raw = await query('domains', 'domains', { order: 'detected', asc: false });
    return raw.map(d => ({
      domain:     d.domain,
      detected:   d.detected ? new Date(d.detected).toLocaleDateString('en-IN') : '—',
      registered: d.registered || '—',
      registrar:  d.registrar  || '—',
      company:    d.company    || 'Punjab National Bank'
    }));
  }

  /* ── SSL Certs (FR7) ───────────────────────────────────────── */
  async function fetchSSLs() {
    var raw = await query('ssl_certs', 'ssls', { order: 'detected', asc: false });
    return raw.map(s => ({
      fingerprint: s.fingerprint || '—',
      detected:    s.detected ? new Date(s.detected).toLocaleDateString('en-IN') : '—',
      validFrom:   s.valid_from  || '—',
      commonName:  s.common_name || '—',
      company:     s.company     || '—',
      ca:          s.ca          || '—'
    }));
  }

  /* ── IP Subnets (FR5) ──────────────────────────────────────── */
  async function fetchIPSubnets() {
    var raw = await query('ip_subnets', 'ipSubnets', { order: 'detected', asc: false });
    return raw.map(ip => ({
      ip:       ip.ip       || '—',
      ports:    ip.ports    || '—',
      subnet:   ip.subnet   || '—',
      asn:      ip.asn      || '—',
      netname:  ip.netname  || '—',
      location: ip.location || '—',
      company:  ip.company  || '—',
      detected: ip.detected ? new Date(ip.detected).toLocaleDateString('en-IN') : '—'
    }));
  }

  /* ── Software Inventory (FR4) ──────────────────────────────── */
  async function fetchSoftware() {
    var raw = await query('software', 'software', { order: 'detected', asc: false });
    return raw.map(sw => ({
      product:  sw.product  || '—',
      version:  sw.version  || '—',
      type:     sw.type     || '—',
      port:     sw.port     || '—',
      host:     sw.host     || '—',
      company:  sw.company  || '—',
      detected: sw.detected ? new Date(sw.detected).toLocaleDateString('en-IN') : '—'
    }));
  }

  /* ── Crypto Overview (FR5, FR6) ────────────────────────────── */
  async function fetchCryptoOverview() {
    var raw = await query('crypto_overview', 'cryptoOverview', {
      select: '*, assets(name)',
      order: 'scanned_at', asc: false
    });
    return raw.map(c => ({
      asset:  c.assets?.name || c.asset_id || '—',
      keyLen: c.key_len  || '—',
      cipher: c.cipher   || '—',
      tls:    c.tls      || '—',
      ca:     c.ca       || '—',
      ago:    c.scanned_at ? timeSince(c.scanned_at) : '—'
    }));
  }

  /* ── Nameservers (FR5) ─────────────────────────────────────── */
  async function fetchNameservers() {
    return await query('nameservers', 'nameservers');
  }

  /* ── CBOM (FR8) ────────────────────────────────────────────── */
  async function fetchCBOM() {
    /* If Supabase not connected, return mock data immediately */
    if (!ready()) return window.QSR.cbom;

    var raw = await query('cbom', null, { select: '*, assets(name)' });
    if (!raw || !raw.length) return window.QSR.cbom; /* empty DB → fallback */

    var perApp = raw.map(c => ({
      app:     c.app || c.assets?.name || '—',
      keyLen:  c.key_length  || '—',
      cipher:  c.cipher      || '—',
      ca:      c.ca          || '—',
      tls:     c.tls_version || '—'
    }));

    var weakCrypto = perApp.filter(p =>
      (p.keyLen + '').startsWith('RSA-1024') || p.tls === '1.0'
    ).length;

    return {
      totalApps:     perApp.length,
      sitesSurveyed: perApp.length,
      activeCerts:   perApp.length,
      weakCrypto,
      certIssues:    weakCrypto,
      perApp,
      keyLengths:          computeKeyLengths(perApp),
      cipherUsage:         computeCipherUsage(perApp),
      certAuthorities:     computeCAs(perApp),
      encryptionProtocols: window.QSR.cbom.encryptionProtocols || window.QSR.cbom.encriptionProtocols
    };
  }

  /* ── PQC Scores (FR9, FR10, FR11) ─────────────────────────── */
  async function fetchPQCScores() {
    if (!ready()) return window.QSR.pqcPosture;

    var raw = await query('pqc_scores', null, {
      select: '*, assets(name)',
      order: 'assessed_at', asc: false
    });
    if (!raw || !raw.length) return window.QSR.pqcPosture;

    var assets = raw.map(r => ({
      name:       r.asset_name || r.assets?.name || '—',
      score:      r.score       || 0,
      status:     r.status      || 'Legacy',
      pqcSupport: r.pqc_support || false
    }));

    var elite    = assets.filter(a => a.status.includes('Elite')).length;
    var standard = assets.filter(a => a.status === 'Standard').length;
    var legacy   = assets.filter(a => a.status === 'Legacy').length;
    var critical = assets.filter(a => a.status === 'Critical').length;
    var total    = assets.length || 1;

    return {
      ...window.QSR.pqcPosture,
      assets,
      elitePct:    Math.round(elite    / total * 100),
      standardPct: Math.round(standard / total * 100),
      legacyPct:   Math.round(legacy   / total * 100),
      criticalPct: Math.round(critical / total * 100),
      criticalApps: critical
    };
  }

  /* ── Cyber Rating (FR10, FR14) ─────────────────────────────── */
  async function fetchCyberRating() {
    if (!ready()) return window.QSR.cyberRating;
    try {
      var { data, error } = await db().from('cyber_rating')
        .select('*').order('calculated_at', { ascending: false }).limit(1).single();
      if (error) throw error;
      return {
        ...window.QSR.cyberRating,
        enterpriseScore: data.enterprise_score,
        maxScore:        data.max_score || 100,
        grade:           data.grade,
        calculatedAt:    data.calculated_at
      };
    } catch(e) {
      return window.QSR.cyberRating;
    }
  }

  /* ── Audit Log (FR15) ─────────────────────────────────────── */
  async function fetchAuditLog(limit) {
    if (!ready()) return window.QSR.recentScans;
    var cacheKey = 'audit_log_' + (limit || 8);
    var cached = getCached(cacheKey);
    if (cached) return cached;
    try {
      var { data, error } = await db().from('audit_log')
        .select('*').order('created_at', { ascending: false }).limit(limit || 8);
      if (error) throw error;
      var result = (data || []).map(r => ({
        icon: r.icon || '📋',
        msg:  r.action + (r.target ? ` — ${r.target}` : ''),
        time: r.created_at ? timeSince(r.created_at) : '—'
      }));
      if (result.length) setCache(cacheKey, result);
      return result.length ? result : window.QSR.recentScans;
    } catch(e) {
      return window.QSR.recentScans;
    }
  }

  /* ── Reports (FR14) ────────────────────────────────────────── */
  async function createReport(type, scope, format, email) {
    if (!ready()) {
      console.log('[DataLayer] Demo mode — report not persisted to DB');
      return;
    }
    var user = JSON.parse(sessionStorage.getItem('qsr_user') || '{}');
    var { error } = await db().from('reports').insert({
      type, scope, format: format || 'PDF', email,
      created_by: user.id || null, delivered: false
    });
    if (error) throw error;
    try {
      await db().from('audit_log').insert({
        action: 'REPORT_GENERATED:' + (type || '').toUpperCase(),
        target: scope, ip_addr: '—', icon: '📊'
      });
      clearCache('audit_log');
    } catch(e) { /* audit logging is non-critical */ }
  }

  /* ── Log a scan event (FR13, FR15) ────────────────────────── */
  async function logScanEvent(target) {
    if (!ready()) return;
    try {
      await db().from('audit_log').insert({
        action: 'SCAN_INITIATED', target, ip_addr: '—', icon: '🔍'
      });
      clearCache('audit_log');
    } catch(e) { /* non-critical */ }
  }

  /* ── Real-time subscriptions ───────────────────────────────── */
  function subscribeAuditLog(callback) {
    if (!ready()) return null;
    return db().channel('qsr_audit_' + Date.now())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' },
        function(payload) {
          clearCache('audit_log');
          if (callback) callback(payload.new);
        })
      .subscribe();
  }

  function subscribeAssets(callback) {
    if (!ready()) return null;
    return db().channel('qsr_assets_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' },
        function(payload) {
          clearCache('assets');
          if (callback) callback(payload);
        })
      .subscribe();
  }

  function unsubscribe(channel) {
    if (channel && db()) { try { db().removeChannel(channel); } catch(e) {} }
  }

  /* ── Utility helpers ───────────────────────────────────────── */
  function timeSince(iso) {
    var secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60)    return secs + 's ago';
    if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  }

  function computeKeyLengths(items) {
    return Object.entries(counts).map(([label,value]) => ({
      label, value, color: colors[label] || '#4299e1'
    }));
  }

  function computeCipherUsage(items) {
    const counts = {};
    items.forEach(i => { if(i.cipher) counts[i.cipher] = (counts[i.cipher]||0)+1; });
    return Object.entries(counts).slice(0,6).map(([cipher,count]) => ({ cipher, count }));
  }

  function computeCAs(items) {
    const counts = {};
    items.forEach(i => { if(i.ca) counts[i.ca] = (counts[i.ca]||0)+1; });
    return Object.entries(counts).slice(0,4).map(([name,count]) => ({ name, count }));
  }

  /* ── Public API ────────────────────────────────────────────── */
  return {
    fetchAssets,
    fetchDomains,
    fetchSSLs,
    fetchIPSubnets,
    fetchSoftware,
    fetchCryptoOverview,
    fetchNameservers,
    fetchCBOM,
    fetchPQCScores,
    fetchCyberRating,
    fetchAuditLog,
    createReport,
    logScanEvent,
    timeSince
  };
})();
