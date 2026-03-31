'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  leadFormConfigSchema,
  defaultLeadFormConfig,
  type LeadFormConfig,
} from '@/lib/schemas/lead-form-config'

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

async function getBusinessProfileId() {
  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('tenant_id', tenantId)
    .single()

  if (!profile) {
    return { error: 'No business profile found' as const }
  }

  return { tenantId, businessProfileId: profile.id, supabase }
}

export async function getLeadFormConfig() {
  const result = await getBusinessProfileId()
  if ('error' in result) {
    if (result.error === 'No business profile found') {
      return { error: result.error, noProfile: true as const }
    }
    return { error: result.error }
  }
  const { businessProfileId, supabase } = result

  const { data, error } = await supabase
    .from('business_profiles')
    .select('lead_form_config')
    .eq('id', businessProfileId)
    .single()

  if (error) return { error: error.message }

  // Validate the stored config; fall back to defaults if null or invalid
  const parsed = leadFormConfigSchema.safeParse(data?.lead_form_config)
  if (parsed.success) {
    return { data: parsed.data }
  }

  return { data: defaultLeadFormConfig }
}

export async function updateLeadFormConfig(config: LeadFormConfig) {
  const parsed = leadFormConfigSchema.safeParse(config)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid configuration' }
  }

  const result = await getBusinessProfileId()
  if ('error' in result) {
    if (result.error === 'No business profile found') {
      return { error: 'Create your business profile first.' }
    }
    return { error: result.error }
  }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('business_profiles')
    .update({ lead_form_config: parsed.data })
    .eq('id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/leads/settings')
  return { success: true }
}
