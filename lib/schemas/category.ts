import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  slug: z.string().max(100).optional().nullable(),
})

export type CategoryInput = z.infer<typeof categorySchema>
export type CategoryFormValues = z.input<typeof categorySchema>
