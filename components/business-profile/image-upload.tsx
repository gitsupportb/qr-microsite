'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadImage } from '@/lib/supabase/storage'
import { Button } from '@/components/ui/button'
import { Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  currentUrl: string | null
  tenantId: string
  category: 'logos' | 'hero'
  maxSizeMB: number
  onUploadComplete: (url: string) => void
  label: string
}

export function ImageUpload({
  currentUrl,
  tenantId,
  category,
  maxSizeMB,
  onUploadComplete,
  label,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Sync preview with currentUrl when it changes externally
  useEffect(() => {
    setPreview(currentUrl)
  }, [currentUrl])

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Create preview
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    const previewUrl = URL.createObjectURL(file)
    objectUrlRef.current = previewUrl
    setPreview(previewUrl)

    // Upload to Supabase Storage
    setIsUploading(true)
    const result = await uploadImage(tenantId, category, file)
    setIsUploading(false)

    if ('error' in result) {
      toast.error(result.error)
      // Revert preview on error
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setPreview(currentUrl)
    } else {
      onUploadComplete(result.publicUrl)
    }

    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPreview(null)
    onUploadComplete('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt={`${category} preview`}
            className="h-32 w-auto rounded-md border object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex h-32 w-48 items-center justify-center rounded-md border border-dashed">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Choose Image'}
        </Button>
      </div>
    </div>
  )
}
