ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('active','pending','revoked'));
  END IF;
END $$;

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS qr_score INTEGER,
  ADD COLUMN IF NOT EXISTS pqc_bucket TEXT;

ALTER TABLE public.cyber_rating
  ALTER COLUMN max_score SET DEFAULT 100;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'soc',
    'active'
  );
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_admin'
  ) THEN
    CREATE POLICY "profiles_select_admin" ON public.profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_admin'
  ) THEN
    CREATE POLICY "profiles_update_admin" ON public.profiles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'assets' AND policyname = 'assets_insert_auth'
  ) THEN
    CREATE POLICY "assets_insert_auth" ON public.assets
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'assets' AND policyname = 'assets_update_auth'
  ) THEN
    CREATE POLICY "assets_update_auth" ON public.assets
      FOR UPDATE USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'crypto_overview' AND policyname = 'crypto_insert_auth'
  ) THEN
    CREATE POLICY "crypto_insert_auth" ON public.crypto_overview
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'crypto_overview' AND policyname = 'crypto_update_auth'
  ) THEN
    CREATE POLICY "crypto_update_auth" ON public.crypto_overview
      FOR UPDATE USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cbom' AND policyname = 'cbom_update_auth'
  ) THEN
    CREATE POLICY "cbom_update_auth" ON public.cbom
      FOR UPDATE USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pqc_scores' AND policyname = 'pqc_insert_auth'
  ) THEN
    CREATE POLICY "pqc_insert_auth" ON public.pqc_scores
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pqc_scores' AND policyname = 'pqc_update_auth'
  ) THEN
    CREATE POLICY "pqc_update_auth" ON public.pqc_scores
      FOR UPDATE USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cyber_rating' AND policyname = 'cyberrating_insert_auth'
  ) THEN
    CREATE POLICY "cyberrating_insert_auth" ON public.cyber_rating
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'scan_history' AND policyname = 'scan_history_update_own'
  ) THEN
    CREATE POLICY "scan_history_update_own" ON public.scan_history
      FOR UPDATE USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'scan_history' AND policyname = 'scan_history_delete_own'
  ) THEN
    CREATE POLICY "scan_history_delete_own" ON public.scan_history
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scan_history_user_scanned_at
  ON public.scan_history (user_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_pqc_scores_asset_id
  ON public.pqc_scores (asset_id, assessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_last_scan
  ON public.assets (last_scan DESC);
