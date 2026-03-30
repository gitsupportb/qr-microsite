import { z } from 'zod'

export const representativeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  title: z
    .string()
    .max(200, 'Title must be 200 characters or less')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
})

export type RepresentativeInput = z.infer<typeof representativeSchema>
export type RepresentativeFormValues = z.input<typeof representativeSchema>
