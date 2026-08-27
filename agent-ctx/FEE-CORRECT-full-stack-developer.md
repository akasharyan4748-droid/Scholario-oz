# FEE-CORRECT Work Record

## Task
Fix Fee Structure frequency model + delete bug + computeAccount correctness + publish safety + labels.

## Scope (in)
- `src/lib/store/fee-store.ts` — frequency model, computeHeadsTotal, computeAccount, deleteFeeStructure, seed, validation
- `src/components/principal/modules/fees/fees-structures.tsx` — delete button
- `src/components/principal/modules/fees/fees-structures-detail.tsx` — delete action + REQ/ON labels + Frequency list
- `src/components/principal/modules/fees/fees-structures-confirm.tsx` — publish safety

## Scope (out — minimal type-compat only)
- `src/components/principal/modules/fees/fees-settings.tsx` — updated dropdown options for new union (Half-Yearly, Per Term, One-Time) + consume addFeeHead result

## Changes Made

### fee-store.ts
1. **Fix 1 (Frequency model)** — Changed `FeeHead.frequency` union from `'Annual' | 'Quarterly' | 'Monthly' | 'One-time'` to `'Annual' | 'Half-Yearly' | 'Quarterly' | 'Monthly' | 'Per Term' | 'One-Time'` (capital T for consistency).
2. **Fix 2 (computeHeadsTotal)** — Added `FREQUENCY_MULTIPLIER` map + `VALID_FREQUENCIES` array. Rewrote `computeHeadsTotal` to multiply per-period `amount` by `FREQUENCY_MULTIPLIER[h.frequency]` to get the ANNUAL TOTAL. Updated `addFeeHead`, `updateFeeHead`, `archiveFeeHead` to use `computeHeadsTotal` for the cached `annual` field. Updated `byCategory` analytics to multiply by the multiplier.
3. **Fix 3 (computeAccount)** — Now computes `totalApplicable` from the matching `FEE_STRUCTURES` row using `computeHeadsTotal(structure.components)`, falling back to `student.feeTotal` only when no matching structure is found. Updated ledger entries to use the annual head charge (amount × multiplier) and `description: ${c.frequency} charge — ${c.name}` (instead of `Annual charge — ${c.frequency.toLowerCase()}`).
4. **Fix 4 (deleteFeeStructure mutation)** — Added new mutation with the required safeguards:
   - DRAFT structures: can be deleted
   - CURRENT/PUBLISHED structures: refused with "Cannot delete a published structure. Archive it instead."
   - ARCHIVED + linked transactions for students in classLevel: refused with "Cannot delete — financial records depend on this structure."
   - ARCHIVED + no financial references: can be deleted
   - Always emits an immutable audit record and a FeeChangeLog `deleted` entry (financial history preserved)
5. **Fix 7 (Seed data)** — Rewrote all 5 FEE_STRUCTURES rows to use realistic frequencies. Tuition + Transport are `Monthly` (per-month amount). Library + Activity are `Annual`. Exam is `Per Term`. New computed annual totals: Pre-Primary ₹60,400 / Primary ₹74,000 / Middle ₹98,100 / Secondary ₹1,22,000 / Senior Secondary ₹1,51,900. The Primary example matches the task spec exactly (4000*12 + 1500*12 + 2000 + 1000*3 + 3000 = 74000).
6. **Fix 8 (Validation)** — `addFeeHead` and `updateFeeHead` now return `{ success: boolean; error?: string }` and validate: structure existence, head existence, name not empty, amount >= 0, frequency in `VALID_FREQUENCIES`, no duplicate name (case-insensitive) in the same structure. Existing callers continue to work (they ignore the return — updated `fees-settings.tsx` to consume the error result and toast).

### fees-structures.tsx (card grid)
- **Fix 4 (delete button)** — Replaced the toast-only "Delete structure…" menu item with a real `handleDelete(s)` that:
  - If the structure has a CURRENT version → toasts "Cannot delete a published structure. Archive the current version instead".
  - If the structure has a SCHEDULED version → toasts "Cannot delete — scheduled version exists".
  - Otherwise → opens a real confirmation dialog (AnimatePresence modal with rose theme, "What is preserved" list, annual total summary, Cancel + Delete Structure buttons).
