'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { createNotification } from '@/src/lib/actions/notification.actions'
import type { CardStatus, CardPriority } from '@/src/types'

// ─── AUTH HELPERS (RBAC) ──────────────────────────────────────────────────────
// Use these to verify the user actually belongs to the project before modifying data.
async function verifyCardAccess(cardId: string, userId: string) {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      // Verifies the user is a member of the project this card belongs to
      list: { board: { project: { members: { some: { userId } } } } }
      
      // Pro-tip: If you have roles in your Prisma schema (like 'role: String'), 
      // you can strictly block viewers from mutating by adding it here:
      // list: { board: { project: { members: { some: { userId, role: { in: ['ADMIN', 'MEMBER'] } } } } } }
    }
  })
  if (!card) throw new Error('Forbidden: You lack permissions for this card.')
  return card
}

async function verifyBoardAccess(boardId: string, userId: string) {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      project: { members: { some: { userId } } }
    }
  })
  if (!board) throw new Error('Forbidden: You lack permissions for this board.')
  return board
}


// ─── Get full card detail ─────────────────────────────────────────────────────
export async function getCardDetail(cardId: string) {
  // Added auth check so random users can't read card details via API
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    await verifyCardAccess(cardId, user.id) // Secure read access
    
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: { include: { board: { include: { project: { include: { organization: true } } } } } },
        members: { include: { user: true } },
        labels: { include: { label: true } },
        attachments: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
        checklists: {
          orderBy: { position: 'asc' },
          include: {
            items: {
              orderBy: { position: 'asc' },
              include: { assignee: true },
            },
          },
        },
        _count: { select: { comments: true, attachments: true } },
      },
    })
    return card
  } catch (e) {
    console.error(e)
    return null
  }
}


// ─── Update card title / description ─────────────────────────────────────────
export async function updateCard(
  cardId: string,
  data: { title?: string; description?: string; dueDate?: Date | null; status?: CardStatus; priority?: CardPriority }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await verifyCardAccess(cardId, user.id) // Secure mutation
    await prisma.card.update({ where: { id: cardId }, data })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to update card' }
  }
}


// ─── Add comment ─────────────────────────────────────────────────────────────
export async function addComment(cardId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await verifyCardAccess(cardId, user.id) // Secure mutation

    await prisma.comment.create({
      data: { cardId, userId: user.id, content },
    })

    const [cardMembers, card] = await Promise.all([
      prisma.cardMember.findMany({ where: { cardId }, select: { userId: true } }),
      prisma.card.findUnique({ where: { id: cardId }, select: { title: true } }),
    ])

    await Promise.all(
      cardMembers
        .filter(m => m.userId !== user.id)
        .map(m =>
          createNotification({
            type: 'COMMENT_ADDED',
            message: `New comment on "${card?.title}"`,
            userId: m.userId,
            cardId,
          })
        )
    )

    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to add comment' }
  }
}


// ─── Toggle checklist item ────────────────────────────────────────────────────
export async function toggleChecklistItem(itemId: string, isCompleted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const item = await prisma.checklistItem.findUnique({ where: { id: itemId }, include: { checklist: true } })
    if (!item) throw new Error('Item not found')
    
    await verifyCardAccess(item.checklist.cardId, user.id) // Secure mutation

    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { isCompleted },
    })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to update item' }
  }
}


// ─── Add checklist ────────────────────────────────────────────────────────────
export async function addChecklist(cardId: string, title: string, position: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await verifyCardAccess(cardId, user.id) // Secure mutation

    await prisma.checklist.create({
      data: { cardId, title, position },
    })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to add checklist' }
  }
}


// ─── Add checklist item ───────────────────────────────────────────────────────
export async function addChecklistItem(
  checklistId: string,
  title: string,
  position: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const checklist = await prisma.checklist.findUnique({ where: { id: checklistId } })
    if (!checklist) throw new Error('Checklist not found')

    await verifyCardAccess(checklist.cardId, user.id) // Secure mutation

    await prisma.checklistItem.create({
      data: { checklistId, title, position },
    })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to add item' }
  }
}


