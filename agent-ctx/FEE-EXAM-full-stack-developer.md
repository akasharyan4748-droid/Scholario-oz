---
Task ID: FEE-EXAM
Agent: full-stack-developer (Examination Fee integration)
Task: Integrate exam fee schedule into Fee Structures + auto-resolve in Exam creation

# Scope

Four surgical, backward-compatible additions to wire the Fee Structure's
per-exam fee schedule into the Examination creation flow:

Files touched (4):
- `src/lib/store/fee-store.ts` — new ExamFeeEntry / ExamFeeSchedule types,
  optional `examFeeSchedule` on FeeStructureConfig + FeeStructureVersion,
  re-seed FEE_STRUCTURES (removed legacy "Exam" Per Term fee head, added
  per-exam schedule per spec), new `computeExamFeeTotal` helper, updated
  `computeAccount` to add the per-exam total to `totalApplicable`,
  updated `createFeeStructure` / `publishFeeStructureVersion` /
  `scheduleFeeStructureVersion` / `revertFeeStructureVersion` /
  `updateFeeStructureDraft` + SEED_VERSIONS to snapshot the exam fee
  schedule.
- `src/lib/exams/types.ts` — added optional `examFee?: number` and
  `feeStructureVersionRef?: string` to both `ExamDTO` and
  `CreateExamInput` (additive — pre-existing code unchanged).
- `src/components/principal/modules/fees/fees-structures-detail.tsx` —
  new "Examination Fee Schedule" editor section AFTER the regular Fee
  Heads table: parallel `workingExamSchedule` state, inline editing
  (ExamFeeRow component with view/edit modes), inline AddExamFeeForm
  component with COMMON_EXAM_TYPES datalist suggestions, validation for
  duplicate exam types + non-negative amounts, `hasEdits` extended to
  track exam schedule changes, `handleConfirmPublish` /
  `handleConfirmSchedule` pass `workingExamSchedule` as the 6th
  parameter, scheduled-version promotion + duplicate flow also propagate
  the exam fee schedule.
- `src/components/principal/modules/exams/create-exam-fullscreen.tsx` —
  new EXAM_TYPE_TO_FEE_TYPE map (handles BOTH legacy codes 'UT1'..'UT4' /
  'HALF_YEARLY' / 'ANNUAL' / 'PRE_BOARD' / 'PRACTICAL' AND template names
  'Unit Test 1'..'4' / 'Half-Yearly Examination' / etc.), new
  `gradeLevelToClassLevel` helper, `resolvedExamFee` useMemo reads
  `feeStructures` + `versions` from `useFeeStore` and resolves the active
  per-exam entry for the FIRST selected exam class's classLevel,
  multiple-classLevels note, override flow (inline form with required
  reason field + reset), `examFee` + `feeStructureVersionRef` passed into
  the `create()` input on submission.

Out of scope (per task): fees-overview, fees-collections,
fees-transactions, fees-approvals, fees-pending-dues, fees-settings,
fees-shell, fees-shared, fees-receipt, fees-collect-payment, fees-reports,
fees-charts, fees-settings-payment, fees-structures,
fees-structures-confirm, fees-structures-history,
fees-structures-shared, mock-exams-data.ts, and any other file not
listed above.

# ExamFeeSchedule type (fee-store.ts)

Added at `src/lib/store/fee-store.ts:68-91`:

```typescript
export interface ExamFeeEntry {
  id: string
  /** Canonical exam type — matches the EXAM_TYPES vocabulary in
   *  src/lib/exams/types.ts (e.g. 'Unit Test', 'Half-Yearly',
   *  'Annual Examination', 'Pre-Board', 'Practical). */
  examType: string
  /** Per-examination amount (in INR). Charged once per conducted exam. */
  amount: number
  mandatory: boolean
  active: boolean
}

export type ExamFeeSchedule = ExamFeeEntry[]
```

Optional `examFeeSchedule?: ExamFeeSchedule` added to `FeeStructureConfig`
(line 207-212) and `FeeStructureVersion` (line 238-244) — both
backward-compatible (existing structures / versions without the field
simply have no per-exam fees configured).

