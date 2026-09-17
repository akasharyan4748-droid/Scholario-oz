# TWC-FE-2 — Class Attendance frontend rewrite (baseline + subject sessions)

Agent: full-stack-developer
Date: 2026-09-17 (engagement clock)
Status: COMPLETE — tsc + eslint clean for this module, no browser/dev-server usage.

## Scope honored
Rewrote ONLY the Class Attendance module. Nothing outside `src/components/teacher/modules/attendance*` was touched.

## Files
- DELETED: `src/components/teacher/modules/attendance.tsx` (old hardcoded Class 2-A/B/C + client-store implementation)
- CREATED: `src/components/teacher/modules/attendance/index.tsx` — `AttendanceModule` composition root (still importable as `'../modules/attendance'`, no props — module-router untouched and verified importing `<AttendanceModule />`)
- CREATED: `src/components/teacher/modules/attendance/shared.ts` — API contract types, STATUS_CONFIG recipes (verbatim from old module), pure helpers (buildDraft prefill priority, rosterContextLine, draftCounts, countsParts, LOCAL-time date helpers)
- CREATED: `src/components/teacher/modules/attendance/hooks.ts` — envelope fetch client (`{ cache:'no-store', credentials:'same-origin' }`, 401 → `signOut()` from `@/lib/signout`) + `useAttendanceModule` hook

## Data flow (matches TWC-2 backend exactly)
1. `GET /api/teacher/class-attendance` → classes (class-teacher-of + teaches-in), default = first class.
2. `GET /api/teacher/class-attendance/board?classId=&date=` on every class/date/reload change → roster + baseline + mySessions. GETs only — viewing never writes.
3. Draft in state, keyed by **studentId** (server contract), rebuilt from server truth on board/subject change; status taps only mutate local state.
4. Save → class-teacher mode POSTs `/baseline`, subject mode POSTs `/session` → toast (`Attendance saved` / `Grade 9 - A · 9 present · 1 absent · 1 late`, zero parts omitted) → board refetch (roster dims via opacity while refreshing; board kept visible so no skeleton flash).

## Mode UX
- Toolbar context: `Mark attendance · Thursday, 17 September 2026` (selected date, LOCAL parse).
- Action area: class Select → (subject Select in subject-teacher mode only) → `<input type="date">` max=today default=today (house h-9 styling, color-scheme dark support, future dates ignored client+server) → Save (mode-aware label "Save attendance" / "Save session", Saving…/Saved pill via AnimatePresence).
- Class-teacher mode: prefill baseline.entries else all-PRESENT; quiet line "Official record · marked by X" / "Today's attendance hasn't been marked yet". Class teachers always use baseline mode even if they teach subjects.
- Subject mode: prefill mySessions[subjectId] → baseline ("Prefilled from the class teacher's attendance — change only exceptions") → all-PRESENT ("Class teacher hasn't marked today yet"); saved session shows "Your Mathematics session · saved 10:42 AM" and Save stays available (upsert).
- Roster: 4 status buttons (old statusConfig recipe, uppercase keys, LEAVE keeps the theme's `info` sky tokens), roll tile + GradientAvatar + name, row tint by status, name/roll search, "Mark all present", 390px-safe (labels hide below sm, toolbar action wraps internally).
- Counts strip: 4 GlassCards live draft counts / total (old recipe, value spring).
- Empty states: no classes / no students / search miss (HubEmptyState). Loading: HubModuleSkeleton (classes) + BoardSkeleton (4 cards + 6 rows). Errors: HubSectionError quiet retry cards.
- Footer: total + rate + honest manual-save indicator (Unsaved changes / In sync with the saved record / Nothing saved for this date yet) — the old misleading "Auto-save" line is gone.

## Gates
- `bunx tsc --noEmit` → **0 errors in the attendance module** (verified via filtered re-run). Project-wide output at gate time contained only errors from PARALLEL agents' modules (`marks/index.tsx` mid-write; a transient missing `lesson-planner` that TWC-FE-1 landed while I gated) — outside my scope, untouched.
- `bunx eslint src/components/teacher/modules/attendance --ext .ts,.tsx` → **0 problems**.
- dev.log tail: no attendance-module compile errors (only the dashboard agent's transient `./widgets` miss).
- No dev server / browser usage.

## Deviations (all within spec latitude)
1. Folder layout `modules/attendance/{index,shared,hooks}` instead of single file — explicitly permitted; export path unchanged.
2. When a PAST date is selected, the literal "today" context strings adapt to the honest date ("Attendance for 17 Sep hasn't been marked yet"); the today-case strings match the spec verbatim.
3. Toast count parts omit zero counts (mirrors the spec's own example where leave=0 is absent).
4. Save button label is mode-aware; roster subtitle dropped the redundant "Class 2-A" repetition (label already in header).

## Handoff notes for QA / next agents
- Draft prefill priority, status values (uppercase PRESENT/ABSENT/LATE/LEAVE) and endpoints verified against the live route handlers in `src/app/api/teacher/class-attendance/*`.
- Seeded demo truth (from TWC-2): rohan = class teacher of Grade 9-A (11 students) AND Math teacher in 9-A + 10-A → 9-A shows baseline mode, 10-A shows subject mode; baseline exists for 9-A yesterday (9P/1A/1L by Rohan Mehta) — good QA path: pick yesterday's date on 9-A.
