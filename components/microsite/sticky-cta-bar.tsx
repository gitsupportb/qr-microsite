'use client'

import { useCallback } from 'react'
import {
  Download,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Share2,
  Package,
  FileText,
  MessageSquare,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'
import type { Database } from '@/lib/supabase/types'

type CtaConfigurationRow =
  Database['public']['Tables']['cta_configurations']['Row']

type CtaType = CtaConfigurationRow['type']

interface StickyCtaBarProps {
  ctas: Pick<CtaConfigurationRow, 'type' | 'label' | 'destination'>[]
  tenantSlug: string
  companyName: string
  tagline: string | null
  tenantId: string
  businessProfileId: string
}

const CTA_ICON_MAP: Record<CtaType, typeof Download> = {
  save_contact: Download,
  whatsapp: MessageCircle,
  call: Phone,
  email: Mail,
  website: Globe,
  maps: MapPin,
  share: Share2,
  view_products: Package,
  get_catalog: FileText,
  request_quote: MessageSquare,
  book_meeting: Calendar,
}

/**
 * Strip non-digit characters from a phone number for use in deep links.
 * Preserves the leading + if present.
 */
function cleanPhone(phone: string): string {
  const hasPlus = phone.startsWith('+')
  const digits = phone.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}

export function StickyCtaBar({
  ctas,
  tenantSlug,
  companyName,
  tagline,
  tenantId,
  businessProfileId,
}: StickyCtaBarProps) {
  const handleCtaAction = useCallback(
    async (type: CtaType, destination: string | null) => {
      switch (type) {
        case 'save_contact':
          trackEvent('save_contact', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { cta_label: 'Save Contact' } })
          window.location.href = `/api/vcard/business/${tenantSlug}`
          break

        case 'whatsapp': {
          trackEvent('whatsapp_click', tenantId, { businessProfileId, pageSlug: tenantSlug })
          const waPhone = destination ? cleanPhone(destination) : ''
          if (waPhone) {
            window.open(`https://wa.me/${waPhone}`, '_blank', 'noopener')
          }
          break
        }

        case 'call':
          trackEvent('cta_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { cta_type: type, cta_label: 'Call' } })
          if (destination) {
            window.open(`tel:${destination}`)
          }
          break

        case 'email':
          trackEvent('cta_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { cta_type: type, cta_label: 'Email' } })
          if (destination) {
            window.open(`mailto:${destination}`)
          }
          break

        case 'website':
        case 'maps':
        case 'book_meeting':
          trackEvent('cta_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { cta_type: type } })
          if (destination) {
            window.open(destination, '_blank', 'noopener')
          }
          break

        case 'share': {
          trackEvent('share_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { method: 'cta_bar' } })
          const shareData = {
            title: companyName,
            text: tagline || `Check out ${companyName}`,
            url: window.location.href,
          }
          if (typeof navigator !== 'undefined' && navigator.share) {
            try {
              await navigator.share(shareData)
            } catch (err) {
              if (err instanceof Error && err.name !== 'AbortError') {
                // Fallback to clipboard on share failure
                try {
                  await navigator.clipboard.writeText(window.location.href)
                  toast.success('Link copied to clipboard')
                } catch {
                  toast.error('Unable to share or copy link')
                }
              }
            }
          } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(window.location.href)
              toast.success('Link copied to clipboard')
            } catch {
              toast.error('Unable to copy link')
            }
          }
          break
        }

        case 'view_products':
          trackEvent('cta_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { cta_type: type } })
          document
            .getElementById('products')
            ?.scrollIntoView({ behavior: 'smooth' })
          break

        case 'get_catalog':
          trackEvent('cta_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { cta_type: type } })
          document
            .getElementById('catalog')
            ?.scrollIntoView({ behavior: 'smooth' })
          break

        case 'request_quote':
          trackEvent('cta_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { cta_type: type } })
          document
            .getElementById('lead-capture')
            ?.scrollIntoView({ behavior: 'smooth' })
          break
      }
    },
    [tenantSlug, companyName, tagline, tenantId, businessProfileId]
  )

  if (ctas.length === 0) {
    return null
  }

  // Use icon-only on mobile when 3+ CTAs for a tighter layout
  const useIconOnly = ctas.length >= 3

  return (
    <>
      {/* Mobile: fixed bottom bar -- refined, thinner */}
      <nav
        role="navigation"
        aria-label="Quick actions"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--foreground)]/5 bg-[var(--background)]/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-1.5">
          {ctas.map((cta) => {
            const Icon = CTA_ICON_MAP[cta.type] ?? Globe
            return (
              <button
                key={cta.type}
                type="button"
                className={`flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[var(--muted-foreground)] transition-colors active:text-[var(--foreground)] ${
                  useIconOnly ? 'px-1' : 'px-2'
                }`}
                onClick={() => handleCtaAction(cta.type, cta.destination)}
                aria-label={cta.label}
              >
                <Icon className="size-4" />
                {!useIconOnly && (
                  <span className="max-w-full truncate text-[10px]">
                    {cta.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop: inline section */}
      <nav
        role="navigation"
        aria-label="Quick actions"
        className="hidden px-5 sm:px-8 md:block"
      >
        <div className="mx-auto flex max-w-xl items-center gap-2 border-t border-[var(--foreground)]/5 py-3">
          {ctas.map((cta) => {
            const Icon = CTA_ICON_MAP[cta.type] ?? Globe
            return (
              <Button
                key={cta.type}
                variant="outline"
                className="h-9 gap-1.5 rounded-full border-[var(--foreground)]/10 px-3.5 text-xs font-medium"
                onClick={() => handleCtaAction(cta.type, cta.destination)}
                aria-label={cta.label}
              >
                <Icon className="size-3.5" />
                <span>{cta.label}</span>
              </Button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
