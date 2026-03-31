import { z } from 'zod'

export const leadSubmissionSchema = z.object({
  tenant_id: z.string().uuid(),
  business_profile_id: z.string().uuid(),
  email: z.string().email('Valid email is required'),
  full_name: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  interest_type: z.string().max(100).optional(),
  message: z.string().max(1000).optional(),
  consent: z.literal(true, { error: 'Consent is required' }),
  source_context: z.object({
    event_name: z.string().optional(),
    page_slug: z.string().optional(),
    rep_id: z.string().uuid().optional(),
    product_interest: z.string().optional(),
    form_location: z.enum(['inline', 'scroll_sheet', 'gated_doc_sheet']),
  }),
})

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>
