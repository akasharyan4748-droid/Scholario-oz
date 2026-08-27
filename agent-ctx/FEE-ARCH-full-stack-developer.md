---
Task ID: FEE-ARCH
Agent: full-stack-developer (Fee Structure architecture correction)
Task: Fix create-structure flow + Fee Heads master/structure separation

# Scope

Three surgical correctness fixes to the Fee Management module — NO redesign,
NO store schema changes, NO mutation signature changes.

Files touched (3):
- `src/components/principal/modules/fees/fees-structures.tsx` — Fix 1
- `src/components/principal/modules/fees/fees-settings.tsx` — Fix 2
- `src/components/principal/modules/fees/fees-settings-payment.tsx` — Fix 3

Out of scope (per task): fee-store.ts mutations (addFeeHead, archiveFeeHead,
updateFeeHead, createFeeStructure, deleteFeeStructure), fees-overview,
fees-collections, fees-transactions, fees-approvals, fees-pending-dues,
fees-structures-detail, fees-structures-confirm, fees-structures-history,
fees-structures-shared, fees-shell, fees-shared, fees-receipt,
fees-collect-payment, fees-reports, fees-charts.

# Fix 1 — "Create New Structure" must NOT auto-create (fees-structures.tsx)

## Bug
The dashed "Create New Structure" motion.button at the end of the structure
grid had an inline onClick that immediately called
`createFeeStructure({ category: 'Custom', className: 'New Structure',
classLevel: 'Pre-Primary', heads: [ dummy ₹0 'Tuition' Annual ], ... })`.
A single click wrote a real record to the store.

## Fix
Replaced the auto-create onClick with a creation dialog. The button now
calls `openCreateDialog()` which resets the form and sets
`showCreateDialog=true`. Only the "Create Draft" button inside the dialog
calls `createFeeStructure(...)` with the user-entered data. Cancel has no
side effects.

### New state (in FeesStructuresSection)
```ts
const todayStr = new Date().toISOString().split('T')[0]
const [showCreateDialog, setShowCreateDialog] = useState(false)
const [createName, setCreateName] = useState('')
const [createClassLevel, setCreateClassLevel] = useState<string>(CLASS_LEVELS[0])
const [createAcademicYear, setCreateAcademicYear] = useState('2025-2026')
const [createEffectiveDate, setCreateEffectiveDate] = useState<string>(todayStr)
const [createNotes, setCreateNotes] = useState('')
const [createSubmitting, setCreateSubmitting] = useState(false)
```

`CLASS_LEVELS = ['Pre-Primary', 'Primary', 'Middle', 'Secondary',
'Senior Secondary']` — matches the `classLevel` vocabulary already used by
the FEE_STRUCTURES seed and `computeAccount` (so newly-created drafts are
picked up by the fee-account derivation logic).

### Dialog fields
- Structure Name (Input, required, autoFocus, placeholder "e.g. Class 9–10")
- Class / Class Range (native select, required, CLASS_LEVELS options)
- Academic Year (Input, default "2025-2026")
- Effective Date (Input type="date", required, default today)
- Notes (Textarea, optional)
- "Draft workflow" callout explaining: no fee heads yet, no student impact
  until publish
- Cancel button → `setShowCreateDialog(false)` (no record written)
- Create Draft button → `handleCreateDraft()`

### handleCreateDraft
- Validates `createName.trim()` and `createEffectiveDate` are non-empty
  (toasts an error otherwise).
- Combines Academic Year + Notes into a single `notes` string
  (`"Academic Year: 2025-2026 · <notes>"`) — `createFeeStructure`'s input
  type has no academicYear prop, so this preserves the academic-year info
  without changing the mutation signature.
- Calls `createFeeStructure({ category: createClassLevel, className:
  createName.trim(), classLevel: createClassLevel, heads: [],
  effectiveFrom: createEffectiveDate, notes: ..., actor: 'Principal' })`.
  `heads: []` is intentional — the draft starts with NO fee heads (the
  user adds them in the detail drawer, mirroring the FEE-CORRECT "Draft"
  workflow).
