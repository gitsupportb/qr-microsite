import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CategoryList } from '@/components/products/category-list'

export default async function CategoriesPage() {
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

  // Fetch categories ordered by sort_order
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl">
      <CategoryList initialCategories={categories ?? []} />
    </div>
  )
}
