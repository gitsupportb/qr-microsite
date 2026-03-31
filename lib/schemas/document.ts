import { z } from 'zod'

export const documentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  type: z.enum([
    'catalog',
    'brochure',
    'datasheet',
    'certification',
    'pricing_sheet',
    'other',
  ]),
  file_url: z.string().url().optional().nullable().or(z.literal('')),
  storage_path: z.string().optional().nullable(),
  visibility: z
    .enum(['public', 'private', 'gated'])
    .default('public'),
  product_id: z.string().uuid().optional().nullable(),
})

export type DocumentInput = z.infer<typeof documentSchema>
export type DocumentFormValues = z.input<typeof documentSchema>
