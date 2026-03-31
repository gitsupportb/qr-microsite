import { createClient } from '@/lib/supabase/client'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadImage(
  tenantId: string,
  category: 'logos' | 'hero' | 'representatives' | 'products',
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  // Client-side MIME type validation
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { error: 'File must be JPEG, PNG, or WebP' }
  }

  const supabase = createClient()
  // Sanitize filename: remove non-alphanumeric chars except dots and hyphens
  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filename = `${Date.now()}-${sanitized}`
  // Path pattern: {tenant_id}/{category}/{filename}
  // First folder segment must be tenant_id for RLS policy match
  const filePath = `${tenantId}/${category}/${filename}`

  const { error } = await supabase.storage
    .from('public-assets')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (error) return { error: error.message }

  const { data } = supabase.storage
    .from('public-assets')
    .getPublicUrl(filePath)

  return { publicUrl: data.publicUrl }
}

const ACCEPTED_DOCUMENT_TYPES = ['application/pdf']

export async function uploadDocument(
  tenantId: string,
  file: File,
  existingPath?: string
): Promise<{ fileUrl: string; storagePath: string } | { error: string }> {
  // Client-side MIME type validation
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
    return { error: 'File must be a PDF' }
  }

  const supabase = createClient()

  // Determine storage path: reuse existing path for replacement, or generate new
  let filePath: string
  if (existingPath) {
    filePath = existingPath
  } else {
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${Date.now()}-${sanitized}`
    filePath = `${tenantId}/documents/${filename}`
  }

  const { error } = await supabase.storage
    .from('private-documents')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (error) return { error: error.message }

  // Private bucket requires signed URLs (not public URLs)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('private-documents')
    .createSignedUrl(filePath, 60 * 60) // 1 hour expiry

  if (signedError || !signedData?.signedUrl) {
    return { error: signedError?.message || 'Failed to generate signed URL' }
  }

  return { fileUrl: signedData.signedUrl, storagePath: filePath }
}
