import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')

export const qrDesignConfigSchema = z.object({
  dotColor: hexColor.default('#000000'),
  backgroundColor: hexColor.default('#ffffff'),
  dotStyle: z
    .enum(['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'])
    .default('rounded'),
  cornerSquareStyle: z.enum(['square', 'dot', 'extra-rounded']).default('extra-rounded'),
  cornerDotStyle: z.enum(['square', 'dot']).default('dot'),
  embedLogo: z.boolean().default(true),
})

export const qrCodeSchema = z.object({
  campaign_name: z.string().max(100).optional(),
  design_config: qrDesignConfigSchema.default({
    dotColor: '#000000',
    backgroundColor: '#ffffff',
    dotStyle: 'rounded',
    cornerSquareStyle: 'extra-rounded',
    cornerDotStyle: 'dot',
    embedLogo: true,
  }),
})

export type QrDesignConfig = z.infer<typeof qrDesignConfigSchema>
export type QrCodeFormValues = z.infer<typeof qrCodeSchema>
