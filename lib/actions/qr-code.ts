'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { qrCodeSchema, type QrCodeFormValues } from '@/lib/schemas/qr-code'
import type { Json } from '@/lib/supabase/types'

async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

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

export async function saveQrCode(values: QrCodeFormValues) {
  const parsed = qrCodeSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const result = await getAuthContext()
  if ('error' in result) return { success: false, error: result.error }
  const { tenantId, supabase } = result

  // Get business profile
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('tenant_id', tenantId)
    .single()

  // Get tenant slug for target URL
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { success: false, error: 'Tenant not found' }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const targetUrl = `${baseUrl}/${tenant.slug}`

  // Check if QR code already exists for this tenant
  const { data: existing } = await supabase
    .from('qr_codes')
    .select('id')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    // Update existing
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .update({
        campaign_name: parsed.data.campaign_name || null,
        target_url: targetUrl,
        design_config: parsed.data.design_config as unknown as Json,
        business_profile_id: profile?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/qr-codes')
    return { success: true, data: qrCode }
  } else {
    // Insert new
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .insert({
        tenant_id: tenantId,
        campaign_name: parsed.data.campaign_name || null,
        target_url: targetUrl,
        design_config: parsed.data.design_config as unknown as Json,
        business_profile_id: profile?.id || null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/qr-codes')
    return { success: true, data: qrCode }
  }
}

export async function getQrCode() {
  const result = await getAuthContext()
  if ('error' in result) return null

  const { tenantId, supabase } = result

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return qrCode
}

export async function getQrCodeData() {
  const result = await getAuthContext()
  if ('error' in result) return null

  const { tenantId, supabase } = result

  // Fetch QR code config
  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch business profile for logo URL
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('logo_url')
    .eq('tenant_id', tenantId)
    .single()

  // Fetch theme configuration for brand colors
  const { data: theme } = await supabase
    .from('theme_configurations')
    .select('tokens_json')
    .eq('tenant_id', tenantId)
    .single()

  // Fetch tenant slug
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', tenantId)
    .single()

  return {
    qrCode,
    logoUrl: profile?.logo_url || null,
    themeTokens: theme?.tokens_json || null,
    tenantSlug: tenant?.slug || null,
  }
}
