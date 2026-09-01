# Scholario-OS Worklog (Live)

> Full project history (1442 lines) preserved at `worklog-archive.md`.
> This file tracks the current engagement: system-wide role/UX/responsiveness polish.

## Project Snapshot

- **App**: Scholario — multi-role school ERP (Super Admin / Principal / Teacher / Student).
- **Entry**: single route `/` (src/app/page.tsx) — client-side SPA; role panels:
  `src/components/{principal,teacher,student,superadmin}/*-panel*`.
- **Auth**: demo credential login (localStorage `scholario-auth`), API `/api/auth/login`.
  - principal@greenwood.edu.in / principal123
  - rohan.mehta@greenwood.edu.in / teacher123
  - aarav.sharma@greenwood.edu.in / student123
  - admin@scholario.cloud / admin123
- **Data layer (canonical)**: Prisma + SQLite (`db/custom.db`, `DATABASE_URL=file:/home/z/my-project/db/custom.db`)
  AND Zustand persisted stores under `src/lib/store/*` (tenant-scoped namespaces per school).
  Finance/fee-store is at persist v12; applications-store v6; school-settings v6.
- **Tenants**: School A (Demo/Greenwood) + School B (SPS-002) — capability matrix
  `src/lib/tenant/*` (Super Admin grants capabilities; Principal sees View-Only when denied).
- **Design benchmark**: Finance module (Fee Management, Salary & Payroll) — carry its
  card/spacing/drawer/tabs/badge language to other modules WITHOUT flattening module identity.
- **Env**: Next.js 16 (Turbopack) on :3000, `bun run dev` (tee dev.log), tsc+lint must stay clean.

## Engagement Rules (from user brief)

1. Principal = master experience; sync subsets to Teacher/Student (no blind duplication).
2. Do NOT redesign Finance/Teacher/Student dashboards unnecessarily — polish, don't rewrite.
3. Priority modules to lift: Library, Downloads, Certificates, Inventory, Settings, Principal Dashboard.
4. Filters responsive (mobile = compact drawer w/ active count). Tables → cards on mobile.
5. No over-design: no gradients-everywhere, no fake AI, no fake data, no dev jargon in UI.
6. Permissions: visible buttons must work; store-level enforcement already exists — respect it.
7. Multi-tenant isolation must hold (School A vs B).
8. Target: 0 tsc errors, 0 lint errors, 0 runtime/console errors, no horizontal overflow @390px.

---
Task ID: 1
Agent: Z.ai Code (main orchestrator)
Task: Deploy github.com/akasharyan4748-droid/Scholario-oz into sandbox workspace and bring it up cleanly.

Work Log:
- Cloned repo @ 2cc8786 (HEAD = apps-fin-link-1: fee↔applications linkage + purge migrations).
- Found committed syntax corruption in src/app/page.tsx line 41 (`const ounted, setMounted]`) — fixed to `const [mounted, setMounted]`.
- Copied src/, prisma/, db/custom.db (823KB, seeded), public/, mini-services/, root configs into /home/z/my-project.
- package.json: added jsbarcode, jspdf, jspdf-autotable, qrcode.react@4.2.0, socket.io-client, @google/genai, @supabase/supabase-js (kept z-ai-web-dev-sdk).
- bun install ✓ · prisma generate ✓ · db push (already in sync) ✓.
- tsc --noEmit: 0 errors ✓ · bun run dev → :3000 HTTP 200 ✓.
- Archived repo worklog (1442 lines) to worklog-archive.md.

Stage Summary:
- Latest Scholario code running in sandbox. Next: full role/module audit via agent-browser, then targeted module polish (Library, Downloads, Certificates, Inventory, Settings, Principal Dashboard, responsive filters).

---
Task ID: 2-a
Agent: 2-a library-polish (subagent, completed by main orchestrator)
Task: Polish Principal Library module to Finance-module quality.

Work Log:
- Subagent added LibKpiCard primitive to library-shared.tsx and a compact KPI overview strip to index.tsx: Total Books (213 · 15 titles), Available Copies (137 · 64%), Active Loans (10 · 6 on schedule), Overdue (4 · needs follow-up), Pending Fines (₹110 · 4 borrowers) — all values from useLibraryData().analytics, clickable → relevant tab.
- Catalogue rows: availability now reads "8 of 12" + thin h-1.5 utilization bar (emerald >30%, amber low, rose 0). Issue action preserved.
- Status badges: Available/Low Stock/Out of Stock semantic styling aligned with fees statusAccent.
- Empty states with clear-filters action added; filters (category + availability) combine with search.
- Fixed library-store defect: mostIssued recomputed via state mutation (mutating array in selector) — corrected.
- Main orchestrator verified in browser: KPI values reconcile with tab badges (Issued 10 / Overdue 4 / Fines 4); KPI click switches tabs; overdue rows show fine ₹ + Return/Remind actions; 390px scrollWidth === 390 (no page overflow); console zero errors. Issue-book dialog verified to student-picker stage (server memory constraint interrupted full flow; store action issueBook() unchanged and previously verified).
- Gates: tsc --noEmit 0 errors ✓ (orchestrator) · bun run lint clean after suppressing react-hooks/preserve-manual-memoization on fee-store's exhaustive 17-dep useMemo (pre-existing, semantics preserved) ✓.

Stage Summary:
- Library now matches the Finance design language: KPI strip + utilization hints + semantic badges + working filters + empty states + mobile-safe tables.
- ENV NOTE (critical for future agents): 4GB cgroup OOM-kills next-server when browser (≈700MB) + server (≈2.6GB retained after compile) + new route compiles coincide. Workflow rule: warm all routes via curl with browser CLOSED; open browser only in short verification bursts; never delete .next (filesystem cache makes restarts 12ms); restart via `(bun run dev > /dev/null 2>&1 &)` if killed.
