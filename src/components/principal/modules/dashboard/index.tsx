'use client'

// Principal Dashboard — minimal composition root.
//
// Reduced from 11 stacked sections to 7 focused ones:
//   1. WelcomeBanner — minimal greeting + date
//   2. KpiRow — 8 cross-module stats in one compact strip
//   3. LiveAlerts — priority items needing action
//   4. ChartsRow1 — revenue vs expenses (the dashboard's primary chart)
//   5. QuickActionsRow — primary navigation shortcuts
//   6. RecentAdmissions — newest applications needing review
//   7. EventsRow — upcoming calendar
//
// Removed (per spec: "avoid duplicate analytics"):
//   - QuickStats (weekly trends duplicated KpiRow's purpose)
//   - ChartsRow2 (attendance trend duplicated the Attendance module's analytics)
//   - SecondaryKpiRow (operational noise; if needed, lives in respective modules)
//   - QuickInsights (decorative, not actionable)

import { WelcomeBanner } from './shared'
import { KpiRow } from './kpi-row'
import { LiveAlerts } from './live-alerts'
import { ChartsRow1 } from './charts-row'
import { QuickActionsRow } from './quick-actions'
import { EventsRow } from './events-row'
import { RecentAdmissions } from './recent-admissions'

export function PrincipalDashboard() {
  return (
    <div className="space-y-4">
      <WelcomeBanner />
      <KpiRow />
      <LiveAlerts />
      <ChartsRow1 />
      <QuickActionsRow />
      <RecentAdmissions />
      <EventsRow />
    </div>
  )
}

export const DashboardModule = PrincipalDashboard
export default PrincipalDashboard

