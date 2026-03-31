import { z } from 'zod'

const fieldConfigSchema = z.object({
  visible: z.boolean(),
  required: z.boolean(),
})

export const leadFormConfigSchema = z.object({
  fields: z.object({
    email: fieldConfigSchema,
    full_name: fieldConfigSchema,
    phone: fieldConfigSchema,
    company: fieldConfigSchema,
    interest_type: fieldConfigSchema,
    message: fieldConfigSchema,
    consent: fieldConfigSchema,
  }),
  cta_text: z.string().min(1, 'CTA text is required').max(50, 'CTA text must be 50 characters or less'),
  thank_you_message: z
    .string()
    .min(1, 'Thank you message is required')
    .max(500, 'Thank you message must be 500 characters or less'),
})

export type LeadFormConfig = z.infer<typeof leadFormConfigSchema>

export const defaultLeadFormConfig: LeadFormConfig = {
  fields: {
    email: { visible: true, required: true },
    full_name: { visible: true, required: false },
    phone: { visible: true, required: false },
    company: { visible: true, required: false },
    interest_type: { visible: true, required: false },
    message: { visible: false, required: false },
    consent: { visible: true, required: true },
  },
  cta_text: 'Get in Touch',
  thank_you_message: "Thank you! We'll be in touch soon.",
}
