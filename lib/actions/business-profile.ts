'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  businessProfileSchema,
  type BusinessProfileInput,
} from '@/lib/schemas/business-profile'

async function getTenantId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  // Try app_metadata first (faster, no DB query), fall back to users table
  let tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()
    if (!userData) return { error: 'User not found' as const }
    tenantId = userData.tenant_id
  }

  return { tenantId, supabase }
}

export async function upsertBusinessProfile(formData: BusinessProfileInput) {
  const parsed = businessProfileSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  // Transform empty strings to null before DB insert
  const data = {
    tenant_id: tenantId,
    company_name: parsed.data.company_name,
    tagline: parsed.data.tagline || null,
    description_short: parsed.data.description_short || null,
    description_long: parsed.data.description_long || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    website: parsed.data.website || null,
    address: parsed.data.address || null,
    event_name: parsed.data.event_name || null,
    stand_number: parsed.data.stand_number || null,
    logo_url: parsed.data.logo_url || null,
    hero_image_url: parsed.data.hero_image_url || null,
    about_content: parsed.data.about_content,
  }

  const { error } = await supabase
    .from('business_profiles')
    .upsert(data, { onConflict: 'tenant_id' })

  if (error) return { error: error.message }

  revalidatePath('/admin/business')
  return { success: true }
}

export async function getBusinessProfile() {
  const result = await getTenantId()
  if ('error' in result) return { data: null }
  const { tenantId, supabase } = result

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  return { data: profile }
}
