# LEARNING-B — Flashcards rebuild + Notes system (work record)

Task ID: LEARNING-B
Agent: full-stack-developer subagent
Scope: rebuild `src/components/student/modules/flashcards/` per Learning OS spec §15–§20 (+ §56–§58, §61–§62).
Companion record: the full file-by-file log lives at the end of `/home/z/my-project/worklog.md` (entry "Task ID: LEARNING-B").

## What shipped

| File | Action | Essence |
| --- | --- | --- |
| `flashcards/shared.tsx` | rewritten | STATUS_META/StatusChip, DIFFICULTY_META/DifficultyPill, QUALITY_META, `previewIntervalOf()` (exact mirror of the store's `reviewCard` SM-2-lite math), `isDueNow()`, `dueLabelOf()` |
| `flashcards/session.tsx` | new | distraction-free session: live `reviewQueueOf()` queue, rotateY flip, quality buttons with REAL next intervals, keyboard shortcuts, completion screen from a local session log, honest `recordSession()` on exit |
| `flashcards/new-card-modal.tsx` | new | accessible creation dialog → `addCard()` → "Card added to My Cards" (D-my); supports prefill (create-from-note) |
| `flashcards/cards-tab.tsx` | rewritten | deck filter chips + read-only card rows (status chip, difficulty pill, due label) |
| `flashcards/notes-tab.tsx` | rewritten | notes system: pinned-first list, pin/edit/delete(inline confirm), search, tags, linked-resource chip, make-flashcard prefill |
| `flashcards/index.tsx` | rewritten | FLASHCARD HOME: real `dueStatsOf()` stats row, Start Review (honest disabled "You're all caught up" at 0 due), decks grid w/ mastery bars + per-deck Review/Browse, Recently Reviewed strip, Home/Cards/Notes sub-tabs, HOME⇄SESSION switch |
| `flashcards/study-tab.tsx` | deleted | replaced by session.tsx |
| `learning.tsx` | 1-line change | `<FlashcardsModule goToTab={select} />` (documented minimal change) |

## Rules honored
- Zero `@/lib/mock/flashcards` imports (verified). All data from `useStudentLearningStore`.
- No fake stats (§61): every count from store selectors; streak from `streakOf(sessions)`.
- No dead buttons (§62): Start Review disabled-with-honest-label + "Browse learning resources" link; empty decks offer New Card; "All caught up" is a status, not a fake CTA.
- A11y: dialogs role=dialog + aria-modal + aria-label + useDismissOnEscape; progressbars role=progressbar; quality buttons show label + interval (never colour alone); flip card is a real `<button>` with dynamic aria-label; shortcuts skip inputs and defer to focused native buttons.
- Keyboard: Space/Enter flip · 1 Again · 2 Hard · 3 Good · 4 Easy · Esc end session (hints md+ only).
- Design: GlassCard + .on-card, violet study identity, emerald mastered, amber learning/attention, sky reviewing/good, rose again/missed; 44px touch targets; 2×2 quality grid on mobile → 4-across sm+.

## Verification
- `bunx tsc --noEmit` → 0 errors (baseline was also clean; no foreign errors).
- `bun run lint` → clean.
- dev server :3000 GET / 200, Turbopack recompile with no errors in dev.log.
- No files outside `flashcards/` touched except the documented 1-line `learning.tsx` prop pass.

## For LEARNING-C (next agent)
- `recordSession()` is now written by flashcards (mode 'manual', real elapsed minutes, dominant subject) — today's minutes/streak already include flashcard study; focus timer should use mode 'focus-timer'.
- `goToTab` convention: learning.tsx now passes `select` to BOTH the Hub and FlashcardsModule; keys 'planner' | 'flashcards' | 'peer' | 'resources'.
- Reusable from `flashcards/shared.tsx`: StatusChip, DifficultyPill, dueLabelOf, isDueNow, previewIntervalOf.
- Store contract untouched: no schema changes, no new selectors needed.
