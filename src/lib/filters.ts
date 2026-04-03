import { createSearchParamsCache, parseAsString, parseAsArrayOf } from 'nuqs/server'

export const filterParsers = {
  assignees: parseAsArrayOf(parseAsString).withDefault([]),
  status:    parseAsArrayOf(parseAsString).withDefault([]),
  priority:  parseAsArrayOf(parseAsString).withDefault([]),
  due:       parseAsString.withDefault(''),   // 'overdue' | 'today' | 'week' | ''
}

export const filterCache = createSearchParamsCache(filterParsers)

import type { CardWithRelations } from '@/src/types'

interface ActiveFilters {
  assignees: string[]
  status: string[]
  priority: string[]
  due: string
}

export function cardMatchesFilters(card: CardWithRelations, filters: ActiveFilters): boolean {
  // Assignee filter — card must have at least one matching assignee
  if (filters.assignees.length > 0) {
    const cardAssigneeIds = card.members.map(m => m.user.id)
    const hasMatch = filters.assignees.some(id => cardAssigneeIds.includes(id))
    if (!hasMatch) return false
  }

  // Status filter
  if (filters.status.length > 0) {
    if (!card.status || !filters.status.includes(card.status)) return false
  }

  // Priority filter
  if (filters.priority.length > 0) {
    if (!card.priority || !filters.priority.includes(card.priority)) return false
  }

  // Due date filter
  if (filters.due) {
    if (!card.dueDate) return false
    const now = new Date()
    const due = new Date(card.dueDate)

    if (filters.due === 'overdue') {
      if (due >= now) return false
    } else if (filters.due === 'today') {
      const isToday =
        due.getDate() === now.getDate() &&
        due.getMonth() === now.getMonth() &&
        due.getFullYear() === now.getFullYear()
      if (!isToday) return false
    } else if (filters.due === 'week') {
      const weekFromNow = new Date()
      weekFromNow.setDate(now.getDate() + 7)
      if (due < now || due > weekFromNow) return false
    }
  }

  return true
}
