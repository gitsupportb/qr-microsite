import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMicrositeData } from '@/lib/queries/microsite'
import { themeConfigSchema, type ThemeTokens } from '@/lib/schemas/theme'

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

/**
 * Convert theme tokens to CSS custom property overrides.
 * These override the Tailwind v4 variables defined in globals.css.
 * Hex values work in modern browsers -- the browser coerces between
 * color spaces (hex -> oklch) when resolving var() references.
 */
function buildThemeStyle(tokens: ThemeTokens): React.CSSProperties {
  return {
    '--primary': tokens.primaryColor,
    '--primary-foreground': tokens.primaryForeground,
    '--accent': tokens.accentColor,
    '--accent-foreground': tokens.accentForeground,
    '--background': tokens.backgroundColor,
    '--foreground': tokens.foregroundColor,
    '--radius': tokens.borderRadius,
    // Derived variables for visual consistency
    '--card': tokens.backgroundColor,
    '--card-foreground': tokens.foregroundColor,
    '--muted': tokens.backgroundColor,
    '--muted-foreground': tokens.foregroundColor,
    '--secondary': tokens.accentColor,
    '--secondary-foreground': tokens.accentForeground,
    '--popover': tokens.backgroundColor,
    '--popover-foreground': tokens.foregroundColor,
  } as React.CSSProperties
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenantSlug } = await params
  const tenant = await getMicrositeData(tenantSlug)

  if (!tenant) {
    notFound()
  }

  // Extract theme config from the joined theme_configurations row
  const themeRow = tenant.theme_configurations?.[0]
  const themeResult = themeConfigSchema.safeParse(themeRow?.tokens_json)
  const tokens = themeResult.success
    ? themeResult.data.tokens
    : themeConfigSchema.parse({}).tokens

  // Font scale class: adjusts base font size on the tenant wrapper
  const fontSizeClass =
    tokens.fontScale === 'compact'
      ? 'text-[0.9em]'
      : tokens.fontScale === 'spacious'
        ? 'text-[1.1em]'
        : ''

  return (
    <div
      data-tenant-id={tenant.id}
      data-tenant-slug={tenant.slug}
      className={fontSizeClass}
      style={buildThemeStyle(tokens)}
    >
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
