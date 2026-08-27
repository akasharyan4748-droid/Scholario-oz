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
