'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isReservedSlug } from '@/lib/constants'

async function getAuthenticatedTenant() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Try app_metadata first (faster, no DB query), fall back to users table
  let tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()
    if (!userData) redirect('/login')
    tenantId = userData.tenant_id
  }

  return { tenantId, supabase, user }
}

export async function getProfile() {
  const { tenantId, supabase, user } = await getAuthenticatedTenant()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', tenantId)
    .single()

  return {
    data: tenant
      ? { name: tenant.name, slug: tenant.slug, email: user.email ?? '' }
      : null,
  }
}

export async function updateProfile(formData: {
  name: string
  slug: string
}) {
  const { tenantId, supabase } = await getAuthenticatedTenant()

  // Validate name
  const name = formData.name.trim()
  if (!name) {
    return { error: 'Display name is required' }
  }
  if (name.length > 200) {
    return { error: 'Display name must be 200 characters or less' }
  }

  // Validate slug
  const slug = formData.slug.trim().toLowerCase()
  if (!slug) {
    return { error: 'Slug is required' }
  }
  if (slug.length < 3) {
    return { error: 'Slug must be at least 3 characters' }
  }
  if (slug.length > 63) {
    return { error: 'Slug must be 63 characters or less' }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      error:
        'Slug must be lowercase alphanumeric with hyphens only (no leading/trailing hyphens)',
    }
  }
  if (isReservedSlug(slug)) {
    return { error: 'This slug is reserved and cannot be used' }
  }

  // Check slug uniqueness (exclude current tenant)
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .neq('id', tenantId)
    .maybeSingle()

  if (existing) {
    return { error: 'This slug is already taken' }
  }

  const { error } = await supabase
    .from('tenants')
    .update({ name, slug })
    .eq('id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/admin/profile')
  return { success: true }
}

export async function updatePassword(formData: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  const { supabase, user } = await getAuthenticatedTenant()

  // Validate passwords
  if (!formData.currentPassword) {
    return { error: 'Current password is required' }
  }
  if (!formData.newPassword) {
    return { error: 'New password is required' }
  }
  if (formData.newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters' }
  }
  if (formData.newPassword !== formData.confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  // Verify current password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: formData.currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: formData.newPassword,
  })

  if (error) return { error: error.message }

  return { success: true }
}
