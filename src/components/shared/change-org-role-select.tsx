'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { updateOrgMemberRole } from '@/src/lib/actions/org.actions'
import { toast } from 'sonner'

interface Props {
  orgId: string
  userId: string
  currentRole: 'OWNER' | 'MEMBER'
  userName: string
}

export function ChangeOrgRoleSelect({ orgId, userId, currentRole, userName }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(newRole: string) {
    if (newRole === currentRole) return

    startTransition(async () => {
      const result = await updateOrgMemberRole(orgId, userId, newRole as 'OWNER' | 'MEMBER')
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`${userName} is now ${newRole.toLowerCase()}.`)
      }
    })
  }

  return (
    <div className="relative flex items-center">
      {isPending && (
        <Loader2 className="absolute -left-5 h-3 w-3 animate-spin text-muted-foreground" />
      )}
      <Select
        defaultValue={currentRole}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-7 w-28 text-xs border-zinc-200 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="OWNER" className="text-xs">Owner</SelectItem>
          <SelectItem value="MEMBER" className="text-xs">Member</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}