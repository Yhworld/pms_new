import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { BoardHeader } from '@/src/components/shared/BoardHeader'
import { BoardCanvas } from '@/src/components/shared/BoardCanvas'
import { FilterBar } from '@/src/components/shared/FilterBar'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ projectId: string; boardId: string }>
}) {
  const { projectId, boardId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) notFound()

  // 👇 Removed the "as BoardWithRelations" cast so Prisma infers types perfectly
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      project: {
        include: {
          organization: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
          // Fetch explicit Project members so we can find user role
          members: {
            where: { userId: user.id }
          }
        },
      },
      lists: {
        orderBy: { position: 'asc' },
        include: {
          cards: {
            where: { isArchived: false },
            orderBy: { position: 'asc' },
            include: {
              members: { include: { user: true } },
              labels: { include: { label: true } },
              _count: { select: { comments: true, attachments: true } },
              checklists: {
      include: {
        items: { select: { isCompleted: true } },
      },
    },
            },
          },
        },
      },
    },
  })

  if (!board || board.project.id !== projectId) notFound()

  // 1. Get explicit Organization role to securely determine God Mode
  const orgMember = await prisma.orgMember.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: board.project.organizationId
      }
    }
  })

  if (!orgMember) notFound()

  // 2. Determine Role exactly as expected by BoardCanvas
  // Prisma knows members exists because of the `include` above
  const currentProjectMember = board.project.members[0]
  
  let calculatedRole: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'VIEWER'

  // If they are an Org Owner OR a Project Manager, they get full ADMIN access on the board
  if (orgMember.role === 'OWNER' || currentProjectMember?.role === 'MANAGER') {
    calculatedRole = 'ADMIN'
  } else if (currentProjectMember?.role === 'MEMBER') {
    calculatedRole = 'MEMBER'
  }

  const orgMembers = board.project.organization.members.map(m => m.user)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BoardHeader board={board as any} project={board.project as any} />
      <FilterBar members={orgMembers} />
      {/* Explicitly pass the calculated userRole down! */}
      <BoardCanvas 
        initialLists={board.lists as any} 
        boardId={boardId} 
        userRole={calculatedRole} 
        currentUserId={user.id} 
      />
    </div>
  )
}