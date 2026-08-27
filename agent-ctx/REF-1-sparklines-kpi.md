# REF-1: Sparklines + Dashboard/Finance KPI refinement

Task ID: REF-1
Agent: full-stack-developer (Sparklines + KPI refinement)
Scope: Wire sparklines + trend into the Dashboard + Finance module KPI cards.

## Files modified
- `src/components/principal/modules/dashboard/kpi-row.tsx` (4 KPI cards)
- `src/components/principal/modules/fees/fees-overview.tsx` (KPI section, 4 cards)
- `src/components/principal/modules/salary/salary-overview.tsx` (KPI section, 4 cards)
- `src/components/principal/modules/finance-dashboard/finance-overview.tsx` (KPI section, 4 cards)

## Files NOT touched (per scope)
- `src/components/principal/modules/shared/summary-card.tsx` — already had `sparkline?` + `trend?` props wired (Task FC-3 prep).
- All chart components, donuts, OpenChartSection wrappers — out of scope.

## Data sources used (all real, no fabrication)
- Dashboard Attendance → `attendanceOverview.weekTrend.map(d => d.rate)` from `@/lib/mock/attendance` (6 points: 94.5, 93.8, 95.3, 93.3, 92.4, 91.4)
- Dashboard Pending Fees → `feeAnalytics.monthly.map(d => d.pending)` from `@/lib/mock/finance` (9 points, 3.2M → 5.2M)
- Dashboard New Admissions → `admissionsMonthly.map(d => d.value)` from `../analytics/data` (8 points: 312, 48, 18, 24, 31, 22, 36, 47 — ends at 47, matches `studentStats.newThisMonth`)
- Dashboard Upcoming Exams → no sparkline (count metric, per spec)
- Fees Total Expected → `analytics.monthly.map(m => m.collected + m.pending)` from `useFeeData` (store-computed)
- Fees Collected → `analytics.monthly.map(m => m.collected)`
- Fees Outstanding → `analytics.monthly.map(m => m.pending)`
- Fees Pending Verification → no sparkline (count, no trend data, per spec)
- Salary Monthly Payroll → `analytics.monthly.map(m => m.amount)` (fallback: no historical gross, uses net pay amount — per spec "d.gross || d.net || 0")
- Salary Net Payable → `analytics.monthly.map(m => m.amount)` (exact match — `amount` is totalNetPay per period)
- Salary Deductions → no sparkline (no monthly deductions data in store — don't fake it, per data integrity rule)
- Salary Needs Attention → no sparkline (count, per spec)
- Finance Total Revenue → `data.monthlyTrend.map(m => m.revenue)` from `useFinanceData`
- Finance Total Expenses → `data.monthlyTrend.map(m => m.expense)`
- Finance Net Surplus → `data.monthlyTrend.map(m => m.revenue - m.expense)`
- Finance Cash Available → `data.monthlyTrend.map(m => m.revenue)` (proxy per spec — no monthly cash trend available)

## Trend arrows (per spec instructions)
- Dashboard: Attendance='up', Pending Fees='up' (growing), New Admissions='up' (+18.4%), Upcoming Exams='neutral'
- Fees: Total Expected='neutral', Collected='up', Outstanding='down' (ideally decreasing per spec), Pending Verification='neutral'
- Salary: All 'neutral' (per spec)
- Finance: Total Revenue='up', Total Expenses='up' (growing with scale), Net Surplus='up', Cash Available='neutral'

## Verification
- `bun run lint` → 0 errors (only the pre-existing `.eslintignore` deprecation warning).
- `bunx tsc --noEmit 2>&1 | grep -E "dashboard/|fees/|salary/|finance-dashboard/"` → empty (no type errors in scope).
- `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` → HTTP 200. Dev log shows `GET / 200 in 27ms`.
- Pre-existing tsc errors in `src/lib/exams/*` and `src/lib/store/finance-store.ts:181` (type-narrowing on `recentActivity[].type`) untouched and predate this task.

## Data integrity decisions (important)
1. **No fabrication**: every sparkline value is a real number pulled from the existing store/mock. No inline arrays invented.
2. **admissionsMonthly cross-module import**: the canonical monthly admission counts live in `src/components/principal/modules/analytics/data.tsx` as `admissionsMonthly` (used by the existing Admissions Analytics chart). Importing it from `kpi-row.tsx` (Dashboard module) is the cleanest path — it's the single source of truth (ends at 47, matching `studentStats.newThisMonth`).
3. **Salary monthly.amount is net pay**: salary-store's `analytics.monthly` is `[{month, amount}]` where `amount = totalNetPay` per period (no historical gross or deductions). So Monthly Payroll and Net Payable both use `m.amount` — the two cards will have the same sparkline shape. This is acceptable since they're related metrics that scale together; per spec fallback chain `d.gross || d.net || 0`, the `amount` key is the net-pay fallback. Deductions has no monthly data → sparkline left OFF (don't fake).
4. **Finance Cash Available**: no monthly cash trend in finance-store; per spec instruction "use the revenue trend as proxy", sparkline = `m.revenue`, trend='neutral'.
5. **Pending Verification, Needs Attention, Upcoming Exams, Deductions**: count metrics with no trend data → sparkline left off (per data integrity rule).
