import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/documents/[docId]
 * Generates a fresh signed URL and redirects to it.
 * This ensures document links never expire — each click gets a fresh URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params
  const supabase = createAdminClient()

  // Fetch the document record
  const { data: doc, error } = await supabase
    .from('documents')
    .select('storage_path, title, visibility')
    .eq('id', docId)
    .single()

  if (error || !doc || !doc.storage_path) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Don't serve private documents
  if (doc.visibility === 'private') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Generate fresh signed URL (1 hour — plenty for download)
  const { data: signedData, error: signError } = await supabase.storage
    .from('private-documents')
    .createSignedUrl(doc.storage_path, 60 * 60)

  if (signError || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  // Redirect to the fresh signed URL
  return NextResponse.redirect(signedData.signedUrl)
}