- Wired `confirmDelete` to call `deleteFeeStructure(deleteTarget.id, 'Principal')`, handle the result, close the dialog + close the drawer if it was open.

### fees-structures-detail.tsx (detail drawer)
- **Fix 6 (Labels)** — Replaced `REQ` → `Mandatory` and `ON` → `Enabled` in the edit-mode row. Also updated the view-mode REQ/OPT badge to `Mandatory`/`Optional` for consistency. Preserved compact `text-[10px]` and `text-[7px]` styling.
- Updated `FREQUENCIES` array to include `Half-Yearly` + `Per Term` and renamed `One-time` → `One-Time` (was the only TS error before the fix).
- **Fix 4 (delete action)** — Added Delete button to the quick action bar (with muted styling when structure is published, so the click triggers the explanatory toast instead of the dialog). Added `handleDelete()` and `confirmDelete()` handlers + an AnimatePresence confirmation dialog with the same rose-themed layout as the card grid. On success: closes the drawer + calls `onStructureDeleted?.(structure.id)` (which was already in the props but unused before).

### fees-structures-confirm.tsx (publish safety)
- **Fix 5 (Publish safety)** — Expanded the Step 1 summary stats grid from 4 → 5 columns (added a "Fee Heads" stat showing the active head count). Added a sky-themed "Future dues only" clarification banner listing the three safety guarantees (future dues only, existing payments/receipts unchanged, existing concessions unchanged). Updated the Step 2 "What will happen" list to include all three safety guarantees explicitly. Added `ShieldCheck` to the lucide-react import.

### fees-settings.tsx (out-of-scope type-compat fix)
- Updated the Add Fee Head dropdown to include the new frequency options (`Half-Yearly`, `Per Term`) and renamed `One-time` → `One-Time` (the old value would now be a type error against the new `FeeHead.frequency` union).
- Updated the `onSave` handler to consume the new `addFeeHead` return value (`{ success, error }`) and toast the error if validation fails in the store, instead of unconditionally toasting success.

## Verification
1. `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → **0** (was 1 before fees-structures-detail.tsx FREQUENCIES fix; now 0)
2. `bun run lint 2>&1 | tail -3` → only the pre-existing `.eslintignore` deprecation warning (no errors)
3. `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` → **HTTP 200**

## Backward compatibility
- `computeHeadsTotal` signature unchanged — all callers (10+ in fee-store.ts and 3 in fees-structures-*.tsx) get the new annualized behavior automatically.
- `addFeeHead` / `updateFeeHead` return type widened from `void` to `{ success, error? }` — existing callers that ignore the return still work; only `fees-settings.tsx` was updated to consume the error result.
- `deleteFeeStructure` is purely additive (new mutation, no existing mutations changed).
- `FeeHead.frequency` rename of `'One-time'` → `'One-Time'` is a breaking type change but ALL seed data uses `'Annual'`/`'Monthly'`/etc. (no `'One-time'` literals existed in seed). Only 2 caller references needed updating (`fees-structures-detail.tsx:60` FREQUENCIES array + `fees-settings.tsx:224` dropdown option) — both updated.
- `FREQUENCY_MULTIPLIER` and `VALID_FREQUENCIES` are new exports, purely additive.
- Existing transactions (TXN001-TXN019) keep their historical amounts — `computeAccount` now derives `totalApplicable` from the new FEE_STRUCTURES totals, which produces reasonable dues (students who paid the old annual total now show as Paid; partial payers show Partially Paid with the new outstanding amount).

## Files touched (5)
- `src/lib/store/fee-store.ts` — frequency model + computeHeadsTotal + computeAccount + deleteFeeStructure + seed + validation
- `src/components/principal/modules/fees/fees-structures.tsx` — delete button + confirmation dialog
- `src/components/principal/modules/fees/fees-structures-detail.tsx` — delete action + dialog + REQ/ON labels + FREQUENCIES list
- `src/components/principal/modules/fees/fees-structures-confirm.tsx` — publish safety + Fee Heads stat + ShieldCheck import
- `src/components/principal/modules/fees/fees-settings.tsx` — minimal type-compat (frequency dropdown options + addFeeHead result consumption)
