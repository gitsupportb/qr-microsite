'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  documentSchema,
  type DocumentFormValues,
} from '@/lib/schemas/document'
import { uploadDocument } from '@/lib/supabase/storage'
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
import { FileText, Upload, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { toast } from 'sonner'

type Document = Database['public']['Tables']['documents']['Row'] & {
  products: { id: string; title: string } | null
}

interface DocumentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: Document | null
  tenantId: string
  products: { id: string; name: string }[]
  onSave: (data: DocumentFormValues) => void
  isPending: boolean
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'catalog', label: 'Catalog' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'datasheet', label: 'Datasheet' },
  { value: 'certification', label: 'Certification' },
  { value: 'pricing_sheet', label: 'Pricing Sheet' },
  { value: 'other', label: 'Other' },
] as const

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'gated', label: 'Gated' },
] as const

export function DocumentForm({
  open,
  onOpenChange,
  initialData,
  tenantId,
  products,
  onSave,
  isPending,
}: DocumentFormProps) {
  const isEditMode = initialData !== null
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      type: 'brochure',
      visibility: 'public',
      file_url: '',
      storage_path: null,
      product_id: null,
    },
  })

  // Reset form when initialData changes or dialog opens/closes
  useEffect(() => {
    if (open && initialData) {
      reset({
        title: initialData.title,
        type: initialData.type,
        visibility: initialData.visibility,
        file_url: initialData.file_url ?? '',
        storage_path: initialData.storage_path ?? null,
        product_id: initialData.product_id ?? null,
      })
    } else if (open && !initialData) {
      reset({
        title: '',
        type: 'brochure',
        visibility: 'public',
        file_url: '',
        storage_path: null,
        product_id: null,
      })
    }
  }, [open, initialData, reset])

  const onSubmit = (data: DocumentFormValues) => {
    onSave(data)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const result = await uploadDocument(
      tenantId,
      file,
      isEditMode && initialData?.storage_path
        ? initialData.storage_path
        : undefined
    )
    setIsUploading(false)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    setValue('file_url', result.fileUrl)
    setValue('storage_path', result.storagePath)
    toast.success('PDF uploaded successfully')
  }

  const typeValue = watch('type')
  const visibilityValue = watch('visibility')
  const productIdValue = watch('product_id')
  const fileUrlValue = watch('file_url')

  const isBusy = isPending || isUploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Document' : 'Add Document'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the document details below.'
              : 'Fill in the details to add a new document.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="document-title">Title *</Label>
            <Input
              id="document-title"
              placeholder="Document name"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="document-type">Type</Label>
            <Select
              value={typeValue ?? 'brochure'}
              onValueChange={(value) =>
                setValue(
                  'type',
                  value as DocumentFormValues['type']
                )
              }
            >
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="document-visibility">Visibility</Label>
            <Select
              value={visibilityValue ?? 'public'}
              onValueChange={(value) =>
                setValue(
                  'visibility',
                  value as DocumentFormValues['visibility']
                )
              }
            >
              <SelectTrigger id="document-visibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Public: anyone can download. Private: admin only. Gated: requires
              lead form (coming soon).
            </p>
          </div>

          {/* Product assignment */}
          <div className="space-y-2">
            <Label htmlFor="document-product">Assign to Product</Label>
            <Select
              value={productIdValue ?? 'none'}
              onValueChange={(value) =>
                setValue('product_id', value === 'none' ? null : value)
              }
            >
              <SelectTrigger id="document-product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Business Profile)</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label>PDF File</Label>
            <div className="flex items-center gap-3">
              {fileUrlValue ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">PDF uploaded</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>No file uploaded</span>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {fileUrlValue ? 'Replace PDF' : 'Upload PDF'}
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isPending
                ? 'Saving...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Add Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
