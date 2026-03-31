import type { ProductWithCategory } from '@/lib/queries/microsite'
import type { Database } from '@/lib/supabase/types'
import { ProductFilter } from '@/components/microsite/product-filter'

type DocumentRow = Database['public']['Tables']['documents']['Row']

interface ProductShowcaseProps {
  products: ProductWithCategory[]
  tenantId?: string
  businessProfileId?: string
  documents?: (DocumentRow & { downloadUrl?: string | null })[]
}

export function ProductShowcase({ products, tenantId, businessProfileId, documents = [] }: ProductShowcaseProps) {
  const visibleProducts = products
    .filter((p) => p.visible)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return a.sort_order - b.sort_order
    })

  if (visibleProducts.length === 0) return null

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

  return (
    <section id="products" className="px-5 sm:px-8" aria-label="Products">
      <div className="mx-auto max-w-xl border-t border-[var(--foreground)]/5 py-8">
        <p className="mb-5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Products
        </p>
        <ProductFilter
          products={visibleProducts}
          categories={Array.from(categoryMap.values())}
          tenantId={tenantId}
          businessProfileId={businessProfileId}
          documents={documents}
        />
      </div>
    </section>
  )
}
