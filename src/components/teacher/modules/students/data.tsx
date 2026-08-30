// Static data, types, and initial state for the Teacher Students module.

export const progressData = [
  { name: 'UT1', v: 78 },
  { name: 'UT2', v: 82 },
  { name: 'Mid', v: 84 },
  { name: 'UT3', v: 88 },
]

export type Filter = 'all' | 'high' | 'at-risk'

// NOTE (PAY-REWORK-1): the old mock CashRequest re-admission data was
// removed — teacher fee collections now use the REAL canonical fee ledger
// (see fee-collections.tsx → fee-store.recordPayment).

// Deterministic math-score sequence used to render per-student math score chips.
export const scoreSequence = [48, 44, 38, 49, 36, 47, 42, 46, 40, 50, 32, 45, 41, 48, 39, 47, 35, 46]
