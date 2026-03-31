import { Download } from 'lucide-react'
import { DocumentLink } from '@/components/microsite/document-link'
import type { Database } from '@/lib/supabase/types'

type DocumentRow = Database['public']['Tables']['documents']['Row']

interface DocumentSectionProps {
  documents: DocumentRow[]
  tenantSlug: string
  tenantId?: string
  businessProfileId?: string
}

function dotColor(type: DocumentRow['type']): string {
  switch (type) {
    case 'catalog': return 'bg-blue-500'
    case 'brochure': return 'bg-green-500'
    case 'datasheet': return 'bg-purple-500'
    case 'certification': return 'bg-amber-500'
    case 'pricing_sheet': return 'bg-rose-500'
    default: return 'bg-gray-400'
  }
}

function formatType(type: string): string {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/**
 * Document section that uses /api/documents/[docId] for downloads.
 * Each click generates a fresh signed URL — links never expire.
 * No server-side Supabase client needed (pure Server Component).
 */
export function DocumentSection({
  documents,
  tenantSlug,
  tenantId,
  businessProfileId,
}: DocumentSectionProps) {
  const visibleDocs = documents.filter((doc) => doc.visibility !== 'private')

  if (visibleDocs.length === 0) return null

  return (
    <section id="catalog" className="px-5 sm:px-8" aria-label="Documents & Brochures">
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 p-5 shadow-lg shadow-black/[0.03]">
          <p className="mb-5 text-[0.6875rem] uppercase tracking-[0.1em] text-slate-400 font-medium">
            Documents
          </p>

          <div className="divide-y divide-slate-200/50">
            {visibleDocs.map((doc) => {
              // Use the API route for fresh signed URLs on every click
              const downloadHref = `/api/documents/${doc.id}`

              return (
                <div key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`block h-2 w-2 shrink-0 rounded-full ${dotColor(doc.type)}`} />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-slate-800">
                      {doc.title}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {formatType(doc.type)}
                    </p>
                  </div>

                  {tenantId && businessProfileId ? (
                    <DocumentLink
                      href={downloadHref}
                      tenantId={tenantId}
                      businessProfileId={businessProfileId}
                      documentId={doc.id}
                      documentTitle={doc.title}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 px-3 text-xs font-medium text-blue-600 transition-all duration-200 hover:bg-white/70"
                      ariaLabel={`Download ${doc.title}`}
                    >
                      <Download className="size-3.5" />
                      <span>Download</span>
                    </DocumentLink>
                  ) : (
                    <a
                      href={downloadHref}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 px-3 text-xs font-medium text-blue-600 transition-all duration-200 hover:bg-white/70"
                    >
                      <Download className="size-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
