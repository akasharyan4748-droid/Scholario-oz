# FEE-CREATE-DRAWER — Replace modal with drawer create mode

**Scope:** 2 files only.
- `src/components/principal/modules/fees/fees-structures.tsx`
- `src/components/principal/modules/fees/fees-structures-detail.tsx`

## What changed

### `fees-structures.tsx` (724 → 539 LOC, −185)

Removed the entire centered "Create New Fee Structure" modal:
- State: `showCreateDialog`, `createName`, `createClassLevel`, `createAcademicYear`, `createEffectiveDate`, `createNotes`, `createSubmitting`, `resetCreateForm`, `createValid`, `openCreateDialog`, `handleCreateDraft`
- `<Dialog open={showCreateDialog}>…</Dialog>` block (was lines 583–720)
- Local `CLASS_LEVELS` const (only used by the modal)
- Unused imports: `Dialog*`, `Input`, `Label`, `Textarea`, `Check`, `GraduationCap`

Added create-mode state:
```ts
const [createMode, setCreateMode] = useState(false)
const openCreateDrawer  = () => setCreateMode(true)
const closeCreateDrawer = () => setCreateMode(false)
const handleStructureDeleted = (id: string) => {
  if (openStructureId === id) setOpenStructureId(null)
}
```

The dashed "Create New Structure" card's `onClick` is now `openCreateDrawer` (was `openCreateDialog`).

Drawer rendering split into two `<AnimatePresence>` blocks:
```tsx
{/* existing structure */}
{openStructure && (
  <FeesStructuresDetailDrawer open structure={openStructure}
    onClose={() => setOpenStructureId(null)}
    onStructureDeleted={handleStructureDeleted} />
)}

{/* create mode */}
{createMode && (
  <FeesStructuresDetailDrawer open mode="create"
    onClose={closeCreateDrawer}
    onCreated={(id) => { setCreateMode(false); setOpenStructureId(id) }} />
)}
```

### `fees-structures-detail.tsx` (1366 → 1756 LOC, +390)

Extended `DetailDrawerProps`:
```ts
export interface DetailDrawerProps {
  open: boolean
  structure?: FeeStructureConfig | null   // optional for create mode
  mode?: 'view' | 'create'
  onClose: () => void
  onStructureDeleted?: (structureId: string) => void
  onCreated?: (id: string) => void
}
```

`FeesStructuresDetailDrawer` builds a blank template (`id: '__create__'`, empty heads/exam, version: 0, effectiveFrom: today) when `mode='create'` and forwards `isCreateMode` to `DetailDrawerInner`. Returns `null` only when `!isCreateMode && !structure`.

`DetailDrawerInner` adds:
- 6 new state hooks: `createName`, `createClassLevel` (default `'Pre-Primary'`), `createAcademicYear` (default `'2025-2026'`), `createEffectiveDate` (default today), `createNotes`, `createSubmitting`
- `useEffect` forces `editing = isCreateMode` on open (so the drawer is in edit mode from the start)
- Handlers: `createValid`, `createHasEdits`, `buildCreateNotes`, `handleCancelCreate` (with `window.confirm` discard check), `handleSaveDraft` (creates v1 draft, `onCreated(id)`), `handlePublishNew` (creates v1 draft + publishes v2 current, `onCreated(id)`)

Branches in the render tree (all gated on `isCreateMode`):
- **Header**: "Create New Fee Structure" + Sparkles "Draft" badge + working total (vs structure.className + VersionStatusPill + Annual Total)
- **Quick action bar**: hidden (no Edit/History/Duplicate/Archive/Delete — bottom bar carries Cancel/Save Draft/Publish New Version)
- **Edit-mode callout**: retitled "Create Mode" with create-specific copy
- **NEW "Structure Information" section**: 5 fields (Structure Name *, Class Range select *, Academic Year, Effective Date *, Notes)
- **Fee Heads + Exam Fee Schedule**: render normally (editing=true, Add Head / Add Exam Fee visible); start empty
- **Recent Activity + Pending versions**: hidden (no history/versions yet)
- **Bottom action bar**:
  - Cancel → `handleCancelCreate` (with discard confirmation if `createHasEdits`)
  - Save Draft → `handleSaveDraft` (disabled unless `createValid` + not submitting)
  - Publish New Version → `handlePublishNew` (disabled unless `createValid` + not submitting + `validationIssues.length === 0`)

`CLASS_LEVELS` const moved here (with `{value,label}` pairs: Pre-Primary=Nursery–UKG, Primary=Class 1–5, Middle=Class 6–8, Secondary=Class 9–10, Senior Secondary=Class 11–12).

## Verification

| Check | Result |
|---|---|
| `bunx tsc --noEmit 2>&1 \| grep -c "error TS"` | **0** |
| `bun run lint 2>&1 \| tail -40` | only pre-existing `.eslintignore` deprecation warning |
| `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` | **HTTP 200** (twice, ~3 s apart) |

## Backward compatibility

- `mode` defaults to `'view'` — every existing call site that omits it gets identical behaviour.
- `structure` is now optional, but only because create mode supplies a blank template; view-mode callers still pass a real `FeeStructureConfig`. The wrapper short-circuits to `null` only when `!isCreateMode && !structure`.
- `onCreated` is optional and only invoked in create mode — view-mode callers that don't pass it are unaffected.
- Existing edit / publish / schedule / duplicate / archive / delete / revert flows in the drawer are untouched — the create-mode branch is purely additive (the view-mode branch is the original code wrapped in an `else` rather than rewritten).
- Store mutations `createFeeStructure` + `publishFeeStructureVersion` are reused unchanged — the drawer can create a draft that already includes any fee heads / exam fees the user added inline before saving (a strict superset of the old modal which always created drafts with `heads: []`).
