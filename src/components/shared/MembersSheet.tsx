'use client'

import { useTransition, useState } from 'react'
import { Trash2, Loader2, Users } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/src/components/ui/alert-dialog'
import { Badge } from '@/src/components/ui/badge'
import { removeProjectMember } from '@/src/lib/actions/project.actions'
import { toast } from 'sonner'

interface Member {
  id: string
  userId: string
  role: string
  createdAt: Date
  user: {
    name: string | null
    email: string
  }
}

interface Props {
  projectId: string
  members: Member[]
  isManager: boolean
  currentUserId: string
  children: React.ReactNode // the trigger (avatar stack)
}

export function MembersSheet({
  projectId,
  members,
  isManager,
  currentUserId,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  function handleRemove(userId: string, userName: string) {
    setRemovingId(userId)
    startTransition(async () => {
      const result = await removeProjectMember(projectId, userId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`${userName} removed from project.`)
        setOpen(false)
      }
      setRemovingId(null)
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b border-zinc-100">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-zinc-400" />
            Project Members
            <span className="ml-auto text-xs text-zinc-400 font-normal">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-1">
          {members.map((member) => {
            const displayName = member.user.name ?? member.user.email
            const initials = displayName.slice(0, 2).toUpperCase()
            const isYou = member.userId === currentUserId
            const canRemove = isManager && !isYou

            return (
              <div
                key={member.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-semibold text-zinc-600 uppercase tracking-wider shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 leading-tight">
                      {member.user.name ?? 'No name set'}
                      {isYou && (
                        <span className="ml-1.5 text-xs text-zinc-400 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400">{member.user.email}</p>
                  </div>
                </div>

                {/* Role + Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={member.role === 'MANAGER' ? 'default' : 'secondary'}
                    className="text-[11px]"
                  >
                    {member.role}
                  </Badge>

                  {canRemove && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          disabled={isPending && removingId === member.userId}
                        >
                          {isPending && removingId === member.userId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove <strong>{displayName}</strong> from this project? They'll lose
                            access to all boards and tasks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(member.userId, displayName)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}