'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RepCard } from '@/components/representatives/rep-card'
import { RepForm } from '@/components/representatives/rep-form'
import {
  createRepresentative,
  updateRepresentative,
  deleteRepresentative,
  setPrimaryRepresentative,
  updateRepresentativeSortOrder,
} from '@/lib/actions/representative'
import type { RepresentativeFormValues } from '@/lib/schemas/representative'
import type { Database } from '@/lib/supabase/types'
import { toast } from 'sonner'
import Link from 'next/link'

type Representative = Database['public']['Tables']['representatives']['Row']

interface RepListProps {
  initialReps: Representative[]
  tenantId: string
  noProfile: boolean
}

export function RepList({ initialReps, tenantId, noProfile }: RepListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRep, setEditingRep] = useState<Representative | null>(null)

  if (noProfile) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Business Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            Create your business profile first before adding representatives.
          </p>
        </div>
        <Button render={<Link href="/admin/business" />}>
          Create Business Profile
        </Button>
      </div>
    )
  }

  const handleCreate = (data: RepresentativeFormValues) => {
    startTransition(async () => {
      const result = await createRepresentative(data)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Representative added successfully')
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleEdit = (data: RepresentativeFormValues) => {
    if (!editingRep) return
    startTransition(async () => {
      const result = await updateRepresentative(editingRep.id, data)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Representative updated successfully')
        setEditingRep(null)
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleDelete = (repId: string) => {
    startTransition(async () => {
      const result = await deleteRepresentative(repId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Representative deleted')
        router.refresh()
      }
    })
  }

  const handleSetPrimary = (repId: string) => {
    startTransition(async () => {
      const result = await setPrimaryRepresentative(repId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Primary representative updated')
        router.refresh()
      }
    })
  }

  const handleReorder = (repId: string, direction: 'up' | 'down') => {
    startTransition(async () => {
      const result = await updateRepresentativeSortOrder(repId, direction)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const openEditDialog = (rep: Representative) => {
    setEditingRep(rep)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingRep(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Representatives</h2>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their contact information.
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add Representative
        </Button>
      </div>

      {/* Rep list or empty state */}
      {initialReps.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No representatives yet. Add your first representative.
          </p>
          <Button variant="outline" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Representative
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {initialReps.map((rep, index) => (
            <RepCard
              key={rep.id}
              rep={rep}
              isFirst={index === 0}
              isLast={index === initialReps.length - 1}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              onReorder={handleReorder}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <RepForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingRep(null)
        }}
        initialData={editingRep}
        tenantId={tenantId}
        onSave={editingRep ? handleEdit : handleCreate}
        isPending={isPending}
      />
    </div>
  )
}
