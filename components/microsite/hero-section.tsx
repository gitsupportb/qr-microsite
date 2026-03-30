import Image from 'next/image'
import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { BusinessProfile } from '@/lib/queries/microsite'

interface HeroSectionProps {
  profile: BusinessProfile
}

export function HeroSection({ profile }: HeroSectionProps) {
  const {
    company_name,
    tagline,
    logo_url,
    hero_image_url,
    event_name,
    stand_number,
  } = profile

  return (
    <header
      id="hero-section"
      className="relative flex flex-col items-center px-4 py-8 text-center sm:py-12"
    >
      {/* Hero background image */}
      {hero_image_url && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={hero_image_url}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            className="object-cover opacity-15"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
        </div>
      )}

      {/* Company logo */}
      {logo_url ? (
        <Image
          src={logo_url}
          alt={`${company_name} logo`}
          width={96}
          height={96}
          loading="eager"
          fetchPriority="high"
          className="h-20 w-20 rounded-full object-contain ring-2 ring-foreground/10 sm:h-24 sm:w-24"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground sm:h-24 sm:w-24 sm:text-4xl">
          {company_name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Company name */}
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
        {company_name}
      </h1>

      {/* Tagline */}
      {tagline && (
        <p className="mt-2 max-w-md text-base text-muted-foreground sm:text-lg">
          {tagline}
        </p>
      )}

      {/* Event context badge */}
      {event_name && (
        <Badge variant="secondary" className="mt-4 gap-1.5 px-3 py-1 text-xs">
          <Calendar className="size-3.5" />
          <span>
            Met us at {event_name}
            {stand_number && ` - Stand ${stand_number}`}
          </span>
        </Badge>
      )}
    </header>
  )
}
