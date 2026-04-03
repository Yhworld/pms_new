import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { BoardHeader } from '@/src/components/shared/BoardHeader'
import { BoardCanvas } from '@/src/components/shared/BoardCanvas'
import type { BoardWithRelations } from '@/src/types'
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
            },
          },
        },
      },
    },
  }) as BoardWithRelations | null

  if (!board || board.project.id !== projectId) notFound()

  const orgMembers = board.project.organization.members.map(m => m.user)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BoardHeader board={board} project={board.project} />
      <FilterBar members={orgMembers} />
      <BoardCanvas initialLists={board.lists} boardId={boardId} />
    </div>
  )
}
