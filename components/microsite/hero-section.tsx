import Image from 'next/image'
import { Calendar } from 'lucide-react'
import type { BusinessProfile } from '@/lib/queries/microsite'

interface HeroSectionProps {
  profile: BusinessProfile
}

export function HeroSection({ profile }: HeroSectionProps) {
  const {
    company_name,
    tagline,
    description_short,
    logo_url,
    hero_image_url,
    event_name,
    stand_number,
  } = profile

  const hasHero = !!hero_image_url

  return (
    <header id="hero-section" className="relative overflow-hidden">
      {/* Hero background image with overlay */}
      {hasHero && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={hero_image_url}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        </div>
      )}

      <div className="mx-auto max-w-xl px-5 pb-8 pt-10 sm:px-8 sm:pb-12 sm:pt-14">
        {/* Logo + Name row */}
        <div className="flex items-start gap-4">
          {logo_url ? (
            <Image
              src={logo_url}
              alt={`${company_name} logo`}
              width={72}
              height={72}
              loading="eager"
              fetchPriority="high"
              className="size-16 shrink-0 rounded-2xl object-contain bg-background/80 p-1 ring-1 ring-foreground/8 sm:size-[72px]"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground sm:size-[72px] sm:text-3xl">
              {company_name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 pt-0.5">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[1.875rem]">
              {company_name}
            </h1>
            {tagline && (
              <p className="mt-1 text-[0.9375rem] leading-snug text-muted-foreground sm:text-base">
                {tagline}
              </p>
            )}
          </div>
        </div>

        {/* Short description */}
        {description_short && (
          <p className="mt-5 text-[0.875rem] leading-relaxed text-muted-foreground/80 sm:text-[0.9375rem]">
            {description_short}
          </p>
        )}

        {/* Event context badge */}
        {event_name && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-[0.8125rem] font-medium text-primary">
            <Calendar className="size-3.5 shrink-0" />
            <span>
              {event_name}
              {stand_number && (
                <span className="text-primary/60"> &middot; {stand_number}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </header>
  )
}
