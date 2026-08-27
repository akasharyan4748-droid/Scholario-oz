# Task 9-D — Operations visual convergence (Certificates + Calendar + Communication + Messages + Downloads)

## Scope

Second-pass visual convergence of 5 Operations module shells to the Academics
(Examinations + Attendance) pattern.

Root cause addressed: each shell was using `<div className="flex flex-col h-full">`
+ sticky header (eyebrow + h1 + description + summary pills + action buttons) +
custom tab strip + scroll wrapper. The AppShell ALREADY provides the scroll
container + padding, so these shells were DOUBLE-SCROLLING + DOUBLE-PADDING.
The Academics pattern is `<PageTransition className="space-y-4">` + ONE row
with `SegmentedTabs` on the left + optional controls on the right + flat
section containers (no header strip).

## Files modified (9)

### Section container consolidation (4)

1. `src/components/principal/modules/certificates/cert-shared.tsx` — replaced
   local `CertPanel` (~22 LOC function) with `export const CertPanel = Panel`
   (re-export of the shared Academics-pattern `Panel` from
   `../shared/panel`). Removed the `border-b border-border/60 bg-muted/20`
   header strip; the shared `Panel` is a flat `rounded-xl border border-border
   bg-card` card with `text-sm font-semibold` title + `text-xs text-muted-
   foreground` subtitle on a header row, then body content with `p-4`.

2. `src/components/principal/modules/calendar/calendar-shared.tsx` — same
   treatment: `export const CalPanel = Panel`. Removed the local PanelProps
   interface + the duplicated implementation.

3. `src/components/principal/modules/communication/comm-shared.tsx` — same
   treatment: `export const CommPanel = Panel`.

4. `src/components/principal/modules/downloads/downloads-shared.tsx` — same
   treatment: `export const DownloadsPanel = Panel`. (DownloadsPanel wasn't
   actually used anywhere except its own definition — the re-export keeps
   the export available for any future caller.)

### Shell convergence (5)

