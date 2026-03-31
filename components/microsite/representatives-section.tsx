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
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 p-5 shadow-lg shadow-black/[0.03]">
          <p className="mb-5 text-[0.6875rem] uppercase tracking-[0.1em] text-slate-400 font-medium">
            Your Contacts
          </p>

          <div className="space-y-3">
            {reps.map((rep) => (
              <div
                key={rep.id}
                className={`flex items-center gap-3 rounded-xl bg-white/70 backdrop-blur-2xl border border-white/25 p-3 shadow-lg shadow-black/[0.04] transition-all duration-300 hover:bg-white/80 hover:shadow-xl hover:shadow-black/[0.05] ${
                  rep.is_primary ? 'ring-2 ring-blue-500/20' : ''
                }`}
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/8 border border-blue-500/10 text-sm font-medium text-blue-600">
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
                    <span className="absolute -right-0.5 -top-0.5 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white/80" />
                  )}
                </div>

                {/* Name + title */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight text-slate-800">
                    {rep.name}
                  </p>
                  {rep.title && (
                    <p className="text-xs text-slate-400">
                      {rep.title}
                    </p>
                  )}
                </div>

                {/* Action buttons as glass icon circles */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href={`/api/vcard/${rep.id}`}
                    download
                    className="flex size-9 items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm border border-white/25 shadow-sm text-slate-400 transition-all duration-200 hover:bg-white/90 hover:text-slate-600"
                    aria-label={`Save ${rep.name} contact`}
                  >
                    <Download className="size-4" />
                  </a>

                  {rep.whatsapp && (
                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber(rep.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-9 items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm border border-white/25 shadow-sm text-slate-400 transition-all duration-200 hover:bg-white/90 hover:text-slate-600"
                      aria-label={`WhatsApp ${rep.name}`}
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  )}

                  {rep.email && (
                    <a
                      href={`mailto:${rep.email}`}
                      className="flex size-9 items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm border border-white/25 shadow-sm text-slate-400 transition-all duration-200 hover:bg-white/90 hover:text-slate-600"
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
      </div>
    </section>
  )
}
