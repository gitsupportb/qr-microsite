import { z } from 'zod'

// Hex color validator
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')

export const themeTokensSchema = z.object({
  primaryColor: hexColor.default('#2563eb'),
  primaryForeground: hexColor.default('#ffffff'),
  accentColor: hexColor.default('#f59e0b'),
  accentForeground: hexColor.default('#000000'),
  backgroundColor: hexColor.default('#ffffff'),
  foregroundColor: hexColor.default('#0f172a'),
  borderRadius: z.enum(['0rem', '0.5rem', '1rem']).default('0.5rem'),
  fontScale: z.enum(['compact', 'default', 'spacious']).default('default'),
})

export const sectionIds = [
  'hero',
  'communication',
  'products',
  'about',
  'trust',
  'documents',
  'lead-capture',
  'representatives',
  'share',
  'footer',
] as const

export const sectionOrderSchema = z
  .array(
    z.enum(sectionIds)
  )
  .default([...sectionIds])

export const themeConfigSchema = z.object({
  tokens: themeTokensSchema.default({
    primaryColor: '#2563eb',
    primaryForeground: '#ffffff',
    accentColor: '#f59e0b',
    accentForeground: '#000000',
    backgroundColor: '#ffffff',
    foregroundColor: '#0f172a',
    borderRadius: '0.5rem',
    fontScale: 'default',
  }),
  sectionOrder: sectionOrderSchema.default([...sectionIds]),
})

export type ThemeTokens = z.infer<typeof themeTokensSchema>
export type SectionOrder = z.infer<typeof sectionOrderSchema>
export type ThemeConfig = z.infer<typeof themeConfigSchema>

export const defaultThemeTokens: ThemeTokens = themeTokensSchema.parse({})
export const defaultSectionOrder: SectionOrder = sectionOrderSchema.parse(undefined)
export const defaultThemeConfig: ThemeConfig = themeConfigSchema.parse({})
