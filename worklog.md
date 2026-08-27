# Scholario-oz — Worklog (Handover Document)

## Project Overview
- **Product**: SCHOLARIO-OS — Enterprise School ERP (Next.js 16 + App Router, TypeScript, Tailwind CSS 4, shadcn/ui New York, Prisma + SQLite, Zustand)
- **Source repo**: https://github.com/akasharyan4748-droid/Scholario-oz (branch `main`, linked as `origin`)
- **Work dir**: `/home/z/my-project`
- **Entry point**: `src/app/page.tsx` — routes between PublicWebsite → LoginPage → role panels (Principal / Teacher / Student / SuperAdmin) based on Zustand auth store (persisted in localStorage)

## Demo Accounts (seeded via `bun run db:seed`)
| Role | Email | Password |
|---|---|---|
| Super Admin (showcase) | admin@scholario.cloud | admin123 |
| Super Admin (legacy) | admin@erpsuite.io | admin123 |
| Principal | principal@demoschool.edu | password123 |
| Teacher | teacher1@demoschool.edu | password123 |
| Student | student1@demoschool.edu | password123 (login form also pre-fills aarav.sharma@greenwood.edu.in) |

---
Task ID: 1
Agent: Z.ai Code (main orchestrator)
Task: Import everything from https://github.com/akasharyan4748-droid/Scholario-oz main branch into /home/z/my-project and verify the app runs.

Work Log:
- Cloned `main` (commit `7c795a4`) from GitHub into /tmp/scholario-oz.
- Inspected repo: same Next.js 16 + shadcn scaffold as workspace; ~large codebase with principal/teacher/student/superadmin panels, exams, admissions wizard, fees, payroll, library, transport, inventory, certificates, homework oversight, AI question generation (z-ai sdk in backend routes), command palette, etc.
- rsync-overlaid all repo files (excluding `.git`, `.env`) onto /home/z/my-project; removed stale single-file `src/components/ui/chart.tsx` in favor of repo's modular `ui/chart/` folder; copied repo `.gitignore`.
- `bun install` → 351 packages OK. `bun run db:push` OK (DATABASE_URL=file:/home/z/my-project/db/custom.db). `bun run db:seed` OK → demo school, users, students, fees, homework etc.
- First dev-server start hit a Turbopack FATAL panic (`VAR_MODULE_GLOBAL_ERROR missing`) — root cause: stale `.next` cache + a dev.log inherited from repo written by repo's bundled respawn mini-service (stale FATAL entries caused confusion). Fix: killed all next processes, `rm -rf .next`, deleted stale dev.log, restarted with clean log capture. Server then healthy (`next-server v16.3.2`, HTTP 200).
- `bun run lint` → 0 errors.
- Agent-browser QA:
  - Public website renders fully (hero, features, facilities, admission inquiry form, footer). Screenshot: download/qa-import-landing.png
  - Login portal: Principal login works → full dashboard (KPIs attendance 93%, pending fees ₹1.84 Cr, 47 admissions, alerts feed). Screenshot: download/qa-import-principal.png
  - Admissions module: KPI strip (2 pending review / 1 correction / 1 approved / 1 enrolled), tabs, applicant table with Review actions. Screenshot: download/qa-import-admissions.png
  - Fee Management: Overview tab with Total Expected ₹40.62L / Collected ₹29.68L / Outstanding ₹18.38L, collection trend chart, sub-tabs (Student Accounts, Fee Structures, Payments, Transactions, Settings). Screenshot: download/qa-import-fees.png
  - Student panel: gradient welcome banner, KPI cards, Smart Up Next (AI suggested), Today's Classes. Screenshot: download/qa-import-student.png
  - Mobile 390px viewport: no horizontal scroll (QA: NO_HORIZ_SCROLL).
  - No browser console/page errors during any flow.
- Linked `origin` remote to the GitHub repo for future pulls; created this worklog; set up 15-min webDevReview cron job.

Stage Summary:
- ✅ Import complete and verified end-to-end. App runs at port 3000, lint clean, DB seeded, all 4 role panels + public site verified in a real browser.
- Key decisions: overlay-merge (repo was same scaffold), use db/custom.db (workspace convention), keep repo's modular ui/chart, drop stale global-error.tsx? NO — global-error.tsx restored (was only moved for a panic test that turned out unrelated; file is back at src/app/global-error.tsx).
- Dev server: `bun run dev` (log at /home/z/my-project/dev-runtime.log). Do NOT trust old /home/z/my-project/dev.log entries — that file was inherited from the repo; current runtime log is dev-runtime.log.

