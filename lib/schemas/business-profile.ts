import { z } from 'zod'

// Sub-schemas for content sections
const textSectionSchema = (defaultTitle: string) =>
  z.object({
    title: z.string().default(defaultTitle),
    content: z.string().default(''),
  })

const tagSectionSchema = (defaultTitle: string) =>
  z.object({
    title: z.string().default(defaultTitle),
    items: z.array(z.string()).default([]),
  })

// Nested schema for about_content JSONB column (per D-15)
export const aboutContentSchema = z.object({
  about_us: textSectionSchema('About Us').default(() => ({
    title: 'About Us',
    content: '',
  })),
  why_choose_us: textSectionSchema('Why Choose Us').default(() => ({
    title: 'Why Choose Us',
    content: '',
  })),
  sectors_served: tagSectionSchema('Sectors Served').default(() => ({
    title: 'Sectors Served',
    items: [],
  })),
  certifications: tagSectionSchema('Certifications').default(() => ({
    title: 'Certifications',
    items: [],
  })),
  use_cases: tagSectionSchema('Use Cases').default(() => ({
    title: 'Use Cases',
    items: [],
  })),
})

// Schema for communication channel visibility toggles
export const commChannelsEnabledSchema = z.object({
  call: z.boolean().default(true),
  email: z.boolean().default(true),
  whatsapp: z.boolean().default(true),
  website: z.boolean().default(true),
  maps: z.boolean().default(true),
})

export type CommChannelsEnabled = z.infer<typeof commChannelsEnabledSchema>

export const businessProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be 200 characters or less'),
  tagline: z
    .string()
    .max(200, 'Tagline must be 200 characters or less')
    .optional()
    .nullable(),
  description_short: z
    .string()
    .max(500, 'Short description must be 500 characters or less')
    .optional()
    .nullable(),
  description_long: z
    .string()
    .max(5000, 'Long description must be 5000 characters or less')
    .optional()
    .nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  event_name: z.string().max(200).optional().nullable(),
  stand_number: z.string().max(50).optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
  hero_image_url: z.string().url().optional().nullable().or(z.literal('')),
  about_content: aboutContentSchema.default(() => ({
    about_us: { title: 'About Us', content: '' },
    why_choose_us: { title: 'Why Choose Us', content: '' },
    sectors_served: { title: 'Sectors Served', items: [] },
    certifications: { title: 'Certifications', items: [] },
    use_cases: { title: 'Use Cases', items: [] },
  })),
  comm_channels_enabled: commChannelsEnabledSchema.default(() => ({
    call: true,
    email: true,
    whatsapp: true,
    website: true,
    maps: true,
  })),
})

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>
export type BusinessProfileFormValues = z.input<typeof businessProfileSchema>
export type AboutContent = z.infer<typeof aboutContentSchema>
