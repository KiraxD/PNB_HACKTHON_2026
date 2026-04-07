-- ============================================================
-- QSecure Radar — Supabase Schema
-- PSB Hackathon 2026 | Run this in Supabase SQL Editor
-- ============================================================

-- ── Profiles (RBAC) — FR2 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'soc' CHECK (role IN ('soc','admin','compliance')),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','revoked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'soc'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Assets — FR4, FR5, FR6, FR7 ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  url         TEXT,
  ipv4        TEXT,
  ipv6        TEXT,
  type        TEXT,
  owner       TEXT,
  risk        TEXT CHECK (risk IN ('Critical','High','Medium','Low')),
  cert_status TEXT CHECK (cert_status IN ('Valid','Expiring','Expired')),
  key_length  INTEGER DEFAULT 2048,
  qr_score    INTEGER,
  pqc_bucket  TEXT,
  last_scan   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Domains — FR4 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.domains (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain     TEXT NOT NULL,
  detected   TIMESTAMPTZ DEFAULT now(),
  registered DATE,
  registrar  TEXT,
  company    TEXT DEFAULT 'Punjab National Bank'
);

-- ── SSL Certificates — FR7 ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ssl_certs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT,
  valid_from  DATE,
  common_name TEXT,
  company     TEXT,
  ca          TEXT,
  detected    TIMESTAMPTZ DEFAULT now()
);

-- ── IP Subnets — FR5 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ip_subnets (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip       TEXT,
  ports    TEXT,
  subnet   TEXT,
  asn      TEXT,
  netname  TEXT,
  location TEXT,
  company  TEXT,
  detected TIMESTAMPTZ DEFAULT now()
);

-- ── Software Inventory — FR4 ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.software (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product  TEXT,
  version  TEXT,
  type     TEXT,
  port     INTEGER,
  host     TEXT,
  company  TEXT,
  detected TIMESTAMPTZ DEFAULT now()
);

-- ── Crypto Overview — FR6 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crypto_overview (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  key_len    TEXT,
  cipher     TEXT,
  tls        TEXT,
  ca         TEXT,
  scanned_at TIMESTAMPTZ DEFAULT now()
);

-- ── Nameservers — FR5 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nameservers (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT,
  type     TEXT,
  ip       TEXT,
  ipv6     TEXT,
  ttl      TEXT
);

-- ── CBOM — FR8 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cbom (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  app         TEXT,
  key_length  TEXT,
  cipher      TEXT,
  ca          TEXT,
  tls_version TEXT
);

-- ── PQC Scores — FR9, FR10 ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pqc_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  asset_name  TEXT,
  score       INTEGER,
  status      TEXT,
  pqc_support BOOLEAN DEFAULT false,
  assessed_at TIMESTAMPTZ DEFAULT now()
);

-- ── Cyber Rating — FR10 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cyber_rating (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_score INTEGER,
  max_score        INTEGER DEFAULT 100,
  grade            TEXT,
  calculated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Audit Log — FR15 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id),
  action     TEXT NOT NULL,
  target     TEXT,
  ip_addr    TEXT,
  icon       TEXT DEFAULT '📋',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Reports — FR13 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT CHECK (type IN ('executive','scheduled','ondemand')),
  scope      TEXT,
  format     TEXT DEFAULT 'PDF',
  email      TEXT,
  created_by UUID REFERENCES auth.users(id),
  delivered  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scan History - per-user scanner evidence + readiness snapshots
CREATE TABLE IF NOT EXISTS public.scan_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host         TEXT NOT NULL,
  grade        TEXT,
  tls_version  TEXT,
  key_alg      TEXT,
  key_size     INTEGER,
  q_score      INTEGER DEFAULT 0,
  q_vulnerable BOOLEAN DEFAULT false,
  issuer       TEXT,
  not_after    TEXT,
  days_left    INTEGER,
  cert_count   INTEGER DEFAULT 0,
  sources      JSONB DEFAULT '[]'::jsonb,
  raw_result   JSONB DEFAULT '{}'::jsonb,
  scanned_at   TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (FR3 — Zero Trust)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssl_certs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_subnets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nameservers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbom           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pqc_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_rating   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history   ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- All core data tables: any authenticated user can read (FR3 — least privilege)
CREATE POLICY "assets_select_auth"    ON public.assets    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "assets_insert_auth"    ON public.assets    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "assets_update_auth"    ON public.assets    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "domains_select_auth"   ON public.domains   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ssl_select_auth"       ON public.ssl_certs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ip_select_auth"        ON public.ip_subnets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "software_select_auth"  ON public.software  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "crypto_select_auth"    ON public.crypto_overview FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "crypto_insert_auth"    ON public.crypto_overview FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "crypto_update_auth"    ON public.crypto_overview FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "ns_select_auth"        ON public.nameservers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cbom_select_auth"      ON public.cbom      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cbom_insert_auth"      ON public.cbom      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "cbom_update_auth"      ON public.cbom      FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pqc_select_auth"       ON public.pqc_scores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "pqc_insert_auth"       ON public.pqc_scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pqc_update_auth"       ON public.pqc_scores FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "cyberrating_select"    ON public.cyber_rating FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cyberrating_insert_auth" ON public.cyber_rating FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Audit log: any auth user can select; any auth user can insert own actions
CREATE POLICY "audit_select_auth"  ON public.audit_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_insert_auth"  ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports: users see only own reports
CREATE POLICY "reports_own" ON public.reports FOR ALL USING (auth.uid() = created_by);

-- Scan history: users can manage only their own saved scans
CREATE POLICY "scan_history_select_own" ON public.scan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scan_history_insert_own" ON public.scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scan_history_update_own" ON public.scan_history
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scan_history_delete_own" ON public.scan_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scan_history_user_scanned_at
  ON public.scan_history (user_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_pqc_scores_asset_id
  ON public.pqc_scores (asset_id, assessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_last_scan
  ON public.assets (last_scan DESC);

-- ═══════════════════════════════════════════════════════════════
-- HELPER: Admin bypass (service role bypasses RLS automatically)
-- ═══════════════════════════════════════════════════════════════
-- No extra policy needed — service_role always bypasses RLS.