## Current State Assessment
- Project phase: **Stable baseline** — freshly imported, fully compiling, core navigation and role dashboards working.
- Architecture notes for future agents:
  - Auth = client-side Zustand (`src/lib/store/auth-store.ts`) + API routes `/api/auth/login|logout|me`; roles: superadmin, principal, teacher, student.
  - Many modules use client-side Zustand mock stores (`src/lib/mock/*`, `src/lib/store/*`) — real DB-backed routes exist for students, teachers, classes, exams, homework, fees, admissions, transport, library, etc.
  - `mini-services/dev-server` from repo auto-respawns `bun run dev` and writes /home/z/my-project/dev.log — it was NOT started in this session; the workspace runs `bun run dev` directly.

---
Task ID: 2
Agent: Z.ai Code (webDevReview cron round)
Task: Assess project status, QA via agent-browser, fix bugs + add features/styling polish.

Work Log:
- Reviewed worklog; confirmed server healthy (HTTP 200) and lint clean.
- Browser QA sweep: public site, teacher panel (dashboard + homework module), superadmin panel (platform overview + command palette search) — all functional, no console errors.
- Bugs found & fixed:
  1. Command palette showed duplicated label "Class Class 2-A" — `src/lib/search-service/search-people.ts` badge template prefixed "Class" onto className that already contains it. Removed the redundant prefix.
  2. Superadmin platform KPIs ("Total Fee Collections" / "Gross Revenue") showed ₹0 — seed created Fee rows with paid amounts but zero Payment transaction rows, and the dashboard API sums Payment.amount. Fixed both: (a) `prisma/seed.ts` now creates a Payment row for every paid fee (rotating UPI/CARD/NETBANKING/CASH methods, TXN ids); (b) added `prisma/backfill-payments.ts` one-off script and ran it → 13 payment rows created. Verified in browser: revenue now shows ₹3.25 L (13 × ₹25,000 ✓).
- Feature: notification bell now wired to the real DB-backed `/api/notifications-feed` (previously static mock only):
  - `src/components/shell/app-shell.tsx` fetches feed on mount + polls every 60s, maps to NotificationItem with relative timestamps ("just now / Xm / Xh / Xd ago"); falls back to demo mock when feed empty/unavailable. Key gotcha handled: API wraps payloads as `{ ok, data }` — must read `data.feed` (first attempt read `j.feed` and silently stayed on mock).
  - `notifications-dropdown.tsx`: added Live/Demo source badge (green pulsing dot = DB-synced, amber = demo fallback), proper empty state ("You're all caught up"), animated unread dots, icon hover scale, line-clamp descriptions, custom-scrollbar list, responsive width `w-[min(22rem,calc(100vw-2rem))]`.
- Exported `NotificationItem` type from dropdown and imported into app-shell.
- Verification (agent-browser): superadmin revenue ₹3.25 L ✓; palette badge "Class 2-A" ✓; principal dropdown shows ● LIVE + 2 real announcements ("Mid-Term Results Published", "Parent-Teacher Meeting") with relative times ✓; mobile 390px no horizontal overflow ✓; lint clean ✓; `/api/notifications-feed` returns 200 in dev log ✓.
- Screenshots: download/qa-teacher-panel.png, qa-teacher-homework.png, qa-superadmin-panel.png, qa-superadmin-revenue.png, qa-command-palette.png, qa-palette-search.png, qa-notifications-live.png, qa-notifications-live3.png, qa-notifications-mobile.png

Stage Summary:
- Baseline remains stable; 2 bugs fixed, 1 feature wired (live notifications), several styling refinements shipped.
- seed.ts changed — next full `bun run db:seed` will include Payment rows automatically; backfill script kept at prisma/backfill-payments.ts for existing DBs.

## Current State Assessment (updated after Task 2)
- All 4 role panels + public site verified again post-changes; server stable, lint clean.
- Notifications: principal/teacher/student now see real DB announcements/messages with Live badge; superadmin intentionally gets empty DB feed → falls back to demo mock with Demo badge.

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Medium) Search service (`search-people.ts`, `search-academic.ts`) still reads mock students/teachers — migrate to DB-backed search API for consistency.
2. (Medium) Mark-as-read is client-side only; no API persists read state for MESSAGE notifications — add PATCH endpoint + call it on notification click.
3. (Low) Superadmin dropdown always falls back to demo mock (API returns empty by design) — consider showing a real "no school scope" empty state instead.
4. (Feature ideas): payment-method breakdown donut on superadmin dashboard (data now available in Payment table), WebSocket push for live alerts, i18n, PWA offline, skeleton loading states per module.
---
---
Task ID: 3
Agent: Z.ai Code (webDevReview cron round)
Task: Assess project, QA via agent-browser, then implement the 4 next-phase priorities from Task 2 (DB-backed search, read persistence, superadmin scope UX, payment-method donut).

