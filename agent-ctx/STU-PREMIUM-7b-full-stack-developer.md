# STU-PREMIUM-7b — full-stack-developer work record

> Full record also appended to `/home/z/my-project/worklog.md` (canonical log).
> Scope: Classwork submission persistence + persisted Learning progress store + Principal-standard alignment of both module roots. No tsc/eslint/dev-server/build run (orchestrator validates centrally).

Task ID: STU-PREMIUM-7b
Agent: full-stack-developer
Task: Fix the Classwork submission persistence gap, create a persisted Learning progress store, and align both module roots with the Principal design standard.

## Files changed (18)

**New store**
- `src/lib/store/student-learning-store.ts` — NEW, ~150 LOC, exact `student-homework-store` pattern (createTenantScopedStorage + persist v1 + partialize, nothing seeded): `flashcardProgress` (cardId→last rating), `flashcardNotes` (cardId→note, blanks pruned), `plannerTasks` ({id,title,subject?,dueDate?,done,createdOn}), `studyMinutesByDate` ('YYYY-MM-DD'→minutes); actions `rateCard / setCardNote / addPlannerTask / togglePlannerTask / removePlannerTask / addStudyMinutes / resetAll`; helpers `statusFromRating`, `todayKey`.

**Stores / panel**
- `src/lib/store/student-homework-store.ts` — comments + param rename only (documents the generic map now keyed by BOTH HW### and ASG###; zero behavior change).
- `src/components/student/student-panel.tsx` — `pendingClasswork` excludes store-submitted assignments; Learning nav badge derives from mock+persisted flashcard ratings (was static `flashcardStats.dueToday`).

**Classwork (Part 1)**
- `modules/classwork.tsx` — StudentPage root + kit SegmentedTabs (Homework/Assignments) with live store-derived badges; deep-link flow (initialTab/onTabChange + ModuleTabPanel) preserved.
- `modules/assignments/index.tsx` — local `useState<Set>` REMOVED; submissions via `markSubmitted(ASG###)` into the SAME persisted homework store; pending/submitted lists read the store.
- `modules/assignments/assignments-tabs.tsx` — inner tabs → kit SegmentedTabs (badge counts); pending empty state → Panel + StudentEmptyState; passes `submittedMap` through so cards get real dates.
- `modules/assignments/assignment-card.tsx` — Panel (GlassCard out); Submitted state now emerald badge + emerald `Submitted · {date}` chip (matches homework's "Done · date").
- `modules/assignments/kpi-row.tsx` — SummaryCard/SummaryCardGrid (violet/amber/emerald/cyan).
- `modules/assignments/submit-dialog.tsx` — intentionally unchanged: fully controlled by index (no submission state inside); store write lives in `handleSubmit`.
- `modules/homework/index.tsx` — root rhythm space-y-4 + shared-store comment.
- `modules/homework/stats-row.tsx` — SummaryCard/SummaryCardGrid.
- `modules/homework/active-homework-list.tsx` / `closed-homework-list.tsx` — GlassCard → Panel.

**Learning (Part 2)**
- `modules/learning.tsx` — StudentPage root + kit SegmentedTabs (Learning Hub/Flashcards/Study Planner/Study Groups) with live badges (cards due merged with persisted ratings; open planner tasks).
- `modules/flashcards/index.tsx` — every rating syncs via `rateCard`; `cardStates`/`studyQueue`/Due-Today KPI initialize from mock statuses MERGED with persisted ratings (mastered survives reload); note value + note-change wired to store.
- `modules/flashcards/study-tab.tsx` — new per-card note Textarea (persisted); all 4 GlassCards → Panel.
- `modules/flashcards/cards-tab.tsx` — persisted notes shown (violet StickyNote line); Panel container.
- `modules/study-planner/index.tsx` — plannerTasks add/toggle/remove wired to store; header Add Task button now opens a REAL quick-add form; pomodoro focus completion calls `addStudyMinutes(todayKey(), 25)`; local `completedSessions` removed — Today's Sessions/focus-time/XP derive from persisted minutes; KPI row derives from merged mock+store lists.
- `modules/study-planner/tasks-tab.tsx` — quick-add form (title + optional subject/due date), persisted "My task" rows (toggle + Trash2 remove, overdue rose), task list `max-h-96 overflow-y-auto custom-scrollbar`, reminders sidebar → Panel.

## Decisions
1. Assignment submissions ride the SAME `useStudentHomeworkStore` (map is generic; HW###/ASG### ids never collide) — per task instruction.
2. Mock `studyTasks` stay session-local (data layer, like closed homework); the store seeds NOTHING (per spec) so there is no home for mock-completion overrides in the given shape — noted as a known boundary.
3. `notes-tab` (subject-notes bookmarks/read progress) untouched — outside the specified store shape.
4. Dashboard "Assignments Due" (STU-PREMIUM-1 orchestrator file, out of 7b scope) still filters `status==='Pending'` only — 1-line follow-up if it should exclude student-submitted rows.

## Validation
- All 18 modules import cleanly under `bun` (syntax + `@/` alias resolution OK).
- Learning-store actions smoke-tested in isolation: rating persist, note trim + empty-note pruning, task id stamping + blank-title guard, minutes accumulation (`50 → 2 sessions`), toggle/remove/resetAll all correct.
- `reactStrictMode: false` (next.config) — the pre-existing side-effect-in-timer-updater pattern stays single-fire; store hydration is synchronous (localStorage) and panels render only after `page.tsx` mounted gate, so the `useState` initializers read hydrated state (no SSR mismatch).
- dev.log clean at time of check (no compile errors).

## Risks
- Flashcard merge is initializer-only (first mount); ratings written by other tabs later in the same mount won't retro-merge into an open session — acceptable (single writer per module).
- `todayKey()` computed per render; a session crossing midnight attributes to the render-day key (cosmetic).
- Orchestrator must run central tsc/eslint + browser QA (submission → reload, flashcard rating → navigation, task add → reload, pomodoro completion → KPI/session persistence).
