'use client'

/**
 * fee-status — the Fees module's financial status token system.
 *
 * COLOUR PHILOSOPHY (Fees brief §3/§37 — semantic, never decorative):
 *   EMERALD   → paid · successful · cleared · all clear
 *   VIOLET    → financial information · statement · ledger insights
 *   AMBER     → due soon · outstanding · attention · under verification
 *   ROSE      → overdue · failed · disputed · action required
 *   CYAN      → receipts · informational · support
 *   NEUTRAL   → normal content · upcoming · background
 *
 * ACCESSIBILITY (§31): financial status is NEVER communicated by colour
 * alone — every token pairs its colour with an icon and a label.
 */

import {
  BadgeCheck, AlertTriangle, Clock, CircleDollarSign, PauseCircle,
  FileCheck2, ReceiptText, Hourglass, XCircle, RotateCcw,
  type LucideIcon,
} from 'lucide-react'
import type { FeePaymentStatus, FeeTransaction, StudentChargeRow } from '@/lib/store/fee-store'
import type { FeeIssueStatus } from '@/lib/store/student-fee-issues-store'

// ─── Account-level financial status (§5) ─────────────────────────────

export interface FeeStatusToken {
  label: string
  icon: LucideIcon
  /** Small chip surface (border + tint + text). */
  chip: string
  /** 8px status dot fill. */
  dot: string
  /** Hero banner surface (soft tint + border). */
  banner: string
}

const ACCOUNT_TOKENS: Record<FeePaymentStatus, FeeStatusToken> = {
  Paid: {
    label: 'All Clear',
    icon: BadgeCheck,
    chip: 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    banner: 'border-emerald-500/25 bg-emerald-500/[0.05]',
  },
  'Partially Paid': {
    label: 'Partially Paid',
    icon: CircleDollarSign,
    chip: 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    banner: 'border-amber-500/25 bg-amber-500/[0.05]',
  },
  Due: {
    label: 'Payment Due',
    icon: Clock,
    chip: 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    banner: 'border-amber-500/25 bg-amber-500/[0.05]',
  },
  Overdue: {
    label: 'Overdue',
    icon: AlertTriangle,
    chip: 'border-rose-500/30 bg-rose-500/[0.08] text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    banner: 'border-rose-500/25 bg-rose-500/[0.05]',
  },
  'On Hold': {
    label: 'On Hold',
    icon: PauseCircle,
    chip: 'border-border bg-muted/50 text-muted-foreground',
    dot: 'bg-muted-foreground/50',
    banner: 'border-border bg-muted/30',
  },
}

export function feeStatusToken(status: FeePaymentStatus): FeeStatusToken {
  return ACCOUNT_TOKENS[status] ?? ACCOUNT_TOKENS['On Hold']
}

// ─── Transaction payment states (§10 — every realistic state) ────────

export interface PaymentStateToken {
  label: string
  icon: LucideIcon
  chip: string
  dot: string
}

