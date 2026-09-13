'use client'

/**
 * fees/derive — PURE derivations for the student Fees module (FEES-R).
 *
 * ONE-LEDGER PRINCIPLE (preserved from STU-MAIN): every rupee the module
 * shows derives from the students-store record (feeTotal / feePaid /
 * scholarship / transport) + the fee store's transactions for STU-58.
 * These helpers only SHAPE that data — they never invent amounts, dates,
 * heads or concession values:
 *
 *   · Fee composition → the school's configured class structure, filtered
 *     through the SAME applicability gate the fee engine uses
 *     (isHeadApplicableToStudent + optional-head opt-ins).
 *   · Per-head paid status → allocation of the real Success transactions
 *     (each payment applies to its own feeHead first, then spills across
 *     the structure's heads in order — the seed's stated semantics for
 *     TXN020: "Term 1 fees — tuition, management & part transport").
 *   · Concession → approved/effective concession records + the register's
 *     scholarship fallback (the same rule computeAccount applies).
 *   · Timeline → the session start (April of CURRENT_ACADEMIC_YEAR) + the
 *     real transaction dates only. No fabricated due dates anywhere.
 */

import {
  findStructureForStudent,
  FREQUENCY_MULTIPLIER,
  CURRENT_ACADEMIC_YEAR,
} from '@/lib/store/fee-store'
import { isHeadApplicableToStudent } from '@/lib/store/fee-store-data'
import type { FeeTransaction, StudentConcession } from '@/lib/store/fee-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { formatINR } from '@/lib/format'

// ─── Session ─────────────────────────────────────────────────────────

/** '2026-2027' → '2026–27' — the minimal financial-period chip (§2). */
export function sessionChipLabel(session: string): string {
  const m = session.match(/^(\d{4})-(\d{2}|\d{4})$/)
  if (!m) return session
  const end = m[2].length === 4 ? m[2].slice(2) : m[2]
  return `${m[1]}–${end}`
}

/** Session start (April 1) — the same anchor computeAccount uses. */
export function sessionStartOf(session: string): string {
  const year = Number(session.split('-')[0])
  return `${Number.isFinite(year) ? year : 2026}-04-01`
}

// ─── Fee composition (§6) ────────────────────────────────────────────

export interface FeeHeadLine {
  /** Structure head id (stable for allocation). */
  id: string
  name: string
  frequency: 'Annual' | 'Half-Yearly' | 'Quarterly' | 'Monthly' | 'Per Term' | 'One-Time'
  /** Per-period amount from the structure (e.g. ₹250 if Monthly). */
  perPeriod: number
  /** Academic-year total (per-period × frequency multiplier). */
  annual: number
  /** Small billing-context label, e.g. "₹250 × 12 months". */
  frequencyContext: string
}

function frequencyContextOf(frequency: FeeHeadLine['frequency'], perPeriod: number): string {
  switch (frequency) {
    case 'Monthly': return `${formatINR(perPeriod)} × 12 months`
    case 'Quarterly': return `${formatINR(perPeriod)} × 4 quarters`
    case 'Per Term': return `${formatINR(perPeriod)} × 3 terms`
    case 'Half-Yearly': return `${formatINR(perPeriod)} × 2 instalments`
    case 'Annual': return 'billed annually'
    case 'One-Time': return 'one-time'
  }
}

/**
 * The student's REAL fee composition: the configured structure for their
 * class, filtered to active + applicable heads (Transport only when
 * enrolled; optional heads only through explicit opt-in). Returns [] when
 * no structure exists — the UI then shows an honest empty state.
 */
export function deriveApplicableHeads(
  student: Pick<StudentRecord, 'id' | 'className' | 'classId' | 'transport'>,
  optionalHeadApplicability: Record<string, string[]>,
): FeeHeadLine[] {
  const structure = findStructureForStudent(student.className, student.classId ?? undefined)
  if (!structure) return []
  const optedIn = optionalHeadApplicability[student.id] ?? []
  return structure.components
    .filter((c) => c.active && isHeadApplicableToStudent(c, student, { optedInHeadIds: optedIn }))
    .map((c) => {
      const annual = c.amount * (FREQUENCY_MULTIPLIER[c.frequency] ?? 1)
      return {
        id: c.id,
        name: c.name,
        frequency: c.frequency,
        perPeriod: c.amount,
        annual,
        frequencyContext: frequencyContextOf(c.frequency, c.amount),
      }
    })
}