# Seed data (FEE_STRUCTURES, fee-store.ts:456-547)

Replaced the legacy "Exam" Per Term fee head with proper per-exam
schedule entries on each structure:

| Structure | Class level         | Removed Exam head | New examFeeSchedule entries                                  | New annual (recurring only) |
|-----------|--------------------|-------------------|---------------------------------------------------------------|-----------------------------|
| FS01      | Pre-Primary        | (none)            | Unit Test ₹50, Half-Yearly ₹200, Annual ₹300                 | ₹60,400 (unchanged)         |
| FS02      | Primary            | ₹1000 Per Term    | Unit Test ₹100, Half-Yearly ₹300, Annual ₹500                | ₹71,000 (was ₹74,000)        |
| FS03      | Middle             | ₹1500 Per Term    | Unit Test ₹100, Half-Yearly ₹500, Annual ₹700                | ₹93,600 (was ₹98,100)        |
| FS04      | Secondary          | ₹2000 Per Term    | Unit Test ₹100, Half-Yearly ₹500, Annual ₹700, Pre-Board ₹600| ₹1,16,000 (was ₹1,22,000)   |
| FS05      | Senior Secondary   | ₹2500 Per Term    | Unit Test ₹100, Half-Yearly ₹500, Annual ₹800, Pre-Board ₹600, Practical ₹500 | ₹1,44,400 (was ₹1,51,900) |

The cached `annual` field on each structure now reflects ONLY the
recurring heads. `computeAccount` adds the per-exam schedule total
separately to the student's `totalApplicable`, so removing the Exam
fee head reduces the recurring total but the per-exam schedule
compensates with the per-exam fees (which is what the spec wants:
exam fees are billed per conducted exam, not per period).

Existing FH IDs (FH01-FH23) preserved for backward-compat with any
audit log entries that reference them. Only the four "Exam" fee head
entries (FH07, FH12, FH17, FH22) are removed from the `components`
arrays — the IDs themselves simply stop appearing in the live
structures.

# computeExamFeeTotal helper (fee-store.ts:567-581)

```typescript
export function computeExamFeeTotal(schedule: ExamFeeSchedule | undefined | null): number {
  if (!schedule || schedule.length === 0) return 0
  return schedule.filter((e) => e.active).reduce((sum, e) => sum + e.amount, 0)
}
```

Backward-compatible — undefined / empty schedule returns 0.

# computeAccount (fee-store.ts:2156-2253)

Added:
```typescript
const regularFeesTotal = structure ? computeHeadsTotal(structure.components) : student.feeTotal
const examFeeTotal = structure ? computeExamFeeTotal(structure.examFeeSchedule) : 0
const totalApplicable = regularFeesTotal + examFeeTotal
```

Plus per-exam ledger entries appended after the recurring heads
(with feeHead label "Exam Fee — <examType>" and description
"Per-exam fee — <examType>"). The balance accumulates as before —
each active exam fee entry is one charge line.

e.g. FS04 (Secondary): recurring ₹1,16,000 + exam fees ₹1,900 =
totalApplicable ₹1,17,900. Was ₹1,22,000 (legacy Exam Per Term).

# Version snapshots

- `SEED_VERSIONS` (line 593-606): snapshots `examFeeSchedule` from each
  FEE_STRUCTURES entry onto Version 1.
- `createFeeStructure` (line 1422-1479): accepts optional
  `examFeeSchedule?` in the input type; snapshots onto both the live
  FeeStructureConfig and the Version 1 draft.
- `publishFeeStructureVersion` (line 1481-1556): 6th parameter
  `examFeeSchedule?: ExamFeeSchedule` snapshots onto the new CURRENT
  version + the live FeeStructureConfig. When omitted, falls back to
  the structure's existing examFeeSchedule (backward-compatible).
- `scheduleFeeStructureVersion` (line 1558-1605): same 6th-parameter
  pattern.
- `revertFeeStructureVersion` (line 1642-1715): no signature change —
  the target version's `examFeeSchedule` snapshot is restored onto the
  new (rolled-back) version + the live FeeStructureConfig.
