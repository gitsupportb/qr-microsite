'use client'

import { Phone, Mail, MessageCircle, Globe, MapPin } from 'lucide-react'
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
    channels.push({ key: 'call', label: 'Call', icon: Phone, href: `tel:${profile.phone}` })
  }
  if (profile.email && channelsConfig?.email !== false) {
    channels.push({ key: 'email', label: 'Email', icon: Mail, href: `mailto:${profile.email}` })
  }
  const whatsappNumber = profile.representatives?.find((r) => r.whatsapp)?.whatsapp ?? profile.phone
  if (whatsappNumber && channelsConfig?.whatsapp !== false) {
    channels.push({ key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/${cleanPhone(whatsappNumber)}`, external: true })
  }
  if (profile.website && channelsConfig?.website !== false) {
    channels.push({ key: 'website', label: 'Website', icon: Globe, href: profile.website, external: true })
  }
  if (profile.address && channelsConfig?.maps !== false) {
    channels.push({ key: 'maps', label: 'Location', icon: MapPin, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`, external: true })
  }

  if (channels.length === 0) return null

  return (
    <nav id="communication" aria-label="Contact options" className="px-5 py-5 sm:px-8">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {channels.map((ch) => {
          const Icon = ch.icon
          return (
            <button
              key={ch.key}
              type="button"
              className="group flex flex-col items-center gap-1.5 rounded-xl py-3 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground active:scale-95"
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
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/8 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="size-[1.125rem]" strokeWidth={2} />
              </span>
              <span className="text-[0.6875rem] font-medium leading-none">{ch.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
