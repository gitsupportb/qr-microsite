import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Tables = Database['public']['Tables']
type TenantRow = Tables['tenants']['Row']
type BusinessProfileRow = Tables['business_profiles']['Row']
type RepresentativeRow = Tables['representatives']['Row']
type CtaConfigurationRow = Tables['cta_configurations']['Row']
type ProductRow = Tables['products']['Row']
type ProductCategoryRow = Tables['product_categories']['Row']
type DocumentRow = Tables['documents']['Row']

/** Product with its category info for public display */
export type ProductWithCategory = ProductRow & {
  product_categories: Pick<ProductCategoryRow, 'id' | 'name' | 'slug'> | null
}

/** Business profile with nested representatives, CTA configurations, products, and documents */
export type BusinessProfile = BusinessProfileRow & {
  representatives: RepresentativeRow[]
  cta_configurations: CtaConfigurationRow[]
  products: ProductWithCategory[]
  documents: DocumentRow[]
}

/** Tenant with nested business profiles (PostgREST returns array for one-to-many) */
export type TenantWithProfile = Pick<TenantRow, 'id' | 'name' | 'slug'> & {
  business_profiles: BusinessProfile[]
}

/** The full microsite data shape returned by getMicrositeData */
export type MicrositeData = TenantWithProfile

/**
 * Cached Supabase query for tenant + profile + reps + CTAs.
 * Uses React cache() so multiple calls within the same render
 * (layout.tsx generateMetadata + page.tsx) are deduplicated.
 */
export const getMicrositeData = cache(
  async (tenantSlug: string): Promise<MicrositeData | null> => {
    const supabase = await createClient()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select(
        `id, name, slug,
        business_profiles(
          id, company_name, tagline, description_short, description_long,
          phone, email, website, address, event_name, stand_number,
          logo_url, hero_image_url, about_content, trust_content,
          comm_channels_enabled,
          representatives(
            id, name, title, email, phone, whatsapp, image_url,
            is_primary, sort_order
          ),
          cta_configurations(
            id, type, label, destination, enabled, sort_order
          ),
          products(
            id, title, slug, short_description, image_url,
            featured, visible, sort_order, category_id,
            product_categories(id, name, slug)
          ),
          documents(
            id, title, type, file_url, storage_path, visibility, product_id, created_at
          )
        )`
      )
      .eq('slug', tenantSlug)
      .eq('status', 'active')
      .single()

    if (error || !tenant) {
      return null
    }

    return tenant as unknown as MicrositeData
  }
)
