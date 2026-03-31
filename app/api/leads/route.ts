import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { leadSubmissionSchema } from '@/lib/schemas/lead'
import { leadFormConfigSchema } from '@/lib/schemas/lead-form-config'
import { rateLimit } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { NewLeadEmail } from '@/lib/emails/new-lead'

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

  // 4. Send email notification (fire-and-forget, never blocks response)
  if (process.env.RESEND_API_KEY) {
    try {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('lead_form_config, company_name')
        .eq('id', data.business_profile_id)
        .single()

      const parsed = leadFormConfigSchema.safeParse(
        profile?.lead_form_config
      )
      const notificationEmails = parsed.success
        ? parsed.data.notification_emails
        : undefined

      if (notificationEmails) {
        const validEmails = notificationEmails
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e.length > 0 && e.includes('@'))

        if (validEmails.length > 0) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          void resend.emails.send({
            from:
              process.env.RESEND_FROM_EMAIL ||
              'QR Microsite <noreply@resend.dev>',
            to: validEmails,
            subject: `New Lead: ${data.full_name || data.email}`,
            react: NewLeadEmail({
              leadName: data.full_name ?? null,
              leadEmail: data.email,
              leadCompany: data.company ?? null,
              interestType: data.interest_type ?? null,
              eventName: data.source_context.event_name ?? null,
              pageUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/${data.source_context.page_slug || ''}`,
              submittedAt: new Date().toISOString(),
            }),
          })
        }
      }
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr)
    }
  }

  // 5. Return 201 with lead ID
  return NextResponse.json(
    { id: lead.id, message: 'Lead captured successfully' },
    { status: 201, headers: { 'X-RateLimit-Remaining': String(remaining) } }
  )
}