// ─── Assign / Unassign member ─────────────────────────────────────────────────
export async function toggleCardMember(cardId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await verifyCardAccess(cardId, user.id) // Secure mutation

    const existing = await prisma.cardMember.findUnique({
      where: { cardId_userId: { cardId, userId } },
    })

    if (existing) {
      await prisma.cardMember.delete({
        where: { cardId_userId: { cardId, userId } },
      })
    } else {
      await prisma.cardMember.create({
        data: { cardId, userId },
      })

      if (userId !== user.id) {
        const card = await prisma.card.findUnique({
          where: { id: cardId },
          select: { title: true },
        })
        await createNotification({
          type: 'CARD_ASSIGNED',
          message: `You were assigned to "${card?.title}"`,
          userId,
          cardId,
        })
      }
    }

    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to update member' }
  }
}


// ─── Get project members (for assignment picker) ──────────────────────────────
export async function getProjectMembers(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    await verifyCardAccess(cardId, user.id) // Secure read

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: { include: { project: { include: { members: { include: { user: true } } } } } } } } },
    })
    return card?.list.board.project.members ?? []
  } catch (e) {
    console.error(e)
    return []
  }
}


// ─── Create label ─────────────────────────────────────────────────────────────
export async function createLabel(boardId: string, name: string, color: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await verifyBoardAccess(boardId, user.id) // Secure mutation

    const label = await prisma.label.create({
      data: { boardId, name, color },
    })
    revalidatePath('/', 'layout')
    return { label }
  } catch (e) {
    console.error(e)
    return { error: 'Failed to create label' }
  }
}


// ─── Toggle label on card ─────────────────────────────────────────────────────
export async function toggleCardLabel(cardId: string, labelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await verifyCardAccess(cardId, user.id) // Secure mutation

    const existing = await prisma.cardLabel.findUnique({
      where: { cardId_labelId: { cardId, labelId } },
    })

    if (existing) {
      await prisma.cardLabel.delete({
        where: { cardId_labelId: { cardId, labelId } },
      })
    } else {
      await prisma.cardLabel.create({
        data: { cardId, labelId },
      })
    }
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to update label' }
  }
}


// ─── Get board labels ─────────────────────────────────────────────────────────
export async function getBoardLabels(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    await verifyCardAccess(cardId, user.id) // Secure read

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: { include: { labels: true } } } } },
    })
    return card?.list.board.labels ?? []
  } catch (e) {
    console.error(e)
    return []
  }
}


// ─── Edit comment ─────────────────────────────────────────────────────────────
export async function editComment(commentId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    // Only the user who created it can edit it (secure by where clause)
    await prisma.comment.update({
      where: { id: commentId, userId: user.id },
      data: { content },
    })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to edit comment' }
  }
}


// ─── Delete comment ───────────────────────────────────────────────────────────
export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    // Only the user who created it can delete it (secure by where clause)
    await prisma.comment.delete({
      where: { id: commentId, userId: user.id },
    })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to delete comment' }
  }
}


// ─── Upload attachment ────────────────────────────────────────────────────────
export async function uploadAttachment(cardId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await verifyCardAccess(cardId, user.id) // Secure mutation

    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }
    if (file.size > 10 * 1024 * 1024) return { error: 'File too large (max 10MB)' }

    const ext = file.name.split('.').pop()
    const path = `${cardId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file)

    if (uploadError) {
      console.error(uploadError)
      return { error: 'Upload failed' }
    }

    await prisma.attachment.create({
      data: { cardId, name: file.name, url: path, mimeType: file.type, size: file.size },
    })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to save attachment' }
  }
}


// ─── Get signed URL ───────────────────────────────────────────────────────────
export async function getAttachmentUrl(path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Supabase handles auth via bucket policies, but signing requires valid session
  const { data } = await supabase.storage
    .from('attachments')
    .createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? null
}


// ─── Delete attachment ────────────────────────────────────────────────────────
export async function deleteAttachment(attachmentId: string, path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } })
    if (!attachment) throw new Error('Attachment not found')

    await verifyCardAccess(attachment.cardId, user.id) // Secure mutation

    await supabase.storage.from('attachments').remove([path])
    await prisma.attachment.delete({ where: { id: attachmentId } })
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error(e)
    return { error: 'Failed to delete attachment' }
  }
}