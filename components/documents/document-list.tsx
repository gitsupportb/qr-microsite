'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentCard } from '@/components/documents/document-card'
import { DocumentForm } from '@/components/documents/document-form'
import {
  createDocument,
  updateDocument,
  deleteDocument,
  replaceDocumentFile,
} from '@/lib/actions/document'
import { uploadDocument } from '@/lib/supabase/storage'
import type { DocumentFormValues, DocumentInput } from '@/lib/schemas/document'
import type { Database } from '@/lib/supabase/types'
import { toast } from 'sonner'
import Link from 'next/link'

type Document = Database['public']['Tables']['documents']['Row'] & {
  products: { id: string; title: string } | null
}

type ProductOption = { id: string; title: string }

interface DocumentListProps {
  initialDocuments: Document[]
  products: ProductOption[]
  tenantId: string
  noProfile: boolean
}

const DOCUMENT_TYPES = [
  'catalog',
  'brochure',
  'datasheet',
  'certification',
  'pricing_sheet',
  'other',
] as const

function formatTypeLabel(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

type FilterValue = 'all' | (typeof DOCUMENT_TYPES)[number]

export function DocumentList({
  initialDocuments,
  products,
  tenantId,
  noProfile,
}: DocumentListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')

  if (noProfile) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Business Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            Create your business profile first before adding documents.
          </p>
        </div>
        <Button render={<Link href="/admin/business" />}>
          Create Business Profile
        </Button>
      </div>
    )
  }

  const handleCreate = (data: DocumentFormValues) => {
    startTransition(async () => {
      const result = await createDocument(data as DocumentInput)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Document created successfully')
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleEdit = (data: DocumentFormValues) => {
    if (!editingDocument) return
    startTransition(async () => {
      const result = await updateDocument(
        editingDocument.id,
        data as DocumentInput
      )
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Document updated successfully')
        setEditingDocument(null)
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleDelete = (documentId: string) => {
    startTransition(async () => {
      const result = await deleteDocument(documentId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Document deleted')
        router.refresh()
      }
    })
  }

  const handleReplace = (document: Document) => {
    // Open a hidden file input to select a new PDF
    const input = window.document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      startTransition(async () => {
        const uploadResult = await uploadDocument(
          tenantId,
          file,
          document.storage_path ?? undefined
        )
        if ('error' in uploadResult) {
          toast.error(uploadResult.error)
          return
        }
        const result = await replaceDocumentFile(
          document.id,
          uploadResult.fileUrl,
          uploadResult.storagePath
        )
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('File replaced successfully')
          router.refresh()
        }
      })
    }
    input.click()
  }

  const openEditDialog = (document: Document) => {
    setEditingDocument(document)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingDocument(null)
    setDialogOpen(true)
  }

  // Filter documents based on active filter
  const filteredDocuments = initialDocuments.filter((doc) => {
    if (activeFilter === 'all') return true
    return doc.type === activeFilter
  })

  // Determine which type tabs to show (only types that have at least 1 document)
  const typeCounts = DOCUMENT_TYPES.reduce(
    (acc, type) => {
      const count = initialDocuments.filter((d) => d.type === type).length
      if (count > 0) acc[type] = count
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-sm text-muted-foreground">
            Manage your document library for the microsite.
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {/* Filter tabs */}
      {initialDocuments.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            All ({initialDocuments.length})
          </Button>
          {DOCUMENT_TYPES.map((type) => {
            const count = typeCounts[type]
            if (!count) return null
            return (
              <Button
                key={type}
                variant={activeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(type)}
              >
                {formatTypeLabel(type)}s ({count})
              </Button>
            )
          })}
        </div>
      )}

      {/* Document list or empty state */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {initialDocuments.length === 0
              ? 'No documents yet. Add your first document.'
              : 'No documents match the selected filter.'}
          </p>
          {initialDocuments.length === 0 && (
            <Button variant="outline" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onReplace={handleReplace}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <DocumentForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingDocument(null)
        }}
        initialData={editingDocument}
        tenantId={tenantId}
        products={products.map((p) => ({ id: p.id, name: p.title }))}
        onSave={editingDocument ? handleEdit : handleCreate}
        isPending={isPending}
      />
    </div>
  )
}
