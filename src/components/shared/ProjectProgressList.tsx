import { isPast, differenceInDays } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/src/lib/utlis'

interface Project {
  id: string
  name: string
  status: string
  deadline: Date | null
  total: number
  done: number
  percent: number
  memberCount: number
}

export function ProjectProgressList({ projects }: { projects: Project[] }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="text-[13px] font-semibold text-zinc-900">Project Progress</h3>
        <p className="text-[12px] text-zinc-400">Active & on-hold projects</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-zinc-400">
          No active projects
        </div>
      ) : (
        <div className="divide-y divide-zinc-50">
          {projects.map((project) => {
            const overdue = project.deadline &&
              isPast(new Date(project.deadline)) &&
              project.status !== 'COMPLETED'
            const daysLeft = project.deadline && !overdue
              ? differenceInDays(new Date(project.deadline), new Date())
              : null

            const barColor =
              project.percent === 100 ? '#22c55e'
              : project.percent >= 50 ? '#3b82f6'
              : '#94a3b8'

            return (
              <div key={project.id} className="px-5 py-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium text-zinc-900 leading-tight truncate">
                    {project.name}
                  </p>
                  <span className="text-[12px] font-semibold text-zinc-700 shrink-0">
                    {project.percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${project.percent}%`, backgroundColor: barColor }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{project.done}/{project.total} tasks done</span>
                  {overdue ? (
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </span>
                  ) : daysLeft !== null ? (
                    <span className={daysLeft <= 3 ? 'text-amber-500 font-medium' : ''}>
                      {daysLeft}d left
                    </span>
                  ) : (
                    <span>{project.memberCount} members</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}