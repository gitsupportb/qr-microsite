import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BusinessProfileForm } from '@/components/business-profile/business-profile-form'

export default async function BusinessProfilePage() {
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

  // Fetch existing profile (null for new tenants)
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
        <BusinessProfileForm initialData={profile} tenantId={tenantId} />
      </div>
    </div>
  )
}
