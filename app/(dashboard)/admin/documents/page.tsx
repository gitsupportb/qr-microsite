import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DocumentList } from '@/components/documents/document-list'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant_id from app_metadata or users table
  let tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()
    if (!userData) redirect('/login')
    tenantId = userData.tenant_id
  }

  // Check if business profile exists
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('tenant_id', tenantId)
    .single()

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl">
        <DocumentList
          initialDocuments={[]}
          products={[]}
          tenantId={tenantId}
          noProfile={true}
        />
      </div>
    )
  }

  // Fetch documents with product join
  const { data: documents } = await supabase
    .from('documents')
    .select('*, products(id, title)')
    .eq('business_profile_id', profile.id)
    .order('created_at', { ascending: false })

  // Fetch products for the assignment dropdown
  const { data: products } = await supabase
    .from('products')
    .select('id, title')
    .eq('business_profile_id', profile.id)
    .eq('visible', true)
    .order('title')

  return (
    <div className="mx-auto max-w-4xl">
      <DocumentList
        initialDocuments={documents ?? []}
        products={products ?? []}
        tenantId={tenantId}
        noProfile={false}
      />
    </div>
  )
}
