# DASH-2 — Certificates + Downloads visual restoration

**Agent**: full-stack-developer
**Scope**: `src/components/principal/modules/certificates/`, `src/components/principal/modules/downloads/`, `src/components/shared/document-primitives.tsx`
**Out of scope**: dashboard, fees, salary, exams, etc. (Dashboard is being redesigned in parallel)

## Context absorbed from prior agents
- Task 1 — Academics design language spec
- Task 2-A/2-B — visual spec + component divergence analysis
- Task 12 — Certificates rainbow collapse (7-hue → single emerald)
- Task 9-D — Operations convergence (PageTransition + SegmentedTabs + shared Panel)
- Task DASH-C — Certificates + Downloads visual audit (the spec this task follows)
- Task DASH-B — shared primitives audit (recommendation to build `document-primitives.tsx`)

## Files changed (with file:line refs)

### `src/components/shared/document-primitives.tsx` (extension)
- Synced icons to match `cert-shared.tsx` DOC_TYPES: `bonafide → FileText`, `migration → GraduationCap`, `marksheet → ClipboardList` (lines 91–108).
- Added title-case aliases for all 7 doc types (`'Bonafide'`, `'ID Card'`, `'Fee Receipt'`, etc.) so callers can pass the Cert store's `DocType` union directly to `DocumentThumbnail`/`DocumentCard` without a kebab-case translation step.
- Added `getDocTypeMeta(docType?: string)` helper for forward-compat (line 111–114).
- Fixed `DocumentCard` selected-state bug: `ts.border.replace('/20', '/20')` was a no-op. Now `ts.border.replace(/^border-/, 'ring')` correctly converts e.g. `border-emerald-500/20` → `ring-emerald-500/20` so the selected ring actually renders (line 282).

### `src/components/principal/modules/certificates/generate-tab.tsx`
- Replaced `accentClasses` import with `DocumentCard, DocumentThumbnail, getDocTypeMeta` from `@/components/shared/document-primitives` (lines 39–44). Removed `Info` icon import (no longer used after empty-state rewrite).
- **Doc-type selector** (lines 207–227): 3-col `grid-cols-3 gap-2` of tiny `p-2.5` cards → 2-col `grid-cols-1 sm:grid-cols-2 gap-3` of `DocumentCard` per doc type. Each card has `DocumentThumbnail size="md"` (paper silhouette + emerald edge stripe + doc-type glyph), name (`text-sm font-semibold`), description (`text-xs`), category badge from `DOC_TYPE_META`. Selected state is driven by `DocumentCard`'s built-in `border-2 + ring-2` styling.
- **SelectedDocChip** (lines 443–454): tiny `px-3 py-2` chip with `h-3.5 w-3.5` icon → substantial `rounded-xl border-2 border-emerald-500/40 ring-2 ring-emerald-500/20 px-3 py-2.5` indicator with `DocumentThumbnail docType size="sm"` + name (`text-sm font-semibold`) + description. The "Change" affordance remains in the parent CertPanel header.
- **PreviewArea empty state** (lines 519–534): flat `CertEmptyState` with `Info` icon → refined document placeholder: large `DocumentThumbnail size="xl" tone="emerald"` on a soft blurred emerald canvas with "Select a document type" label + supporting text. Feels like a document canvas waiting for input.
- **PreviewArea when selected** (lines 536–562): kept the existing rich previews (`CertificatePreview`, `MarksheetPreview`, `IDCardPreview`, `FeeReceiptPreview`) — they were already rendering correctly.

### `src/components/principal/modules/certificates/templates-tab.tsx`
- Added `DocumentThumbnail` import (line 38).
- **Template card MiniPreview pane** (line 221): bumped from `h-28` → `h-36` for more document presence.
- **Template card footer info** (lines 233–248): replaced the `h-2.5 w-2.5` accent color swatch with `DocumentThumbnail docType={template.docType} size="sm"` — gives each template card real document identity (paper silhouette + doc-type glyph + emerald edge stripe).

### `src/components/principal/modules/certificates/history-tab.tsx`
- Added `DocumentIcon` import (line 44).
- **History row doc-type indicator** (lines 219–224): `h-7 w-7` rounded-lg chip with `h-3.5 w-3.5` icon → `DocumentIcon docType={doc.docType} size="md"` (h-10 w-10). Single emerald accent preserved (driven by `DOC_TYPE_META[docType].tone === 'emerald'`). The `Icon` local variable was removed since the icon now comes from the shared primitive.
- Type pill now uses `d.short` (lines 232–237) — same as the cert module's doc-type short label for consistency with the generate-tab cards.
- Padded the row cells to `py-2.5` (was `py-2`) for visual consistency with the taller icon.

