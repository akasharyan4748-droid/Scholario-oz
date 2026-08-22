'use client'

/**
 * downloads-shared — shared primitives for the Document Library module.
 *
 * Visual language: SCHOLARIO emerald/teal primary, subtle muted colours,
 * rounded soft-tinted pills, NO large colorful icon squares.
 */

import { motion } from 'framer-motion'
import {
  FileText, FileSpreadsheet, FileImage, FileType2, File as FileIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel } from '../shared/panel'
import type {
  DocSource, DocFormat, DocCategory, DownloadDocument,
} from '@/lib/store/downloads-store'

// ─── DocIcon — small file-type icon (subtle, muted) ──────────────────

interface DocIconProps {
  format: DocFormat
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const FORMAT_ICON: Record<DocFormat, LucideIcon> = {
  PDF: FileText,
  DOCX: FileText,
  XLSX: FileSpreadsheet,
  CSV: FileSpreadsheet,
  JPG: FileImage,
}

const FORMAT_TINT: Record<DocFormat, string> = {
  PDF: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300 ring-rose-500/20',
  DOCX: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300 ring-sky-500/20',
  XLSX: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 ring-emerald-500/20',
  CSV: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300 ring-teal-500/20',
  JPG: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300 ring-violet-500/20',
}

const DOCICON_SIZE: Record<NonNullable<DocIconProps['size']>, string> = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-lg',
  lg: 'h-11 w-11 rounded-xl',
}

const DOCICON_GLYPH: Record<NonNullable<DocIconProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function DocIcon({ format, size = 'md', className }: DocIconProps) {
  const Icon = FORMAT_ICON[format] ?? FileIcon
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center ring-1',
        DOCICON_SIZE[size],
        FORMAT_TINT[format],
        className,
      )}
      aria-hidden
    >
      <Icon className={DOCICON_GLYPH[size]} />
    </span>
  )
}

// ─── FormatBadge — small neutral text badge ────────────────────────────

const FORMAT_BADGE: Record<DocFormat, string> = {
  PDF: 'border-rose-500/20 text-rose-600 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-500/10',
  DOCX: 'border-sky-500/20 text-sky-600 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-500/10',
  XLSX: 'border-emerald-500/20 text-emerald-600 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-500/10',
  CSV: 'border-teal-500/20 text-teal-600 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-500/10',
  JPG: 'border-violet-500/20 text-violet-600 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-500/10',
}

export function FormatBadge({ format, className }: { format: DocFormat; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold tracking-wide border tabular-nums',
        FORMAT_BADGE[format],
        className,
      )}
    >
      {format}
    </span>
  )
}

// ─── SourceBadge — subtle pill for source ──────────────────────────────

const SOURCE_BADGE: Record<DocSource, { className: string; dot: string; icon: LucideIcon }> = {
  'Official Form': {
    className: 'border-border text-muted-foreground bg-muted/40',
    dot: 'bg-slate-500',
    icon: FileType2,
  },
  'Template': {
    className: 'border-teal-500/20 text-teal-700 dark:text-teal-300 bg-teal-50/60 dark:bg-teal-500/10',
    dot: 'bg-teal-500',
    icon: FileType2,
  },
  'Generated': {
    className: 'border-emerald-500/25 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-500/10',
    dot: 'bg-emerald-500',
    icon: FileType2,
  },
  'Report': {
    className: 'border-amber-500/25 text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-500/10',
    dot: 'bg-amber-500',
    icon: FileType2,
  },
  'Resource': {
    className: 'border-cyan-500/20 text-cyan-700 dark:text-cyan-300 bg-cyan-50/60 dark:bg-cyan-500/10',
    dot: 'bg-cyan-500',
    icon: FileType2,
  },
}

export function SourceBadge({
  source,
  className,
  showIcon = false,
}: {
  source: DocSource
  className?: string
  showIcon?: boolean
}) {
  const meta = SOURCE_BADGE[source]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border whitespace-nowrap',
        meta.className,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />
      {showIcon && <Icon className="h-2.5 w-2.5" />}
      {source}
    </span>
  )
}

// ─── CategoryPill — small category chip ────────────────────────────────

const CATEGORY_PILL: Record<DocCategory, string> = {
  'Admissions': 'text-slate-600 dark:text-slate-300',
  'Student Records': 'text-cyan-700 dark:text-cyan-300',
  'Finance': 'text-amber-700 dark:text-amber-300',
  'Academics': 'text-emerald-700 dark:text-emerald-300',
  'Operations': 'text-teal-700 dark:text-teal-300',
  'Health': 'text-rose-700 dark:text-rose-300',
  'Transport': 'text-violet-700 dark:text-violet-300',
}

export function CategoryPill({
  category,
  className,
}: {
  category: DocCategory
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-[10px] font-medium tracking-tight whitespace-nowrap',
        CATEGORY_PILL[category],
        className,
      )}
    >
      {category}
    </span>
  )
}

// ─── DownloadsPanel (flat section container — re-exports shared Panel) ──
//
// Converged to the shared Academics-pattern Panel: flat rounded card with
// title + optional subtitle + optional action on a header row, then body
// content below. NO `border-b bg-muted/20` header strip — the Academics
// visual language uses a single flat surface for all section containers.

export const DownloadsPanel = Panel

// ─── Empty state ──────────────────────────────────────────────────────

export function DownloadsEmptyState({
  icon, title, description, action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-14 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  )
}

// ─── Sort + category option constants ─────────────────────────────────

export const SORT_OPTIONS: Array<{ value: 'recent' | 'name-az' | 'name-za' | 'type'; label: string }> = [
  { value: 'recent', label: 'Last updated' },
  { value: 'name-az', label: 'Name (A → Z)' },
  { value: 'name-za', label: 'Name (Z → A)' },
  { value: 'type', label: 'File type' },
]

export const CATEGORY_OPTIONS: Array<{ value: DocCategory; label: string }> = [
  { value: 'Admissions', label: 'Admissions' },
  { value: 'Student Records', label: 'Student Records' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Academics', label: 'Academics' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Health', label: 'Health' },
  { value: 'Transport', label: 'Transport' },
]

// ─── Metadata helpers ─────────────────────────────────────────────────

export function docDescriptionLabel(doc: DownloadDocument): string {
  if (doc.studentName) return `For ${doc.studentName}`
  if (doc.docNumber) return doc.docNumber
  return doc.description
}

export const DOWNLOADS_GLOBAL_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .downloads-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
/* Subtle scrollbar for the document list */
.downloads-list-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.downloads-list-scroll::-webkit-scrollbar-track { background: transparent; }
.downloads-list-scroll::-webkit-scrollbar-thumb {
  background: hsl(0 0% 80%);
  border-radius: 3px;
}
.downloads-list-scroll::-webkit-scrollbar-thumb:hover { background: hsl(0 0% 65%); }
.dark .downloads-list-scroll::-webkit-scrollbar-thumb { background: hsl(0 0% 30%); }
`
