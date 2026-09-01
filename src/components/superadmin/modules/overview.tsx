'use client'

/**
 * Platform Overview (mock control plane · Task 7-a) — derived ONLY from the
 * tenant store + demo tenant identities. No fake analytics, no MRR, no
 * charts: counts of schools, enabled modules, users and exam patterns plus
 * a per-school status strip and the cross-tenant platform change log.
 */

import { useMemo } from 'react'
import {
  Building2, Layers, Users, ClipboardCheck, ChevronRight, History, Inbox,
} from 'lucide-react'
import { useTenantStore } from '@/lib/tenant/store'
import { TENANTS } from '@/lib/tenant/schools'
import { MODULE_CATALOG } from '@/lib/tenant/registry'
import type { TenantId } from '@/lib/tenant/types'
import { SummaryCard, SummaryCardGrid } from '@/components/principal/modules/shared/summary-card'
import { Panel } from '@/components/principal/modules/shared/panel'
import {
  TenantStatusPill, TenantPlanChip, TenantInitialsTile,
  PlatformChangeValueChip, formatPlatformTimestamp,
} from './tenant-badges'

interface PlatformOverviewModuleProps {
  /** "Open →" on a strip row — navigate to Schools with that school selected. */
  onOpenSchool: (tenantId: TenantId) => void
}

export function PlatformOverviewModule({ onOpenSchool }: PlatformOverviewModuleProps) {
  const configs = useTenantStore((s) => s.configs)
  const changeLog = useTenantStore((s) => s.changeLog)

  const schools = useMemo(
    () => TENANTS.map((t) => ({ tenant: t, config: configs[t.id] ?? t.config })),
    [configs],
  )

  const activeCount = schools.filter((s) => s.config.status === 'active').length
  const trialCount = schools.filter((s) => s.config.status === 'trial').length
  const enabledModulesTotal = schools.reduce(
    (sum, s) => sum + MODULE_CATALOG.filter((m) => s.config.features[m.key]).length,
    0,
  )
  const activeUsers = TENANTS.reduce((sum, t) => sum + t.stats.users, 0)
  const patternACount = schools.filter((s) => s.config.examTemplateId === 'ut4-hy-annual').length
  const patternBCount = schools.length - patternACount

  // Newest-first across ALL tenants (platform-wide audit feed).
  const recentChanges = useMemo(() => {
    const rows = TENANTS.flatMap((t) =>
      (changeLog[t.id] ?? []).map((e) => ({
        tenantId: t.id,
        schoolName: t.shortName,
        at: e.at,
        target: e.target,
        label: e.label,
        value: e.value,
      })),
    )
    return rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, 8)
  }, [changeLog])

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mock control plane — derived live from the tenant store ({TENANTS.length} demo tenants)
        </p>
      </div>

      {/* Summary strip — honest counts only */}
      <SummaryCardGrid columns={4}>
        <SummaryCard
          label="Schools"
          value={TENANTS.length}
          sub={`${activeCount} active · ${trialCount} trial`}
          icon={<Building2 className="h-4 w-4" />}
          tone="sky"
          delay={0}
        />
        <SummaryCard
          label="Enabled modules"
          value={enabledModulesTotal}
          sub={`across ${TENANTS.length} schools`}
          icon={<Layers className="h-4 w-4" />}
          tone="violet"
          delay={0.05}
        />
        <SummaryCard
          label="Active users"
          value={activeUsers}
          sub="demo tenants"
          icon={<Users className="h-4 w-4" />}
          tone="emerald"
          delay={0.1}
        />
        <SummaryCard
          label="Exam patterns"
          value={`${patternACount} A · ${patternBCount} B`}
          sub="A: UT×4+HY+Annual · B: Quarterly+HY+Annual"
          icon={<ClipboardCheck className="h-4 w-4" />}
          tone="teal"
          delay={0.15}
        />
      </SummaryCardGrid>

      {/* Per-school status strip — compact ledger rows, not giant cards */}
      <Panel
        title="Schools"
        subtitle="Status · plan · session — straight from each tenant's live config"
        bodyClassName="p-0"
      >
        <ul>
          {schools.map(({ tenant, config }) => (
            <li
              key={tenant.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 border-t border-border/40 first:border-t-0 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 basis-48">
                <TenantInitialsTile initials={tenant.initials} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{tenant.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {tenant.code} · {tenant.city}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <TenantStatusPill status={config.status} />
                <TenantPlanChip plan={config.plan} />
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-muted text-muted-foreground ring-1 ring-border whitespace-nowrap">
                  {tenant.session}
                </span>
              </div>
              <button
                onClick={() => onOpenSchool(tenant.id)}
                className="ml-auto inline-flex items-center gap-0.5 h-7 px-2 rounded-md text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Open ${tenant.name} in Schools`}
              >
                Open <ChevronRight className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Recent platform changes — cross-tenant change log */}
      <Panel title="Recent platform changes" subtitle="Newest first, across all tenants" bodyClassName="p-0">
        {recentChanges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-2.5">
              <Inbox className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">No configuration changes yet</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Super Admin actions in Schools → Control Center will appear here.
            </p>
          </div>
        ) : (
          <ul>
            {recentChanges.map((e, i) => (
              <li
                key={`${e.tenantId}-${e.at}-${e.target}-${i}`}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 border-t border-border/40 first:border-t-0"
              >
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums whitespace-nowrap w-32 shrink-0">
                  <History className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                  {formatPlatformTimestamp(e.at)}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[140px] shrink-0" title={e.schoolName}>
                  {e.schoolName}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[9px] bg-muted text-muted-foreground ring-1 ring-border whitespace-nowrap">
                  {e.target}
                </span>
                <span className="text-xs min-w-0 truncate" title={e.label}>
                  {e.label}
                </span>
                <span className="ml-auto shrink-0">
                  <PlatformChangeValueChip value={e.value} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
