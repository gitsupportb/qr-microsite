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
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 p-5 shadow-lg shadow-black/[0.03]">
          <p className="mb-5 text-[0.6875rem] uppercase tracking-[0.1em] text-slate-400 font-medium">
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
      </div>
    </section>
  )
}
