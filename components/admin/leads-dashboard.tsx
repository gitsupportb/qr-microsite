'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import Papa from 'papaparse'
import { Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadsMetrics } from '@/components/admin/leads-metrics'
import { LeadsFilters, useLeadFilters } from '@/components/admin/leads-filters'
import { LeadsTable } from '@/components/admin/leads-table'

import type { Json } from '@/lib/supabase/types'

interface Lead {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  event_context: Json
  interest_context: Json
  status: string
  created_at: string
}

interface LeadsDashboardProps {
  initialLeads: Lead[]
  metrics: {
    total: number
    thisWeek: number
    thisMonth: number
    byFormLocation: Record<string, number>
  }
}

function DashboardContent({ initialLeads, metrics }: LeadsDashboardProps) {
  const filters = useLeadFilters()

  const filteredLeads = useMemo(() => {
    let result = initialLeads
    if (filters.from) {
      result = result.filter((l) => l.created_at >= filters.from!)
    }
    if (filters.to) {
      const endDate = new Date(filters.to)
      endDate.setDate(endDate.getDate() + 1)
      result = result.filter((l) => l.created_at < endDate.toISOString())
    }
    if (filters.event) {
      const term = filters.event.toLowerCase()
      result = result.filter((l) =>
        (l.event_context as { event_name?: string } | null)?.event_name
          ?.toLowerCase()
          .includes(term)
      )
    }
    if (filters.source) {
      result = result.filter(
        (l) =>
          (l.interest_context as { form_location?: string } | null)
            ?.form_location === filters.source
      )
    }
    if (filters.product) {
      const term = filters.product.toLowerCase()
      result = result.filter((l) =>
        (l.interest_context as { product_interest?: string } | null)
          ?.product_interest
          ?.toLowerCase()
          .includes(term)
      )
    }
    return result
  }, [initialLeads, filters])

  function handleExportCSV() {
    const rows = filteredLeads.map((lead) => ({
      Name: lead.full_name || '',
      Email: lead.email || '',
      Phone: lead.phone || '',
      Company: lead.company || '',
      Interest:
        (lead.interest_context as { interest_type?: string } | null)
          ?.interest_type || '',
      'Product Interest':
        (lead.interest_context as { product_interest?: string } | null)
          ?.product_interest || '',
      Event:
        (lead.event_context as { event_name?: string } | null)?.event_name ||
        '',
      Source:
        (lead.interest_context as { form_location?: string } | null)
          ?.form_location || '',
      Status: lead.status,
      Date: lead.created_at,
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/admin/leads/settings" />}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
      <LeadsMetrics
        total={metrics.total}
        thisWeek={metrics.thisWeek}
        thisMonth={metrics.thisMonth}
        byFormLocation={metrics.byFormLocation}
      />
      <LeadsFilters />
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}{' '}
          found
        </p>
        <LeadsTable leads={filteredLeads} />
      </div>
    </div>
  )
}

export function LeadsDashboard(props: LeadsDashboardProps) {
  return (
    <NuqsAdapter>
      <DashboardContent {...props} />
    </NuqsAdapter>
  )
}
