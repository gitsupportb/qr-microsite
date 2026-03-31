import { Download } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
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

type DocumentWithUrl = DocumentRow & { downloadUrl: string | null }

export async function DocumentSection({
  documents,
  tenantSlug,
  tenantId,
  businessProfileId,
}: DocumentSectionProps) {
  const visibleDocs = documents.filter((doc) => doc.visibility !== 'private')

  if (visibleDocs.length === 0) return null

  // Use service role client for signed URLs — no JWT expiry issues
  const supabase = createAdminClient()

  const docsWithUrls: DocumentWithUrl[] = await Promise.all(
    visibleDocs.map(async (doc) => {
      if (doc.storage_path) {
        // 7-day signed URL using service role (no JWT dependency)
        const { data } = await supabase.storage
          .from('private-documents')
          .createSignedUrl(doc.storage_path, 60 * 60 * 24 * 7)
        return { ...doc, downloadUrl: data?.signedUrl ?? doc.file_url }
      }
      return { ...doc, downloadUrl: doc.file_url }
    })
  )

  return (
    <section id="catalog" className="px-5 sm:px-8" aria-label="Documents & Brochures">
      <div className="mx-auto max-w-xl border-t border-[var(--foreground)]/5 py-8">
        <p className="mb-5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Documents
        </p>

        <div className="divide-y divide-[var(--foreground)]/5">
          {docsWithUrls.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`block h-2 w-2 shrink-0 rounded-full ${dotColor(doc.type)}`} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-[var(--foreground)]">
                  {doc.title}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {formatType(doc.type)}
                </p>
              </div>

              {doc.downloadUrl && (
                tenantId && businessProfileId ? (
                  <DocumentLink
                    href={doc.downloadUrl}
                    tenantId={tenantId}
                    businessProfileId={businessProfileId}
                    documentId={doc.id}
                    documentTitle={doc.title}
                    className="inline-flex h-9 shrink-0 items-center gap-1 text-xs font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/70"
                    ariaLabel={`Download ${doc.title}`}
                  >
                    <Download className="size-3.5" />
                    <span>Download</span>
                  </DocumentLink>
                ) : (
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 shrink-0 items-center gap-1 text-xs font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/70"
                  >
                    <Download className="size-3.5" />
                    <span>Download</span>
                  </a>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
