'use client'

/**
 * shared.tsx — the Achievements module's visual vocabulary: category
 * identity, source/scope chips, empty states, compact buttons.
 *
 * Accent discipline (REFINE-1): ~70% neutral surfaces, colour only for
 * identity (category tiles) and semantics. Self-reported records get a
 * deliberately NEUTRAL/outline treatment everywhere so they never read
 * as official awards.
 */

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  GraduationCap,
  Medal,
  Palette,
  Flag,
  Users,
  Lightbulb,
  BadgeCheck,
  UserRound,
} from 'lucide-react'
import type { GrowthAchievement, GrowthCategory, GrowthScope, GrowthSource } from '@/lib/store/student-growth-store'

// ─── Category identity (icon + soft tint — restrained, no glows) ──

export interface CategoryMeta {
  label: string
  icon: LucideIcon
  /** Soft icon-tile treatment. */
  tile: string
  /** Small chip treatment. */
  chip: string
  /** Solid timeline-rail dot. */
  dot: string
  /** Standalone icon colour (timeline rows, lists). */
  text: string
}

export const CATEGORY_META: Record<GrowthCategory, CategoryMeta> = {
  academic: {
    label: 'Academic',
    icon: GraduationCap,
    tile: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    chip: 'border-violet-500/25 bg-violet-500/[0.07] text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
  },
  sports: {
    label: 'Sports',
    icon: Medal,
    tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    chip: 'border-sky-500/25 bg-sky-500/[0.07] text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
  },
  arts: {
    label: 'Arts',
    icon: Palette,
    tile: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    chip: 'border-fuchsia-500/25 bg-fuchsia-500/[0.07] text-fuchsia-700 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-500',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  leadership: {
    label: 'Leadership',
    icon: Flag,
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    chip: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  participation: {
    label: 'Participation',
    icon: Users,
    tile: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    chip: 'border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  learning: {
    label: 'Learning',
    icon: Lightbulb,
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    chip: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
}

/** Icon tile for an achievement's category. */
export function CategoryTile({ category, className }: { category: GrowthCategory; className?: string }) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  return (
    <span
      className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', meta.tile, className)}
      aria-hidden
    >
      <Icon className="h-5 w-5" />
    </span>
  )
}

export function CategoryChip({ category }: { category: GrowthCategory }) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {meta.label}
    </span>
  )
}

// ─── Scope & source ───────────────────────────────────────────────

const SCOPE_LABEL: Record<GrowthScope, string> = {
  class: 'Class',
  school: 'School',
  'inter-school': 'Inter-school',
}

export function ScopeChip({ scope }: { scope: GrowthScope }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {SCOPE_LABEL[scope]}
    </span>
  )
}

/** The awarded-by line — self records are visually distinct by design. */
export function awardedByLabel(a: GrowthAchievement): string {
  switch (a.source) {
    case 'school':
      return 'Awarded by School'
    case 'teacher':
      return `Awarded by ${a.awardedByName}`
    case 'system':
      return 'School record'
    case 'self':
      return 'Added by you'
  }
}

/** The "you added this" tag — ALWAYS neutral/outline, never official. */
export function SelfTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <UserRound className="h-3 w-3 shrink-0" aria-hidden />
      You added this
    </span>
  )
}

/** Filled accent chip for earned facts in the overview strip. */
export function FactChip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      {children}
    </span>
  )
}

/** Small "in portfolio" mark (used on cards that mirror into the portfolio). */
export function InPortfolioMark() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      In portfolio
    </span>
  )
}

// ─── Empty states (short copy — the Learning OS honesty rule) ─────

export function GrowthEmptyState({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {note && <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">{note}</p>}
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
