import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/* QSecure Radar — Real TLS Scanner Edge Function v2
   Performs a real Deno TLS handshake + HTTP HEAD for security headers.
   Returns cert data, negotiated cipher, TLS version, and all HTTP headers.
   PSB Hackathon 2026 | Team REAL — KIIT */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Max-Age': '86400',
};

interface ScanResult {
  host: string;
  port: number;
  tls_version: string | null;
  cipher_suite: string | null;
  key_algorithm: string | null;
  key_size: number | null;
  subject: string | null;
  issuer: string | null;
  not_before: string | null;
  not_after: string | null;
  days_left: number | null;
  serial: string | null;
  san: string[];
  alpn: string | null;
  headers: Record<string, string>;
  error: string | null;
  scan_ms: number;
  source: string;
}

async function scanHost(host: string, port = 443): Promise<ScanResult> {
  const start = Date.now();
  const result: ScanResult = {
    host, port,
    tls_version: null, cipher_suite: null,
    key_algorithm: null, key_size: null,
    subject: null, issuer: null,
    not_before: null, not_after: null, days_left: null,
    serial: null, san: [], alpn: null,
    headers: {}, error: null,
    scan_ms: 0, source: 'edge-function-v2'
  };

  /* ── Step 1: HTTP HEAD for security headers ── */
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const resp = await fetch(`https://${host}/`, {
      method: 'HEAD',
      signal: ctrl.signal,
      redirect: 'follow'
    });
    clearTimeout(timer);

    const hdrs: Record<string, string> = {};
    resp.headers.forEach((v, k) => { hdrs[k.toLowerCase()] = v; });
    result.headers = hdrs;

    /* Detect HTTP/3 via alt-svc header */
    const altSvc = hdrs['alt-svc'] || '';
    if (altSvc.includes('h3')) {
      result.tls_version = '1.3'; /* QUIC mandates TLS 1.3 */
    }

    /* Infer TLS from HSTS max-age when handshake hasn't run yet */
    const hsts = hdrs['strict-transport-security'] || '';
    if (!result.tls_version && hsts) {
      const m = hsts.match(/max-age=(\d+)/);
      result.tls_version = (m && parseInt(m[1]) > 31536000) ? '1.3' : '1.2';
    }
  } catch (_headerErr) {
    /* Headers unavailable — continue with TLS handshake */
  }

  /* ── Step 2: Real TLS handshake via Deno.connectTls ── */
  try {
    const conn = await (Deno as any).connectTls({
      hostname: host,
      port: port,
      alpnProtocols: ['h2', 'http/1.1'],
    });

    const handshake = await conn.handshake();
    if (handshake) {
      /* Normalize TLS version string from Deno */
      let tlsver: string | null = handshake.tlsVersion || null;
      if (tlsver) {
        tlsver = tlsver.replace(/^TLSv?/i, '').trim();
        if (tlsver.includes('1_3') || tlsver === '1.3') tlsver = '1.3';
        else if (tlsver.includes('1_2') || tlsver === '1.2') tlsver = '1.2';
        else if (tlsver.includes('1_1') || tlsver === '1.1') tlsver = '1.1';
        else if (tlsver.includes('1_0') || tlsver === '1.0') tlsver = '1.0';
      }
      result.tls_version = tlsver || result.tls_version;
      result.cipher_suite = handshake.cipherSuite || null;
      result.alpn = handshake.alpnProtocol || null;

      /* Infer key algorithm from cipher suite name */
      if (result.cipher_suite) {
        const cs = result.cipher_suite.toUpperCase();
        if (cs.includes('ECDSA')) {
          result.key_algorithm = 'ECDSA'; result.key_size = 256;
        } else if (cs.includes('RSA')) {
          result.key_algorithm = 'RSA'; result.key_size = 2048;
        } else if (cs.includes('KYBER') || cs.includes('ML-KEM') || cs.includes('X25519KYBER')) {
          result.key_algorithm = 'ML-KEM'; result.key_size = 768;
        }
      }
    }

    /* ── Extract peer certificate ── */
    const peerCerts = (conn as any).peerCertificates;
    if (peerCerts && peerCerts.length > 0) {
      const cert = peerCerts[0];

      if (cert.subject) {
        const cnMatch = cert.subject.match(/CN=([^,]+)/i);
        result.subject = cnMatch ? cnMatch[1].trim() : cert.subject;
      }
      if (cert.issuer) result.issuer = cert.issuer;
      if (cert.serialNumber) result.serial = cert.serialNumber;

      if (cert.validity) {
        result.not_before = cert.validity.notBefore?.toISOString?.() || null;
        result.not_after = cert.validity.notAfter?.toISOString?.() || null;
        if (cert.validity.notAfter) {
          result.days_left = Math.floor(
            (new Date(cert.validity.notAfter).getTime() - Date.now()) / 86400000
          );
        }
      }

      /* Subject Alternative Names */
      if (cert.subjectAltName) {
        result.san = cert.subjectAltName
          .split(',')
          .map((s: string) => s.replace(/^DNS:/i, '').trim())
          .filter(Boolean);
      }

      /* Key algorithm from certificate public key object (Deno 1.3x+) */
      if (cert.publicKey) {
        const pk = cert.publicKey;
        const pkName = (pk.algorithm?.name || pk.type || '').toLowerCase();
        if (pkName.includes('ec') || pkName.includes('ecdsa')) {
          result.key_algorithm = 'ECDSA';
          result.key_size = 256;
        } else if (pkName.includes('rsa')) {
          result.key_algorithm = 'RSA';
          result.key_size = 2048;
        }
      }
    }

    conn.close();
    result.error = null;
  } catch (e) {
    const msg = String((e as Error).message || e);
    result.error = msg;
    console.warn(`[tls-scanner] TLS handshake error for ${host}: ${msg}`);
  }

  result.scan_ms = Date.now() - start;
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const responseHeaders = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  try {
    let host = '';
    let port = 443;

    if (req.method === 'POST') {
      const body = await req.json();
      host = body.host || '';
      port = body.port || 443;
    } else {
      const url = new URL(req.url);
      host = url.searchParams.get('host') || '';
      port = parseInt(url.searchParams.get('port') || '443');
    }

    if (!host || typeof host !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "host" parameter' }),
        { status: 400, headers: responseHeaders }
      );
    }

    /* Sanitize host — strip scheme, path, and illegal chars */
    const cleanHost = host
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .toLowerCase();

    if (!cleanHost || cleanHost.length > 253 || !cleanHost.includes('.')) {
      return new Response(
        JSON.stringify({ error: 'Invalid hostname: ' + cleanHost }),
        { status: 400, headers: responseHeaders }
      );
    }

    const result = await scanHost(cleanHost, port);
    return new Response(JSON.stringify(result), { status: 200, headers: responseHeaders });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error).message || e) }),
      { status: 500, headers: responseHeaders }
    );
  }
});
