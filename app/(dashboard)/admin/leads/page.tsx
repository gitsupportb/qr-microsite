import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLeads, getLeadMetrics } from '@/lib/actions/leads'
import { LeadsDashboard } from '@/components/admin/leads-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LeadsPage() {
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

  const leadsResult = await getLeads()
  const metricsResult = await getLeadMetrics()

  if ('error' in leadsResult) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{leadsResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if ('error' in metricsResult) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{metricsResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <LeadsDashboard
        initialLeads={leadsResult.data}
        metrics={metricsResult.data}
      />
    </div>
  )
}
