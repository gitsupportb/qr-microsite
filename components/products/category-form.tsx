'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  categorySchema,
  type CategoryFormValues,
} from '@/lib/schemas/category'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/lib/supabase/types'
import { useEffect } from 'react'

type Category = Database['public']['Tables']['product_categories']['Row']

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: Category | null
  onSave: (data: CategoryFormValues) => void
  isPending: boolean
}

export function CategoryForm({
  open,
  onOpenChange,
  initialData,
  onSave,
  isPending,
}: CategoryFormProps) {
  const isEditMode = initialData !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
    },
  })

  // Reset form when initialData changes or dialog opens/closes
  useEffect(() => {
    if (open && initialData) {
      reset({
        name: initialData.name,
      })
    } else if (open && !initialData) {
      reset({
        name: '',
      })
    }
  }, [open, initialData, reset])

  const onSubmit = (data: CategoryFormValues) => {
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the category name below.'
              : 'Enter a name for the new category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name *</Label>
            <Input
              id="category-name"
              placeholder="e.g., Industrial Equipment"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Add Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
