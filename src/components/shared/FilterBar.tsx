'use client'

import { useQueryStates } from 'nuqs'
import { filterParsers } from '@/src/lib/filters'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/src/components/ui/dropdown-menu'
import { Badge } from '@/src/components/ui/badge'
import { SlidersHorizontal, X } from 'lucide-react'

const STATUSES   = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const DUE_OPTIONS = [
  { label: 'Overdue',      value: 'overdue' },
  { label: 'Due Today',    value: 'today'   },
  { label: 'Due This Week',value: 'week'    },
]

interface FilterBarProps {
  members: { id: string; name: string | null; email: string }[]
}

export function FilterBar({ members }: FilterBarProps) {
  const [filters, setFilters] = useQueryStates(filterParsers)

  const activeCount =
    filters.assignees.length +
    filters.status.length +
    filters.priority.length +
    (filters.due ? 1 : 0)

  function toggle<T extends string>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
  }

  function clearAll() {
    setFilters({ assignees: [], status: [], priority: [], due: '' })
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background flex-wrap">
      <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground mr-1">Filters</span>

      {/* Assignee */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Assignee
            {filters.assignees.length > 0 && (
              <Badge className="ml-1" variant="secondary">{filters.assignees.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {members.map(m => (
            <DropdownMenuCheckboxItem
              key={m.id}
              checked={filters.assignees.includes(m.id)}
              onCheckedChange={() =>
                setFilters(f => ({ assignees: toggle(f.assignees, m.id) }))
              }
            >
              {m.name ?? m.email}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Status
            {filters.status.length > 0 && (
              <Badge className="ml-1" variant="secondary">{filters.status.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {STATUSES.map(s => (
            <DropdownMenuCheckboxItem
              key={s}
              checked={filters.status.includes(s)}
              onCheckedChange={() =>
                setFilters(f => ({ status: toggle(f.status, s) }))
              }
            >
              {s.replace('_', ' ')}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Priority
            {filters.priority.length > 0 && (
              <Badge className="ml-1" variant="secondary">{filters.priority.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {PRIORITIES.map(p => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={filters.priority.includes(p)}
              onCheckedChange={() =>
                setFilters(f => ({ priority: toggle(f.priority, p) }))
              }
            >
              {p}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Due Date */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Due Date
            {filters.due && (
              <Badge className="ml-1" variant="secondary">1</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {DUE_OPTIONS.map(opt => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={filters.due === opt.value}
              onCheckedChange={() =>
                setFilters({ due: filters.due === opt.value ? '' : opt.value })
              }
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear all */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
          <X className="h-3 w-3 mr-1" /> Clear ({activeCount})
        </Button>
      )}
    </div>
  )
}
