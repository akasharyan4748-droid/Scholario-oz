# FS-IMPL — Fee Structure Versioning Implementation

**Task ID:** FS-IMPL
**Agent:** full-stack-developer (Fee Structure versioning)
**Scope:** Implement the versioned Fee Structure system per FS-AUDIT recommendations.

## Plan

### Phase 3 — fee-store.ts (data model + mutations)
- Add `FeeStructureStatus`, `FeeStructureVersion`, `FeeChangeLogAction`, `FeeChangeLog` types (backward-compatible, additive).
- Add `versions: FeeStructureVersion[]` and `changeLog: FeeChangeLog[]` to FeeState.
- Seed `SEED_VERSIONS` from `FEE_STRUCTURES` (each existing structure becomes Version 1, status='current').
- Add 6 new mutations:
  1. `createFeeStructure(structureData)` — creates a new structure + Version 1 (draft)
  2. `publishFeeStructureVersion(structureId, newHeads, effectiveFrom, reason)` — creates new current version, marks previous as archived
  3. `scheduleFeeStructureVersion(structureId, newHeads, effectiveFrom, reason)` — creates a scheduled version
  4. `archiveFeeStructureVersion(versionId)` — marks a version as archived
  5. `revertFeeStructureVersion(structureId, targetVersionId, reason)` — creates a NEW version based on target (preserves audit trail)
  6. `updateFeeStructureDraft(versionId, changes)` — updates a draft version before publishing
- Each mutation:
  - Adds a `FeeChangeLog` entry (immutable)
  - Updates `feeStructures` (live pointer) + structure's `version` + `effectiveFrom` + `supersededBy`
  - Calls `useCommunicationStore.createAnnouncement` + `sendAnnouncement` (relatedModule: 'Fee Management')
- Keep existing `addFeeHead`/`updateFeeHead`/`archiveFeeHead` working — also push a FeeChangeLog entry, and keep the matching version's `heads` in sync.

### Phase 4 — fees-structures-detail.tsx (NEW)
Slide-from-right drawer (motion.div pattern, matching `fees-student-accounts.tsx`):
- Header: structure name + level + year + current version + status + effective date + last updated + updated by
- Actions: Edit, Duplicate, Create New Version, View History, Compare Versions, Archive, Restore, Delete
- Fee Head Table: each fee head as a row with Fee Head, Amount, Frequency, Mandatory/Optional, Applicable To, Effective From, Status, Last Modified, Actions
- Edit mode: inline editing of fee heads with validation
- Add Head form: Fee Head Name, Amount, Frequency, Mandatory/Optional, Applicable Classes, Effective Date, Description

### Phase 5 — fees-structures-confirm.tsx (NEW)
Review dialog with:
- Step 1: Review Changes (OLD → NEW for each changed fee head, Effective Date, Affected classes + student count, Reason field)
- Step 2: Confirm (with "Confirm & Publish" button)
- For high-impact changes (affecting > 100 students or > 10% increase): require typing "UPDATE FEE STRUCTURE" before final confirmation

### Phase 6 — fees-structures-history.tsx (NEW)
History view:
- Lists all versions (Version N, Created date, Effective date, Created by, Status, Changes summary)
- Allows selecting 2 versions to compare
- Comparison table: Fee Head | Old | New | Change (with +₹ amounts, color-coded)
- Shows Old Total, New Total, Total Difference, Percentage Difference

### Phase 7+8 — fees-structures.tsx (upgrade card grid)
- Show: structure name, level, current version, status, effective date, total, heads count, last updated
- Actions: Open (opens detail drawer), Edit, History, More (dropdown with Duplicate, Archive, Delete)
- Wire all actions to real store mutations (no more toast-only placeholders)
- Status pills on each card (CURRENT emerald, SCHEDULED amber, DRAFT slate, ARCHIVED muted)

## Verification
1. `bun run lint` — 0 errors
2. `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` — HTTP 200
3. `bunx tsc --noEmit 2>&1 | grep -E "fee-store|fees-structures" | head -20` — empty
