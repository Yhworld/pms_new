'use client'

import { useState } from 'react'
import { Paperclip, Download, Trash2, Loader2, FileText, Image, Film, Archive } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { getAttachmentUrl, deleteAttachment } from '@/src/lib/actions/card.actions'
import { toast } from 'sonner'

interface Attachment {
  id: string
  name: string
  url: string
  mimeType: string | null
  size: number | null
  createdAt: Date
}

interface AttachmentListProps {
  attachments: Attachment[]
  onUpdate: () => void
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (!mimeType) return <FileText className="h-4 w-4 text-slate-400" />
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />
  if (mimeType.startsWith('video/')) return <Film className="h-4 w-4 text-purple-400" />
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4 text-yellow-400" />
  return <FileText className="h-4 w-4 text-slate-400" />
}

export function AttachmentList({ attachments, onUpdate }: AttachmentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDownload(attachment: Attachment) {
    setDownloadingId(attachment.id)
    const url = await getAttachmentUrl(attachment.url)
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.name
      a.target = '_blank'
      a.click()
    }
    setDownloadingId(null)
  }

  async function handleDelete(attachment: Attachment) {
  setDeletingId(attachment.id)
  const result = await deleteAttachment(attachment.id, attachment.url)
  if (result?.error) {
    toast.error(result.error)
  } else {
    toast.success('Attachment deleted')   // ← add
    onUpdate()
  }
  setDeletingId(null)
}

  if (attachments.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center gap-2.5 p-2 rounded-lg border bg-white hover:bg-slate-50 transition-colors group"
        >
          <FileIcon mimeType={att.mimeType} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{att.name}</p>
            <p className="text-xs text-slate-400">{formatBytes(att.size)}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleDownload(att)}
              disabled={!!downloadingId}
            >
              {downloadingId === att.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5 text-slate-500" />
              }
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleDelete(att)}
              disabled={!!deletingId}
            >
              {deletingId === att.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-500" />
              }
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
