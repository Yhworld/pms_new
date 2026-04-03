import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { Calendar, Users, LayoutDashboard, Plus, KanbanSquare, CircleDot, AlertTriangle } from 'lucide-react'
import { isPast, differenceInDays } from 'date-fns'
import { formatDate } from '@/src/lib/utlis'
import { CreateBoardDialog } from '@/src/components/shared/CreateBoardDialog'
import { BoardCard } from '@/src/components/shared/BoardCard'
import { AddProjectMemberDialog } from '@/src/components/shared/AddProjectMemberDialog'
import { ProjectSettingsDialog } from '@/src/components/shared/ProjectSettingsDialog' // <-- NEW: Added import

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      boards: {
        include: {
          _count: { select: { lists: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      members: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
      organization: true,
    },
  })

  if (!project) notFound()

  const currentMember = project.members.find((m) => m.userId === user!.id)
  if (!currentMember) notFound()

  const isManager = currentMember.role === 'MANAGER'

  // ─── Overdue Logic ────────────────────────────────────────────────────────────
  const isOverdue = project.deadline && 
                    isPast(project.deadline) && 
                    project.status !== 'COMPLETED' && 
                    project.status !== 'CANCELLED'

  const daysOverdue = isOverdue ? differenceInDays(new Date(), project.deadline!) : 0

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    ON_HOLD: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    COMPLETED: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    CANCELLED: 'bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-500/20',
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── High-End Project Header ── */}
      <header className="px-8 pt-12 pb-8 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Title & Description */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                  {project.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium tracking-wide capitalize ${statusColors[project.status] || statusColors.ACTIVE}`}>
                  {project.status.replace('_', ' ').toLowerCase()}
                </span>
              </div>
              
              {project.description && (
                <p className="text-[15px] text-zinc-500 leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Manager Actions */}
            {isManager && (
              <div className="shrink-0 flex items-center gap-2"> {/* <-- NEW: Added flex container */}
                <AddProjectMemberDialog
                  projectId={project.id}
                  orgId={project.organizationId}
                  existingMemberIds={project.members.map((m) => m.userId)}
                />
                <ProjectSettingsDialog project={project} /> {/* <-- NEW: Settings component */}
              </div>
            )}
          </div>

          {/* Properties Meta Row */}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-[13px] font-medium text-zinc-500">
            
            {/* Avatars Stack */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    title={member.user.name ?? member.user.email}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 ring-2 ring-white text-[10px] font-semibold text-zinc-600 uppercase tracking-wider"
                  >
                    {(member.user.name ?? member.user.email).slice(0, 2)}
                  </div>
                ))}
              </div>
              <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="w-px h-4 bg-zinc-200 hidden sm:block" aria-hidden="true" />

            {/* Board Count */}
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-zinc-400" />
              <span>{project.boards.length} board{project.boards.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Deadline / Overdue Warning */}
            {project.deadline && (
              <>
                <div className="w-px h-4 bg-zinc-200 hidden sm:block" aria-hidden="true" />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                  isOverdue 
                    ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' 
                    : 'text-zinc-500'
                }`}>
                  {isOverdue ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  
                  <span className="font-medium">
                    {isOverdue 
                      ? `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` 
                      : `Due ${formatDate(project.deadline)}`
                    }
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Boards Canvas ── */}
      <main className="flex-1 bg-zinc-50/50 px-8 py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-zinc-900 flex items-center gap-2">
              <KanbanSquare className="h-4 w-4 text-zinc-400" />
              Project Boards
            </h2>
            {isManager && (
              <CreateBoardDialog projectId={project.id} />
            )}
          </div>

          {project.boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/80">
              <div className="h-12 w-12 rounded-full bg-white border border-zinc-100 flex items-center justify-center shadow-sm mb-4">
                <KanbanSquare className="h-5 w-5 text-zinc-400" />
              </div>
              <h3 className="text-[14px] font-medium text-zinc-900">No boards yet</h3>
              <p className="text-[13px] text-zinc-500 mt-1 max-w-sm mb-6">
                Create your first board to start tracking tasks, bugs, or feature requests for this project.
              </p>
              {isManager && (
                <CreateBoardDialog projectId={project.id} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {project.boards.map((board) => (
                <BoardCard key={board.id} board={board} projectId={project.id} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}