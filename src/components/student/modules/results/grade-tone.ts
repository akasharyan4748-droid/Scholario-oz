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
 *
 * HERO presentation (final refinement): the hero renders the grade as an
 * ACADEMIC badge in violet — "academic performance / learning" is violet
 * in the workspace colour philosophy — while the percentage beside it
 * carries the emerald and the rank carries the amber. Attention grades
 * (C/D/E) keep their semantic warning tones even in the hero, so a
 * struggling result can never read as calm achievement.
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

/** Grades presented as confident academic achievement (hero context). */
const ACADEMIC_GRADES = new Set(['A+', 'A', 'B'])

/** The HERO's academic badge — violet for achievement grades, semantic for attention grades. */
export const HERO_GRADE_BADGE =
  'border-violet-500/25 bg-violet-500/[0.09] text-violet-700 dark:text-violet-400'

/** The hero badge class for a grade — violet academic, or semantic when attention is the message. */
export function heroGradeBadge(grade: string): string {
  return ACADEMIC_GRADES.has(grade) ? HERO_GRADE_BADGE : (TONES[grade] ?? FALLBACK).badge
}
