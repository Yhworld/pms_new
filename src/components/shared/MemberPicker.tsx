'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Users, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Button } from '@/src/components/ui/button'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { toggleCardMember, getProjectMembers } from '@/src/lib/actions/card.actions'

interface MemberPickerProps {
  cardId: string
  assignedIds: string[]
  onUpdate: () => void
}

export function MemberPicker({ cardId, assignedIds, onUpdate }: MemberPickerProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Awaited<ReturnType<typeof getProjectMembers>>>([])
  const [loadingMembers, setLoadingMembers] = useState(false)   // ← new
  const [optimisticIds, setOptimisticIds] = useState<string[]>(assignedIds)
  const [togglingId, setTogglingId] = useState<string | null>(null) // ← per-member loading

  useEffect(() => {
    setOptimisticIds(assignedIds)
  }, [assignedIds])

  useEffect(() => {
    if (open) {
      setLoadingMembers(true)
      getProjectMembers(cardId).then((data) => {
        setMembers(data)
        setLoadingMembers(false)
      })
    }
  }, [open, cardId])

  async function handleToggle(userId: string) {
    setOptimisticIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
    setTogglingId(userId)         // ← show spinner on that specific row
    await toggleCardMember(cardId, userId)
    setTogglingId(null)
    onUpdate()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full justify-start">
          <Users className="h-3.5 w-3.5" />
          Assign
          <ChevronsUpDown className="h-3 w-3 opacity-50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <p className="text-xs font-semibold text-slate-500 px-2 pb-2">Project members</p>

        {/* ── Loading state ── */}
        {loadingMembers ? (
          <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading members...</span>
          </div>
        ) : (
          <>
            {members.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">No members found</p>
            )}
            {members.map((m) => {
              const isAssigned = optimisticIds.includes(m.userId)
              const isToggling = togglingId === m.userId
              return (
                <button
                  key={m.id}
                  onClick={() => handleToggle(m.userId)}
                  disabled={isToggling}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded hover:bg-slate-100 text-left transition-colors disabled:opacity-60"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-violet-500 text-white">
                      {m.user.name?.[0]?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1">{m.user.name ?? m.user.email}</span>
                  {/* ← spinner on the row being toggled, checkmark otherwise */}
                  {isToggling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                  ) : (
                    isAssigned && <Check className="h-3.5 w-3.5 text-green-500" />
                  )}
                </button>
              )
            })}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
