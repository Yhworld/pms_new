'use client'

import { MessageSquare, Paperclip, Calendar, AlertTriangle, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { differenceInDays } from 'date-fns'
import { isOverdue, formatDate } from '@/src/lib/utlis' // ← Kept your typo fix
import type { CardWithRelations } from '@/src/types'

interface CardItemProps {
  card: CardWithRelations
  onCardClick?: (cardId: string) => void
}

export function CardItem({ card, onCardClick }: CardItemProps) {
  const overdue = isOverdue(card.dueDate)
  
  // Check if deadline is approaching (within 48 hours)
  let isApproaching = false
  if (card.dueDate && !overdue) {
    const daysLeft = differenceInDays(new Date(card.dueDate), new Date())
    isApproaching = daysLeft >= 0 && daysLeft <= 2
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // The "ghost" left behind when dragging
    opacity: isDragging ? 0.4 : 1,
  }

  // Map priority levels to subtle visual cues
  const priorityStyles: Record<string, string> = {
    LOW: 'border-l-transparent',
    MEDIUM: 'border-l-blue-400',
    HIGH: 'border-l-orange-400',
    // URGENT gets the bold border AND a very subtle red tinted background
    URGENT: 'border-l-red-500 bg-red-50/40', 
  }

  const activePriorityStyle = priorityStyles[card.priority] || priorityStyles.LOW

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onCardClick?.(card.id)}
      // Added border-l-[4px] and the activePriorityStyle dynamically
      className={`group relative rounded-xl p-3.5 text-left outline-none cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col gap-3 ${
        isDragging 
          ? 'bg-zinc-100 border-2 border-dashed border-zinc-300 shadow-none' 
          : `bg-white border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 border-l-[4px] ${activePriorityStyle}`
      }`}
    >
      {/* ── Labels (Sleek Dash Style) ── */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.labels.map((cl) => (
            <span
              key={cl.labelId}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: cl.label.color }}
              title={cl.label.name}
            />
          ))}
        </div>
      )}

      {/* ── Title ── */}
      <p className="text-[14px] text-zinc-900 font-medium leading-snug tracking-tight">
        {card.title}
      </p>

      {/* ── Footer Meta ── */}
      <div className="flex items-center justify-between mt-auto pt-1">
        
        {/* Left Side: Due Date & Counters */}
        <div className="flex items-center gap-3">
          
          {/* Due date pill with Hazard and Approaching states */}
          {card.dueDate && (
            <div 
              className={`flex items-center gap-1 text-[11px] font-medium rounded-md transition-colors ${
                overdue 
                  ? 'text-red-600 bg-red-50 px-1.5 py-0.5 -ml-1.5' 
                  : isApproaching
                  ? 'text-orange-600 bg-orange-50 px-1.5 py-0.5 -ml-1.5'
                  : 'text-zinc-400 group-hover:text-zinc-500'
              }`}
            >
              {overdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : isApproaching ? (
                <Clock className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              <span>{formatDate(card.dueDate)}</span>
            </div>
          )}

          {/* Counters */}
          {(card._count.comments > 0 || card._count.attachments > 0) && (
            <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-500 transition-colors">
              {card._count.comments > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium">
                  <MessageSquare className="h-3 w-3" />
                  {card._count.comments}
                </span>
              )}
              {card._count.attachments > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium">
                  <Paperclip className="h-3 w-3" />
                  {card._count.attachments}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Avatars */}
        {card.members.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.members.slice(0, 3).map((m) => (
              <Avatar key={m.id} className="h-5 w-5 ring-2 ring-white">
                <AvatarFallback className="text-[9px] bg-zinc-100 text-zinc-600 font-semibold uppercase">
                  {m.user.name?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}