'use client'

import { useState } from 'react'
import { Calendar, AlertTriangle, Clock, SignalHigh, LayoutDashboard, MessageSquare, Paperclip, CheckCircle2 } from 'lucide-react'
import { isPast, differenceInDays } from 'date-fns'
import { formatDate, isOverdue } from '@/src/lib/utlis'
import { CardDetailSheet } from '@/src/components/shared/CardDetailSheet'

// We use `any` here for brevity to ensure it compiles instantly, 
// but it represents your full Prisma Card payload including the new `canEdit` boolean.
type Task = any 

interface MyTasksClientProps {
  initialTasks: Task[]
  currentUserId: string
}

export function MyTasksClient({ initialTasks, currentUserId }: MyTasksClientProps) {
  // Store the entire task object so we know its specific permissions
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Priority visual map
  const priorityColors: Record<string, string> = {
    LOW: 'bg-zinc-100 text-zinc-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700 border border-red-200',
  }

  return (
    <>
      {initialTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-zinc-300" />
          </div>
          <h3 className="text-[15px] font-medium text-zinc-900">You're all caught up!</h3>
          <p className="text-[14px] text-zinc-500 mt-1">No active tasks assigned to you right now.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_150px_120px_100px] items-center px-6 py-3 border-b border-zinc-100 bg-zinc-50/50 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">
            <div>Task</div>
            <div>Project Context</div>
            <div>Due Date</div>
            <div className="text-right">Priority</div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-zinc-100 flex flex-col">
            {initialTasks.map((task) => {
              const overdue = isOverdue(task.dueDate)
              const isApproaching = task.dueDate && !overdue && differenceInDays(new Date(task.dueDate), new Date()) <= 2

              return (
                <button
                  key={task.id}
                  onClick={() => setActiveTask(task)} // Sets the whole task in state
                  className="grid grid-cols-[1fr_150px_120px_100px] items-center px-6 py-4 hover:bg-zinc-50 transition-colors text-left group"
                >
                  {/* Column 1: Task Title & Meta */}
                  <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                    <span className="text-[14px] font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </span>
                    
                    {/* Meta Badges (Status, Comments, Attachments) */}
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span className="text-[12px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                        {task.status.replace('_', ' ')}
                      </span>
                      
                      {task._count.comments > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-medium">
                          <MessageSquare className="h-3 w-3" /> {task._count.comments}
                        </div>
                      )}
                      {task._count.attachments > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-medium">
                          <Paperclip className="h-3 w-3" /> {task._count.attachments}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Project / Board Context */}
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-[13px] text-zinc-900 truncate flex items-center gap-1.5">
                      <LayoutDashboard className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{task.list.board.project.name}</span>
                    </span>
                    <span className="text-[12px] text-zinc-500 truncate ml-5">
                      {task.list.board.name}
                    </span>
                  </div>

                  {/* Column 3: Due Date */}
                  <div className="flex items-center">
                    {task.dueDate ? (
                      <div className={`flex items-center gap-1.5 text-[12px] font-medium px-2 py-1 rounded-md ${
                        overdue ? 'text-red-700 bg-red-50' : 
                        isApproaching ? 'text-orange-700 bg-orange-50' : 
                        'text-zinc-600 bg-zinc-50'
                      }`}>
                        {overdue ? <AlertTriangle className="h-3 w-3" /> : 
                         isApproaching ? <Clock className="h-3 w-3" /> : 
                         <Calendar className="h-3 w-3" />}
                        {formatDate(task.dueDate)}
                      </div>
                    ) : (
                      <span className="text-[13px] text-zinc-400 italic">No date</span>
                    )}
                  </div>

                  {/* Column 4: Priority */}
                  <div className="flex justify-end">
                    <span className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${priorityColors[task.priority] || priorityColors.LOW}`}>
                      {task.priority === 'URGENT' && <SignalHigh className="h-3 w-3" />}
                      {task.priority}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── The Magic Sheet ── */}
      {/* 
        Passes the activeTask.canEdit boolean.
        If the user is a MEMBER on the project this task belongs to, they will see a Read-Only view.
        If the user is a MANAGER on the project, they will be able to edit. 
      */}
      <CardDetailSheet
        cardId={activeTask?.id || null}
        onClose={() => setActiveTask(null)}
        canEdit={activeTask?.canEdit || false} 
        currentUserId={currentUserId}
      />
    </>
  )
}