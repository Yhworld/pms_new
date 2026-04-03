'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Settings } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/src/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Calendar } from '@/src/components/ui/calendar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/src/components/ui/select'
import { updateProject } from '@/src/lib/actions/project.actions'
import type { ProjectStatus } from '@prisma/client'

interface ProjectSettingsProps {
  project: {
    id: string
    name: string
    description: string | null
    status: ProjectStatus
    deadline: Date | null
  }
}

export function ProjectSettingsDialog({ project }: ProjectSettingsProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [deadline, setDeadline] = useState<Date | undefined>(project.deadline ?? undefined)
  
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    startTransition(async () => {
      await updateProject(project.id, {
        name,
        description,
        status,
        deadline: deadline || null,
      })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 px-3 gap-2 bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 mt-2">
          
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Project Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="h-9"
              placeholder="e.g. Q3 Marketing Site"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Description</label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3}
              placeholder="Briefly describe the project goals..."
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Status</label>
              <Select value={status} onValueChange={(val) => setStatus(val as ProjectStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Deadline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full h-9 justify-start text-left font-normal ${!deadline ? 'text-zinc-500' : 'text-zinc-900'}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                    {deadline ? format(deadline, 'PPP') : <span>Set deadline</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-zinc-900 text-white hover:bg-zinc-800"
              disabled={isPending || !name.trim()}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}