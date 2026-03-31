'use client'

import { useState } from 'react'
import { FileText, Pencil, Upload, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase/types'

type Document = Database['public']['Tables']['documents']['Row'] & {
  products: { id: string; title: string } | null
}

const VISIBILITY_COLORS: Record<string, string> = {
  public: 'bg-green-100 text-green-800',
  private: 'bg-gray-100 text-gray-800',
  gated: 'bg-amber-100 text-amber-800',
}

function formatTypeLabel(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface DocumentCardProps {
  document: Document
  onEdit: (document: Document) => void
  onDelete: (documentId: string) => void
  onReplace: (document: Document) => void
  isPending: boolean
}

export function DocumentCard({
  document,
  onEdit,
  onDelete,
  onReplace,
  isPending,
}: DocumentCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(document.id)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      // Reset confirmation state after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        {/* Document icon */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Info section */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">
            {document.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {formatTypeLabel(document.type)}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-xs ${VISIBILITY_COLORS[document.visibility] || ''}`}
            >
              {document.visibility.charAt(0).toUpperCase() +
                document.visibility.slice(1)}
            </Badge>
            {document.products?.title && (
              <Badge variant="secondary" className="text-xs">
                {document.products.title}
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {document.file_url ? 'PDF attached' : 'No file uploaded'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(document)}
            disabled={isPending}
            aria-label="Edit document"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onReplace(document)}
            disabled={isPending}
            aria-label="Replace file"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={confirmDelete ? 'destructive' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={handleDeleteClick}
            disabled={isPending}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete document'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
