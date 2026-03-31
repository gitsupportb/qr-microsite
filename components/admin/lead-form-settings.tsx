'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  leadFormConfigSchema,
  type LeadFormConfig,
} from '@/lib/schemas/lead-form-config'
import { updateLeadFormConfig } from '@/lib/actions/lead-form-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useTransition } from 'react'
import { toast } from 'sonner'

const FIELD_LABELS: Record<keyof LeadFormConfig['fields'], string> = {
  email: 'Email',
  full_name: 'Full Name',
  phone: 'Phone',
  company: 'Company',
  interest_type: 'Interest Type',
  message: 'Message',
  consent: 'Consent',
}

// These fields must always be visible and required (per D-01)
const LOCKED_FIELDS: Array<keyof LeadFormConfig['fields']> = [
  'email',
  'consent',
]

const FIELD_ORDER: Array<keyof LeadFormConfig['fields']> = [
  'email',
  'full_name',
  'phone',
  'company',
  'interest_type',
  'message',
  'consent',
]

interface LeadFormSettingsProps {
  config: LeadFormConfig
}

export function LeadFormSettings({ config }: LeadFormSettingsProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LeadFormConfig>({
    resolver: zodResolver(leadFormConfigSchema),
    defaultValues: config,
  })

  const ctaText = watch('cta_text')
  const thankYouMessage = watch('thank_you_message')

  function onSubmit(data: LeadFormConfig) {
    startTransition(async () => {
      const result = await updateLeadFormConfig(data)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Lead form settings saved')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Form Fields */}
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-lg font-semibold">Form Fields</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Configure which fields appear on your lead capture form and which are
          required.
        </p>

        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 border-b pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Field
            </span>
            <span className="text-center text-sm font-medium text-muted-foreground">
              Visible
            </span>
            <span className="text-center text-sm font-medium text-muted-foreground">
              Required
            </span>
          </div>

          {/* Field rows */}
          {FIELD_ORDER.map((fieldKey) => {
            const isLocked = LOCKED_FIELDS.includes(fieldKey)

            return (
              <div
                key={fieldKey}
                className="grid grid-cols-[1fr_80px_80px] items-center gap-4 py-3 border-b border-border/50 last:border-b-0"
              >
                <div>
                  <Label className="text-sm font-medium">
                    {FIELD_LABELS[fieldKey]}
                  </Label>
                  {isLocked && (
                    <p className="text-xs text-muted-foreground">
                      Always visible and required
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <Controller
                    name={`fields.${fieldKey}.visible`}
                    control={control}
                    render={({ field }) => (
                      <Switch
                        size="sm"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLocked}
                      />
                    )}
                  />
                </div>

                <div className="flex justify-center">
                  <FieldRequiredSwitch
                    fieldKey={fieldKey}
                    control={control}
                    watch={watch}
                    isLocked={isLocked}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2: CTA Button Text */}
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-lg font-semibold">CTA Button Text</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The text displayed on the lead form submit button.
        </p>

        <div className="space-y-2">
          <Input
            {...register('cta_text')}
            id="cta_text"
            maxLength={50}
            placeholder="Get in Touch"
          />
          <div className="flex items-center justify-between">
            {errors.cta_text && (
              <p className="text-sm text-destructive">
                {errors.cta_text.message}
              </p>
            )}
            <p className="ml-auto text-xs text-muted-foreground">
              {ctaText?.length ?? 0}/50
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Thank You Message */}
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-lg font-semibold">Thank You Message</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The message visitors see after submitting the lead form.
        </p>

        <div className="space-y-2">
          <Textarea
            {...register('thank_you_message')}
            id="thank_you_message"
            maxLength={500}
            rows={3}
            placeholder="Thank you! We'll be in touch soon."
          />
          <div className="flex items-center justify-between">
            {errors.thank_you_message && (
              <p className="text-sm text-destructive">
                {errors.thank_you_message.message}
              </p>
            )}
            <p className="ml-auto text-xs text-muted-foreground">
              {thankYouMessage?.length ?? 0}/500
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Email Notifications */}
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-lg font-semibold">Email Notifications</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Receive an email notification whenever a new lead is submitted.
        </p>

        <div className="space-y-2">
          <Label htmlFor="notification_emails">Notification Email(s)</Label>
          <Input
            {...register('notification_emails')}
            id="notification_emails"
            maxLength={500}
            placeholder="email@example.com, another@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated email addresses. Leave empty to disable
            notifications.
          </p>
          {errors.notification_emails && (
            <p className="text-sm text-destructive">
              {errors.notification_emails.message}
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}

// Sub-component for the required switch that disables when field is not visible
function FieldRequiredSwitch({
  fieldKey,
  control,
  watch,
  isLocked,
}: {
  fieldKey: keyof LeadFormConfig['fields']
  control: ReturnType<typeof useForm<LeadFormConfig>>['control']
  watch: ReturnType<typeof useForm<LeadFormConfig>>['watch']
  isLocked: boolean
}) {
  const isVisible = watch(`fields.${fieldKey}.visible`)

  return (
    <Controller
      name={`fields.${fieldKey}.required`}
      control={control}
      render={({ field }) => (
        <Switch
          size="sm"
          checked={field.value}
          onCheckedChange={field.onChange}
          disabled={isLocked || !isVisible}
        />
      )}
    />
  )
}
