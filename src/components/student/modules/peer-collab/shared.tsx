'use client'

/**
 * peer-collab/shared — the Study Groups tab's local primitives
 * (replaces the old mock-typed data.tsx).
 *
 * Contains: the section chips config, the initials-circle member
 * avatars, the shared compact button classes (44px touch targets on
 * mobile, denser from sm up — same contract as the Learning Hub's
 * type-meta buttons), the reported-content chip (§40), and the small
 * form field primitives shared by the three dialogs.
 *
 * Accent semantics (REFINE-1, module-mapped):
 *   emerald = joined / active · sky = Q&A / info ·
 *   amber = report / attention · violet = identity (sparing).
 */

import { MessagesSquare, Share2, Users, type LucideIcon } from 'lucide-react'
import { avatarGradient } from '@/lib/format'
import { cn } from '@/lib/utils'
import { displayOf } from '@/lib/store/student-groups-store'

export type PeerTab = 'groups' | 'qa' | 'shares'

export const PEER_TABS: Array<{ key: PeerTab; label: string; icon: LucideIcon }> = [
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'qa', label: 'Q&A', icon: MessagesSquare },
  { key: 'shares', label: 'Shared', icon: Share2 },
]

/* ── Shared compact action buttons (mobile 44px touch target) ────── */

/** SKY — Q&A forum actions (ask / answer). */
export const BTN_SKY =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 sm:h-9'

/** EMERALD — join / membership actions. */
export const BTN_EMERALD =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:h-9'

/** PRIMARY (app green) — create / share confirmations. */
export const BTN_PRIMARY =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:h-9'

export const BTN_OUTLINE =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/50 px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9'

/** Small quiet ghost button (report / leave affordances). */
export const BTN_GHOST =
  'inline-flex h-11 items-center justify-center gap-1 rounded-lg px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9'

/* ── Reported content chip (spec §40) ────────────────────────────── */

/** The honest post-report state: persisted flag + teacher review note.
 *  Students NEVER delete each other's content — reporting is the only lever. */
export function ReportedChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400',
        className,
      )}
    >
      <span aria-hidden>✓</span>
      Reported — your class teacher will review
    </span>
  )
}

/* ── Member avatars (initials circles) ───────────────────────────── */

/** One initials circle — deterministic gradient per name (avatarGradient). */
export function InitialCircle({ name, className, ring = false }: { name: string; className?: string; ring?: boolean }) {
  const initialsOf = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
        avatarGradient(name),
        'h-7 w-7 text-[9px]',
        ring && 'ring-2 ring-white',
        className,
      )}
    >
      {initialsOf}
    </span>
  )
}

/** Overlapping member stack — max 5 circles, then "+N". Names are exposed
 *  to screen readers as text (never colour/initials alone, §59). */
export function MemberStack({ names, max = 5 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {shown.map((n) => (
          <InitialCircle key={n} name={n} ring />
        ))}
        {rest > 0 && (
          <span
            aria-hidden
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-white"
          >
            +{rest}
          </span>
        )}
      </div>
      <span className="sr-only">{`Members: ${names.map(displayOf).join(', ')}`}</span>
    </div>
  )
}

/* ── Dialog form primitives (shared by the three dialogs) ────────── */

export const FIELD_CLASSES =
  'w-full rounded-xl border border-border bg-card/50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10'

export function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-foreground">
      {children}
      {required && (
        <span className="ml-0.5 text-rose-500" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}
