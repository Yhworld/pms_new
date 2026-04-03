import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { AppSidebar } from '@/src/components/shared/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/src/components/ui/sidebar'
import { NotificationBell } from '@/src/components/shared/NotificationBell'
import { getUnreadCount } from '@/src/lib/actions/notification.actions'
import { Toaster } from 'sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [orgMember, unreadCount] = await Promise.all([
    prisma.orgMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    }),
    getUnreadCount(),
  ])

  if (!orgMember) redirect('/setup')

  return (
    <SidebarProvider>
      <AppSidebar
        org={orgMember.organization}
        userRole={orgMember.role}
        userId={user.id}
      />
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="flex items-center justify-between h-14 px-4 border-b">
          <SidebarTrigger />
          <NotificationBell               
            userId={user.id}
            initialUnreadCount={unreadCount}
          />
        </header>
        <div className="flex-1 p-6">
          {children}
          <Toaster position="bottom-right" richColors />
        </div>
      </main>
    </SidebarProvider>
  )
}