Work Log:
- Health check: HTTP 200, lint clean, no console errors. Quick QA sweep of public site passed.
- FEATURE 1 — DB-backed global search (`/api/search`):
  - New route `src/app/api/search/route.ts`: `withUser` + schoolId-scoped Prisma queries across students (User.name/admissionNo/rollNo), teachers (name/employeeId/department), fees (title/student name; TEACHER role excluded), announcements, and inbox messages. Returns canonical `SearchResultItem[]` with badges (fee status, priority, read state).
  - `use-command-palette.ts`: 250ms debounced fetch when query >= 2 chars; merges remote results and REPLACES mock-derived student/teacher/fee/notice items (dedupe by type) while keeping local feature/class/settings results; on fetch failure falls back to the old all-mock behavior. Parents remain mock (documented).
  - Verified: "Tuition" → 6 real fee rows w/ PAID/UNPAID badges + collected %; "Aarav" → 2 real DB students (DEMO-2025-0001, GWS2024018) + 1 fee — mock duplicates GONE (mock students use DSO* ids, DB uses DEMO-2025-*/GWS* ids — easy tell).
- FEATURE 2 — read persistence:
  - `PATCH /api/notifications-feed` — persists `read:true` for MESSAGE items (validates recipient ownership; announcements intentionally ephemeral, returns persisted:false).
  - app-shell: `persistRead()` fire-and-forget on notification click + mark-all-read (only when source==='live').
  - Verified end-to-end: created test message via script → appeared as unread in LIVE feed → clicked → dev log shows PATCH 200 → DB row now `read:true`.
- FEATURE 3 — superadmin "Platform scope" banner:
  - NotificationsDropdown now accepts children; app-shell renders violet info banner for role=superadmin + demo fallback: "Super admins manage tenants across schools — no personal school inbox. Showing demo feed." Verified in browser.
- FEATURE 4 — superadmin payment-method donut:
  - `/api/dashboard` SUPER_ADMIN branch: added `methodBreakdown` (payment.groupBy method, SUCCESS only, sum+count).
  - `dashboard.tsx`: new "Collections by Payment Method" premium Donut (center total ₹3.25 L, emerald/amber/violet/pink palette) + "Transaction Ledger by Method" panel with per-method rows (txn count, INR amount, % of collections, ProgressBar). Also wired the previously-unused `loading` state into an animated skeleton (banner + KPI grid + panel shimmer, staggered delays, aria-busy).
- QA: mobile 390px fits (no h-overflow); /api/search, /api/dashboard, PATCH/GET /api/notifications-feed all 200 in dev log; lint exit 0.

Stage Summary:
- All 4 next-phase priorities from Task 2 are DONE and verified in-browser. Screenshots: qa-dbsearch-fees.png, qa-dbsearch-students.png, qa-msg-notif.png, qa-superadmin-donut7.png, qa-superadmin-scope-banner.png.
- Test message "Syllabus completion report — August" left in DB (read:true) — harmless, realistic demo data.

## Current State Assessment (after Task 3)
- Search: authoritative DB results for people/fees/notices/messages; instant local results for features/classes/settings; graceful mock fallback.
- Notifications: live feed + persisted read state (messages) + honest superadmin scope UX.
- Platform dashboard: real collections analytics (donut + ledger + skeleton loading).

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Medium) Parents & Guardians palette results still come from mock (`parentConversations`) — DB has guardianName/guardianPhone on Student; migrate when touching search next.
2. (Medium) Announcement read-state is ephemeral (no per-user read table) — add `NotificationRead` join model if persistent announcement acks are needed.
3. (Low) `db.payment.groupBy` on method returns raw strings ('UPI','CARD',...) — if methods become free-text, normalize labels in UI.
4. (Feature ideas): WebSocket live-alert push; teacher-facing collection snapshots; search result deep-linking (open student profile drawer directly); i18n; PWA.
---
Task ID: 4
Agent: Z.ai Code (webDevReview cron round)
Task: Assess project, QA, then execute remaining priorities from Task 3 (guardian search migration, persistent announcement acks, payment label normalization) + styling polish.

Work Log:
- Health check passed (HTTP 200, lint clean). QA sweep: public site + principal login + palette — no errors.
- FEATURE 1 — DB-backed Parents & Guardians search:
  - `/api/search` now queries Student.guardianName/guardianPhone (+ ward name via User relation) and emits canonical `Parents & Guardians` items ("Sharma Family — Guardian of Aarav Sharma · +91 124 2323 4545").
  - `use-command-palette.ts` DB_TYPES now includes 'parent' → mock `parentConversations` entries are fully replaced by DB rows when server results arrive. Last mock domain in the palette is gone.
  - Verified: "Sharma Family" and "Diya" both return real guardian rows from DB.
