import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RepList } from '@/components/representatives/rep-list'

export default async function RepresentativesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant_id from app_metadata or users table
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

  // Check if business profile exists
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('tenant_id', tenantId)
    .single()

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
          <RepList initialReps={[]} tenantId={tenantId} noProfile={true} />
        </div>
      </div>
    )
  }

  // Fetch representatives ordered by sort_order
  const { data: reps } = await supabase
    .from('representatives')
    .select('*')
    .eq('business_profile_id', profile.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
        <RepList
          initialReps={reps ?? []}
          tenantId={tenantId}
          noProfile={false}
        />
      </div>
    </div>
  )
}