/**
 * Unused-head guard: heads the structure offers but this student has NOT
 * opted into (Books & Material, Uniform…) — surfaced nowhere by default;
 * kept honest by omission rather than as ₹0 lines.
 */

// ─── Per-head paid allocation (§6 status per head) ───────────────────

/**
 * Allocate the student's SUCCESS transactions across the fee heads.
 * Each payment applies to its OWN feeHead first (the ledger records the
 * head it was collected against — TXN020's feeHead is 'Tuition'), then
 * any remainder spills across the other heads in structure order. This
 * matches the seed's stated semantics ("Term 1 fees — tuition, management
 * & part transport") without hardcoding a single number.
 *
 * 'Under Verification' / Pending / Failed money is deliberately NOT
 * allocated — it is not paid yet (§10).
 */
export function allocateToHeads(heads: FeeHeadLine[], txns: FeeTransaction[]): Map<string, number> {
  const paid = new Map<string, number>(heads.map((h) => [h.id, 0]))
  const remaining = new Map<string, number>(heads.map((h) => [h.id, h.annual]))
  const success = txns.filter((t) => t.status === 'Success')
  for (const t of success) {
    let pool = t.amount
    const applyTo = (headId: string) => {
      if (pool <= 0) return
      const rem = remaining.get(headId) ?? 0
      if (rem <= 0) return
      const applied = Math.min(pool, rem)
      remaining.set(headId, rem - applied)
      paid.set(headId, (paid.get(headId) ?? 0) + applied)
      pool -= applied
    }
    const own = heads.find((h) => h.name === t.feeHead)
    if (own) applyTo(own.id)
    for (const h of heads) {
      if (pool <= 0) break
      if (own && h.id === own.id) continue
      applyTo(h.id)
    }
    // Any leftover (over-payment beyond the year's heads) is intentionally
    // dropped here — the account-level figures clamp at the ledger's own
    // totals and never show more paid than the heads themselves.
  }
  return paid
}

// ─── Concession (§7) ─────────────────────────────────────────────────

export interface ConcessionPosition {
  /** Real concession value in ₹ (0 when none). */
  amount: number
  /** Honest label when a concession exists, else null → "None applied". */
  label: string | null
}

/**
 * Same rule the fee engine applies (computeAccount): approved,
 * currently-effective concession records are the source of truth; the
 * register's `scholarship` scalar is only the legacy fallback. Percent-basis
 * records resolve against `baseAmount` (this module's annual-heads total).
 * Zero → the UI must say "None applied" — never a ₹0 line dressed as a
 * discount.
 */
export function concessionOf(
  student: Pick<StudentRecord, 'id' | 'scholarship'>,
  concessions: StudentConcession[],
  baseAmount: number,
): ConcessionPosition {
  const today = new Date().toISOString().split('T')[0]
  const active = concessions.filter(
    (c) => c.studentId === student.id && c.status === 'Approved'
      && c.effectiveFrom <= today && (!c.effectiveTo || c.effectiveTo >= today),
  )
  if (active.length > 0) {
    const amount = active.reduce((sum, c) => {
      const value = c.basis === 'percent' ? Math.round((baseAmount * c.value) / 100) : c.value
      return sum + value
    }, 0)
    const label = Array.from(new Set(active.map((c) => c.type))).join(' + ')
    return { amount, label }
  }
  const fallback = student.scholarship ?? 0
  return fallback > 0 ? { amount: fallback, label: 'Concession' } : { amount: 0, label: null }
}

// ─── Financial status (§5) ───────────────────────────────────────────

export type FinancialStatusKey =
  | 'all-clear'
  | 'partially-paid'
  | 'payment-due'
  | 'under-review'

export interface FinancialStatus {
  key: FinancialStatusKey
  /** Chip text (never colour alone — always chip + text). */
  label: string
  /** One-line hint shown with the hero figure. */
  hint: string
  /** Tone for chips / accents: emerald | amber | cyan. */
  tone: 'emerald' | 'amber' | 'cyan'
}

