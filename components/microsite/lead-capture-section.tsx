'use client'

import { LeadCaptureForm } from '@/components/microsite/lead-capture-form'

interface LeadCaptureSectionProps {
  tenantId: string
  businessProfileId: string
  tenantSlug: string
  eventName?: string | null
  categories?: { id: string; name: string }[]
  ctaText?: string
  thankYouMessage?: string
}

/**
 * Inline lead capture section rendered directly on the microsite page.
 * Wraps LeadCaptureForm in a styled section with id="lead-capture" for anchor linking.
 */
export function LeadCaptureSection({
  tenantId,
  businessProfileId,
  tenantSlug,
  eventName,
  categories,
  ctaText = 'Get in Touch',
  thankYouMessage,
}: LeadCaptureSectionProps) {
  return (
    <section
      id="lead-capture"
      className="bg-[var(--primary)]/[0.03] px-5 sm:px-8"
      aria-label="Contact form"
    >
      <div className="mx-auto max-w-xl py-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Contact
        </p>
        <h2 className="mb-1 text-base font-medium text-[var(--foreground)]">
          {ctaText}
        </h2>
        <p className="mb-5 text-sm text-[var(--muted-foreground)]">
          Leave your details and we&apos;ll follow up
        </p>

        <LeadCaptureForm
          tenantId={tenantId}
          businessProfileId={businessProfileId}
          tenantSlug={tenantSlug}
          eventName={eventName}
          categories={categories}
          formLocation="inline"
          ctaText={ctaText}
          thankYouMessage={thankYouMessage}
        />
      </div>
    </section>
  )
}
