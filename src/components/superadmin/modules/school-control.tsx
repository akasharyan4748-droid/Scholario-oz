'use client'

/**
 * School Control Center (mock control plane · SaaS-STAGE-2A).
 *
 * For the SELECTED school: overview block + grouped feature controls +
 * sub-features + examination pattern + principal capabilities + per-tenant
 * platform change log. Every mutation is scoped to THIS tenant's config
 * (configs[tenantId]) and appends to that tenant's change log — changing
 * School A never touches School B (the isolation guarantee).
 *
 * Also fires a mock EMAIL notification via the platform adapter seam on
 * every change (the seam the Platform Controls screen documents).
 */

import { useState } from 'react'
import {
  ArrowLeft, Building2, CalendarRange, GraduationCap, History, Lock,
  RotateCcw, School as SchoolIcon, Users, MonitorSmartphone,
} from 'lucide-react'
import { useTenantStore } from '@/lib/tenant/store'
import { getTenantById } from '@/lib/tenant/schools'
import {
  CAPABILITY_CATALOG, EXAM_TEMPLATES, MODULE_CATALOG, MODULE_GROUP_LABELS,
  SUB_FEATURE_CATALOG, type ModuleGroupId,
} from '@/lib/tenant/registry'
import type { FeatureKey, TenantId } from '@/lib/tenant/types'
import { getEmailAdapter } from '@/lib/platform/adapters'
import { switchTenant } from '@/lib/tenant/store'
import { useAuth } from '@/lib/store/auth-store'
import { Panel } from '@/components/principal/modules/shared/panel'
import { cn } from '@/lib/utils'
import {
  TenantInitialsTile, TenantPlanChip, TenantStatusPill, PlatformChangeValueChip,
  formatPlatformTimestamp,
} from './tenant-badges'

const GROUP_ORDER: ModuleGroupId[] = ['core', 'finance', 'academics', 'operations', 'communication']

interface SchoolControlCenterProps {
  tenantId: TenantId
  onBack: () => void
}

