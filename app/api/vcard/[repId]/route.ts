import { createAdminClient } from '@/lib/supabase/admin'
import { generateVCard } from '@/lib/vcard/generate'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ repId: string }> }
) {
  const { repId } = await params

  const supabase = createAdminClient()

  // Fetch representative with joined business profile in one query
  const { data: rep, error } = await supabase
    .from('representatives')
    .select(
      '*, business_profiles!inner(company_name, website, event_name, stand_number)'
    )
    .eq('id', repId)
    .single()

  if (error || !rep) {
    return new Response('Representative not found', { status: 404 })
  }

  // Extract business profile from the joined data
  const profile = rep.business_profiles as unknown as {
    company_name: string
    website: string | null
    event_name: string | null
    stand_number: string | null
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

  // Sanitize filename: remove non-alphanumeric (except spaces), replace spaces with underscores
  const safeName =
    rep.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') + '.vcf'

  return new Response(vcf, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
