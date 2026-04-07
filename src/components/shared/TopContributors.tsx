import { Trophy } from 'lucide-react'

interface Contributor {
  name: string
  email: string
  completed: number
}

const medals = ['🥇', '🥈', '🥉']

export function TopContributors({ contributors }: { contributors: Contributor[] }) {
  const max = contributors[0]?.completed ?? 1

  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h3 className="text-[13px] font-semibold text-zinc-900">Top Contributors</h3>
        <span className="text-[11px] text-zinc-400 ml-1">this week</span>
      </div>

      {contributors.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-zinc-400">
          No completed tasks this week
        </div>
      ) : (
        <div className="divide-y divide-zinc-50">
          {contributors.map((c, i) => {
            const percent = Math.round((c.completed / max) * 100)
            return (
              <div key={c.email} className="flex items-center gap-3 px-5 py-3.5">
                {/* Rank */}
                <span className="text-base w-6 text-center shrink-0">
                  {medals[i] ?? <span className="text-[12px] text-zinc-400">{i + 1}</span>}
                </span>

                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-semibold text-zinc-600 uppercase shrink-0">
                  {c.name.slice(0, 2)}
                </div>

                {/* Name + Bar */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-zinc-900 truncate">{c.name}</p>
                    <span className="text-[11px] font-semibold text-zinc-700 ml-2 shrink-0">
                      {c.completed} task{c.completed !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}