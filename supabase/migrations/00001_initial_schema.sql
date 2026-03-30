-- supabase/migrations/00001_initial_schema.sql
-- Complete initial schema for LinkStack multi-tenant platform
-- Includes: 12 tables, RLS policies, indexes, helper functions, auth hook, signup trigger

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- auth.tenant_id() - reads tenant_id from JWT app_metadata
-- STABLE: evaluated once per query via initPlan when wrapped in (select ...)
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id'),
    ''
  )::uuid
$$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- TABLES
-- ============================================

-- 1. Tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tenant can read own record
CREATE POLICY "Tenant reads own" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = (select auth.tenant_id()));

-- Tenant can update own record
CREATE POLICY "Tenant updates own" ON public.tenants
  FOR UPDATE TO authenticated
  USING (id = (select auth.tenant_id()))
  WITH CHECK (id = (select auth.tenant_id()));

-- Public can read tenant by slug (for microsite routing)
CREATE POLICY "Public reads tenant by slug" ON public.tenants
  FOR SELECT TO anon
  USING (status = 'active');

CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Users (extends auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tenant" ON public.users
  FOR SELECT TO authenticated
  USING (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()) AND tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE INDEX idx_users_tenant_id ON public.users (tenant_id);
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Business Profiles
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  tagline text,
  description_short text,
  description_long text,
  phone text,
  email text,
  website text,
  address text,
  event_name text,
  stand_number text,
  logo_url text,
  hero_image_url text,
  about_content jsonb DEFAULT '{}',
  trust_content jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.business_profiles
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Public read active" ON public.business_profiles
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active'
  ));

CREATE INDEX idx_business_profiles_tenant_id ON public.business_profiles (tenant_id);
CREATE TRIGGER set_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Representatives
CREATE TABLE public.representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  email text,
  phone text,
  whatsapp text,
  image_url text,
  is_primary boolean NOT NULL DEFAULT false,
  vcard_note_template text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.representatives
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Public read" ON public.representatives
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active'
  ));

CREATE INDEX idx_representatives_tenant_id ON public.representatives (tenant_id);
CREATE INDEX idx_representatives_tenant_sort ON public.representatives (tenant_id, sort_order);
CREATE TRIGGER set_representatives_updated_at
  BEFORE UPDATE ON public.representatives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Product Categories
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.product_categories
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Public read" ON public.product_categories
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active'
  ));

CREATE INDEX idx_product_categories_tenant_id ON public.product_categories (tenant_id);
CREATE INDEX idx_product_categories_tenant_sort ON public.product_categories (tenant_id, sort_order);
CREATE TRIGGER set_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  short_description text,
  long_description text,
  image_url text,
  featured boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.products
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Public read visible" ON public.products
  FOR SELECT TO anon
  USING (visible = true AND EXISTS (
    SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active'
  ));

CREATE INDEX idx_products_tenant_id ON public.products (tenant_id);
CREATE INDEX idx_products_tenant_created ON public.products (tenant_id, created_at);
CREATE INDEX idx_products_tenant_sort ON public.products (tenant_id, sort_order);
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('catalog', 'brochure', 'datasheet', 'certification', 'pricing_sheet', 'other')),
  file_url text,
  storage_path text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'gated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.documents
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Public read public docs" ON public.documents
  FOR SELECT TO anon
  USING (visibility = 'public' AND EXISTS (
    SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active'
  ));

CREATE INDEX idx_documents_tenant_id ON public.documents (tenant_id);
CREATE INDEX idx_documents_tenant_created ON public.documents (tenant_id, created_at);
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Leads (no updated_at -- leads are immutable after creation)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  rep_id uuid REFERENCES public.representatives(id) ON DELETE SET NULL,
  source_qr_id uuid,  -- FK added after qr_codes table is created
  full_name text,
  email text,
  phone text,
  company text,
  message text,
  consent boolean NOT NULL DEFAULT false,
  event_context jsonb DEFAULT '{}',
  interest_context jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.leads
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

-- Anonymous lead submission via service role only (no anon policy for INSERT)
-- Reads by anon are NOT allowed (leads are private)

CREATE INDEX idx_leads_tenant_id ON public.leads (tenant_id);
CREATE INDEX idx_leads_tenant_created ON public.leads (tenant_id, created_at);

-- 9. QR Codes
CREATE TABLE public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  rep_id uuid REFERENCES public.representatives(id) ON DELETE SET NULL,
  campaign_name text,
  target_url text NOT NULL,
  design_config jsonb DEFAULT '{}',
  asset_url_png text,
  asset_url_svg text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.qr_codes
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE INDEX idx_qr_codes_tenant_id ON public.qr_codes (tenant_id);
CREATE TRIGGER set_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add FK from leads to qr_codes (deferred because qr_codes created after leads)
ALTER TABLE public.leads ADD CONSTRAINT leads_source_qr_id_fkey
  FOREIGN KEY (source_qr_id) REFERENCES public.qr_codes(id) ON DELETE SET NULL;

-- 10. CTA Configurations
CREATE TABLE public.cta_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'save_contact', 'view_products', 'get_catalog', 'whatsapp',
    'request_quote', 'share', 'book_meeting', 'call', 'email', 'website', 'maps'
  )),
  label text NOT NULL,
  destination text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cta_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.cta_configurations
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Public read enabled" ON public.cta_configurations
  FOR SELECT TO anon
  USING (enabled = true AND EXISTS (
    SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active'
  ));

