'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

      {/* Product detail modal — rendered via portal to escape parent containers */}
      {selectedProduct && typeof document !== 'undefined' && createPortal(
        <ProductModal
          product={selectedProduct}
          productDocs={productDocs}
          documents={documents}
          onClose={() => setSelectedProduct(null)}
        />,
        document.body
      )}
    </div>
  )
}

/** Modal extracted as separate component for portal rendering + body scroll lock */
function ProductModal({
  product,
  productDocs,
  documents,
  onClose,
}: {
  product: ProductWithCategory
  productDocs: (DocumentRow & { downloadUrl?: string | null })[]
  documents: (DocumentRow & { downloadUrl?: string | null })[]
  onClose: () => void
}) {
  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal scroll container */}
      <div className="fixed inset-0 z-[101] overflow-y-auto overscroll-contain">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalIn 200ms ease-out' }}
          >
            <style>{`@keyframes modalIn { from { transform: scale(0.97) translateY(8px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }`}</style>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-sm transition-colors hover:bg-black/20"
              aria-label="Close"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>

            {/* Image */}
            {product.image_url ? (
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-slate-100">
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              </div>
            ) : (
              <div className="flex aspect-[3/2] w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Package className="size-12 text-slate-300" />
              </div>
            )}

            {/* Content */}
            <div className="p-5 sm:p-6">
              {product.product_categories && (
                <span className="mb-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-blue-600">
                  {product.product_categories.name}
                </span>
              )}

              <h3 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">
                {product.title}
              </h3>

              {product.short_description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {product.short_description}
                </p>
              )}

              {product.long_description && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {product.long_description}
                  </p>
                </div>
              )}

              {/* Video */}
              {product.video_url && (() => {
                const embedUrl = getYouTubeEmbedUrl(product.video_url!)
                if (embedUrl) {
                  return (
                    <div className="mt-4 overflow-hidden rounded-lg">
                      <div className="relative aspect-video w-full bg-black">
                        <iframe
                          src={embedUrl}
                          title={`${product.title} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    </div>
                  )
                }
                return (
                  <a href={product.video_url!} target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    <Play className="size-4 text-blue-600" />
                    Watch Video
                  </a>
                )
              })()}

              {/* Documents */}
              {productDocs.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Downloads</p>
                  <div className="space-y-2">
                    {productDocs.map((doc) => (
                      <a key={doc.id} href={`/api/documents/${doc.id}`}
                        className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm hover:bg-blue-50">
                        <FileText className="size-4 shrink-0 text-blue-600" />
                        <span className="min-w-0 flex-1 font-medium text-slate-700">{doc.title}</span>
                        <Download className="size-3.5 shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {productDocs.length === 0 && documents.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <a href="#catalog" onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
                    <FileText className="size-4" />
                    View all documents
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