export function SchoolControlCenter({ tenantId, onBack }: SchoolControlCenterProps) {
  const configs = useTenantStore((s) => s.configs)
  const changeLog = useTenantStore((s) => s.changeLog)
  const setModuleFeature = useTenantStore((s) => s.setModuleFeature)
  const setSubFeature = useTenantStore((s) => s.setSubFeature)
  const setCapability = useTenantStore((s) => s.setCapability)
  const setTenantStatus = useTenantStore((s) => s.setTenantStatus)
  const setExamTemplate = useTenantStore((s) => s.setExamTemplate)
  const resetTenantConfig = useTenantStore((s) => s.resetTenantConfig)

  const tenant = getTenantById(tenantId)
  const config = configs[tenantId] ?? tenant.config
  const entries = changeLog[tenantId] ?? []

  const [confirmReset, setConfirmReset] = useState(false)
  const [capabilityError, setCapabilityError] = useState<string | null>(null)

  const notify = (target: string, value: boolean | string) => {
    const email = getEmailAdapter()
    void email
      .send({
        to: tenant.principalEmail,
        subject: 'Scholario Platform — school configuration updated',
        body: `${target} was updated for ${tenant.name} (value: ${String(value)}). This is a mock platform notification from the adapter seam.`,
        template: 'tenant.feature-changed',
        meta: { tenantId: tenant.id, target, value: String(value) },
      })
      .catch(() => {})
  }

  const onModuleToggle = (key: typeof MODULE_CATALOG[number]['key'], label: string, enabled: boolean) => {
    setModuleFeature(tenantId, key, enabled)
    notify(`module:${key}`, enabled)
    void label
  }

  const openPrincipalView = () => {
    // Mock flow: sign in as this school's principal, make it the active
    // tenant, then reload so every tenant-scoped store re-hydrates.
    useAuth.getState().login('principal')
    switchTenant(tenantId)
  }

  const onSubFeatureToggle = (key: FeatureKey, enabled: boolean) => {
    setSubFeature(tenantId, key, enabled)
    notify(`sub:${key}`, enabled)
  }

  const onCapabilityToggle = (key: typeof CAPABILITY_CATALOG[number]['key'], enabled: boolean) => {
    const result = setCapability(tenantId, key, enabled)
    if (!result.ok) {
      setCapabilityError(result.error ?? 'Capability change rejected by the platform.')
      return
    }
    setCapabilityError(null)
    notify(`cap:${key}`, enabled)
  }

  const feeSubs = SUB_FEATURE_CATALOG.filter((f) => f.parent === 'fees')
  const examSubs = SUB_FEATURE_CATALOG.filter((f) => f.parent === 'examinations')
  const payrollSubs = SUB_FEATURE_CATALOG.filter((f) => f.parent === 'payroll')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Back to all schools"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All Schools
        </button>
      </div>

      {/* School overview block */}
      <Panel bodyClassName="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <TenantInitialsTile initials={tenant.initials} size="lg" />
          <div className="min-w-0 flex-1 basis-56">
            <h1 className="font-display text-lg font-bold tracking-tight leading-tight">{tenant.name}</h1>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5 break-all">
              ID {tenant.id} · CODE {tenant.code} · {tenant.city}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <TenantStatusPill status={config.status} />
              <TenantPlanChip plan={config.plan} />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-muted text-muted-foreground ring-1 ring-border">
                <CalendarRange className="h-2.5 w-2.5" aria-hidden /> {tenant.session}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary ring-1 ring-primary/20">
                <GraduationCap className="h-2.5 w-2.5" aria-hidden /> {tenant.principalName}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-1.5 min-w-[190px]">
            <button
              onClick={openPrincipalView}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden /> Open Principal View
            </button>
            <div className="flex items-center gap-1.5">
              <label className="sr-only" htmlFor="tenant-status">School status</label>
              <select
                id="tenant-status"
                value={config.status}
                onChange={(e) => { setTenantStatus(tenantId, e.target.value as typeof config.status); notify('status', e.target.value) }}
                className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
              <button
                onClick={() => setConfirmReset(true)}
                title="Reset to platform defaults"
                aria-label="Reset to platform defaults"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
        {/* Compact stats */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-border/40 pt-3">
          {([
            { label: 'Users', value: tenant.stats.users, icon: <Users className="h-3 w-3" /> },
            { label: 'Students', value: tenant.stats.students, icon: <SchoolIcon className="h-3 w-3" /> },
            { label: 'Teachers', value: tenant.stats.teachers, icon: <GraduationCap className="h-3 w-3" /> },
            { label: 'Classes', value: tenant.stats.classes, icon: <Building2 className="h-3 w-3" /> },
          ] as const).map((s) => (
            <div key={s.label} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
              <span className="text-muted-foreground">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold tabular-nums leading-none">{s.value.toLocaleString('en-IN')}</p>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Feature controls — grouped module toggles */}
      <Panel title="Feature controls" subtitle="Modules this school can use — changes apply to its panels immediately" bodyClassName="p-0">
        <div className="divide-y divide-border/40">
          {GROUP_ORDER.map((group) => {
            const mods = MODULE_CATALOG.filter((m) => m.group === group)
            if (mods.length === 0) return null
            return (
              <div key={group} className="px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {MODULE_GROUP_LABELS[group]}
                </p>
                <div className="grid gap-1.5 md:grid-cols-2">
                  {mods.map((m) => {
                    const enabled = config.features[m.key]
                    return (
                      <div key={m.key} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{m.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate" title={m.description}>{m.description}</p>
                        </div>
                        <ToggleSwitch
                          checked={enabled}
                          onChange={(v) => onModuleToggle(m.key, m.label, v)}
                          label={`Toggle ${m.label}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Sub-features */}
      {(config.features.fees || config.features.examinations || config.features.payroll) && (
        <Panel title="Sub-features" subtitle="Fine-grained availability inside enabled modules" bodyClassName="p-0">
          <div className="divide-y divide-border/40">
            {config.features.fees && (
              <SubFeatureGroup
                title="Fee Management"
                items={feeSubs.map((f) => ({
                  key: f.key,
                  label: f.label,
                  description: f.description,
                  enabled: config.subFeatures[f.key],
                  extra: f.key === 'fee_online_payments' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[9px] bg-muted text-muted-foreground ring-1 ring-border whitespace-nowrap">
                      onlinePayments.{config.subFeatures.fee_online_payments ? 'enabled' : 'disabled'}
                    </span>
                  ) : undefined,
                }))}
                onToggle={(key, v) => onSubFeatureToggle(key, v)}
              />
            )}
            {config.features.examinations && (
              <SubFeatureGroup
                title="Examinations"
                items={examSubs.map((f) => ({
                  key: f.key,
                  label: f.label,
                  description: f.description,
                  enabled: config.subFeatures[f.key],
                }))}
                onToggle={(key, v) => onSubFeatureToggle(key, v)}
              />
            )}
            {config.features.payroll && (
              <SubFeatureGroup
                title="Salary & Payroll"
                items={payrollSubs.map((f) => ({
                  key: f.key,
                  label: f.label,
                  description: f.description,
                  enabled: config.subFeatures[f.key],
                }))}
                onToggle={(key, v) => onSubFeatureToggle(key, v)}
              />
            )}
          </div>
        </Panel>
      )}

      {/* Examination pattern */}
      {config.features.examinations && (
        <Panel title="Examination pattern" subtitle="Default template driving exam fee schedules + exam module defaults" bodyClassName="p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.values(EXAM_TEMPLATES)).map((tpl) => {
              const active = config.examTemplateId === tpl.id
              return (
                <button
                  key={tpl.id}
                  onClick={() => { if (!active) { setExamTemplate(tenantId, tpl.id); notify('examTemplate', tpl.label) } }}
                  aria-pressed={active}
                  className={cn(
                    'text-left rounded-lg border px-3 py-2.5 transition-colors',
                    active ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-border/60 hover:bg-muted/40',
                  )}
                >
                  <p className="text-xs font-semibold">{tpl.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{tpl.description}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/80 mt-1.5">
                    {tpl.entries.map((e) => `${e.examType}${e.plannedInstances > 1 ? ` ×${e.plannedInstances}` : ''}`).join(' · ')}
                  </p>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2.5">
            Fee configuration ≠ exam creation — the pattern tells the Examination module what is configured per class; actual exams (dates, subjects, marks, publication) are produced in the Examination module.
          </p>
        </Panel>
      )}

      {/* School capabilities (Principal) */}
      <Panel title="School capabilities" subtitle="Platform-granted abilities for this school's Principal" bodyClassName="p-0">
        <div className="divide-y divide-border/40">
          {CAPABILITY_CATALOG.map((cap) => {
            const enabled = config.capabilities[cap.key]
            const locked = Boolean(cap.platformReserved)
            return (
              <div key={cap.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    {cap.label}
                    {locked && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-muted text-muted-foreground ring-1 ring-border">
                        <Lock className="h-2.5 w-2.5" aria-hidden /> Platform reserved
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{cap.description}</p>
                </div>
                <ToggleSwitch
                  checked={locked ? false : Boolean(enabled)}
                  disabled={locked}
                  onChange={(v) => onCapabilityToggle(cap.key, v)}
                  label={`Toggle ${cap.label}`}
                />
              </div>
            )
          })}
        </div>
        {capabilityError && (
          <p className="px-3 py-2 text-[11px] text-destructive border-t border-border/40" role="alert">{capabilityError}</p>
        )}
      </Panel>

      {/* Platform change log (this tenant) */}
      <Panel title="Platform change log" subtitle={`${tenant.shortName} · newest first`} bodyClassName="p-0">
        {entries.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs font-semibold text-muted-foreground">No changes for this school yet</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Toggle a module or capability above — it will be audited here.</p>
          </div>
        ) : (
          <ul>
            {entries.map((e, i) => (
              <li key={`${e.at}-${e.target}-${i}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 border-t border-border/40 first:border-t-0">
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums whitespace-nowrap w-32 shrink-0">
                  <History className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                  {formatPlatformTimestamp(e.at)}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[9px] bg-muted text-muted-foreground ring-1 ring-border whitespace-nowrap">
                  {e.target}
                </span>
                <span className="text-xs min-w-0 truncate" title={e.label}>{e.label}</span>
                <span className="ml-auto shrink-0"><PlatformChangeValueChip value={e.value} /></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Reset confirm */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Reset configuration">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmReset(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-card border border-border shadow-xl p-4">
            <h3 className="text-sm font-bold">Reset to platform defaults?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {tenant.name} returns to its factory configuration. School DATA (fees, payroll, transactions) is untouched — only this school's feature configuration resets.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="h-8 px-3 rounded-md text-xs font-medium border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => { resetTenantConfig(tenantId); notify('config', 'reset'); setConfirmReset(false) }}
                className="h-8 px-3 rounded-md text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Local bits ─────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, label, disabled }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        checked ? 'bg-primary' : 'bg-muted-foreground/25',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

function SubFeatureGroup({ title, items, onToggle }: {
  title: string
  items: Array<{ key: FeatureKey; label: string; description: string; enabled: boolean; extra?: React.ReactNode }>
  onToggle: (key: FeatureKey, v: boolean) => void
}) {
  return (
    <div className="px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <div className="grid gap-1.5 md:grid-cols-2">
        {items.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-2.5 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold flex items-center gap-1.5 flex-wrap">
                {f.label}
                {f.extra}
              </p>
              <p className="text-[10px] text-muted-foreground truncate" title={f.description}>{f.description}</p>
            </div>
            <ToggleSwitch checked={f.enabled} onChange={(v) => onToggle(f.key, v)} label={`Toggle ${f.label}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
