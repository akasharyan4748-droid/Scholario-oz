'use client'

// ============================================================
// STUDENT FEE QUERIES STORE (FEES-R · spec §20/§21)
// ------------------------------------------------------------
// Structured fee questions/disputes raised by the student (or
// guardian) against the ONE fee ledger — "Payment missing",
// "Receipt issue", "Incorrect amount"…
//
// HONESTY RULES (spec §21/§22):
//   · The student can only SUBMIT a request and READ its timeline.
//     There is deliberately NO student-side action that resolves,
//     edits or withdraws a request — only the school office can
//     advance a case (their workflow lives on the school side).
//   · Every request gets an immutable REQ-2026-### id and a
//     timeline that starts at 'Submitted'. The user must never
//     wonder whether the school received their complaint.
//
// Tenant-scoped persistence (same pattern as every student store).
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

// ─── Entities ────────────────────────────────────────────────────────

export type FeeQueryIssueType =
  | 'Incorrect amount'
  | 'Payment missing'
  | 'Receipt issue'
  | 'Concession query'
  | 'Duplicate charge'
  | 'Other'

/** Issue types the Raise-a-request form offers (spec §21 vocabulary). */
export const FEE_QUERY_ISSUE_TYPES: FeeQueryIssueType[] = [
  'Incorrect amount',
  'Payment missing',
  'Receipt issue',
  'Concession query',
  'Duplicate charge',
  'Other',
]

export type FeeQueryStatus = 'Submitted' | 'Under review' | 'Resolved'

export interface FeeQueryTimelinePoint {
  status: FeeQueryStatus
  /** ISO timestamp of the transition. */
  at: string
  /** Office note attached to the transition (optional). */
  note?: string
}

export interface FeeQuery {
  /** Immutable request id, e.g. 'REQ-2026-102'. */
  id: string
  issueType: FeeQueryIssueType
  /** Receipt no of the related ledger transaction (when the query is about one). */
  relatedTxnReceiptNo?: string
  message: string
  submittedOn: string
  /** Case timeline — starts at Submitted; only the office appends. */
  timeline: FeeQueryTimelinePoint[]
}

export interface SubmitFeeQueryInput {
  issueType: FeeQueryIssueType
  relatedTxnReceiptNo?: string
  message: string
}

interface StudentFeeQueriesState {
  queries: FeeQuery[]
  /** Submit a new fee request. The student can never mutate it afterwards. */
  submitFeeQuery: (input: SubmitFeeQueryInput) => { ok: true; query: FeeQuery } | { ok: false; error: string }
}

// ─── Seed ────────────────────────────────────────────────────────────
//
// ONE resolved historical example — a receipt-number question raised
// right after the Term-1 payment (TXN020 / RCP-2026-1061) and closed
// by the accounts office. It demonstrates the timeline pattern with
// legitimate demo data; nothing about it touches the live ledger.

function seedQueries(): FeeQuery[] {
  return [
    {
      id: 'REQ-2026-101',
      issueType: 'Receipt issue',
      relatedTxnReceiptNo: 'RCP-2026-1061',
      message: 'The printed receipt for my Term 1 payment shows a different date than the payment date — please check.',
      submittedOn: '2026-07-13T09:20:00.000Z',
      timeline: [
        { status: 'Submitted', at: '2026-07-13T09:20:00.000Z' },
        { status: 'Under review', at: '2026-07-14T05:45:00.000Z', note: 'Accounts office is checking the receipt register against the ledger.' },
        { status: 'Resolved', at: '2026-07-16T04:10:00.000Z', note: 'Receipt RCP-2026-1061 verified — the register shows the verified date; a stamped copy was shared at the office.' },
      ],
    },
  ]
}

// ─── Ids ─────────────────────────────────────────────────────────────

/** Next sequential REQ-2026-### id (never reuses a number the store has). */
function nextRequestId(queries: FeeQuery[]): string {
  let max = 101
  for (const q of queries) {
    const m = q.id.match(/^REQ-2026-(\d{3})$/)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `REQ-2026-${String(max + 1).padStart(3, '0')}`
}

const nowIso = () => new Date().toISOString()

// ─── Derived helpers (pure, exported for the UI) ─────────────────────

/** A request is OPEN until its timeline reaches 'Resolved'. */
export function isQueryOpen(q: FeeQuery): boolean {
  return q.timeline[q.timeline.length - 1]?.status !== 'Resolved'
}

/** Latest status label for a request chip. */
export function latestStatusOf(q: FeeQuery): FeeQueryStatus {
  return q.timeline[q.timeline.length - 1]?.status ?? 'Submitted'
}

// ─── Store ───────────────────────────────────────────────────────────

export const useStudentFeeQueriesStore = create<StudentFeeQueriesState>()(
  persist(
    (set, get) => ({
      queries: seedQueries(),

      submitFeeQuery: ({ issueType, relatedTxnReceiptNo, message }) => {
        const text = message.trim()
        if (!text) return { ok: false, error: 'Please describe the issue in the message field.' }
        if (text.length < 10) return { ok: false, error: 'Please add a little more detail (at least 10 characters).' }
        const query: FeeQuery = {
          id: nextRequestId(get().queries),
          issueType,
          ...(relatedTxnReceiptNo ? { relatedTxnReceiptNo } : {}),
          message: text,
          submittedOn: nowIso(),
          // Timeline starts at Submitted — only the school office can
          // append 'Under review' / 'Resolved' (never the student).
          timeline: [{ status: 'Submitted', at: nowIso() }],
        }
        set((s) => ({ queries: [query, ...s.queries] }))
        return { ok: true, query }
      },
    }),
    {
      name: 'scholario-student-fee-queries-v1',
      storage: createTenantScopedStorage('scholario-student-fee-queries-v1'),
      version: 1,
      partialize: (s) => ({ queries: s.queries }),
    },
  ),
)
