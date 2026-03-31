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

      {/* Product detail modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-md sm:items-center sm:p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null) }}
        >
          <div
            className="relative max-h-[92vh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white/90 backdrop-blur-2xl border border-white/30 shadow-2xl shadow-black/20 sm:max-w-lg sm:rounded-3xl"
            style={{ animation: 'slideUp 250ms ease-out' }}
          >
            <style>{`@keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/40 text-slate-500 shadow-sm transition-all duration-200 hover:bg-white hover:text-slate-800 hover:shadow-md"
              aria-label="Close"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>

            {/* Product image */}
            {selectedProduct.image_url ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                <Image
                  src={selectedProduct.image_url}
                  alt={selectedProduct.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
                {/* Gradient fade into content */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent" />
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <Package className="size-12 text-slate-200" />
              </div>
            )}

            <div className="px-5 pb-6 pt-2 sm:px-6">
              {/* Category pill */}
              {selectedProduct.product_categories && (
                <span className="mb-2 inline-block rounded-full bg-blue-500/8 border border-blue-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-medium text-blue-600">
                  {selectedProduct.product_categories.name}
                </span>
              )}

              {/* Title */}
              <h3 className="text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                {selectedProduct.title}
              </h3>

              {/* Short description */}
              {selectedProduct.short_description && (
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-slate-500">
                  {selectedProduct.short_description}
                </p>
              )}

              {/* Long description */}
              {selectedProduct.long_description && (
                <div className="mt-4 rounded-xl bg-slate-50/80 border border-slate-100 p-4">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {selectedProduct.long_description}
                  </p>
                </div>
              )}

              {/* Video embed */}
              {selectedProduct.video_url && (() => {
                const embedUrl = getYouTubeEmbedUrl(selectedProduct.video_url!)
                if (embedUrl) {
                  return (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
                      <div className="relative aspect-video w-full bg-black">
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
                return (
                  <a
                    href={selectedProduct.video_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <Play className="size-4 shrink-0 text-blue-600" />
                    Watch Video
                  </a>
                )
              })()}

              {/* Linked documents — uses /api/documents/[id] for never-expire URLs */}
              {productDocs.length > 0 && (
                <div className="mt-5 border-t border-slate-200/60 pt-4">
                  <p className="mb-3 text-[0.6875rem] uppercase tracking-[0.12em] text-slate-400 font-medium">
                    Downloads
                  </p>
                  <div className="space-y-2">
                    {productDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={`/api/documents/${doc.id}`}
                        className="flex items-center gap-3 rounded-xl bg-slate-50/80 border border-slate-100 px-4 py-3 text-sm transition-all duration-200 hover:bg-blue-50/80 hover:border-blue-100"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/8">
                          <FileText className="size-4 text-blue-600" />
                        </span>
                        <span className="min-w-0 flex-1 font-medium text-slate-700">{doc.title}</span>
                        <Download className="size-4 shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* All documents link */}
              {productDocs.length === 0 && documents.length > 0 && (
                <div className="mt-5 border-t border-slate-200/60 pt-4">
                  <a
                    href="#catalog"
                    onClick={() => setSelectedProduct(null)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="size-4" />
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
