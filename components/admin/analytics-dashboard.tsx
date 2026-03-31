'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Eye, Users, Download, FormInput, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { resetAnalytics } from '@/lib/actions/analytics'
import { toast } from 'sonner'
import type {
  AnalyticsSummary,
  TimeSeriesPoint,
  AnalyticsBreakdowns,
} from '@/lib/actions/analytics'

interface AnalyticsDashboardProps {
  summary: AnalyticsSummary
  timeSeries: TimeSeriesPoint[]
  breakdowns: AnalyticsBreakdowns
  initialDays: number
}

const dayOptions = [7, 30, 90] as const

export function AnalyticsDashboard({
  summary,
  timeSeries,
  breakdowns,
  initialDays,
}: AnalyticsDashboardProps) {
  const router = useRouter()
  const [isResetting, startResetTransition] = useTransition()

  function handleDaysChange(days: number) {
    router.push(`/admin/analytics?days=${days}`)
  }

  function handleResetAnalytics() {
    if (
      !window.confirm(
        'Are you sure you want to reset all analytics data? This action cannot be undone.'
      )
    ) {
      return
    }
    startResetTransition(async () => {
      const result = await resetAnalytics()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Analytics data has been reset')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track visitor engagement on your microsite
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAnalytics}
          disabled={isResetting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isResetting ? 'Resetting...' : 'Reset Analytics'}
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Total Page Views</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalPageViews}</p>
            <p className="text-xs text-muted-foreground">
              Last {summary.period} days
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Unique Visitors</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.uniqueVisitors}</p>
            <p className="text-xs text-muted-foreground">Approximate</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Contact Save Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.saveContactRate}</p>
            <p className="text-xs text-muted-foreground">
              Of page views
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FormInput className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Form Conversion</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.formConversionRate}</p>
            <p className="text-xs text-muted-foreground">
              Of page views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Events Over Time</CardTitle>
            <div className="flex gap-1">
              {dayOptions.map((d) => (
                <Button
                  key={d}
                  variant={initialDays === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDaysChange(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnalyticsChart data={timeSeries} />
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Event Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Event Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdowns.byEventType.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No event data yet
              </p>
            ) : (
              <div className="space-y-3">
                {breakdowns.byEventType.map((item) => {
                  const maxCount = breakdowns.byEventType[0]?.count ?? 1
                  const widthPct = Math.max(
                    (item.count / maxCount) * 100,
                    4
                  )
                  return (
                    <div key={item.eventType} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary/60"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Click Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Product Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdowns.byProduct.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No product click data yet
              </p>
            ) : (
              <div className="space-y-3">
                {breakdowns.byProduct.map((item) => {
                  const maxClicks = breakdowns.byProduct[0]?.clicks ?? 1
                  const widthPct = Math.max(
                    (item.clicks / maxClicks) * 100,
                    4
                  )
                  return (
                    <div key={item.productId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate mr-2">
                          {item.productTitle}
                        </span>
                        <span className="font-medium shrink-0">
                          {item.clicks}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary/60"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
