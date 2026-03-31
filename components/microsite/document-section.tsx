import { FileText, Download, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type DocumentRow = Database['public']['Tables']['documents']['Row']

interface DocumentSectionProps {
  documents: DocumentRow[]
  tenantSlug: string
}

/** Map document type to a tailwind color class for the icon circle */
function typeColor(
  type: DocumentRow['type']
): string {
  switch (type) {
    case 'catalog':
      return 'bg-blue-100 text-blue-600'
    case 'brochure':
      return 'bg-green-100 text-green-600'
    case 'datasheet':
      return 'bg-purple-100 text-purple-600'
    case 'certification':
      return 'bg-amber-100 text-amber-600'
    case 'pricing_sheet':
      return 'bg-rose-100 text-rose-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/** Format document type enum for display (capitalize, replace _ with space) */
function formatType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

type DocumentWithUrl = DocumentRow & { downloadUrl: string | null }

/**
 * Server Component that displays public and gated documents.
 * Private documents are filtered out. Public documents get signed download URLs.
 * Gated documents show a "Request Access" button linking to the lead capture section.
 * Returns null when no visible documents exist (hides section entirely).
 */
export async function DocumentSection({
  documents,
  tenantSlug,
}: DocumentSectionProps) {
  // Filter: only public and gated documents visible on the public microsite
  const visibleDocs = documents.filter(
    (doc) => doc.visibility === 'public' || doc.visibility === 'gated'
  )

  // No visible documents -- hide section entirely (same pattern as ProductShowcase)
  if (visibleDocs.length === 0) {
    return null
  }

  // Generate signed download URLs for public documents in parallel
  const supabase = await createClient()

  const docsWithUrls: DocumentWithUrl[] = await Promise.all(
    visibleDocs.map(async (doc) => {
      if (doc.visibility === 'public' && doc.storage_path) {
        const { data } = await supabase.storage
          .from('private-documents')
          .createSignedUrl(doc.storage_path, 60 * 60) // 1 hour expiry
        return { ...doc, downloadUrl: data?.signedUrl ?? null }
      }
      // Gated documents or documents without storage_path: no download URL
      return { ...doc, downloadUrl: null }
    })
  )

  return (
    <section
      id="catalog"
      className="px-4 py-8 sm:px-6"
      aria-label="Documents & Brochures"
    >
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">
        Documents &amp; Brochures
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {docsWithUrls.map((doc) => (
          <Card key={doc.id}>
            <CardContent>
              <div className="flex items-start gap-3">
                {/* Document type icon */}
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${typeColor(doc.type)}`}
                >
                  <FileText className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{doc.title}</p>
                  <Badge variant="secondary" className="mt-1">
                    {formatType(doc.type)}
                  </Badge>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-3">
                {doc.visibility === 'public' && doc.downloadUrl ? (
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 min-w-[44px] items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                    aria-label={`Download ${doc.title}`}
                  >
                    <Download className="size-4" />
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <a
                    href="#lead-capture"
                    className="inline-flex h-9 min-w-[44px] items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                    aria-label={`Request access to ${doc.title}`}
                  >
                    <Lock className="size-4" />
                    <span>Request Access</span>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
