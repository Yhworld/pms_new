'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Settings,
  LogOut, ChevronsUpDown, CheckCircle2, BarChart2 // <-- NEW: Added CheckCircle2
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem,
} from '@/src/components/ui/sidebar'
import { logout } from '@/src/lib/actions/auth.actions'
import type { Organization, OrgRole } from '@/src/types'

interface AppSidebarProps {
  org: Organization
  userRole: OrgRole
  userId: string
}

export function AppSidebar({ org, userRole }: AppSidebarProps) {
  const pathname = usePathname()
  const base = `/org/${org.slug}`

  // ─── NEW: Added My Tasks to the navigation items
const navItems = [
  {
    label: 'My Tasks',
    href: `${base}/my-tasks`,
    icon: CheckCircle2,
    ownerOnly: false,
  },
  {
    label: 'Dashboard',
    href: `${base}/dashboard`,
    icon: BarChart2,
    ownerOnly: false,
  },
  {
    label: 'Projects',
    href: base,   // ← was just `base`
    icon: LayoutDashboard,
    ownerOnly: false,
  },
  {
    label: 'Members',
    href: `${base}/members`,
    icon: Users,
    ownerOnly: false,
  },
].filter(item => !item.ownerOnly || userRole === 'OWNER')

  return (
    <Sidebar className="border-r border-zinc-200/60 bg-zinc-50/30">
      
      {/* ── Header: Workspace Selector Illusion ── */}
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3 px-1.5 py-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100/80 cursor-pointer transition-colors group">
          {/* High-contrast solid logo block */}
          <div className="h-8 w-8 rounded-md bg-zinc-900 flex items-center justify-center text-[12px] font-bold text-white shadow-sm shadow-black/10 group-hover:scale-105 transition-transform duration-200">
            {org.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-zinc-900 truncate leading-tight tracking-tight">
              {org.name}
            </p>
            <p className="text-[12px] font-medium text-zinc-500 capitalize leading-tight mt-0.5">
              {userRole.toLowerCase()} Workspace
            </p>
          </div>
          {/* Subtle switcher arrows to imply interaction */}
          <ChevronsUpDown className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                // Better active state matching for nested routes
                // Fix: Ensure the root 'Projects' route doesn't falsely light up for everything
                const isActive = item.href === base 
                  ? pathname === base 
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-9 px-3 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-zinc-900 text-white font-medium hover:bg-zinc-800 hover:text-white shadow-sm' 
                          : 'text-zinc-600 font-medium hover:bg-zinc-100/80 hover:text-zinc-900'
                      }`}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`} />
                        <span className="text-[13px]">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: Clean Logout ── */}
      <SidebarFooter className="p-4 mb-2">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 h-9 text-[13px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 rounded-md transition-colors group"
          >
            <LogOut className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            <span>Sign out</span>
          </button>
        </form>
      </SidebarFooter>

    </Sidebar>
  )
}