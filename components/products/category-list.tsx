'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryForm } from '@/components/products/category-form'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategorySortOrder,
} from '@/lib/actions/category'
import type { CategoryFormValues } from '@/lib/schemas/category'
import type { Database } from '@/lib/supabase/types'
import { toast } from 'sonner'

type Category = Database['public']['Tables']['product_categories']['Row']

interface CategoryListProps {
  initialCategories: Category[]
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleCreate = (data: CategoryFormValues) => {
    startTransition(async () => {
      const result = await createCategory(data)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Category created successfully')
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleEdit = (data: CategoryFormValues) => {
    if (!editingCategory) return
    startTransition(async () => {
      const result = await updateCategory(editingCategory.id, data)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Category updated successfully')
        setEditingCategory(null)
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleDelete = (categoryId: string) => {
    if (confirmDeleteId === categoryId) {
      startTransition(async () => {
        const result = await deleteCategory(categoryId)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('Category deleted')
          router.refresh()
        }
        setConfirmDeleteId(null)
      })
    } else {
      setConfirmDeleteId(categoryId)
      // Reset confirmation state after 3 seconds
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  const handleReorder = (categoryId: string, direction: 'up' | 'down') => {
    startTransition(async () => {
      const result = await updateCategorySortOrder(categoryId, direction)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage product categories to organize your catalog.
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Category list or empty state */}
      {initialCategories.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No categories yet. Add your first category to organize products.
          </p>
          <Button variant="outline" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {initialCategories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  /{category.slug}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {/* Sort buttons */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReorder(category.id, 'up')}
                  disabled={index === 0 || isPending}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReorder(category.id, 'down')}
                  disabled={
                    index === initialCategories.length - 1 || isPending
                  }
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* Edit button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditDialog(category)}
                  disabled={isPending}
                  aria-label="Edit category"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {/* Delete button with timed confirm */}
                <Button
                  type="button"
                  variant={
                    confirmDeleteId === category.id ? 'destructive' : 'ghost'
                  }
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(category.id)}
                  disabled={isPending}
                  aria-label={
                    confirmDeleteId === category.id
                      ? 'Confirm delete'
                      : 'Delete category'
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <CategoryForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}
        initialData={editingCategory}
        onSave={editingCategory ? handleEdit : handleCreate}
        isPending={isPending}
      />
    </div>
  )
}
