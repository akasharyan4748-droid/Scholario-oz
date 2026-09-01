'use client'

/**
 * fees-structures-shared — Shared primitives for the versioned Fee
 * Structure components (Phase 4-8).
 *
 * - VersionStatusPill: CURRENT (emerald) / SCHEDULED (amber) /
 *   DRAFT (slate) / ARCHIVED (muted)
 * - StructureStatusBadge: per-card badge for the card grid
 * - Other small helpers reused by detail + history + cards
 */

import { cn } from '@/lib/utils'
import type { FeeStructureStatus } from '@/lib/store/fee-store'

const STATUS_STYLES: Record<FeeStructureStatus, string> = {
  current: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
  scheduled: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20',
  draft: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/20',
  archived: 'bg-muted text-muted-foreground ring-border/40',
}

// SaaS-STAGE-1 lifecycle vocabulary — status labels follow the agreed
// flow: Draft → Save Draft → Ready for publish → Publish/Implement →
// Current (archived history stays read-only). The store's internal
// status unions are UNCHANGED ('current' | 'scheduled' | 'archived' |
// 'draft'); only the DISPLAY labels adopt the vocabulary.
const STATUS_LABEL: Record<FeeStructureStatus, string> = {
  current: 'Current',
  scheduled: 'Ready for publish',
  draft: 'Draft',
  archived: 'Archived',
}

const STATUS_DOT: Record<FeeStructureStatus, string> = {
  current: 'bg-emerald-500',
  scheduled: 'bg-amber-500',
  draft: 'bg-slate-500',
  archived: 'bg-muted-foreground/50',
}

export function VersionStatusPill({
  status,
  className,
  withDot = true,
}: {
  status: FeeStructureStatus
  className?: string
  withDot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ring-1 whitespace-nowrap',
        STATUS_STYLES[status],
        className,
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />}
      {STATUS_LABEL[status]}
    </span>
  )
}

// Compact version — for very small contexts (e.g. card grid footer).
export function VersionStatusDot({ status }: { status: FeeStructureStatus }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[9px] font-semibold', STATUS_STYLES[status].split(' ').filter((c) => c.startsWith('text-')).join(' '))}
      title={STATUS_LABEL[status]}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}

// Per-card status badge for the card grid — shows the current version's
// status. Most structures will be 'current' (emerald), but newly-created
// drafts will show 'draft' (slate) until published.
export function StructureStatusBadge({ status, version }: { status: FeeStructureStatus; version: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <VersionStatusPill status={status} />
      <span className="text-[9px] text-muted-foreground font-mono">v{version}</span>
    </div>
  )
}

// Re-export for convenience
export const STATUS_LABELS = STATUS_LABEL
export const STATUS_STYLE_MAP = STATUS_STYLES
