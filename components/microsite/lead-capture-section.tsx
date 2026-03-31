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
      className="px-5 sm:px-8"
      aria-label="Contact form"
    >
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/25 p-5 shadow-lg shadow-black/[0.04]">
          <p className="mb-1 text-[0.6875rem] uppercase tracking-[0.1em] text-slate-400 font-medium">
            Contact
          </p>
          <h2 className="mb-1 text-base font-semibold tracking-tight text-slate-800">
            {ctaText}
          </h2>
          <p className="mb-5 text-sm text-slate-500">
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
      </div>
    </section>
  )
}
