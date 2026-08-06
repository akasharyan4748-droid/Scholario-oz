'use client'

// Principal Dashboard — modular composition root.
//
// The original monolithic `dashboard.tsx` (1174 lines) has been split across
// focused files inside this directory. This `index.tsx` is the entry point
// that re-exports the public `PrincipalDashboard` symbol used by
// `principal-panel.tsx` and composes the sub-sections in their original
// visual order. No UI/UX was changed in the refactor — only the file layout.

import { WelcomeBanner } from './shared'
import { KpiRow, SecondaryKpiRow } from './kpi-row'
import { QuickStats } from './quick-stats'
import { LiveAlerts } from './live-alerts'
import { QuickInsights } from './insights'
import { ChartsRow1, ChartsRow2 } from './charts-row'
import { QuickActionsRow } from './quick-actions'
import { EventsRow } from './events-row'
import { RecentAdmissions } from './recent-admissions'

export function PrincipalDashboard() {
  return (
    <div className="space-y-6">
      <WelcomeBanner />
      <KpiRow />
      <QuickStats />
      <LiveAlerts />
      <QuickInsights />
      <ChartsRow1 />
      <ChartsRow2 />
      <QuickActionsRow />
      <SecondaryKpiRow />
      <EventsRow />
      <RecentAdmissions />
    </div>
  )
}

// Backwards-compatible alias. The task brief referred to this module as
// `DashboardModule`; we keep the original `PrincipalDashboard` name (the
// export actually consumed by `principal-panel.tsx`) and also surface the
// alias so both import styles resolve.
export const DashboardModule = PrincipalDashboard
export default PrincipalDashboard
