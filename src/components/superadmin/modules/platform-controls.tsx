'use client'

/**
 * Platform Controls (mock control plane · SaaS-STAGE-2A).
 *
 * Honest infrastructure surface — NO fake metrics:
 *   1. Adapter registry — the four clean seams (Mock → production target)
 *   2. Platform policies — archive retention + platform-reserved delete
 *   3. Mock email outbox — proof the email adapter seam is REAL and consumed
 *   4. Active mock tenant — which school's context the panels are running in
 */

import { useEffect, useState } from 'react'
import { Database, Mail, CreditCard, HardDrive, Trash2, ShieldCheck, TimerReset, MonitorSmartphone } from 'lucide-react'
import { getAdapterRegistry, readEmailOutbox, clearEmailOutbox, type OutboxEntry } from '@/lib/platform/adapters'
import { useActiveTenant, switchTenant } from '@/lib/tenant/store'
import { TENANTS } from '@/lib/tenant/schools'
import { Panel } from '@/components/principal/modules/shared/panel'
import { TenantInitialsTile } from './tenant-badges'
import { cn } from '@/lib/utils'

const ADAPTER_ICONS: Record<string, React.ReactNode> = {
  database: <Database className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  payment: <CreditCard className="h-3.5 w-3.5" />,
  storage: <HardDrive className="h-3.5 w-3.5" />,
}

export function PlatformControlsModule() {
  const [outbox, setOutbox] = useState<OutboxEntry[]>([])
  const activeTenant = useActiveTenant()

  useEffect(() => {
    setOutbox(readEmailOutbox())
  }, [])

  const adapters = getAdapterRegistry()

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Platform Controls</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adapter boundaries, platform policies and the mock integration outbox
        </p>
      </div>

      {/* Adapter registry */}
      <Panel title="Adapter boundaries" subtitle="Mock today — each seam swaps to its production provider without touching callers" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/40">
                <th className="px-3 py-2 font-semibold">Boundary</th>
                <th className="px-3 py-2 font-semibold">Current (mock)</th>
                <th className="px-3 py-2 font-semibold">Production target</th>
                <th className="px-3 py-2 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {adapters.map((a) => (
                <tr key={a.id} className="border-t border-border/30">
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-muted-foreground">{ADAPTER_ICONS[a.id]}</span>
                      {a.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{a.current}</td>
                  <td className="px-3 py-2.5 text-[11px]">{a.target}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap ring-1',
                        a.configured
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20'
                          : 'bg-muted text-muted-foreground ring-border',
                      )}
                    >
                      {a.configured ? 'Configured' : 'Mock · adapter ready'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border/40">
          No production credentials are configured or faked — adapters detect configuration at runtime and fall back to the mock implementations.
        </p>
      </Panel>

      {/* Platform policies */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Archive retention" subtitle="Fee Structure lifecycle" bodyClassName="p-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-muted-foreground"><TimerReset className="h-4 w-4" aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold">Active → Archived → 30-day retention → platform purge</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Principals archive structures; archived versions carry retention metadata
                (<span className="font-mono text-[10px]">archivedAt</span>) and the purge-eligible date is shown
                in version history. The purge itself is a future SERVER-SIDE platform job — never a client timer.
              </p>
            </div>
          </div>
        </Panel>
        <Panel title="Permanent delete" subtitle="Platform-reserved capability" bodyClassName="p-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-muted-foreground"><ShieldCheck className="h-4 w-4" aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold">Principals never permanently delete Fee Structures</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                <span className="font-mono text-[10px]">fee_structure_delete</span> cannot be enabled for any
                school role — the store rejects it regardless of client state. Only the platform (retention
                expiry or future Super Admin tooling, server-side) removes structures permanently.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Mock email outbox */}
      <Panel
        title="Mock email outbox"
        subtitle="Every school-configuration change notifies the school principal via the email adapter seam"
        bodyClassName="p-0"
        action={
          <button
            onClick={() => { clearEmailOutbox(); setOutbox([]) }}
            disabled={outbox.length === 0}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Trash2 className="h-3 w-3" aria-hidden /> Clear
          </button>
        }
      >
        {outbox.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs font-semibold text-muted-foreground">Outbox is empty</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Change a school's configuration in Schools → Control Center and the notification lands here.
            </p>
          </div>
        ) : (
          <ul>
            {outbox.map((m) => (
              <li key={m.id} className="px-3 py-2 border-t border-border/40 first:border-t-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[11px] font-semibold truncate max-w-[200px]" title={m.to}>{m.to}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[9px] bg-muted text-muted-foreground ring-1 ring-border">
                    {m.template ?? 'email'}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums ml-auto whitespace-nowrap">
                    {new Date(m.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate" title={m.subject}>{m.subject}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border/40">
          Mock adapter — becomes Resend in production. No credentials are configured in this environment.
        </p>
      </Panel>

      {/* Active mock tenant */}
      <Panel title="Active mock tenant" subtitle="The school context the panels are currently running in" bodyClassName="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 basis-56">
            <TenantInitialsTile initials={activeTenant.initials} />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{activeTenant.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{activeTenant.code} · {activeTenant.city}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Switch mock tenant">
            <MonitorSmartphone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {TENANTS.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTenant(t.id)}
                disabled={t.id === activeTenant.id}
                className={cn(
                  'h-7 px-2 rounded-md text-[11px] font-medium transition-colors',
                  t.id === activeTenant.id
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30 cursor-default'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {t.shortName}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2.5">
          Switching reloads the app so every school-scoped store re-hydrates from that school's own data namespace.
        </p>
      </Panel>
    </div>
  )
}
