import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import {
  getAnalyticsSummary,
  getAnalyticsTimeSeries,
  getAnalyticsBreakdowns,
} from '@/lib/actions/analytics'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const days = Math.min(
    Math.max(parseInt(params.days || '30', 10) || 30, 1),
    365
  )

  try {
    const [summaryResult, timeSeriesResult, breakdownsResult] =
      await Promise.all([
        getAnalyticsSummary(days),
        getAnalyticsTimeSeries(days),
        getAnalyticsBreakdowns(days),
      ])

    if (summaryResult.error || timeSeriesResult.error || breakdownsResult.error) {
      const errorMsg =
        summaryResult.error || timeSeriesResult.error || breakdownsResult.error
      return (
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-6xl">
        <AnalyticsDashboard
          summary={summaryResult.data!}
          timeSeries={timeSeriesResult.data!}
          breakdowns={breakdownsResult.data!}
          initialDays={days}
        />
      </div>
    )
  } catch {
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
