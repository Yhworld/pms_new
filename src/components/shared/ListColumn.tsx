'use client'

import { useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/src/components/ui/button' // Fixed path just in case
import { CardItem } from '@/src/components/shared/CardItem'
import { CreateCardDialog } from '@/src/components/shared/CreateCardDialog'
import type { ListWithCards } from '@/src/types'

interface ListColumnProps {
  list: ListWithCards
  boardId: string
  onCardClick: (cardId: string) => void
  isFiltering?: boolean
  canEdit?: boolean // <-- NEW: Added canEdit prop
}

export function ListColumn({ 
  list, 
  boardId, 
  onCardClick, 
  isFiltering,
  canEdit = false // <-- NEW: Default to false for Viewers
}: ListColumnProps) {
  const [showCreateCard, setShowCreateCard] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, 
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-[290px] md:w-[310px] rounded-2xl flex flex-col max-h-full transition-colors ${
        isDragging ? 'bg-zinc-100 border border-zinc-300 border-dashed' : 'bg-zinc-50/80 border border-zinc-200/80'
      }`}
    >
      {/* ── List Header (Draggable Handle) ── */}
      <div
        className="group/header flex items-center justify-between px-3 pt-3 pb-3 cursor-grab active:cursor-grabbing rounded-t-2xl hover:bg-zinc-100/50 transition-colors"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-[14px] text-zinc-900 tracking-tight select-none">
            {list.name}
          </h3>
          <span className="text-[12px] font-medium text-zinc-500 bg-white border border-zinc-200 shadow-sm rounded-full px-2 py-0.5 select-none">
            {isFiltering ? `${list.cards.length} filtered` : list.cards.length}
          </span>
        </div>
        
        {/* Actions Menu — Only show to users who can edit */}
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Cards Container ── */}
      <SortableContext
        items={list.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2.5 px-2 overflow-y-auto flex-1 custom-scrollbar min-h-[40px]">
          {list.cards.map((card) => (
            <CardItem key={card.id} card={card} onCardClick={onCardClick} />
          ))}
        </div>
      </SortableContext>

      {/* ── Add Card Footer ── */}
      {/* Only render the Add Card button and dialog if the user is a Member or Admin */}
      {canEdit && (
        <>
          <div className="p-2 mt-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-[13px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 h-8 px-2 transition-colors group/btn"
              onClick={() => setShowCreateCard(true)}
            >
              <Plus className="h-4 w-4 mr-1.5 text-zinc-400 group-hover/btn:text-zinc-900 transition-colors" />
              Add card
            </Button>
          </div>

          <CreateCardDialog
            open={showCreateCard}
            onOpenChange={setShowCreateCard}
            listId={list.id}
            position={list.cards.length}
          />
        </>
      )}
    </div>
  )
}