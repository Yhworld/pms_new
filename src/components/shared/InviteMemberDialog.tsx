'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/src/components/ui/dialog'
import { UserPlus } from 'lucide-react'
import { inviteMember } from '@/src/lib/actions/invitation.actions'

export function InviteMemberDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    formData.append('orgId', orgId)

    const result = await inviteMember(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(`Invite sent to ${formData.get('email')}`)
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="colleague@company.com"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
              {success}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending invite...' : 'Send Invite'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