- `updateFeeStructureDraft` (line 1717-1739): accepts optional
  `examFeeSchedule?` in the changes payload, stages onto the draft
  version.
- Fees-structures-detail.tsx scheduled-version "Promote" inline action
  also passes `v.examFeeSchedule` to the publish mutation.

# ExamDTO additions (src/lib/exams/types.ts:190-204, 248-254)

```typescript
// On ExamDTO (optional — additive):
examFee?: number
feeStructureVersionRef?: string

// On CreateExamInput (optional — additive):
examFee?: number
feeStructureVersionRef?: string
```

Pre-existing exam code (mock store, real service.ts) does NOT
propagate these — they're simply ignored. The contract supports
them, so any future caller (real API + service) can set them when
persisting new exams. This is the "additive, optional" contract
the task requested.

# Exam Fee Schedule editor (fees-structures-detail.tsx)

New UI section placed BETWEEN the Fee Heads table and the Recent
Activity section:

```
EXAMINATION FEE SCHEDULE  (Per-examination charges — not recurring)    [+ Add Exam Fee]
+---------------------------------------+
| Exam Type  | Amount | Mandatory | Active | Action/Status |
| Unit Test  | ₹100   | Mandatory | Active | Per-exam       |
| Half-Yearly| ₹500   | Mandatory | Active | Per-exam       |
| ...                                                          |
+---------------------------------------+
Total (active exam fees): ₹1,900
```

- View mode: read-only table mirroring the Fee Heads table style
- Edit mode: inline editing of each row (Input for exam type with
  COMMON_EXAM_TYPES datalist suggestions, number input for amount,
  checkboxes for Mandatory + Active, Trash2 button to remove)
- "Add Exam Fee" button (top-right of section, only in edit mode)
  toggles the AddExamFeeForm inline form (mirrors AddHeadForm):
  exam type input + amount input + Mandatory + Active toggles +
  Cancel/Add to Draft buttons
- Validation: exam type required, amount ≥ 0, no duplicate exam types
  (case-insensitive) within the same structure — surfaced in the
  existing validation banner above the table
- Edit-mode callout now also shows the per-exam total alongside the
  recurring working total: "Working total: ₹1,16,000 · +₹1,900
  exam fees"
- `hasEdits` extended to also compare `workingExamSchedule` to
  `structure.examFeeSchedule ?? []` so the "Unsaved changes — publish
  to commit" indicator fires when exam fees are edited

# Exam Fee auto-resolution (create-exam-fullscreen.tsx)

New "Examination Fee" Section placed between the Assessment section
and the Examination Window section (only renders after the user has
selected both a template and at least one class):

```
EXAMINATION FEE                              Auto-resolved from Secondary fee structure
+-------------------------------------------------------------------+
| 🏆 ₹100  per examination · per student                            |
| Source: Class 9–10 Fee Structure · Configured in Fee Structure    |
|                                                 [✏ Override Fee]    |
+-------------------------------------------------------------------+
```

Key logic:
- `EXAM_TYPE_TO_FEE_TYPE` map (line 187-206) maps BOTH legacy codes
  ('UT1', 'HALF_YEARLY', 'ANNUAL', 'PRE_BOARD', 'PRACTICAL') AND
  template names ('Unit Test 1', 'Half-Yearly Examination',
  'Annual Examination', 'Pre-Board Examination',
  'Practical Examination') to the canonical fee schedule vocabulary
  ('Unit Test', 'Half-Yearly', 'Annual Examination', 'Pre-Board',
  'Practical'). Unmapped types (Oral / Viva, Custom) return null.
- `gradeLevelToClassLevel` helper (line 214-222) converts the
  numeric grade string ("9", "11", "0", "-2") to the canonical fee
  structure bucket ("Pre-Primary", "Primary", "Middle", "Secondary",
  "Senior Secondary").
- `resolvedExamFee` useMemo (line 292-315) reads `feeStructures` +
  `versions` from `useFeeStore`, finds the FIRST selected exam
  class's classLevel, looks up the matching FeeStructureConfig, finds
  the active examFeeSchedule entry for the resolved exam type, and
  returns `{ amount, source: "<className> Fee Structure",
  versionRef: "<currentVersionId>", matchedClassLevel }` or null.
