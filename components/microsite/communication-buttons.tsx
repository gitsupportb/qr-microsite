'use client'

import { Phone, Mail, MessageCircle, Globe, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'
import type { BusinessProfile } from '@/lib/queries/microsite'

interface CommunicationButtonsProps {
  profile: Pick<
    BusinessProfile,
    'phone' | 'email' | 'website' | 'address' | 'representatives'
  >
  channelsConfig?: {
    call?: boolean
    email?: boolean
    whatsapp?: boolean
    website?: boolean
    maps?: boolean
  }
  tenantId?: string
  businessProfileId?: string
}

/**
 * Strip non-digit characters from a phone number for use in wa.me links.
 * Preserves the leading + if present.
 */
function cleanPhone(phone: string): string {
  const hasPlus = phone.startsWith('+')
  const digits = phone.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}

interface CommChannel {
  key: string
  label: string
  icon: typeof Phone
  href: string
  external?: boolean
}

export function CommunicationButtons({
  profile,
  channelsConfig,
  tenantId,
  businessProfileId,
}: CommunicationButtonsProps) {
  const channels: CommChannel[] = []

  if (profile.phone && channelsConfig?.call !== false) {
    channels.push({
      key: 'call',
      label: 'Call',
      icon: Phone,
      href: `tel:${profile.phone}`,
    })
  }

  if (profile.email && channelsConfig?.email !== false) {
    channels.push({
      key: 'email',
      label: 'Email',
      icon: Mail,
      href: `mailto:${profile.email}`,
    })
  }

  // Check for a WhatsApp number: first from representatives, then from profile phone
  const whatsappNumber =
    profile.representatives?.find((r) => r.whatsapp)?.whatsapp ??
    profile.phone
  if (whatsappNumber && channelsConfig?.whatsapp !== false) {
    channels.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/${cleanPhone(whatsappNumber)}`,
      external: true,
    })
  }

  if (profile.website && channelsConfig?.website !== false) {
    channels.push({
      key: 'website',
      label: 'Website',
      icon: Globe,
      href: profile.website,
      external: true,
    })
  }

  if (profile.address && channelsConfig?.maps !== false) {
    channels.push({
      key: 'maps',
      label: 'Location',
      icon: MapPin,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`,
      external: true,
    })
  }

  if (channels.length === 0) {
    return null
  }

  return (
    <section id="communication" className="px-4 py-4 sm:px-6">
      <h2 className="sr-only">Contact</h2>
      <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-2">
        {channels.map((ch) => {
          const Icon = ch.icon
          return (
            <Button
              key={ch.key}
              variant="outline"
              className="flex h-11 items-center gap-2 text-sm"
              aria-label={ch.label}
              onClick={() => {
                if (tenantId) {
                  const eventType = ch.key === 'whatsapp' ? 'whatsapp_click' : 'comm_button_click' as const
                  trackEvent(eventType, tenantId, { businessProfileId, metadata: { channel: ch.key } })
                }
                if (ch.external) {
                  window.open(ch.href, '_blank', 'noopener')
                } else {
                  window.open(ch.href)
                }
              }}
            >
              <Icon className="size-4" />
              <span>{ch.label}</span>
            </Button>
          )
        })}
      </div>
    </section>
  )
}
