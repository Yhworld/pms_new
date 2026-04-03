'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/src/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createBoard } from '@/src/lib/actions/board.actions'

// Preset color options for the board banner
const BOARD_COLORS = [
  '#1e293b', '#0f172a', '#1d4ed8', '#7c3aed',
  '#be185d', '#b45309', '#15803d', '#0e7490',
]

export function CreateBoardDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0])
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.append('projectId', projectId)
    formData.append('color', selectedColor)

    const result = await createBoard(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Board
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="boardName">Board Name</Label>
            <Input
              id="boardName"
              name="boardName"
              placeholder="e.g. Sprint 1, Design Tasks"
              required
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Board Color</Label>
            <div className="flex gap-2">
              {BOARD_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="h-12 rounded-md w-full transition-colors"
            style={{ backgroundColor: selectedColor }}
          />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Board'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
