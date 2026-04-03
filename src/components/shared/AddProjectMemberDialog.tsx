'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/src/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/src/components/ui/select'
import { UserPlus } from 'lucide-react'
import { addProjectMember, getOrgMembersNotInProject } from '@/src/lib/actions/project.actions'
import { useEffect } from 'react'
import type { User } from '@/src/types'

interface Props {
  projectId: string
  orgId: string
  existingMemberIds: string[]
}

export function AddProjectMemberDialog({ projectId, orgId, existingMemberIds }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'MEMBER'>('MEMBER')
  const router = useRouter()

  useEffect(() => {
    if (open) {
      getOrgMembersNotInProject(orgId, existingMemberIds).then(setAvailableUsers)
    }
  }, [open, orgId, existingMemberIds])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedUserId) return
    setLoading(true)
    setError('')

    const result = await addProjectMember(projectId, selectedUserId, selectedRole)
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
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add member to project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Member</Label>
            <Select onValueChange={setSelectedUserId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose an org member..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    All org members already added
                  </SelectItem>
                ) : (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name ?? user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              defaultValue="MEMBER"
              onValueChange={(v) => setSelectedRole(v as 'MANAGER' | 'MEMBER')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager — can manage board & assign tasks</SelectItem>
                <SelectItem value="MEMBER">Member — can view & work on tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !selectedUserId}>
            {loading ? 'Adding...' : 'Add to Project'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
