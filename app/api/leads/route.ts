import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { leadSubmissionSchema } from '@/lib/schemas/lead'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 1. Rate limit check — reject before parsing body
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const { success: allowed, remaining } = rateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  // 2. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = leadSubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  // 3. Insert via service role (bypasses RLS for anonymous submissions)
  const data = parsed.data
  const supabase = createAdminClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      tenant_id: data.tenant_id,
      business_profile_id: data.business_profile_id,
      email: data.email,
      full_name: data.full_name ?? null,
      phone: data.phone ?? null,
      company: data.company ?? null,
      message: data.message ?? null,
      consent: data.consent,
      rep_id: data.source_context.rep_id ?? null,
      event_context: {
        event_name: data.source_context.event_name ?? null,
        page_slug: data.source_context.page_slug ?? null,
      },
      interest_context: {
        interest_type: data.interest_type ?? null,
        product_interest: data.source_context.product_interest ?? null,
        form_location: data.source_context.form_location,
      },
    })
    .select('id')
    .single()

  if (error) {
    console.error('Lead insert error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }

  // 4. Return 201 with lead ID
  return NextResponse.json(
    { id: lead.id, message: 'Lead captured successfully' },
    { status: 201, headers: { 'X-RateLimit-Remaining': String(remaining) } }
  )
}