CREATE INDEX idx_cta_configurations_tenant_id ON public.cta_configurations (tenant_id);
CREATE INDEX idx_cta_configurations_tenant_sort ON public.cta_configurations (tenant_id, sort_order);
CREATE TRIGGER set_cta_configurations_updated_at
  BEFORE UPDATE ON public.cta_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. Theme Configurations
CREATE TABLE public.theme_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  tokens_json jsonb NOT NULL DEFAULT '{
    "primaryColor": "#2563eb",
    "primaryForeground": "#ffffff",
    "accentColor": "#f59e0b",
    "accentForeground": "#000000",
    "backgroundColor": "#ffffff",
    "foregroundColor": "#0f172a",
    "borderRadius": "0.5rem",
    "fontFamily": "Inter"
  }',
  layout_variant text NOT NULL DEFAULT 'standard',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.theme_configurations
  FOR ALL TO authenticated
  USING (tenant_id = (select auth.tenant_id()))
  WITH CHECK (tenant_id = (select auth.tenant_id()));

CREATE POLICY "Public read" ON public.theme_configurations
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active'
  ));

CREATE TRIGGER set_theme_configurations_updated_at
  BEFORE UPDATE ON public.theme_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. Analytics Events (no updated_at -- events are immutable)
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  qr_id uuid REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'page_view', 'save_contact', 'brochure_click', 'product_click',
    'form_submit', 'share_click', 'whatsapp_click', 'cta_click',
    'scroll_depth', 'send_to_self'
  )),
  session_id text,
  user_agent_hash text,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant reads own" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (tenant_id = (select auth.tenant_id()));

-- Anonymous writes via service role only (analytics beacon endpoint)
-- No anon INSERT policy -- service role handles this

CREATE INDEX idx_analytics_events_tenant_id ON public.analytics_events (tenant_id);
CREATE INDEX idx_analytics_events_tenant_created ON public.analytics_events (tenant_id, created_at);
CREATE INDEX idx_analytics_events_tenant_type ON public.analytics_events (tenant_id, event_type);

-- ============================================
-- AUTH HOOK: Custom Access Token
-- ============================================
-- Injects tenant_id into JWT app_metadata claims so that
-- auth.tenant_id() can read it for RLS policy evaluation.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_tenant_id uuid;
BEGIN
  claims := event->'claims';

  SELECT tenant_id INTO user_tenant_id
  FROM public.users
  WHERE id = (claims->>'sub')::uuid;

  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata, tenant_id}',
      to_jsonb(user_tenant_id::text)
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant auth admin permission to call the hook and read users
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT SELECT ON TABLE public.users TO supabase_auth_admin;

-- ============================================
-- SIGNUP TRIGGER: Auto-create tenant on signup
-- ============================================
-- SECURITY DEFINER: runs with function owner's privileges (postgres)
-- so it can insert into public.tenants and public.users even though
-- the new user doesn't have RLS access yet.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_tenant_id uuid;
  tenant_slug text;
  base_slug text;
  reserved_slugs text[] := ARRAY[
    'admin', 'api', 'auth', 'login', 'signup', 'callback',
    'dashboard', 'settings', '_next', 'public', 'static', 'assets'
  ];
BEGIN
  -- Derive base slug from email prefix: lowercase, replace non-alphanumeric with hyphens, trim hyphens
  base_slug := trim(both '-' from lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g')));

  -- If base_slug is empty (e.g., email is @domain.com), use a fallback
  IF base_slug = '' THEN
    base_slug := 'user';
  END IF;

  tenant_slug := base_slug;

  -- Check if base slug is reserved; if so, append a random suffix
  IF base_slug = ANY(reserved_slugs) THEN
    tenant_slug := base_slug || '-' || substr(md5(random()::text), 1, 4);
  END IF;

  -- Ensure uniqueness: if slug already exists, append random suffix
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_slug) LOOP
    tenant_slug := base_slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;

  -- Create the tenant
  INSERT INTO public.tenants (name, slug, status)
  VALUES (split_part(NEW.email, '@', 1), tenant_slug, 'active')
  RETURNING id INTO new_tenant_id;

  -- Create the user record linked to the tenant
  INSERT INTO public.users (id, tenant_id, email, role)
  VALUES (NEW.id, new_tenant_id, NEW.email, 'admin');

  -- Update auth.users raw_app_meta_data with tenant_id for immediate JWT claims
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('tenant_id', new_tenant_id::text)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('public-assets', 'public-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('private-documents', 'private-documents', false);

-- Public assets: anyone can read, only tenant can write to their folder
CREATE POLICY "Public read public-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-assets');

CREATE POLICY "Tenant upload public-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-assets' AND
    (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );

CREATE POLICY "Tenant update public-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-assets' AND
    (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );

CREATE POLICY "Tenant delete public-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-assets' AND
    (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );

-- Private documents: tenant access only
CREATE POLICY "Tenant read private-documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-documents' AND
    (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );

CREATE POLICY "Tenant upload private-documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-documents' AND
    (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );

CREATE POLICY "Tenant update private-documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'private-documents' AND
    (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );

CREATE POLICY "Tenant delete private-documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'private-documents' AND
    (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );
