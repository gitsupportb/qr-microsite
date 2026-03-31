'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  productSchema,
  type ProductInput,
} from '@/lib/schemas/product'

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

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

export async function getProducts() {
  const result = await getBusinessProfileId()
  if ('error' in result) {
    if (result.error === 'No business profile found') {
      return { data: [], noProfile: true }
    }
    return { data: [], error: result.error }
  }
  const { businessProfileId, supabase } = result

  const { data, error } = await supabase
    .from('products')
    .select('*, product_categories(name, slug)')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function createProduct(formData: ProductInput) {
  const parsed = productSchema.safeParse(formData)
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

  const slug = generateSlug(parsed.data.title)

  // Determine next sort_order
  const { data: maxRow } = await supabase
    .from('products')
    .select('sort_order')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1

  const { error: insertError } = await supabase.from('products').insert({
    tenant_id: tenantId,
    business_profile_id: businessProfileId,
    title: parsed.data.title,
    slug,
    short_description: parsed.data.short_description || null,
    long_description: parsed.data.long_description || null,
    image_url: parsed.data.image_url || null,
    category_id: parsed.data.category_id || null,
    featured: parsed.data.featured,
    visible: parsed.data.visible,
    sort_order: nextSortOrder,
  })

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function updateProduct(
  productId: string,
  formData: ProductInput
) {
  const parsed = productSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const slug = generateSlug(parsed.data.title)

  const { error } = await supabase
    .from('products')
    .update({
      title: parsed.data.title,
      slug,
      short_description: parsed.data.short_description || null,
      long_description: parsed.data.long_description || null,
      image_url: parsed.data.image_url || null,
      category_id: parsed.data.category_id || null,
      featured: parsed.data.featured,
      visible: parsed.data.visible,
    })
    .eq('id', productId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function archiveProduct(productId: string) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('products')
    .update({ visible: false })
    .eq('id', productId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function restoreProduct(productId: string) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  const { error } = await supabase
    .from('products')
    .update({ visible: true })
    .eq('id', productId)
    .eq('business_profile_id', businessProfileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  return { success: true }
}

export async function updateProductSortOrder(
  productId: string,
  direction: 'up' | 'down'
) {
  const result = await getBusinessProfileId()
  if ('error' in result) return { error: result.error }
  const { businessProfileId, supabase } = result

  // Fetch only visible (active) products ordered by sort_order
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, sort_order')
    .eq('business_profile_id', businessProfileId)
    .eq('visible', true)
    .order('sort_order', { ascending: true })

  if (fetchError) return { error: fetchError.message }
  if (!products || products.length < 2) return { error: 'Cannot reorder' }

  const targetIndex = products.findIndex((p) => p.id === productId)
  if (targetIndex === -1) return { error: 'Product not found' }

  const neighborIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1
  if (neighborIndex < 0 || neighborIndex >= products.length) {
    return { error: 'Cannot move further in that direction' }
  }

  const target = products[targetIndex]
  const neighbor = products[neighborIndex]

  // Swap sort_order values
  const { error: err1 } = await supabase
    .from('products')
    .update({ sort_order: neighbor.sort_order })
    .eq('id', target.id)

  if (err1) return { error: err1.message }

  const { error: err2 } = await supabase
    .from('products')
    .update({ sort_order: target.sort_order })
    .eq('id', neighbor.id)

  if (err2) return { error: err2.message }

  revalidatePath('/admin/products')
  return { success: true }
}
