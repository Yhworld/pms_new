'use server'

import { prisma } from '@/src/lib/prisma'
import { createClient } from '@/src/lib/supabase/server'
import { NotificationType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// ── Fetch current user's notifications ──────────────────────────────────────
export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return prisma.notification.findMany({
    where: { userId: user.id },
    include: { card: { include: { list: { include: { board: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
}

// ── Get unread count ─────────────────────────────────────────────────────────
export async function getUnreadCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  return prisma.notification.count({
    where: { userId: user.id, isRead: false },
  })
}

// ── Mark single notification as read ────────────────────────────────────────
export async function markAsRead(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
  revalidatePath('/', 'layout')
}

// ── Mark all as read ─────────────────────────────────────────────────────────
export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  })
  revalidatePath('/', 'layout')
}

// ── Internal: create a notification (called from other actions) ──────────────
export async function createNotification({
  type,
  message,
  userId,
  cardId,
}: {
  type: NotificationType
  message: string
  userId: string
  cardId?: string
}) {
  // Never notify yourself
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === userId) return

  await prisma.notification.create({
    data: { type, message, userId, cardId },
  })
}