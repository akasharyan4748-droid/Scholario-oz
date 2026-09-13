'use client'

/**
 * shared.tsx — the Portfolio module's visual vocabulary: kind identity,
 * visibility / origin / subject chips, the featured mark, empty states and
 * compact buttons.
 *
 * Accent discipline (REFINE-1 + the PROGRESS conventions): ~70% neutral
 * surfaces; emerald = finished work, amber = recognition (achievement /
 * certificate kinds + the featured star), sky = communication /
 * information, fuchsia = creative work, violet = the module's showcase
 * identity (featured furniture only). Self-origin items always carry the
 * neutral dashed "Added by you" treatment so student-curated content is
 * never mistaken for official school records (spec §12/§55).
 */

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  Lightbulb,
  FileBadge,
  Trophy,
  Users,
  Palette,
  Presentation,
  Lock,
  School,
  Star,
  UserRound,
  Link2,
  FolderOpen,
} from 'lucide-react'
import type { PortfolioItem, PortfolioKind, PortfolioVisibility } from '@/lib/store/student-growth-store'
import { subjectColor } from '../timetable/subject-colors'

// ─── Kind identity (icon + soft tint — restrained, no glows) ──────

export interface KindMeta {
  /** Singular label ("Project"). */
  label: string
  /** Plural label for filter chips ("Projects"). */
  plural: string
  icon: LucideIcon
  /** Small chip treatment. */
  chip: string
  /** Icon-tile treatment (used when the item has no subject accent). */
  tile: string
  /** Timeline / list dot. */
  dot: string
}

export const KIND_META: Record<PortfolioKind, KindMeta> = {
  project: {
    label: 'Project',
    plural: 'Projects',
    icon: Lightbulb,
    chip: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300',
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  certificate: {
    label: 'Certificate',
    plural: 'Certificates',
    icon: FileBadge,
    chip: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300',
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  achievement: {
    label: 'Achievement',
    plural: 'Achievements',
    icon: Trophy,
    chip: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300',
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  activity: {
    label: 'Activity',
    plural: 'Activities',
    icon: Users,
    chip: 'border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-700 dark:text-cyan-300',
    tile: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    dot: 'bg-cyan-500',
  },
  artwork: {
    label: 'Artwork',
    plural: 'Artwork',
    icon: Palette,
    chip: 'border-fuchsia-500/25 bg-fuchsia-500/[0.07] text-fuchsia-700 dark:text-fuchsia-300',
    tile: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    dot: 'bg-fuchsia-500',
  },
  presentation: {
    label: 'Presentation',
    plural: 'Presentations',
    icon: Presentation,
    chip: 'border-sky-500/25 bg-sky-500/[0.07] text-sky-700 dark:text-sky-300',
    tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
}

/** Canonical display order for kind filters / grouping. */
export const KIND_ORDER: PortfolioKind[] = [
  'project',
  'certificate',
  'achievement',
  'activity',
  'artwork',
  'presentation',
]

export function KindChip({ kind }: { kind: PortfolioKind }) {
  const meta = KIND_META[kind]
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {meta.label}
    </span>
  )
}

/**
 * Kind glyph on the SUBJECT's accent (subjectColor) — the portfolio's
 * "kind + subject" identity in one tile. Neutral kind tint when the item
 * has no subject.
 */
export function KindTile({ kind, subject, className }: { kind: PortfolioKind; subject?: string; className?: string }) {
  const meta = KIND_META[kind]
  const Icon = meta.icon
  const tone = subject
    ? cn(subjectColor(subject).bg, subjectColor(subject).text)
    : meta.tile
  return (
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tone, className)} aria-hidden>
      <Icon className="h-5 w-5" />
    </span>
  )
}

// ─── Visibility (school-controlled audience — never a public option) ─

const VISIBILITY_META: Record<PortfolioVisibility, { label: string; icon: LucideIcon; chip: string }> = {
  private: {
    label: 'Private',
    icon: Lock,
    chip: 'border-border bg-muted/40 text-muted-foreground',
  },
  class: {
    label: 'Class',
    icon: Users,
    chip: 'border-sky-500/25 bg-sky-500/[0.07] text-sky-700 dark:text-sky-300',
  },
  school: {
    label: 'School',
    icon: School,
    chip: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300',
  },
}

export function visibilityLabel(v: PortfolioVisibility): string {
  return VISIBILITY_META[v].label
}

export function VisibilityChip({ visibility }: { visibility: PortfolioVisibility }) {
  const meta = VISIBILITY_META[visibility]
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {meta.label}
    </span>
  )
}

// ─── Featured (amber recognition — max 2, enforced by the store) ───

export function FeaturedMark() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
      <Star className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" aria-hidden />
      Featured
    </span>
  )
}

// ─── Origin — self-curated NEVER looks official (§12/§55) ─────────

export function OriginChip({ origin }: { origin: PortfolioItem['origin'] }) {
  if (origin === 'self') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <UserRound className="h-3 w-3 shrink-0" aria-hidden />
        Added by you
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Link2 className="h-3 w-3 shrink-0" aria-hidden />
      From your achievements
    </span>
  )
}

// ─── Subject + skill chips ─────────────────────────────────────────

export function SubjectChip({ subject }: { subject: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', subjectColor(subject).dot)} aria-hidden />
      {subject}
    </span>
  )
}

export function SkillChip({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {skill}
    </span>
  )
}

// ─── Empty state (short copy — spec §46) ───────────────────────────

export function PortfolioEmptyState({
  title,
  note,
  action,
}: {
  title: string
  note?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60">
        <FolderOpen className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {note && <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">{note}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Compact buttons (44px touch targets on mobile, denser on sm+) ─

export const BTN_PRIMARY =
  'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto'

export const BTN_OUTLINE =
  'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto'

export const BTN_SOFT =
  'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.06] px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto'

export const INPUT_CLASSES =
  'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9'

export const TEXTAREA_CLASSES =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
