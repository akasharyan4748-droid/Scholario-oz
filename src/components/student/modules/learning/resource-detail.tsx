'use client'

/**
 * Learning (L2D) — resource detail dialog (spec §69): title, subject,
 * type, description, authorized Download (RB-1 server-authorized stream →
 * blob — never a public file URL), bookmark toggle (optimistic with
 * rollback, spec §71) and a REAL "Mark complete" activity write.
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, Loader2, Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { apiPost } from './api'
import { categoryMeta, fileTypeLabel, formatBytes, formatShortDate } from './resource-shared'
import type { LearningMaterialCard } from './types'

export function ResourceDetailDialog({
  material,
  onClose,
  onCardChange,
}: {
  material: LearningMaterialCard | null
  onClose: () => void
  /** Propagate bookmark/completion changes back to the lists. */
  onCardChange: (m: LearningMaterialCard) => void
}) {
  const [downloading, setDownloading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const openedLogged = useRef<string | null>(null)

  // Log the REAL "opened" activity once per dialog open (spec §72).
  useEffect(() => {
    if (!material) {
      openedLogged.current = null
      return
    }
    if (openedLogged.current === material.id) return
    openedLogged.current = material.id
    apiPost('/api/student/learning/activity', { studyMaterialId: material.id, action: 'opened' })
      .then(() => {
        onCardChange({ ...material, opened: true, lastOpenedAt: new Date().toISOString() })
      })
      .catch(() => {
        // An activity log failure must never block reading the resource.
      })
  }, [material?.id])
  // Authorized download — the URL is the route; the session cookie is the
  // authorization. The stored fileName never leaves the server.
  const download = async (m: LearningMaterialCard) => {
    if (downloading) return
    setDownloading(true)
    try {
      const r = await fetch(`/api/study-materials/${m.id}/download`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!r.ok) {
        throw new Error(r.status === 404 ? 'This file is no longer available.' : 'Download was not authorized.')
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = m.originalName || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  const toggleBookmark = async (m: LearningMaterialCard) => {
    // Optimistic flip; rollback + honest toast on failure (spec §71).
    onCardChange({ ...m, bookmarked: !m.bookmarked })
    try {
      const res = await apiPost<{ bookmarked: boolean }>('/api/student/learning/bookmark', {
        studyMaterialId: m.id,
      })
      if (res.bookmarked !== !m.bookmarked) onCardChange({ ...m, bookmarked: res.bookmarked })
    } catch {
      onCardChange({ ...m, bookmarked: m.bookmarked })
      toast.error('Could not save right now.')
    }
  }

  const markComplete = async (m: LearningMaterialCard) => {
    if (completing || m.completed) return
    setCompleting(true)
    try {
      await apiPost('/api/student/learning/activity', { studyMaterialId: m.id, action: 'completed' })
      onCardChange({ ...m, completed: true })
      toast.success('Marked as completed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setCompleting(false)
    }
  }

  if (!material) return null
  const meta = categoryMeta(material.category)

  return (
    <Dialog open={!!material} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', meta.tone)}>
              <meta.icon className="h-3 w-3" aria-hidden /> {meta.label}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {fileTypeLabel(material.mimeType)}
              {material.subjectName ? ` · ${material.subjectName}` : ''}
              {material.className ? ` · ${material.className}` : ''}
            </span>
          </div>
          <DialogTitle className="text-left text-base leading-snug">{material.title}</DialogTitle>
          {material.description && (
            <DialogDescription className="text-left text-xs leading-relaxed">
              {material.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{formatBytes(material.sizeBytes)}</span>
          <span aria-hidden>·</span>
          <span>{formatShortDate(material.publishedAt ?? material.createdAt)}</span>
          {material.completed && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Completed
            </span>
          )}
        </div>

        <motion.div layout className="mt-1 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => download(material)}
              disabled={downloading}
              className="h-9 gap-1.5"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
              {downloading ? 'Downloading…' : 'Download'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markComplete(material)}
              disabled={completing || material.completed}
              className={cn('h-9 gap-1.5', material.completed && 'text-emerald-600 dark:text-emerald-400')}
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              )}
              {material.completed ? 'Completed' : 'Mark complete'}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBookmark(material)}
            className={cn(
              'h-8 gap-1.5',
              material.bookmarked ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
            )}
            aria-pressed={material.bookmarked}
          >
            {material.bookmarked ? (
              <BookmarkCheck className="h-4 w-4" aria-hidden />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden />
            )}
            {material.bookmarked ? 'Saved' : 'Save for later'}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
