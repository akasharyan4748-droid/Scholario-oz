'use client'

/**
 * Document primitives — shared visual system for documents across SCHOLARIO.
 *
 * Used by both Certificates and Downloads to give documents a real visual
 * identity (document thumbnails, file-type badges, document cards) instead
 * of tiny utility icons.
 *
 * Design language (per Academics spec + FC-2 visual upgrade):
 *   - Single Scholario accent (emerald) for certificate doc-type accents.
 *     Icon differentiates the cert type; color stays consistent.
 *   - Format-specific tints for file types — semantic, not decorative:
 *       PDF → rose, DOCX → sky, XLSX/CSV → emerald/teal,
 *       PPTX → amber, JPG/PNG → violet, TXT → slate.
 *   - PDF uses FileText + a small "PDF" footer label inside the thumbnail
 *     (the strongest format identity — visually distinct from DOCX).
 *   - DOCX uses FileType2 (document-with-text-lines) — distinct from PDF.
 *   - Cert doc-types use distinctive glyphs:
 *       Bonafide → ScrollText (certificate scroll)
 *       Transfer → FileOutput (leaving the school)
 *       Character → FileSignature (signed character doc)
 *       ID Card → IdCard (dedicated lucide glyph)
 *       Fee Receipt → Receipt
 *       Migration → GraduationCap
 *       Marksheet → FileBarChart (marks + chart)
 *   - DocumentThumbnail = paper silhouette with format edge stripe (w-1.5,
 *     wider for stronger identity) + tint + glyph + a small dog-ear fold in
 *     the top-right corner so it reads as a real document, not a coloured
 *     box.
 *   - Only the document visual carries color — the rest of the row/card is
 *     clean.
 *
 * Exports:
 *   - DocumentThumbnail : paper preview with format edge stripe + glyph + fold
 *   - FileTypeBadge     : small format pill (PDF / XLSX / DOCX / etc.)
 *   - DocumentIcon      : lucide icon with format tint (for list rows)
 *   - DocumentCard      : card layout for a document (thumbnail + name + desc + category + actions)
 *   - DOC_TYPE_META     : metadata for document types (icon, category, tone)
 *   - getDocTypeMeta    : resolve a doc-type key (kebab- or title-case) to its meta
 *   - CategoryPill      : small category chip (shared)
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  FileText, ScrollText, FileSignature, IdCard, Receipt, GraduationCap,
  FileBarChart, FileOutput,
  FileSpreadsheet, FileImage, File as FileIcon,
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

// Format glyphs — PDF and DOCX are now visually distinct:
//   · PDF  → FileText (rose) + a "PDF" footer band rendered by DocumentThumbnail
//   · DOCX → FileType2 (sky, doc-with-text-lines silhouette)
//   · XLSX → FileSpreadsheet (emerald)
//   · CSV  → FileSpreadsheet (teal)
//   · PPTX → Presentation (amber)
//   · JPG/PNG → FileImage (violet)
const FORMAT_ICON: Record<DocFormat, ReactNode> = {
  PDF: <FileText className="h-full w-full" />,
  DOCX: <FileType2 className="h-full w-full" />,
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
// callers can use either form. Icons use distinctive glyphs so every cert
// type is recognizable at a glance — all share the single emerald accent.
export const DOC_TYPE_META: Record<string, DocTypeMeta> = {
  // kebab-case (canonical)
  bonafide: { icon: <ScrollText className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Bonafide' },
  transfer: { icon: <FileOutput className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Transfer' },
  character: { icon: <FileSignature className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Character' },
  'id-card': { icon: <IdCard className="h-full w-full" />, category: 'Identity', tone: 'emerald', label: 'ID Card' },
  'fee-receipt': { icon: <Receipt className="h-full w-full" />, category: 'Receipt', tone: 'emerald', label: 'Fee Receipt' },
  migration: { icon: <GraduationCap className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Migration' },
  marksheet: { icon: <FileBarChart className="h-full w-full" />, category: 'Report', tone: 'emerald', label: 'Marksheet' },
  // title-case aliases (Cert store's DocType union — 'Bonafide', 'ID Card', …)
  Bonafide: { icon: <ScrollText className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Bonafide' },
  Transfer: { icon: <FileOutput className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Transfer' },
  Character: { icon: <FileSignature className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Character' },
  'ID Card': { icon: <IdCard className="h-full w-full" />, category: 'Identity', tone: 'emerald', label: 'ID Card' },
  'Fee Receipt': { icon: <Receipt className="h-full w-full" />, category: 'Receipt', tone: 'emerald', label: 'Fee Receipt' },
  Migration: { icon: <GraduationCap className="h-full w-full" />, category: 'Certificate', tone: 'emerald', label: 'Migration' },
  Marksheet: { icon: <FileBarChart className="h-full w-full" />, category: 'Report', tone: 'emerald', label: 'Marksheet' },
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
  /** Show the format text label band at the bottom of the thumbnail.
   *  Default: true for PDF (strongest identity), false otherwise. */
  showFormatLabel?: boolean
  className?: string
}

