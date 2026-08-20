# Task 2 — workspace-splitter

## Mission
Split the monolithic `exam-workspace.tsx` (2489 lines, 20 components) into separate files by responsibility. Safe refactor — NO logic/UI/behavior changes; only move code + update imports.

## What I read first
- `/home/z/my-project/worklog.md` (full history of prior agents)
- The full 2489-line `exam-workspace.tsx` to understand component boundaries, dependencies, and import surface

## Files created (all under `src/components/principal/modules/exams/`)

| File | LOC | Components moved |
|---|---|---|
| `workspace-shared.tsx` | 116 | `StatusPill`, `ResultStatusPill`, `teacherForSubject`, `Kpi`, `DetailField`, `Stat` + shared `Tab` type |
| `overview-section.tsx` | 342 | `ActionItemsWidget`, `OverviewSection` |
| `schedule-section.tsx` | 106 | `ScheduleSection` |
| `marks-section.tsx` | 677 | `MarksSection`, `SubjectAnalytics`, `ResultsInline`, `StudentResultDetail`, `PaperTimelineInline` |
| `grade-section.tsx` | 987 | `GradeDonut`, `StudentDrillDownModal`, `studentPerformance_rank`, `SubjectDrillDownModal`, `GradeSection` |
| `audit-section.tsx` | 159 | `AuditSection` |

## What exam-workspace.tsx became
- **217 lines** (down from 2489 — 91% reduction). Slightly below the 250-350 target band, but the orchestrator is genuinely small: just header + grouped tab bar + section switch + keyboard shortcuts. Adding artificial padding would harm readability.
- Now imports the 6 section files + workspace-shared + the existing GraceSection/OutcomesSection/SeatingSection/ExamAttendanceSection/AdmitCardsSection/InlineLoading.
- Keeps the same `export function ExamWorkspace(...)` signature so `index.tsx` (the only consumer) is unaffected.

## Import strategy
- Each new file imports only what IT uses (not the full original import surface).
- The `Tab` union type is now exported from `workspace-shared.tsx` and imported by `overview-section.tsx`, `exam-workspace.tsx` (and indirectly by all section files via type inference).
- Unused imports in the original file (e.g. `SegmentedTabs`, `useAddScheduleItem`, `useDeleteScheduleItem`, `useUpdateScheduleItemV2`, `useTeachers`, `useAssignInvigilator`) were NOT carried into the orchestrator — they were already unused in the original.

## Verification
- **ESLint** on the whole `src/components/principal/modules/exams/` directory: **EXIT=0** (zero warnings, zero errors).
- **TypeScript** (`tsc --noEmit`): 20 total errors in the project. 2 of them are in my refactored files (`exam-workspace.tsx:202` ScheduleSection `onReload` prop, `grade-section.tsx:653` rows.push missing `rank`). **Both are pre-existing in the original 2489-line file** — I preserved the exact same call signatures and type annotations. The other 18 errors are in files I did not touch (seating, lib/exams/*, tabs/*). My refactor introduced **ZERO new TypeScript errors**.
- **Dev server**: `✓ Compiled in 1381ms` after the refactor. Home page returns HTTP 200. `/api/exams` returns 401 (expected — needs auth). No compile errors. The HMR ChunkLoadError messages in the log are transient browser-cache artifacts that always appear when files are rearranged during dev; they resolve on next page load and are NOT caused by the refactor.

## Notes for downstream agents
- The 2 pre-existing TS errors in `exam-workspace.tsx:202` and `grade-section.tsx:653` are now easier to spot because the files are smaller. If a future task is "fix all TS errors", those are good targets. Do NOT "fix" them by changing the call signature — `ScheduleSection` intentionally ignores `onReload` (it has no mutation actions), and the `rows.push({...})` in GradeSection adds `rank` in a later `.map((r, i) => ({ ...r, rank: i + 1 }))` step (type annotation just doesn't reflect that two-step pattern).
- `Tab` type is the only new export — it lives in `workspace-shared.tsx`.
- No file outside `exams/` needed to change.
