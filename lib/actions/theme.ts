'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  themeConfigSchema,
  defaultThemeConfig,
  type ThemeConfig,
} from '@/lib/schemas/theme'

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

export async function getThemeConfig() {
  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  const { data, error } = await supabase
    .from('theme_configurations')
    .select('id, tokens_json, layout_variant')
    .eq('tenant_id', tenantId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (expected when no theme config exists)
    return { error: error.message }
  }

  // Validate stored config; fall back to defaults if null or invalid
  const parsed = themeConfigSchema.safeParse(data?.tokens_json)
  if (parsed.success) {
    return { data: parsed.data }
  }

  return { data: defaultThemeConfig }
}

export async function updateThemeConfig(config: ThemeConfig) {
  const parsed = themeConfigSchema.safeParse(config)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid configuration' }
  }

  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  const { error } = await supabase
    .from('theme_configurations')
    .upsert(
      {
        tenant_id: tenantId,
        tokens_json: JSON.parse(JSON.stringify(parsed.data)),
      },
      { onConflict: 'tenant_id' }
    )

  if (error) return { error: error.message }

  revalidatePath('/admin/theme')
  return { success: true }
}
