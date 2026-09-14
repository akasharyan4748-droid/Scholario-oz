# Task ID: RB-1 — Rebuild the documented 2.9.0 deltas on the verified 2.7.1 base (ship as 2.9.1)

Agent: full-stack-developer
Scope: Student Workspace module removals (My Progress + My Library), session-scoped
Class Leadership resolution, assignment-conditional Transport nav, and the
server-authorized Study Materials repository (Prisma model + API + seed +
student UI). No changes to src/app/api/student/payments/*, src/lib/payments/*,
Fees/Profile/School-ID modules (SWR-1 constitution respected).

## SESSION CONTEXT (important for the orchestrator)

This RB-1 session resumed an INTERRUPTED prior attempt: most item-1..4 code was
already on disk (uncommitted, no worklog entry, scratch `.tmp-rb1/` present).
This session therefore AUDITED every item against the task spec, fixed the
loose ends, ran the FULL gate suite (curl + lint + tsc + browser QA), recovered
the dev server after an OOM kill, cleaned scratch/test state, and wrote the
records. Evidence trail below.

## What shipped (per item)

### ITEM 1 — My Progress + My Library removed (SWR-1 Wellbeing discipline)
- `src/components/student/student-panel.tsx`: nav items, render branches,
  LEGACY_MODULE/LEGACY_TAB entries and imports for progress/my-library REMOVED.
- DELETED (exclusively used by My Progress / My Library — grep-verified, tsc
  confirms zero dangling imports):
  `modules/progress.tsx`, `modules/my-library.tsx`, `modules/portfolio/` (7 files),
  `modules/career-explorer/` (6 files), `modules/achievements/` (8 files),
  `src/lib/mock/career.ts`, `src/lib/mock/portfolio.ts`.
- `modules/notifications/index.tsx`: `StudentNotificationTarget` union lost
  `'my-library'`; overdue-library notification kept as informational (no
  target) — the school-library circulation card on the dashboard is a
  DIFFERENT feature and stays.
- `modules/shared-tabs.tsx` doc comment updated (was still listing "Progress").
- grep clean: zero `My Progress` / `my-library` / `progress` nav-key references
  in the student tree. CommandPalette is nav-derived → removed modules cannot
  surface in ⌘K.

### ITEM 2 — Canonical session-scoped Class Leadership
- `StudentPosition` (students-store/types.ts) gained `sessionId: string`
  ('2026-2027' hyphen convention from `@/lib/academic-session`).
- `src/lib/student-positions.ts` exports
  `filterActivePositions(positions, studentId, sessionId)` — the ONLY activity
  resolver (checks `active && studentId && sessionId` internally).
- Sweep complete: student-panel nav derivation, my-class/index.tsx workspace,
  dashboard class-responsibility-banner, profile.tsx position chips, principal
  class-leadership.tsx (holder resolution + displacement), principal
  students/profile-tab-overview.tsx, students-store assignStudentPosition
  (one-holder-per-class-section-position-SESSION), and
  class-responsibility-store authorize() all resolve through the canonical
  resolver. No remaining direct `p.active` position checks in src/
  (roster/fee-head `active` flags are unrelated domains).
- Demo seed: POS-SEED-2 (STU-58 Aarav Sharma, class-captain, Class 2-A,
  sessionId 2026-2027, active) → Class Captain workspace renders in the demo
  (browser-verified).

### ITEM 3 — Transport nav assignment-conditional
- `useTransportAssignment(studentId)` added to transport-store.ts: true when
  the roster opt-in (`StudentRecord.transport`) OR an Assigned row exists in
  the transport assignments store.
- student-panel filters the RECORDS 'bus' item through it. Demo student
  STU-58 has `transport: true` → stays visible in the demo; code path is
  genuinely conditional (nav + ⌘K both derive from the filtered groups).

### ITEM 4 — Study Materials, end-to-end
- Prisma `model StudyMaterial` (schema.prisma) per spec (+`@@index([schoolId,
  category])`, `@@index([schoolId, createdAt])`); `bun run db:push` applied.
- `.gitignore`: `db/uploads/` (never commit user bytes).
- `src/lib/study-materials.ts`: server helpers — categories vocabulary,
  20MB cap, MIME allowlist→ext map, safe fileName generator, path guard
  (`isSafeStoredFileName`), RFC 6266 Content-Disposition builder.
- API (withUser/schoolScoped pattern; `runtime = 'nodejs'`):
  - `GET /api/study-materials` — STUDENT/TEACHER/PRINCIPAL; `?category=
    &subjectId=&q=`; metadata only (fileName never leaves the server);
    subjectName resolved server-side; newest first.
  - `GET /api/study-materials/[id]/download` — same roles; school RLS;
    streams with Content-Type + Content-Disposition attachment +
    originalName; honest 404 when row or disk file missing; no-store.
  - `POST /api/study-materials` — PRINCIPAL only; multipart; 20MB; MIME
    allowlist; safe generated fileName; row + disk write; returns metadata.
  - `DELETE /api/study-materials/[id]` — PRINCIPAL only; deletes row + file.
- `prisma/seed-study-materials.ts` (+`bun run db:seed-study-materials`
  script): 10 realistic materials for the demo school (class 2-A + general),
  categories across worksheet/notes/syllabus/sample-paper/revision/general,
  REAL tiny files (hand-built valid PDFs w/ correct xref + .txt; 9.3KB
  total) written to `db/uploads/study-materials/`. Idempotent (replaces the
  school's rows + bytes). Seed run verified: 10 rows / 10 files / 0 orphans.
- Student UI `modules/study-materials/index.tsx` (`StudyMaterialsModule`):
  count badge, category filter chips, debounced server-side search, cards
  (title, description, subject/class chips, category badge, type, size +
  date), Download → authorized fetch → blob download with per-file spinner +
  error toast; loading skeleton; honest error state with retry; empty state
  "No study materials yet"; tablet-first responsive; amber/emerald/violet/
  rose/teal accents (no blue/indigo).
- Nav: LEARNING group `{ key: 'study-materials', label: 'Study Materials',
  icon: FolderOpen }`, staticModules registry entry, LEGACY deep-link
  `materials → study-materials`. Nothing else removed from nav.
- Principal upload UI: DEFERRED this round (per task instruction).

## API contract

All responses use the `api()` envelope `{ ok, data }` / `{ ok: false, error }`;
auth = HttpOnly `erp_session` cookie from POST /api/auth/login
(student1@demoschool.edu / password123).

- `GET /api/study-materials?category=&subjectId=&q=` →
  `{ ok: true, data: [{ id, title, description, subjectId, subjectName,
  className, category, originalName, sizeBytes, mimeType, createdAt }] }`
  (newest first; `fileName` never returned).
- `GET /api/study-materials/[id]/download` → 200 file stream
  (`Content-Type: <mimeType>`, `Content-Disposition: attachment;
  filename="<originalName>"; filename*=UTF-8''…`, `Content-Length`,
  `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`);
  401 unauth; 404 unknown id / other school's row / missing disk file.
- `POST /api/study-materials` (multipart: title, description?, subjectId?,
  className?, category, file) → `{ ok: true, data: <meta> }`; 403 non-
  principal; 400 bad category / bad MIME / empty file / >20MB / missing
  title; subjectId validated against the school's Subject rows.
- `DELETE /api/study-materials/[id]` → `{ ok: true, data: <deleted meta> }`;
  403 non-principal; 404 unknown/other-school.

## Gates

- `bun run lint` clean · `bunx tsc --noEmit` exit 0.
- curl (student session): list 10 items; `?category=worksheet` → 3;
  `?q=SYLLABUS` → 1 (case-insensitive); unauth 401; student POST/DELETE 403;
  principal POST 200 then DELETE 200 (row + file removed; back to 10/10);
  bad MIME 400; PDF download: correct headers + `%PDF-1.4` bytes (1342B);
  TXT download correct; unknown id 404.
- agent-browser (student login): LEARNING = Learning + Study Materials, NO
  My Progress; no "My Library" anywhere; Class Leadership workspace renders
  (Class Captain, capability cards); Study Materials lists "10 materials" +
  10 cards; Download click fires authorized GET 200; ZERO page/console
  errors; screenshot `qa-shots/rb1-study-materials.png`; browser closed.
- APP_VERSION = '2.9.1' (`src/lib/app-version.ts`, `/api/app-version` echo
  verified, sidebar footer visible in QA).

## Deviations / incidents (honest log)

1. **Dev server OOM-kill during gates**: kernel log shows
   `oom-kill … task=next-server (pid 21167) anon-rss 2721304kB` — the
   documented RESTORE-1 failure mode (lint/tsc alongside the dev server on
   the 4GB box). This session did NOT kill it; it restarted it ONCE via the
   documented double-fork pattern (`( bun run dev & )`) after confirming
   nothing listened on :3000. Single instance verified; :3003 event-stream
   untouched throughout. Future agents: run tsc and lint SEQUENTIALLY and
   only when the dev server is idle; expect next-server RSS ~2.9GB.
2. Prior-session scratch `.tmp-rb1/` (RLS test scripts) was used for
   verification queries, then deleted; its throwaway `rb-test-school` +
   test rows were already cleaned by the prior session (verified: 1 school,
   10 rows, 0 orphans).
3. Principal upload UI deferred (task instruction) — DELETE/POST APIs are
   live and curl-verified for whenever that UI lands.
