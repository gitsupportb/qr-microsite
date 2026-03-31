'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  documentSchema,
  type DocumentInput,
} from '@/lib/schemas/document'

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

export async function getDocuments() {
  const result = await getBusinessProfileId()
  if ('error' in result) {
    if (result.error === 'No business profile found') {
      return { data: [], noProfile: true }
    }
    return { data: [], error: result.error }
  }
  const { businessProfileId, supabase } = result

  const { data, error } = await supabase
    .from('documents')
    .select('*, products(id, title)')
    .eq('business_profile_id', businessProfileId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function createDocument(formData: DocumentInput) {
  const parsed = documentSchema.safeParse(formData)
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

  const { error: insertError } = await supabase.from('documents').insert({
    tenant_id: tenantId,
    business_profile_id: businessProfileId,
    title: parsed.data.title,
    type: parsed.data.type,
    file_url: parsed.data.file_url || null,
    storage_path: parsed.data.storage_path || null,
    visibility: parsed.data.visibility,
    product_id: parsed.data.product_id || null,
  })

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/documents')
  return { success: true }
}

export async function updateDocument(
  documentId: string,
  formData: DocumentInput
) {
  const parsed = documentSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('documents')
    .update({
      title: parsed.data.title,
      type: parsed.data.type,
      file_url: parsed.data.file_url || null,
      storage_path: parsed.data.storage_path || null,
      visibility: parsed.data.visibility,
      product_id: parsed.data.product_id || null,
    })
    .eq('id', documentId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  return { success: true }
}

export async function deleteDocument(documentId: string) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  // Fetch the document to get storage_path before deleting
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('business_profile_id', businessProfileId)
    .single()

  if (fetchError) return { error: fetchError.message }

  // Delete the file from storage if it exists
  if (doc?.storage_path) {
    await supabase.storage
      .from('private-documents')
      .remove([doc.storage_path])
  }

  // Delete the database row
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  return { success: true }
}

export async function replaceDocumentFile(
  documentId: string,
  newFileUrl: string,
  newStoragePath: string
) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('documents')
    .update({
      file_url: newFileUrl,
      storage_path: newStoragePath,
    })
    .eq('id', documentId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  return { success: true }
}
