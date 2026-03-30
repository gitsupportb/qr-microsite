-- supabase/migrations/00003_business_profiles_unique_tenant.sql
-- Add UNIQUE constraint on business_profiles.tenant_id
-- Required for: Supabase .upsert() with onConflict: 'tenant_id'
-- Enforces: One business profile per tenant (1:1 relationship)
-- Depends on: 00001_initial_schema.sql (business_profiles table)

ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_tenant_id_unique UNIQUE (tenant_id);

-- The existing index idx_business_profiles_tenant_id is now redundant
-- since UNIQUE constraints create an implicit index, but we keep it
-- for clarity and because DROP INDEX would add migration risk.
