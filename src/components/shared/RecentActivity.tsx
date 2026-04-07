import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  action: string
  createdAt: Date
  user: { name: string | null; email: string }
}

export function RecentActivity({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="text-[13px] font-semibold text-zinc-900">Recent Activity</h3>
        <p className="text-[12px] text-zinc-400">Latest actions across all projects</p>
      </div>

      {activities.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-zinc-400">
          No activity yet
        </div>
      ) : (
        <div className="divide-y divide-zinc-50">
          {activities.map((activity) => {
            const name = activity.user.name ?? activity.user.email
            const initials = name.slice(0, 2).toUpperCase()

            return (
              <div key={activity.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-semibold text-zinc-600 uppercase shrink-0 mt-0.5">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-zinc-700 leading-snug">
                    <span className="font-medium text-zinc-900">{name}</span>
                    {' '}{activity.action}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}