- FEATURE 2 — persistent announcement acknowledgements:
  - Schema: new `NotificationRead` model (unique [notificationId, userId], cascade deletes) + `reads` relation on Notification + `notificationReads` on User. `bun run db:push` OK (client regenerated).
  - `GET /api/notifications-feed`: announcements now carry per-user `read` (reads relation filtered by userId); unreadCount = unreadMessages + unreadAnnouncements (take raised 5→8).
  - `PATCH`: ANNOUNCEMENT branch upserts NotificationRead with school-scope validation; returns persisted:true.
  - app-shell feed mapping now respects `read` from API (`unread: f.read === false`) instead of forcing everything unread.
  - GOTCHA: after db:push, the running dev server kept the OLD Prisma client → `include: { reads }` 500'd. Fix: restart dev server (killed next-server, rm -rf .next) → all green.
  - Verified end-to-end: announcements read:false + unread 2 → clicked "Mid-Term Results Published" → PATCH 200 → NotificationRead row in DB (user principal@…) → after reload feed shows read:true, unreadCount 1.
- FEATURE 3 — payment method labels normalized (superadmin ledger + donut): CARD→Card, NETBANKING→Net Banking, CASH→Cash, CHEQUE/WALLET/UNKNOWN mapped; verified raw "NETBANKING" no longer appears.
- FEATURE 4 — palette match highlighting: `HighlightMatch` in palette-results-list wraps case-insensitive query matches in title+subtitle with soft primary <mark> tint. Verified "Mid-Term" highlighted in both title and description.
- QA: mobile 390px fits; /api/search + /api/dashboard + GET/PATCH /api/notifications-feed all 200; lint exit 0; no console errors.
- Screenshots: qa-guardian-search.png, qa-palette-highlight.png, qa-method-labels.png.

Stage Summary:
- Command palette is now 100% DB-authoritative for people/fees/notices/parents (only features/classes/settings remain local, by design).
- Notification read-state is fully persistent for BOTH messages and announcements, with correct unread aggregation.
- Dev server was restarted this round to load the regenerated Prisma client — note for future agents: after ANY `db:push` that adds models/relations, restart `bun run dev` or Prisma queries on new relations will 500.

## Current State Assessment (after Task 4)
- All prior mock→DB migrations for search & notifications are complete. Remaining mock usage is confined to module-level demo stores (classes timetables, library demo rows, etc.) which are presentation-data, not entity data.
- Schema now has 2 migration artifacts this session: Payment backfill (Task 2) + NotificationRead table (Task 4). Fresh clones can reproduce with `bun run db:push && bun run db:seed`.

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Medium) Search result deep-linking: clicking a student/fee currently navigates to the module top — consider a `selectedId` store so modules can auto-open the relevant profile/detail drawer.
2. (Medium) Real-time: live-alerts store is simulated client-side; a socket.io mini-service could push genuine events (new admission, fee payment) to the bell.
3. (Low) Announcement audience field ('ALL','PARENTS'…) is not filtered per viewer role — feed shows all announcements to everyone.
4. (Feature ideas): i18n via next-intl (package already installed); PWA manifest + offline shell; per-method collection trend over time (needs payment createdAt-based series); export ledger CSV button.
---
Task ID: 5
Agent: Z.ai Code (webDevReview cron round)
Task: Assess project, QA via agent-browser, then execute next-phase priorities: announcement audience filtering (P3), real-time event stream (P2), monthly method trend + CSV export (P4) + styling polish.

