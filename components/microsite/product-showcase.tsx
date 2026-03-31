import type { ProductWithCategory } from '@/lib/queries/microsite'
import { ProductFilter } from '@/components/microsite/product-filter'

interface ProductShowcaseProps {
  products: ProductWithCategory[]
  tenantId?: string
  businessProfileId?: string
}

/**
 * Server Component wrapper for the product showcase section.
 * Filters to visible products, sorts featured-first then by sort_order,
 * extracts unique categories, and passes data to the client filter component.
 * Returns null when no visible products exist (hides section entirely).
 */
export function ProductShowcase({ products, tenantId, businessProfileId }: ProductShowcaseProps) {
  // Filter to visible products only and sort: featured first, then by sort_order
  const visibleProducts = products
    .filter((p) => p.visible)
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1
      }
      return a.sort_order - b.sort_order
    })

  // No visible products -- hide section entirely (no empty state for visitors)
  if (visibleProducts.length === 0) {
    return null
  }

  // Extract unique categories from the visible products (deduplicate by category id)
  const categoryMap = new Map<string, { id: string; name: string; slug: string }>()
  for (const product of visibleProducts) {
    if (product.product_categories && product.category_id) {
      categoryMap.set(product.category_id, {
        id: product.product_categories.id,
        name: product.product_categories.name,
        slug: product.product_categories.slug,
      })
    }
  }
  const categories = Array.from(categoryMap.values())

  return (
    <section id="products" className="px-5 sm:px-8" aria-label="Products">
      <div className="mx-auto max-w-xl border-t border-[var(--foreground)]/5 py-8">
        <p className="mb-5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Products
        </p>
        <ProductFilter products={visibleProducts} categories={categories} tenantId={tenantId} businessProfileId={businessProfileId} />
      </div>
    </section>
  )
}
