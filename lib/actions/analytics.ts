'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return { tenantId, supabase }
}

// ---------- Reset Analytics ----------

export async function resetAnalytics(): Promise<{ success?: boolean; error?: string }> {
  const { tenantId, supabase } = await getAuthenticatedTenant()

  const { error } = await supabase
    .from('analytics_events')
    .delete()
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  return { success: true }
}

// ---------- Summary Metrics ----------

export interface AnalyticsSummary {
  totalPageViews: number
  uniqueVisitors: number
  saveContactRate: string
  formConversionRate: string
  period: number
}

export async function getAnalyticsSummary(
  days: number = 30
): Promise<{ data?: AnalyticsSummary; error?: string }> {
  const { tenantId, supabase } = await getAuthenticatedTenant()

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, user_agent_hash')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)

  if (error) return { error: error.message }

  const events = data ?? []

  let totalPageViews = 0
  let saveContactCount = 0
  let formSubmitCount = 0
  const uniqueHashes = new Set<string>()

  for (const event of events) {
    if (event.event_type === 'page_view') {
      totalPageViews++
      if (event.user_agent_hash) {
        uniqueHashes.add(event.user_agent_hash)
      }
    }
    if (event.event_type === 'save_contact') saveContactCount++
    if (event.event_type === 'form_submit') formSubmitCount++
  }

  // Approximate unique visitors: use distinct user_agent_hash when available,
  // fall back to totalPageViews / 1.5 if most hashes are null
  const uniqueVisitors =
    uniqueHashes.size > 0
      ? uniqueHashes.size
      : Math.round(totalPageViews / 1.5)

  const saveContactRate =
    totalPageViews > 0
      ? ((saveContactCount / totalPageViews) * 100).toFixed(1) + '%'
      : '0.0%'

  const formConversionRate =
    totalPageViews > 0
      ? ((formSubmitCount / totalPageViews) * 100).toFixed(1) + '%'
      : '0.0%'

  return {
    data: {
      totalPageViews,
      uniqueVisitors,
      saveContactRate,
      formConversionRate,
      period: days,
    },
  }
}

// ---------- Time Series ----------

export interface TimeSeriesPoint {
  date: string
  pageViews: number
  totalEvents: number
}

export async function getAnalyticsTimeSeries(
  days: number = 30
): Promise<{ data?: TimeSeriesPoint[]; error?: string }> {
  const { tenantId, supabase } = await getAuthenticatedTenant()

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)

  if (error) return { error: error.message }

  // Build a map of date -> counts
  const dayMap = new Map<string, { pageViews: number; totalEvents: number }>()

  for (const event of data ?? []) {
    const dateStr = event.created_at.slice(0, 10) // YYYY-MM-DD
    const existing = dayMap.get(dateStr) ?? { pageViews: 0, totalEvents: 0 }
    existing.totalEvents++
    if (event.event_type === 'page_view') existing.pageViews++
    dayMap.set(dateStr, existing)
  }

  // Fill in zero-count days for continuous x-axis
  const result: TimeSeriesPoint[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const counts = dayMap.get(dateStr) ?? { pageViews: 0, totalEvents: 0 }
    result.push({ date: dateStr, ...counts })
  }

  return { data: result }
}

// ---------- Breakdowns ----------

export interface EventTypeBreakdown {
  eventType: string
  count: number
  label: string
}

export interface ProductBreakdown {
  productId: string
  productTitle: string
  clicks: number
}

export interface AnalyticsBreakdowns {
  byEventType: EventTypeBreakdown[]
  byProduct: ProductBreakdown[]
}

const eventTypeLabels: Record<string, string> = {
  page_view: 'Page Views',
  save_contact: 'Contact Saves',
  brochure_click: 'Brochure Clicks',
  product_click: 'Product Clicks',
  form_submit: 'Form Submissions',
  share_click: 'Share Clicks',
  whatsapp_click: 'WhatsApp Clicks',
  cta_click: 'CTA Clicks',
  scroll_depth: 'Scroll Depth',
  send_to_self: 'Send to Self',
}

export async function getAnalyticsBreakdowns(
  days: number = 30
): Promise<{ data?: AnalyticsBreakdowns; error?: string }> {
  const { tenantId, supabase } = await getAuthenticatedTenant()

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, metadata_json')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)

  if (error) return { error: error.message }

  const events = data ?? []

  // Per-event-type breakdown
  const eventCounts = new Map<string, number>()
  for (const event of events) {
    eventCounts.set(event.event_type, (eventCounts.get(event.event_type) ?? 0) + 1)
  }

  const byEventType: EventTypeBreakdown[] = Array.from(eventCounts.entries())
    .map(([eventType, count]) => ({
      eventType,
      count,
      label: eventTypeLabels[eventType] ?? eventType,
    }))
    .sort((a, b) => b.count - a.count)

  // Per-product breakdown from product_click events
  const productCounts = new Map<string, { title: string; clicks: number }>()
  for (const event of events) {
    if (event.event_type === 'product_click') {
      const meta = event.metadata_json as Record<string, unknown> | null
      const productId = (meta?.product_id as string) || 'unknown'
      const productTitle = (meta?.product_title as string) || productId
      const existing = productCounts.get(productId) ?? {
        title: productTitle,
        clicks: 0,
      }
      existing.clicks++
      productCounts.set(productId, existing)
    }
  }

  const byProduct: ProductBreakdown[] = Array.from(productCounts.entries())
    .map(([productId, { title, clicks }]) => ({
      productId,
      productTitle: title,
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)

  return { data: { byEventType, byProduct } }
}
