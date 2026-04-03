'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/src/lib/prisma'
import type { CardPriority, CardStatus } from '@prisma/client'


export async function createBoard(formData: FormData) {
  const boardName = formData.get('boardName') as string
  const projectId = formData.get('projectId') as string
  const color = formData.get('color') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Only project managers can create boards
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  })
  if (!member || member.role !== 'MANAGER') return { error: 'Only managers can create boards' }

  try {
    const board = await prisma.board.create({
      data: { name: boardName, projectId, color },
    })
    return { boardId: board.id }
  } catch {
    return { error: 'Failed to create board' }
  }
}


// ─── Create List ─────────────────────────────────────────────────────────────
export async function createList({
  boardId,
  name,
  position,
}: {
  boardId: string
  name: string
  position: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.list.create({
      data: { boardId, name, position },
    })
    revalidatePath(`/projects/[projectId]/boards/${boardId}`, 'page')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to create list' }
  }
}

// ─── Create Card ───────────────────────────────────────────────────────────── // ← add at top

export async function createCard({
  listId,
  title,
  description,
  position,
  priority = 'MEDIUM',
  status = 'TODO',
}: {
  listId: string
  title: string
  description: string
  position: number
  priority?: string    // ← add
  status?: string      // ← add
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.card.create({
      data: {
        listId,
        title,
        description: description || null,
        position,
        priority: priority as CardPriority,  // ← add
        status: status as CardStatus,        // ← add
      },
    })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to create card' }
  }
}


// ─── Delete List ──────────────────────────────────────────────────────────────
export async function deleteList(listId: string, boardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.list.delete({ where: { id: listId } })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to delete list' }
  }
}

// ─── Reorder Cards ────────────────────────────────────────────────────────────
export async function reorderCards(
  cards: { id: string; position: number; listId: string }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.$transaction(
      cards.map((card) =>
        prisma.card.update({
          where: { id: card.id },
          data: { position: card.position, listId: card.listId },
        })
      )
    )
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to reorder cards' }
  }
}

// ─── Reorder Lists ────────────────────────────────────────────────────────────
export async function reorderLists(
  lists: { id: string; position: number }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.$transaction(
      lists.map((list) =>
        prisma.list.update({
          where: { id: list.id },
          data: { position: list.position },
        })
      )
    )
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to reorder lists' }
  }
}