Work Log:
- Health check passed (HTTP 200, lint clean). QA sweep via gateway :81 — public site + superadmin dashboard stable, zero console errors. No blocking bugs → proceeded to features.
- FEATURE 1 — Real-time event stream (socket.io mini-service):
  - New `mini-services/event-stream/` (port 3003, socket.io path '/', Caddy gateway compatible). Read-only `bun:sqlite` attach to db/custom.db; polls every 4s for NEW successful Payment rows + Notification (announcement) rows created since service boot; broadcasts `school-event` frames (kind, schoolId, title, detail, amount, method, at). Seen-set dedupe (second-precision timestamps) + watermark advance; memory bounded.
  - GOTCHAS: (a) Prisma stores DateTime as epoch-millis INTEGER in SQLite — watermark comparisons must be numeric, not ISO strings; (b) there is NO Admission table (admissions module is client-mock) — polling it 500s; (c) `bun --hot` reloads after file edits can leave the running process in a stale state — do a clean restart (pkill + fresh start) after editing index.ts.
  - Start command: `cd mini-services/event-stream && bun run dev` (setsid + nohup for persistence). Log: /home/z/my-project/event-stream.log.
  - Client wiring in `app-shell.tsx`: resolves viewer school scope via `/api/auth/me` (client SessionUser has no schoolId; superadmin → null → platform-wide stream), then `io('/?XTransformPort=3003')`. On event: scope-filter → prepend NotificationItem to bell feed (auto-mapped ₹ icon for payments) + premium toast (accent stripe, ₹/megaphone chip, pulsing LIVE pill, 5s). Bell gets emerald pulsing dot when connected; dropdown shows "Live event stream connected" pill for all roles.
  - E2E verified: SQL-inserted 3 payments → service logged `payment → Aarav Sharma ₹9200 (CARD)` etc. → browser toast captured on screenshot, bell badge 5→8, dropdown items "just now" with ₹9,200 via Card / ₹18,500 via UPI / ₹12,500 via Net Banking. Test rows kept but naturalized (note "Q1 tuition instalment — counter collection", TXN-Q1-*).
- FEATURE 2 — Monthly Collections by Channel (superadmin):
  - `/api/dashboard` SUPER_ADMIN branch: new `methodTrend` (month × method sums, last 6 months). Window slides back to the latest payment month when the recent window is empty (sandbox clock vs old seed data) so the chart never renders flat zeroes; buckets pre-seeded for continuity.
  - `dashboard.tsx`: hand-rolled `StackedMethodColumns` (donut-matched colors, spring grow-in, hover isolation via legend, per-column breakdown popover, gradient segments, rounded tops, month+total labels, empty state). DEBUGGED: percentage-height segments collapsed inside auto-height flex parent — fixed with `flex-1 min-h-0` + `max-w-24` column caps. Verified desktop 1440 + mobile 390 (no h-scroll), hover popover shows per-method breakdown.
- FEATURE 3 — CSV ledger export:
  - New `/api/payments-export` (GET, auth: superadmin = platform-wide, staff = school-scoped; limit ≤2000): streams text/csv with Txn ID/Date/Student/Admission No/Class/Fee/School/Method/Status/Amount. FRAMEWORK FIX: `api()` in lib/api.ts now passes through raw `Response` instances (previously any handler returning Response got JSON-shredded into `{ ok, data: {} }`).
  - Export button on Transaction Ledger panel (emerald outline, Loader2 spinner while busy, Check "Saved" state, hover ring + translate icon).
- FIX — Announcement audience filtering (was: everyone saw everything):
  - `/api/notifications-feed` GET now filters announcements by `audience` per viewer role (PRINCIPAL: ALL/TEACHERS/STAFF/STUDENTS/PRINCIPAL/ADMIN; TEACHER: ALL/TEACHERS/STAFF; STUDENT: ALL/STUDENTS; PARENT: ALL/PARENTS/GUARDIANS). Fetch window widened to 24 → filter → trim 8 so lists stay full. Verified: principal no longer sees the PARENTS-only "Parent-Teacher Meeting".
- UX FIX — Notifications dropdown now closes on outside click (mousedown/touchstart, bell trigger excluded) and Escape; added role="dialog" + aria-label.
- DATA — `prisma/spread-payments.ts` one-off redistributed the 13 existing payments across the last 6 months (Mar–Aug 2026) so the trend chart shows a growth series; `prisma/seed.ts` payment creation updated to spread createdAt the same way for future reseeds.
- QA: lint exit 0; /api/dashboard, /api/payments-export, /api/notifications-feed, /api/auth/me all 200; no browser console/page errors; mobile 390px no horizontal scroll.
- Screenshots: qa5-superadmin.png, qa5-trend-chart.png, qa5-live-dropdown.png, qa5-live-toast.png, qa5-mobile-trend2.png, qa5-desktop-trend2.png.

Stage Summary:
- The platform now has a genuine real-time layer: DB writes propagate to all connected dashboards in ≤4s with zero client polling beyond the existing 60s feed refresh.
- lib/api.ts `api()` Response passthrough is a framework-level improvement — future CSV/PDF/file endpoints can return raw Responses.
- Superadmin dashboard now has 3 analytics surfaces (donut, ledger, monthly stacked trend) + CSV export, all DB-authoritative.
- Remaining mocks: module-level presentation data only (timetables, library demo rows).

