import Image from 'next/image'
import { Download, Mail, MessageCircle } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type RepresentativeRow = Database['public']['Tables']['representatives']['Row']

interface RepresentativesSectionProps {
  reps: RepresentativeRow[]
  tenantSlug: string
}

/** Strip non-digit characters from phone for WhatsApp wa.me link (Pitfall 3) */
function cleanWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function RepresentativesSection({
  reps,
  tenantSlug,
}: RepresentativesSectionProps) {
  if (!reps || reps.length === 0) {
    return null
  }

  return (
    <section id="contact" className="px-5 sm:px-8">
      <div className="mx-auto max-w-xl border-t border-[var(--foreground)]/5 py-8">
        <p className="mb-5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Your Contacts
        </p>

        <div className="space-y-3">
          {reps.map((rep) => (
            <div
              key={rep.id}
              className="flex items-center gap-3 rounded-lg ring-1 ring-[var(--foreground)]/5 p-3"
            >
              {/* Rep photo or initials */}
              <div className="relative shrink-0">
                {rep.image_url ? (
                  <Image
                    src={rep.image_url}
                    alt={`${rep.name} photo`}
                    width={40}
                    height={40}
                    loading="lazy"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/8 text-sm font-medium text-[var(--foreground)]">
                    {rep.name
                      .split(' ')
                      .map((n) => n.charAt(0))
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                {/* Primary indicator dot */}
                {rep.is_primary && (
                  <span className="absolute -right-0.5 -top-0.5 block h-2.5 w-2.5 rounded-full bg-[var(--primary)] ring-2 ring-[var(--background)]" />
                )}
              </div>

              {/* Name + title */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-[var(--foreground)]">
                  {rep.name}
                </p>
                {rep.title && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {rep.title}
                  </p>
                )}
              </div>

              {/* Action buttons as icon-only circles */}
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={`/api/vcard/${rep.id}`}
                  download
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
                  aria-label={`Save ${rep.name} contact`}
                >
                  <Download className="size-4" />
                </a>

                {rep.whatsapp && (
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(rep.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
                    aria-label={`WhatsApp ${rep.name}`}
                  >
                    <MessageCircle className="size-4" />
                  </a>
                )}

                {rep.email && (
                  <a
                    href={`mailto:${rep.email}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
                    aria-label={`Email ${rep.name}`}
                  >
                    <Mail className="size-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
