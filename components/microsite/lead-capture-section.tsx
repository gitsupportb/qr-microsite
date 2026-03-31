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
      className="bg-muted/30 px-4 py-8 sm:px-6"
      aria-label="Contact form"
    >
      <div className="mx-auto max-w-lg">
        <h2 className="mb-1 text-xl font-bold sm:text-2xl">{ctaText}</h2>
        <p className="mb-6 text-sm text-muted-foreground">
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
