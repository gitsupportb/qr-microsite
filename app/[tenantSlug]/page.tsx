import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import { getMicrositeData } from '@/lib/queries/microsite'
import { themeConfigSchema } from '@/lib/schemas/theme'
import { HeroSection } from '@/components/microsite/hero-section'
import { AboutSection } from '@/components/microsite/about-section'
import { TrustSection } from '@/components/microsite/trust-section'
import { RepresentativesSection } from '@/components/microsite/representatives-section'
import { ProductShowcase } from '@/components/microsite/product-showcase'
import { DocumentSection } from '@/components/microsite/document-section'
import { LeadCaptureSection } from '@/components/microsite/lead-capture-section'
import { LeadCaptureSheet } from '@/components/microsite/lead-capture-sheet'
import { MicrositeFooter } from '@/components/microsite/microsite-footer'
import { StickyCtaBar } from '@/components/microsite/sticky-cta-bar'
import { CommunicationButtons } from '@/components/microsite/communication-buttons'
import { ShareButton } from '@/components/microsite/share-button'
import { PageViewTracker } from '@/components/microsite/page-view-tracker'

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

  // Extract unique product categories for lead form interest dropdown
  const categories = [
    ...new Map(
      (profile.products ?? [])
        .filter((p): p is typeof p & { product_categories: NonNullable<typeof p.product_categories> } => p.product_categories != null)
        .map((p) => [
          p.product_categories.id,
          { id: p.product_categories.id, name: p.product_categories.name },
        ])
    ).values(),
  ]

  // Extract section order from theme config
  const themeRow = tenant.theme_configurations?.[0]
  const themeResult = themeConfigSchema.safeParse(themeRow?.tokens_json)
  const sectionOrder = themeResult.success
    ? themeResult.data.sectionOrder
    : themeConfigSchema.parse({}).sectionOrder

  // Map section IDs to their JSX components
  const sectionMap: Record<string, React.ReactNode> = {
    hero: <HeroSection profile={profile} />,
    communication: (
      <CommunicationButtons
        profile={profile}
        channelsConfig={
          profile.comm_channels_enabled as
            | Record<string, boolean>
            | undefined
        }
        tenantId={tenant.id}
        businessProfileId={profile.id}
      />
    ),
    products: <ProductShowcase products={profile.products ?? []} tenantId={tenant.id} businessProfileId={profile.id} />,
    about: <AboutSection aboutContent={profile.about_content} />,
    trust: <TrustSection trustContent={profile.trust_content} />,
    documents: (
      <DocumentSection
        documents={profile.documents ?? []}
        tenantSlug={tenantSlug}
        tenantId={tenant.id}
        businessProfileId={profile.id}
      />
    ),
    'lead-capture': (
      <LeadCaptureSection
        tenantId={tenant.id}
        businessProfileId={profile.id}
        tenantSlug={tenantSlug}
        eventName={profile.event_name}
        categories={categories}
      />
    ),
    representatives: (
      <RepresentativesSection reps={reps} tenantSlug={tenantSlug} />
    ),
    share: (
      <ShareButton
        companyName={profile.company_name}
        tagline={profile.tagline}
        tenantSlug={tenantSlug}
        tenantId={tenant.id}
        businessProfileId={profile.id}
      />
    ),
    footer: <MicrositeFooter profile={profile} />,
  }

  return (
    <main role="main" className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
      {sectionOrder.map((sectionId) => (
        <Fragment key={sectionId}>{sectionMap[sectionId]}</Fragment>
      ))}

      {/* Fixed/overlay elements -- always rendered regardless of section order */}
      <StickyCtaBar
        ctas={ctas.map((c) => ({
          type: c.type,
          label: c.label,
          destination: c.destination,
        }))}
        tenantSlug={tenantSlug}
        companyName={profile.company_name}
        tagline={profile.tagline}
        tenantId={tenant.id}
        businessProfileId={profile.id}
      />

      <LeadCaptureSheet
        tenantId={tenant.id}
        businessProfileId={profile.id}
        tenantSlug={tenantSlug}
        eventName={profile.event_name}
        categories={categories}
      />

      <PageViewTracker
        tenantId={tenant.id}
        businessProfileId={profile.id}
        pageSlug={tenantSlug}
      />
    </main>
  )
}
