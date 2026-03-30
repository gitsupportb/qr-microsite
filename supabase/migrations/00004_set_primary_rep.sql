-- Migration: set_primary_representative RPC function
-- Atomically toggles the primary representative within a business profile.
-- Clears existing primary, then sets the specified rep as primary.
-- Uses SECURITY INVOKER to respect RLS policies.

CREATE OR REPLACE FUNCTION public.set_primary_representative(
  p_rep_id uuid,
  p_business_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Clear existing primary rep for this business profile
  UPDATE public.representatives
  SET is_primary = false
  WHERE business_profile_id = p_business_profile_id
    AND is_primary = true;

  -- Set the specified rep as primary
  UPDATE public.representatives
  SET is_primary = true
  WHERE id = p_rep_id
    AND business_profile_id = p_business_profile_id;
END;
$$;
