---
Task ID: 16
Agent: full-stack-developer (Calendar refinement)
Task: Refine Calendar module — migrate to shared header, wire to real events

Work Log:

### Phase 0 — Context absorption
- Read /home/z/my-project/worklog.md fully (6342 lines). Key sections absorbed:
  - Task ID 1 (Academics audit, line 4241) — canonical header pattern: small eyebrow (text-[10px] uppercase tracking-[0.14em]) → h1 (text-base sm:text-lg font-bold tracking-tight) → short description (text-[11px] text-muted-foreground) → primary actions (h-8 text-xs). NO summary pills. NO indigo/blue.
  - Task ID 3 (Operations audit, line 5676) — calendar section: lines 5965–6013 detail the exact file:line issues: legacy SectionHeading/GlassCard, static December 2025 mock, toast-only month nav, toast-only add-event, NOT connected to exams/holidays, 3 simultaneous views of the same events, default selectedDay=8 empty, Winter Break date inconsistency (Dec 23 vs Dec 24), duplicate CalendarDays icon.
  - Task ID 6 (Fees refinement, line 6122) — verified the canonical FeesShell pattern (lines 102–132) for the shared header layout.
- Read all 8 in-scope files in src/components/principal/modules/calendar/ plus the cross-referenced sources:
  - src/lib/mock/operations.ts (lines 100–132) — `calendarEvents` static 9-item array + `upcomingEvents = calendarEvents.slice(0, 5)`.
  - src/lib/mock/school-calendar.ts — `getHoliday(dateStr)` exported; FIXED_HOLIDAYS/WINTER_BREAK/SUMMER_BREAK are private consts (so I had to use the public `getHoliday` API).
  - src/lib/exams/mock-exams-data.ts — `useMockExamsStore` Zustand store with `exams: ExamDTO[]` (3 seed exams: Unit Test 2 Oct 10–15, Final Feb 10–20, Mid-Term Sep 15–25). ExamDTO.schedule is `ScheduleItemDTO[]` with date/startTime/endTime/room/subjectName.
  - src/components/principal/modules/library/library-shared.tsx — LibPanel pattern (lines 96–111): rounded-xl border border-border bg-card overflow-hidden + header (px-4 py-2.5 border-b) + body (p-3). Replicated for CalPanel.
  - src/components/principal/modules/fees/fees-shell.tsx (lines 102–132) — canonical Academics-pattern header for reference.

### Phase 1 — New Zustand store: src/lib/store/calendar-store.ts (241 lines)
- Created `useCalendarStore` with:
  - `userEvents: CalendarEvent[]` — runtime-added events.
  - `addEvent(input)` — real mutation: appends a new event with `id: user-${Date.now()}-${rand}` and `source: 'user'`. Replaces the toast-only stub.
  - `removeEvent(id)` + `clearUserEvents()` — for completeness.
