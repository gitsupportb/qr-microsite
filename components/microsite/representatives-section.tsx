import Image from 'next/image'
import { Download, Mail, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
    <section id="contact" className="px-4 py-8 sm:px-6">
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">Your Contacts</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {reps.map((rep) => (
          <Card
            key={rep.id}
            className={
              rep.is_primary
                ? 'ring-2 ring-primary/30'
                : ''
            }
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                {/* Rep photo or initials */}
                {rep.image_url ? (
                  <Image
                    src={rep.image_url}
                    alt={`${rep.name} photo`}
                    width={56}
                    height={56}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                    {rep.name
                      .split(' ')
                      .map((n) => n.charAt(0))
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <CardTitle>
                    <h3 className="text-base font-semibold">{rep.name}</h3>
                  </CardTitle>
                  {rep.title && (
                    <CardDescription>{rep.title}</CardDescription>
                  )}
                  {rep.is_primary && (
                    <Badge variant="default" className="mt-1 text-[10px]">
                      Primary Contact
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* Save Contact vCard link */}
                <a
                  href={`/api/vcard/${rep.id}`}
                  download
                  className="inline-flex h-9 min-w-[44px] items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                  aria-label={`Save ${rep.name} contact`}
                >
                  <Download className="size-4" />
                  <span>Save Contact</span>
                </a>

                {/* WhatsApp link */}
                {rep.whatsapp && (
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(rep.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 min-w-[44px] items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm transition-colors hover:bg-muted"
                    aria-label={`WhatsApp ${rep.name}`}
                  >
                    <MessageCircle className="size-4" />
                  </a>
                )}

                {/* Email link */}
                {rep.email && (
                  <a
                    href={`mailto:${rep.email}`}
                    className="inline-flex h-9 min-w-[44px] items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm transition-colors hover:bg-muted"
                    aria-label={`Email ${rep.name}`}
                  >
                    <Mail className="size-4" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