### `src/components/principal/modules/downloads/document-list.tsx`
- Removed `DocIcon, FormatBadge` imports from `./downloads-shared` (no longer needed). Added `DocumentThumbnail, FileTypeBadge` from `@/components/shared/document-primitives` + `DocFormat` type import (lines 34–37).
- **Document column** (line 155): `DocIcon format size="md"` (h-9 w-9 icon tile, h-4 w-4 glyph only) → `DocumentThumbnail format={doc.format as DocFormat} size="sm"` (paper silhouette h-10 w-8 with format edge stripe: PDF=rose, XLSX=emerald, DOCX=sky). Much more document-like.
- **Format column** (line 185): local `FormatBadge` → shared `FileTypeBadge format={doc.format as DocFormat}` (lines 183–186). Same semantic role, shared primitive.

### `src/components/principal/modules/downloads/index.tsx`
- Removed `DocIcon, FormatBadge` imports from `./downloads-shared`. Added `DocumentThumbnail, FileTypeBadge` + `DocFormat` type from shared primitives (lines 48–51).
- **QuickAccess** (lines 243–316): replaced the `flex flex-wrap gap-1.5` chip row (with `!h-6 !w-6 !rounded-full` DocIcon overrides — read as pills, not documents) with a `grid grid-cols-2 sm:grid-cols-3 gap-2` of compact document cards. Each item: `DocumentThumbnail format size="sm"` + name (`text-xs font-semibold truncate`) + `FileTypeBadge size="xs"` + small `Download` icon button (h-7 w-7, emerald on hover). Reads like a real document, not a pill.

### `src/components/principal/modules/downloads/document-detail.tsx`
- Added imports: `useStudentsStore`, `useFeeStore`, `useCertificatesStore` types (`DocumentTemplate`, `GeneratedDocument`), `DocumentThumbnail` from shared primitives, `DocFormat` type, `Avatar` from `@/components/shared/avatar`, and the four preview components (`CertificatePreview`, `MarksheetPreview`, `IDCardPreview`, `FeeReceiptPreview`) + `MarksheetData` type from `../certificates/previews` (lines 11–36).
- Removed unused `recordPreview` declaration (was declared but never called).
- **Cert bridge resolution** (lines 81–95): resolves `certDoc` + `certTemplate` + `certStudent` + `certTxn` + `certMarksheet` from the underlying cert doc so the drawer can render the actual preview. The cert-doc bridge ID pattern `doc-gen-${cert.id}` is unchanged.
- **Drawer preview area** (lines 144–205):
  - **Generated cert docs**: renders `DrawerCertPreview` which delegates to `CertificatePreview` / `MarksheetPreview` / `IDCardPreview` / `FeeReceiptPreview` based on `certDoc.docType` (new helper at lines 373–421). Wraps the preview in a slate-100 canvas + a footer line with the doc type + format + generation date.
  - **Non-generated docs** (forms, templates, reports): the old generic `FileText` icon with emerald blur glow is replaced by `DocumentThumbnail size="xl"` with the format-specific edge stripe (PDF=rose, XLSX=emerald, DOCX=sky, CSV=teal, JPG=violet) on a format-tinted blur canvas. A smaller `DocumentThumbnail size="md"` + `FormatBadge` sits in the header row. Reads as a real document placeholder, not a generic icon.
- **Download CTA** (line 212): collapsed `bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700` → solid `bg-emerald-600 hover:bg-emerald-700` (Academics canonical pattern, no gradient on primary CTAs).
- **"Issued to" meta row** (lines 275–289): plain text → text + `Avatar name={doc.studentName} size="sm"` from the shared avatar system, for real visual identity.

## Verification

- `cd /home/z/my-project && bun run lint` — 0 errors.
- `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` — HTTP 200.
- `cd /home/z/my-project && bunx tsc --noEmit 2>&1 | grep -E "certificates/|downloads/" | head -20` — empty (no type errors in my scope). The remaining tsc errors are in dashboard / exams / finance-store / analytics — out of my scope (Dashboard is being redesigned by another agent; exams/finance errors are pre-existing).

## Preserved

- All 7 doc types (Bonafide, Transfer, Character, ID Card, Fee Receipt, Migration, Marksheet) and their generation logic.
- Template CRUD (set default, duplicate, toggle, preview).
- History table with filter, sort, search, download, regenerate, mark issued, delete.
- The cert→download bridge (generated docs appear in Downloads as `doc-gen-${id}`).
- The slide-from-right drawer in Downloads.
- Document list table, search, filters, sort.
- All forms, validation, preview rendering.
- Single emerald accent in Certificates (NO rainbow).
- Format-specific tints in Downloads (PDF=rose, XLSX=emerald, DOCX=sky) — semantic, not decorative.
- Shared `Panel` (CertPanel + DownloadsPanel re-exports).
- Shared `SegmentedTabs`.
- shadcn `<Button>` h-8 text-xs pattern with solid emerald primary.
