/**
 * Date formatting helpers for Examination.
 *
 * Spec §3 / §20 — schedule date labels must be consistent and avoid
 * timezone off-by-one errors. All parsing is LOCAL (not UTC).
 */

/** Parse YYYY-MM-DD as a local date (NOT UTC). */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Format a YYYY-MM-DD date as "19 Aug 2026" (local, no timezone shift). */
export function formatDateLong(dateStr: string): string {
  if (!dateStr) return ''
  const d = parseLocalDate(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Format a YYYY-MM-DD date as "19 Aug" (compact). */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = parseLocalDate(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
