# TASK 2-e: Principal Dashboard Polish

Scholario school ERP at /home/z/my-project. Next.js 16 App Router + Tailwind 4 + shadcn/ui + zustand. Dev server ALREADY RUNNING at http://localhost:3000 — do NOT start/restart/build it.

## Read first
1. /home/z/my-project/worklog.md (project context)
2. Design benchmark: src/components/principal/modules/fees/fees-shared.tsx (FeeKpiCard pattern — soft tinted, compact)
3. All files in src/components/principal/modules/dashboard/ (index.tsx, data.tsx, kpi-row.tsx, charts-row.tsx, events-row.tsx, quick-actions.tsx, live-alerts.tsx, live-alerts-content.tsx, live-alerts-list.tsx, live-alerts-toolbar.tsx, recent-admissions.tsx, shared.tsx)

## Goal
Principal dashboard must immediately answer: What needs my attention? What happened today? What is pending? What requires action? How is the school performing? Current rating 8/10 — GENTLE polish only, do NOT redesign.

Known weaknesses: oversized "toy-like" elements (KPI cards + alert items ~30% too big), alerts lack inline CTAs, greeting area wastes vertical space.

## Specific improvements (gentle density/CTA/hierarchy polish)
1. **Density pass**: KPI cards to FeeKpiCard scale (p-3.5, text-xl/2xl values); alert list rows compact two-line rows; "Resolve All" button h-8 text-xs; greeting header reduced vertical padding (keep "Good morning, Dr. Ananya" + context line, compact).
2. **Alert CTAs**: live-alerts list items get ONE inline contextual action where a natural deep-link exists (fee alert → "Review fees" → fee module; bus delay → transport; low stock → inventory). Reuse the existing onNavigate mechanism the KPIs use. ONLY where target module exists. Max ONE action per row.
3. **Priority hierarchy**: Critical (rose) → High (amber) → Info (sky) with subtle left border or priority chip — consistent and quiet. Refine existing tags to this system if inconsistent.
4. **Today context**: recent activity/admissions/events rows show time-ago or date context. Compact.
5. **Charts row**: audit — verify canonical chart components, no layout issues (clipped labels, wrong month trimming). Fix only real issues. DO NOT rebuild charts.
6. **Quick actions**: audit quick-actions.tsx — keep most useful (Add Student, Collect Fee, Announce, Issue Certificate), each navigates correctly. Compact grid.
7. **Empty states**: calm empty state if no alerts ("Nothing needs attention right now").
8. **Responsive 390px**: everything stacks, no page overflow (scrollWidth === 390), KPI grid 2-col on mobile. Also check 768px (2-4 col grids).

## Browser verification (agent-browser --session dash-e — YOUR OWN session)
- Login: http://localhost:3000/#portal → "Principal" credential → "Sign In".
- Screenshots before/after (1440px + 390px).
- Test: KPI click navigations; alert CTAs navigate to correct modules; quick actions navigate; Resolve All works; charts render without clipping; console zero errors.

## Gates
`cd /home/z/my-project && bunx tsc --noEmit` → 0 errors. `bun run lint` → clean.

## Constraints
- ONLY modify src/components/principal/modules/dashboard/.
- Do NOT remove any data connections/features. NO new deps, NO over-design (no new gradients/animations/hero sections/fake stats).

## Worklog
APPEND to /home/z/my-project/worklog.md a section starting `---` with: Task ID: 2-e, Agent: 2-e dashboard-polish, Work Log, Stage Summary.
