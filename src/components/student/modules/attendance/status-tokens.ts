/**
 * attendance/status-tokens — THE single status vocabulary for the Student
 * Attendance module (brief §12 + §38).
 *
 * Every surface (snapshot, calendar, day detail, record list, trend
 * insight, aria labels) renders status through THESE tokens, so the same
 * record can never appear as different words or colors in two places.
 *
 * Accessibility (§36): status is NEVER colour alone — each token carries
 * a text label (chip/aria), a dot, and (where it aids comprehension) an
 * icon for the detail panel.
 */

import {
  CheckCircle2, Clock, XCircle, Plane, PartyPopper, Sun, CircleDashed,
  CalendarClock, type LucideIcon,
} from 'lucide-react'
import type { AttendanceStatus, StudentAttendanceRecord } from '@/lib/store/student-attendance-store'

/** Everything a calendar day can be. Record statuses come first. */
export type DayKind = AttendanceStatus | 'holiday' | 'weekend' | 'future' | 'norecord'

export interface StatusToken {
  /** Canonical UI label — used verbatim everywhere. */
  label: string
  /** Full sentence for aria-labels / screen readers. */
  aria: string
  /** Small status dot (calendar cells, stat rows). */
  dot: string
  /** Calendar cell treatment — soft tint, never a solid block (§10). */
  cell: string
  /** Compact chip (lists, detail panel). */
  chip: string
  /** Icon shown in the day-detail panel only — meaning, not decoration (§37). */
  icon: LucideIcon
}

const TOKENS: Record<DayKind, StatusToken> = {
  present: {
    label: 'Present',
    aria: 'Present',
    dot: 'bg-emerald-500',
    cell: 'bg-emerald-500/[0.12] text-emerald-800',
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    icon: CheckCircle2,
  },
  late: {
    label: 'Late',
    aria: 'Late arrival',
    dot: 'bg-amber-500',
    cell: 'bg-amber-500/[0.14] text-amber-800',
    chip: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
    icon: Clock,
  },
  absent: {
    label: 'Absent',
    aria: 'Absent',
    dot: 'bg-rose-500',
    cell: 'bg-rose-500/[0.10] text-rose-800',
    chip: 'border-rose-500/30 bg-rose-500/10 text-rose-700',
    icon: XCircle,
  },
  leave: {
    label: 'Approved Leave',
    aria: 'Approved leave',
    dot: 'bg-cyan-600',
    cell: 'bg-cyan-600/[0.12] text-cyan-800',
    chip: 'border-cyan-600/30 bg-cyan-600/10 text-cyan-700',
    icon: Plane,
  },
  holiday: {
    label: 'Holiday',
    aria: 'School holiday',
    dot: 'bg-violet-500/70',
    cell: 'bg-violet-500/[0.09] text-violet-800',
    chip: 'border-violet-500/30 bg-violet-500/10 text-violet-700',
    icon: PartyPopper,
  },
  weekend: {
    label: 'Weekend',
    aria: 'Weekend — no school',
    dot: 'bg-muted-foreground/30',
    cell: 'bg-muted/40 text-muted-foreground/60',
    chip: 'border-border bg-muted/50 text-muted-foreground',
    icon: Sun,
  },
  norecord: {
    label: 'No Record',
    aria: 'No attendance recorded',
    dot: 'bg-muted-foreground/40',
    cell: 'bg-card text-muted-foreground border border-border',
    chip: 'border-border bg-muted/40 text-muted-foreground',
    icon: CircleDashed,
  },
  future: {
    label: 'Upcoming',
    aria: 'School day — not yet recorded',
    dot: 'bg-muted-foreground/25',
    cell: 'bg-transparent text-muted-foreground/60 border border-dashed border-border/70',
    chip: 'border-border bg-transparent text-muted-foreground/70',
    icon: CalendarClock,
  },
}

export function statusToken(kind: DayKind): StatusToken {
  return TOKENS[kind]
}

/** The four countable record statuses, in display order (§5, §16). */
export const COUNTED_STATUSES: { kind: AttendanceStatus; label: string; dot: string; text: string }[] = [
  { kind: 'present', label: 'Present', dot: TOKENS.present.dot, text: 'text-emerald-600' },
  { kind: 'late', label: 'Late', dot: TOKENS.late.dot, text: 'text-amber-600' },
  { kind: 'absent', label: 'Absent', dot: TOKENS.absent.dot, text: 'text-rose-600' },
  { kind: 'leave', label: 'Approved Leave', dot: TOKENS.leave.dot, text: 'text-cyan-700' },
]

/** Day-cell resolution — record first, then calendar context, then time. */
export interface DayCell {
  key: string
  day: number | null
  iso: string
  kind: DayKind
  holidayName?: string
  record?: StudentAttendanceRecord
}
