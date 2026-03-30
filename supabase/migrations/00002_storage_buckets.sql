-- supabase/migrations/00002_storage_buckets.sql
-- Storage bucket configuration enhancements: file size limits and MIME type restrictions
-- Depends on: 00001_initial_schema.sql (buckets and policies already created)
--
-- 00001 created the buckets (public-assets, private-documents) and all RLS policies.
-- This migration adds file_size_limit and allowed_mime_types constraints that were
-- not set during initial bucket creation.

-- ============================================
-- PUBLIC-ASSETS BUCKET CONSTRAINTS
-- ============================================
-- public-assets: logos, product images, hero images
-- Max 5MB per file, image MIME types only

UPDATE storage.buckets
SET
  file_size_limit = 5242880,  -- 5MB max file size
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
WHERE id = 'public-assets';

-- ============================================
-- PRIVATE-DOCUMENTS BUCKET CONSTRAINTS
-- ============================================
-- private-documents: gated PDFs, brochures, internal documents
-- Max 20MB per file, document MIME types only

UPDATE storage.buckets
SET
  file_size_limit = 20971520,  -- 20MB max file size
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'private-documents';

-- ============================================
-- POLICY SUMMARY (defined in 00001_initial_schema.sql)
-- ============================================
-- public-assets:
--   SELECT: anyone (public bucket)
--   INSERT/UPDATE/DELETE: authenticated, folder = auth.tenant_id()
--
-- private-documents:
--   SELECT/INSERT/UPDATE/DELETE: authenticated, folder = auth.tenant_id()
--
-- All write policies use (storage.foldername(name))[1] = (select auth.tenant_id())::text
-- Folder structure: {tenant_id}/{entity-type}/{entity-id}/{filename}
