import { createAdminClient } from '@/lib/supabase/admin'
import { generateVCard } from '@/lib/vcard/generate'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params

  const supabase = createAdminClient()

  // Step 1: Resolve tenant by slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .eq('status', 'active')
    .single()

  if (tenantError || !tenant) {
    return new Response('Tenant not found', { status: 404 })
  }

  // Step 2: Resolve business profile
  const { data: profile, error: profileError } = await supabase
    .from('business_profiles')
    .select('id, company_name, website, event_name, stand_number')
    .eq('tenant_id', tenant.id)
    .single()

  if (profileError || !profile) {
    return new Response('Business profile not found', { status: 404 })
  }

  // Step 3: Find primary representative
  let { data: rep } = await supabase
    .from('representatives')
    .select('*')
    .eq('business_profile_id', profile.id)
    .eq('is_primary', true)
    .single()

  // Step 4: Fall back to first rep by sort_order if no primary
  if (!rep) {
    const { data: fallbackRep } = await supabase
      .from('representatives')
      .select('*')
      .eq('business_profile_id', profile.id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single()

    rep = fallbackRep
  }

  // Step 5: If still no rep, return 404
  if (!rep) {
    return new Response('No representative found', { status: 404 })
  }

  const vcf = generateVCard({
    name: rep.name,
    title: rep.title,
    email: rep.email,
    phone: rep.phone,
    whatsapp: rep.whatsapp,
    orgName: profile.company_name,
    website: profile.website,
    eventName: profile.event_name,
    standNumber: profile.stand_number,
    customNote: rep.vcard_note_template,
  })

  // Sanitize filename using company name for business vCard
  const safeName =
    profile.company_name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') +
    '.vcf'

  return new Response(vcf, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
