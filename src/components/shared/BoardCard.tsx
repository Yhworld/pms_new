import Link from 'next/link'
import { LayoutList, ArrowRight } from 'lucide-react'

interface BoardCardProps {
  board: {
    id: string
    name: string
    color: string | null
    _count: { lists: number }
  }
  projectId: string
  checklistProgress: {
    total: number
    completed: number
  }
}

export function BoardCard({ board, projectId, checklistProgress }: BoardCardProps) {
  const bgColor = board.color ?? '#0f172a'

  const { total, completed } = checklistProgress
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const hasItems = total > 0

  // Color shifts green as it approaches 100%
  const barColor =
    percent === 100
      ? '#16a34a'  // green-600
      : percent >= 50
      ? '#2563eb'  // blue-600
      : '#94a3b8'  // slate-400

  return (
    <Link href={`/projects/${projectId}/boards/${board.id}`} className="group block h-full">
      <div className="relative flex flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-zinc-300 overflow-hidden">

        {/* ── Color Header ── */}
        <div
          className="h-12 w-full relative flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/5 mix-blend-overlay" />
          <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" />
        </div>

        {/* ── Content Body ── */}
        <div className="flex flex-col flex-1 p-5">
          <div className="flex-1 mb-4">
            <h3 className="text-[15px] font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors line-clamp-2 leading-snug">
              {board.name}
            </h3>
          </div>

          {/* ── Footer / Metadata ── */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500">
              <LayoutList className="h-4 w-4 text-zinc-400" />
              <span>{board._count.lists} list{board._count.lists !== 1 ? 's' : ''}</span>
            </div>

            {/* Checklist count badge — only when items exist */}
            {hasItems && (
              <span className="text-[11px] font-medium text-zinc-400">
                {completed}/{total} done
              </span>
            )}

            {/* Hover arrow — hidden when checklist badge is showing */}
            {!hasItems && (
              <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
              </div>
            )}
          </div>
        </div>

        {/* ── Progress Bar (bottom of card) ── */}
        <div className="h-1.5 w-full bg-zinc-100">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: hasItems ? `${percent}%` : '0%',
              backgroundColor: barColor,
            }}
          />
        </div>

      </div>
    </Link>
  )
}