// Paper-silhouette sizes (A4-ish aspect). Bumped from the previous pass so
// the glyph has room to breathe and the document reads as a real document,
// not a tiny chip. h-12 / h-16 / h-24 / h-32.
const THUMB_SIZES: Record<string, string> = {
  sm: 'h-12 w-9',      // receipt-ish — glyph h-5
  md: 'h-16 w-12',     // A4 small — glyph h-6
  lg: 'h-24 w-[4.75rem]', // A4 medium — glyph h-8 (cert selector)
  xl: 'h-32 w-24',     // A4 large — glyph h-10 (drawer placeholder)
}

// Glyph sizes inside the thumbnail — bumped from the previous pass so the
// document type is actually recognizable. h-5 for sm, h-6 for md, h-8 for lg,
// h-10 for xl.
const THUMB_ICON_SIZES: Record<string, string> = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
}

// Dog-ear fold corner size (px) — small right-triangle in the top-right
// corner of the paper so the silhouette reads as a real document, not a
// coloured box. Scales with the thumbnail size.
const THUMB_FOLD_SIZE: Record<string, number> = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
}

// Format-label band text size — only rendered for PDF (or when explicitly
// requested) to give the strongest format identity.
const THUMB_LABEL_TEXT: Record<string, string> = {
  sm: 'text-[7px]',
  md: 'text-[8px]',
  lg: 'text-[9px]',
  xl: 'text-[10px]',
}

export function DocumentThumbnail({
  format, docType, icon, size = 'md', tone, showFormatLabel, className,
}: DocumentThumbnailProps) {
  const meta = docType ? DOC_TYPE_META[docType] : undefined
  const resolvedTone = tone ?? meta?.tone ?? (format ? FORMAT_TONE[format] : 'emerald')
  const resolvedIcon = icon ?? meta?.icon ?? (format ? FORMAT_ICON[format] : <FileText className="h-full w-full" />)
  // Show the format label automatically for PDF (strongest identity) unless
  // the caller explicitly disabled it. For other formats, only show it if
  // the caller explicitly enabled it.
  const shouldShowLabel = showFormatLabel ?? (format === 'PDF')
  const ts = TONE_STYLES[resolvedTone]
  const fold = THUMB_FOLD_SIZE[size]

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-md border bg-card overflow-hidden',
        ts.border,
        THUMB_SIZES[size],
        className,
      )}
      aria-hidden
    >
      {/* Format edge stripe (left) — wider (w-1.5) for stronger format identity */}
      <div className={cn('absolute inset-y-0 left-0 w-1.5', ts.stripe)} />
      {/* Subtle tint background */}
      <div className={cn('absolute inset-0', ts.bg)} />
      {/* Document dog-ear fold corner (top-right shadow) — gives the
          silhouette a real-document feel, not just a coloured box. */}
      <div
        className="absolute top-0 right-0 bg-black/[0.08] dark:bg-black/[0.25]"
        style={{
          width: `${fold}px`,
          height: `${fold}px`,
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
        }}
      />
      {/* Icon — centered, raised slightly when there's a label band so the
          glyph and the format text don't crowd each other. */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          shouldShowLabel && format ? 'pb-2.5' : '',
          ts.text,
        )}
      >
        <div className={THUMB_ICON_SIZES[size]}>
          {resolvedIcon}
        </div>
      </div>
      {/* Format-label band (bottom) — PDF gets "PDF" text automatically;
          other formats only when explicitly requested. */}
      {shouldShowLabel && format && (
        <div className={cn('absolute bottom-0 inset-x-0 flex justify-center pb-0.5 pt-0.5', ts.text)}>
          <span className={cn('font-bold tracking-wide tabular-nums leading-none', THUMB_LABEL_TEXT[size])}>
            {format}
          </span>
        </div>
      )}
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

// Bumped glyph sizes for list rows so the document type is recognizable
// at a glance — h-4 for sm (table-row tight), h-5 for md (default), h-6 for lg.
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
  /** Thumbnail size — default 'md'. Use 'lg' for cert-type selector grids. */
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
        'hover:shadow-sm hover:-translate-y-0.5',
        selected
          ? cn('border-2', ts.border, 'ring-2', ts.border.replace(/^border-/, 'ring-'))
          : 'border-border hover:border-foreground/30',
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
      {/* Selected check — strong ring + check badge */}
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
