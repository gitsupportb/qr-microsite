'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package, X, Download, FileText, Play } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import type { ProductWithCategory } from '@/lib/queries/microsite'
import type { Database } from '@/lib/supabase/types'

type DocumentRow = Database['public']['Tables']['documents']['Row']

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

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
      {/* Category filter tabs -- glass pill style */}
      {categories.length > 0 && (
        <div
          className="mb-6 flex gap-2 overflow-x-auto pb-px"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-all duration-200 ${
              activeCategory === null
                ? 'bg-white/70 backdrop-blur-sm shadow-sm border border-white/25 font-medium text-slate-800'
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/30'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-white/70 backdrop-blur-sm shadow-sm border border-white/25 font-medium text-slate-800'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Product card grid -- glass-strong */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/25 text-left shadow-lg shadow-black/[0.04] transition-all duration-300 hover:bg-white/80 hover:shadow-xl hover:shadow-black/[0.05]"
            onClick={() => {
              setSelectedProduct(product)
              if (tenantId) {
                trackEvent('product_click', tenantId, { businessProfileId, metadata: { product_id: product.id, product_title: product.title } })
              }
            }}
          >
            {product.featured && (
              <div className="absolute inset-y-0 left-0 z-10 w-0.5 bg-blue-500" />
            )}

            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-slate-100/50">
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
                  <Package className="size-8 text-slate-300" />
                </div>
              )}
            </div>

            <div className="p-3">
              {product.product_categories && (
                <p className="mb-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  {product.product_categories.name}
                </p>
              )}
              <p className="line-clamp-1 text-sm font-medium leading-snug text-slate-800">
                {product.title}
              </p>
              {product.short_description && (
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {product.short_description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Product detail modal -- glass background */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null) }}
        >
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white/80 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/[0.08] sm:max-w-lg sm:rounded-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm border border-white/30 text-slate-400 transition-all duration-200 hover:bg-white/70 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* Product image */}
            {selectedProduct.image_url && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-slate-100/50">
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
                <p className="mb-1 text-[10px] uppercase tracking-wide text-blue-600">
                  {selectedProduct.product_categories.name}
                </p>
              )}

              {/* Title */}
              <h3 className="text-xl font-semibold leading-tight tracking-tight text-slate-800">
                {selectedProduct.title}
              </h3>

              {/* Short description */}
              {selectedProduct.short_description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {selectedProduct.short_description}
                </p>
              )}

              {/* Long description */}
              {selectedProduct.long_description && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {selectedProduct.long_description}
                </p>
              )}

              {/* Video embed */}
              {selectedProduct.video_url && (() => {
                const embedUrl = getYouTubeEmbedUrl(selectedProduct.video_url!)
                if (embedUrl) {
                  return (
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/30">
                      <div className="relative aspect-video w-full">
                        <iframe
                          src={embedUrl}
                          title={`${selectedProduct.title} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    </div>
                  )
                }
                // Non-YouTube video: show as a link
                return (
                  <a
                    href={selectedProduct.video_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-2 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 px-3 py-2.5 text-sm transition-all duration-200 hover:bg-white/70"
                  >
                    <Play className="size-4 shrink-0 text-blue-600" />
                    <span className="min-w-0 flex-1 font-medium text-slate-800">Watch Video</span>
                  </a>
                )
              })()}

              {/* Linked documents */}
              {productDocs.length > 0 && (
                <div className="mt-5 border-t border-slate-200/50 pt-4">
                  <p className="mb-3 text-[0.6875rem] uppercase tracking-[0.1em] text-slate-400 font-medium">
                    Documents
                  </p>
                  <div className="space-y-2">
                    {productDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.downloadUrl || doc.file_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 px-3 py-2.5 text-sm transition-all duration-200 hover:bg-white/70"
                      >
                        <FileText className="size-4 shrink-0 text-blue-600" />
                        <span className="min-w-0 flex-1 font-medium text-slate-800">{doc.title}</span>
                        <Download className="size-3.5 shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* All documents link if no product-specific docs */}
              {productDocs.length === 0 && documents.length > 0 && (
                <div className="mt-5 border-t border-slate-200/50 pt-4">
                  <a
                    href="#catalog"
                    onClick={() => setSelectedProduct(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600"
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
