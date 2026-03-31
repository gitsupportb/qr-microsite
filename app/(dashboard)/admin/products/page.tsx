import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductList } from '@/components/products/product-list'

export default async function ProductsPage() {
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
        <ProductList
          initialProducts={[]}
          categories={[]}
          tenantId={tenantId}
          noProfile={true}
        />
      </div>
    )
  }

  // Fetch products with category join
  const { data: products } = await supabase
    .from('products')
    .select('*, product_categories(id, name, slug)')
    .eq('business_profile_id', profile.id)
    .order('sort_order', { ascending: true })

  // Fetch categories for filter tabs and form dropdown
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl">
      <ProductList
        initialProducts={products ?? []}
        categories={categories ?? []}
        tenantId={tenantId}
        noProfile={false}
      />
    </div>
  )
}
