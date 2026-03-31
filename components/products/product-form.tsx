'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  productSchema,
  type ProductFormValues,
} from '@/lib/schemas/product'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/business-profile/image-upload'
import type { Database } from '@/lib/supabase/types'
import { useEffect } from 'react'

type Product = Database['public']['Tables']['products']['Row']

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: Product | null
  tenantId: string
  categories: { id: string; name: string }[]
  onSave: (data: ProductFormValues) => void
  isPending: boolean
}

export function ProductForm({
  open,
  onOpenChange,
  initialData,
  tenantId,
  categories,
  onSave,
  isPending,
}: ProductFormProps) {
  const isEditMode = initialData !== null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      short_description: '',
      long_description: '',
      image_url: '',
      video_url: '',
      category_id: null,
      featured: false,
      visible: true,
    },
  })

  // Reset form when initialData changes or dialog opens/closes
  useEffect(() => {
    if (open && initialData) {
      reset({
        title: initialData.title,
        short_description: initialData.short_description ?? '',
        long_description: initialData.long_description ?? '',
        image_url: initialData.image_url ?? '',
        video_url: initialData.video_url ?? '',
        category_id: initialData.category_id ?? null,
        featured: initialData.featured,
        visible: initialData.visible,
      })
    } else if (open && !initialData) {
      reset({
        title: '',
        short_description: '',
        long_description: '',
        image_url: '',
        video_url: '',
        category_id: null,
        featured: false,
        visible: true,
      })
    }
  }, [open, initialData, reset])

  const onSubmit = (data: ProductFormValues) => {
    onSave(data)
  }

  const featuredValue = watch('featured')
  const categoryIdValue = watch('category_id')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the product details below.'
              : 'Fill in the details to add a new product.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-title">Title *</Label>
            <Input
              id="product-title"
              placeholder="Product name"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-short-desc">Short Description</Label>
            <Textarea
              id="product-short-desc"
              placeholder="Brief product description (max 500 characters)"
              rows={2}
              {...register('short_description')}
            />
            {errors.short_description && (
              <p className="text-sm text-red-600">
                {errors.short_description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-long-desc">Long Description</Label>
            <Textarea
              id="product-long-desc"
              placeholder="Detailed product description (max 5000 characters)"
              rows={4}
              {...register('long_description')}
            />
            {errors.long_description && (
              <p className="text-sm text-red-600">
                {errors.long_description.message}
              </p>
            )}
          </div>

          <ImageUpload
            currentUrl={watch('image_url') || null}
            tenantId={tenantId}
            category="products"
            maxSizeMB={5}
            onUploadComplete={(url) => setValue('image_url', url)}
            label="Product Image (max 5MB)"
          />

          <div className="space-y-2">
            <Label htmlFor="product-video-url">Video URL</Label>
            <Input
              id="product-video-url"
              placeholder="https://youtube.com/watch?v=..."
              {...register('video_url')}
            />
            {errors.video_url && (
              <p className="text-sm text-red-600">
                {errors.video_url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-category">Category</Label>
            <Select
              value={categoryIdValue ?? 'none'}
              onValueChange={(value) =>
                setValue('category_id', value === 'none' ? null : value)
              }
            >
              <SelectTrigger id="product-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-red-600">
                {errors.category_id.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="product-featured" className="cursor-pointer">
                Featured product
              </Label>
              <p className="text-xs text-muted-foreground">
                Featured products appear prominently on the microsite.
              </p>
            </div>
            <Switch
              id="product-featured"
              checked={featuredValue ?? false}
              onCheckedChange={(checked) => setValue('featured', checked)}
            />
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
                  : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
