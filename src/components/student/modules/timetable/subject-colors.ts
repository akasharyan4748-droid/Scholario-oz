'use client'

/**
 * Student Timetable — deterministic subject colour system.
 *
 * Discipline: colour identifies SUBJECTS (never decoration). The same
 * subject always renders the same colour, everywhere, every render:
 *   - curated map for the school's known subjects (preserves the established
 *     Student visual identity — English emerald, Mathematics violet, …)
 *   - stable string-hash into the same palette for any subject a Principal
 *     adds later (Physics, Chemistry, …) — deterministic, never random.
 * Breaks and lunch are NOT subjects → neutral treatment (see PeriodCard).
 */

export interface SubjectColor {
  bg: string
  text: string
  gradient: string
  ring: string
  dot: string
}

const KNOWN: Record<string, SubjectColor> = {
  English: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-500/30', dot: 'bg-emerald-500' },
  Mathematics: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-400 to-purple-500', ring: 'ring-violet-500/30', dot: 'bg-violet-500' },
  Science: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-500/30', dot: 'bg-amber-500' },
  Hindi: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-400 to-pink-500', ring: 'ring-rose-500/30', dot: 'bg-rose-500' },
  'Art & Craft': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', gradient: 'from-fuchsia-400 to-pink-500', ring: 'ring-fuchsia-500/30', dot: 'bg-fuchsia-500' },
  Library: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-400 to-sky-500', ring: 'ring-cyan-500/30', dot: 'bg-cyan-500' },
  'Computer Science': { bg: 'bg-lime-500/10', text: 'text-lime-600 dark:text-lime-400', gradient: 'from-lime-400 to-green-500', ring: 'ring-lime-500/30', dot: 'bg-lime-500' },
  'Social Studies': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-400 to-red-500', ring: 'ring-orange-500/30', dot: 'bg-orange-500' },
  Music: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-400 to-fuchsia-500', ring: 'ring-purple-500/30', dot: 'bg-purple-500' },
  'Physical Education': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', gradient: 'from-sky-400 to-blue-500', ring: 'ring-sky-500/30', dot: 'bg-sky-500' },
  Physics: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-400 to-violet-500', ring: 'ring-indigo-500/30', dot: 'bg-indigo-500' },
  Chemistry: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-400 to-emerald-500', ring: 'ring-teal-500/30', dot: 'bg-teal-500' },
  Biology: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', gradient: 'from-green-400 to-teal-500', ring: 'ring-green-500/30', dot: 'bg-green-500' },
}

const PALETTE: SubjectColor[] = Object.values(KNOWN)

/** Stable string hash — same subject string → same palette index, forever. */
function hashIndex(subject: string): number {
  let h = 0
  const key = subject.toLowerCase().trim()
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0
  }
  return h % PALETTE.length
}

/** The colour identity for any subject (curated → deterministic fallback). */
export function subjectColor(subject: string): SubjectColor {
  return KNOWN[subject] ?? PALETTE[hashIndex(subject)]
}
