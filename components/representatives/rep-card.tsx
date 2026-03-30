'use client'

import {
  UserRound,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase/types'
import { useState } from 'react'

type Representative = Database['public']['Tables']['representatives']['Row']

interface RepCardProps {
  rep: Representative
  isFirst: boolean
  isLast: boolean
  onEdit: (rep: Representative) => void
  onDelete: (repId: string) => void
  onSetPrimary: (repId: string) => void
  onReorder: (repId: string, direction: 'up' | 'down') => void
  isPending: boolean
}

export function RepCard({
  rep,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onSetPrimary,
  onReorder,
  isPending,
}: RepCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(rep.id)
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
        {/* Profile image or placeholder */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {rep.image_url ? (
            <img
              src={rep.image_url}
              alt={rep.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Info section */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{rep.name}</h3>
            {rep.is_primary && (
              <Badge variant="secondary" className="shrink-0">
                Primary
              </Badge>
            )}
          </div>

          {rep.title && (
            <p className="truncate text-sm text-muted-foreground">
              {rep.title}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {rep.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{rep.email}</span>
              </span>
            )}
            {rep.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{rep.phone}</span>
              </span>
            )}
            {rep.whatsapp && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{rep.whatsapp}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Primary toggle */}
          <div className="flex items-center gap-1.5 pr-2">
            <Switch
              checked={rep.is_primary}
              onCheckedChange={() => onSetPrimary(rep.id)}
              disabled={isPending}
              aria-label="Set as primary representative"
            />
          </div>

          {/* Sort buttons */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onReorder(rep.id, 'up')}
            disabled={isFirst || isPending}
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onReorder(rep.id, 'down')}
            disabled={isLast || isPending}
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
            onClick={() => onEdit(rep)}
            disabled={isPending}
            aria-label="Edit representative"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Delete button */}
          <Button
            type="button"
            variant={confirmDelete ? 'destructive' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={handleDeleteClick}
            disabled={isPending}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete representative'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
