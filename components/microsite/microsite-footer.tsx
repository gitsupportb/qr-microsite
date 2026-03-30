import { Calendar, Phone, Mail, Globe } from 'lucide-react'
import type { BusinessProfile } from '@/lib/queries/microsite'

interface MicrositeFooterProps {
  profile: BusinessProfile
}

export function MicrositeFooter({ profile }: MicrositeFooterProps) {
  const { company_name, event_name, stand_number, phone, email, website } =
    profile

  return (
    <footer className="mt-auto border-t border-border bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg space-y-4 text-center text-sm text-muted-foreground">
        {/* Company name */}
        <p className="font-semibold text-foreground">{company_name}</p>

        {/* Event context repeated */}
        {event_name && (
          <p className="flex items-center justify-center gap-1.5 text-xs">
            <Calendar className="size-3.5" />
            <span>
              Met us at {event_name}
              {stand_number && ` - Stand ${stand_number}`}
            </span>
          </p>
        )}

        {/* Visit date placeholder -- Plan 02 will add client-side EventFooter component */}
        <span id="visit-date" />

        {/* Business contact details (non-interactive text) */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="size-3" />
              {phone}
            </span>
          )}
          {email && (
            <span className="flex items-center gap-1">
              <Mail className="size-3" />
              {email}
            </span>
          )}
          {website && (
            <span className="flex items-center gap-1">
              <Globe className="size-3" />
              {website.replace(/^https?:\/\//, '')}
            </span>
          )}
        </div>

        {/* Platform attribution */}
        <p className="pt-2 text-[10px] text-muted-foreground/50">
          Powered by QR Microsite Platform
        </p>
      </div>
    </footer>
  )
}
