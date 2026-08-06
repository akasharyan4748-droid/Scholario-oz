'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Building2, CreditCard, Server, ShieldCheck, Code2,
  LifeBuoy, Flag, ScrollText, Settings, Cloud, Globe,
} from 'lucide-react'
import { AppShell, type NavGroup } from '@/components/shell/app-shell'
import { SADashboardModule } from './modules/dashboard'
import { SchoolsModule } from './modules/schools'
import { BillingModule } from './modules/billing'
import { InfrastructureModule } from './modules/infrastructure'
import { SecurityModule } from './modules/security'
import { DeveloperModule } from './modules/developer'
import { SupportModule } from './modules/support'
import { FeatureFlagsModule } from './modules/feature-flags'
import { AuditTrailModule } from './modules/audit-trail'
import { ReligionMasterModule } from './modules/religion-master'

const navGroups: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      { key: 'dashboard', label: 'Platform Overview', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { key: 'schools', label: 'Schools & Tenants', icon: <Building2 className="h-4.5 w-4.5" />, badge: 248 },
      { key: 'billing', label: 'Billing & Revenue', icon: <CreditCard className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { key: 'infrastructure', label: 'Cloud & Infra', icon: <Server className="h-4.5 w-4.5" /> },
      { key: 'security', label: 'Security Center', icon: <ShieldCheck className="h-4.5 w-4.5" />, badge: 1 },
      { key: 'developer', label: 'Developer Center', icon: <Code2 className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'support', label: 'Support Center', icon: <LifeBuoy className="h-4.5 w-4.5" />, badge: 24 },
      { key: 'feature-flags', label: 'Feature Flags', icon: <Flag className="h-4.5 w-4.5" /> },
      { key: 'religion-master', label: 'Religion Master', icon: <Globe className="h-4.5 w-4.5" /> },
      { key: 'audit', label: 'Audit Trail', icon: <ScrollText className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'settings', label: 'Global Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    ],
  },
]

export function SuperAdminPanel() {
  const [active, setActive] = useState('dashboard')

  return (
    <div className="role-superadmin">
      <AppShell
        groups={navGroups}
        activeKey={active}
        onNavigate={setActive}
        role="superadmin"
        roleLabel="Super Admin · Platform"
        quickAction={{ label: 'Onboard School', onClick: () => setActive('schools') }}
      >
        {active === 'dashboard' && <SADashboardModule />}
        {active === 'schools' && <SchoolsModule />}
        {active === 'billing' && <BillingModule />}
        {active === 'infrastructure' && <InfrastructureModule />}
        {active === 'security' && <SecurityModule />}
        {active === 'developer' && <DeveloperModule />}
        {active === 'support' && <SupportModule />}
        {active === 'feature-flags' && <FeatureFlagsModule />}
        {active === 'religion-master' && <ReligionMasterModule />}
        {active === 'audit' && <AuditTrailModule />}
        {active === 'settings' && (
          <div className="space-y-5">
            <div className="mb-4">
              <h1 className="font-display text-2xl font-bold tracking-tight">Global Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Platform-wide configuration & controls</p>
            </div>
            <div className="glass rounded-2xl p-12 text-center shadow-premium">
              <Cloud className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">Global Settings Console</p>
              <p className="text-xs text-muted-foreground mt-1">White label · theme · language · backup · disaster recovery · environment management</p>
              <button className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md">
                Configure Platform
              </button>
            </div>
          </div>
        )}
      </AppShell>
    </div>
  )
}