## Current State Assessment (after Task 5)
- Services: Next dev :3000 + event-stream :3003 (both must run; event-stream is NOT auto-started — start manually after restarts).
- All 4 role panels + public site verified; realtime verified with real DB inserts through the Caddy gateway (test via http://localhost:81, NOT :3000 — socket proxying only exists through the gateway).

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Low) Trend chart hover popover can clip near the card's right edge for the last column — consider flip logic if it bothers anyone.
2. (Low) Event stream is broadcast-to-all; server-side room filtering per schoolId would reduce client-side filtering noise at scale (fine for current demo scale).
3. (Medium) Search deep-linking (open student/fee profile directly from palette results) still open.
4. (Feature ideas): admin UI to broadcast announcements (would exercise the live stream end-to-end from product surface); teacher-facing collection snapshots; i18n via next-intl; PWA manifest + offline shell.
---
Task ID: 6
Agent: Z.ai Code (webDevReview cron round)
Task: Assess project, QA via agent-browser, then implement: real announcement broadcasting from the product surface, search deep-linking, styling/mobile polish.

Work Log:
- Health check: :3000 + :81 gateway + event-stream :3003 all healthy; lint clean; QA sweep (public site, superadmin platform overview incl. donut/ledger/trend/tenants) — zero console errors, no blocking bugs → proceeded to features.
- BUG FIX — `/api/search` student results used `moduleKey: 'admission'` (wrong module; navigated to Admissions). Now `'students'` (Students & Classes).
- FEATURE 1 — Real Announcement Broadcasting (flagship; closes Task-5 idea "admin UI to broadcast announcements"):
  - New `POST /api/announcements` (PRINCIPAL-only, schoolScoped): maps composer audience → canonical DB tags (All Parents→PARENTS, All Students→STUDENTS, All Teachers→TEACHERS, All Staff→STAFF); class selections (matched by /class|grade|section/i) → `CLASS:<name>`; category → priority (Emergency→URGENT, Examination/Academic→HIGH, else NORMAL); attaches senderId; returns DB id + estimatedRecipients (real counts: students/teachers via Prisma count; CLASS: counts students in that class). `GET /api/announcements` returns last 20 with sender + ack counts (for future history wiring).
  - Feed upgrade `/api/notifications-feed`: audienceAllows now async + supports `CLASS:` prefix — PRINCIPAL/TEACHER see all class notices (staff oversight); STUDENT sees a class notice only if it matches their class (exact name, shared grade base via section-strip regex, or prefix match); PARENT/others excluded. Loop breaks at 8 visible.
  - Composer wiring (`comm-compose.tsx`): fetches `/api/classes?counts=1` on mount; audience tabs now "School-wide | Classes(DB)" (By-Section removed — DB classes carry section in name; mock global classes demoted to a secondary optgroup); recipientCount uses real DB class sizes; `handleSend` (async) additionally POSTs to the API on "Send Now" → on success `markSynced(localId, dbId)` + emerald "Announcement broadcast live · pushed to every connected dashboard" toast; on failure amber "Announcement sent (demo mode)" toast + explanatory strip (graceful demo-mode fallback). Send button has Broadcasting… spinner / "Broadcast delivered" states + animated status strip (pulsing dot / warning). Confirm modal shows a "Live platform broadcast" emerald panel. Communication store: Announcement.synced/dbId fields + `markSynced` action (writes audit entry 'announcement.broadcast').
  - History tab: synced announcements show a pulsing emerald "LIVE" chip next to the category; view modal adds "Platform broadcast: Delivered live" row + DB record id row.
  - E2E VERIFIED in browser: (a) demo-mode path — browser DB session was teacher while persona was principal → POST 403 → amber "demo mode" toast + strip (RBAC honest UX ✓); (b) real path — after re-login as principal@demoschool.edu: compose → confirm modal (8 real recipients) → "Broadcast delivered" → toast → event-stream log `announcement → Grade 10 - A: Field Trip to the Science Museum` → bell badge +3 → dropdown shows the new notice "just now" + earlier curl-posted notices at 6m; History shows LIVE chip + Delivered status.
  - Audience filtering E2E via curl: student1 (Grade 9 - A) does NOT see CLASS:Grade 10 - A notice; student11 (Grade 10 - A) sees it + school-wide; teacher sees all class notices; teacher POST → 403.
- FEATURE 2 — Search deep-linking:
  - New `src/lib/store/focus-store.ts` (zustand: {type,id,title,moduleKey,ts}).
  - Palette `handleSelect`: entity types (student/teacher/fee/notice/parent) emit a focus request before `onNavigate` (ts acts as retrigger).
  - `StudentsClassesModule`: consumes focus — match by dbId → admissionNo-in-title → exact name → name prefix; hit ⇒ opens StudentProfilePage (back label "Global Search") + success toast; miss ⇒ switches to Directory tab + honest info toast ("Record synced from the school database…"). Verified: palette "Aarav" → click DEMO-2025-0001 result → lands in Students & Classes/Directory with toast.
