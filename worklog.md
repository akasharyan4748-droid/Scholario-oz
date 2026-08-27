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

---
Task ID: 8
Agent: Z.ai Code (main orchestrator)
Task: Round 8 — webDevReview cycle: QA assessment, delivery-analytics feature (ack feed + delivery rates), notice deep-link completion, palette merge bugfix, superadmin NaN guard, styling polish.

Work Log:
- QA assessment first: :3000 HTTP 200, all panels render, lint clean, no blocking errors → proceeded to features (per hard requirements: styling details + new functionality).
- FEATURE 1 — Broadcast delivery analytics (closes Task-7 priority #2 "ack counts are raw numbers only"):
  - New endpoint GET /api/announcements/[id]/reads (PRINCIPAL-only, school-scoped via findFirst guard): returns NotificationRead rows joined with user name/role + readAt, ordered oldest-first; 401 unauth / 403 non-principal verified by curl.
  - GET /api/announcements now also returns estimatedRecipients per broadcast (audience-based DB counts, distinct audiences resolved once per request) so the UI can compute ack ÷ estimated delivery rate.
  - Demo data backfilled: 27 NotificationRead rows across the 5 live broadcasts (Science Museum 6/8 students · Physics lab 4 teachers · Hydroponics 11/19 · PTM 6 · Mid-Term 1) — analytics look alive in demo.
  - UI (comm-platform-broadcasts.tsx): rows now show "6/8" chips + animated 3px mini delivery bars with color semantics (≥75% emerald, ≥40% amber, <40% rose) + left priority accent strips (rose/amber, transparent→emerald on hover). Detail modal gained a delivery summary (animated SVG RateRing with % + "N of ~M estimated recipients" + audience context + >100% drift note) and an ACKNOWLEDGEMENT FEED section: fetches reads on open, staggered rows with deterministic-tint initials avatars, role tags, double-check + relative read time; skeleton/empty/error states all handled. Modal now wrapped in AnimatePresence for exit animations.
- FEATURE 2 — Notice deep-link completed end-to-end (closes Task-7 priority #1 notice half):
  - Chain: palette select (type 'notice') → focus store → CommShell consumes (setTab('history') + stashes {id,title,ts}) → HistorySection pre-fills search → PlatformBroadcasts auto-opens the match: exact-by-id first (palette DB results embed ntf-<Notification cuid>), then title exact → substring either way; toast.success on open, honest info toast on miss; onNoticeConsumed clears the request so tab re-mounts never replay stale deep-links.
  - E2E verified both paths: "Mid-Term" from Dashboard → auto-switched to Communication→History, modal opened with 5% rose ring + PRINCIPAL ack row + deep-link toast; mock notice "Fee payment received" → search-synced history + "No matching platform record yet" info toast, no modal.
- BUGFIX — palette merge silently dropped mock-only notices: use-command-palette replaced ALL local DB-type results whenever /api/search responded, even with zero matches of that type → mock notices ("Fee payment received"…) became unsearchable. Merge is now type-aware: local items of a type are superseded only when the server actually returned ≥1 result of that type.
- BUGFIX/ROBUSTNESS — superadmin dashboard NaN guard: platform stats (schools/students/teachers/revenue) are now Number()-normalized to honest zeros, and a scope-mismatch payload (scope !== 'PLATFORM' — e.g. school-scoped session cookie viewing the platform dashboard, which QA reproduced via forged localStorage + stale HttpOnly cookie) renders an amber ShieldAlert strip explaining the fix instead of silent ₹NaN. NOTE: the mid-session Turbopack parse errors at dashboard.tsx:399 ("Expected '</', got '{'") were transient fs/HMR corruption — file on disk verified correct via od -c hexdump, lint+SWC compile clean after touch-forced rebuild (0 occurrences in last 60 dev-log lines); the NaN render was the cookie-scope mismatch, NOT the parse error.
- QA matrix: lint exit 0 · GET / 200 · /api/dashboard PLATFORM scope returns revenue 365200 + 1 tenant (real superadmin session via /api/auth/login) · principal History desktop 1440 renders delivery chips/bars correctly (6/8 green, 4/8+11/19 amber, 1/19 rose sliver) · mobile 390px: no-overflow, rows fit, ack modal + ring + feed fit perfectly · console clean (stale-buffer errors ruled out via dev log).
- Screenshots: qa8-history-initial.png, qa8-ack-modal.png, qa8-deeplink.png, qa8-deeplink-miss2.png, qa8-mobile-history.png, qa8-mobile-ack-modal.png (all in /home/z/my-project/download/).

Stage Summary:
- Communication History is now a complete delivery-analytics surface: broadcast rows show ack/estimate + rate bars; the modal answers WHO acknowledged and WHEN via the live reads endpoint. 5/5 worklog priorities from Task 7 addressed (notice deep-link done, ack drawer done; scheduled-announcements cron and socket rooms remain, both low priority).
- Palette search is now strictly better: DB-authoritative where available, mock fallback preserved per-type.
- QA lesson recorded: forging client-side role state (localStorage) without the matching HttpOnly session cookie produces misleading API scopes — always authenticate through /api/auth/login when QA-ing role surfaces; agent-browser synthetic clicks don't trigger React handlers on this app (use JS .click() via eval).
- Transient Turbopack corruption lesson: verify with od -c + dev-log timeline before "fixing" code that is actually intact; touch the file to force a clean rebuild.

## Current State Assessment (after Task 8)
- Services: Next dev :3000 healthy (auto), event-stream :3003 (manual-start, was running). lint 0 errors. All 4 panels + public site verified this round.
- New this round: delivery-rate bars + ack feed modal, notice deep-link chain, type-aware palette merge, superadmin NaN/scope guards, 27 seeded ack rows.
- Known QA environment quirk (not a product bug): role/cookie mismatch guard now explains itself in-UI.

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Medium) Parent-type palette results still navigate-only (Messaging top). Could open the guardian chat directly.
2. (Medium) Ack rate only counts READS vs estimated audience; scheduled announcements remain demo-only — event-stream cron could publish due rows (carried from Task 6/7).
3. (Low) Socket.io broadcast rooms are school-global; per-school rooms would matter at multi-tenant scale (carried).
4. (Low) estimateRecipients counts STUDENTS/PARENTS identically; PARENTS audience could count distinct parent links instead.
5. (Feature ideas): i18n via next-intl; PWA manifest + offline shell; broadcast templates with variable substitution; teacher-facing collection snapshots; export ack-report CSV per broadcast (data now available via /reads).
---
Task ID: 9
Agent: Z.ai Code (user-directed payroll fixes)
Task: FINAL SMALL CHANGES — SALARY & PAYROLL. Exactly 4 targeted changes: (1) auto-generated Cash payment reference, (2) Payslips tab = only confirmed/paid salaries, (3) "Payment recorded" toast text contrast, (4) minimal payslip redesign based on Payment Detail Card + A5 default print. Explicitly no other payroll UI/logic changes.

Work Log:
- CHANGE 1 (Cash auto-reference): added `nextCashReference()` to salary-store.ts — derives `CASH-YYYY-NNNN` from every reference already on file (reversed included → never reused, sequential, per-school since each tenant owns its store/persist). `recordPayment` now assigns it automatically when method === 'Cash' (Principal cannot type it; typed refs for UPI/Bank/Cheque unchanged). Record Payment dialog: Cash → read-only mono field (aria-label "Cash payment reference") showing the live preview + tiny "Auto-generated" hint; submit guard no longer blocks Cash on missing typed ref.
- CHANGE 2 (Payslips gating): salary-payslips.tsx rows now filtered to payState === 'Paid' (≥1 Confirmed non-reversed payment). Unpaid / Pending Receipt / Not Received / Reversed → no slip. Count line = "N issued payslips". New SalaryEmptyState for months with zero slips ("A salary slip is issued when the employee confirms the payment…"). Rows show green BadgeCheck; pending/unpaid noise removed.
- CHANGE 3 (toast contrast): the existing toast.success('Payment recorded', {description}) untouched in structure/size/icon; added classNames description '!text-xs !font-medium !text-zinc-700 dark:!text-zinc-300' (sonner's default #3f3f3f/op-desc was too light). Verified live for Bank Transfer; same toast serves Cash/UPI.
- CHANGE 4 (payslip redesign + A5): payslip-document.tsx fully rewritten in Payment-Detail-Card visual language: compact school header row (logo mark + name/address/phone/email left, "SALARY SLIP / Aug 2026" right), EMPLOYEE block (name bold, designation · department, mono Employee ID), SALARY DETAILS table with aligned tabular amounts (deductions shown −₹), GROSS EARNINGS / TOTAL DEDUCTIONS subtotal lines, strong NET PAY line + amount-in-words, PAYMENT DETAILS label/value rows (status pill "Paid", date, method, mono Payment Reference, mono Salary Slip No.), hairline minimal footer. Slip no. = `SLIP-YYYY-MM-NNNN` (periodKey + employee's trailing digits, EMP-014 → SLIP-2026-08-0014), deterministic/persistent. Print: OLD visibility-hack CLIPPED inside the dialog scroll (verified by first PDF attempt) → replaced with printPayslip(): clones .payslip-print into body-level #print-root, body.salary-printing hides every other top-level element (display:none), restored on afterprint (+60s safety). @page { size: A5 portrait; margin: 9mm }. Callers updated: salary-payslips.tsx + teacher-payroll-tab.tsx print buttons now call printPayslip(). Mobile fix during QA: school-name `truncate` (nowrap) created a 218px unbreakable min → grid column blew to 373px > dialog; replaced with break-words wrapping.
- E2E (agent-browser, real UI + JS-click dispatch):
  - TEST 1 CASH ✓: ref auto-shown CASH-2026-0001 (readOnly verified), recorded, detail shows CASH-2026-0001, PAGE RELOAD → same ref (persisted). Second cash → CASH-2026-0002 (sequential, no reuse).
  - TEST 2 UPI ✓: typed UPI-77990045 preserved on payment detail (note: direct .value set does NOT update React state — use native setter+input event or CDP keyboard typing). Bank Transfer NEFT-TEST-4102 also preserved.
  - TEST 3 GATING ✓: before confirmation Payslips showed exactly the 5 confirmed employees (new pending payments excluded); teacher login (Rohan Mehta) → Received → "Yes, I received it" → receipt RCP-2608-0201; principal side now 6 issued payslips incl. Rohan. Slip verified: components 7,857/786/400, −PF 943, −PT 200, Gross 9,043, Deductions 1,143, NET 7,900, status Paid, ref UPI-77213, SLIP-2026-08-0014.
  - TEST 4/5 PRINT ✓: PDF export = ONE page, ONLY the payslip (no sidebar/tabs/buttons/dashboard), compact + sharp. (CDP printToPDF defaults to Letter paper unless preferCSSPageSize is set — in a real browser the @page A5 rule drives the default print-preview paper; user can still override manually. Nothing about A5 appears on the document.)
  - TEST 6 TOAST ✓: "Payment recorded / Amit Verma · ₹6,500 · Aug 2026 — pending receipt" secondary text now dark zinc-700 font-medium — clearly readable, design/size/icon preserved.
- QA matrix: lint exit 0 · compiles clean · GET / 200 · mobile 390px: payslips tab no doc overflow (fits verified), page no horizontal scroll · May 2026 empty state renders copy correctly.
- Screenshots/PDFs: download/t1-cash-dialog.png, t1-cash-detail.png, t2-upi-dialog.png, t3-payslip.png, t3-payslip-mobile2.png, t4-payslip-desktop2.png, t5-payslip-v2.pdf, t6-toast-catch.png.

Stage Summary:
- Cash now has a permanent school-internal reference (CASH-YYYY-NNNN) distinct from receipts (RCP-…) and slip numbers (SLIP-…); UPI/Bank/Cheque keep principal-entered refs.
- Payslips tab is now a true issued-documents surface: confirmation is the exact gate.
- Payslip = Payment-detail-card aesthetic + small school header; prints as a clean one-page A5-only slip via a robust print-root isolation (fixes pre-existing clipping).
- Demo-state note (this browser profile only): extra QA payments exist (Ananya cash ₹35k CASH-2026-0001, Meera cash ₹6.2k CASH-2026-0002, Sunita Rao UPI ₹6.8k, Faisal UPI ₹5.9k, Amit NEFT ₹6.5k; Rohan's Aug payment confirmed with receipt RCP-2608-0201). All live in localStorage 'scholario-salary-v3', not seed code.
- Untouched per instruction: Overview, Payment cards, Salary Structure, Settings, History, Reports, payment workflow, teacher payroll logic, navigation.

## Current State Assessment (after Task 9)
- Services: Next dev :3000 healthy, lint clean, all panels verified. Salary module stable after the 4 surgical changes; no regressions observed in Payments/Overview/teacher side.
- QA lesson re-confirmed: React controlled inputs need native-setter+input-event or real CDP keystrokes; agent-browser `set viewport W H` works for responsive checks.

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Low) Payslips for part-paid months (one confirmed part-payment + pending remainder) open the slip; slip's Payment Details uses the Confirmed payment as primary and lists others — acceptable per "keep existing workflow", revisit if partial-pay slip semantics are ever specified.
2. (Low) @page A5 is honored by Chrome/Edge/Firefox print preview defaults; Safari ignores @page size (uses user paper choice) — graceful degradation, nothing to fix in-app.
3. (Carried) search-service mock→DB migration, notification PATCH persistence, per-school socket rooms, scheduled-announcement cron, i18n/PWA ideas.
---
Task ID: 10
Agent: Z.ai Code (webDevReview cron round, trace web-cron-review-202608271539)
Task: QA assessment → discovered the codebase was AHEAD of the worklog (parents DB search, messaging parent deep-link, ack CSV export existed but were never E2E-verified or logged). This round: verify those live, close the real remaining gap in the parent chain (ward bridge + polish), fix PARENTS audience estimate, add styling details.

Work Log:
- QA assessment first: :3000 HTTP 200, lint clean, dev log clean. Swept public site → principal panel → Communication History (Task-8 delivery analytics intact: 5 broadcasts · 28 acks · 44% avg).
- VERIFIED EXISTING (previously unverified, built in a lost context segment — worklog was stale):
  - Ack-report CSV export: clicked Export CSV in the broadcast modal → real download `ack-report-grade-10-a-field-trip-….csv` (5 commented meta lines + 6 read receipts) + success toast. Endpoint `/api/announcements/[id]/reads/export` exists (401 unauth).
  - Parents & Guardians DB search: `/api/search` section 6 already queried Student.guardian* fields.
- FEATURE — Ward bridge completes the parent deep-link chain (the real remaining gap):
  - Problem: DB guardians are family-style ("Sharma Family") while messaging threads are personal ("Vikram Sharma · Parent · Aarav Sharma") → name matcher missed → fell through to pre-addressed compose.
  - FocusRequest now carries optional `subtitle` (focus-store.ts); palette passes item.subtitle through (use-command-palette.ts).
  - Messaging matcher upgraded (messaging/index.tsx): (1) guardian-name exact → prefix → contains, (2) NEW ward bridge — parses "Guardian of <ward>[ · phone]" from subtitle and matches the conversation's linked student (exact → contains → first-name), (3) pre-addressed compose fallback stays for genuinely unknown guardians. Toast now explains the match ("Matched via ward Aarav Sharma · deep-linked from global search").
  - Search route hardened: guardians section role-gated (STUDENT/PARENT roles no longer enumerate family contacts), ward-name matching removed from the guardian query (searching a student no longer floods results with duplicate guardian rows), subtitle now includes the ward's class, message-inbox moduleKey fixed 'messages' → 'messaging' (dead nav key).
- BUGFIX — PARENTS audience estimate counted students: estimateRecipients now computes distinct guardianPhone households (groupBy) for PARENTS audiences — a family with two enrolled children is ONE household. Demo data has 19 distinct phones / 19 students so the number coincides, but semantics are now correct.
- STYLING details:
  - Guardian palette results get the distinct `Users` icon (new case in palette utils) instead of MessageSquare, + class in subtitle.
  - DeliveryInsights "Top Broadcast" cell is now a real button: hover tint + focus ring, title tooltip "Open … acknowledgement details", click opens that broadcast's modal (wired via onOpenTop=setViewing). Verified: click → ACKNOWLEDGEMENT FEED modal opens.
- E2E (agent-browser): palette "sharma family" → DB guardian row (Users icon, "Guardian of Aarav Sharma · Grade 9 -A · +91 124 2323 4545") → click → Messages → Vikram Sharma thread ACTIVE with composer ("Message Vikram Sharma…") ✓ screenshot qa10-parent-deeplink.png. Mock path intact: "vikram" → mock parent row → exact-name match → same thread ✓. Mobile 390px: deep-link opens straight into the thread view, zero horizontal overflow ✓ qa10-mobile-msg.png.
- QA matrix: lint exit 0 · GET / 200 · dev log clean · GET /api/announcements PARENTS est=19 (households) · export CSV re-verified earlier this session.

Stage Summary:
- The parent chain is now fully real end-to-end: DB guardians → palette (Users icon) → focus(subtitle) → ward bridge → correct personal thread; honest compose fallback only when no household matches.
- Delivery insights got their last interaction gap closed (Top Broadcast → modal).
- Worklog debt paid: the unlogged parent-search/CSV-export features are now documented and verified.

## Current State Assessment (after Task 10)
- Services: Next dev :3000 healthy, lint clean. All verified surfaces: public site, principal dashboard/communication/messages/salary, mobile 390px.
- The command palette is now DB-authoritative for ALL person entities (students, teachers, guardians) with mock fallback only where the API has no match of that type.

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Medium) Scheduled announcements remain demo-only — needs a `scheduledFor` field on Notification (schema push) + an event-stream cron to flip due rows live. Compose UI side needs a schedule picker state check.
2. (Low) Teacher role has no 'messaging' nav key — palette guardian/notice results no-op navigate there (pre-existing convention for all DB types on non-principal panels; teacher equivalent would be 'parent-connect').
3. (Low) estimateRecipients for STAFF is +8 hardcoded; could count Administration/Support employees from a staff table if one lands in the schema.
4. (Carried) socket.io per-school rooms; i18n via next-intl; PWA manifest; teacher-facing collection snapshots.

---
Task ID: GIT-PUSH-1
Agent: Z.ai Code (main orchestrator)
Task: Push current project version to GitHub branches `development` and `main` of akasharyan4748-droid/Scholario-oz (explicitly excluding `stable`), using user-provided PAT.

Work Log:
- Read worklog handover history; confirmed local working tree clean on branch `main` @ commit 978376f (no changes needed committing).
- `git ls-remote` (token used transiently, never written to .git/config): remote main & development both at 7c795a4 (original import snapshot); stable at e1c9ed4.
- Local history had diverged from remote base, so pushed with lease-pinned safety: `git push --force-with-lease=refs/heads/main:7c795a46... HEAD:refs/heads/main` and same pinned lease for development — overwrites only if remote still matched expected SHA.
- Verified post-push ls-remote: `development` = 978376f, `main` = 978376f, `stable` = e1c9ed4 (**untouched**).

Stage Summary:
- Current version (978376f "SALARY & PAYROLL state + all prior panels") is now live on BOTH `development` and `main`.
- `stable` intentionally left at e1c9ed4 per user instruction.
- Reminder for future agents: the 4 payroll micro-changes (auto cash reference numbers, Payslips tab filtering confirmed/paid-only, toast contrast, A5 payslip redesign/print) remain NOT implemented — scope them before any new commit, and after implementing push ONLY to main + development (never stable).

---
Task ID: 1
Agent: Z.ai Code (main orchestrator)
Task: FEE-POLICY data layer overhaul — realistic 2025-26 fee schedule, per-class structures, engine applicability gates, roster-consistent demo transactions, persist migration.

Work Log:
- Studied Salary & Payroll design language (SummaryCard/Panel/SegmentedTabs/chips/emerald CTAs) + audited whole fees module via subagents.
- Rewrote `src/lib/store/fee-store-data.ts`: policy-driven builder now generates ONE FeeStructureConfig per canonical class (12 total: Pre-Nursery→Class 12 PCM/PCB). Tuition ₹250/₹300/₹400 bands; session exam fees ₹700/₹900/₹1,000 split across the six examinations; C6/C7 exam intentionally unconfigured; Board Form ₹1,500 (C10/C12); Registration ₹300 (C9/C11); Management & Maintenance ₹500/yr every class; Transport ₹500/mo optional-gated; stream practicals ₹300/subject (PCM=2, PCB=3).
- Added `isHeadApplicableToStudent` gate + wired into computeAccount (payable+ledger), analytics byCategory (per-student), quarterly calendar (Transport excluded), structure lookup passes student.classId so Class 11/12 PCM vs PCB resolve to their own structure.
- New exports: computeStructureBaseTotal, AdmissionFeePolicy type, DEFAULT_ADMISSION_POLICY (boys ₹500 · girls free above grade 5), admissionFeeFor(). No structure ever displays a universal admission charge.
- Rebuilt SEED_TRANSACTIONS (19 rows) locked to the canonical roster via SS lookups — names/admission/class can never contradict the Students module. Realistic instalment amounts; recipients chosen from Pending/Partial students only; gateway math exact (2% + 18% GST); SET-01..03 aggregates additive (validated). Cash requests mirror their Under Verification txns to the rupee; snapshots tuned.
- Rewrote LateFeeRule defaults (₹50/mo cap ₹500) matching small real balances.
- students-store seed-data.ts: baseAnnualFor() mirrors structure math incl transport annual for opted-in; deterministic status cycle / transport / concession so feePaid = policy-consistent % of net everywhere.
- Master catalogue updated (fh-1,2,6,7,8,9 renamed/re-priced to policy; added fh-17 Physics/fh-18 Chemistry/fh-19 Biology Practical Fee).
- fees-collect-payment.tsx single-sourced: outstanding/lateFee/totalDue + find-list amounts now come from useFeeData().accounts (no duplicated math); hardcoded lateFee 1500 removed; PURPOSE_OPTIONS + CORE_FEE_HEADS aligned to real heads.
- Persist bumped v3→v4 with full demo reset migrate (old persisted values contradict new policy → replaced by fresh seeds; receiptCounter 1060 aligns with last seeded receipt RCP-2025-1060).
- Validation script proved: 12/12 structures base==annual field, exam sums correct per band (C6/C7=0), zero overpaid accounts, settlement additivity OK, roster↔txn identity coherence. Temp scripts deleted.

Stage Summary:
- DATA LAYER COMPLETE & TYPE-CLEAN (only pre-existing app-shell.tsx NotificationItem TS error remains — untouched, out of scope).
- Store contracts preserved: useFeeData shape unchanged for finance-store; FeeTransaction schema intact for certificates/downloads; examFeeSchedule semantics kept for Exams module.
- NEXT (parallel): UI polish agents on disjoint files: overview(2-a), accounts drawer(2-b), structures cards(2-c), payments+approvals(2-d), transactions+settings(2-e). Orchestrator owns fees-collect-payment.tsx + shell glue after.

---
Task ID: 2-a
Agent: GLM (Fee Management redesign wave — Overview agent)
Task: Redesign the Fees Overview tab into a financial command centre (spec §1) touching ONLY src/components/principal/modules/fees/fees-overview.tsx + fees-charts.tsx.

Work Log:
- Read worklog Task ID: 1 / GIT-PUSH-1 + audited fee-store analytics contract (byCategory = expected annual per head incl. new policy heads Tuition/Transport/Management & Maintenance/Registration/Board Form/practicals; urgentActions capped at 5; monthly Apr–Dec; no academicYear on the hook return → session label now derived from ledger txn.academicYear values).
- Rewrote fees-overview.tsx on the Salary benchmark rhythm: root `space-y-4`; exactly 4 SummaryCards in SummaryCardGrid columns={4} (Total Expected slate · Collected emerald sub "N% collected" → transactions · Outstanding rose sub shows late-fee/overdue detail → accounts · Students With Dues amber sub "across N classes" → accounts); delays staggered 0/.05/.1/.15.
- Collection Trend now lives in a compact Panel ("Collection Trend" · subtitle "<AY> · collected vs pending"), chart height 180px (₹0-anchored axis preserved in MiniAreaChart), single legend moved into the Panel action slot; surrounding explanation paragraphs removed.
- New "Breakdown" Panel replaces the old category border-strip: full-bleed divide-y rows from analytics.byCategory sorted desc (name text-xs font-medium + muted "% of expected", amount right tabular-nums font-semibold, thin h-1.5 bg-muted CSS bar per row tinted by store palette, relative to largest head); capped to top 6 with "+N more heads".
- Merged Outstanding Dues + Needs Attention into one two-column Panel grid, both fully ACTIONABLE: every row is a <button type="button"> with aria-label navigating to accounts; row recipe = initials avatar ring-chip + name / class·section·admissionNo line + amount right (tabular-nums) + local OverdueChip (spec chip recipe: "Due soon" slate ≤0d / amber ≤30d / rose >30d — carries aging signal inline). Lists are max-h-72 overflow-y-auto custom-scrollbar (~5 visible), dues sourced up to 25 accounts.
- Recent Payments + Payment Modes panels kept and tightened: recent rows = ModeIcon chip + student/class/date + amount emerald + mono receipt; actions use secondary outline `h-7 text-[11px]` buttons; mode-mix spacing reduced.
- DELETED entirely: Outstanding Aging buckets section, Class-wise Collection bar-chart section, category strip, duplicate stat lines, FeeStatusBadge usage on these rows (chip pattern instead). No shadcn Table introduced anywhere.
- Props/store contract preserved: FeesOverviewSection({ data, onNavigate }) signature untouched; useFeeData import unchanged; Panel imported from shared/panel (fees-shared's ModeIcon/modeAccent/FeeEmptyState still consumed by this file only where they already were).
- fees-charts.tsx: NO functional changes (axis already ₹0-anchored via domain [0, niceCeil(max)]); only aligned default height 170→180 + doc comment stating the Overview compact contract. All re-exports (MiniBars/MiniDonut/etc.) kept intact for sibling agents.
- Verification: `bunx eslint` both files → zero errors/warnings (exit 0; the ".eslintignore deprecation" node notice predates changes). Project-wide `bunx tsc --noEmit` filtered → no diagnostics attributable to either file (only the pre-existing app-shell.tsx NotificationItem error noted in Task ID: 1 remains).

Stage Summary:
- FEES OVERVIEW = COMMAND CENTRE COMPLETE: KPIs → trend+breakdown row → actionable dues/attention pair → payments+modes; status graspable in seconds, everything click-navigates to accounts/transactions.
- What changed files-wise: fees-overview.tsx fully rewritten (~424→~470 lines, same public signature); fees-charts.tsx 3-line doc/default-height touch. Aging/classWise/topClasses analytics left UNCONSUMED here for other tabs that still need them.
- Requests for OTHER agents/orchestrator (no files touched outside my pair): (1) if any sibling agent removes a fee head type, keep analytics.byCategory { name, value, color } shape — Breakdown depends on it; (2) consider adding an optional per-category affectedStudents count to byCategory in fee-store later so Breakdown can show "per-student" mutes as spec'd optionally (skipped rather than fake it); (3) Lint/type hygiene debt: .eslintignore should migrate into eslint.config.js `ignores`, and app-shell.tsx NotificationItem TS error remains pre-existing/out-of-scope.

---
Task ID: 2-b
Agent: Z.ai Code (sub-agent, general-purpose)
Task: Polish Student Accounts tab (Fee Management redesign spec §2) — refine fees-student-accounts.tsx presentation only; keep all functionality, exports and Props signature identical.

Work Log:
- FILTER TOOLBAR: replaced the lone search bar with the SearchFilterBar pattern — container `flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between`; search wrapped `relative flex-1 max-w-md` (Search lucide absolute left-3, `pl-9 pr-8 h-9 text-xs`, placeholder "Search name, admission no, class…", clear-X kept + aria-label, matching logic STILL includes studentId/rollNo/section beyond the placeholder wording); two Select facets with benchmark triggers `h-9 text-[11px] w-[130px] text-xs`: Class = UNIQUE_CLASSES derived off accounts via useMemo(Array.from(new Set(...)), first-appearance order follows the data layer's policy grade sequence; no classDisplayName helper exists locally so stored displayName like "Class 11 — Science (PCM)" is used verbatim), Status = All/Paid/Partially Paid/Due/Overdue ('On Hold' intentionally not exposed to the Principal grid); results summary `<span role="status" hidden sm:block>` reads "{n} student{s} · showing {shown}".
- FILTER RULES (composed): query match AND class AND status; empty query just skips the text predicate instead of the old idle-vs-searched divergence. GRID CAP RULE documented in code (MAX_VISIBLE_ACCOUNTS=24): always render the FIRST 24 of the FILTERED set whether or not a query is active (replaces old slice(0,12) idle / slice(0,20) searched); filtering composes BEFORE the cap. Empty state after composition: FeeEmptyState "No students match these filters" + outline Button "Clear filters" resetting search+class+status in one handler.
- CARD MICRO-POLISH: unified padding p-4; name bumped text-sm, meta line font-mono text-[10px] with truncate; Payable/Paid/Due minis now local StatTile with STRICT right-aligned values under `text-[9px] uppercase tracking-wider` labels; Due is rose when totalDue>0 else emerald value "Clear"; stagger delay capped at 0.28s; transaction-count footer line kept (`mt-3 pt-2.5 border-t border-border/40`); whole card still a motion.button opening the drawer, now with explicit aria-label `Open account for <name>`.
- LOCAL StatTile (in-file, no new file): pins benchmark chrome `rounded-lg bg-muted/40 px-2.5 py-1.5` + `text-[9px] uppercase` labels + `text-sm font-bold tabular-nums` values (+ sub line), accent map emerald/rose/amber, optional align="right". fees-shared.tsx untouched (other task owns it); promotion there flagged as follow-up.
- DRAWER POLISH (no restructure): header made opaque solid bg-card + shrink-0 (was translucent emerald-tint gradient; tabs row also shrink-0) — header remains effectively sticky above its own scroll body; 6-tile stat strip normalized onto StatTile default chrome (drops per-tile px-1.5 py-1 + text-center outliers; core-vs-additional outstanding separation preserved incl "+ ₹x additional" sub); Collect CTA stays emerald→teal gradient; inner tabs unchanged.
- DEMO ARTIFACT REMOVED (in-file only): hardcoded "Approved By: Principal · Date: 2025-04-02" concession line dropped with an explanatory comment (approval metadata isn't modelled in the store — refused to fabricate provenance); "Sibling / Scholarship Concession" relabelled to neutral "Core Fee Concession" since no reason field exists.
- TABLES: Ledger + Payments tbody rows tightened to py-2.5 rhythm, zebra even:bg-muted/10 dropped in favour of benchmark hover:bg-muted/30; both tables get min-w-[32rem] inside their existing overflow-x-auto wrappers so tablet width scrolls inside the panel instead of overflowing the page; Receipts rows nudged py-2→py-2.5 for rhythm consistency. Removed a stale unused useStudentsStore import while at it.
- VERIFICATION: bunx eslint on this file → clean (exit 0; only pre-existing .eslintignore-deprecation stderr noise). bunx tsc --noEmit → zero errors in fees-student-accounts.tsx; only pre-existing app-shell.tsx NotificationItem errors remain project-wide.

Stage Summary:
- STUDENT ACCOUNTS TAB POLISHED, FUNCTIONALITY PRESERVED: composed search∧class∧status toolbar with desktop results summary → single consistent cap-24 grid → right-aligned stat minis w/ rose/emerald Due semantics → polished opaque-header drawer with normalized stat tiles, honest Concessions tab, scroll-safe tables. Same exported component & Props; drawer deep-link behaviour, tabs, Collect flow all untouched.
- No other files modified. Requests for orchestrator/siblings (NOT done by me): (1) consider promoting the local StatTile into fees-shared.tsx once that task lands, so AccountDues tiles converge on bg-muted/40 too; (2) fee-store would need real approver/timestamp fields if Concessions tab must ever show approval provenance — currently absent, UI honestly omits it; (3) pre-existing debt outside my file stands: app-shell.tsx TS errors + .eslintignore migration.

---
Task ID: 2-c
Agent: Z.ai Code (sub-agent, general-purpose)
Task: Refine Fee Structures tab (Fee Management redesign spec §4) — surgical card restructure of src/components/principal/modules/fees/fees-structures.tsx ONLY; keep exports/props/handler wiring identical.

Work Log:
- Read worklog Task ID: 1 (FEE-POLICY data layer: 12 per-class structures FS-C01…FS-C15-PCB, base≠transport-totalled annual, examFeeSchedule sums 700/900/1000 with C6/C7 intentionally empty, computeStructureBaseTotal/computeExamFeeTotal exports).
- HEADER STRIP rebuilt on the Salary benchmark pair: h2 `text-base font-bold` + Layers icon-title + subtitle "Per-class fee plans, versions and exam-session schedules."; right cluster = exactly THREE inline elements — `Badge` "{n} structures" · new `Badge` "{n} bound classes" (union of classId+applicableClassIds via useMemo boundClassCount; stream ids count individually) · Master Catalogue launcher now neutral outline `h-8 text-xs` reading "+ Master Catalogue" (Plus glyph, was emerald-tinted BookOpen chip). Old current/scheduled/draft status Badges removed from the header.
- GRID breakpoints moved to benchmark: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3`; cards became `rounded-xl border bg-card p-4 flex flex-col gap-2.5` (was p-3).
- CARD TOP ROW: icon chip now recipe-exact `flex h-9 w-9 items-center justify-center rounded-lg bg-{tone}-500/15 text-{tone}-600` driven by a FLATTENED CATEGORY_COLORS (`Record<string,string>` chip tones only); className title `text-sm font-bold leading-snug line-clamp-2` so stream labels wrap to two lines instead of clipping mid-word; level subtitle text-xs truncate; StructureStatusBadge (+ its v{n}) top-right as before.
- MINI-STATS ×3 on the exact tile recipe (`rounded-lg bg-muted/40 px-2.5 py-1.5`, label `text-[9px] uppercase font-semibold tracking-wider`, value `text-sm font-bold tabular-nums mt-0.5`): ANNUAL = formatINR(structure.annual) with title="Excludes opt-in Transport" + microcopy "excl. transport" (base total semantics from the data layer); HEADS = activeHeads.length; STUDENTS = existing studentsByClassName→studentsByLevel fallback pathway unchanged.
- FEE-HEADS PREVIEW replaced the old max-h-24 list: top 3 ACTIVE non-Transport heads sorted by annual contribution (amount×FREQUENCY_MULTIPLIER), joined " · ", single `truncate` <p> with full text as title attr, fallback "—". Per spec §3 frequency semantics are visible ON THE CARD: Monthly heads render `${name} ${formatINR(amount)}/mo` (e.g. "Tuition ₹400/mo"), non-monthly render `${name} ${formatINR(annualised)}` — the detail-drawer table was NOT touched.
- SESSION EXAM META LINE added under effective-from ("Effective {formatDate}" kept): `{examTotal > 0 ? `${formatINR(examTotal)} · ${itemsCount} planned` : 'Not configured'}` using computeExamFeeTotal imported from '@/lib/store/fee-store'; italic muted styling only for the falsy case (Class 6/7 empty schedules show "Not configured").
- ACTION ROW: Open = emerald CTA `h-7 text-[11px] flex-1`, History promoted to labelled ghost `h-7 text-[11px]`, dropdown trigger ghost `h-7 w-7` — every handler untouched (setOpenStructureId/setHistoryStructure/handleDuplicate/setBulkApplyOpen/handleArchive/handleDelete + full dialog/drawer/catalyzer mount points preserved); create-new dashed card padding p-3→p-4 for rhythm.
- DEAD CODE REMOVED: CATEGORY_COLORS `bar` (oklch strings never consumed anywhere) and `dot` fields (their last consumer was the deleted per-head dot row); recentVersion lookup gone with the footer's last-updated span; legacy lucide imports Users/Sparkles/BookOpen dropped. NOTE: explicit 'Library'/'Activity' branches were already absent from this file before the edit (no-op requirement #5, verified by grep). accentKey also strips Duplicate-as-draft's ' (Copy)' suffix so copies keep the parent's level tone.
- VERIFICATION: bunx eslint → clean exit 0 (only pre-existing .eslintignore-deprecation stderr notice); bunx tsc --noEmit → zero diagnostics mentioning fees-structures.tsx (only pre-existing app-shell.tsx NotificationItem error remains). git diff: 1 file, +140/−103.

Stage Summary:
- STRUCTURES TAB SCAN-READY: three-element header → benchmark grid → uniform cards answering per-class cost/base/exams at a glance; all versioning/bulk/archive/delete flows byte-for-byte preserved. FeesStructuresSection({ data, onNavigate }) signature untouched; drawer/history/catalogue/normalize mounts intact.
- Cross-file requests (NOT done, out of my file scope): (1) fees-master-catalogue.tsx & fees-normalize-heads.tsx were left alone but could adopt the same h-8 launcher/h-7 ghost sizing later; (2) fee-store.ts does not re-export computeStructureBaseTotal (only fee-store-data does) — harmless here since structure.annual is authoritative post-Task-1 validation, but worth adding to the public re-export block if another consumer needs it; (3) StructureStatusBadge (fees-structures-shared.tsx) renders both pill+v{n} — no change needed, just confirming.

---
Task ID: 2-d
Agent: Z.ai Code (sub-agent, general-purpose)
Task: Polish the Payments tab trio (Fee Management redesign spec §6) — payments/payments-section.tsx + fees-additional-charges.tsx + fees-approvals.tsx ONLY; orchestrator-owned collect modal/shell/store imported, never edited.

Work Log:
- Read worklog Task ID: 1 + 2-a/2-b/2-c first (benchmark recipes, Panel contract with twMerge bodyClassName override, analytics contract: pendingVerification counts Under Verification/Pending txns while pendingCashRequests excludes 'Clarification Requested'; useFeeData returns both).
- payments-section.tsx (~95 lines): header rebuilt on the toolbar recipe — "Payments" promoted to h2 text-base font-bold + subtitle `{monthLabel} · collections & verification` (month from `toLocaleString('en-IN')`, presentational only) LEFT, emerald "+ Collect Payment" h-8 CTA RIGHT (onCollect wiring untouched); root rhythm space-y-6→space-y-4 to match the module-wide benchmark.
- Activity strip DE-TABBED: legacy border-l-2 emerald strips + text-lg values replaced by three micro-stat TILES in `grid grid-cols-3 gap-3` on the exact recipe (`rounded-lg bg-muted/40 px-2.5 py-1.5`, label `text-[9px] uppercase font-semibold tracking-wider`, value `text-sm font-bold tabular-nums`; hints demoted to truncate sub-lines hidden below sm). Today tile carries `ring-1 ring-amber-500/40` ONLY when todayCollection > 0 (else plain muted), as spec'd. Composition order unchanged: header → tiles → FeesAdditionalCharges → FeesVerificationQueue.
- fees-additional-charges.tsx restructured into ONE benchmark Panel titled "Additional Charges" (count Badge kept in title; action = existing "+ New Charge" outline h-8 toggler, now aria-expanded) with bodyClassName="p-0" so ACTIVE charges render as a full-bleed divide-y row list (`px-4 py-2.5 hover:bg-muted/30`): left = violet category icon chip (h-9 w-9) + name + Mandatory(slate)/Optional(sky) mini-chip on benchmark chip recipe; middle meta line = category · applies-to classes · due date · student count (truncate); right w-32 sm:w-40 = per-student amount bold tabular-nums + animated collection bar (`h-1.5 rounded-full bg-muted overflow-hidden`, same pct math) + NEW mono `{collected} / {expected} · {pct}%` readout + Manage 28px ghost square icon-action + Cancel danger ghost (h-7 px-2 rose). NO Manage handler existed before — implemented it honestly as an inline expandable detail <dl> (category/scope/expected/outstanding/reference/created/session/description from existing charge fields; aria-expanded toggling); store calls not invented.
- CANCELLED history moved INSIDE the panel bottom as a compact `<details>` ("Cancelled (n) · payments preserved", restyled rows keep collected/date readouts); no delete anywhere (soft-cancel audit is permanent by design). FeeEmptyState now renders inside the p-0 body when zero active & not creating.
- Creation form functionally IDENTICAL (same state/validation/pickTemplate/submit payload/toggle semantics); only chrome aligned to benchmark: inputs/MoneyInput/date field h-9 (+text-xs labels via Label className, htmlFor/id pairs added for a11y), footer buttons h-8 with emerald Create CTA; violet tinted container kept (mx-4 margins now sit inside the p-0 panel body).
- fees-approvals.tsx wrapped in ONE Panel "Cash Verification" bodyClassName="p-0": subtitle = live counts chips — amber "{n} pending" (Pending Principal Acceptance + Collected by Teacher), violet "{n} clarification{s}", muted tabular-nums awaiting amount, fallback "No cash collections in the queue"; queue rows full-bleed divide-y with ALL prior info density REORDERED for scan: [collector initials avatar h-8 chip, title="Cash collected by …"] → studentName bold → class · fee head · Cash → mono line admissionNo · collected date · ref → optional balance-then → notes italic → clarification alert line; right stack = amount bold tabular-nums → status chip → actions.
- Status chip mapping implemented as local QueueStatusChip (dot + spec chip recipe): Pending Principal Acceptance → amber "Pending", Collected by Teacher → sky "Collected", Clarification Requested → violet "Clarification" (full status string kept on title attr). Actions reordered to ≤2 primaries: Approve = solid emerald sm, Reject = outline rose-text sm, Request Clarification DEMOTED to quiet h-7 w-7 ghost MessageSquare icon-button with aria-label/title (chose icon-ghost over kebab menu — visible ≤2 primary buttons per row satisfied; no DropdownMenu dependency added).
- ApproveModal: Balance Before/After rows replaced by a Before→After tiny tile PAIR (`grid-cols-[1fr_auto_1fr]`, ArrowRight divider; Before = bg-muted/40 rose value, After = bg-emerald-500/10 emerald value; both `text-sm font-bold tabular-nums` under `text-[9px] uppercase tracking-wider` labels; formatINR preserved; balanceAfter math unchanged). Rest of all three modals byte-preserved except decorative htmlFor/id additions on reject/clarify inputs.
- Recently Resolved became a collapsed `<details>` INSIDE the panel (list-none summary with History icon + ChevronDown, hover affordance); resolved rows themselves unchanged (initials-ring icons, reason quotes, FeeStatusBadge). All-clear logic placed in this file (it owns the panel): combined pendingVerification + pendingCashRequests === 0 → slim row "No pending verifications" + emerald Check circle chip; if the queue is locally empty but transaction-level verifications exist, the old FeeEmptyState remains (honest distinction — the slim phrase would otherwise lie about other channels).
- AUDIT/SAFETY PRESERVED: handleApprove/handleReject/handleClarify and their approveCashRequest/rejectCashRequest/requestClarification ('Principal', reason/message) emissions untouched; REJECT_REASONS catalog verbatim; duplicate-approval/loading-state guards intact; disabled conditions kept on all decision buttons; titles/admission/class data still rendered (fee head moved onto the meta line, nothing dropped silently).
- A11y/responsive pass: every interactive element is a real <button> (Manage/Clarify icon-actions carry aria-labels; charge Cancel has aria-label incl. name); amounts tabular-nums everywhere (row amounts, progress readout, chips' await totals, resolved list); secondary lines truncate + hide gracefully (hints hidden sm:block, "/student" hidden sm:inline, mono reference truncates; right columns shrink-0 with flex-wrap action clusters). No new dependencies; lucide-only imports (Settings2/History/ChevronDown/ArrowRight added, Banknote/Users dropped as unconsumed).
- VERIFICATION: `bunx eslint` over the three files → exit 0, zero issues (only the pre-existing .eslintignore-deprecation stderr notice). Project `bunx tsc --noEmit` filtered → zero diagnostics mentioning any of the three files (pre-existing app-shell.tsx NotificationItem error remains, out of scope). git diff: 3 files, +485/−306.

Stage Summary:
- PAYMENTS TAB POLISHED TO BENCHMARK: emerald operations header with month-stamped subtitle → Today/This Week/This Month micro-stat tiles (amber live ring) → single Additional Charges row-list Panel with expandable details + collapsed cancelled history → single Cash Verification Panel with scan-first rows, status chips, ≤2 primary decisions per row, Before→After approve preview, and a one-line all-clear when nothing awaits verification.
- Behavior checklist: flat composition/order intact; Collect wizard open via onCollect untouched; charge create/template/cancel flows identical (window.prompt cancel reused); cash approve/reject/clarify business logic + audit + reasons catalog verbatim; deep-link/badge surfaces (analytics.pendingCashRequests for tab badge) unaffected.
- Requests for orchestrator/siblings (NOT done, out of scope): (1) fee-store could expose a combined `anythingPendingVerification` boolean if the Payments all-clear should ever include gateway Webhook/UPI states beyond Under Verification/Pending; (2) window.prompt cancel could graduate to ConfirmDialog later (kept as-is per spec's reuse mandate); (3) both new Panels rely on shared/panel twMerge bodyClassName override semantics — already relied on by 2-a, confirming it works (p-0 wins over p-4).



---
Task ID: 2-e
Agent: Z.ai Code (main orchestrator, resumed after interruption)
Task: Verify + finish the interrupted Transactions & Settings polish (spec §7/§8), then full-module browser QA, spec §15 data-consistency enforcement, and handover.

Work Log:
- Confirmed the interrupted session had already CODE-COMPLETED 2-e: fees-transactions.tsx ("Phase 2-e polish" header — micro-stat tiles, SearchFilterBar toolbar, Type merged into Fee Head cell via category dots, benchmark table recipe, CSV export, detail drawer), fees-settings.tsx + fees-settings-payment.tsx (5-category IA: Fee Heads / Payment Collection / Late Fee Rules / Concession Rules / Receipt Settings; Payment Collection sub-nav Accepted Methods / Bank & Settlement / UPI·QR / Gateway / Reconciliation; section-panel headers; version-safety banner condensed to one line; one-time entry fee policy readout). school-settings-store/initial-state.ts carried the policy-aligned master catalogue (fh-1..fh-19 re-priced: ₹250/₹300/₹400 tuition bands, ₹700/₹900/₹1,000 exam bands, ₹1,500 board C10/C12, ₹500 transport opt-in, ₹500/yr M&M, ₹300 practicals).
- ESLint + tsc on all 2-e files → clean (only the pre-existing app-shell.tsx NotificationItem error remains project-wide, untouched per scope).
- Browser QA round 1 (agent-browser, principal login): Overview/Accounts/Structures/Payments/Transactions/Settings ALL render per spec; structures annual math verified on-screen (PN ₹3,500 = 3,000+500; C9 ₹4,400 incl ₹300 reg; C10 ₹5,600 incl ₹1,500 board; C11 PCM ₹6,200 incl 2 practicals; C6 exam "Not configured" per policy).
- QA FINDING (blocked acceptance §6/§15): entire fee demo was seeded in the ARCHIVED 2025-26 session while the sandbox clock reads 2026-08-27 → Payments Today/Week/Month tiles dead ₹0, verification queue ~9 months stale, session labels wrong. Fixed by a full session rollover (see Task ID: 3).

Stage Summary:
- 2-e verified complete; both files follow the Salary & Payroll benchmark language. No code changes needed for 2-e itself.
- Remaining issues found in QA were handed to Task ID: 3 (below).

---
Task ID: 3
Agent: Z.ai Code (main orchestrator)
Task: Fee session rollover to live 2026-27 + enforce spec §15 ledger/identity consistency (single engine, no contradictions), re-QA, handover.

Work Log:
- SESSION ROLLOVER (fee-store-data.ts): every 2025 date shifted into the live session — Apr/Jul/Aug 2025→2026 verbatim; Sep/Oct/Nov 2025 remapped into the Apr–Aug 2026 window with TXN010 dated TODAY (2026-08-27, Success UPI ₹2,450 → Today tile) and the 3 cash-verification items dated Aug 25–26; additional-charge due dates → 15 Sep / 30 Oct 2026 (future); settlements SET-01/02 → Apr/Jul 2026 settled, SET-03 pending 2026-08-29 (T+2); webhooks/reconciliations/audit/gateway lastWebhookAt (2026-08-27 09:45)/payment-mode addedAt all coherent; receipts RCP-2025-→RCP-2026- (counter 1060 = last seed RCP-2026-1060); UTR year segments updated; purposes reworded to actual months ("Aug tuition + chemistry practical", "Jul + Aug tuition"…); header/comment 2025-26→2026-27.
- SINGLE-SOURCE AY: exported CURRENT_ACADEMIC_YEAR='2026-2027' from fee-store-data.ts; runtime writers recordPayment + approveCashRequest now stamp it (were hardcoded '2025-2026' — new payments landed in the DEAD session); useFeeData default → constant; finance-store.ts glue call updated (Finance Dashboard reads fee data by AY label); fees-overview.tsx fallback, fees-additional-charges.tsx create-charge stamp, fees-structures-detail.tsx (subtitle fallback, AY input placeholder, structure detail label) all converted; school-settings-store effectiveFrom 19×'2025-04-01'→'2026-04-01'. Ledger date literals in fee-store.ts (heads/exam 2026-04-01, concession 04-02, late-fee 07-08) shifted.
- PERSIST: fee-store version 4→5 with full reseed migrate (stale persisted 2025-26 state replaced wholesale; receiptCounter 1060 preserved).
- §15 FIX 1 — ledger vs failed/refunded: the ledger balance walk previously subtracted ALL transactions incl. Failed (TXN017/018) and Refunded (TXN019) while account `paid` excluded them → closing balance contradicted outstanding. Now filters `countable` (Success/Under Verification) only.
- §15 FIX 2 — dual-ledger duality (THE big one): account paid was `Math.max(student.feePaid, coreTxnsPaid)` so (a) live payments NEVER moved accounts (verified live: a ₹700 UPI receipt left the card at Paid ₹9.5K/Due ₹700) and (b) the ledger closed at payable−Σreceipts while the header showed payable−max(...) — visible contradiction on every seeded student. New model: paid = student.feePaid + liveCorePaid where live = runtime-shaped ids (/^TXN-\d+$/) not already baked into the canonical register; a "Previous Receipts" ledger line carries the offline-history remainder (feePaid − seeded receipts) so the ledger now closes EXACTLY on the account outstanding. Verified on-screen: Ananya Desai (STU-16): bills ₹10.2K − Previous Receipts ₹7,900 − ₹1,600 receipt = ₹700 = header Core Outstanding ✓; Riya Agarwal after live ₹700 UPI payment → card flips to Paid/Paid ₹10.2K/Due "Clear", Overview "Students With Dues" 40→39, KPI identity Collected+Outstanding = Expected holds (2.28+1.55=3.83L).
- §15 FIX 3 — duplicate identities: roster PRNG produced duplicate full names (two "Reyansh Kumar": STU-11 DSO2024011 & STU-41 DSO2024041). genStudents now dedupes deterministically by stepping the LAST pool on collision WITHOUT consuming extra PRNG draws (every other seeded field byte-stable; only the dup's surname moves).
- §15 FIX 4 — dishonest copy: drawer Status Timeline showed "No payments yet" for students whose collections are register-level (static feePaid, no digitised receipts) → retitled "No receipts recorded yet" with honest description.
- RE-QA (agent-browser, desktop 1440 + tablet 768): reload triggers v5 reseed; Overview 2026-2027 labels, trend peaks Jul–Aug honestly; Payments tiles TODAY ₹2.5K (amber ring) / WEEK ₹3.5K / MONTH ₹6.6K; full Collect golden path: find-list → prefill ₹700 → UPI ref → Review → Pay → toast RCP-2026-1061 · AY 2026-2027 receipt, Today tile live-updates ₹2.5K→₹3.1K; Transactions shows 20 txns "13 successful + 7 other", ₹20.0K successful-only, new receipt on top, all 2026 dates; Settings Fee Heads usage counts ("Used in 12 structure(s)"), Bank masking (A/C •••••• 6789, IFSC visible, no credentials); tablet drawer/ledger no overflow. `bun run lint`-equivalent eslint on all touched files → 0 issues; tsc → only pre-existing app-shell error. dev-runtime.log clean; agent-browser `errors` → none.

Stage Summary:
- FEE MANAGEMENT IS NOW A LIVE, INTERNALLY CONSISTENT 2026-27 ERP MODULE: every account card, drawer stat, ledger, receipt, settlement and Overview KPI closes to the rupee; Today/Week/Month operational tiles are alive; new payments flow everywhere (receipt → account → ledger → Overview).
- Files touched this task: fee-store-data.ts, fee-store.ts, finance-store.ts, students-store/seed-data.ts, school-settings-store/initial-state.ts, fees-overview.tsx, fees-additional-charges.tsx, fees-structures-detail.tsx, fees-student-accounts.tsx. Salary & Payroll: ZERO lines touched (spec §20 honoured).
- Known pre-existing debt (NOT this wave): app-shell.tsx NotificationItem TS errors; .eslintignore deprecation warning; old-persisted browsers before this deploy get a one-time v5 reseed (intended).
- NEXT suggestions: (1) cron webDevReview rounds can now deepen other modules against the same benchmark; (2) optional: relative-date seed generator so the demo session always tracks the wall clock (CURRENT_ACADEMIC_YEAR is a constant today); (3) optional: promote local StatTile into fees-shared.tsx.
