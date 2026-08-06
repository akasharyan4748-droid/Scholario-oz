'use client'

/**
 * OCR Scanned Form Attachment Badge.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 *
 * Shown at the top of the wizard when the form was populated from a scanned
 * attachment, summarising the file name and AI OCR confidence.
 */
import { Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ScannedAttachmentBadge({
  attachment,
}: {
  attachment: { fileName: string; date: string; confidence: number }
}) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-emerald-600" />
        <span>
          Form populated via AI OCR scan from <strong className="font-semibold">{attachment.fileName}</strong> ({attachment.confidence}% confidence)
        </span>
      </div>
      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none text-[10px]">
        Scanned Form Attached
      </Badge>
    </div>
  )
}
