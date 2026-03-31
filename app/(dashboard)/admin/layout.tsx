import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { Separator } from '@/components/ui/separator'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar user={{ email: user.email ?? undefined }} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 bg-white/60 backdrop-blur-xl border-b border-white/20 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium text-slate-800">Admin Dashboard</h1>
        </header>
        <main className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
