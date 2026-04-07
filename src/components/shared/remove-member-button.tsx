'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
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
import { removeProjectMember } from '@/src/lib/actions/project.actions'
import { toast } from 'sonner'

interface Props {
  projectId: string
  userId: string
  userName: string
}

export function RemoveMemberButton({ projectId, userId, userName }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const result = await removeProjectMember(projectId, userId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`${userName} removed from project.`)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{userName}</strong> from this project?
            They will lose access to all boards and tasks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}