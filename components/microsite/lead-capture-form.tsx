'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** Client-side form schema: user-facing fields only (tenant/profile/source injected before fetch) */
const formSchema = z.object({
  email: z.string().email('Valid email is required'),
  full_name: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  interest_type: z.string().max(100).optional().or(z.literal('')),
  message: z.string().max(1000).optional().or(z.literal('')),
  consent: z.literal(true, { error: 'Consent is required' }),
})

type FormValues = z.infer<typeof formSchema>

interface LeadCaptureFormProps {
  tenantId: string
  businessProfileId: string
  tenantSlug: string
  eventName?: string | null
  categories?: { id: string; name: string }[]
  formLocation: 'inline' | 'scroll_sheet' | 'gated_doc_sheet'
  ctaText?: string
  thankYouMessage?: string
  onSuccess?: () => void
}

/**
 * Reusable lead capture form used in both inline section and bottom sheet.
 * Validates client-side with react-hook-form + zod, POSTs to /api/leads,
 * and shows inline thank-you message on success.
 */
export function LeadCaptureForm({
  tenantId,
  businessProfileId,
  tenantSlug,
  eventName,
  categories = [],
  formLocation,
  ctaText = 'Get in Touch',
  thankYouMessage = 'Thank you! We\'ll be in touch shortly.',
  onSuccess,
}: LeadCaptureFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      full_name: '',
      phone: '',
      company: '',
      interest_type: '',
      message: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          // Strip empty strings to undefined so API receives clean optional fields
          full_name: values.full_name || undefined,
          phone: values.phone || undefined,
          company: values.company || undefined,
          interest_type: values.interest_type || undefined,
          message: values.message || undefined,
          tenant_id: tenantId,
          business_profile_id: businessProfileId,
          source_context: {
            event_name: eventName ?? undefined,
            page_slug: tenantSlug,
            form_location: formLocation,
          },
        }),
      })

      if (response.status === 201) {
        setSubmitted(true)
        trackEvent('form_submit', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { form_location: formLocation } })
        // Call onSuccess after a 2-second delay (for sheet to close)
        if (onSuccess) {
          setTimeout(onSuccess, 2000)
        }
        return
      }

      if (response.status === 400) {
        const data = await response.json()
        // Map field-level errors from API response
        if (data.issues && Array.isArray(data.issues)) {
          for (const issue of data.issues) {
            const fieldPath = issue.path?.[0]
            if (fieldPath && fieldPath in formSchema.shape) {
              setError(fieldPath as keyof FormValues, {
                message: issue.message ?? 'Invalid value',
              })
            }
          }
        }
        return
      }

      if (response.status === 429) {
        toast.error('Too many submissions. Please try again later.')
        return
      }

      toast.error('Something went wrong. Please try again.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success state: inline thank-you message
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="size-12 text-green-500" />
        <p className="text-lg font-semibold tracking-tight text-slate-800">Submitted!</p>
        <p className="text-sm text-slate-500">{thankYouMessage}</p>
      </div>
    )
  }

  const glassInputClass = "bg-white/50 border-white/30 focus:bg-white/80 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-200"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email -- required, full width */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formLocation}-email`} className="text-slate-600">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${formLocation}-email`}
          type="email"
          placeholder="you@company.com"
          aria-invalid={!!errors.email}
          className={glassInputClass}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Full name and Phone -- 2-column on sm+ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${formLocation}-full_name`} className="text-slate-600">Full Name</Label>
          <Input
            id={`${formLocation}-full_name`}
            type="text"
            placeholder="Jane Smith"
            aria-invalid={!!errors.full_name}
            className={glassInputClass}
            {...register('full_name')}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${formLocation}-phone`} className="text-slate-600">Phone</Label>
          <Input
            id={`${formLocation}-phone`}
            type="tel"
            placeholder="+1 234 567 890"
            aria-invalid={!!errors.phone}
            className={glassInputClass}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Company -- full width */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formLocation}-company`} className="text-slate-600">Company</Label>
        <Input
          id={`${formLocation}-company`}
          type="text"
          placeholder="Acme Corp"
          aria-invalid={!!errors.company}
          className={glassInputClass}
          {...register('company')}
        />
        {errors.company && (
          <p className="text-xs text-destructive">{errors.company.message}</p>
        )}
      </div>

      {/* Interest type -- native select for mobile simplicity */}
      {categories.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor={`${formLocation}-interest_type`} className="text-slate-600">
            Interest
          </Label>
          <select
            id={`${formLocation}-interest_type`}
            className="h-8 w-full min-w-0 rounded-xl bg-white/50 border border-white/30 backdrop-blur-sm px-2.5 py-1 text-base text-slate-800 transition-all duration-200 outline-none placeholder:text-slate-400 focus:bg-white/80 focus:border-blue-500/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white/20 disabled:opacity-50 md:text-sm"
            defaultValue=""
            {...register('interest_type')}
          >
            <option value="">Select an interest...</option>
            <option value="General Inquiry">General Inquiry</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.interest_type && (
            <p className="text-xs text-destructive">
              {errors.interest_type.message}
            </p>
          )}
        </div>
      )}

      {/* Message -- textarea */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formLocation}-message`} className="text-slate-600">Message</Label>
        <Textarea
          id={`${formLocation}-message`}
          placeholder="Tell us what you're interested in..."
          rows={3}
          aria-invalid={!!errors.message}
          className={glassInputClass}
          {...register('message')}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>

      {/* Consent checkbox */}
      <div className="flex items-start gap-2">
        <input
          id={`${formLocation}-consent`}
          type="checkbox"
          className="mt-1 size-4 shrink-0 rounded border-white/30 accent-primary"
          aria-invalid={!!errors.consent}
          {...register('consent', {
            setValueAs: (v: boolean) => (v === true ? true : undefined),
          })}
        />
        <Label
          htmlFor={`${formLocation}-consent`}
          className="text-xs leading-relaxed text-slate-400"
        >
          I agree to be contacted regarding my inquiry. My information will be
          handled in accordance with the privacy policy.{' '}
          <span className="text-destructive">*</span>
        </Label>
      </div>
      {errors.consent && (
        <p className="text-xs text-destructive">{errors.consent.message}</p>
      )}

      {/* Submit button -- solid primary, not glass */}
      <Button
        type="submit"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Submitting...
          </>
        ) : (
          ctaText
        )}
      </Button>
    </form>
  )
}
