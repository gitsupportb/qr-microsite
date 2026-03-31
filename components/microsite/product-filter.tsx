'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import type { ProductWithCategory } from '@/lib/queries/microsite'

interface ProductFilterProps {
  products: ProductWithCategory[]
  categories: Array<{ id: string; name: string; slug: string }>
  tenantId?: string
  businessProfileId?: string
}

/**
 * Client component for interactive product category filtering and card grid.
 * Receives pre-filtered (visible only) and pre-sorted (featured first) products
 * from the ProductShowcase Server Component parent.
 */
export function ProductFilter({ products, categories, tenantId, businessProfileId }: ProductFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Filter products by selected category (null = show all)
  const filteredProducts = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products

  return (
    <div>
      {/* Category filter tabs -- horizontal scrollable underlined text */}
      {categories.length > 0 && (
        <div
          className="mb-6 flex gap-4 overflow-x-auto border-b border-[var(--foreground)]/5 pb-px"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            [data-product-filters]::-webkit-scrollbar { display: none; }
          `}</style>
          <div data-product-filters="" className="contents">
            {/* "All" tab -- always first */}
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 pb-2 text-sm transition-colors ${
                activeCategory === null
                  ? 'border-b-2 border-[var(--primary)] font-medium text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              All
            </button>

            {/* Category tabs */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 pb-2 text-sm transition-colors ${
                  activeCategory === cat.id
                    ? 'border-b-2 border-[var(--primary)] font-medium text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group relative overflow-hidden rounded-lg ring-1 ring-[var(--foreground)]/5"
            onClick={() => {
              if (tenantId) {
                trackEvent('product_click', tenantId, { businessProfileId, metadata: { product_id: product.id, product_title: product.title } })
              }
            }}
          >
            {/* Featured indicator -- left edge accent bar */}
            {product.featured && (
              <div className="absolute inset-y-0 left-0 w-0.5 bg-[var(--primary)]" />
            )}

            {/* Product image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--foreground)]/[0.02]">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  loading="lazy"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="size-8 text-[var(--muted-foreground)]/30" />
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="p-3">
              {/* Category label */}
              {product.product_categories && (
                <p className="mb-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {product.product_categories.name}
                </p>
              )}

              <p className="line-clamp-1 text-sm font-medium leading-snug text-[var(--foreground)]">
                {product.title}
              </p>

              {product.short_description && (
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {product.short_description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
