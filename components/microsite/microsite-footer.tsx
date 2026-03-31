import { Calendar, Phone, Mail, Globe } from 'lucide-react'
import type { BusinessProfile } from '@/lib/queries/microsite'
import { EventFooter } from '@/components/microsite/event-footer'

interface MicrositeFooterProps {
  profile: BusinessProfile
}

export function MicrositeFooter({ profile }: MicrositeFooterProps) {
  const { company_name, event_name, stand_number, phone, email, website } =
    profile

  return (
    <footer className="mt-auto border-t border-[var(--foreground)]/5 px-5 sm:px-8">
      <div className="mx-auto max-w-xl py-6">
        <div className="space-y-2">
          {/* Company name */}
          <p className="text-sm font-medium text-[var(--foreground)]">
            {company_name}
          </p>

          {/* Event context + contact in a compact block */}
          <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
            {event_name && (
              <p className="flex items-center gap-1.5">
                <Calendar className="size-3 shrink-0" />
                <span>
                  {event_name}
                  {stand_number && ` \u00b7 Stand ${stand_number}`}
                </span>
              </p>
            )}

            {/* Client-side visit date */}
            <EventFooter />

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3 shrink-0" />
                  {phone}
                </span>
              )}
              {email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3 shrink-0" />
                  {email}
                </span>
              )}
              {website && (
                <span className="flex items-center gap-1">
                  <Globe className="size-3 shrink-0" />
                  {website.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Platform attribution */}
        <p className="mt-4 text-[10px] text-[var(--muted-foreground)]/40">
          Powered by QR Microsite Platform
        </p>
      </div>
    </footer>
  )
}
