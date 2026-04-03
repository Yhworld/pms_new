import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { MyTasksClient } from '@/src/components/shared/MyTasksClient'

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch tasks and include the user's specific role in that project
  const tasks = await prisma.card.findMany({
    where: {
      members: { some: { userId: user.id } },
      status: { not: 'DONE' },
    },
    include: {
      list: {
        include: {
          board: {
            include: { 
              project: {
                include: {
                  // NEW: Fetch the current user's role in this specific project
                  members: { where: { userId: user.id } } 
                }
              } 
            }
          }
        }
      },
      labels: { include: { label: true } },
      _count: { select: { comments: true, attachments: true } }
    },
  })

  // 2. Sort by deadline, and map the role to a clean `canEdit` boolean
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  }).map(task => {
    // Determine if the user is a MANAGER or MEMBER for this specific task's project
    const projectRole = task.list.board.project.members[0]?.role
    const canEdit = projectRole === 'MANAGER' || projectRole === 'MEMBER'
    
    return { ...task, canEdit }
  })

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-8 pt-12 pb-8 border-b border-zinc-100">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="h-12 w-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">My Tasks</h1>
            <p className="text-[15px] text-zinc-500 mt-1">
              Manage your assigned work across all projects.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-zinc-50/50 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <MyTasksClient initialTasks={sortedTasks} currentUserId={user.id} />
        </div>
      </main>
    </div>
  )
}