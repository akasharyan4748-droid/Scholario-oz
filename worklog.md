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

## Unresolved Issues / Risks / Next-Phase Priorities
1. (Low) Repo's bundled `mini-services/dev-server` is unused; decide whether to adopt it or remove to avoid port/log conflicts.
2. (Low) `logs/dev.pid` and stale `dev.log` heritage from repo — cleaned; keep single log convention (dev-runtime.log).
3. (Medium) Heavy client-mock data vs DB-backed data inconsistency across modules — next phase should audit which modules still read mocks and migrate to API routes.
4. (Suggested features next phase): notification center wiring to notifications-feed API, AI question generation UX polish, WebSocket-based real-time alerts, i18n via next-intl, PWA offline support, per-module skeleton loading states.

---
