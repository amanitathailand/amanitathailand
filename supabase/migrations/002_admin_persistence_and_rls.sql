-- Safe, repeatable policies for existing projects.
-- Apply this migration to Supabase after backing up the database.
BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.museum_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.museum_exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Remove legacy permissive policies. PostgreSQL combines permissive policies with OR,
-- so leaving an old "allow all" policy would make the safer policies ineffective.
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles', 'admin_settings', 'museum_halls', 'museum_exhibits',
        'articles', 'products', 'orders', 'pixel_configs', 'media_assets', 'analytics_events'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;

END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.admin_settings, public.museum_halls, public.museum_exhibits,
  public.articles, public.products, public.pixel_configs TO anon, authenticated;
GRANT INSERT ON public.orders, public.analytics_events TO anon, authenticated;
GRANT ALL ON public.profiles, public.admin_settings, public.museum_halls, public.museum_exhibits,
  public.articles, public.products, public.orders, public.pixel_configs, public.media_assets,
  public.analytics_events TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "public read safe settings" ON public.admin_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('site_content', 'contact_settings') OR auth.role() = 'authenticated');
CREATE POLICY "authenticated manage settings" ON public.admin_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read published halls" ON public.museum_halls
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "authenticated manage halls" ON public.museum_halls
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read published exhibits" ON public.museum_exhibits
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "authenticated manage exhibits" ON public.museum_exhibits
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read published articles" ON public.articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "authenticated manage articles" ON public.articles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read published products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "authenticated manage products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read active pixels" ON public.pixel_configs
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR auth.role() = 'authenticated');
CREATE POLICY "authenticated manage pixels" ON public.pixel_configs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public create orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "authenticated manage orders" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public create analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "authenticated read analytics events" ON public.analytics_events
  FOR SELECT TO authenticated USING (true);

-- The CMS reads media metadata only after authentication. Public visitors use the
-- object URLs directly; anonymous upload is restricted to the slips/ prefix.
CREATE POLICY "authenticated manage media metadata" ON public.media_assets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('museum-media', 'museum-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public read museum media" ON storage.objects;
CREATE POLICY "public read museum media" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'museum-media');
DROP POLICY IF EXISTS "public upload museum slips" ON storage.objects;
CREATE POLICY "public upload museum slips" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'museum-media' AND name LIKE 'slips/%');
DROP POLICY IF EXISTS "authenticated manage museum media" ON storage.objects;
CREATE POLICY "authenticated manage museum media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'museum-media')
  WITH CHECK (bucket_id = 'museum-media');

-- Restrictive policies constrain anonymous operations on this bucket even if
-- another legacy permissive Storage policy exists. Other bucket policies remain intact.
DROP POLICY IF EXISTS "anon museum slips insert restriction" ON storage.objects;
CREATE POLICY "anon museum slips insert restriction" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO anon
  WITH CHECK (bucket_id <> 'museum-media' OR name LIKE 'slips/%');
DROP POLICY IF EXISTS "anon museum update restriction" ON storage.objects;
CREATE POLICY "anon museum update restriction" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO anon
  USING (bucket_id <> 'museum-media')
  WITH CHECK (bucket_id <> 'museum-media');
DROP POLICY IF EXISTS "anon museum delete restriction" ON storage.objects;
CREATE POLICY "anon museum delete restriction" ON storage.objects
  AS RESTRICTIVE FOR DELETE TO anon
  USING (bucket_id <> 'museum-media');

COMMIT;
