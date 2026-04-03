'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQueryStates } from 'nuqs'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { ListColumn } from '@/src/components/shared/ListColumn'
import { CardItem } from '@/src/components/shared/CardItem'
import { CreateListButton } from '@/src/components/shared/CreateListButton'
import { CardDetailSheet } from '@/src/components/shared/CardDetailSheet'
import { reorderCards, reorderLists } from '@/src/lib/actions/board.actions'
import { filterParsers } from '@/src/lib/filters'
import { cardMatchesFilters } from '@/src/lib/filters'
import type { ListWithCards, CardWithRelations } from '@/src/types'

interface BoardCanvasProps {
  initialLists: ListWithCards[]
  userRole?: 'ADMIN' | 'MEMBER' | 'VIEWER'
  boardId: string
  currentUserId?: string // Added so you can pass it down to CardDetailSheet for comment editing
}

export function BoardCanvas({ 
  initialLists, 
  boardId, 
  userRole = 'VIEWER', // Defaulting to VIEWER for safety
  currentUserId 
}: BoardCanvasProps) {
  const [lists, setLists] = useState<ListWithCards[]>(initialLists)
  const [activeCard, setActiveCard] = useState<CardWithRelations | null>(null)
  const [activeList, setActiveList] = useState<ListWithCards | null>(null)
  const [activeCardDetail, setActiveCardDetail] = useState<string | null>(null)

  const [filters] = useQueryStates(filterParsers)

  // --- ROLE BASED PERMISSIONS ---
  const isAdmin = userRole === 'ADMIN'
  const isMember = userRole === 'MEMBER'
  const canEditCards = isAdmin || isMember
  const canManageLists = isAdmin

  // --- STATE SYNC TO PREVENT REFRESHING ---
  // Whenever the server action finishes and revalidates the path, 
  // this pulls the fresh initialLists into your local state instantly.
  useEffect(() => {
    setLists(initialLists)
  }, [initialLists])

  const isFiltering =
    filters.assignees.length > 0 ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    !!filters.due

  // Apply filters without touching the real `lists` state (DnD stays intact)
  const filteredLists = useMemo(() => {
    if (!isFiltering) return lists
    return lists.map(list => ({
      ...list,
      cards: list.cards.filter(card => cardMatchesFilters(card, filters)),
    }))
  }, [lists, filters, isFiltering])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const findListByCardId = useCallback(
    (cardId: string) => lists.find((l) => l.cards.some((c) => c.id === cardId)),
    [lists]
  )

  function onDragStart(event: DragStartEvent) {
    const { active } = event
    const isCard = lists.some((l) => l.cards.some((c) => c.id === active.id))
    
    if (isCard) {
      if (!canEditCards) return // Viewers can't drag cards
      const list = findListByCardId(active.id as string)
      const card = list?.cards.find((c) => c.id === active.id)
      setActiveCard(card ?? null)
    } else {
      if (!canManageLists) return // Members/Viewers can't drag lists
      const list = lists.find((l) => l.id === active.id)
      setActiveList(list ?? null)
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const isActiveCard = lists.some((l) => l.cards.some((c) => c.id === active.id))
    if (!isActiveCard || !canEditCards) return // Stop non-editors here

    const activeList = findListByCardId(active.id as string)
    const overList =
      findListByCardId(over.id as string) ?? lists.find((l) => l.id === over.id)

    if (!activeList || !overList || activeList.id === overList.id) return

    setLists((prev) => {
      const activeCards = [...activeList.cards]
      const overCards = [...overList.cards]
      const cardIndex = activeCards.findIndex((c) => c.id === active.id)
      const [movedCard] = activeCards.splice(cardIndex, 1)

      const overCardIndex = overCards.findIndex((c) => c.id === over.id)
      const insertAt = overCardIndex >= 0 ? overCardIndex : overCards.length
      overCards.splice(insertAt, 0, { ...movedCard, listId: overList.id })

      return prev.map((l) => {
        if (l.id === activeList.id) return { ...l, cards: activeCards }
        if (l.id === overList.id) return { ...l, cards: overCards }
        return l
      })
    })
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    setActiveList(null)
    if (!over || active.id === over.id) return

    const isActiveList = lists.some((l) => l.id === active.id)

    if (isActiveList) {
      if (!canManageLists) return // Stop non-admins from rearranging lists
      const oldIndex = lists.findIndex((l) => l.id === active.id)
      const newIndex = lists.findIndex((l) => l.id === over.id)
      const reordered = arrayMove(lists, oldIndex, newIndex)
      setLists(reordered)
      await reorderLists(reordered.map((l, i) => ({ id: l.id, position: i })))
      return
    }

    if (!canEditCards) return // Extra safety check

    const sourceList = findListByCardId(active.id as string)
    if (!sourceList) return

    const oldIndex = sourceList.cards.findIndex((c) => c.id === active.id)
    const newIndex = sourceList.cards.findIndex((c) => c.id === over.id)

    if (oldIndex !== newIndex && newIndex !== -1) {
      const reordered = arrayMove(sourceList.cards, oldIndex, newIndex)
      setLists((prev) =>
        prev.map((l) =>
          l.id === sourceList.id ? { ...l, cards: reordered } : l
        )
      )
      await reorderCards(
        reordered.map((c, i) => ({ id: c.id, position: i, listId: sourceList.id }))
      )
    }

    const allCardUpdates = lists.flatMap((l) =>
      l.cards.map((c, i) => ({ id: c.id, position: i, listId: l.id }))
    )
    await reorderCards(allCardUpdates)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={lists.map((l) => l.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex gap-4 p-4 overflow-x-auto flex-1 items-start h-full">
          {filteredLists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              boardId={boardId}
              isFiltering={isFiltering}
              canEdit={canEditCards} // <-- Pass down to hide "Add Card" for viewers
              onCardClick={(cardId) => setActiveCardDetail(cardId)}
            />
          ))}
          {/* ONLY display list creation if Admin */}
          {canManageLists && (
            <CreateListButton boardId={boardId} position={lists.length} />
          )}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-2 opacity-90">
            <CardItem card={activeCard} />
          </div>
        )}
        {activeList && (
          <div className="opacity-90 rotate-1">
            <ListColumn 
              list={activeList} 
              boardId={boardId} 
              onCardClick={() => {}} 
              canEdit={canEditCards}
            />
          </div>
        )}
      </DragOverlay>

      <CardDetailSheet
        cardId={activeCardDetail}
        onClose={() => setActiveCardDetail(null)}
        canEdit={canEditCards} // <-- Locks down checkboxes, inputs, dropdowns
        currentUserId={currentUserId} // <-- Enables deleting own comments
      />
    </DndContext>
  )
}