- Pure helper `getUnifiedEvents(year, month0, exams, userEvents)` merges 4 sources:
  1. `getSchoolEvents()` — `calendarEvents.filter(e => e.type !== 'Holiday')` so holidays come from the canonical school-calendar.ts source (audit fix #8 — Winter Break now shows on Dec 23, not the stale Dec 24 from E08).
  2. `getHolidaysForMonth(year, month0)` — iterates every day in the visible month, calls `getHoliday(dateStr)` (the canonical API), collapses multi-day breaks (winter/summer) to ONE event on the first day of the break that falls in the visible month (Dec 23 / Jan 1 / Apr 15). Single-day fixed holidays (Republic Day, Independence Day, Gandhi Jayanti, Christmas, New Year, Karnataka Rajyotsava) all show on their actual dates.
  3. `getExamEventsForMonth(year, month0, exams)` — for each ExamDTO: emits "<Name> Begins" on startDate, "<Name> Ends" on endDate, and "<Name> · <Subject>" for every schedule item whose date is in the visible month. Pulls room + startTime from the ScheduleItemDTO.
  4. `userEvents` from the store.
- Exports `formatISODate(d)` for the dialog default-date helper.
- Type `CalendarEvent` lives here (single source of truth for the whole module). Re-exported from `data.ts`.

### Phase 2 — data.ts refactor (78 lines, was 32)
- Kept: `TYPE_COLORS` (per-type small dot colors), `ALL_TYPES` (7 types), `WEEK_DAYS`, `pad(n)`.
- Added: `MONTH_NAMES` (12 names — used by grid + selected-day panel + add-event dialog), `buildMonthCells(year, month0)` (returns 42-cell array with nulls for empty cells), `getTodayInMonth(year, month0)` (returns the day-of-month if today falls in this month, else null — drives the "today" highlight).
- Removed: `YEAR`, `MONTH`, `FIRST_DAY`, `DAYS_IN_MONTH`, `dateStr(day)` — these hardcoded constants are replaced by runtime state in the shell.
- Re-exports `CalendarEvent` and `CalendarEventSource` from `@/lib/store/calendar-store`.

### Phase 3 — calendar-shared.tsx (NEW, 209 lines)
- `CalPanel` — same shape as LibPanel/TptPanel/InvPanel: `rounded-xl border border-border bg-card overflow-hidden` + optional header (px-4 py-2.5 border-b border-border/60 bg-muted/20) with title/subtitle/action + body (p-3).
- `CalPill` — compact pill (text-[9px] px-1.5 py-0.5 rounded-full).
- `CalTypeDot` — tiny colored dot for an event type (uses TYPE_COLORS).
- `CalTypeBadge` — type label with leading dot, soft tinted background per type (rose for Exam, emerald for Event, amber for Holiday, violet for Meeting, cyan for Competition, violet for Cultural, muted for General).
- `CalSourcePill` — small "Holiday" / "Exam" / "User" tag (school events get no tag since they're the default).
- `CalEmptyState` — motion.div with icon + title + description + optional action (same shape as LibEmptyState).
- `CAL_GLOBAL_STYLES` — reduced-motion CSS scoped to `.calendar-shell` (same pattern as LIB_GLOBAL_STYLES / INV_GLOBAL_STYLES).
- ACCENT_MAP defined (emerald/rose/amber/cyan/violet) — no indigo/blue.

### Phase 4 — calendar-grid.tsx rewrite (155 lines, was 86)
- Dropped GlassCard + StatusBadge + the "Academic Year 2025–26" StatusBadge mini-header.
- Uses CalPanel with the visible month name as title and event-count subtitle.
- Action area: Today + ChevronLeft + ChevronRight (all h-7 — slightly smaller than the shell's h-8 to fit a panel header). Calls onPrevMonth / onNextMonth / onToday props (which mutate the shell's year/month state — audit fix #3 — real month navigation, no more toast-only stubs).
- Week-day header row uppercase tracking-wider.
- Day cells: motion.button with aspect-square, rounded-xl border p-1.5, hover lift, today/selected highlights (primary/5 and primary/10 backgrounds). Shows up to 4 event-type colored dots (was 3) + "+N" overflow (audit fix preserves the grid dots as the primary visual).
- Dropped the static legend at the bottom (audit fix #6 — filter chips above the grid already show the same colors).
- Dropped the absolute-positioned event-title hidden span (was dead code — `hidden` class made it never render).

### Phase 5 — selected-day-panel.tsx rewrite (118 lines, was 75)
- Dropped GlassCard. Uses CalPanel with the dynamic date label "{day} {MonthName} {year}" as title (was hardcoded "December 2025") and event-count as subtitle.
- "Clear" link in the panel action (was an X icon button).
- Each event card: rounded-xl border-l-4 (color = TYPE_COLORS[type]) + bg-muted/20, title + CalTypeBadge + time + location. User/exam/holiday events also get a CalSourcePill.
- max-h-[420px] overflow-y-auto custom-scrollbar so long event lists scroll within the panel (UI rule — long lists get max-height + scroll).
- Empty state via CalEmptyState ("No events on this date" / "No day selected" with helpful description).

### Phase 6 — upcoming-events.tsx rewrite (108 lines, was 47)
- Dropped GlassCard. Uses CalPanel with title "Upcoming Events" + subtitle "Next N events" / "No events match the current filter".
- Dropped the duplicate CalendarDays icon in the panel title (audit fix #9 — was line 16 `<CalendarDays className="h-4 w-4 text-primary" />`).
- Reads from the unified events list, so holidays + exam events now appear alongside school events.
- Sorted by date+time, shows up to 6 events. Each row: date tile (colored by TYPE_COLORS) + title + time + location + CalTypeBadge + CalSourcePill.
- max-h-[420px] overflow-y-auto custom-scrollbar.
- CalEmptyState when filter shows nothing.

### Phase 7 — filter-chips.tsx rewrite (99 lines, was 30)
- Added "All / Clear" affordance on the left (audit's recommendation to make filter state discoverable).
- Each chip shows the live per-type count for the visible month as a small badge (tabular-nums) — replaces the static legend that was at the bottom of the grid.
- Active chip: bg-primary/10 border-primary/30 text-primary. Inactive: bg-card/40 border-border text-muted-foreground hover:bg-accent/40.
- Per-type colored dot uses TYPE_COLORS (same as the grid dots).
- Trailing "N events this month" summary (text-[10px] text-muted-foreground tabular-nums) for total count.
- aria-pressed for keyboard a11y.

### Phase 8 — add-event-dialog.tsx rewrite (148 lines, was 75)
- Wired to `useCalendarStore.addEvent` (audit fix #4 — real mutation, no more toast-only stub).
- Props now include `year` and `month` so the dialog can default the date picker to the first day of the visible month.
- Form state resets when the dialog opens (useEffect on `open`).
- New optional "Location" field (defaults to "School Campus").
- Validation: title + date required (toast.error on failure, dialog stays open). Type always set.
- On success: calls addEvent, toast.success with formatted date label, closes dialog. The new event appears in the grid + upcoming panel immediately (Zustand triggers re-render).
- Emerald→teal gradient primary button to match the shell's Add Event button.
- DialogDescription updated to explain user-added events appear in violet and persist for the session.

### Phase 9 — index.tsx rewrite (271 lines, was 92)
- Dropped SectionHeading + the import of `calendarEvents` + GlassCard. Header is now the shared pattern (audit fix #1):
  - Eyebrow: `text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]` with single CalendarDays h-3 w-3 icon (audit fix #9 — single CalendarDays in the live UI). Text: "Academic Year {year}-{YY+1} · {MonthName}".
  - h1: `text-base sm:text-lg font-bold tracking-tight` "Academic & Cultural Calendar" (contextual — not a duplicate "School Calendar" since sidebar says Calendar).
  - Short description: "School events, holidays, examinations & meetings in one view. Click a day to see its schedule."
  - Primary action: single emerald→teal gradient "Add Event" button (h-8 text-xs gap-1.5). Removed the duplicate "Today" button from the shell header (kept Today inside the calendar-grid panel header for contextual month navigation).
- NO summary pills (per Academics audit rule).
- State:
  - `year`/`month` default to today's date (real current year/month, not hardcoded 2025/11).
  - `selectedDay` defaults to null (audit fix #7 — was 8, which had no events). When null, the right-side panel shows UpcomingEvents.
  - `filterTypes` defaults to all 7 types.
- Subscribes to `useMockExamsStore.exams` and `useCalendarStore.userEvents` reactively. `getUnifiedEvents(year, month, exams, userEvents)` is wrapped in useMemo keyed on all 4 deps.
- Derived memos: `visibleEvents` (type-filtered), `eventsByDay` (grouped by day-of-month for the visible month, sorted by time), `cells` (42-cell grid), `todayDay` (real today if in this month), `typeCounts` (per-type live counts for the filter chips), `totalVisibleMonth`, `selectedEvents`, `upcomingEvents` (visible-month-onward filtered sorted).
- Handlers: `toggleType`, `prevMonth`/`nextMonth` (with year wrap + clear selectedDay), `goToToday` (sets year/month to today, clears selection), `clearSelection`.
- Layout: `flex flex-col h-full calendar-shell` + sticky header (`border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm`) + main content (`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3`).
- Main content: FilterChips row + 3-col grid (lg:grid-cols-3) with CalendarGrid spanning lg:col-span-2 and the right-side panel spanning 1 col. The right panel is `selectedDay !== null ? SelectedDayPanel : UpcomingEvents` — mutually exclusive (audit fix #5 — no more 3 simultaneous views).
- AddEventDialog gets `year` and `month` props for the date-picker default.

### Phase 10 — Verification
- `bun run lint` — 0 errors (only the unrelated ESLint config warning about .eslintignore → eslint.config.js migration, not an error).
- `bunx tsc --noEmit 2>&1 | grep "calendar/"` — empty (no calendar-module TypeScript errors).
- `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` — HTTP 200.
- dev.log shows successful compiles (no calendar errors after my edits — only transient errors from the brief window when data.ts was updated but index.tsx still imported the old YEAR/MONTH constants, resolved by the index.tsx rewrite).

Stage Summary:

### What changed (audit fix → file)
- Fix #1 (shared header + CalPanel): index.tsx fully rewritten (SectionHeading → eyebrow+h1+desc+action); calendar-shared.tsx created with CalPanel; calendar-grid.tsx, selected-day-panel.tsx, upcoming-events.tsx all use CalPanel (no more GlassCard).
- Fix #2 (wire to real events): calendar-store.ts created with `getUnifiedEvents` merging calendarEvents + school-calendar holidays + useMockExamsStore exams + user events.
- Fix #3 (month navigation): calendar-grid.tsx ChevronLeft/Right now call onPrevMonth/onNextMonth which mutate the shell's year/month state. No more toast-only stubs.
- Fix #4 (Add Event persistence): add-event-dialog.tsx calls `useCalendarStore.addEvent` — a real Zustand mutation. The grid + upcoming panel re-render to show the new event.
- Fix #5 (consolidate 3 simultaneous views): index.tsx renders ONE right-side panel — SelectedDayPanel when selectedDay !== null, UpcomingEvents otherwise. Mutually exclusive.
- Fix #6 (filter chips vs legend): calendar-grid.tsx no longer has the static legend at the bottom. FilterChips above the grid is the single source of truth for type colors (now with live counts).
- Fix #7 (default selectedDay=8 empty): index.tsx defaults selectedDay to null → UpcomingEvents shows on first load.
- Fix #8 (Winter Break Dec 23 vs Dec 24): calendar-store.ts uses `getHoliday(dateStr)` from school-calendar.ts (canonical source). calendarEvents E08 (Dec 24 Holiday) is filtered out (`e.type !== 'Holiday'`), so only the Dec 23 "Winter Break Begins" event appears.
- Fix #9 (duplicate CalendarDays icon): only the eyebrow (index.tsx line 195) shows CalendarDays persistently. The UpcomingEvents panel header no longer has its own CalendarDays icon (only CalEmptyState uses it when the list is empty, which is contextual not persistent).

### What was kept (per spec)
- Calendar grid layout (month view with day cells, 7 cols × 6 rows = 42 cells).
- Event-type filtering (filter chips now interactive with live counts).
- Add event dialog (form fields, validation, all 7 types, location field added).
- Selected-day detail view (now with source pill + dynamic date label).
- All existing event data preserved (calendarEvents still in operations.ts untouched; school-calendar.ts untouched; useMockExamsStore untouched).
- Per-type colored dots as small accents (not large color blocks).
- Emerald primary color, no indigo/blue.

### Design rules honored
- Header: small eyebrow → title → short description → primary actions (h-8 text-xs). NO summary pills. ✓
- Section containers: CalPanel (flat, rounded-xl border border-border bg-card overflow-hidden + header + body). No GlassCard. ✓
- Color: emerald primary, small accent dots for event types. ✓
- Buttons: h-8 text-xs in shell, h-7 in panel headers. Primary emerald→teal gradient, secondary outline. ✓
- Icons: h-3 (eyebrow), h-3.5/h-4 (buttons), h-5 (empty states). ✓
- NO indigo or blue. ✓

### Files added/modified
- ADDED: src/lib/store/calendar-store.ts (241 lines)
- ADDED: src/components/principal/modules/calendar/calendar-shared.tsx (209 lines)
- MODIFIED: src/components/principal/modules/calendar/data.ts (78 lines, was 32)
- MODIFIED: src/components/principal/modules/calendar/index.tsx (264 lines, was 92)
- MODIFIED: src/components/principal/modules/calendar/calendar-grid.tsx (155 lines, was 86)
- MODIFIED: src/components/principal/modules/calendar/selected-day-panel.tsx (118 lines, was 75)
- MODIFIED: src/components/principal/modules/calendar/upcoming-events.tsx (108 lines, was 47)
- MODIFIED: src/components/principal/modules/calendar/filter-chips.tsx (99 lines, was 30)
- MODIFIED: src/components/principal/modules/calendar/add-event-dialog.tsx (148 lines, was 75)

### Out of scope (NOT touched)
- src/lib/mock/operations.ts (calendarEvents array preserved as-is).
- src/lib/mock/school-calendar.ts (FIXED_HOLIDAYS/WINTER_BREAK/SUMMER_BREAK untouched; used via the public getHoliday API).
- src/lib/exams/mock-exams-data.ts (useMockExamsStore untouched; consumed via the hook).
- Other Operations modules (Library, Transport, Inventory, Certificates, Downloads, Communication, Messaging) — other agents are working on these in parallel.