- STYLING/MOBILE fixes:
  - Trend chart popover clipping (Task-5 known issue): edge-aware anchoring — first column popover anchors left, last column anchors right, middle stays centered. Verified by hovering Aug 26: popover fully inside card.
  - ModuleHeader (principal shared): stacked layout on mobile (`flex-col-reverse` → row at sm+) — fixes "707 students" overlapping the Overview/Directory/… tab pill row at 390px; actions row horizontally scrollable.
  - SegmentedTabs: `max-w-full overflow-x-auto custom-scrollbar` so long tab sets never overflow on narrow screens.
- QA matrix: lint exit 0 (0 errors, 0 warnings); mobile 390px no horizontal scroll (Students & Classes + Dashboard verified post-fix); fresh page load zero console/page errors; POST /api/announcements 200 (x3) + 403 (RBAC test, expected); GET feed 200s; event-stream delivered announcement in <5s.
- Screenshots: qa6-superadmin-home.png, qa6-trend5.png (dashboard), qa6-compose2.png (DB classes composer), qa6-confirm.png (live-broadcast confirm modal), qa6-broadcast2.png (delivered state + toast), qa6-bell-dropdown2.png (just-now announcement), qa6-history-live.png (LIVE chip + Delivered), qa6-palette-aarav2.png (DB search + highlight), qa6-deeplink.png (deep-link + toast), qa6-mobile-fixed.png / qa6-mobile-students.png (mobile header fix), qa6-popover-lastcol2.png (popover flip fix).

Stage Summary:
- The realtime loop is now closed from the PRODUCT surface: Communication → Compose → Send = DB write + live push to every connected dashboard (previously only possible via SQL/script inserts).
- Class-targeted announcements are enforced end-to-end (composer DB classes → CLASS: tag → per-student feed filtering).
- Palette results now deep-link into modules (student profiles open directly when the demo roster contains the name; otherwise honest directory fallback).
- Demo-data note: 4 platform announcements now exist from testing (Hydroponics Club, Physics lab reschedule x2 via curl, Science Museum field trip) — realistic seed content, harmless.

## Current State Assessment (after Task 6)
- Services: Next dev :3000 + event-stream :3003 (event-stream must be started manually; it was already running this round).
- Announcement pipeline: compose UI → POST /api/announcements (PRINCIPAL) → Notification row → stream broadcast ≤4s → bell + toast on all roles (school-scoped client-side; superadmin sees platform-wide).
- All 4 role panels + public site verified; mobile 390px clean; lint clean.

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Medium) GET /api/announcements exists but History still renders the local store only — wire a "Platform broadcasts" section (server rows with ack counts) into comm-history for a true cross-session history.
2. (Medium) Deep-link covers students; teacher/fee/notice focus requests navigate but don't open entity detail — extend focus consumption to Teachers module (faculty profile) and Fee Management (fee account drawer).
3. (Low) Event-stream still broadcast-to-all; per-school socket.io rooms would cut client-side filtering at scale.
4. (Low) Scheduled announcements ('Schedule for Later') remain demo-only — a cron in event-stream could publish due scheduled rows for a full real path.
5. (Feature ideas): i18n via next-intl; PWA manifest + offline shell; parent-facing digest; announcement templates with variable substitution; delivery analytics per channel.
---
Task ID: 7
Agent: Z.ai Code (webDevReview cron round)
Task: Assess project, QA via agent-browser, then implement: Platform Broadcasts history (wire GET /api/announcements), search deep-linking for teachers + fees, styling polish, mobile fixes.

Work Log:
- Health check: :3000 + :81 gateway + event-stream :3003 all healthy; lint clean. QA sweep (public site, superadmin overview) — zero console errors, no blocking bugs → proceeded to features.
- FEATURE 1 — Platform Broadcasts panel (closes Task-6 priority "History still renders the local store only"):
  - New `comm-platform-broadcasts.tsx`: fetches GET /api/announcements on mount (+manual refresh button), unwraps {ok,data} envelope. Rows = authoritative DB Notification records with sender, canonical audience (audienceLabel maps ALL/PARENTS/STUDENTS/TEACHERS/STAFF/CLASS:x → human labels), priority chip (URGENT→Emergency rose / HIGH→Priority amber / NORMAL→General), per-row ack counts (CheckCheck + count from `reads` _count), relative timestamps.
  - UX states: 3 skeleton rows while loading · amber demo-mode strip when endpoint unavailable · distinct empty states (no broadcasts yet vs no search match) · search-aware (filters along with the History search box) · detail modal with full message + metadata grid (sender/audience/priority/acks/published/DB record id) + emerald "Live platform record" strip.
  - Wired above the local history table in `comm-history.tsx`; local empty-state copy updated to point at the platform panel. E2E verified as principal: 5 real broadcasts render (incl. the 3 curl/posted test notices + Task-6 Science Museum), Mid-Term shows ack count 1 (persistent from Task 4), modal + refresh + search filtering all work.
