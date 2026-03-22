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

  /* ── Generic query wrapper with fallback ───────────────────── */
  async function query(table, fallbackKey, opts) {
    if (!ready()) {
      console.log(`[DataLayer] Fallback → data.js mock for "${table}"`);
      return window.QSR[fallbackKey] || [];
    }
    try {
      let q = db().from(table).select(opts?.select || '*');
      if (opts?.order)  q = q.order(opts.order, { ascending: opts.asc !== false });
      if (opts?.limit)  q = q.limit(opts.limit);
      if (opts?.filter) opts.filter.forEach(f => { q = q.eq(f.col, f.val); });
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    } catch(e) {
      console.warn(`[DataLayer] Supabase error on "${table}":`, e.message, '→ using fallback');
      return window.QSR[fallbackKey] || [];
    }
  }

  /* ── Assets (FR4, FR5, FR6, FR7) ──────────────────────────── */
  async function fetchAssets() {
    const raw = await query('assets', 'assets', { order: 'created_at', asc: false });
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
      lastScan: a.last_scan ? new Date(a.last_scan).toLocaleString('en-IN') : 'Never'
    }));
  }

  /* ── Domains (FR4 — DNS enumeration) ──────────────────────── */
  async function fetchDomains() {
    const raw = await query('domains', 'domains', { order: 'detected', asc: false });
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
    const raw = await query('ssl_certs', 'ssls', { order: 'detected', asc: false });
    return raw.map(s => ({
      fingerprint: s.fingerprint || '—',
      detected:    s.detected ? new Date(s.detected).toLocaleDateString('en-IN') : '—',
      validFrom:   s.valid_from  || '—',
      commonName:  s.common_name || '—',
      company:     s.company     || '—',
      ca:          s.ca          || '—'
    }));
  }

  /* ── IP Subnets (FR5 — TLS service identification) ─────────── */
  async function fetchIPSubnets() {
    const raw = await query('ip_subnets', 'ipSubnets', { order: 'detected', asc: false });
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
    const raw = await query('software', 'software', { order: 'detected', asc: false });
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
    const raw = await query('crypto_overview', 'cryptoOverview', {
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
    // Summary stats from assets table
    const raw = await query('cbom', 'cbom', { select: '*, assets(name)' });

    // Build grouped CBOM summary
    const perApp = raw.map(c => ({
      app:     c.app || c.assets?.name || '—',
      keyLen:  c.key_length  || '—',
      cipher:  c.cipher      || '—',
      ca:      c.ca          || '—',
      tls:     c.tls_version || '—'
    }));

    if (!ready()) return window.QSR.cbom;

    // Compute stats from live data
    const weakCrypto = perApp.filter(p => p.keyLen.startsWith('1024') || p.tls === '1.0').length;
    return {
      totalApps:    perApp.length   || 0,
      sitesSurveyed: perApp.length  || 0,
      activeCerts:  perApp.length   || 0,
      weakCrypto:   weakCrypto,
      certIssues:   weakCrypto,
      perApp,
      // Computed aggregates for charts
      keyLengths: computeKeyLengths(perApp),
      cipherUsage: computeCipherUsage(perApp),
      certAuthorities: computeCAs(perApp),
      encriptionProtocols: window.QSR.cbom.encriptionProtocols // keep static
    };
  }

  /* ── PQC Scores (FR9, FR10, FR11) ─────────────────────────── */
  async function fetchPQCScores() {
    const raw = await query('pqc_scores', 'pqcPosture', {
      select: '*, assets(name)',
      order: 'assessed_at', asc: false
    });
    if (!ready() || raw === window.QSR.pqcPosture) return window.QSR.pqcPosture;

    const assets = raw.map(r => ({
      name:       r.asset_name || r.assets?.name || '—',
      score:      r.score       || 0,
      status:     r.status      || 'Legacy',
      pqcSupport: r.pqc_support || false
    }));

    const elite    = assets.filter(a => a.status.includes('Elite')).length;
    const standard = assets.filter(a => a.status === 'Standard').length;
    const legacy   = assets.filter(a => a.status === 'Legacy').length;
    const critical = assets.filter(a => a.status === 'Critical').length;
    const total    = assets.length || 1;

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
      const { data, error } = await db().from('cyber_rating')
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
    const raw = await query('audit_log', 'recentScans', {
      order:  'created_at',
      asc:    false,
      limit:  limit || 8
    });
    if (!ready() || raw === window.QSR.recentScans) return window.QSR.recentScans;
    return raw.map(r => ({
      icon: r.icon || '📋',
      msg:  r.action + (r.target ? ` — ${r.target}` : ''),
      time: r.created_at ? timeSince(r.created_at) : '—'
    }));
  }

  /* ── Reports (FR14) ────────────────────────────────────────── */
  async function createReport(type, scope, format, email) {
    if (!ready()) {
      console.log('[DataLayer] Demo mode — report not persisted to DB');
      return;
    }
    const user = JSON.parse(sessionStorage.getItem('qsr_user') || '{}');
    const { error } = await db().from('reports').insert({
      type,
      scope,
      format:     format || 'PDF',
      email,
      created_by: user.id,
      delivered:  false
    });
    if (error) throw error;

    /* Write audit entry (FR15) */
    try {
      await db().from('audit_log').insert({
        action: 'REPORT_GENERATED:' + (type||'').toUpperCase(),
        target:  scope,
        ip_addr: '—',
        user_id: user.id,
        icon:    '📊'
      });
    } catch(e) { /* audit logging is non-critical */ }
  }

  /* ── Log a scan event (FR13, FR15) ────────────────────────── */
  async function logScanEvent(target) {
    if (!ready()) return;
    const user = JSON.parse(sessionStorage.getItem('qsr_user') || '{}');
    try {
      await db().from('audit_log').insert({
        action:  'SCAN_INITIATED',
        target:  target,
        ip_addr: '—',
        user_id: user.id,
        icon:    '🔍'
      });
    } catch(e) { /* non-critical */ }
  }

  /* ── Utility helpers ───────────────────────────────────────── */
  function timeSince(iso) {
    const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60)   return secs + 's ago';
    if (secs < 3600) return Math.floor(secs/60) + 'm ago';
    if (secs < 86400)return Math.floor(secs/3600) + 'h ago';
    return Math.floor(secs/86400) + 'd ago';
  }

  function computeKeyLengths(items) {
    const counts = {};
    items.forEach(i => { counts[i.keyLen] = (counts[i.keyLen]||0)+1; });
    const colors = {'1024-bit':'#e53e3e','2048-bit':'#ed8936','4096-bit':'#48bb78'};
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