/**
 * The student's financial status, derived purely from the ledger state.
 * A submitted-but-unverified payment surfaces as PAYMENT UNDER REVIEW so
 * the student is never left guessing whether their money landed (§10).
 */
export function financialStatusOf(position: {
  totalPaid: number
  totalPending: number
  underReviewCount: number
}): FinancialStatus {
  const { totalPaid, totalPending, underReviewCount } = position
  if (totalPending <= 0) {
    return { key: 'all-clear', label: 'All clear', hint: 'No payment currently due.', tone: 'emerald' }
  }
  if (underReviewCount > 0) {
    return {
      key: 'under-review',
      label: 'Payment under review',
      hint: 'A submitted payment is awaiting verification by the school office.',
      tone: 'cyan',
    }
  }
  if (totalPaid > 0) {
    return {
      key: 'partially-paid',
      label: 'Partially paid',
      hint: 'Balance for the session — payable as arranged with the school office.',
      tone: 'amber',
    }
  }
  return {
    key: 'payment-due',
    label: 'Payment due',
    hint: 'Balance for the session — payable as arranged with the school office.',
    tone: 'amber',
  }
}

// ─── Financial timeline (§16) ────────────────────────────────────────

export interface FeeTimelineEvent {
  id: string
  /** ISO date (yyyy-mm-dd). */
  at: string
  kind: 'posted' | 'payment'
  title: string
  /** Status marker — chip + text, never colour alone. */
  marker: { label: string; tone: 'emerald' | 'amber' | 'rose' | 'neutral' }
}

function paymentMarkerOf(t: FeeTransaction): FeeTimelineEvent['marker'] {
  switch (t.status) {
    case 'Success':
      if (t.verifiedBy && /auto-confirmed/i.test(t.verifiedBy)) {
        return { label: 'Confirmed by the payment gateway', tone: 'emerald' }
      }
      return { label: 'Verified by the school office', tone: 'emerald' }
    case 'Under Verification':
    case 'Pending':
      return { label: 'Under verification', tone: 'amber' }
    case 'Failed':
      return { label: 'Failed — no money moved', tone: 'rose' }
    case 'Refunded':
      return { label: 'Refunded', tone: 'neutral' }
  }
}

/**
 * Compact chronological ledger story: the annual fee posted at session
 * start, then every real transaction on its own date. New payments the
 * student makes appear here live. Nothing is dated that isn't in data.
 */
export function feeTimelineEvents(position: {
  totalFee: number
  txns: FeeTransaction[]
}): FeeTimelineEvent[] {
  const postedAt = sessionStartOf(CURRENT_ACADEMIC_YEAR)
  const events: FeeTimelineEvent[] = [
    {
      id: 'posted',
      at: postedAt,
      kind: 'posted',
      title: `Annual fee posted ${formatINR(position.totalFee)}`,
      marker: { label: `Start of ${sessionChipLabel(CURRENT_ACADEMIC_YEAR)}`, tone: 'neutral' },
    },
  ]
  const byDate = [...position.txns].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  for (const t of byDate) {
    const verb = t.status === 'Failed'
      ? 'payment failed'
      : t.status === 'Refunded'
        ? 'refunded'
        : t.status === 'Success'
          ? 'payment received'
          : 'payment submitted'
    events.push({
      id: t.id,
      at: t.date,
      kind: 'payment',
      title: `${formatINR(t.amount)} ${verb}`,
      marker: paymentMarkerOf(t),
    })
  }
  return events
}

// ─── Shared status-vocabulary for transaction chips (§13) ────────────

export type TxnChipTone = 'emerald' | 'amber' | 'rose' | 'neutral' | 'cyan'

export function txnStatusChip(t: FeeTransaction): { label: string; tone: TxnChipTone } {
  switch (t.status) {
    case 'Success': return { label: 'Paid', tone: 'emerald' }
    case 'Under Verification': return { label: 'Under verification', tone: 'amber' }
    case 'Pending': return { label: 'Processing', tone: 'amber' }
    case 'Failed': return { label: 'Failed', tone: 'rose' }
    case 'Refunded': return { label: 'Refunded', tone: 'neutral' }
  }
}
