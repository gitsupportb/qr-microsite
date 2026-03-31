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
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-slate-50/90 backdrop-blur-[2px]" />
        </div>
      )}

      <div className="mx-auto max-w-xl px-5 pb-8 pt-10 sm:px-8 sm:pb-12 sm:pt-14">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 p-5 shadow-lg shadow-black/[0.03]">
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
                className="size-16 shrink-0 rounded-2xl object-contain bg-white/80 backdrop-blur-sm p-1 border border-white/25 shadow-sm sm:size-[72px]"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground sm:size-[72px] sm:text-3xl">
                {company_name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 pt-0.5">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-800 sm:text-[1.875rem]">
                {company_name}
              </h1>
              {tagline && (
                <p className="mt-1 text-[0.9375rem] leading-snug text-slate-500 sm:text-base">
                  {tagline}
                </p>
              )}
            </div>
          </div>

          {/* Short description */}
          {description_short && (
            <p className="mt-5 text-[0.875rem] leading-relaxed text-slate-500/80 sm:text-[0.9375rem]">
              {description_short}
            </p>
          )}

          {/* Event context badge */}
          {event_name && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-sm border border-blue-500/15 px-4 py-2 text-[0.8125rem] font-medium text-blue-600">
              <Calendar className="size-3.5 shrink-0" />
              <span>
                {event_name}
                {stand_number && (
                  <span className="text-blue-600/60"> &middot; {stand_number}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
