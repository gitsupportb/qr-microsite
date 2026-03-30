import { z } from 'zod'

export const ctaTypeEnum = z.enum([
  'save_contact',
  'view_products',
  'get_catalog',
  'whatsapp',
  'request_quote',
  'share',
  'book_meeting',
  'call',
  'email',
  'website',
  'maps',
])

export type CtaType = z.infer<typeof ctaTypeEnum>

/** CTA types that require a destination URL or address */
export const CTA_TYPES_NEEDING_DESTINATION = new Set<CtaType>([
  'whatsapp',
  'call',
  'email',
  'website',
  'maps',
  'book_meeting',
])

/** Human-readable labels for each CTA type */
export const CTA_TYPE_OPTIONS = [
  { value: 'save_contact', label: 'Save Contact' },
  { value: 'view_products', label: 'View Products' },
  { value: 'get_catalog', label: 'Get Catalog' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'request_quote', label: 'Request Quote' },
  { value: 'share', label: 'Share Page' },
  { value: 'book_meeting', label: 'Book Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
  { value: 'maps', label: 'Location / Maps' },
] as const satisfies readonly { value: CtaType; label: string }[]

/** Placeholder hints for destination field based on CTA type */
export const CTA_DESTINATION_HINTS: Partial<Record<CtaType, string>> = {
  whatsapp: '+971501234567',
  call: '+971501234567',
  email: 'info@company.com',
  website: 'https://company.com',
  maps: 'https://maps.google.com/...',
  book_meeting: 'https://calendly.com/...',
}

export const ctaConfigurationSchema = z.object({
  type: ctaTypeEnum,
  label: z
    .string()
    .min(1, 'Label is required')
    .max(50, 'Label must be 50 characters or less'),
  destination: z.string().optional().nullable(),
  enabled: z.boolean().default(true),
})

export type CtaConfigurationInput = z.infer<typeof ctaConfigurationSchema>
export type CtaConfigurationFormValues = z.input<typeof ctaConfigurationSchema>
