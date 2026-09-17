/**
 * timetable-utils — shared helpers for every Student timetable surface.
 *
 * The Student Timetable is a LIVE, READ-ONLY view of the school's canonical
 * master timetable (`principal/modules/timetable` zustand store — the exact
 * dataset the Principal edits and publishes). This module holds the shared
 * presentation logic so the Timetable page and the Dashboard "Today" preview
 * NEVER disagree:
 *
 *   - SUBJECT_COLORS: one color per subject, everywhere (recognition, not
 *     decoration — spec §6).
 *   - parseRangeMinutes: parses BOTH time shapes the codebase uses
 *     ('08:30 AM - 09:15 AM' canonical slots, '08:00–08:45' legacy mocks).
 *   - buildDayTimeline: merges the canonical PERIODS structure (incl. breaks)
 *     with a class's slots into one ordered timeline — breaks stay break
 *     rows, unassigned periods become honest 'free' rows.
 *   - configuredDays: only days the school actually scheduled (no empty
 *     Saturday tabs — spec §7).
 */

import {
  DAYS,
  PERIODS,
  type DayType,
  type TimetableSlot,
} from '@/components/principal/modules/timetable/data'

export type { DayType, TimetableSlot }
export { DAYS, PERIODS }

// ── Subject colors (single source of truth for Student surfaces) ───────

export interface SubjectColor {
  bg: string
  text: string
  gradient: string
  ring: string
}

export const SUBJECT_COLORS: Record<string, SubjectColor> = {
  English: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-500/30' },
  Mathematics: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-400 to-purple-500', ring: 'ring-violet-500/30' },
  Science: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-500/30' },
  Physics: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-400 to-cyan-500', ring: 'ring-teal-500/30' },
  Hindi: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-400 to-pink-500', ring: 'ring-rose-500/30' },
  'Art & Craft': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', gradient: 'from-fuchsia-400 to-pink-500', ring: 'ring-fuchsia-500/30' },
  Library: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-400 to-sky-500', ring: 'ring-cyan-500/30' },
  'Computer Science': { bg: 'bg-lime-500/10', text: 'text-lime-600 dark:text-lime-400', gradient: 'from-lime-400 to-green-500', ring: 'ring-lime-500/30' },
  'Social Studies': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-400 to-red-500', ring: 'ring-orange-500/30' },
  Music: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-400 to-fuchsia-500', ring: 'ring-purple-500/30' },
  'Physical Education': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', gradient: 'from-sky-400 to-blue-500', ring: 'ring-sky-500/30' },
}

const FALLBACK_COLOR: SubjectColor = SUBJECT_COLORS.English

export function subjectColor(subject: string): SubjectColor {
  return SUBJECT_COLORS[subject] ?? FALLBACK_COLOR
}

// ── Time parsing (canonical '08:30 AM - 09:15 AM' + legacy '08:00–08:45') ──

/** Parse a period range into comparable minutes-of-day. Returns null when
 * unparseable (callers treat as 'upcoming' — never crashes the view). */
export function parseRangeMinutes(time: string): [number, number] | null {
  if (!time) return null
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[–—-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return null
  const toMin = (h: string, min: string, mer?: string) => {
    let hour = Number(h)
    const merUpper = mer?.toUpperCase()
    if (merUpper === 'PM' && hour < 12) hour += 12
    if (merUpper === 'AM' && hour === 12) hour = 0
    return hour * 60 + Number(min)
  }
  return [toMin(m[1], m[2], m[3]), toMin(m[4], m[5], m[6])]
}

/** '08:30 AM' → '8:30 AM' (compact clock for time chips). */
export function compactClock(time: string): string {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return time
  const hour = Number(m[1])
  const shown = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${shown}:${m[2]}${m[3] ? ` ${m[3].toUpperCase()}` : ''}`
}

export type PeriodState = 'done' | 'current' | 'upcoming'

/** Live clock state: past periods 'done', active 'current', rest 'upcoming'. */
export function periodStateOf(range: [number, number] | null, now: Date): PeriodState {
  if (!range) return 'upcoming'
  const [start, end] = range
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin >= end) return 'done'
  if (nowMin >= start) return 'current'
  return 'upcoming'
}

// ── Canonical timeline building ─────────────────────────────────────────

export interface TimelinePeriodMeta {
  number: number
  name: string
  time: string
  isBreak: boolean
  breakType?: 'short' | 'lunch'
  durationMin: number
}

export interface DayTimelineEntry {
  key: string
  kind: 'teaching' | 'break' | 'free'
  period: TimelinePeriodMeta
  slot?: TimetableSlot
}

/** Build one ordered day timeline: canonical PERIODS rows + this class's
 * published slots. Breaks render as neutral rows; teaching periods with no
 * slot become honest 'free' rows (spec §29 — never a blank hole). */
export function buildDayTimeline(
  publishedSlots: TimetableSlot[],
  day: string,
  classKey: string,
): DayTimelineEntry[] {
  return PERIODS.map((p) => {
    const meta: TimelinePeriodMeta = {
      number: p.number,
      name: p.name,
      time: p.time,
      isBreak: Boolean(p.isBreak),
      breakType: p.breakType as 'short' | 'lunch' | undefined,
      durationMin: p.durationMin,
    }
    if (meta.isBreak) {
      return { key: `${day}-p${p.number}-break`, kind: 'break' as const, period: meta }
    }
    const slot = publishedSlots.find(
      (s) => s.day === day && s.period === p.number && s.className === classKey,
    )
    return {
      key: slot ? `${day}-${slot.id}` : `${day}-p${p.number}-free`,
      kind: slot ? ('teaching' as const) : ('free' as const),
      period: meta,
      slot,
    }
  })
}

/** Days the school actually scheduled for a class (or school-wide when no
 * classKey given) — in canonical Mon→Sat order. No empty day tabs (§7). */
export function configuredDays(slots: TimetableSlot[], classKey?: string): DayType[] {
  const scoped = classKey ? slots.filter((s) => s.className === classKey) : slots
  return DAYS.filter((d) => scoped.some((s) => s.day === d))
}

/** Next scheduled school day after `dayName` (cyclic over configured days).
 * Used by the weekend/holiday empty state (§16). */
export function nextSchoolDayFrom(dayName: string, configured: DayType[]): DayType | null {
  if (configured.length === 0) return null
  const todayIdx = DAYS.indexOf(dayName as DayType)
  if (todayIdx === -1) return configured[0]
  for (let step = 1; step <= DAYS.length; step++) {
    const candidate = DAYS[(todayIdx + step) % DAYS.length]
    if (configured.includes(candidate)) return candidate
  }
  return null
}

/** Roster record → canonical timetable class key ('Class 2' + 'A' → 'Class 2-A'). */
export function classKeyOf(student: { className: string; section: string }): string {
  return `${student.className}-${student.section}`
}
