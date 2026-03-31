'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package, X, Download, FileText } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import type { ProductWithCategory } from '@/lib/queries/microsite'
import type { Database } from '@/lib/supabase/types'

type DocumentRow = Database['public']['Tables']['documents']['Row']

interface ProductFilterProps {
  products: ProductWithCategory[]
  categories: Array<{ id: string; name: string; slug: string }>
  tenantId?: string
  businessProfileId?: string
  documents?: (DocumentRow & { downloadUrl?: string | null })[]
}

export function ProductFilter({ products, categories, tenantId, businessProfileId, documents = [] }: ProductFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null)

  const filteredProducts = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products

  // Get documents linked to the selected product
  const productDocs = selectedProduct
    ? documents.filter((d) => d.product_id === selectedProduct.id)
    : []

  return (
    <div>
      {/* Category filter tabs */}
      {categories.length > 0 && (
        <div
          className="mb-6 flex gap-4 overflow-x-auto border-b border-[var(--foreground)]/5 pb-px"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
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
      )}

      {/* Product card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            className="group relative overflow-hidden rounded-lg text-left ring-1 ring-[var(--foreground)]/5 transition-shadow hover:ring-[var(--foreground)]/10 hover:shadow-sm"
            onClick={() => {
              setSelectedProduct(product)
              if (tenantId) {
                trackEvent('product_click', tenantId, { businessProfileId, metadata: { product_id: product.id, product_title: product.title } })
              }
            }}
          >
            {product.featured && (
              <div className="absolute inset-y-0 left-0 z-10 w-0.5 bg-[var(--primary)]" />
            )}

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

            <div className="p-3">
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
          </button>
        ))}
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null) }}
        >
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-[var(--background)] sm:max-w-lg sm:rounded-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-[var(--foreground)]/5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/10"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* Product image */}
            {selectedProduct.image_url && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-[var(--foreground)]/[0.02]">
                <Image
                  src={selectedProduct.image_url}
                  alt={selectedProduct.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              </div>
            )}

            <div className="p-5 sm:p-6">
              {/* Category */}
              {selectedProduct.product_categories && (
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--primary)]">
                  {selectedProduct.product_categories.name}
                </p>
              )}

              {/* Title */}
              <h3 className="text-xl font-bold leading-tight text-[var(--foreground)]">
                {selectedProduct.title}
              </h3>

              {/* Short description */}
              {selectedProduct.short_description && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {selectedProduct.short_description}
                </p>
              )}

              {/* Long description */}
              {selectedProduct.long_description && (
                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/80">
                  {selectedProduct.long_description}
                </p>
              )}

              {/* Linked documents */}
              {productDocs.length > 0 && (
                <div className="mt-5 border-t border-[var(--foreground)]/5 pt-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Documents
                  </p>
                  <div className="space-y-2">
                    {productDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.downloadUrl || doc.file_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-lg bg-[var(--foreground)]/[0.03] px-3 py-2.5 text-sm transition-colors hover:bg-[var(--foreground)]/[0.06]"
                      >
                        <FileText className="size-4 shrink-0 text-[var(--primary)]" />
                        <span className="min-w-0 flex-1 font-medium text-[var(--foreground)]">{doc.title}</span>
                        <Download className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* All documents link if no product-specific docs */}
              {productDocs.length === 0 && documents.length > 0 && (
                <div className="mt-5 border-t border-[var(--foreground)]/5 pt-4">
                  <a
                    href="#catalog"
                    onClick={() => setSelectedProduct(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)]"
                  >
                    <FileText className="size-3.5" />
                    View all documents
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
