'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, Tag, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { toggleCardLabel, getBoardLabels, createLabel } from '@/src/lib/actions/card.actions'
import type { Label } from '@prisma/client'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#64748b',
]

interface LabelPickerProps {
  cardId: string
  boardId: string
  attachedLabelIds: string[]
  onUpdate: () => void
}

export function LabelPicker({ cardId, boardId, attachedLabelIds, onUpdate }: LabelPickerProps) {
  const [open, setOpen] = useState(false)
  const [labels, setLabels] = useState<Label[]>([])
  const [loadingLabels, setLoadingLabels] = useState(false)   // ← new
  const [optimisticIds, setOptimisticIds] = useState<string[]>(attachedLabelIds)
  const [creating, setCreating] = useState(false)
  const [creating2, setCreating2] = useState(false)  
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    setOptimisticIds(attachedLabelIds)
  }, [attachedLabelIds])

  useEffect(() => {
    if (open) {
      setLoadingLabels(true)                          // ← start loading
      getBoardLabels(cardId).then((data) => {
        setLabels(data)
        setLoadingLabels(false)                       // ← done
      })
    }
  }, [open, cardId])

  async function handleToggle(labelId: string) {
    setOptimisticIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    )
    await toggleCardLabel(cardId, labelId)
    onUpdate()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating2(true)
    const result = await createLabel(boardId, newName.trim(), newColor)
    if (!result?.error) {
      setNewName('')
      setCreating(false)
      getBoardLabels(cardId).then(setLabels)
      onUpdate()
    }
    setCreating2(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full justify-start">
          <Tag className="h-3.5 w-3.5" />
          Labels
          <ChevronsUpDown className="h-3 w-3 opacity-50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <p className="text-xs font-semibold text-slate-500 px-2 pb-2">Board labels</p>

        {/* ── Loading state ── */}
        {loadingLabels ? (
          <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading labels...</span>
          </div>
        ) : (
          <>
            {labels.length === 0 && !creating && (
              <p className="text-xs text-muted-foreground px-2 pb-2">No labels yet</p>
            )}

            {labels.map((label) => {
              const isAttached = optimisticIds.includes(label.id)
              return (
                <button
                  key={label.id}
                  onClick={() => handleToggle(label.id)}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded hover:bg-slate-100 transition-colors"
                >
                  <span
                    className="h-4 w-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm flex-1 text-left">{label.name}</span>
                  {isAttached && <Check className="h-3.5 w-3.5 text-green-500" />}
                </button>
              )
            })}

            {/* Create new label */}
            {creating ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-2 mt-2 px-1">
                <Input
                  autoFocus
                  placeholder="Label name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-7 text-xs"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="h-5 w-5 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: newColor === c ? '#1e293b' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={creating2}>
                    {creating2 ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => { setCreating(false); setNewName('') }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 mt-1 rounded hover:bg-slate-100 text-xs text-slate-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create label
              </button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
