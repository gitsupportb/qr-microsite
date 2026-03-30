'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Share2,
  Package,
  FileText,
  MessageSquare,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { CtaConfigForm } from '@/components/cta-config/cta-config-form'
import {
  toggleCtaConfiguration,
  deleteCtaConfiguration,
  updateCtaSortOrder,
} from '@/lib/actions/cta-configuration'
import { CTA_TYPE_OPTIONS } from '@/lib/schemas/cta-configuration'
import type { Database } from '@/lib/supabase/types'
import { toast } from 'sonner'
import Link from 'next/link'

type CtaConfigurationRow =
  Database['public']['Tables']['cta_configurations']['Row']
type CtaType = CtaConfigurationRow['type']

const CTA_ICON_MAP: Record<CtaType, typeof Download> = {
  save_contact: Download,
  whatsapp: MessageCircle,
  call: Phone,
  email: Mail,
  website: Globe,
  maps: MapPin,
  share: Share2,
  view_products: Package,
  get_catalog: FileText,
  request_quote: MessageSquare,
  book_meeting: Calendar,
}

/** Get human-readable label for a CTA type */
function getTypeLabel(type: CtaType): string {
  return CTA_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? type
}

interface CtaConfigListProps {
  initialData: CtaConfigurationRow[]
  noProfile?: boolean
}

export function CtaConfigList({
  initialData,
  noProfile = false,
}: CtaConfigListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCta, setEditingCta] = useState<CtaConfigurationRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const enabledCount = initialData.filter((c) => c.enabled).length

  if (noProfile) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Business Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            Create your business profile first to configure CTA buttons.
          </p>
        </div>
        <Button render={<Link href="/admin/business" />}>
          Create Business Profile
        </Button>
      </div>
    )
  }

  const handleToggle = (id: string, enabled: boolean) => {
    startTransition(async () => {
      const result = await toggleCtaConfiguration(id, enabled)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      startTransition(async () => {
        const result = await deleteCtaConfiguration(id)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('CTA button deleted')
          setConfirmDeleteId(null)
          router.refresh()
        }
      })
    } else {
      setConfirmDeleteId(id)
      // Reset confirmation state after 3 seconds
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    startTransition(async () => {
      const result = await updateCtaSortOrder(id, direction)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const openEditDialog = (cta: CtaConfigurationRow) => {
    setEditingCta(cta)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingCta(null)
    setDialogOpen(true)
  }

  const handleFormSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            CTA Bar Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure the action buttons that appear in your microsite&apos;s
            sticky CTA bar.
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add CTA
        </Button>
      </div>

      {/* Warning for too many enabled CTAs */}
      {enabledCount > 4 && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>
            Only the first 4 enabled CTAs will appear on mobile. You have{' '}
            {enabledCount} enabled.
          </p>
        </div>
      )}

      {/* CTA list or empty state */}
      {initialData.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No CTA buttons configured. Add actions to your sticky CTA bar.
          </p>
          <Button variant="outline" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add CTA
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.map((cta, index) => {
            const Icon = CTA_ICON_MAP[cta.type] ?? Globe
            const isConfirmingDelete = confirmDeleteId === cta.id
            return (
              <Card key={cta.id} className={!cta.enabled ? 'opacity-60' : ''}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">
                        {cta.label}
                      </h3>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {getTypeLabel(cta.type)}
                      </Badge>
                    </div>
                    {cta.destination && (
                      <p className="truncate text-xs text-muted-foreground">
                        {cta.destination}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {/* Enabled toggle */}
                    <div className="pr-2">
                      <Switch
                        checked={cta.enabled}
                        onCheckedChange={(checked) =>
                          handleToggle(cta.id, checked)
                        }
                        disabled={isPending}
                        aria-label={
                          cta.enabled ? 'Disable CTA' : 'Enable CTA'
                        }
                      />
                    </div>

                    {/* Sort buttons */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleReorder(cta.id, 'up')}
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
                      onClick={() => handleReorder(cta.id, 'down')}
                      disabled={
                        index === initialData.length - 1 || isPending
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
                      onClick={() => openEditDialog(cta)}
                      disabled={isPending}
                      aria-label="Edit CTA"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete button */}
                    <Button
                      type="button"
                      variant={isConfirmingDelete ? 'destructive' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(cta.id)}
                      disabled={isPending}
                      aria-label={
                        isConfirmingDelete ? 'Confirm delete' : 'Delete CTA'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <CtaConfigForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCta(null)
        }}
        initialData={editingCta}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
