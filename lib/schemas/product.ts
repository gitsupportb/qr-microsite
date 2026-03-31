import { z } from 'zod'

export const productSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  slug: z.string().max(200).optional().nullable(),
  short_description: z
    .string()
    .max(500, 'Short description must be 500 characters or less')
    .optional()
    .nullable(),
  long_description: z
    .string()
    .max(5000, 'Long description must be 5000 characters or less')
    .optional()
    .nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  category_id: z.string().uuid().optional().nullable(),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>
export type ProductFormValues = z.input<typeof productSchema>
