'use client'

import { useQueryState, parseAsString } from 'nuqs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

export function useLeadFilters() {
  const [from] = useQueryState('from', parseAsString)
  const [to] = useQueryState('to', parseAsString)
  const [event] = useQueryState('event', parseAsString)
  const [source] = useQueryState('source', parseAsString)
  const [product] = useQueryState('product', parseAsString)
  return { from, to, event, source, product }
}

export function LeadsFilters() {
  const [from, setFrom] = useQueryState('from', parseAsString)
  const [to, setTo] = useQueryState('to', parseAsString)
  const [event, setEvent] = useQueryState('event', parseAsString)
  const [source, setSource] = useQueryState('source', parseAsString)
  const [product, setProduct] = useQueryState('product', parseAsString)

  const hasFilters = from || to || event || source || product

  function clearFilters() {
    void setFrom(null)
    void setTo(null)
    void setEvent(null)
    void setSource(null)
    void setProduct(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="date"
        value={from ?? ''}
        onChange={(e) => void setFrom(e.target.value || null)}
        className="w-[150px]"
        aria-label="From date"
      />
      <Input
        type="date"
        value={to ?? ''}
        onChange={(e) => void setTo(e.target.value || null)}
        className="w-[150px]"
        aria-label="To date"
      />
      <Input
        type="text"
        placeholder="Filter by event..."
        value={event ?? ''}
        onChange={(e) => void setEvent(e.target.value || null)}
        className="w-[180px]"
      />
      <select
        value={source ?? ''}
        onChange={(e) => void setSource(e.target.value || null)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label="Form type"
      >
        <option value="">All Sources</option>
        <option value="inline">Inline</option>
        <option value="scroll_sheet">Scroll Sheet</option>
        <option value="gated_doc_sheet">Gated Document</option>
      </select>
      <Input
        type="text"
        placeholder="Filter by product..."
        value={product ?? ''}
        onChange={(e) => void setProduct(e.target.value || null)}
        className="w-[180px]"
      />
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
