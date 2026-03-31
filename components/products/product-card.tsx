'use client'

import {
  Package,
  Pencil,
  Archive,
  ArchiveRestore,
  ChevronUp,
  ChevronDown,
  Star,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase/types'
import { useState } from 'react'

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: { name: string; slug: string } | null
}

interface ProductCardProps {
  product: Product
  isFirst: boolean
  isLast: boolean
  onEdit: (product: Product) => void
  onArchive: (productId: string) => void
  onRestore: (productId: string) => void
  onReorder: (productId: string, direction: 'up' | 'down') => void
  isPending: boolean
}

export function ProductCard({
  product,
  isFirst,
  isLast,
  onEdit,
  onArchive,
  onRestore,
  onReorder,
  isPending,
}: ProductCardProps) {
  const [confirmArchive, setConfirmArchive] = useState(false)
  const isArchived = !product.visible

  const handleArchiveClick = () => {
    if (isArchived) {
      // Restore immediately, no confirmation needed
      onRestore(product.id)
      return
    }
    if (confirmArchive) {
      onArchive(product.id)
      setConfirmArchive(false)
    } else {
      setConfirmArchive(true)
      // Reset confirmation state after 3 seconds
      setTimeout(() => setConfirmArchive(false), 3000)
    }
  }

  return (
    <Card className={isArchived ? 'opacity-60' : undefined}>
      <CardContent className="flex items-start gap-4 p-4">
        {/* Product image or placeholder */}
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Info section */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">
              {product.title}
            </h3>
            {product.featured && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-yellow-100 text-yellow-800"
              >
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
            {isArchived && (
              <Badge variant="outline" className="shrink-0">
                Archived
              </Badge>
            )}
          </div>

          {product.short_description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {product.short_description}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap gap-2">
            {product.product_categories?.name && (
              <Badge variant="secondary" className="text-xs">
                {product.product_categories.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Sort buttons (only for visible products) */}
          {!isArchived && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReorder(product.id, 'up')}
                disabled={isFirst || isPending}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReorder(product.id, 'down')}
                disabled={isLast || isPending}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Edit button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(product)}
            disabled={isPending}
            aria-label="Edit product"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Archive/Restore button */}
          <Button
            type="button"
            variant={confirmArchive ? 'destructive' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={handleArchiveClick}
            disabled={isPending}
            aria-label={
              isArchived
                ? 'Restore product'
                : confirmArchive
                  ? 'Confirm archive'
                  : 'Archive product'
            }
          >
            {isArchived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
