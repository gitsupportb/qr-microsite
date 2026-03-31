import { z } from 'zod'

export const analyticsEventSchema = z.object({
  event_type: z.enum([
    'page_view',
    'save_contact',
    'brochure_click',
    'product_click',
    'form_submit',
    'share_click',
    'whatsapp_click',
    'cta_click',
    'scroll_depth',
    'send_to_self',
  ]),
  tenant_id: z.string().uuid(),
  business_profile_id: z.string().uuid().optional(),
  page_slug: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>