- On success → toast.success + close dialog + reset form +
  `setOpenStructureId(newId)` (opens the detail drawer for editing).
- On failure → toast.error.

### Imports added
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription` from `@/components/ui/dialog`
- `Input, Label, Textarea` from `@/components/ui/{input,label,textarea}`
- `Check, GraduationCap` from `lucide-react`

The new "Create New Structure" card subtitle was rewritten from "Start
with a draft. Add fee heads, then publish when ready." to "Fill in the
basics, then add fee heads in the next step." to match the new flow.

# Fix 2 — Fee Heads Settings master catalogue (fees-settings.tsx)

## Bug
The previous `FeeHeadsSettings` built `allHeads` by
`feeStructures.flatMap((s) => s.components.map((c) => ({ ...c, structureId:
s.id, structureName: s.className })))`. This produced a per-structure
duplicate row for every shared head name — e.g. "Tuition" appeared 5 times
(once per class level), with no indication that they were the same master
fee head. The list mixed the master fee head catalogue with
structure-specific pricing.

## Fix
Replaced the per-structure list with a MASTER FEE HEAD CATALOGUE — unique
fee head names across all structures, with a per-row breakdown of which
structures use the head + the frequencies observed + an Active/Archived/
Mixed status. The catalogue is computed in the UI (not stored), exactly
per the task spec's `useMemo` pattern.

### masterHeads useMemo (verbatim per spec)
```ts
const masterHeads = useMemo(() => {
  const nameMap = new Map<string, {
    name: string; structures: string[]
    anyActive: boolean; anyArchived: boolean; frequencies: Set<string>
  }>()
  feeStructures.forEach((s) => {
    s.components.forEach((c) => {
      const existing = nameMap.get(c.name)
      if (existing) {
        existing.structures.push(s.className)
        if (c.active) existing.anyActive = true
        if (!c.active) existing.anyArchived = true
        existing.frequencies.add(c.frequency)
      } else {
        nameMap.set(c.name, {
          name: c.name, structures: [s.className],
          anyActive: c.active, anyArchived: !c.active,
          frequencies: new Set([c.frequency]),
        })
      }
    })
  })
  return Array.from(nameMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}, [feeStructures])
```

### Tab filter — [All] [Active] [Archived]
Three buttons at the top of the panel. Default: `all`. A "Mixed" head
(active in some structures, archived in others) appears in BOTH the
Active and Archived tabs (anyActive OR anyArchived). Each tab button
shows the count.

### Per-master-head row
Each row shows:
- Icon (IndianRupee, emerald if anyActive, muted if all archived)
- Name (e.g. "Tuition")
- Status badge: Active (emerald) / Archived (muted) / Mixed (amber)
  — computed as `anyActive && anyArchived ? 'Mixed' : anyActive ? 'Active' :
  'Archived'`
- Sub-line: "Used in N structure(s) · Frequencies: Monthly, Annual"
- Actions:
  - "Archive All" (amber ghost button) — shown only if `h.anyActive`.
    Calls `archiveFeeHead(structureId, headId)` in a loop for every
    active instance of that name across all structures.
  - "Restore All" (emerald ghost button) — shown only if `h.anyArchived`.
    Calls `updateFeeHead(structureId, headId, { active: true })` in a
    loop for every archived instance — uses the EXISTING updateFeeHead
    mutation (which already accepts a `Partial<FeeHead>` patch).
  - ChevronUp/ChevronDown toggle button — expands/collapses the
    per-structure breakdown.

### Expanded per-structure breakdown (View Details)
When a row is expanded (`expanded.has(name)`), a sub-panel renders below
the row showing each instance:
- Status dot (emerald if active, muted if archived)
- Structure name (e.g. "Class 1–5")
- Frequency · Mandatory/Optional
- Amount (font-mono, formatted INR)
- "Active" / "Archived" pill

`getInstances(name)` is a non-memoized helper that iterates
`feeStructures` and collects every component whose `name` matches — used
by both the expanded view and the Archive All / Restore All handlers. It's
only called for expanded rows + when an action button is clicked, so the
per-render cost is negligible.

### Store mutations used
- `addFeeHead(structureId, head)` — UNCHANGED. Still used by the
  existing AddFeeHeadDialog.
- `archiveFeeHead(structureId, headId)` — UNCHANGED. Called in a loop
  by "Archive All".
- `updateFeeHead(structureId, headId, { active: true })` — UNCHANGED.
  Called in a loop by "Restore All". The existing mutation already
  accepts a `Partial<FeeHead>` patch, so no signature change was needed.

### AddFeeHeadDialog
Unchanged — still wired to addFeeHead, still shows the structure picker +
name + amount + frequency + mandatory toggle.

### Imports added to fees-settings.tsx
- `useMemo` from `react`
- `ChevronDown, ChevronUp, RotateCcw` from `lucide-react`

### Panel subtitle
Changed from "{N} active · {N} archived" (per-structure counts) to
"{activeCount} active · {archivedCount} archived · {masterHeads.length}
unique head names" — the unique-names count is the master-catalogue
signal.

### Scrollable list
`max-h-96 overflow-y-auto` on the rows container (per the UI rule for
long lists) — previously the list grew unbounded.

# Fix 3 — Payment method availability states (fees-settings-payment.tsx)

## Bug
The AcceptedPaymentMethods section showed online/offline grouping with
toggles, but the only "not available" signal was a small amber text
"Enabled but not yet available to parents — configure gateway or UPI QR
to activate." shown only when an ONLINE method was enabled but no gateway
was connected. There was no per-method status badge and the availability
check treated Bank Transfer as always-available offline (which is wrong
— parents need an active bank account to send money to).

## Fix
Purely visual — toggle logic unchanged. Updated `isAvailable()` to match
the spec, added a status badge next to each method, and replaced the
single amber text with a per-method "Configuration required" hint.

### New isAvailable() (switch on mode)
```ts
const isAvailable = (mode: PaymentMode): boolean => {
  switch (mode) {
    case 'Cash':
    case 'Cheque':
      return true
    case 'Bank Transfer':
      return bankAccounts.some((b) => b.status === 'active')
    case 'UPI':
      if (upiQrConfigs.some((c) => c.status === 'active')) return true
      return !!gatewayConfig && (gatewayConfig.status === 'connected' ||
        gatewayConfig.status === 'test_mode')
    case 'Card':
    case 'Net Banking':
      return !!gatewayConfig && (gatewayConfig.status === 'connected' ||
        gatewayConfig.status === 'test_mode')
    default:
      return false
  }
}
```

Added `const bankAccounts = useFeeStore((s) => s.bankAccounts)` to
AcceptedPaymentMethods.

### Status badge (getStatusBadge)
Returns one of three pill components based on the mode's state:
- `!config.active` → "Disabled" (muted, with Ban icon)
- `config.active && isAvailable(mode)` → "Available" (emerald, with
  Check icon)
- `config.active && !isAvailable(mode)` → "Configuration required"
  (amber, with AlertTriangle icon)

Rendered inline next to the method label (between the label and the
existing "ref required" / "cheque details" tags).

### Per-method configuration hint (getConfigHint)
When `config.active && !available`, a small amber text below the
description tells the user exactly what to configure:
- UPI → "Connect a payment gateway OR add an active UPI QR to make UPI
  available to parents."
- Card / Net Banking → "Connect a payment gateway (Razorpay / Cashfree
  / PayU) to enable card / net-banking payments."
- Bank Transfer → "Add at least one active bank account so parents have
  a destination for NEFT / RTGS / IMPS."

This replaces the old single generic "configure gateway or UPI QR"
message with method-specific guidance.

### Imports changed
- Added `AlertTriangle` to the lucide-react import block.
- Removed `Info` (was only used by the old generic amber message; no
  longer used after replacing it with the per-method hint).

### What did NOT change
- The toggle button (the `relative h-5 w-9` pill with sliding white
  circle) — unchanged.
- `togglePaymentMode(modeId)` is still the only mutation called when the
  user clicks the toggle.
- The "Online Methods" / "Offline Methods" group labels and the
  METHOD_GROUPS / METHOD_DESCRIPTION / METHOD_ICON constants — unchanged.

# Verification

## TS check
`cd /home/z/my-project && bunx tsc --noEmit 2>&1 | grep -c "error TS"`
→ **0** (was 0 before, still 0 after)

## Lint check
`cd /home/z/my-project && bun run lint` → only the pre-existing
`.eslintignore` deprecation warning, no errors.

## Dev server
`curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/`
→ **HTTP 200**

# Backward compatibility

- `createFeeStructure` mutation signature: UNCHANGED. The UI now passes
  `heads: []` instead of a dummy `[Tuition ₹0 Annual]`, but the
  mutation's input type is unchanged.
- `addFeeHead`, `archiveFeeHead`, `updateFeeHead`: UNCHANGED. Same
  signatures, same return types. The new "Restore All" action uses
  `updateFeeHead(structureId, headId, { active: true })` — the existing
  mutation already accepts `Partial<FeeHead>`, so no signature change
  was needed.
- Store state shape: UNCHANGED. The master fee head catalogue is
  computed in the UI via `useMemo`, not stored. No new state.
- Existing fee structures and versions: UNCHANGED. The 5 seed
  structures (FS01–FS05) and all existing FeeStructureVersion snapshots
  remain intact. The new "Create Draft" flow only adds new structures
  via the same `createFeeStructure` mutation the old auto-create used.
- Payment method toggle: UNCHANGED. `togglePaymentMode(modeId)` is
  still the only mutation called from the toggle button. The new
  `isAvailable()` + status badge is pure display logic.

# Files touched

1. `src/components/principal/modules/fees/fees-structures.tsx`
   - Added: `CLASS_LEVELS` constant
   - Added: 7 state vars + `resetCreateForm` + `openCreateDialog` +
     `handleCreateDraft` + `createValid`
   - Replaced: dashed "Create New Structure" card onClick (was inline
     `createFeeStructure(...)`) → now `openCreateDialog()`
   - Added: `<Dialog>` block at the bottom of the section with 5 form
     fields + Cancel / Create Draft buttons
   - Imports: + Dialog primitives, + Input/Label/Textarea,
     + Check/GraduationCap icons
   - Net delta: ~145 LOC (509 → 724, but ~120 of that is the dialog JSX)

2. `src/components/principal/modules/fees/fees-settings.tsx`
   - Replaced: entire `FeeHeadsSettings` component body (was 67 LOC,
     now ~280 LOC including the master catalogue, tab filter, expanded
     per-structure breakdown, Archive All / Restore All handlers)
   - Imports: + useMemo, + ChevronDown/ChevronUp/RotateCcw icons
   - Net delta: ~210 LOC (449 → 565)

3. `src/components/principal/modules/fees/fees-settings-payment.tsx`
   - Replaced: `isAvailable()` function (now a switch per the spec,
     including the new Bank Transfer → active bank account check)
   - Added: `bankAccounts` selector in AcceptedPaymentMethods
   - Added: `getStatusBadge()` + `getConfigHint()` helpers
   - Replaced: single generic amber "not yet available" text → per-method
   status badge + per-method configuration hint
   - Imports: + AlertTriangle, - Info (no longer used)
   - Net delta: ~75 LOC (1160 → 1235)
