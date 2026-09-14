'use client'

/**
 * Learning (L2D) — shared resource presentation + the ResourceCard
 * component used by Overview / subject drill-downs / group resources
 * (spec §12: clean card, small type badge, subject, title, short
 * metadata, bookmark, completed state, open action — NO giant colored
 * headers).
 */

import { motion } from 'framer-motion'
import {
  Bookmark, BookmarkCheck, CheckCircle2, FileText, PencilRuler, NotebookPen,
  ListOrdered, FileCheck, RefreshCw, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { LearningMaterialCard } from './types'

// ─── Presentation metadata ───────────────────────────────────────────

export const CATEGORY_META: Record<string, { label: string; icon: typeof FileText; tone: string }> = {
  general: { label: 'General', icon: FileText, tone: 'text-muted-foreground bg-muted border-border' },
  worksheet: { label: 'Worksheet', icon: PencilRuler, tone: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  notes: { label: 'Notes', icon: NotebookPen, tone: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  syllabus: { label: 'Syllabus', icon: ListOrdered, tone: 'text-violet-700 dark:text-violet-400 bg-violet-500/10 border-violet-500/20' },
  'sample-paper': { label: 'Sample Paper', icon: FileCheck, tone: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
  revision: { label: 'Revision', icon: RefreshCw, tone: 'text-teal-700 dark:text-teal-400 bg-teal-500/10 border-teal-500/20' },
}

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.general
}

/** Short, honest file-type label from the stored MIME type. */
export function fileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'text/plain') return 'TXT'
  if (mimeType.startsWith('image/')) return 'IMG'
  if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') return 'DOC'
  if (mimeType.includes('presentationml') || mimeType === 'application/vnd.ms-powerpoint') return 'PPT'
  if (mimeType.includes('spreadsheetml') || mimeType === 'application/vnd.ms-excel') return 'XLS'
  return 'FILE'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** One line of honest metadata: type · size · date. */
export function materialMetaLine(m: LearningMaterialCard): string {
  const parts = [fileTypeLabel(m.mimeType), formatBytes(m.sizeBytes)]
  const date = formatShortDate(m.publishedAt ?? m.createdAt)
  if (date) parts.push(date)
  return parts.join(' · ')
}

// ─── ResourceCard ────────────────────────────────────────────────────

export function ResourceCard({
  material,
  onOpen,
  onToggleBookmark,
  bookmarkPending,
  index = 0,
}: {
  material: LearningMaterialCard
  onOpen: (m: LearningMaterialCard) => void
  onToggleBookmark: (m: LearningMaterialCard) => void
  bookmarkPending?: boolean
  index?: number
}) {
  const meta = categoryMeta(material.category)
  const TypeIcon = meta.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-2xs transition-shadow hover:shadow-xs hover:border-border/80"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', meta.tone)}>
            <TypeIcon className="h-3 w-3" aria-hidden />
            {meta.label}
          </span>
          {material.subjectName && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {material.subjectName}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label={material.bookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
          aria-pressed={material.bookmarked}
          onClick={() => onToggleBookmark(material)}
          disabled={bookmarkPending}
          className={cn(
            'shrink-0 rounded-md p-1.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            'hover:scale-110 active:scale-95',
            material.bookmarked
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground/50 hover:text-muted-foreground',
          )}
        >
          {material.bookmarked ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={() => onOpen(material)}
        className="mt-2.5 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md"
        aria-label={`Open ${material.title}`}
      >
        <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {material.title}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{materialMetaLine(material)}</p>
        <div className="mt-2 flex items-center gap-2">
          {material.completed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Completed
            </span>
          )}
          {material.opened && !material.completed && (
            <span className="text-[10px] font-medium text-muted-foreground">In progress</span>
          )}
        </div>
      </button>

      <div className="mt-3 pt-0 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpen(material)}
          className="h-7 gap-1 px-2.5 text-xs text-primary hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Compact row (Recent / Saved lists) ──────────────────────────────

export function ResourceRow({
  material,
  onOpen,
  onToggleBookmark,
  trailing,
}: {
  material: LearningMaterialCard
  onOpen: (m: LearningMaterialCard) => void
  onToggleBookmark: (m: LearningMaterialCard) => void
  trailing?: string
}) {
  const meta = categoryMeta(material.category)
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 px-3 py-2 transition-colors hover:bg-muted/30 hover:border-border">
      <button
        type="button"
        onClick={() => onOpen(material)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md"
        aria-label={`Open ${material.title}`}
      >
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border', meta.tone)}>
          <meta.icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-xs font-medium', material.completed && 'text-muted-foreground')}>
            {material.title}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {material.subjectName ?? meta.label}
            {trailing ? ` · ${trailing}` : ''}
          </span>
        </span>
        {material.completed && (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Completed" />
        )}
      </button>
      <button
        type="button"
        aria-label={material.bookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
        aria-pressed={material.bookmarked}
        onClick={() => onToggleBookmark(material)}
        className={cn(
          'shrink-0 rounded-md p-1 transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          material.bookmarked ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/40 hover:text-muted-foreground',
        )}
      >
        {material.bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
