'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const sourceLabels: Record<string, string> = {
  inline: 'Inline',
  scroll_sheet: 'Scroll',
  gated_doc_sheet: 'Gated Doc',
}

const columnHelper = createColumnHelper<Lead>()

const columns = [
  columnHelper.accessor('full_name', {
    header: 'Name',
    cell: (info) => (
      <span className="font-medium">{info.getValue() || '-'}</span>
    ),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => (
      <span className="max-w-[200px] truncate block">
        {info.getValue() || '-'}
      </span>
    ),
  }),
  columnHelper.accessor('phone', {
    header: 'Phone',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('company', {
    header: 'Company',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor(
    (row) =>
      (row.interest_context as { interest_type?: string } | null)
        ?.interest_type,
    {
      id: 'interest',
      header: 'Interest',
      cell: (info) => {
        const value = info.getValue()
        return value ? <Badge variant="secondary">{value}</Badge> : '-'
      },
    }
  ),
  columnHelper.accessor(
    (row) =>
      (row.event_context as { event_name?: string } | null)?.event_name,
    {
      id: 'event',
      header: 'Event',
      cell: (info) => info.getValue() || '-',
    }
  ),
  columnHelper.accessor(
    (row) =>
      (row.interest_context as { form_location?: string } | null)
        ?.form_location,
    {
      id: 'source',
      header: 'Source',
      cell: (info) => {
        const value = info.getValue()
        if (!value) return '-'
        return (
          <Badge variant="outline">
            {sourceLabels[value] || value}
          </Badge>
        )
      },
    }
  ),
  columnHelper.accessor('created_at', {
    header: 'Date',
    cell: (info) => {
      const value = info.getValue()
      if (!value) return '-'
      return format(new Date(value), 'MMM d, yyyy')
    },
  }),
]

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const data = useMemo(() => leads, [leads])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalRows > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {start}-{end} of {totalRows} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
