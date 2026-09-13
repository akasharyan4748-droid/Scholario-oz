'use client'

/**
 * shared.tsx — the Career Explorer module's visual vocabulary: field
 * identity (the eight interest areas), subject/skill chips, the footer
 * policy line, compact buttons.
 *
 * AGE-AWARE (the demo student is in Class 2 — a primary school class):
 * vocabulary stays about INTERESTS, CURIOSITY and AWARENESS. Accent
 * discipline follows the Achievements/Portfolio convention — ~70%
 * neutral surfaces, muted field tints, violet reserved for the
 * module's exploration furniture (view chips, primary actions).
 */

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Cpu, FlaskConical, PencilRuler, Store, Stethoscope, Palette, Trophy, Landmark, Info } from 'lucide-react'
import type { CareerField } from '@/lib/store/student-career-store'
import { subjectColor } from '@/components/student/modules/timetable/subject-colors'

// ─── Field identity (icon + soft tint — restrained, no glows) ─────

export interface FieldMeta {
  label: string
  icon: LucideIcon
  /** Soft icon-tile treatment. */
  tile: string
  /** Small chip treatment. */
  chip: string
  /** Solid dot. */
  dot: string
}

export const FIELD_META: Record<CareerField, FieldMeta> = {
  technology: {
    label: 'Technology',
    icon: Cpu,
    tile: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    chip: 'border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  science: {
    label: 'Science',
    icon: FlaskConical,
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    chip: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  design: {
    label: 'Design',
    icon: PencilRuler,
    tile: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    chip: 'border-fuchsia-500/25 bg-fuchsia-500/[0.07] text-fuchsia-700 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-500',
  },
  business: {
    label: 'Business',
    icon: Store,
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    chip: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  healthcare: {
    label: 'Healthcare',
    icon: Stethoscope,
    tile: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    chip: 'border-teal-500/25 bg-teal-500/[0.07] text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  arts: {
    label: 'Arts',
    icon: Palette,
    tile: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    chip: 'border-rose-500/25 bg-rose-500/[0.07] text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  sports: {
    label: 'Sports',
    icon: Trophy,
    tile: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    chip: 'border-orange-500/25 bg-orange-500/[0.07] text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  'public-service': {
    label: 'Public Service',
    icon: Landmark,
    tile: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    chip: 'border-violet-500/25 bg-violet-500/[0.07] text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
}

/** Icon tile for a career's field. */
export function FieldTile({ field, className }: { field: CareerField; className?: string }) {
  const meta = FIELD_META[field]
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

export function FieldChip({ field }: { field: CareerField }) {
  const meta = FIELD_META[field]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}

// ─── Subject & skill chips ────────────────────────────────────────

/** Subject chip — the SAME subject→colour identity the whole workspace uses. */
export function SubjectChip({ subject }: { subject: string }) {
  const c = subjectColor(subject)
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} aria-hidden />
      {subject}
    </span>
  )
}

export function SkillChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  )
}

// ─── The age-honest footer policy line ────────────────────────────

export function FooterPolicyLine() {
  return (
    <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-muted-foreground/70">
      <Info className="h-3 w-3 shrink-0" aria-hidden />
      Exploring ideas for the future — not choosing a career.
    </p>
  )
}

// ─── Empty states (short copy — the Learning OS honesty rule) ─────

export function CareerEmptyState({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note?: string }) {
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

export const BTN_VIOLET =
  'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto'

export const BTN_OUTLINE =
  'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto'

export const BTN_SOFT =
  'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.06] px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto'

export const INPUT_CLASSES =
  'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9'

export const TEXTAREA_CLASSES =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
