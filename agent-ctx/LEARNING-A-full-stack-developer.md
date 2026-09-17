# LEARNING-A — Learning Hub rebuild (work record)

Task ID: LEARNING-A
Agent: full-stack-developer subagent
Scope: `src/components/student/modules/resources/**` + `learning.tsx` only.

## What shipped

The Learning Hub tab is now the action-first command centre per the Learning OS spec (§4, §7–§14, §51, §56–§58, §61–§63, §66–§67), entirely backed by the canonical `student-learning-store` (+ `useMyResults().latest` for the weak-subject signal). Zero imports from `@/lib/mock/*`.

### Files

| File | Status | Purpose |
|---|---|---|
| `resources/index.tsx` | rewritten | Hub structure (below); owns selectedId + filter state |
| `resources/actions.ts` | NEW | `useResourceActions()` — study/complete/bookmark/addToPlanner/addRevision + honest toasts; `todayKey()` |
| `resources/type-meta.tsx` | NEW | TYPE visual system (chips/pills/size labels) + shared button classes (replaces data.tsx) |
| `resources/continue-learning.tsx` | NEW | violet hero strip from `continueLearningOf()` |
| `resources/todays-focus.tsx` | NEW | 3 real facts + Start study / Review cards cross-tab actions |
| `resources/subjects-section.tsx` | NEW | 6 subject cards + in-place SUBJECT VIEW drill-down (Continue / Practice & revise / Weak areas → addRevision) |
| `resources/recommended.tsx` | NEW | `recommendedOf()` cards with REAL derived reasons |
| `resources/recent-saved.tsx` | NEW | Recently studied + Saved compact strips |
| `resources/resource-grid.tsx` | rewritten | discovery cards + kebab menu (bookmark / add to planner / mark complete) |
| `resources/resource-detail.tsx` | rewritten | accessible dialog (role=dialog, Escape, backdrop) + Study primary |
| `resources/filter-bar.tsx` | rewritten | ONE compact search + derived subject/type chips + Saved/Unfinished toggles |
| `resources/kpi-section.tsx` | DELETED | fake-stats KPI wall retired |
| `resources/progress-section.tsx` | DELETED | mock subject progress retired |
| `resources/data.tsx` | DELETED | typeConfig → type-meta.tsx; hardcoded filter lists gone |
| `learning.tsx` | modified | passes `goToTab={select}` to LearningResourcesModule |

### Hub structure (top → bottom)

1. Header: "Learning Hub" / "Your learning space" (no repeated class/session text)
2. CONTINUE LEARNING (hides when nothing in progress)
3. TODAY'S FOCUS (tasks due today · minutes today vs 60-min soft reference · cards due)
4. SUBJECTS grid → in-place subject view (AnimatePresence swap)
5. RECOMMENDED FOR YOU (real reasons: finish / focus subject / saved)
6. RECENTLY STUDIED + SAVED (2 columns on lg)
7. ALL RESOURCES: filter-bar + grid, honest "N resources · M subjects" hint

## Conventions the next agents need

- **goToTab**: `learning.tsx` passes the shared-tabs `select` function into the Learning Hub tab as `goToTab: (tab: string) => void` (keys: `'resources' | 'flashcards' | 'planner' | 'peer'`). LEARNING-B (flashcards) / LEARNING-C (planner) should accept the same prop if they want cross-tab links.
- **Actions hub**: import `useResourceActions` from `./actions` — it centralizes every resource action + honest toast ("Progress saved — 97%", "Added to today's plan", NO XP). `addRevision(subject, topic)` creates `Revise <topic>` revision tasks (origin 'revision').
- **Buttons**: `BTN_PRIMARY / BTN_VIOLET / BTN_OUTLINE / BTN_SOFT_VIOLET / BTN_SOFT_AMBER` from `./type-meta` (44px touch target mobile, sm: denser).
- **Types**: `TYPE_META` + `TypeChip` + `DifficultyPill` + `sizeLabelOf` from `./type-meta`.
- Accent semantics: emerald=completion, violet=study/continue/flashcards, amber=attention/weak/due, cyan=info/video, rose=pdf/hard.

## Gates

- `bunx tsc --noEmit` → 0 errors
- `bun run lint` → clean (zero new issues)
- dev server: GET / 200, Turbopack recompiled clean, no errors in dev.log

## Deviations

- Added ONE co-located helper file (`actions.ts`) beyond the brief's file list — needed so grid/detail/subject-view share identical action+toast behaviour (brief required "the same actions" in multiple surfaces). Everything stays inside `resources/`.
- Completed resources show an emerald "Completed" STATE (not a button) instead of a Study button — §62 forbids misleading active buttons.
