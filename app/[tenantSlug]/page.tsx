import { notFound } from 'next/navigation'
import { getMicrositeData } from '@/lib/queries/microsite'
import { HeroSection } from '@/components/microsite/hero-section'
import { AboutSection } from '@/components/microsite/about-section'
import { TrustSection } from '@/components/microsite/trust-section'
import { RepresentativesSection } from '@/components/microsite/representatives-section'
import { ProductShowcase } from '@/components/microsite/product-showcase'
import { PlaceholderSection } from '@/components/microsite/placeholder-section'
import { MicrositeFooter } from '@/components/microsite/microsite-footer'
import { StickyCtaBar } from '@/components/microsite/sticky-cta-bar'
import { CommunicationButtons } from '@/components/microsite/communication-buttons'
import { ShareButton } from '@/components/microsite/share-button'

interface MicrositePageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function MicrositePage({ params }: MicrositePageProps) {
  const { tenantSlug } = await params
  const tenant = await getMicrositeData(tenantSlug)

  if (!tenant) {
    notFound()
  }

  const profile = tenant.business_profiles?.[0]

  // No business profile yet -- show setup message
  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="mt-4 text-muted-foreground">
          This microsite is being set up. Check back soon.
        </p>
      </main>
    )
  }

  // Sort representatives: primary first, then by sort_order
  const reps = [...(profile.representatives ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1
    }
    return a.sort_order - b.sort_order
  })

  // Filter enabled CTAs, sorted by sort_order, max 4
  const ctas = (profile.cta_configurations ?? [])
    .filter((cta) => cta.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 4)

  return (
    <main role="main" className="flex min-h-screen flex-col pb-20 md:pb-0">
      <HeroSection profile={profile} />

      <CommunicationButtons
        profile={profile}
        channelsConfig={
          profile.comm_channels_enabled as
            | Record<string, boolean>
            | undefined
        }
      />

      <ProductShowcase products={profile.products ?? []} />

      <AboutSection aboutContent={profile.about_content} />

      <TrustSection trustContent={profile.trust_content} />

      <PlaceholderSection id="catalog" label="Catalog" />

      <PlaceholderSection id="lead-capture" label="Get in Touch" />

      <RepresentativesSection reps={reps} tenantSlug={tenantSlug} />

      <ShareButton
        companyName={profile.company_name}
        tagline={profile.tagline}
        tenantSlug={tenantSlug}
      />

      <MicrositeFooter profile={profile} />

      <StickyCtaBar
        ctas={ctas.map((c) => ({
          type: c.type,
          label: c.label,
          destination: c.destination,
        }))}
        tenantSlug={tenantSlug}
        companyName={profile.company_name}
        tagline={profile.tagline}
      />
    </main>
  )
}
