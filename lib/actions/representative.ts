'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  representativeSchema,
  type RepresentativeInput,
} from '@/lib/schemas/representative'

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

export async function getRepresentatives() {
  const result = await getBusinessProfileId()
  if ('error' in result) {
    if (result.error === 'No business profile found') {
      return { data: [], noProfile: true }
    }
    return { data: [], error: result.error }
  }
  const { businessProfileId, supabase } = result

  const { data, error } = await supabase
    .from('representatives')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function createRepresentative(formData: RepresentativeInput) {
  const parsed = representativeSchema.safeParse(formData)
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

  // Determine next sort_order
  const { data: maxRow } = await supabase
    .from('representatives')
    .select('sort_order')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1

  const { data: newRep, error: insertError } = await supabase
    .from('representatives')
    .insert({
      tenant_id: tenantId,
      business_profile_id: businessProfileId,
      name: parsed.data.name,
      title: parsed.data.title || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      image_url: parsed.data.image_url || null,
      sort_order: nextSortOrder,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  // D-19: Auto-set as primary if this is the only rep
  const { count } = await supabase
    .from('representatives')
    .select('id', { count: 'exact', head: true })
    .eq('business_profile_id', businessProfileId)

  if (count === 1 && newRep) {
    await supabase
      .from('representatives')
      .update({ is_primary: true })
      .eq('id', newRep.id)
  }

  revalidatePath('/admin/representatives')
  return { success: true }
}

export async function updateRepresentative(
  repId: string,
  formData: RepresentativeInput
) {
  const parsed = representativeSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('representatives')
    .update({
      name: parsed.data.name,
      title: parsed.data.title || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      image_url: parsed.data.image_url || null,
    })
    .eq('id', repId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/representatives')
  return { success: true }
}

export async function deleteRepresentative(repId: string) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('representatives')
    .delete()
    .eq('id', repId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/representatives')
  return { success: true }
}

export async function setPrimaryRepresentative(repId: string) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase.rpc('set_primary_representative', {
    p_rep_id: repId,
    p_business_profile_id: businessProfileId,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/representatives')
  return { success: true }
}

export async function updateRepresentativeSortOrder(
  repId: string,
  direction: 'up' | 'down'
) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  // Fetch all reps ordered by sort_order
  const { data: reps, error: fetchError } = await supabase
    .from('representatives')
    .select('id, sort_order')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: true })

  if (fetchError) return { error: fetchError.message }
  if (!reps || reps.length < 2) return { error: 'Cannot reorder' }

  const targetIndex = reps.findIndex((r) => r.id === repId)
  if (targetIndex === -1) return { error: 'Representative not found' }

  const neighborIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1
  if (neighborIndex < 0 || neighborIndex >= reps.length) {
    return { error: 'Cannot move further in that direction' }
  }

  const target = reps[targetIndex]
  const neighbor = reps[neighborIndex]

  // Swap sort_order values
  const { error: err1 } = await supabase
    .from('representatives')
    .update({ sort_order: neighbor.sort_order })
    .eq('id', target.id)

  if (err1) return { error: err1.message }

  const { error: err2 } = await supabase
    .from('representatives')
    .update({ sort_order: target.sort_order })
    .eq('id', neighbor.id)

  if (err2) return { error: err2.message }

  revalidatePath('/admin/representatives')
  return { success: true }
}
