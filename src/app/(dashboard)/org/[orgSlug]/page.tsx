import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { Plus, FolderKanban, Calendar, LayoutDashboard, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/src/lib/utlis' // keeping your exact import
import { CreateProjectDialog } from '@/src/components/shared/CreateProjectDialog'

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      projects: {
        include: {
          _count: { select: { boards: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      members: { where: { userId: user!.id } },
    },
  })

  if (!org || org.members.length === 0) notFound()

  const userRole = org.members[0].role
  const isManager = userRole === 'OWNER'

  // Pro-tier status pills with 1px inset rings instead of heavy background blocks
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    ON_HOLD: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    COMPLETED: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    CANCELLED: 'bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-500/20',
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/30">
      
      {/* ── Page Header ── */}
      <header className="px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Projects
            </h1>
            <p className="text-[14px] text-zinc-500 mt-1">
              {org.projects.length} project{org.projects.length !== 1 ? 's' : ''} in {org.name}
            </p>
          </div>
          {isManager && (
            <div className="shrink-0">
              <CreateProjectDialog orgId={org.id} />
            </div>
          )}
        </div>
      </header>

      {/* ── Main Canvas ── */}
      <main className="flex-1 px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          
          {org.projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200 rounded-2xl bg-white shadow-sm">
              <div className="h-14 w-14 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm mb-5">
                <FolderKanban className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">No projects yet</h3>
              <p className="text-[14px] text-zinc-500 mt-1.5 max-w-sm mb-8">
                Projects are where your team organizes boards, tasks, and timelines. Create your first one to get started.
              </p>
              {isManager && (
                <CreateProjectDialog orgId={org.id} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {org.projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="group block h-full">
                  <div className="relative flex flex-col h-full bg-white rounded-xl border border-zinc-200/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-zinc-300">
                    
                    {/* Header: Project Icon & Title */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Fake Project Icon (Standard SaaS practice when logos aren't uploaded) */}
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-[16px] font-bold text-white shadow-sm shrink-0">
                          {project.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight group-hover:text-zinc-700 transition-colors line-clamp-1">
                            {project.name}
                          </h3>
                          <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusColors[project.status] || statusColors.ACTIVE}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1 mb-6">
                      <p className="text-[14px] leading-relaxed text-zinc-500 line-clamp-2">
                        {project.description || <span className="italic opacity-70">No description provided.</span>}
                      </p>
                    </div>

                    {/* Footer / Metadata */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                      
                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-[12px] font-medium text-zinc-500">
                        <div className="flex items-center gap-1.5" title={`${project._count.boards} boards`}>
                          <LayoutDashboard className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{project._count.boards}</span>
                        </div>
                        
                        <div className="w-px h-3 bg-zinc-200" aria-hidden="true" />
                        
                        <div className="flex items-center gap-1.5" title={`${project._count.members} members`}>
                          <Users className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{project._count.members}</span>
                        </div>

                        {project.deadline && (
                          <>
                            <div className="w-px h-3 bg-zinc-200" aria-hidden="true" />
                            <div className="flex items-center gap-1.5" title={`Due ${formatDate(project.deadline)}`}>
                              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                              <span className="truncate max-w-[80px]">{formatDate(project.deadline)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Interactive Reveal Arrow */}
                      <div className="h-7 w-7 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}