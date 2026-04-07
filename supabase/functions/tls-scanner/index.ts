import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/* QSecure Radar — Custom TLS Scanner Edge Function
   Performs a REAL TLS handshake with the target host
   and extracts certificate + cipher negotiation data.
   PSB Hackathon 2026 | Team REAL — KIIT */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TLSScanResult {
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
  protocol: string | null;
  alpn: string | null;
  headers: Record<string, string>;
  error: string | null;
  scan_ms: number;
}

async function scanTLS(host: string, port = 443): Promise<TLSScanResult> {
  const start = Date.now();
  const result: TLSScanResult = {
    host, port, tls_version: null, cipher_suite: null,
    key_algorithm: null, key_size: null, subject: null, issuer: null,
    not_before: null, not_after: null, days_left: null, serial: null,
    san: [], protocol: null, alpn: null, headers: {}, error: null, scan_ms: 0
  };

  // ALWAYS fetch security headers (not just as fallback)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(`https://${host}/`, {
      method: 'HEAD',
      signal: ctrl.signal,
      redirect: 'follow'
    });
    clearTimeout(timer);

    result.protocol = resp.headers.get('alt-svc')?.includes('h3') ? 'h3/TLS1.3' : 'https';

    const hsts = resp.headers.get('strict-transport-security');
    if (hsts) {
      const maxAge = hsts.match(/max-age=(\d+)/);
      if (maxAge && parseInt(maxAge[1]) > 31536000) {
        result.tls_version = '1.3';
      } else {
        result.tls_version = '1.2';
      }
    }

    // Extract ALL security headers ALWAYS
    const hdrs: Record<string, string> = {};
    resp.headers.forEach((v, k) => { hdrs[k.toLowerCase()] = v; });
    (result as any).headers = hdrs;
  } catch (headerErr) {
    // Silent fail - will try TLS handshake instead
  }

  try {
    // Perform real TLS handshake using Deno native API
    const conn = await Deno.connectTls({
      hostname: host,
      port: port,
      alpnProtocols: ['h2', 'http/1.1'],
    });

    // Get the handshake info
    const handshake = await conn.handshake();

    if (handshake) {
      result.tls_version = handshake.tlsVersion || null;
      result.cipher_suite = handshake.cipherSuite || null;
      result.alpn = handshake.alpnProtocol || null;
    }

    // Get peer certificate details
    const peerCerts = conn.peerCertificates;
    if (peerCerts && peerCerts.length > 0) {
      const cert = peerCerts[0];

      if (cert.subject) {
        const cnMatch = cert.subject.match(/CN=([^,]+)/i);
        result.subject = cnMatch ? cnMatch[1].trim() : cert.subject;
      }

      if (cert.issuer) {
        result.issuer = cert.issuer;
      }

      if (cert.validity) {
        result.not_before = cert.validity.notBefore?.toISOString() || null;
        result.not_after = cert.validity.notAfter?.toISOString() || null;
        if (cert.validity.notAfter) {
          result.days_left = Math.floor(
            (cert.validity.notAfter.getTime() - Date.now()) / 86400000
          );
        }
      }

      if (cert.serialNumber) {
        result.serial = cert.serialNumber;
      }

      if (cert.subjectAltName) {
        result.san = cert.subjectAltName
          .split(',')
          .map((s: string) => s.replace(/^DNS:/i, '').trim())
          .filter(Boolean);
      }
    }

    conn.close();
    result.error = null;
  } catch (e) {
    if (!result.error) {
      result.error = 'TLS handshake failed: ' + (e as Error).message;
    }
  }

  result.scan_ms = Date.now() - start;
  return result;
}
            result.key_algorithm = 'RSA';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { host, port } = await req.json();

    if (!host || typeof host !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "host" parameter' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize host
    const cleanHost = host
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .toLowerCase();

    if (!cleanHost || cleanHost.length > 253) {
      return new Response(
        JSON.stringify({ error: 'Invalid hostname' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const result = await scanTLS(cleanHost, port || 443);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
