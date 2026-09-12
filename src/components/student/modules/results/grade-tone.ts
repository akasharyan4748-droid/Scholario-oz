/**
 * results/grade-tone — the academic colour system for GRADES (§13).
 *
 * Colour communicates academic meaning, never decoration:
 *   Excellent (A+) → green/teal · Strong (A) → blue · Good (B) → violet
 *   Attention (C) → amber · Low (D/E) → soft rose
 *
 * Tints stay SOFT (progress bars, badges, small accents) — a grade never
 * washes an entire card. Shared by the hero, subject rows and history so
 * the same grade can never render two different colours (§30 status
 * badge system). Dark variants included because these badges also render
 * on page-level (non-card) surfaces.
 */

export interface GradeTone {
  /** Badge surface. */
  badge: string
  /** Text colour (accent context). */
  text: string
  /** Thin progress-bar fill (soft, controlled). */
  bar: string
}

const TONES: Record<string, GradeTone> = {
  'A+': {
    badge: 'border-emerald-500/25 bg-emerald-500/[0.09] text-emerald-700 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  A: {
    badge: 'border-sky-500/25 bg-sky-500/[0.09] text-sky-700 dark:text-sky-400',
    text: 'text-sky-600 dark:text-sky-400',
    bar: 'bg-sky-500',
  },
  B: {
    badge: 'border-violet-500/25 bg-violet-500/[0.09] text-violet-700 dark:text-violet-400',
    text: 'text-violet-600 dark:text-violet-400',
    bar: 'bg-violet-500',
  },
  C: {
    badge: 'border-amber-500/30 bg-amber-500/[0.10] text-amber-700 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  D: {
    badge: 'border-rose-500/25 bg-rose-500/[0.09] text-rose-700 dark:text-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
}

const FALLBACK: GradeTone = TONES.D

/** The tone for any grade string ("A+", "A", "B"… unknown → soft rose). */
export function gradeTone(grade: string): GradeTone {
  return TONES[grade] ?? FALLBACK
}
