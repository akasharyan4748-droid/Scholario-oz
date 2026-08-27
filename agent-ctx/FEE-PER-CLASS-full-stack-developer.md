# FEE-PER-CLASS — Per-class fee structures

**Task ID:** FEE-PER-CLASS
**Agent:** full-stack-developer (Per-class fee structures)
**Task:** Change fee structures from class-range to per-class model

## Scope (3 in-scope files, per task spec)

- `src/lib/store/fee-store.ts` — FeeStructureConfig seed, computeAccount, helpers, byCategory, deleteFeeStructure
- `src/components/principal/modules/fees/fees-structures-detail.tsx` — create-mode UI (remove Structure Name, use class select from school config)
- `src/components/principal/modules/fees/fees-structures.tsx` — card grid (show class name, not structure name)

NOT touched (per task scope): every other fees-* component + create-exam-fullscreen.tsx (the existing classLevel-based exam fee resolution continues to work via computeAccount's classLevel fallback).

## Work Log

### Phase 0 — Read context
- Read `/home/z/my-project/worklog.md` (11,971 lines) end-to-end for prior Fee work: FEE-AUDIT, FS-IMPL (versioning), FEE-CORRECT (frequency model + delete bug), FEE-EXAM (per-exam fee schedule), FEE-EXAM-FIX (plannedInstances UI), FEE-CREATE-DRAWER (drawer create mode), FEE-CREATE-UI (compact create-mode header).
- Read `src/lib/mock/academic/classes.ts` — the school's 12 actual configured classes (C01 Pre-Nursery, C03 KG, C05 Class 2, C07 Class 4, C09 Class 6, C11 Class 8, C12 Class 9, C13 Class 10, C14-PCM Class 11, C14-PCB Class 11, C15-PCM Class 12, C15-PCB Class 12). The students store (`useStudentsStore.classes`) surfaces these as `ClassRecord[]` with `{ id, name, grade, level, stream? }`.
- Read `src/lib/store/students-store/types.ts` — confirmed `ClassRecord` has `name`, `level` (Pre-Primary / Primary / Middle / Secondary / Senior Secondary), and `stream` (only set for Class 11/12 PCM/PCB).
- Read `src/lib/store/fee-store.ts` (2470 LOC) in full — confirmed `FeeStructureConfig` (id, category, className, classLevel, annual, components, effectiveFrom, version, examFeeSchedule?), `FEE_STRUCTURES` seed (5 range-based: FS01 Nursery–UKG, FS02 Class 1–5, FS03 Class 6–8, FS04 Class 9–10, FS05 Class 11–12), `computeAccount` matching by `student.className` substring → `classLevel`, `countStudentsForClassLevel(classLevel)` helper, byCategory distribution using `FEE_STRUCTURES.find((f) => f.classLevel === classLevel)`.
- Read `fees-structures-detail.tsx` (1739 LOC) — confirmed `CLASS_LEVELS` const (5 range labels), `createName` / `createClassLevel` state, create-mode header with Structure Name input + class range select + AY + Effective Date + Notes.
- Read `fees-structures.tsx` (539 LOC) — confirmed card grid shows `{f.className}` (title) + `{f.category}` (subtitle), `studentsByLevel` map, `CATEGORY_COLORS` keyed by category ('Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior').

### Phase 1 — Update `src/lib/store/fee-store.ts` (2470 → 2536 LOC, +66)

#### 1a. Replace FEE_STRUCTURES seed (lines 461-578)
Replaced 5 range-based structures with 6 per-class structures per the spec:
- **FS01** Pre-Nursery (Pre-Primary): Tuition ₹3,500/mo, Transport ₹1,200/mo, Activity ₹4,000/yr + UT×4 ₹50 + HY ₹200 + Annual ₹300. Annual recurring = ₹60,400.
- **FS02** Class 2 (Primary): Tuition ₹4,000/mo, Transport ₹1,500/mo, Library ₹2,000/yr, Activity ₹3,000/yr + UT×4 ₹100 + HY ₹300 + Annual ₹500. Annual = ₹71,000.
- **FS03** Class 6 (Middle): Tuition ₹5,500/mo, Transport ₹1,800/mo, Library ₹3,000/yr, Activity ₹3,000/yr + UT×4 ₹100 + HY ₹500 + Annual ₹700. Annual = ₹93,600.
- **FS04** Class 9 (Secondary): Tuition ₹7,000/mo, Transport ₹2,000/mo, Library ₹4,000/yr, Activity ₹4,000/yr + UT×4 ₹100 + HY ₹500 + Annual ₹700 + Pre-Board ₹600. Annual = ₹1,16,000.
- **FS05** Class 10 (Secondary): Same as Class 9 + Board Examination Fee ₹500 (One-Time). Annual = ₹1,16,500.
- **FS06** Class 12 (Senior Secondary): Tuition ₹9,000/mo, Transport ₹2,200/mo, Library ₹5,000/yr, Activity ₹5,000/yr + UT×4 ₹100 + HY ₹500 + Annual ₹800 + Pre-Board ₹600 + Practical×2 ₹500. Annual = ₹1,44,400.

`className` = the actual class name (e.g. "Class 9", "Pre-Nursery"); `classLevel` = the level bucket (Pre-Primary / Primary / Middle / Secondary / Senior Secondary); `category` set to the same value as `classLevel` (per spec — "category can be removed or set to the same value as classLevel"). The `FeeStructureConfig` interface is UNCHANGED (backward compatible).

#### 1b. Add `studentClassLevel` + `findStructureForStudent` helpers (lines 639-665)
- Exported `studentClassLevel(className: string): string` — derives the level bucket from a student's className via the existing substring rules (Class 11/12 → Senior Secondary; Class 9/10 → Secondary; Class 6-8 → Middle; Class 1-5 → Primary; else Pre-Primary).
- Exported `findStructureForStudent(className: string): FeeStructureConfig | undefined` — FEE-PER-CLASS matching: tries an EXACT `className === f.className` match first (e.g. student className="Class 9" → FS04 with className="Class 9"). Falls back to `studentClassLevel(className)` substring matching when no exact match exists (e.g. student className="Class 4" → no exact match → classLevel="Primary" → finds FS02 with classLevel="Primary").

#### 1c. Replace `countStudentsForClassLevel` with `countStudentsForStructure` (lines 667-692)
- New `countStudentsForStructure(struct: { className: string; classLevel: string })` — tries exact className match first (so a Class 9 structure reports only Class 9 students, not all Secondary students); falls back to classLevel substring matching when no student has the exact className.
- Kept `countStudentsForClassLevel(classLevel)` as a legacy alias (delegates to `countStudentsForStructure({ className: '', classLevel })`) for any external caller that still imports the old signature.

#### 1d. Migrate all 12 internal callers of `countStudentsForClassLevel`
Updated callers in `addFeeHead` (line 1372), `updateFeeHead` (1439), `archiveFeeHead` (1484), `createFeeStructure` (1545), `publishFeeStructureVersion` (1621, 1624), `scheduleFeeStructureVersion` (1671, 1674), `archiveFeeStructureVersion` (1704, 1708), `revertFeeStructureVersion` (1780, 1783) to use `countStudentsForStructure(struct)` / `countStudentsForStructure({ className: ..., classLevel: ... })` so the `affectedStudents` field in the changeLog reflects per-class student counts.

#### 1e. Update `computeAccount` (lines 2243-2254)
Removed the inline substring-based `classLevel` computation + `FEE_STRUCTURES.find((f) => f.classLevel === classLevel)` lookup; replaced with `findStructureForStudent(student.className)` so the student's fee account is computed against the EXACT-match per-class structure (with classLevel fallback). The unused `classLevel` local variable was removed (was only referenced in comments). `regularFeesTotal`, `examFeeTotal`, `totalApplicable` derivation is unchanged.

#### 1f. Update `useFeeData` byCategory distribution (lines 2444-2460)
The category breakdown previously used `FEE_STRUCTURES.find((f) => f.classLevel === ...)` for each account; now uses `findStructureForStudent(a.className)` so per-class structures are matched exactly (e.g. a Class 10 student's category breakdown uses FS05's components, not FS04's via the first-Secondary-match fallback).

#### 1g. Update `deleteFeeStructure` archived-structure financial-record check (lines 1864-1879)
The safeguard previously checked if any transaction's student is in the same classLevel; now tries exact className match first (so a Class 9 structure only blocks deletion when Class 9 students have txns), falls back to classLevel substring matching when no student has the exact className.

### Phase 2 — Update `src/components/principal/modules/fees/fees-structures-detail.tsx` (1739 → 1754 LOC, +15)

#### 2a. Remove `CLASS_LEVELS` constant (was lines 85-97)
The 5 range labels (Nursery–UKG / Class 1–5 / Class 6–8 / Class 9–10 / Class 11–12) are no longer needed — the create-mode class select now pulls from the school's actual classes via `useStudentsStore.classes`.

#### 2b. Replace `createName` + `createClassLevel` state with `createClassId` (lines 167-203)
- Removed `createName` state (the structure's name is now derived from the selected class — there is no "Structure Name" field per spec).
- Removed `createClassLevel` state (the level is now derived from the selected class's `level` field).
- Added `createClassId` state (default empty) — holds the school class id selected in the Class select.
- Added `schoolClasses = useStudentsStore((s) => s.classes)` to read the school's configured classes.
- Added `selectedClass = useMemo(() => schoolClasses.find(c => c.id === createClassId) ?? null, [schoolClasses, createClassId])` so handlers can read the class's `name` + `level` directly.

#### 2c. Update `useEffect` reset (lines 222-232)
Now resets `createClassId` (instead of `createName` + `createClassLevel`) to empty when entering create mode.

#### 2d. Update `createValid` (lines 438-445)
Now checks `!!selectedClass && createClassId.trim().length > 0 && !!createEffectiveDate` (was `createName.trim().length > 0 && createClassLevel.trim().length > 0 && !!createEffectiveDate`).

#### 2e. Update `createHasEdits` (lines 452-462)
Now checks `createClassId.trim().length > 0 || createAcademicYear.trim().length > 0 || createEffectiveDate !== today || createNotes.trim().length > 0 || workingHeads.length > 0 || workingExamSchedule.length > 0` (was `createName.trim().length > 0 || createClassLevel.trim().length > 0 || ...`).

#### 2f. Update `buildCreateNotes` (lines 472-477)
Unchanged signature — still folds the academic year + notes into the `notes` prop (the FeeStructureConfig type has no `academicYear` field). Notes are no longer surfaced in the create-mode header UI per spec, but the field is kept on state so the version record still carries the academic-year context.

#### 2g. Update `handleSaveDraft` (lines 486-510)
Now validates `if (!selectedClass) { toast.error('Please select a class'); return }` (was `if (!createName.trim())` + `if (!createClassLevel.trim())`). The `createFeeStructure` call now passes `category: selectedClass.level, className: selectedClass.name, classLevel: selectedClass.level` (was `category: createClassLevel, className: createName.trim(), classLevel: createClassLevel`). Success toast now uses `selectedClass.name` (was `createName.trim()`).

#### 2h. Update `handlePublishNew` (lines 513-557)
Same changes as `handleSaveDraft` — uses `selectedClass.name` / `selectedClass.level` for the create + publish calls, the publish reason `Initial publish — ${selectedClass.name}`, and the success toast description.

#### 2i. Update create-mode header (lines 675-755)
- Removed the `createName` Input field (no Structure Name field per spec).
- Removed the `createClassLevel` select with `CLASS_LEVELS` options.
- Removed the Notes Input field (per spec — "Remove notes from the primary create UI").
- Added a new `createClassId` select that pulls from `schoolClasses` (the school's actual configured classes). For Class 11/12 stream classes (where `c.stream` is set), the option label is `${c.name} (Science-${c.stream})` (e.g. "Class 11 (Science-PCM)"); for non-stream classes, just `c.name`. The first option is `<option value="">Select class</option>`.
- The Draft badge moved from inline-with-inputs (next to Name) to the top-right corner (next to Back to Structures).
- The title is now dynamic: `selectedClass ? selectedClass.name : 'Create New Fee Structure'` — when a class is selected, the title shows the class name (e.g. "Class 10"); when not, it shows the placeholder.
- The subtitle is now dynamic: `selectedClass ? ${selectedClass.level} · AY ${createAcademicYear || '2025-2026'} : 'Select a class to begin'` — when a class is selected, the subtitle shows the level + AY (e.g. "Secondary · AY 2025-2026"); when not, it shows the placeholder.
- The Class select has `autoFocus` (was on the Name input).
- AY input placeholder changed from "e.g. 2025-2026" to "AY 2025-2026" (cleaner).

#### 2j. Update `affectedStudents` useMemo (lines 290-309)
Now tries exact `s.className === structure.className` match first; falls back to classLevel substring matching when no student has the exact className. Dep array updated to `[structure.className, structure.classLevel]` (was `[structure.classLevel]`). This makes a Class 9 structure card show "4 students impacted" (just Class 9 students), not "8 students" (all Secondary students).

### Phase 3 — Update `src/components/principal/modules/fees/fees-structures.tsx` (539 → 575 LOC, +36)

#### 3a. Update `CATEGORY_COLORS` (lines 53-63)
Added a new `'Senior Secondary'` entry (the new seed uses `'Senior Secondary'` as the category, not `'Senior'`). Kept `'Senior'` as a legacy alias for any user-created structures that may still use it. Both share the same rose-tinted chip / bar / dot styling.

#### 3b. Add `studentsByClassName` map (lines 125-138)
New `useMemo` that counts active students by their EXACT `className` (e.g. `{ "Class 9": 4, "Class 10": 4, "Pre-Nursery": 2, ... }`). Used as the primary lookup for the card "Students" count. The existing `studentsByLevel` map is kept as a fallback for structures whose `className` doesn't match any real student (e.g. duplicated drafts with className "Class 9 — Draft Copy"). Both maps now filter by `s.status === 'Active'` (was previously counting all students including archived).

#### 3c. Update card render (lines 254-299)
- The accent color lookup now uses `accentKey = f.category || f.classLevel` (falls back to classLevel when category is empty — defensive for drafts).
- `studentsCount` now uses `studentsByClassName[f.className] ?? studentsByLevel[f.classLevel] ?? 0` (exact className first, classLevel fallback, 0 default).
- Card subtitle changed from `{f.category}` to `{f.classLevel}` per spec ("Subtitle: the level (e.g. 'Secondary') — from `structure.classLevel`"). The card title (`{f.className}`) is unchanged — it already shows the class name, which is now "Class 9" (was "Class 9–10" before the seed migration).

### Phase 4 — Verification

- `cd /home/z/my-project && bunx tsc --noEmit 2>&1 | grep -c "error TS"` → **0** (exit code 1 from grep is because there were zero matches, expected).
- `bun run lint 2>&1 | grep -E "error|warning" | grep -v "ESLintIgnoreWarning"` → no errors or warnings (only the pre-existing `.eslintignore` deprecation notice).
- `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` → **HTTP 200** (verified 3 times, ~2-3 s apart — dev server is healthy; the EADDRINUSE entries in `dev.log` are stale restart attempts from a previous session, not from this task's edits).
- `curl -s http://127.0.0.1:3000/ | head -c 500` → returns the full HTML doctype + Next.js chunk preloads, confirming the page actually loads (not just returns 200).

### Backward compatibility verification

Walked through the seeded students (from `src/lib/store/students-store/seed-data.ts`) and confirmed every className gets a matching structure:
- `Pre-Nursery` → FS01 (exact) ✓
- `KG` → no exact match → fallback `Pre-Primary` → FS01 ✓
- `Class 2` → FS02 (exact) ✓
- `Class 4` → no exact match → fallback `Primary` → FS02 ✓
- `Class 6` → FS03 (exact) ✓
- `Class 8` → no exact match → fallback `Middle` → FS03 ✓
- `Class 9` → FS04 (exact) ✓
- `Class 10` → FS05 (exact) ✓
- `Class 11` → no exact match → fallback `Senior Secondary` → FS06 ✓
- `Class 12` → FS06 (exact) ✓

Also confirmed the existing exam fee resolution in `create-exam-fullscreen.tsx` continues to work via the classLevel fallback (the file was NOT touched per the task's "DO NOT TOUCH ... or any other file" rule): for Class 9/10 → classLevel 'Secondary' → first match FS04 (Class 9 — UT/HY/Annual/Pre-Board fees are identical in FS04 and FS05, so the amounts are correct). For Class 11/12 → classLevel 'Senior Secondary' → first match FS06 (Class 12).

Historical transactions keep their `className` field unchanged (e.g. seed transactions with `className: 'Class 7'` for STU-17/STU-18 — these were pre-FEE-PER-CLASS and continue to be displayed verbatim in the transactions table).

## Stage Summary

### What changed
- **FEE_STRUCTURES seed** (fee-store.ts:483-578): replaced 5 range-based structures (Nursery–UKG / Class 1–5 / Class 6–8 / Class 9–10 / Class 11–12) with 6 per-class structures (Pre-Nursery / Class 2 / Class 6 / Class 9 / Class 10 / Class 12). Each structure's `className` is now the actual class name from the school's configured classes; `classLevel` is the level bucket; `category` mirrors `classLevel`. Annual totals recomputed from the spec's per-class fee amounts.
- **computeAccount** (fee-store.ts:2243-2254): now uses `findStructureForStudent(student.className)` which tries an EXACT className match first, falling back to classLevel substring matching. Students with a per-class structure (e.g. Class 9 → FS04) get the exact-match structure; students without one (e.g. Class 4 → no FS for "Class 4") get the level-fallback structure (FS02 Class 2 in that case).
- **Three new exported helpers** (fee-store.ts:639-665): `studentClassLevel(className)` for the substring rule, `findStructureForStudent(className)` for the per-class matching with classLevel fallback. Both are exported so the exam-creation flow (or any other consumer) can reuse the same matching logic.
- **`countStudentsForStructure(struct)`** (fee-store.ts:677-684): replaces the internal `countStudentsForClassLevel(classLevel)` so the changeLog's `affectedStudents` field reflects per-class student counts (e.g. Class 9 structure → 4 students, not 8). The legacy `countStudentsForClassLevel` is kept as a thin alias for any external caller.
- **`deleteFeeStructure` archived-record check** (fee-store.ts:1864-1879): tries exact className match first (so a Class 9 structure only blocks deletion when Class 9 students have txns), falls back to classLevel substring matching.
- **`useFeeData` byCategory distribution** (fee-store.ts:2444-2460): uses `findStructureForStudent(a.className)` so each student's category breakdown uses their per-class structure's components (e.g. a Class 10 student's breakdown uses FS05's components, not FS04's via the first-Secondary-match fallback).
- **Create-mode UI** (fees-structures-detail.tsx): removed the `CLASS_LEVELS` const + `createName` state + `createClassLevel` state + Notes input; added `createClassId` state + `schoolClasses` from `useStudentsStore` + `selectedClass` derived from `createClassId`. The class select now pulls options from the school's actual configured classes (with `Science-PCM` / `Science-PCB` suffix for stream classes). The title shows the class name (e.g. "Class 10"); the subtitle shows the level + AY (e.g. "Secondary · AY 2025-2026"). `createValid` / `createHasEdits` / `handleSaveDraft` / `handlePublishNew` all use `selectedClass.name` + `selectedClass.level` instead of the typed name + class level. `affectedStudents` (for view-mode drawer) now matches by className first with classLevel fallback.
- **Card grid** (fees-structures.tsx): card title unchanged (`{f.className}` — already shows the class name). Card subtitle changed from `{f.category}` to `{f.classLevel}` per spec. `CATEGORY_COLORS` extended with `'Senior Secondary'` (the new seed uses this label, was `'Senior'`). New `studentsByClassName` map provides per-class student counts (with `studentsByLevel` as a fallback for structures with non-matching classNames). Both maps now filter by `s.status === 'Active'`.

### Verification results
- `bunx tsc --noEmit` → 0 errors (grep -c "error TS" returns 0).
- `bun run lint` → no errors or warnings (only the pre-existing `.eslintignore` deprecation notice).
- `curl http://127.0.0.1:3000/` → HTTP 200 (verified 3 times).
- Page HTML loads fully (verified by fetching first 500 bytes — doctype + Next.js chunk preloads present).

### What was NOT touched (per task scope)
- All other fees-* components: fees-overview, fees-collections, fees-transactions, fees-approvals, fees-pending-dues, fees-settings, fees-shell, fees-shared, fees-receipt, fees-collect-payment, fees-reports, fees-charts, fees-settings-payment.
- `src/components/principal/modules/exams/create-exam-fullscreen.tsx` — the existing classLevel-based exam fee resolution continues to work via computeAccount's classLevel fallback (the seed has exactly one structure per level, except Secondary which has FS04 Class 9 + FS05 Class 10 with identical exam fee amounts for UT/HY/Annual/Pre-Board, so the first-match fallback returns correct amounts).
- Every other file in the repo.
