'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createList } from '@/src/lib/actions/board.actions'

interface CreateListButtonProps {
  boardId: string
  position: number
}

export function CreateListButton({ boardId, position }: CreateListButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await createList({ boardId, name: name.trim(), position })
    setName('')
    setIsOpen(false)
    setLoading(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex-shrink-0 w-72 h-10 rounded-xl bg-white/20 hover:bg-white/30 border-2 border-dashed border-slate-300 text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add a list
      </button>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 bg-slate-100 rounded-xl p-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          autoFocus
          placeholder="List name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="flex items-center gap-1">
          <Button type="submit" size="sm" className="h-7 text-xs" disabled={loading}>
            {loading ? 'Adding...' : 'Add list'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setIsOpen(false); setName('') }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
