-- Add lead form configuration to business_profiles
-- Configurable fields, CTA text, and thank-you message for lead capture forms
ALTER TABLE public.business_profiles
  ADD COLUMN lead_form_config jsonb NOT NULL DEFAULT '{
    "fields": {
      "email": {"visible": true, "required": true},
      "full_name": {"visible": true, "required": false},
      "phone": {"visible": true, "required": false},
      "company": {"visible": true, "required": false},
      "interest_type": {"visible": true, "required": false},
      "message": {"visible": false, "required": false},
      "consent": {"visible": true, "required": true}
    },
    "cta_text": "Get in Touch",
    "thank_you_message": "Thank you! We will be in touch soon."
  }'::jsonb;

COMMENT ON COLUMN public.business_profiles.lead_form_config IS
  'Per-profile lead form configuration: field visibility/required, CTA text, thank-you message.';