- FEATURE 2 — Deep-linking extended (closes Task-6 priority):
  - Teachers module (`teachers/index.tsx`): consumes focus type 'teacher' → matches s.teachers by name (exact → full-prefix → contains) → opens TeacherProfilePage full-page sub-route + success toast; miss → Directory tab + honest info toast. E2E: palette "Rohan" → DB row (GWS-T-014) → profile opened ("Opened Rohan Mehta's faculty profile · Deep-linked from global search").
  - Fee Management (`fees-shell.tsx` + `fees-student-accounts.tsx`): consumes focus type 'fee' → parses student name from result title ("<Fee> — <Student>" em-dash split) → switches to Student Accounts tab → opens that student's fee account workspace drawer. BUG FOUND & FIXED during E2E: original matcher had a first-word fallback that matched "Aarav Sharma" to "Aarav Joshi" (wrong account opened) — removed the loose fallback in BOTH modules (exact → full-name prefix → contains only); re-verified success path with "Riya Singh" (exists in DB + demo accounts) → correct account opened; "Arnav Verma"/"Aarav Sharma" (DB-only names) → honest fallback toast.
- STYLING — superadmin donut card dead space eliminated:
  - "Collections by Payment Method" column now a flex-col with a bottom-anchored 3-stat insight strip (TOP CHANNEL with donut-matched color dot + share % · AVG TICKET · total TRANSACTIONS), aligning the column's bottom edge with the Transaction Ledger card. Verified desktop 1440 (strip bottom-aligned with ledger) + mobile 390 (3-up strip fits, no overflow).
- MOBILE FIX — local history table overlap at 390px (pre-existing): Message column col-span-5 → col-span-9 sm:col-span-5, Status cell col-span-1 → col-span-3 sm:col-span-1, pin/archive action buttons hidden on mobile (View stays). Verified: titles fully readable, badges + eye fit their cell, zero overlap.
- QA matrix: lint exit 0; GET / 200; GET /api/announcements → 401 unauth (RBAC correct) / 200 authed; no console/page errors; doc overflow-x false at 390px on Communication History + superadmin dashboard; palette match highlighting intact.
- Screenshots: qa7-superadmin.png, qa7-insight-strip3.png, qa7-platform-broadcasts2.png, qa7-broadcast-modal.png, qa7-teacher-deeplink3.png, qa7-fee-deeplink3.png, qa7-mobile-fixed.png, qa7-mobile-strip.png.

Stage Summary:
- Communication History is now split into two authoritative layers: "Platform Broadcasts" (server rows, cross-session, ack counts, live badges) + local demo-mode history below — closing the loop on Task-6's broadcast pipeline.
- Deep-linking now covers student profiles, faculty profiles, and fee account drawers (3/5 entity types; notice/parent remain navigate-only by design).
- Demo-data note: DB student/fee names (Aarav Sharma…) intentionally differ from the generated demo fee roster (Riya Agarwal…); deep-links fall back honestly, and names present in both (Riya Singh) open directly.
- Matcher lesson recorded: never fall back to first-word matching for person entities — wrong-record opens are worse than an honest "not in demo roster" toast.

## Current State Assessment (after Task 7)
- Services: Next dev :3000 + event-stream :3003 (event-stream still manual-start; was running).
- New surfaces this round: Platform Broadcasts panel (principal Communication → History), teacher/fee palette deep-links, donut insight strip (superadmin), mobile-fixed history table.
- All 4 role panels + public site verified; mobile 390px clean on touched surfaces; lint clean.

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Medium) Notice/parent palette results navigate but don't focus (notice → Communication top; parent → Messaging top). Could open the Platform Broadcasts modal for notices and the parent chat for guardians.
2. (Medium) Ack counts are raw numbers only — an ack-list drawer (who acknowledged, when) would complete the delivery-analytics story (data exists: NotificationRead rows).
3. (Low) Scheduled announcements ('Schedule for Later') still demo-only — event-stream cron could publish due rows (carried over from Task 6).
4. (Low) Event-stream broadcast-to-all; per-school socket.io rooms (carried over).
5. (Feature ideas): i18n via next-intl; PWA manifest + offline shell; teacher-facing collection snapshots; parent digest; broadcast templates with variable substitution; platform-broadcast search behind a dedicated filter chip in History.
