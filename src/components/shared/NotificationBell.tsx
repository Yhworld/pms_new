'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation' // <-- NEW: Import useRouter
import { Button } from '@/src/components/ui/button' // Fixed path
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { cn } from '@/src/lib/utlis' // Fixed path/typo
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '@/src/lib/actions/notification.actions'
import { createClient } from '@/src/lib/supabase/client'
import type { Notification } from '@prisma/client'

type NotificationWithCard = Notification & {
  card: {
    id: string
    title: string
    list: { board: { id: string; projectId: string } }
  } | null
}

interface NotificationBellProps {
  userId: string
  initialUnreadCount: number
}

export function NotificationBell({ userId, initialUnreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationWithCard[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [isPending, startTransition] = useTransition()
  
  const router = useRouter() // <-- NEW: Initialize router

  // Load notifications when popover opens
  useEffect(() => {
    if (!open) return
    startTransition(async () => {
      const data = await getNotifications()
      setNotifications(data as NotificationWithCard[])
    })
  }, [open])

  // Supabase Realtime — live unread count
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${userId}`,
        },
        () => {
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // NEW: Updated to handle routing
  async function handleNotificationClick(notification: NotificationWithCard) {
    // 1. Optimistically mark as read if it isn't
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      // Fire and forget the server action
      markAsRead(notification.id).catch(console.error)
    }

    // 2. Navigate to the specific card if the notification is attached to one
    if (notification.card) {
      const { projectId, id: boardId } = notification.card.list.board
      // Close the popover
      setOpen(false)
      // Navigate to the board and open the card sheet via URL query parameter
      router.push(`/projects/${projectId}/boards/${boardId}?cardId=${notification.card.id}`)
    }
  }

  async function handleMarkAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    await markAllAsRead()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[360px]">
          {isPending && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-1">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)} // <-- NEW: Use the new click handler
                className={cn(
                  'w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors',
                  !n.isRead && 'bg-blue-50 dark:bg-blue-950/20',
                  n.card && 'cursor-pointer' // Show pointer if it's clickable
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <div className={cn('flex-1', n.isRead && 'pl-4')}>
                    <p className="text-sm leading-snug">{n.message}</p>
                    {n.card && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        📋 {n.card.title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}