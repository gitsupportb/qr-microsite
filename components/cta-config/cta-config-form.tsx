'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ctaConfigurationSchema,
  type CtaConfigurationFormValues,
  CTA_TYPE_OPTIONS,
  CTA_TYPES_NEEDING_DESTINATION,
  CTA_DESTINATION_HINTS,
  type CtaType,
} from '@/lib/schemas/cta-configuration'
import { upsertCtaConfiguration } from '@/lib/actions/cta-configuration'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/types'

const CTA_TEMPLATES = [
  { type: 'save_contact' as const, label: 'Save Contact' },
  { type: 'whatsapp' as const, label: 'Chat on WhatsApp' },
  { type: 'call' as const, label: 'Call Us' },
  { type: 'website' as const, label: 'Visit Website' },
  { type: 'get_catalog' as const, label: 'Get Catalog' },
  { type: 'book_meeting' as const, label: 'Book Meeting' },
] as const

type CtaConfigurationRow =
  Database['public']['Tables']['cta_configurations']['Row']

interface CtaConfigFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: CtaConfigurationRow | null
  onSuccess: () => void
}

export function CtaConfigForm({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: CtaConfigFormProps) {
  const isEditMode = !!initialData
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CtaConfigurationFormValues>({
    resolver: zodResolver(ctaConfigurationSchema),
    defaultValues: {
      type: 'save_contact',
      label: '',
      destination: '',
      enabled: true,
    },
  })

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open && initialData) {
      reset({
        type: initialData.type,
        label: initialData.label,
        destination: initialData.destination ?? '',
        enabled: initialData.enabled,
      })
    } else if (open && !initialData) {
      reset({
        type: 'save_contact',
        label: '',
        destination: '',
        enabled: true,
      })
    }
  }, [open, initialData, reset])

  const selectedType = watch('type') as CtaType
  const needsDestination = CTA_TYPES_NEEDING_DESTINATION.has(selectedType)
  const destinationHint = CTA_DESTINATION_HINTS[selectedType]

  const onSubmit = (data: CtaConfigurationFormValues) => {
    startTransition(async () => {
      const result = await upsertCtaConfiguration(
        initialData?.id ?? null,
        { ...data, enabled: data.enabled ?? true }
      )
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(
          isEditMode
            ? 'CTA button updated successfully'
            : 'CTA button added successfully'
        )
        onSuccess()
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit CTA Button' : 'Add CTA Button'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the CTA button configuration below.'
              : 'Configure a new action button for your sticky CTA bar.'}
          </DialogDescription>
        </DialogHeader>

        {!isEditMode && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quick Add
            </Label>
            <div className="flex flex-wrap gap-2">
              {CTA_TEMPLATES.map((template) => (
                <Button
                  key={template.type}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    reset({
                      type: template.type,
                      label: template.label,
                      destination: '',
                      enabled: true,
                    })
                  }}
                >
                  {template.label}
                </Button>
              ))}
            </div>
            <Separator />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta-type">Type *</Label>
            <select
              id="cta-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('type')}
            >
              {CTA_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-label">Label *</Label>
            <Input
              id="cta-label"
              placeholder="Button text (max 50 characters)"
              maxLength={50}
              {...register('label')}
            />
            {errors.label && (
              <p className="text-sm text-red-600">{errors.label.message}</p>
            )}
          </div>

          {needsDestination && (
            <div className="space-y-2">
              <Label htmlFor="cta-destination">Destination *</Label>
              <Input
                id="cta-destination"
                placeholder={destinationHint ?? 'URL or address'}
                {...register('destination')}
              />
              <p className="text-xs text-muted-foreground">
                {selectedType === 'call' || selectedType === 'whatsapp'
                  ? 'Phone number with country code'
                  : selectedType === 'email'
                    ? 'Email address'
                    : 'Full URL including https://'}
              </p>
              {errors.destination && (
                <p className="text-sm text-red-600">
                  {errors.destination.message}
                </p>
              )}
            </div>
          )}

          {!needsDestination && (
            <p className="text-xs text-muted-foreground">
              This action type does not require a destination URL.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  id="cta-enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="cta-enabled">Enabled</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Add CTA Button'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