5. `src/components/principal/modules/certificates/index.tsx` — replaced
   `<div className="flex flex-col h-full cert-shell">` + sticky header (eyebrow
   "Documents & Certificates" + h1 "Document Generation" + meta strip "8
   generated · 24/24 templates · 7 this month · AY 2026") + custom tab strip
   with `<div className="flex-1 overflow-y-auto p-4 sm:p-6 no-print">` body
   wrapper with `<PageTransition className="space-y-4 cert-shell">` + ONE
   `<SegmentedTabs tabs={[Generate, Templates, History]} />` row + the
   existing `<AnimatePresence mode="wait">` tab-content motion.div. Dropped
   the meta strip (History tab carries its own stats line; the meta strip
   duplicated info). Dropped the now-unused `Sparkles, Layers, HistoryIcon,
   cn, useCertificatesStore, kpis, documents, templates` state/imports.

6. `src/components/principal/modules/calendar/index.tsx` — replaced
   `<div className="flex flex-col h-full calendar-shell">` + sticky header
   (eyebrow "Academic Year 2025-26 · December" + h1 "Academic & Cultural
   Calendar" + description "School events, holidays, examinations & meetings
   in one view. Click a day to see its schedule.") + `<div className="flex-1
   overflow-y-auto p-4 sm:p-6 space-y-3">` body wrapper with
   `<PageTransition className="space-y-4 calendar-shell">` + ONE row with
   `FilterChips` on the left + the emerald "Add Event" primary button
   (`h-8 text-xs bg-emerald-600 hover:bg-emerald-700`) on the right + the
   existing `grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4` row with the
   `CalendarGrid` (spans 2 cols — month name + Today/Prev/Next live in its own
   CalPanel header) + the mutually-exclusive `SelectedDayPanel` /
   `UpcomingEvents`. Removed the `CalendarDays` import (was only used in the
   eyebrow). Removed the `MONTH_NAMES` import (visible month label lives in
   the CalendarGrid's CalPanel header now). Removed `cn` import (the only
   `cn()` call was a single literal string with no conditionals).

7. `src/components/principal/modules/communication/comm-shell.tsx` — replaced
   `<div className="flex flex-col h-full comm-shell">` + sticky header
   (eyebrow "Academic Year 2024-25" + h1 "Announcements, Circulars & Messaging"
   + summary pill line "Active 6 · Scheduled 1 · Drafts 1") + custom tab strip
   with `<PageTransition className="space-y-4 comm-shell">` + ONE
   `<SegmentedTabs tabs={[Announcements, Circulars, Compose, History]} />`
   row + the existing `<AnimatePresence mode="wait">` tab-content motion.div.
   Collapsed the summary pills into a single Announcements tab badge
   (scheduled + draft count). Dropped the now-unused `Megaphone, FileText,
   Plus, HistoryIcon, cn, school` imports + the `activeCount` derivation
   (Announcements tab content itself shows the active count).

8. `src/components/principal/modules/messaging/index.tsx` — kept the 3-pane
   mail client layout (it's fundamentally different from a tabbed list view;
   it needs `h-full` to give the inner panes fixed-height scroll areas).
   Replaced the outer `<div className="flex flex-col h-full">` + sticky
   header (h1 "Messages & Inbox") with `<PageTransition className="flex
   flex-col h-full gap-3">` + ONE compact `<div className="flex items-center
   justify-end gap-3 flex-wrap shrink-0">` row with just the emerald "Compose"
   primary button on the right (`h-8 px-3 rounded-full bg-emerald-600 hover:
   bg-emerald-700 text-xs font-semibold text-white`). The 3-pane container
   was kept (now `<div className="flex-1 min-h-0 overflow-hidden bg-card
   border border-border rounded-xl shadow-sm">` — removed the redundant
   `m-4 mt-0` margin since the AppShell already provides padding). Preserved
   ALL messaging groups logic (FoldersSidebar, ConversationList,
   GroupsPanel, ThreadView, ComposeModal) — untouched.

9. `src/components/principal/modules/downloads/index.tsx` — replaced
   `<div className="flex flex-col h-full downloads-shell">` + sticky header
   (eyebrow "Documents & Files" + h1 "Document Library" with emerald Library
   icon + description "School documents, templates & generated files") +
   search/filter row + custom category tab strip with
   `<PageTransition className="space-y-4 downloads-shell">` + ONE
   `<SegmentedTabs tabs={[All, Recent, Generated, Forms, Templates, Reports]} />`
   row with the per-tab count badges (replaces the bespoke category chip
   tabs) on the left + the search input + category filter + sort dropdown +
   clear button on the right (in a sibling `<div className="flex items-center
   gap-2 flex-wrap">`). The QuickAccess motion.section was flattened to
   match the shared `Panel` look (rounded-xl border border-border bg-card
   p-4, h3 text-sm font-semibold). The document-list section header was
   upgraded from `text-xs uppercase tracking-wider text-muted-foreground`
   to `text-sm font-semibold tracking-tight text-foreground` (matches the
   Academics section header). Preserved the slide-from-right detail drawer,
   the document list table, the cert bridge, and the "/" keyboard shortcut
   for focusing search. Dropped the now-unused `Library, cn` imports.

## What was preserved (NOT touched)

- All functionality: tab switching, keyboard shortcuts (1-3 for cert, 1-4
  for comm, "/" for downloads search), form submissions, CRUD, dialogs,
  toasts.
- All data: certificates (7 doc types, template CRUD, history), calendar
  (real month nav, add-event persistence, unified events from
  useMockExamsStore + useCalendarStore + school-calendar.ts), communication
  (announcements, circulars, compose, history), messaging (6 group types,
  member refs, smart auto-fill connected to real students/teachers/classes
  data — folders-sidebar.tsx, conversation-list.tsx, thread-view.tsx,
  compose-modal.tsx, groups-panel.tsx all untouched), downloads (document
  list, search, filters, drawer, cert bridge).
- All premium chart components.
- All store management (certificates-store, calendar-store, communication-
  store, messaging-store, downloads-store) — no mutations or selectors
  touched.
- All sub-tab components (generate-tab, templates-tab, history-tab,
  cert-shared, comm-announcements, comm-circulars, comm-compose, comm-
  history, calendar-grid, selected-day-panel, upcoming-events, filter-
  chips, add-event-dialog, document-list, document-detail) — untouched.

## Verification (all passed)

1. `cd /home/z/my-project && bun run lint` → 0 errors. Only the pre-existing
   config-deprecation warning: `ESLintIgnoreWarning: The ".eslintignore"
   file is no longer supported. Switch to using the "ignores" property in
   "eslint.config.js"` (pre-existing config issue, unrelated to my changes).
2. `cd /home/z/my-project && bunx tsc --noEmit 2>&1 | grep -E
   "certificates/|calendar/|communication/|messaging/|downloads/" | head -20`
   → empty. No TS errors in any of the 5 modules I touched. (Pre-existing
   TS errors remain in `exams/*`, `lib/exams/*`, `lib/store/finance-store.ts`
   — all outside this task's scope.)
3. `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` →
   HTTP 200.
4. `dev.log` post-edit shows clean compiles (`✓ Compiled in 284ms`) and
   HTTP 200 responses. The "Export YEAR doesn't exist" errors in the log
   are STALE — they reference the pre-Task-16 calendar/index.tsx that
   imported `DAYS_IN_MONTH, FIRST_DAY, MONTH, YEAR` from `./data`. The
   current calendar/data.ts (rewritten in Task 16) doesn't export those
   constants, and my new calendar/index.tsx doesn't import them. The
   errors are from cached chunks before Task 16's rewrite landed.
5. Visual sanity check via `agent-browser`: logged in as principal,
   navigated to Certificates (verified SegmentedTabs with Generate/
   Templates/History, tab switching works), Calendar (FilterChips row +
   emerald Add Event button on the right + calendar grid), Communication
   (SegmentedTabs with Announcements/Circulars/Compose/History), Messages
   (compact Compose button row + 3-pane mail layout preserved), Downloads
   (SegmentedTabs with All/Recent/Generated/Forms/Templates/Reports + search/
   filter/sort on the right). All 5 modules render cleanly.
6. Screenshots captured: `/tmp/cert-generate.png`, `/tmp/calendar.png`,
   `/tmp/comm.png`, `/tmp/messaging.png`, `/tmp/downloads.png`, plus the
   Academics reference `/tmp/exams.png` for visual comparison.

## Net change

- 9 files modified (4 `*-shared.tsx` Panel consolidations + 5 shell
  rewrites).
- No files added or deleted.
- LOC: certificates/index.tsx 137 → 87 (−50), calendar/index.tsx 263 → 229
  (−34), comm-shell.tsx 142 → 106 (−36), messaging/index.tsx 105 → 107
  (+2 — kept the 3-pane structure but added the Compose action row),
  downloads/index.tsx 345 → 304 (−41). The 4 `*-shared.tsx` files each lost
  ~16 LOC (the local PanelProps + Panel implementation replaced by a
  1-line re-export).

## Result

After this pass, navigating Examinations → Certificates → Calendar →
Communication → Messages → Downloads shows the same visual composition:

- Same `SegmentedTabs` style on the left of the first row (`inline-flex h-9
  p-1 gap-1 rounded-full bg-muted/60` + `px-3.5 rounded-full text-xs`).
- Same primary action button style on the right of the first row (`h-8
  text-xs bg-emerald-600 hover:bg-emerald-700 text-white`).
- Same flat section container style (`Panel` — `rounded-xl border border-
  border bg-card` + `text-sm font-semibold` title + `text-xs text-muted-
  foreground` subtitle on a header row + `p-4` body).
- Same vertical rhythm (`space-y-4`).
- NO sticky header, NO eyebrow, NO h1, NO description (sidebar already
  names the module).
- NO double-scroll / double-padding (AppShell provides the scroll
  container + padding; modules flow naturally with vertical rhythm).
- Each module feels like another section of the same Scholario ERP, not a
  different dashboard.
