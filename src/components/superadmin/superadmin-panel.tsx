'use client'

/**
 * Super Admin — MOCK PLATFORM CONTROL PLANE (SaaS-STAGE-2A · Task 7-a).
 *
 * Three honest surfaces only (no fake badge counts, no fake analytics):
 *
 *   Overview          → platform summary derived live from the tenant store
 *   Schools           → tenant ledger + per-school Control Center
 *   Platform Controls → adapter seams, platform policies, mock email outbox
 *
 * All data comes from the real tenant foundation (src/lib/tenant) — the
 * three demo tenants, their live configs and the platform change log.
 */

import { useState } from 'react'
import { LayoutDashboard, Building2, SlidersHorizontal } from 'lucide-react'
import { AppShell, type NavGroup } from '@/components/shell/app-shell'
import { PlatformOverviewModule } from './modules/overview'
import { SchoolsModule } from './modules/schools'
import { PlatformControlsModule } from './modules/platform-controls'

const navGroups: NavGroup[] = [
  {
    label: 'Control Plane',
    items: [
      { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { key: 'schools', label: 'Schools', icon: <Building2 className="h-4.5 w-4.5" /> },
      { key: 'platform-controls', label: 'Platform Controls', icon: <SlidersHorizontal className="h-4.5 w-4.5" /> },
    ],
  },
]

export function SuperAdminPanel() {
  const [active, setActive] = useState('overview')
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)

  /** Overview "Open →" — jump to the Schools view with that school selected. */
  const openSchool = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setActive('schools')
  }

  return (
    <div className="role-superadmin">
      <AppShell
        groups={navGroups}
        activeKey={active}
        onNavigate={setActive}
        role="superadmin"
        roleLabel="Platform Control Plane"
      >
        {active === 'overview' && <PlatformOverviewModule onOpenSchool={openSchool} />}
        {active === 'schools' && (
          <SchoolsModule selectedTenantId={selectedTenantId} onSelectTenant={setSelectedTenantId} />
        )}
        {active === 'platform-controls' && <PlatformControlsModule />}
      </AppShell>
    </div>
  )
}
