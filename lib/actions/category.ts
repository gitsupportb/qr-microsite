'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  categorySchema,
  type CategoryInput,
} from '@/lib/schemas/category'

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

export async function getCategories() {
  const result = await getTenantId()
  if ('error' in result) return { data: [], error: result.error }
  const { tenantId, supabase } = result

  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function createCategory(formData: CategoryInput) {
  const parsed = categorySchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  const slug = generateSlug(parsed.data.name)

  // Determine next sort_order
  const { data: maxRow } = await supabase
    .from('product_categories')
    .select('sort_order')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1

  const { error: insertError } = await supabase
    .from('product_categories')
    .insert({
      tenant_id: tenantId,
      name: parsed.data.name,
      slug,
      sort_order: nextSortOrder,
    })

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/products/categories')
  return { success: true }
}

export async function updateCategory(
  categoryId: string,
  formData: CategoryInput
) {
  const parsed = categorySchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  const slug = generateSlug(parsed.data.name)

  const { error } = await supabase
    .from('product_categories')
    .update({
      name: parsed.data.name,
      slug,
    })
    .eq('id', categoryId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/admin/products/categories')
  return { success: true }
}

export async function deleteCategory(categoryId: string) {
  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  // Check if any products are assigned to this category
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('tenant_id', tenantId)

  if (count && count > 0) {
    return {
      error:
        'Cannot delete category with assigned products. Remove products from this category first.',
    }
  }

  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', categoryId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/admin/products/categories')
  return { success: true }
}

export async function updateCategorySortOrder(
  categoryId: string,
  direction: 'up' | 'down'
) {
  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  // Fetch all categories ordered by sort_order
  const { data: categories, error: fetchError } = await supabase
    .from('product_categories')
    .select('id, sort_order')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (fetchError) return { error: fetchError.message }
  if (!categories || categories.length < 2) return { error: 'Cannot reorder' }

  const targetIndex = categories.findIndex((c) => c.id === categoryId)
  if (targetIndex === -1) return { error: 'Category not found' }

  const neighborIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1
  if (neighborIndex < 0 || neighborIndex >= categories.length) {
    return { error: 'Cannot move further in that direction' }
  }

  const target = categories[targetIndex]
  const neighbor = categories[neighborIndex]

  // Swap sort_order values
  const { error: err1 } = await supabase
    .from('product_categories')
    .update({ sort_order: neighbor.sort_order })
    .eq('id', target.id)

  if (err1) return { error: err1.message }

  const { error: err2 } = await supabase
    .from('product_categories')
    .update({ sort_order: target.sort_order })
    .eq('id', neighbor.id)

  if (err2) return { error: err2.message }

  revalidatePath('/admin/products/categories')
  return { success: true }
}
