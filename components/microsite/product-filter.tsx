'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import type { ProductWithCategory } from '@/lib/queries/microsite'

interface ProductFilterProps {
  products: ProductWithCategory[]
  categories: Array<{ id: string; name: string; slug: string }>
}

/**
 * Client component for interactive product category filtering and card grid.
 * Receives pre-filtered (visible only) and pre-sorted (featured first) products
 * from the ProductShowcase Server Component parent.
 */
export function ProductFilter({ products, categories }: ProductFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Filter products by selected category (null = show all)
  const filteredProducts = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products

  return (
    <div>
      {/* Category filter chips -- horizontal scrollable */}
      {categories.length > 0 && (
        <div
          className="mb-6 flex gap-2 overflow-x-auto pb-2"
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
            {/* "All" chip -- always first */}
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>

            {/* Category chips */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product card grid -- responsive 1/2/3 columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="transition-shadow hover:shadow-md"
          >
            {/* Product image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl bg-muted">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="size-10 text-muted-foreground/40" />
                </div>
              )}

              {/* Featured badge overlay */}
              {product.featured && (
                <div className="absolute left-2 top-2">
                  <Badge variant="default" className="gap-1 text-[10px]">
                    <Star className="size-3" />
                    Featured
                  </Badge>
                </div>
              )}
            </div>

            <CardHeader>
              {/* Category badge */}
              {product.product_categories && (
                <div className="mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {product.product_categories.name}
                  </Badge>
                </div>
              )}

              <CardTitle>
                <span className="line-clamp-1 text-base font-semibold">
                  {product.title}
                </span>
              </CardTitle>

              {product.short_description && (
                <CardDescription>
                  <span className="line-clamp-2">
                    {product.short_description}
                  </span>
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
