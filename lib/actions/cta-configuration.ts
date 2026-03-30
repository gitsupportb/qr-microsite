'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  ctaConfigurationSchema,
  type CtaConfigurationInput,
} from '@/lib/schemas/cta-configuration'

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

export async function getCtaConfigurations() {
  const result = await getBusinessProfileId()
  if ('error' in result) {
    if (result.error === 'No business profile found') {
      return { data: [], noProfile: true }
    }
    return { data: [], error: result.error }
  }
  const { businessProfileId, supabase } = result

  const { data, error } = await supabase
    .from('cta_configurations')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function upsertCtaConfiguration(
  id: string | null,
  formData: CtaConfigurationInput
) {
  const parsed = ctaConfigurationSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getBusinessProfileId()
  if ('error' in result) {
    if (result.error === 'No business profile found') {
      return { error: 'Create your business profile first.' }
    }
    return { error: result.error }
  }
  const { tenantId, businessProfileId, supabase } = result

  if (id) {
    // UPDATE existing CTA configuration
    const { error } = await supabase
      .from('cta_configurations')
      .update({
        type: parsed.data.type,
        label: parsed.data.label,
        destination: parsed.data.destination || null,
        enabled: parsed.data.enabled,
      })
      .eq('id', id)
      .eq('business_profile_id', businessProfileId)

    if (error) return { error: error.message }
  } else {
    // INSERT new CTA configuration with auto-increment sort_order
    const { data: maxRow } = await supabase
      .from('cta_configurations')
      .select('sort_order')
      .eq('business_profile_id', businessProfileId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (maxRow?.sort_order ?? -1) + 1

    const { error: insertError } = await supabase
      .from('cta_configurations')
      .insert({
        tenant_id: tenantId,
        business_profile_id: businessProfileId,
        type: parsed.data.type,
        label: parsed.data.label,
        destination: parsed.data.destination || null,
        enabled: parsed.data.enabled,
        sort_order: nextSortOrder,
      })

    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/admin/cta')
  return { success: true }
}

export async function deleteCtaConfiguration(id: string) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('cta_configurations')
    .delete()
    .eq('id', id)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/cta')
  return { success: true }
}

export async function toggleCtaConfiguration(id: string, enabled: boolean) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('cta_configurations')
    .update({ enabled })
    .eq('id', id)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/cta')
  return { success: true }
}

export async function updateCtaSortOrder(
  id: string,
  direction: 'up' | 'down'
) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  // Fetch all CTAs ordered by sort_order
  const { data: ctas, error: fetchError } = await supabase
    .from('cta_configurations')
    .select('id, sort_order')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: true })

  if (fetchError) return { error: fetchError.message }
  if (!ctas || ctas.length < 2) return { error: 'Cannot reorder' }

  const targetIndex = ctas.findIndex((c) => c.id === id)
  if (targetIndex === -1) return { error: 'CTA configuration not found' }

  const neighborIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1
  if (neighborIndex < 0 || neighborIndex >= ctas.length) {
    return { error: 'Cannot move further in that direction' }
  }

  const target = ctas[targetIndex]
  const neighbor = ctas[neighborIndex]

  // Swap sort_order values
  const { error: err1 } = await supabase
    .from('cta_configurations')
    .update({ sort_order: neighbor.sort_order })
    .eq('id', target.id)

  if (err1) return { error: err1.message }

  const { error: err2 } = await supabase
    .from('cta_configurations')
    .update({ sort_order: target.sort_order })
    .eq('id', neighbor.id)

  if (err2) return { error: err2.message }

  revalidatePath('/admin/cta')
  return { success: true }
}
