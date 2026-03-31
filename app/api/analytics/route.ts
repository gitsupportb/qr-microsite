import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyticsEventSchema } from '@/lib/schemas/analytics'
import { rateLimit } from '@/lib/rate-limit'
import type { Json } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

/**
 * Simple string hash for user-agent fingerprinting.
 * NOT cryptographic -- used only for anonymous session grouping.
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString(36)
}

export async function POST(request: NextRequest) {
  // 1. Rate limit check -- reject before parsing body (100 events/IP/minute)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const { success: allowed } = rateLimit(ip, 100, 60_000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // 2. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = analyticsEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  // 3. Insert via service role (bypasses RLS for anonymous analytics writes)
  const data = parsed.data
  const userAgent = request.headers.get('user-agent') || ''
  const supabase = createAdminClient()

  const { error } = await supabase.from('analytics_events').insert({
    tenant_id: data.tenant_id,
    business_profile_id: data.business_profile_id ?? null,
    event_type: data.event_type,
    metadata_json: (data.metadata ?? {}) as Json,
    user_agent_hash: userAgent ? hashString(userAgent) : null,
  })

  if (error) {
    console.error('Analytics insert error:', error)
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    )
  }

  // 4. Return 204 No Content -- analytics should be lightweight
  return new NextResponse(null, { status: 204 })
}
