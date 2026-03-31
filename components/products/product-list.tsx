'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, AlertCircle, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/products/product-card'
import { ProductForm } from '@/components/products/product-form'
import {
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  updateProductSortOrder,
} from '@/lib/actions/product'
import type { ProductFormValues, ProductInput } from '@/lib/schemas/product'
import type { Database } from '@/lib/supabase/types'
import { toast } from 'sonner'
import Link from 'next/link'

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: { name: string; slug: string } | null
}

type CategoryOption = { id: string; name: string; slug: string }

interface ProductListProps {
  initialProducts: Product[]
  categories: CategoryOption[]
  tenantId: string
  noProfile: boolean
}

type FilterValue = 'all' | 'featured' | 'archived' | string

export function ProductList({
  initialProducts,
  categories,
  tenantId,
  noProfile,
}: ProductListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')

  if (noProfile) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Business Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            Create your business profile first before adding products.
          </p>
        </div>
        <Button render={<Link href="/admin/business" />}>
          Create Business Profile
        </Button>
      </div>
    )
  }

  const handleCreate = (data: ProductFormValues) => {
    startTransition(async () => {
      const result = await createProduct(data as ProductInput)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Product created successfully')
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleEdit = (data: ProductFormValues) => {
    if (!editingProduct) return
    startTransition(async () => {
      const result = await updateProduct(editingProduct.id, data as ProductInput)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Product updated successfully')
        setEditingProduct(null)
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleArchive = (productId: string) => {
    startTransition(async () => {
      const result = await archiveProduct(productId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Product archived')
        router.refresh()
      }
    })
  }

  const handleRestore = (productId: string) => {
    startTransition(async () => {
      const result = await restoreProduct(productId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Product restored')
        router.refresh()
      }
    })
  }

  const handleReorder = (productId: string, direction: 'up' | 'down') => {
    startTransition(async () => {
      const result = await updateProductSortOrder(productId, direction)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    setDialogOpen(true)
  }

  // Filter products based on active filter
  const filteredProducts = initialProducts.filter((product) => {
    if (activeFilter === 'all') return product.visible
    if (activeFilter === 'featured') return product.visible && product.featured
    if (activeFilter === 'archived') return !product.visible
    // Category filter (uuid string)
    return product.visible && product.category_id === activeFilter
  })

  // Count helpers for filter labels
  const activeProducts = initialProducts.filter((p) => p.visible)
  const archivedCount = initialProducts.filter((p) => !p.visible).length
  const featuredCount = activeProducts.filter((p) => p.featured).length

  // Determine isFirst/isLast within visible-only products for reorder buttons
  const visibleProducts = filteredProducts.filter((p) => p.visible)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog for the microsite.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href="/admin/products/categories" />}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button onClick={openCreateDialog} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      {initialProducts.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            All ({activeProducts.length})
          </Button>
          <Button
            variant={activeFilter === 'featured' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('featured')}
          >
            Featured ({featuredCount})
          </Button>
          <Button
            variant={activeFilter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('archived')}
          >
            Archived ({archivedCount})
          </Button>
          {categories.map((cat) => {
            const count = activeProducts.filter(
              (p) => p.category_id === cat.id
            ).length
            return (
              <Button
                key={cat.id}
                variant={activeFilter === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(cat.id)}
              >
                {cat.name} ({count})
              </Button>
            )
          })}
        </div>
      )}

      {/* Product list or empty state */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {initialProducts.length === 0
              ? 'No products yet. Add your first product.'
              : 'No products match the selected filter.'}
          </p>
          {initialProducts.length === 0 && (
            <Button variant="outline" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              isFirst={index === 0}
              isLast={index === visibleProducts.length - 1}
              onEdit={openEditDialog}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onReorder={handleReorder}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <ProductForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingProduct(null)
        }}
        initialData={editingProduct}
        tenantId={tenantId}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        onSave={editingProduct ? handleEdit : handleCreate}
        isPending={isPending}
      />
    </div>
  )
}
