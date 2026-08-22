'use client'

/**
 * Document primitives — shared visual system for documents across SCHOLARIO.
 *
 * Used by both Certificates and Downloads to give documents a real visual
 * identity (document thumbnails, file-type badges, document cards) instead
 * of tiny utility icons.
 *
 * Design language (matches Academics):
 *   - Single Scholario accent (emerald) for the default tone
 *   - Format-specific tints for file types (PDF=rose, XLSX=emerald, etc.) — semantic, not decorative
 *   - DocumentThumbnail = paper silhouette with format edge stripe + glyph
 *   - Compact, premium, not flashy
 *
 * Exports:
 *   - DocumentThumbnail : paper preview with format edge stripe + glyph
 *   - FileTypeBadge     : small format pill (PDF / XLSX / DOCX / etc.)
 *   - DocumentIcon      : lucide icon with format tint (for list rows)
 *   - DocumentCard      : card layout for a document (thumbnail + name + desc + category + actions)
 *   - DOC_TYPE_META     : metadata for document types (icon, category, tone)
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  FileText, ScrollText, Award, CreditCard, Receipt, GraduationCap,
  ClipboardList, FileSpreadsheet, FileImage, File as FileIcon,
  Presentation, FileType2,
} from 'lucide-react'

// ─── Format / Type metadata ─────────────────────────────────────────

export type DocFormat = 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'JPG' | 'PNG' | 'PPTX' | 'TXT' | 'unknown'
export type DocCategory = 'Certificate' | 'Identity' | 'Receipt' | 'Report' | 'Form' | 'Template' | 'General'

export interface DocTypeMeta {
  /** lucide icon node */
  icon: ReactNode
  /** category for grouping */
  category: DocCategory
  /** tone for the edge stripe / tint */
  tone: DocTone
  /** short label */
  label: string
}

export type DocTone = 'emerald' | 'rose' | 'sky' | 'amber' | 'violet' | 'teal' | 'slate'

const TONE_STYLES: Record<DocTone, { text: string; bg: string; border: string; stripe: string }> = {
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', stripe: 'bg-emerald-500' },
  rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', stripe: 'bg-rose-500' },
  sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', stripe: 'bg-sky-500' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', stripe: 'bg-amber-500' },
  violet: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', stripe: 'bg-violet-500' },
  teal: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', stripe: 'bg-teal-500' },
  slate: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', stripe: 'bg-slate-500' },
}

const FORMAT_TONE: Record<DocFormat, DocTone> = {
  PDF: 'rose',
  DOCX: 'sky',
  XLSX: 'emerald',
  CSV: 'teal',
  JPG: 'violet',
  PNG: 'violet',
  PPTX: 'amber',
  TXT: 'slate',
  unknown: 'slate',
}

const FORMAT_ICON: Record<DocFormat, ReactNode> = {
  PDF: <FileText className="h-full w-full" />,
  DOCX: <FileText className="h-full w-full" />,
  XLSX: <FileSpreadsheet className="h-full w-full" />,
  CSV: <FileSpreadsheet className="h-full w-full" />,
  JPG: <FileImage className="h-full w-full" />,
  PNG: <FileImage className="h-full w-full" />,
  PPTX: <Presentation className="h-full w-full" />,
  TXT: <FileText className="h-full w-full" />,
  unknown: <FileIcon className="h-full w-full" />,
}

