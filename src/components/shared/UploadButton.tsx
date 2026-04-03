'use client'

import { useRef, useState } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { uploadAttachment } from '@/src/lib/actions/card.actions'
import { toast } from 'sonner'   // ← add

interface UploadButtonProps {
  cardId: string
  onUpdate: () => void
}

export function UploadButton({ cardId, onUpdate }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadAttachment(cardId, formData)

    if (result?.error) {
      toast.error(result.error)        // ← error toast
    } else {
      toast.success(`"${file.name}" uploaded successfully`)  // ← success toast
      onUpdate()
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5 w-full justify-start"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Paperclip className="h-3.5 w-3.5" />
        }
        {uploading ? 'Uploading...' : 'Attach file'}
      </Button>
    </div>
  )
}
