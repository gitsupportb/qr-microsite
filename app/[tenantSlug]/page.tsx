import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface MicrositePageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function MicrositePage({ params }: MicrositePageProps) {
  const { tenantSlug } = await params
  const supabase = await createClient()

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', tenantSlug)
    .eq('status', 'active')
    .single()

  if (!tenant) {
    notFound()
  }

  // Fetch business profile if it exists
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('company_name, tagline, event_name, stand_number')
    .eq('tenant_id', tenant.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold">{profile?.company_name || tenant.name}</h1>
      {profile?.tagline && (
        <p className="mt-2 text-lg text-gray-600">{profile.tagline}</p>
      )}
      {profile?.event_name && (
        <p className="mt-4 text-sm text-gray-500">
          Met us at {profile.event_name}
          {profile.stand_number && `, Stand ${profile.stand_number}`}
        </p>
      )}
      {!profile && (
        <p className="mt-4 text-gray-400">
          This microsite is being set up. Check back soon.
        </p>
      )}
    </div>
  )
}
