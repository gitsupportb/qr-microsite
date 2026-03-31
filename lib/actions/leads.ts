'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Lead = Database['public']['Tables']['leads']['Row']

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

export async function getLeads() {
  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  const { data, error, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }

  return { data: (data ?? []) as Lead[], count: count ?? 0 }
}

interface LeadMetrics {
  total: number
  thisWeek: number
  thisMonth: number
  byFormLocation: Record<string, number>
}

export async function getLeadMetrics() {
  const result = await getTenantId()
  if ('error' in result) return { error: result.error }
  const { tenantId, supabase } = result

  const { data, error } = await supabase
    .from('leads')
    .select('created_at, interest_context')
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const metrics: LeadMetrics = {
    total: data?.length ?? 0,
    thisWeek: 0,
    thisMonth: 0,
    byFormLocation: {},
  }

  for (const lead of data ?? []) {
    const createdAt = new Date(lead.created_at)
    if (createdAt >= weekAgo) metrics.thisWeek++
    if (createdAt >= monthAgo) metrics.thisMonth++

    // Aggregate by form_location from interest_context JSONB
    const ctx = lead.interest_context as Record<string, unknown> | null
    const formLocation = (ctx?.form_location as string) || 'unknown'
    metrics.byFormLocation[formLocation] =
      (metrics.byFormLocation[formLocation] ?? 0) + 1
  }

  return { data: metrics }
}
