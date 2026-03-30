-- Add communication channel visibility toggles to business_profiles
-- Default '{}' means all channels enabled (backward compatible)
ALTER TABLE public.business_profiles
  ADD COLUMN comm_channels_enabled jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.business_profiles.comm_channels_enabled IS
  'Per-channel visibility toggles: { call?: bool, email?: bool, whatsapp?: bool, website?: bool, maps?: bool }. Empty object = all enabled.';
