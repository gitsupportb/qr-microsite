'use client'

import type { Database } from '@/lib/supabase/types'
import type { DocumentFormValues } from '@/lib/schemas/document'

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

export function DocumentForm(_props: DocumentFormProps) {
  // Stub: will be fully implemented in Task 2
  return null
}
