# DASH-1 — Dashboard redesign to Academics visual language

**Task**: Redesign Principal Dashboard to match Academics (Examinations + Attendance) visual language.

**Scope**: `src/components/principal/modules/dashboard/` only + `principal-panel.tsx` wiring.

**Canonical primitives used** (already built by previous agents):
- `PageTransition` from `@/components/shared/ui` — shell wrapper
- `SummaryCard` + `SummaryCardGrid` from `../shared/summary-card` — 4 KPI cards
- `Panel` from `../shared/panel` — flat section container (replaces legacy GlassCard)
- `Avatar` from `@/components/shared/avatar` — student avatars (replaces legacy GradientAvatar)
- `AreaTrendChart` + `DonutChart` from `@/components/shared/premium-charts` — charts in flat Panels (replaces legacy ChartCard)
- shadcn `Table` from `@/components/ui/table` — Academics table language
- shadcn `DropdownMenu` from `@/components/ui/dropdown-menu` — More menu in alert toolbar

**Navigation wiring**:
- `principal-panel.tsx` passes `setActive` as `onNavigate` prop to `PrincipalDashboard`
- 4 KPI cards → click navigates to attendance / fees / admission / exams
- 6 Quick Action buttons → click navigates to admission / attendance / fees / exams / communication / salary
- Alert rows → click navigates to alert's `navKey` module (was: only toasted "Navigating…")
- Notice Board "View all" → communication
- Recent Admissions rows + Eye button → admission
- Upcoming Events rows → calendar
- Pending Reviews rows → admission / fees / salary
- Charts "View Finance" / "View Fees" actions → finance / fees
- WelcomeBanner Students/Teachers chips → students / teachers

**Real data wired** (was mock/hardcoded):
- Recent Admissions: `useAdmissionStore.applications` (was `students.slice(0,6)` mislabeled)
- Pending Reviews counts: `useAdmissionStore`, `useFeeStore.cashRequests`, `useSalaryStore.adjustments` (was hardcoded "23")
- Notice Board: `useCommunicationStore.announcements` (with mock fallback)

**Removed dead code**:
- `SecondaryKpiRow` (kpi-row.tsx lines 38-47)
- `ChartsRow2` (charts-row.tsx lines 76-123)
- `sparkline` + `weeklyTrends` + `WeeklyTrend` (data.tsx lines 9-55)
- "Today's Alert Activity" bar chart (live-alerts-content.tsx lines 84-145)
- 4-button stats strip (live-alerts-content.tsx lines 65-82)
- "+72M surplus" fake StatusBadge on chart 1 (charts-row.tsx line 41)
- 6 colorful gradient Quick Action tiles (quick-actions.tsx lines 14-21)
- Class 2-A Top Performers card (events-row.tsx lines 43-76)

**Verification**:
- `bun run lint` → 0 errors (only the legacy `.eslintignore` warning unrelated to this work)
- `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` → HTTP 200
- `bunx tsc --noEmit | grep -E "dashboard/|principal-panel"` → empty (no type errors)
- dev.log shows clean compiles, no runtime errors from dashboard module

**Files changed** (12):
- `src/components/principal/principal-panel.tsx` — wire `onNavigate={setActive}` to PrincipalDashboard
- `src/components/principal/modules/dashboard/index.tsx` — PageTransition + onNavigate prop
- `src/components/principal/modules/dashboard/shared.tsx` — WelcomeBanner + Students/Teachers meta
- `src/components/principal/modules/dashboard/kpi-row.tsx` — 4 SummaryCards with onClick
- `src/components/principal/modules/dashboard/live-alerts.tsx` — flat Panel "Principal Attention"
- `src/components/principal/modules/dashboard/live-alerts-content.tsx` — drop chart + stats strip
- `src/components/principal/modules/dashboard/live-alerts-toolbar.tsx` — 3 actions + More dropdown
- `src/components/principal/modules/dashboard/live-alerts-list.tsx` — Academics-style flat rows
- `src/components/principal/modules/dashboard/charts-row.tsx` — flat Panel + AreaTrendChart + DonutChart
- `src/components/principal/modules/dashboard/quick-actions.tsx` — flat action rows + Notice Board
- `src/components/principal/modules/dashboard/recent-admissions.tsx` — shadcn Table + Avatar + real store
- `src/components/principal/modules/dashboard/events-row.tsx` — 2 cards (drop Top Performers)
- `src/components/principal/modules/dashboard/data.tsx` — drop dead sparkline/weeklyTrends
