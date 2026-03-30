'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  businessProfileSchema,
  type BusinessProfileInput,
  type BusinessProfileFormValues,
  type AboutContent,
} from '@/lib/schemas/business-profile'
import { upsertBusinessProfile } from '@/lib/actions/business-profile'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ImageUpload } from '@/components/business-profile/image-upload'
import { TagInput } from '@/components/business-profile/tag-input'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/types'

interface BusinessProfileFormProps {
  initialData:
    | Database['public']['Tables']['business_profiles']['Row']
    | null
  tenantId: string
}

export function BusinessProfileForm({
  initialData,
  tenantId,
}: BusinessProfileFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: initialData
      ? {
          company_name: initialData.company_name,
          tagline: initialData.tagline ?? '',
          description_short: initialData.description_short ?? '',
          description_long: initialData.description_long ?? '',
          phone: initialData.phone ?? '',
          email: initialData.email ?? '',
          website: initialData.website ?? '',
          address: initialData.address ?? '',
          event_name: initialData.event_name ?? '',
          stand_number: initialData.stand_number ?? '',
          logo_url: initialData.logo_url ?? '',
          hero_image_url: initialData.hero_image_url ?? '',
          about_content:
            (initialData.about_content as AboutContent) ?? undefined,
        }
      : {
          company_name: '',
          about_content: undefined, // defaults from Zod schema will fill nested objects
        },
  })

  const onSubmit = (data: BusinessProfileFormValues) => {
    setError(null)
    startTransition(async () => {
      // zodResolver validates and transforms the data (applies defaults)
      // so the parsed output matches BusinessProfileInput
      const result = await upsertBusinessProfile(data as BusinessProfileInput)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success('Business profile saved successfully')
      }
    })
  }

  const descriptionShort = watch('description_short')
  const descriptionLong = watch('description_long')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>
          Manage your company information, event details, and content sections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue={0}>
            <TabsList>
              <TabsTrigger value={0}>Company</TabsTrigger>
              <TabsTrigger value={1}>Event</TabsTrigger>
              <TabsTrigger value={2}>Content</TabsTrigger>
            </TabsList>

            {/* Tab 1: Company */}
            <TabsContent value={0} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="Your company name"
                  {...register('company_name')}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-600">
                    {errors.company_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="A short tagline for your business"
                  {...register('tagline')}
                />
                {errors.tagline && (
                  <p className="text-sm text-red-600">
                    {errors.tagline.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_short">Short Description</Label>
                <Textarea
                  id="description_short"
                  placeholder="Brief overview of your business (max 500 characters)"
                  {...register('description_short')}
                />
                <p className="text-xs text-muted-foreground">
                  {(descriptionShort ?? '').length}/500
                </p>
                {errors.description_short && (
                  <p className="text-sm text-red-600">
                    {errors.description_short.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_long">Full Description</Label>
                <Textarea
                  id="description_long"
                  placeholder="Detailed description of your business (max 5000 characters)"
                  {...register('description_long')}
                />
                <p className="text-xs text-muted-foreground">
                  {(descriptionLong ?? '').length}/5000
                </p>
                {errors.description_long && (
                  <p className="text-sm text-red-600">
                    {errors.description_long.message}
                  </p>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+971 50 123 4567"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@company.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://www.company.com"
                  {...register('website')}
                />
                {errors.website && (
                  <p className="text-sm text-red-600">
                    {errors.website.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Company address"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <ImageUpload
                  currentUrl={watch('logo_url') || null}
                  tenantId={tenantId}
                  category="logos"
                  maxSizeMB={2}
                  onUploadComplete={(url) => setValue('logo_url', url)}
                  label="Company Logo (max 2MB)"
                />
                <ImageUpload
                  currentUrl={watch('hero_image_url') || null}
                  tenantId={tenantId}
                  category="hero"
                  maxSizeMB={5}
                  onUploadComplete={(url) => setValue('hero_image_url', url)}
                  label="Hero Image (max 5MB)"
                />
              </div>
            </TabsContent>

            {/* Tab 2: Event */}
            <TabsContent value={1} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">Event Name</Label>
                <Input
                  id="event_name"
                  placeholder="e.g., GITEX Global 2026"
                  {...register('event_name')}
                />
                <p className="text-xs text-muted-foreground">
                  The event where you are exhibiting
                </p>
                {errors.event_name && (
                  <p className="text-sm text-red-600">
                    {errors.event_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stand_number">Stand / Booth Number</Label>
                <Input
                  id="stand_number"
                  placeholder="e.g., Hall 3, Stand A42"
                  {...register('stand_number')}
                />
                <p className="text-xs text-muted-foreground">
                  Help visitors find you at the event
                </p>
                {errors.stand_number && (
                  <p className="text-sm text-red-600">
                    {errors.stand_number.message}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Tab 3: Content */}
            <TabsContent value={2} className="space-y-6 pt-4">
              {/* About Us */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="about_us_title">About Us - Title</Label>
                  <Input
                    id="about_us_title"
                    {...register('about_content.about_us.title')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about_us_content">About Us - Content</Label>
                  <Textarea
                    id="about_us_content"
                    placeholder="Tell visitors about your company..."
                    {...register('about_content.about_us.content')}
                  />
                </div>
              </div>

              <Separator />

              {/* Why Choose Us */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="why_choose_us_title">
                    Why Choose Us - Title
                  </Label>
                  <Input
                    id="why_choose_us_title"
                    {...register('about_content.why_choose_us.title')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="why_choose_us_content">
                    Why Choose Us - Content
                  </Label>
                  <Textarea
                    id="why_choose_us_content"
                    placeholder="What makes your company stand out..."
                    {...register('about_content.why_choose_us.content')}
                  />
                </div>
              </div>

              <Separator />

              {/* Sectors Served */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="sectors_title">Sectors Served - Title</Label>
                  <Input
                    id="sectors_title"
                    {...register('about_content.sectors_served.title')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sectors Served - Items</Label>
                  <Controller
                    name="about_content.sectors_served.items"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Type a sector and press Enter"
                      />
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Certifications */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="certifications_title">
                    Certifications - Title
                  </Label>
                  <Input
                    id="certifications_title"
                    {...register('about_content.certifications.title')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Certifications - Items</Label>
                  <Controller
                    name="about_content.certifications.items"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Type a certification and press Enter"
                      />
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Use Cases */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="use_cases_title">Use Cases - Title</Label>
                  <Input
                    id="use_cases_title"
                    {...register('about_content.use_cases.title')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Use Cases - Items</Label>
                  <Controller
                    name="about_content.use_cases.items"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Type a use case and press Enter"
                      />
                    )}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={isPending} className="mt-6">
            {isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
