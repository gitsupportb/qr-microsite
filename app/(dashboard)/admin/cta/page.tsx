import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CtaConfigList } from '@/components/cta-config/cta-config-list'

export default async function CtaConfigurationPage() {
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
          <CtaConfigList initialData={[]} noProfile={true} />
        </div>
      </div>
    )
  }

  // Fetch CTA configurations ordered by sort_order
  const { data: ctaConfigs } = await supabase
    .from('cta_configurations')
    .select('*')
    .eq('business_profile_id', profile.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
        <CtaConfigList initialData={ctaConfigs ?? []} />
      </div>
    </div>
  )
}
