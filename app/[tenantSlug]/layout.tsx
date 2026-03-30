import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMicrositeData } from '@/lib/queries/microsite'

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenantSlug } = await params
  const tenant = await getMicrositeData(tenantSlug)

  if (!tenant) {
    notFound()
  }

  return (
    <div data-tenant-id={tenant.id} data-tenant-slug={tenant.slug}>
      {children}
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}): Promise<Metadata> {
  const { tenantSlug } = await params
  const tenant = await getMicrositeData(tenantSlug)

  if (!tenant) {
    return { title: 'Not Found' }
  }

  const profile = tenant.business_profiles?.[0]
  const title = profile?.company_name ?? tenant.name
  const description =
    profile?.tagline ?? `Visit ${tenant.name}'s microsite`

  // Prefer hero image for OG; fallback to logo
  const ogImage = profile?.hero_image_url ?? profile?.logo_url ?? null
  const hasHeroImage = !!profile?.hero_image_url

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    ),
    title,
    description,
    alternates: {
      canonical: `/${tenantSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `/${tenantSlug}`,
      siteName: title,
      type: 'website',
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: `${title} - event microsite`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: hasHeroImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage
        ? {
            images: [ogImage],
          }
        : {}),
    },
  }
}
