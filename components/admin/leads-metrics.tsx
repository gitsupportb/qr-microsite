'use client'

import { Users, TrendingUp, Calendar, LayoutGrid } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LeadsMetricsProps {
  total: number
  thisWeek: number
  thisMonth: number
  byFormLocation: Record<string, number>
}

const formLocationLabels: Record<string, string> = {
  inline: 'Inline',
  scroll_sheet: 'Scroll',
  gated_doc_sheet: 'Gated',
  unknown: 'Other',
}

export function LeadsMetrics({
  total,
  thisWeek,
  thisMonth,
  byFormLocation,
}: LeadsMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Total Leads</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{total}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle>This Week</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{thisWeek}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle>This Month</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{thisMonth}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <CardTitle>By Source</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {Object.entries(byFormLocation).length > 0 ? (
              Object.entries(byFormLocation).map(([key, count]) => (
                <p key={key} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{count}</span>{' '}
                  {formLocationLabels[key] || key}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
