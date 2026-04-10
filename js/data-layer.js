/* ============================================================
   data-layer.js - Live Supabase Data Fetching
   No demo/sample fallback data is injected here.
   PQC readiness is derived from stored scores or conservative
   crypto-agility heuristics when the backend has partial data.
   ============================================================ */

window.QSR_DataLayer = (function () {
  function db() { return window.QSR_DB; }
  function ready() { return !!db() && window.QSR_SUPABASE_READY; }

  var _cache = {};
  var CACHE_TTL = 5 * 60 * 1000;

  function getCached(key) {
    var entry = _cache[key];
    if (entry && (Date.now() - entry.ts) < CACHE_TTL) return entry.data;
    return null;
  }

  function setCache(key, data) {
    _cache[key] = { ts: Date.now(), data: data };
  }

  function clearCache(table) {
    if (!table) {
      _cache = {};
      return;
    }
    Object.keys(_cache).forEach(function (key) {
      if (key.indexOf(table) === 0) delete _cache[key];
    });
  }

  function currentUser() {
    return window._QSR_USER || JSON.parse(sessionStorage.getItem('qsr_user') || 'null');
  }

  function normalizeHost(host) {
    return String(host || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
  }

  function assetHost(asset) {
    return normalizeHost(asset && (asset.url || asset.name || ''));
  }

  function assetMatchesHost(asset, host) {
    var aHost = assetHost(asset);
    var target = normalizeHost(host);
    if (!aHost || !target) return false;
    return aHost === target || aHost.endsWith('.' + target) || target.endsWith('.' + aHost);
  }

  function certStatusFromDaysLeft(daysLeft) {
    if (daysLeft == null) return 'Valid';
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft <= 30) return 'Expiring';
    return 'Valid';
  }

  function cipherLabel(result) {
    return result && result.ciphers && result.ciphers[0] ? result.ciphers[0].name : '-';
  }

  function inferAssetType(result) {
    var findings = result && result.techFingerprint && result.techFingerprint.findings
      ? result.techFingerprint.findings.map(function (item) { return String(item.name || '').toLowerCase(); })
      : [];

    if (findings.some(function (name) { return /wordpress|drupal|joomla|next\.js|react|angular|vue|nuxt/.test(name); })) {
      return 'Web App';
    }
    if (findings.some(function (name) { return /nginx|apache|iis|cloudflare|akamai|fastly|envoy/.test(name); })) {
      return 'Web App';
    }
    return 'Scanned Endpoint';
  }

  function clearOperationalCaches() {
    ['assets', 'pqc_scores', 'cbom', 'crypto_overview', 'cyber_rating', 'scan_history'].forEach(clearCache);
  }

  function emitSyncEvent(detail) {
    try {
      window.dispatchEvent(new CustomEvent('qsr:data-sync', {
        detail: detail || {}
      }));
    } catch (e) { }
  }

  function emptyCBOM() {
    return {
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
  }

  function emptyPQCPosture() {
    return {
      elitePct: 0,
      standardPct: 0,
      legacyPct: 0,
      criticalPct: 0,
      criticalApps: 0,
      assets: []
    };
  }

  function emptyCyberRating() {
    return {
      enterpriseScore: 0,
      maxScore: 100,
      grade: 'Unassessed',
      tiers: buildTierCards(emptyPQCPosture())
    };
  }

  function bucketFromScore(score) {
    if (score >= 76) return 'Elite-PQC';
    if (score >= 51) return 'Standard';
    if (score >= 26) return 'Legacy';
    return 'Critical';
  }

  function riskFromScore(score) {
    if (score >= 76) return 'Low';
    if (score >= 51) return 'Medium';
    if (score >= 26) return 'High';
    return 'Critical';
  }

  function gradeFromScore(score) {
    if (score >= 76) return 'Tier 1 - Elite PQC';
    if (score >= 51) return 'Tier 2 - Standard';
    if (score >= 26) return 'Tier 3 - Transitional';
    return 'Tier 4 - Critical';
  }

  function buildTierCards(pqc) {
    var assets = pqc.assets || [];
    var counts = {
      'Elite-PQC': assets.filter(function (a) { return a.status === 'Elite-PQC'; }).length,
      Standard: assets.filter(function (a) { return a.status === 'Standard'; }).length,
      Legacy: assets.filter(function (a) { return a.status === 'Legacy'; }).length,
      Critical: assets.filter(function (a) { return a.status === 'Critical'; }).length
    };

    return [
      {
        tier: 'Tier 1 - Elite PQC',
        range: '76-100',
        count: counts['Elite-PQC'],
        color: '#48bb78',
        desc: 'Hybrid PQC or strong crypto-agility evidence with modern transport.'
      },
      {
        tier: 'Tier 2 - Standard',
        range: '51-75',
        count: counts.Standard,
        color: '#4299e1',
        desc: 'Strong classical controls and TLS 1.3, but incomplete PQC rollout.'
      },
      {
        tier: 'Tier 3 - Transitional',
        range: '26-50',
        count: counts.Legacy,
        color: '#ecc94b',
        desc: 'Migration planning needed; exposed to harvest-now-decrypt-later risk.'
      },
      {
        tier: 'Tier 4 - Critical',
        range: '0-25',
        count: counts.Critical,
        color: '#e53e3e',
        desc: 'Legacy crypto posture with urgent PQC migration priority.'
      }
    ];
  }

  function heuristicAssetScore(asset) {
    var score = 0;
    var keyLength = Number(asset.key_length || asset.key || 0);
    var certStatus = asset.cert_status || asset.cert || 'Valid';
    var type = (asset.type || '').toLowerCase();

    if (keyLength >= 4096) score += 28;
    else if (keyLength >= 3072) score += 22;
    else if (keyLength >= 2048) score += 14;
    else if (keyLength >= 1024) score += 4;

    if (type.indexOf('internal') !== -1) score += 6;
    if (type.indexOf('api') !== -1) score += 4;
    if (type.indexOf('vpn') !== -1) score -= 6;

    if (certStatus === 'Valid') score += 14;
    else if (certStatus === 'Expiring') score += 5;
    else score -= 8;

    if (asset.last_scan || asset.lastScan) score += 8;

    if (asset.pqc_bucket) {
      var bucket = asset.pqc_bucket;
      if (bucket === 'Elite-PQC') score += 44;
      else if (bucket === 'Standard') score += 28;
      else if (bucket === 'Legacy') score += 14;
    } else {
      score += keyLength >= 4096 ? 18 : keyLength >= 2048 ? 10 : 0;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function normalizeAsset(asset, score) {
    var bucket = asset.pqc_bucket || bucketFromScore(score);
    return {
      id: asset.id,
      name: asset.name,
      url: asset.url || '#',
      ipv4: asset.ipv4 || '-',
      ipv6: asset.ipv6 || '-',
      type: asset.type || 'Unknown',
      owner: asset.owner || 'Unassigned',
      risk: asset.risk || riskFromScore(score),
      cert: asset.cert_status || asset.cert || 'Unknown',
      key: asset.key_length || asset.key || 0,
      qrScore: score,
      bucket: bucket,
      pqcBucket: bucket,
      tls: asset.tls_version || asset.tls || '',
      lastScan: asset.last_scan ? new Date(asset.last_scan).toLocaleString('en-IN') : (asset.lastScan || 'Never')
    };
  }

  async function query(table, opts) {
    var cacheKey = table + JSON.stringify(opts || {});
    var cached = getCached(cacheKey);
    if (cached) return cached;
    if (!ready()) return [];

    try {
      var q = db().from(table).select((opts && opts.select) || '*');
      if (opts && opts.order) q = q.order(opts.order, { ascending: opts.asc !== false });
      if (opts && opts.limit) q = q.limit(opts.limit);
      if (opts && opts.filters) {
        opts.filters.forEach(function (filter) {
          if (filter.op === 'eq') q = q.eq(filter.col, filter.val);
        });
      }
      var result = await q;
      if (result.error) throw result.error;
      setCache(cacheKey, result.data || []);
      return result.data || [];
    } catch (e) {
      console.warn('[DataLayer] Query failed for "' + table + '":', e.message);
      return [];
    }
  }

  async function fetchAssets() {
    if (!ready()) return [];

    var assets = await query('assets', { order: 'created_at', asc: false });
    if (!assets.length) return [];

    var scores = await query('pqc_scores', { order: 'assessed_at', asc: false });
    var scoreByAssetId = {};
    var scoreByAssetName = {};

    scores.forEach(function (row) {
      if (row.asset_id && scoreByAssetId[row.asset_id] == null) scoreByAssetId[row.asset_id] = row.score;
      if (row.asset_name && scoreByAssetName[row.asset_name] == null) scoreByAssetName[row.asset_name] = row.score;
    });

    return assets.map(function (asset) {
      var score = asset.qr_score;
      if (score == null && asset.id && scoreByAssetId[asset.id] != null) score = scoreByAssetId[asset.id];
      if (score == null && asset.name && scoreByAssetName[asset.name] != null) score = scoreByAssetName[asset.name];
      if (score == null) score = heuristicAssetScore(asset);
      return normalizeAsset(asset, Number(score) || 0);
    });
  }

  async function fetchDomains() {
    var raw = await query('domains', { order: 'detected', asc: false });
    return raw.map(function (d) {
      return {
        domain: d.domain,
        detected: d.detected ? new Date(d.detected).toLocaleDateString('en-IN') : '-',
        registered: d.registered || '-',
        registrar: d.registrar || '-',
        company: d.company || 'Unknown'
      };
    });
  }

  async function fetchSSLs() {
    var raw = await query('ssl_certs', { order: 'detected', asc: false });
    return raw.map(function (s) {
      return {
        fingerprint: s.fingerprint || '-',
        detected: s.detected ? new Date(s.detected).toLocaleDateString('en-IN') : '-',
        validFrom: s.valid_from || '-',
        commonName: s.common_name || '-',
        company: s.company || '-',
        ca: s.ca || '-'
      };
    });
  }

  async function fetchIPSubnets() {
    var raw = await query('ip_subnets', { order: 'detected', asc: false });
    return raw.map(function (ip) {
      return {
        ip: ip.ip || '-',
        ports: ip.ports || '-',
        subnet: ip.subnet || '-',
        asn: ip.asn || '-',
        netname: ip.netname || '-',
        location: ip.location || '-',
        company: ip.company || '-',
        detected: ip.detected ? new Date(ip.detected).toLocaleDateString('en-IN') : '-'
      };
    });
  }

  async function fetchSoftware() {
    var raw = await query('software', { order: 'detected', asc: false });
    return raw.map(function (sw) {
      return {
        product: sw.product || '-',
        version: sw.version || '-',
        type: sw.type || '-',
        port: sw.port || '-',
        host: sw.host || '-',
        company: sw.company || '-',
        detected: sw.detected ? new Date(sw.detected).toLocaleDateString('en-IN') : '-'
      };
    });
  }

  async function fetchCryptoOverview() {
    var raw = await query('crypto_overview', {
      select: '*, assets(name)',
      order: 'scanned_at',
      asc: false
    });

    return raw.map(function (row) {
      return {
        asset: row.assets && row.assets.name ? row.assets.name : (row.asset_id || '-'),
        keyLen: row.key_len || '-',
        cipher: row.cipher || '-',
        tls: row.tls || '-',
        ca: row.ca || '-',
        ago: row.scanned_at ? timeSince(row.scanned_at) : '-'
      };
    });
  }

  async function fetchNameservers() {
    return await query('nameservers', {});
  }

  async function fetchCBOM() {
    if (!ready()) return emptyCBOM();

    var raw = await query('cbom', { select: 'id, asset_id, app, key_length, cipher, ca, tls_version, assets(name)' });
    if (!raw.length) return emptyCBOM();

    var seen = {};
    var perApp = raw.filter(function (entry) {
      var key = entry.asset_id || entry.app || entry.id;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).map(function (entry) {
      return {
        app: entry.app || (entry.assets && entry.assets.name) || '-',
        keyLen: entry.key_length || '-',
        cipher: entry.cipher || '-',
        ca: entry.ca || '-',
        tls: entry.tls_version || '-'
      };
    });

    var weakCrypto = perApp.filter(function (item) {
      return String(item.keyLen).indexOf('1024') !== -1 || item.tls === '1.0' || item.tls === '1.1';
    }).length;

    return {
      totalApps: perApp.length,
      sitesSurveyed: perApp.length,
      activeCerts: perApp.length,
      weakCrypto: weakCrypto,
      certIssues: weakCrypto,
      perApp: perApp,
      keyLengths: computeKeyLengths(perApp),
      cipherUsage: computeCipherUsage(perApp),
      certAuthorities: computeCAs(perApp),
      encryptionProtocols: computeProtocols(perApp)
    };
  }

  async function fetchPQCScores() {
    if (!ready()) return emptyPQCPosture();

    var raw = await query('pqc_scores', {
      select: 'id, asset_id, asset_name, score, status, pqc_support, assessed_at, assets(name)',
      order: 'assessed_at',
      asc: false
    });

    var assets;
    if (raw.length) {
      var seen = {};
      assets = raw.filter(function (row) {
        var key = row.asset_id || row.asset_name || row.id;
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      }).map(function (row) {
        var score = Number(row.score) || 0;
        return {
          name: row.asset_name || (row.assets && row.assets.name) || '-',
          score: score,
          status: row.status || bucketFromScore(score),
          pqcSupport: !!row.pqc_support
        };
      });
    } else {
      var inventory = await fetchAssets();
      assets = inventory.map(function (asset) {
        return {
          name: asset.name,
          score: asset.qrScore || 0,
          status: asset.pqcBucket || bucketFromScore(asset.qrScore || 0),
          pqcSupport: (asset.qrScore || 0) >= 76
        };
      });
    }

    var total = assets.length || 1;
    var elite = assets.filter(function (a) { return a.status === 'Elite-PQC'; }).length;
    var standard = assets.filter(function (a) { return a.status === 'Standard'; }).length;
    var legacy = assets.filter(function (a) { return a.status === 'Legacy'; }).length;
    var critical = assets.filter(function (a) { return a.status === 'Critical'; }).length;

    return {
      assets: assets,
      elitePct: Math.round(elite / total * 100),
      standardPct: Math.round(standard / total * 100),
      legacyPct: Math.round(legacy / total * 100),
      criticalPct: Math.round(critical / total * 100),
      criticalApps: critical
    };
  }

  async function fetchCyberRating() {
    if (!ready()) return emptyCyberRating();

    try {
      var result = await db().from('cyber_rating')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (result.error) throw result.error;

      var pqc = await fetchPQCScores();
      return {
        enterpriseScore: Math.max(0, Math.min(100, Number(result.data.enterprise_score) || 0)),
        maxScore: 100,
        grade: result.data.grade || gradeFromScore(Number(result.data.enterprise_score) || 0),
        calculatedAt: result.data.calculated_at,
        tiers: buildTierCards(pqc)
      };
    } catch (e) {
      var posture = await fetchPQCScores();
      if (!posture.assets.length) return emptyCyberRating();

      var total = posture.assets.reduce(function (sum, asset) { return sum + (asset.score || 0); }, 0);
      var enterpriseScore = Math.round(total / posture.assets.length);
      return {
        enterpriseScore: enterpriseScore,
        maxScore: 100,
        grade: gradeFromScore(enterpriseScore),
        tiers: buildTierCards(posture)
      };
    }
  }

  async function fetchAuditLog(limit) {
    if (!ready()) return [];

    var cacheKey = 'audit_log_' + (limit || 8);
    var cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      var result = await db().from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit || 8);
      if (result.error) throw result.error;

      var rows = (result.data || []).map(function (row) {
        return {
          icon: row.icon || 'LOG',
          msg: row.action + (row.target ? ' - ' + row.target : ''),
          time: row.created_at ? timeSince(row.created_at) : '-'
        };
      });

      setCache(cacheKey, rows);
      return rows;
    } catch (e) {
      console.warn('[DataLayer] fetchAuditLog failed:', e.message);
      return [];
    }
  }

  async function logAction(action, target, icon) {
    if (!ready()) return false;

    var user = currentUser();
    /* RLS on audit_log requires auth.uid() = user_id — skip if no authenticated session */
    if (!user || !user.id) {
      console.debug('[DataLayer] logAction skipped — no authenticated user');
      return false;
    }

    try {
      var result = await db().from('audit_log').insert({
        user_id: user.id,
        action: action,
        target: target || null,
        ip_addr: '-',
        icon: icon || 'LOG'
      });
      if (result.error) throw result.error;
      clearCache('audit_log');
      return true;
    } catch (e) {
      console.warn('[DataLayer] logAction failed:', e.message);
      return false;
    }
  }

  async function createReport(type, scope, format, email) {
    if (!ready()) return false;

    var user = currentUser();
    var result = await db().from('reports').insert({
      type: type,
      scope: scope,
      format: format || 'PDF',
      email: email,
      created_by: user && user.id ? user.id : null,
      delivered: false
    });
    if (result.error) throw result.error;

    await logAction('REPORT_GENERATED:' + String(type || '').toUpperCase(), scope, 'REPORT');
    return true;
  }

  async function logScanEvent(target) {
    return await logAction('SCAN_INITIATED', target, 'SCAN');
  }

  async function saveScanResult(host, result) {
    if (!ready()) return false;

    var user = currentUser();
    if (!user || !user.id) return false;

    try {
      var insert = await db().from('scan_history').insert({
        user_id: user.id,
        host: host,
        grade: result.grade || null,
        tls_version: result.tlsVersion || null,
        key_alg: result.keyAlg || null,
        key_size: result.keySize || null,
        q_score: result.qScore || 0,
        q_vulnerable: !!result.qVulnerable,
        issuer: result.issuer || null,
        not_after: result.notAfter || null,
        days_left: result.daysLeft || null,
        cert_count: result.crtCount || 0,
        sources: result.sources || [],
        raw_result: result
      });
      if (insert.error) throw insert.error;

      clearCache('scan_history');
      return true;
    } catch (e) {
      console.warn('[DataLayer] saveScanResult failed:', e.message);
      return false;
    }
  }

  async function syncScanArtifacts(host, result) {
    if (!ready() || !host || !result) return { ok: false, error: 'Backend not ready' };

    var normalized = normalizeHost(host);
    var scanTs = result.scannedAt || new Date().toISOString();
    var score = Number(result.qScore) || 0;
    var bucket = result.pqcBucket || bucketFromScore(score);
    var risk = result.risk || riskFromScore(score);
    var certStatus = certStatusFromDaysLeft(result.daysLeft);

    try {
      var assets = await query('assets', { order: 'created_at', asc: false });
      var existingAsset = assets.find(function (asset) { return assetMatchesHost(asset, normalized); }) || null;

      var assetPayload = {
        name: existingAsset && existingAsset.name ? existingAsset.name : normalized,
        url: existingAsset && existingAsset.url ? existingAsset.url : ('https://' + normalized),
        type: existingAsset && existingAsset.type ? existingAsset.type : inferAssetType(result),
        owner: existingAsset && existingAsset.owner ? existingAsset.owner : 'Scanner',
        risk: risk,
        cert_status: certStatus,
        key_length: result.keySize || null,
        qr_score: score,
        pqc_bucket: bucket,
        last_scan: scanTs
      };

      var assetRow;
      if (existingAsset && existingAsset.id) {
        var assetUpdate = await db().from('assets')
          .update(assetPayload)
          .eq('id', existingAsset.id)
          .select('*')
          .single();
        if (assetUpdate.error) throw assetUpdate.error;
        assetRow = assetUpdate.data;
      } else {
        var assetInsert = await db().from('assets')
          .insert(assetPayload)
          .select('*')
          .single();
        if (assetInsert.error) throw assetInsert.error;
        assetRow = assetInsert.data;
      }

      var pqcPayload = {
        asset_id: assetRow.id,
        asset_name: assetRow.name,
        score: score,
        status: bucket,
        pqc_support: bucket === 'Elite-PQC',
        assessed_at: scanTs
      };

      var existingPqc = await db().from('pqc_scores')
        .select('id')
        .eq('asset_id', assetRow.id)
        .order('assessed_at', { ascending: false })
        .limit(1);
      if (existingPqc.error) throw existingPqc.error;

      if (existingPqc.data && existingPqc.data.length) {
        var pqcUpdate = await db().from('pqc_scores')
          .update(pqcPayload)
          .eq('id', existingPqc.data[0].id);
        if (pqcUpdate.error) throw pqcUpdate.error;
      } else {
        var pqcInsert = await db().from('pqc_scores').insert(pqcPayload);
        if (pqcInsert.error) throw pqcInsert.error;
      }

      var cbomPayload = {
        asset_id: assetRow.id,
        app: assetRow.name,
        key_length: (result.keyAlg || 'Unknown') + '-' + (result.keySize || '?'),
        cipher: cipherLabel(result),
        ca: result.issuer || '-',
        tls_version: result.tlsVersion || '-'
      };

      var existingCbom = await db().from('cbom')
        .select('id')
        .eq('asset_id', assetRow.id)
        .limit(1);
      if (existingCbom.error) throw existingCbom.error;

      if (existingCbom.data && existingCbom.data.length) {
        var cbomUpdate = await db().from('cbom')
          .update(cbomPayload)
          .eq('id', existingCbom.data[0].id);
        if (cbomUpdate.error) throw cbomUpdate.error;
      } else {
        var cbomInsert = await db().from('cbom').insert(cbomPayload);
        if (cbomInsert.error) throw cbomInsert.error;
      }

      var cryptoPayload = {
        asset_id: assetRow.id,
        key_len: cbomPayload.key_length,
        cipher: cbomPayload.cipher,
        tls: cbomPayload.tls_version,
        ca: cbomPayload.ca,
        scanned_at: scanTs
      };

      var existingCrypto = await db().from('crypto_overview')
        .select('id')
        .eq('asset_id', assetRow.id)
        .order('scanned_at', { ascending: false })
        .limit(1);
      if (existingCrypto.error) throw existingCrypto.error;

      if (existingCrypto.data && existingCrypto.data.length) {
        var cryptoUpdate = await db().from('crypto_overview')
          .update(cryptoPayload)
          .eq('id', existingCrypto.data[0].id);
        if (cryptoUpdate.error) throw cryptoUpdate.error;
      } else {
        var cryptoInsert = await db().from('crypto_overview').insert(cryptoPayload);
        if (cryptoInsert.error) throw cryptoInsert.error;
      }

      var allScores = await db().from('pqc_scores').select('score');
      if (allScores.error) throw allScores.error;

      var scoreRows = allScores.data || [];
      var enterpriseScore = scoreRows.length
        ? Math.round(scoreRows.reduce(function (sum, row) { return sum + (Number(row.score) || 0); }, 0) / scoreRows.length)
        : score;

      var cyberInsert = await db().from('cyber_rating').insert({
        enterprise_score: enterpriseScore,
        max_score: 100,
        grade: gradeFromScore(enterpriseScore),
        calculated_at: scanTs
      });
      if (cyberInsert.error) throw cyberInsert.error;

      clearOperationalCaches();
      emitSyncEvent({
        host: normalized,
        assetId: assetRow.id,
        qScore: score,
        pqcBucket: bucket,
        enterpriseScore: enterpriseScore
      });

      return {
        ok: true,
        assetId: assetRow.id,
        enterpriseScore: enterpriseScore
      };
    } catch (e) {
      console.warn('[DataLayer] syncScanArtifacts failed:', e.message);
      return { ok: false, error: e.message };
    }
  }

  async function fetchScanHistory(limit) {
    if (!ready()) return [];

    var user = currentUser();
    if (!user || !user.id) return [];

    var cacheKey = 'scan_history_' + (limit || 20) + '_' + user.id;
    var cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      var result = await db().from('scan_history')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(limit || 20);
      if (result.error) throw result.error;

      var rows = (result.data || []).map(function (row) {
        return {
          id: row.id,
          host: row.host,
          grade: row.grade,
          tlsVersion: row.tls_version,
          keyAlg: row.key_alg,
          keySize: row.key_size,
          qScore: row.q_score,
          qVulnerable: row.q_vulnerable,
          issuer: row.issuer,
          notAfter: row.not_after,
          daysLeft: row.days_left,
          crtCount: row.cert_count,
          sources: row.sources,
          rawResult: row.raw_result,
          scannedAt: row.scanned_at
        };
      });

      setCache(cacheKey, rows);
      return rows;
    } catch (e) {
      console.warn('[DataLayer] fetchScanHistory failed:', e.message);
      return [];
    }
  }

  function subscribeAuditLog(callback) {
    if (!ready()) return null;
    return db().channel('qsr_audit_' + Date.now())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, function (payload) {
        clearCache('audit_log');
        if (callback) callback(payload.new);
      })
      .subscribe();
  }

  function subscribeAssets(callback) {
    if (!ready()) return null;
    return db().channel('qsr_assets_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, function (payload) {
        clearCache('assets');
        clearCache('pqc_scores');
        if (callback) callback(payload);
      })
      .subscribe();
  }

  function unsubscribe(channel) {
    if (channel && db()) {
      try { db().removeChannel(channel); } catch (e) { }
    }
  }

  function timeSince(iso) {
    var secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60) return secs + 's ago';
    if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  }

  function computeKeyLengths(items) {
    var counts = {};
    items.forEach(function (item) {
      var key = item.keyLen || item.keyLength || '-';
      counts[key] = (counts[key] || 0) + 1;
    });

    var colors = {
      'RSA-1024': '#e53e3e',
      'RSA-2048': '#ed8936',
      'RSA-4096': '#48bb78',
      '1024-bit': '#e53e3e',
      '2048-bit': '#ed8936',
      '4096-bit': '#48bb78'
    };

    return Object.keys(counts).map(function (label) {
      return { label: label, value: counts[label], color: colors[label] || '#4299e1' };
    });
  }

  function computeCipherUsage(items) {
    var counts = {};
    items.forEach(function (item) {
      if (item.cipher) counts[item.cipher] = (counts[item.cipher] || 0) + 1;
    });
    return Object.keys(counts).slice(0, 6).map(function (cipher) {
      return { cipher: cipher, count: counts[cipher] };
    });
  }

  function computeCAs(items) {
    var counts = {};
    items.forEach(function (item) {
      if (item.ca) counts[item.ca] = (counts[item.ca] || 0) + 1;
    });
    return Object.keys(counts).slice(0, 4).map(function (name) {
      return { name: name, count: counts[name] };
    });
  }

  function computeProtocols(items) {
    var counts = {};
    items.forEach(function (item) {
      if (item.tls) counts[item.tls] = (counts[item.tls] || 0) + 1;
    });
    var colors = { '1.0': '#e53e3e', '1.1': '#ed8936', '1.2': '#4299e1', '1.3': '#48bb78' };
    return Object.keys(counts).map(function (label) {
      return { label: 'TLS ' + label, value: counts[label], color: colors[label] || '#a0aec0' };
    });
  }

  async function fetchLastScanForHost(host) {
    if (!ready() || !host) return null;

    var user = currentUser();
    if (!user || !user.id) return null;

    try {
      var result = await db().from('scan_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('host', host)
        .order('scanned_at', { ascending: false })
        .limit(2);
      if (result.error) throw result.error;

      var prev = result.data && result.data.length >= 2 ? result.data[1] : null;
      if (!prev) return null;

      return {
        host: prev.host,
        grade: prev.grade,
        tlsVersion: prev.tls_version,
        keyAlg: prev.key_alg,
        keySize: prev.key_size,
        qScore: prev.q_score,
        qVulnerable: prev.q_vulnerable,
        daysLeft: prev.days_left,
        crtCount: prev.cert_count,
        scannedAt: prev.scanned_at
      };
    } catch (e) {
      console.warn('[DataLayer] fetchLastScanForHost failed:', e.message);
      return null;
    }
  }

  return {
    fetchAssets: fetchAssets,
    fetchDomains: fetchDomains,
    fetchSSLs: fetchSSLs,
    fetchIPSubnets: fetchIPSubnets,
    fetchSoftware: fetchSoftware,
    fetchCryptoOverview: fetchCryptoOverview,
    fetchNameservers: fetchNameservers,
    fetchCBOM: fetchCBOM,
    fetchPQCScores: fetchPQCScores,
    fetchCyberRating: fetchCyberRating,
    fetchAuditLog: fetchAuditLog,
    createReport: createReport,
    logAction: logAction,
    logScanEvent: logScanEvent,
    saveScanResult: saveScanResult,
    fetchScanHistory: fetchScanHistory,
    fetchLastScanForHost: fetchLastScanForHost,
    syncScanArtifacts: syncScanArtifacts,
    subscribeAuditLog: subscribeAuditLog,
    subscribeAssets: subscribeAssets,
    unsubscribe: unsubscribe,
    clearCache: clearCache,
    timeSince: timeSince,
    bucketFromScore: bucketFromScore,
    riskFromScore: riskFromScore
  };
})();
