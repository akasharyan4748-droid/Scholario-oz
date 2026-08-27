---
Task ID: FEE-EXAM-FIX
Agent: full-stack-developer (Exam fee plannedInstances UI)
Task: Add plannedInstances field to exam fee schedule editor in Fee Structure detail drawer

# Scope

The `ExamFeeEntry` type in `fee-store.ts` already exposes an optional
`plannedInstances?: number` field (default 1), and `computeExamFeeTotal`
already multiplies the per-exam amount by it. This task exposes that
field in the Examination Fee Schedule editor UI inside the Fee Structure
detail drawer so principals can configure how many instances of each
exam type are planned for an academic year (e.g. Unit Test × 4).

Files touched (1):
- `src/components/principal/modules/fees/fees-structures-detail.tsx`

# Work Log

1. Read the relevant sections of `fees-structures-detail.tsx`:
   - Exam Fee Schedule table header (~line 659), footer (~line 686),
     body container (~line 667–684)
   - `ExamFeeRow` component (~line 1148) — editing + view modes
   - `AddExamFeeForm` component (~line 1248)
2. Read `fee-store.ts` `ExamFeeEntry` interface (~line 77) to confirm
   `plannedInstances?: number` is already defined with a default of 1
   and the comment documenting the annual total = amount × plannedInstances.
3. Edited `fees-structures-detail.tsx` via a single atomic `MultiEdit`:
   - **Table header** (line 659): widened grid from
     `grid-cols-[1.5fr_0.8fr_auto_auto_0.7fr]` (5 cols) to
     `grid-cols-[1.5fr_0.8fr_0.6fr_auto_auto_0.7fr]` (6 cols) and added
     a `<span className="text-center">Planned</span>` cell between
     Amount and Mandatory.
   - **Table footer** (line 687): applied the same 6-column grid and
     inserted an additional empty `<span></span>` cell so the Total row
     keeps alignment with the new header.
   - **`ExamFeeRow` editing mode** (line 1154): switched to the 6-column
     grid; added a compact number `<Input>` for `plannedInstances`
     (`value={entry.plannedInstances ?? 1}`, min 1, `Math.max(1, …)`
     guard, `text-center tabular-nums`, title tooltip) between the
     Amount input and the Mandatory checkbox.
   - **`ExamFeeRow` view mode** (line 1214): switched to the 6-column
     grid; added `<span className="text-center tabular-nums">{entry.plannedInstances ?? 1}×</span>`
     between the Amount cell and the Mandatory badge. The amount cell
     now renders the per-exam amount `formatINR(entry.amount, true)`
     (not the multiplied total) so the Planned column visibly multiplies
     to the active-exam-fees total in the footer.
   - **`AddExamFeeForm`** (line 1259): added a `plannedInstances` state
     (default 1) alongside `amount`/`mandatory`/`active`; extended
     `isValid` to require `plannedInstances >= 1`; included
     `plannedInstances: Math.max(1, plannedInstances)` in the
     `onAdd(...)` payload; reset it to `1` on submit.
   - **`AddExamFeeForm` layout** (line 1293): switched the field grid
     from `grid-cols-3` to `grid-cols-2 sm:grid-cols-4` and made the
     Exam Type cell span 2 columns on `sm+`, with a dedicated "Planned"
     number input (`min=1`, `text-center`, same title tooltip) between
     Amount and the toggles row (which now spans 4 columns).
4. Verified:
   - `bunx tsc --noEmit` → exit code 0, **0 errors TS**
   - `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/`
     → **HTTP 200**

# Stage Summary

The Examination Fee Schedule editor in the Fee Structure detail drawer
now exposes a "Planned" column mirroring the existing `ExamFeeEntry.plannedInstances`
field. Both the inline edit row and the view row render a 6-column grid
(Exam Type | Amount | Planned | Mandatory | Active | Action/Status),
the table header and footer carry the matching grid for alignment, and
the Add Exam Fee inline form collects the planned instance count next
to the amount. The amount cell now displays the per-exam amount
(rather than the multiplied total), which is consistent with the
"Planned × N" badge and the active-exam-fees total in the footer that
already calls `computeExamFeeTotal` (= amount × plannedInstances ×
active flag). All existing behaviours — duplicate exam-type detection,
mandatory/active toggles, draft saving, version publish/schedule —
remain unchanged because the `plannedInstances` field flows through
the already-updated `updateWorkingExamFee` patch mechanism in the
parent component and the already-updated `computeExamFeeTotal` /
`computeAccount` helpers in `fee-store.ts`.