// Document type metadata (for Certificates + generated docs).
//
// Both kebab-case keys (canonical, e.g. 'id-card') AND title-case aliases
// (matching the Cert store's DocType union, e.g. 'ID Card') are provided so
// callers can use either form. Icons are synced with the Cert module's
// DOC_TYPES array (cert-shared.tsx): Bonafide→FileText, Migration→GraduationCap,
// Marksheet→ClipboardList.
export const DOC_TYPE_META: Record<string, DocTypeMeta> = {
  // kebab-case (canonical)
  bonafide: { icon: <FileText className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Bonafide' },
  transfer: { icon: <ScrollText className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Transfer' },
  character: { icon: <Award className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Character' },
  'id-card': { icon: <CreditCard className="h-full w-full" />, category: 'Identity', tone: 'emerald', label: 'ID Card' },
  'fee-receipt': { icon: <Receipt className="h-full w-full" />, category: 'Receipt', tone: 'emerald', label: 'Fee Receipt' },
  migration: { icon: <GraduationCap className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Migration' },
  marksheet: { icon: <ClipboardList className="h-full w-full" />, category: 'Report', tone: 'emerald', label: 'Marksheet' },
  // title-case aliases (Cert store's DocType union — 'Bonafide', 'ID Card', …)
  Bonafide: { icon: <FileText className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Bonafide' },
  Transfer: { icon: <ScrollText className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Transfer' },
  Character: { icon: <Award className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Character' },
  'ID Card': { icon: <CreditCard className="h-full w-full" />, category: 'Identity', tone: 'emerald', label: 'ID Card' },
  'Fee Receipt': { icon: <Receipt className="h-full w-full" />, category: 'Receipt', tone: 'emerald', label: 'Fee Receipt' },
  Migration: { icon: <GraduationCap className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Migration' },
  Marksheet: { icon: <ClipboardList className="h-full w-full" />, category: 'Report', tone: 'emerald', label: 'Marksheet' },
}

/** Resolve a doc-type key (kebab- or title-case) to its visual meta. */
export function getDocTypeMeta(docType?: string): DocTypeMeta | undefined {
  if (!docType) return undefined
  return DOC_TYPE_META[docType] ?? DOC_TYPE_META[docType.toLowerCase()]
}

// ─── DocumentThumbnail ──────────────────────────────────────────────

export interface DocumentThumbnailProps {
  /** Document format (for file-type tint) OR docType key (for certificate docs) */
  format?: DocFormat
  docType?: string
  /** lucide icon override (if format/docType not enough) */
  icon?: ReactNode
  /** Thumbnail size */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Tone override (default: from format/docType, or emerald) */
  tone?: DocTone
  className?: string
}

const THUMB_SIZES: Record<string, string> = {
  sm: 'h-10 w-8',      // receipt-ish
  md: 'h-14 w-11',     // A4-ish small
  lg: 'h-20 w-16',     // A4 medium
  xl: 'h-28 w-22',     // A4 large
}

const THUMB_ICON_SIZES: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
}

export function DocumentThumbnail({
  format, docType, icon, size = 'md', tone, className,
}: DocumentThumbnailProps) {
  const meta = docType ? DOC_TYPE_META[docType] : undefined
  const resolvedTone = tone ?? meta?.tone ?? (format ? FORMAT_TONE[format] : 'emerald')
  const resolvedIcon = icon ?? meta?.icon ?? (format ? FORMAT_ICON[format] : <FileText className="h-full w-full" />)
  const ts = TONE_STYLES[resolvedTone]

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-md border bg-card overflow-hidden',
        'flex items-center justify-center',
        ts.border,
        THUMB_SIZES[size],
        className,
      )}
    >
      {/* Format edge stripe (left) */}
      <div className={cn('absolute inset-y-0 left-0 w-1', ts.stripe)} />
      {/* Subtle tint background */}
      <div className={cn('absolute inset-0', ts.bg)} />
      {/* Icon */}
      <div className={cn('relative', THUMB_ICON_SIZES[size], ts.text)}>
        {resolvedIcon}
      </div>
    </div>
  )
}

// ─── FileTypeBadge ──────────────────────────────────────────────────

export interface FileTypeBadgeProps {
  format: DocFormat
  className?: string
  size?: 'xs' | 'sm'
}

export function FileTypeBadge({ format, className, size = 'sm' }: FileTypeBadgeProps) {
  const tone = FORMAT_TONE[format]
  const ts = TONE_STYLES[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-bold tabular-nums',
        size === 'xs' ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[9px]',
        ts.bg, ts.text, ts.border,
        className,
      )}
    >
      {format}
    </span>
  )
}

// ─── DocumentIcon (for list rows) ────────────────────────────────────

export interface DocumentIconProps {
  format?: DocFormat
  docType?: string
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const DOC_ICON_SIZES: Record<string, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const DOC_ICON_GLYPH_SIZES: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function DocumentIcon({ format, docType, icon, size = 'md', className }: DocumentIconProps) {
  const meta = docType ? DOC_TYPE_META[docType] : undefined
  const resolvedTone = meta?.tone ?? (format ? FORMAT_TONE[format] : 'emerald')
  const resolvedIcon = icon ?? meta?.icon ?? (format ? FORMAT_ICON[format] : <FileText className="h-full w-full" />)
  const ts = TONE_STYLES[resolvedTone]
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border',
        ts.bg, ts.border,
        DOC_ICON_SIZES[size],
        className,
      )}
    >
      <div className={cn(DOC_ICON_GLYPH_SIZES[size], ts.text)}>
        {resolvedIcon}
      </div>
    </div>
  )
}

// ─── DocumentCard ───────────────────────────────────────────────────

export interface DocumentCardProps {
  /** Document thumbnail (format or docType drives the visual) */
  format?: DocFormat
  docType?: string
  icon?: ReactNode
  /** Document name */
  name: string
  /** Short description */
  description?: string
  /** Category badge */
  category?: DocCategory | string
  /** Selected state (for selectors) */
  selected?: boolean
  /** Click handler */
  onClick?: () => void
  /** Right-side actions */
  actions?: ReactNode
  className?: string
  /** Thumbnail size */
  thumbnailSize?: 'sm' | 'md' | 'lg'
}

export function DocumentCard({
  format, docType, icon, name, description, category, selected, onClick, actions, className, thumbnailSize = 'md',
}: DocumentCardProps) {
  const meta = docType ? DOC_TYPE_META[docType] : undefined
  const resolvedTone = meta?.tone ?? (format ? FORMAT_TONE[format] : 'emerald')
  const ts = TONE_STYLES[resolvedTone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all',
        'hover:shadow-sm',
        selected
          ? cn('border-2', ts.border, 'ring-2', ts.border.replace(/^border-/, 'ring-'))
          : 'border-border',
        className,
      )}
    >
      {/* Thumbnail */}
      <DocumentThumbnail format={format} docType={docType} icon={icon} size={thumbnailSize} tone={resolvedTone} />
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-foreground truncate">{name}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
          {category && (
            <span className={cn(
              'inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
              ts.bg, ts.text,
            )}>
              {category}
            </span>
          )}
        </div>
        {actions && (
          <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {/* Selected check */}
      {selected && (
        <div className={cn('absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full', ts.bg, ts.text)}>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}

// ─── CategoryPill (shared) ──────────────────────────────────────────

export function CategoryPill({ category, tone, className }: { category: string; tone?: DocTone; className?: string }) {
  const resolvedTone = tone ?? 'slate'
  const ts = TONE_STYLES[resolvedTone]
  return (
    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider', ts.bg, ts.text, className)}>
      {category}
    </span>
  )
}
