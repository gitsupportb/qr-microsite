import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenantSlug } = await params
  const supabase = await createClient()

  // Query tenant by slug (uses anon RLS policy: active tenants only)
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, status')
    .eq('slug', tenantSlug)
    .eq('status', 'active')
    .single()

  if (error || !tenant) {
    notFound()
  }

  return (
    <div data-tenant-id={tenant.id} data-tenant-slug={tenant.slug}>
      {children}
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('slug', tenantSlug)
    .eq('status', 'active')
    .single()

  if (!tenant) {
    return { title: 'Not Found' }
  }

  return {
    title: tenant.name,
    description: `Visit ${tenant.name}'s microsite`,
  }
}