- `multipleClassLevels` note (line 320-324) shows an amber info
  banner when the Principal selected classes spanning different
  classLevels (e.g. Class 8 + Class 9), warning that the displayed
  fee is for the lowest class level and an override may be needed.
- Override flow: "Override Fee" button opens an inline form with a
  New Fee (₹) input + a required Reason input (min 5 chars). Save
  validates both and toasts success. Reset button restores the
  auto-resolved value. The override reason is not persisted on the
  ExamDTO (no field for it) but the task spec calls it a "controlled
  action" — the form-level validation enforces the audit-trail
  discipline.
- On create (line 635-657): `examFee` is set to
  `effectiveExamFee` (override > resolved > null), and
  `feeStructureVersionRef` is set to `resolvedExamFee.versionRef`
  only when NOT overridden (override doesn't come from a fee
  structure version, so the audit-trail reference is omitted).

Override state is reset whenever `resolvedExamFee` changes (e.g.
user picks a different class or template) — so a stale override
never bleeds into a new context.

# Verification

1. `cd /home/z/my-project && bunx tsc --noEmit 2>&1 | grep -c "error TS"`
   → **0** (was 0 before; still 0 after).
2. `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/`
   → **HTTP 200**.
3. `cd /home/z/my-project && bun run lint 2>&1 | tail -20`
   → only the pre-existing `.eslintignore` deprecation warning, no
   errors or warnings.

# Backward compatibility

- `examFeeSchedule` is OPTIONAL on FeeStructureConfig +
  FeeStructureVersion — existing code that doesn't use it still works
  (e.g. `useFeeData` byCategory distribution simply iterates
  `heads.components`, doesn't touch the new field).
- `examFee` + `feeStructureVersionRef` are OPTIONAL on ExamDTO +
  CreateExamInput — existing exam code (mock store, service.ts) does
  not propagate them; they're simply ignored. The contract supports
  them, so any future caller can set them.
- Removing the legacy "Exam" Per Term fee head changes the cached
  `annual` field on FS02-FS05 (₹71K / ₹93.6K / ₹1.16L / ₹1.444L).
  `computeAccount` adds the per-exam schedule total to `totalApplicable`,
  so the student's annual obligation remains sensible (slight reduction
  in all cases, since per-exam totals are smaller than the recurring
  Per Term amounts — this is the correct semantic: per-exam fees are
  billed when exams happen, not upfront).
- Historical exam charges (from published exams) must NOT change —
  they retain their own `examFee` if set, and the new fields are
  optional so historical exams simply have no `examFee` /
  `feeStructureVersionRef` set. No backfill is performed.
- All new FEE_STRUCTURES / SEED_VERSIONS entries use unique EF-<sid>-NN
  ids; existing FH01-FH23 ids preserved (only the four Exam fee heads
  are dropped from `components` arrays — their FH IDs simply stop
  appearing in the live structures, but historical audit log entries
  that may reference them are not affected).

# Files touched (LOC delta)

- `src/lib/store/fee-store.ts` (2289 → 2430 LOC, +141): new types,
  re-seed, computeExamFeeTotal, computeAccount exam fee total + ledger
  entries, snapshot propagation in 4 mutations + SEED_VERSIONS.
- `src/lib/exams/types.ts` (463 → 478 LOC, +15): optional
  examFee + feeStructureVersionRef on ExamDTO + CreateExamInput.
- `src/components/principal/modules/fees/fees-structures-detail.tsx`
  (949 → 1342 LOC, +393): new exam fee schedule editor section,
  ExamFeeRow + AddExamFeeForm components, workingExamSchedule state,
  hasEdits + validation extended, publish/schedule/duplicate/promote
  propagate the schedule.
- `src/components/principal/modules/exams/create-exam-fullscreen.tsx`
  (817 → ~1118 LOC, +301): EXAM_TYPE_TO_FEE_TYPE map,
  gradeLevelToClassLevel helper, resolvedExamFee useMemo, override
  flow state, Examination Fee UI section with override inline form,
  examFee + feeStructureVersionRef passed to create() input.
