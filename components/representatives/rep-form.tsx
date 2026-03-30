'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  representativeSchema,
  type RepresentativeFormValues,
} from '@/lib/schemas/representative'
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
import { ImageUpload } from '@/components/business-profile/image-upload'
import type { Database } from '@/lib/supabase/types'
import { useEffect } from 'react'

type Representative = Database['public']['Tables']['representatives']['Row']

interface RepFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: Representative | null
  tenantId: string
  onSave: (data: RepresentativeFormValues) => void
  isPending: boolean
}

export function RepForm({
  open,
  onOpenChange,
  initialData,
  tenantId,
  onSave,
  isPending,
}: RepFormProps) {
  const isEditMode = initialData !== null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RepresentativeFormValues>({
    resolver: zodResolver(representativeSchema),
    defaultValues: {
      name: '',
      title: '',
      email: '',
      phone: '',
      whatsapp: '',
      image_url: '',
    },
  })

  // Reset form when initialData changes (editing different rep) or dialog opens/closes
  useEffect(() => {
    if (open && initialData) {
      reset({
        name: initialData.name,
        title: initialData.title ?? '',
        email: initialData.email ?? '',
        phone: initialData.phone ?? '',
        whatsapp: initialData.whatsapp ?? '',
        image_url: initialData.image_url ?? '',
      })
    } else if (open && !initialData) {
      reset({
        name: '',
        title: '',
        email: '',
        phone: '',
        whatsapp: '',
        image_url: '',
      })
    }
  }, [open, initialData, reset])

  const onSubmit = (data: RepresentativeFormValues) => {
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Representative' : 'Add Representative'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the representative details below.'
              : 'Fill in the details to add a new representative.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rep-name">Name *</Label>
            <Input
              id="rep-name"
              placeholder="Full name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rep-title">Title</Label>
            <Input
              id="rep-title"
              placeholder="e.g., Sales Manager"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rep-email">Email</Label>
            <Input
              id="rep-email"
              type="email"
              placeholder="email@company.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rep-phone">Phone</Label>
              <Input
                id="rep-phone"
                type="tel"
                placeholder="+971 50 123 4567"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rep-whatsapp">WhatsApp Number</Label>
              <Input
                id="rep-whatsapp"
                type="tel"
                placeholder="+971 50 123 4567"
                {...register('whatsapp')}
              />
              {errors.whatsapp && (
                <p className="text-sm text-red-600">
                  {errors.whatsapp.message}
                </p>
              )}
            </div>
          </div>

          <ImageUpload
            currentUrl={watch('image_url') || null}
            tenantId={tenantId}
            category="representatives"
            maxSizeMB={2}
            onUploadComplete={(url) => setValue('image_url', url)}
            label="Profile Image (max 2MB)"
          />

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
                  : 'Add Representative'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
