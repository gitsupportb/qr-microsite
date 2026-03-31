'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Package,
  FileText,
  Users,
  UserRound,
  MousePointerClick,
  QrCode,
  BarChart3,
  Palette,
  LogOut,
} from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Business Profile', href: '/admin/business', icon: Building2, disabled: false },
  { label: 'Representatives', href: '/admin/representatives', icon: UserRound, disabled: false },
  { label: 'CTA Bar', href: '/admin/cta', icon: MousePointerClick, disabled: false },
  { label: 'Products', href: '/admin/products', icon: Package, disabled: false },
  { label: 'Documents', href: '/admin/documents', icon: FileText, disabled: false },
  { label: 'Leads', href: '/admin/leads', icon: Users, disabled: true },
  { label: 'QR Codes', href: '/admin/qr-codes', icon: QrCode, disabled: true },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, disabled: true },
  { label: 'Theme', href: '/admin/theme', icon: Palette, disabled: true },
]

export function AppSidebar({ user }: { user: { email?: string } }) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <QrCode className="h-4 w-4" />
          </div>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            QR Microsite
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  {item.disabled ? (
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={false}
                      className="opacity-50 cursor-not-allowed"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 px-2 py-1.5 group-data-[collapsible=icon]:items-center">
          {user.email && (
            <p className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {user.email}
            </p>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Log out</span>
            </button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