const PAYMENT_TOKENS: Record<FeeTransaction['status'], PaymentStateToken> = {
  Success: {
    label: 'Paid',
    icon: BadgeCheck,
    chip: 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  'Under Verification': {
    label: 'Under Verification',
    icon: Hourglass,
    chip: 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  Pending: {
    label: 'Processing',
    icon: Hourglass,
    chip: 'border-sky-500/30 bg-sky-500/[0.08] text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  Failed: {
    label: 'Failed',
    icon: XCircle,
    chip: 'border-rose-500/30 bg-rose-500/[0.08] text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  Refunded: {
    label: 'Refunded',
    icon: RotateCcw,
    chip: 'border-violet-500/30 bg-violet-500/[0.08] text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
}

export function paymentStateToken(status: FeeTransaction['status']): PaymentStateToken {
  return PAYMENT_TOKENS[status] ?? PAYMENT_TOKENS.Pending
}

/** Receipt lifecycle label — official receipt vs pending acknowledgement. */
export function receiptAvailability(t: FeeTransaction): { label: string; official: boolean } {
  if (t.status === 'Success') return { label: 'Official receipt', official: true }
  if (t.status === 'Refunded') return { label: 'Receipt', official: true }
  return { label: 'Acknowledgement — pending verification', official: false }
}

// ─── Fee query / dispute states (§21) ────────────────────────────────

export interface IssueStateToken {
  label: string
  chip: string
  dot: string
}

const ISSUE_TOKENS: Record<FeeIssueStatus, IssueStateToken> = {
  Open: { label: 'Open', chip: 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  Assigned: { label: 'Assigned', chip: 'border-sky-500/30 bg-sky-500/[0.08] text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
  'Under Review': { label: 'Under Review', chip: 'border-violet-500/30 bg-violet-500/[0.08] text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'Waiting for Information': { label: 'Waiting for your information', chip: 'border-cyan-500/30 bg-cyan-500/[0.08] text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
  Resolved: { label: 'Resolved', chip: 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Closed: { label: 'Closed', chip: 'border-border bg-muted/50 text-muted-foreground', dot: 'bg-muted-foreground/40' },
}

export function issueStatusToken(status: FeeIssueStatus): IssueStateToken {
  return ISSUE_TOKENS[status] ?? ISSUE_TOKENS.Open
}

// ─── Schedule row states (§8 — the payment schedule) ─────────────────

export type ScheduleRowState = 'settled' | 'partial' | 'overdue' | 'due' | 'upcoming'

export interface ScheduleStateToken {
  label: string
  icon: LucideIcon
  /** Left status rail on the row. */
  rail: string
  /** Soft cell/row tint. */
  tint: string
  text: string
}

const SCHEDULE_TOKENS: Record<ScheduleRowState, ScheduleStateToken> = {
  settled: { label: 'Paid', icon: BadgeCheck, rail: 'bg-emerald-500', tint: 'bg-emerald-500/[0.05]', text: 'text-emerald-700 dark:text-emerald-400' },
  partial: { label: 'Partly paid', icon: CircleDollarSign, rail: 'bg-amber-500', tint: 'bg-amber-500/[0.05]', text: 'text-amber-700 dark:text-amber-400' },
  overdue: { label: 'Overdue', icon: AlertTriangle, rail: 'bg-rose-500', tint: 'bg-rose-500/[0.06]', text: 'text-rose-700 dark:text-rose-400' },
  due: { label: 'Due', icon: Clock, rail: 'bg-foreground/25', tint: 'bg-muted/40', text: 'text-muted-foreground' },
  upcoming: { label: 'Upcoming', icon: FileCheck2, rail: 'bg-foreground/10', tint: 'bg-transparent', text: 'text-muted-foreground' },
}

export function scheduleStateToken(state: ScheduleRowState): ScheduleStateToken {
  return SCHEDULE_TOKENS[state]
}

/**
 * The honest state of one scheduled instalment, from the SAME allocation
 * the account derives (never a frontend-only guess):
 *   settled   — fully covered by countable money
 *   overdue   — partly unpaid beyond due + grace
 *   partial   — partly unpaid, still inside the grace window
 *   due       — the current billing period (due day passed, grace running)
 *   upcoming  — due date in the future
 */
export function scheduleRowState(
  row: Pick<StudentChargeRow, 'date' | 'remaining'>,
  today: string,
  graceDays: number,
): ScheduleRowState {
  if (row.remaining <= 0) return 'settled'
  const dueMs = new Date(`${row.date}T00:00:00`).getTime()
  const todayMs = new Date(`${today}T00:00:00`).getTime()
  if (todayMs < dueMs) return 'upcoming'
  if (todayMs > dueMs + graceDays * 86_400_000) return 'overdue'
  return row.date === today ? 'due' : todayMs === dueMs ? 'due' : 'partial'
}

// ─── Month bucketing (Apr→Mar financial-year rhythm) ─────────────────

export interface ScheduleMonth {
  /** FY month key 'YYYY-MM'. */
  key: string
  /** Display label — 'Apr', 'May', … 'Mar'. */
  label: string
  /** Rows in this month (chronological). */
  rows: StudentChargeRow[]
  /** Sum of charge amounts. */
  amount: number
  /** Sum of remaining amounts. */
  remaining: number
  /** Earliest due date in the month. */
  dueDate: string
  /** Dominant state for the month cell. */
  state: ScheduleRowState
}

const FY_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Group the per-period charges into FY month buckets (Apr→Mar), deriving
 * each month's dominant state — the honest "instalment schedule" the
 * school actually configured (monthly tuition/transport + per-exam fees),
 * never an invented TERM 1/2/3 fiction.
 */
export function bucketByMonth(rows: StudentChargeRow[], today: string, graceDays: number): ScheduleMonth[] {
  const byKey = new Map<string, { rows: StudentChargeRow[]; dueDate: string }>()
  for (const row of rows) {
    const key = row.date.slice(0, 7)
    const bucket = byKey.get(key)
    if (bucket) {
      bucket.rows.push(row)
      if (row.date < bucket.dueDate) bucket.dueDate = row.date
    } else {
      byKey.set(key, { rows: [row], dueDate: row.date })
    }
  }
  const startYear = Number(rows[0]?.date.slice(0, 4) ?? new Date().getFullYear())
  const order: string[] = []
  // FY order Apr→Mar (12 months): month index m runs 3..17 so Jan–Mar of
  // the FOLLOWING year resolve to their correct keys (2027-01…).
  for (let m = 3; m < 18; m++) {
    const y = startYear + Math.floor((m - 3) / 12)
    order.push(`${y}-${String(((m - 3) % 12) + 1).padStart(2, '0')}`)
  }
  const months: ScheduleMonth[] = []
  for (const key of order) {
    const bucket = byKey.get(key)
    if (!bucket) continue
    const amount = bucket.rows.reduce((s, r) => s + r.amount, 0)
    const remaining = bucket.rows.reduce((s, r) => s + r.remaining, 0)
    // Dominant state: overdue > partial > due > upcoming > settled.
    const states = bucket.rows.map((r) => scheduleRowState(r, today, graceDays))
    const state: ScheduleRowState =
      states.includes('overdue') ? 'overdue'
        : remaining === 0 ? 'settled'
          : states.includes('partial') ? 'partial'
            : states.includes('due') ? 'due'
              : 'upcoming'
    months.push({
      key,
      label: FY_MONTHS[Number(key.slice(5, 7)) - 1] ?? key,
      rows: bucket.rows,
      amount,
      remaining,
      dueDate: bucket.dueDate,
      state,
    })
  }
  return months
}

// ─── DUE NEXT derivation (§4/§17 — one reminder, never spam) ─────────

export interface NextDue {
  /** Earliest unpaid charge date. */
  date: string
  /** Total remaining across that date's unpaid charges. */
  amount: number
  /** Days from today (negative = past due). */
  daysUntil: number
  /** 'overdue' (past grace AND late-fee-eligible) · 'past' (past due but
   *  the school's late-fee policy does not reach it — e.g. a Transport
   *  remnant under mandatory_only) · 'grace' (due, inside grace) ·
   *  'upcoming' (future). */
  kind: 'overdue' | 'past' | 'grace' | 'upcoming'
  /** Last day of the grace window (only for 'grace'). */
  graceEnd?: string
}

/** The next money the student owes — from the canonical schedule.
 *  The EARLIEST unpaid charge wins (a past-due instalment still inside its
 *  grace window IS the next payment — hiding it behind the next future
 *  date would understate urgency). Overdue vs merely past follows the
 *  school's late-fee policy (mandatory_only never late-fees optional or
 *  Transport charges — the label must not overstate it). */
export function nextDueFromSchedule(
  rows: Array<Pick<StudentChargeRow, 'date' | 'remaining' | 'fromMandatoryHead' | 'isAdditional'>>,
  today: string,
  graceDays: number,
  lateFeeAppliesTo: 'all' | 'mandatory_only' = 'mandatory_only',
): NextDue | null {
  const unpaid = rows.filter((r) => r.remaining > 0)
  if (unpaid.length === 0) return null
  const todayMs = new Date(`${today}T00:00:00`).getTime()
  const target = unpaid[0]
  const dueMs = new Date(`${target.date}T00:00:00`).getTime()
  const daysUntil = Math.round((dueMs - todayMs) / 86_400_000)
  const sameDate = unpaid.filter((r) => r.date === target.date)
  const amount = sameDate.reduce((s, r) => s + r.remaining, 0)
  const graceMs = dueMs + graceDays * 86_400_000
  // Late-fee eligibility of this charge under the school's policy.
  const lateFeeEligible =
    !target.isAdditional && (lateFeeAppliesTo === 'all' || target.fromMandatoryHead)
  const kind: NextDue['kind'] = daysUntil > 0
    ? 'upcoming'
    : daysUntil === 0
      ? 'grace'
      : todayMs > graceMs
        ? (lateFeeEligible ? 'overdue' : 'past')
        : 'grace'
  return {
    date: target.date,
    amount,
    daysUntil,
    kind,
    ...(kind === 'grace' ? { graceEnd: new Date(graceMs).toISOString().split('T')[0] } : {}),
  }
}

/** Human label for the DUE NEXT strip — calm, factual, one line. */
export function nextDueLabel(next: NextDue): string {
  if (next.kind === 'overdue') return `overdue since ${shortDate(next.date)}`
  if (next.kind === 'past') return `was due ${shortDate(next.date)}`
  if (next.daysUntil === 0) return 'due today'
  if (next.kind === 'grace') {
    return next.graceEnd
      ? `due ${shortDate(next.date)} · grace until ${shortDate(next.graceEnd)}`
      : `due ${shortDate(next.date)}`
  }
  return `due ${shortDate(next.date)} · in ${next.daysUntil} day${next.daysUntil === 1 ? '' : 's'}`
}

// ─── Date helpers (FY rhythm) ─────────────────────────────────────────

export const todayStr = () => new Date().toISOString().split('T')[0]

/** '18 Sep' style short label. */
export function shortDate(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return `${d.getDate()} ${FY_MONTHS[d.getMonth()] ?? ''}`.trim()
}

/** 'Sep 2026' style month label. */
export function monthYearLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${FY_MONTHS[Number(m) - 1] ?? ''} ${y}`.trim()
}
