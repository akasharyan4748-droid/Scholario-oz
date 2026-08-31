'use client'

/**
 * Tenant control store (SaaS-STAGE-2A) — the SINGLE source of truth for
 * the active mock school and every school's configuration.
 *
 * Architecture:
 *   - Persisted GLOBALLY (not tenant-scoped): the active-tenant pointer and
 *     all tenants' configs are platform data, not school data.
 *   - Configs are seeded from schools.ts and stored PER TENANT — changing
 *     School A never mutates School B (the isolation guarantee the E2E
 *     suite proves).
 *   - Every mutation appends to that tenant's change log (visible in the
 *     School Control Center as the platform audit trail).
 *   - Tenant switching reloads the app so all tenant-scoped stores
 *     re-hydrate from the target school's namespace (see tenant-storage.ts).
 *
 * Consumers:
 *   - Super Admin control plane (School Control Center toggles).
 *   - School panels via the hooks below (useFeatureGate etc.) — components
 *     NEVER hardcode school ids.
 *   - fee-store actions, which enforce capabilities via
 *     getActiveTenantConfigSync().
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  CapabilityKey,
  FeatureKey,
  ModuleKey,
  SchoolTenant,
  TenantChangeEntry,
  TenantConfig,
  TenantId,
  TenantStatus,
} from './types'
import { DEFAULT_TENANT_ID, TENANTS } from './schools'
import { ACTIVE_TENANT_STORAGE_KEY } from './active-tenant'
import { CAPABILITY_CATALOG, MODULE_CATALOG, SUB_FEATURE_CATALOG } from './registry'
import { getEffectivePermissions, type EffectivePermissions } from '@/lib/permissions'

interface TenantState {
  activeTenantId: TenantId
  /** Live config per tenant — keyed, isolated. */
  configs: Record<TenantId, TenantConfig>
  /** Platform audit per tenant (last N entries, newest first). */
  changeLog: Record<TenantId, TenantChangeEntry[]>

  setActiveTenant: (id: TenantId) => void
  setModuleFeature: (tenantId: TenantId, key: ModuleKey, enabled: boolean) => void
  setSubFeature: (tenantId: TenantId, key: FeatureKey, enabled: boolean) => void
  setCapability: (tenantId: TenantId, key: CapabilityKey, enabled: boolean) => { ok: boolean; error?: string }
  setTenantStatus: (tenantId: TenantId, status: TenantStatus) => void
  setExamTemplate: (tenantId: TenantId, templateId: TenantConfig['examTemplateId']) => void
  resetTenantConfig: (tenantId: TenantId) => void
}

const CHANGE_LOG_LIMIT = 12

const MODULE_LABELS: Record<string, string> = Object.fromEntries(MODULE_CATALOG.map((m) => [m.key, m.label]))
const SUB_FEATURE_LABELS: Record<string, string> = Object.fromEntries(SUB_FEATURE_CATALOG.map((f) => [f.key, f.label]))
const CAPABILITY_LABELS: Record<string, string> = Object.fromEntries(CAPABILITY_CATALOG.map((c) => [c.key, c.label]))

function seedConfigs(): Record<TenantId, TenantConfig> {
  const out: Record<TenantId, TenantConfig> = {}
  for (const t of TENANTS) out[t.id] = structuredClone(t.config)
  return out
}

function pushChange(
  log: Record<TenantId, TenantChangeEntry[]> | undefined,
  tenantId: TenantId,
  entry: Omit<TenantChangeEntry, 'at' | 'actor'>,
): Record<TenantId, TenantChangeEntry[]> {
  const current = log ?? {}
  const list = current[tenantId] ?? []
  return {
    ...current,
    [tenantId]: [{ at: new Date().toISOString(), actor: 'superadmin' as const, ...entry }, ...list].slice(0, CHANGE_LOG_LIMIT),
  }
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantId: DEFAULT_TENANT_ID,
      configs: seedConfigs(),
      changeLog: {},

      setActiveTenant: (id) => set({ activeTenantId: id }),

      setModuleFeature: (tenantId, key, enabled) =>
        set((s) => {
          const cfg = s.configs[tenantId]
          if (!cfg) return s
          return {
            configs: { ...s.configs, [tenantId]: { ...cfg, features: { ...cfg.features, [key]: enabled } } },
            changeLog: pushChange(s.changeLog, tenantId, {
              target: `module:${key}`,
              label: MODULE_LABELS[key] ?? key,
              value: enabled,
            }),
          }
        }),

      setSubFeature: (tenantId, key, enabled) =>
        set((s) => {
          const cfg = s.configs[tenantId]
          if (!cfg) return s
          return {
            configs: { ...s.configs, [tenantId]: { ...cfg, subFeatures: { ...cfg.subFeatures, [key]: enabled } } },
            changeLog: pushChange(s.changeLog, tenantId, {
              target: `sub:${key}`,
              label: SUB_FEATURE_LABELS[key] ?? key,
              value: enabled,
            }),
          }
        }),

      setCapability: (tenantId, key, enabled) => {
        // PLATFORM GUARD — the delete capability is reserved for the
        // platform (retention expiry / future Super Admin tooling). No
        // school-side toggle can ever grant it, so principals can never
        // permanently delete fee structures.
        if (key === 'fee_structure_delete') {
          return { ok: false, error: 'Permanent delete is platform-reserved. Schools archive; the platform purges after retention.' }
        }
        set((s) => {
          const cfg = s.configs[tenantId]
          if (!cfg) return s
          return {
            configs: { ...s.configs, [tenantId]: { ...cfg, capabilities: { ...cfg.capabilities, [key]: enabled } } },
            changeLog: pushChange(s.changeLog, tenantId, {
              target: `cap:${key}`,
              label: CAPABILITY_LABELS[key] ?? key,
              value: enabled,
            }),
          }
        })
        return { ok: true }
      },

      setTenantStatus: (tenantId, status) =>
        set((s) => {
          const cfg = s.configs[tenantId]
          if (!cfg) return s
          return {
            configs: { ...s.configs, [tenantId]: { ...cfg, status } },
            changeLog: pushChange(s.changeLog, tenantId, { target: 'status', label: 'School status', value: status }),
          }
        }),

      setExamTemplate: (tenantId, templateId) =>
        set((s) => {
          const cfg = s.configs[tenantId]
          if (!cfg) return s
          return {
            configs: { ...s.configs, [tenantId]: { ...cfg, examTemplateId: templateId } },
            changeLog: pushChange(s.changeLog, tenantId, {
              target: 'examTemplate',
              label: 'Examination pattern',
              value: templateId === 'ut4-hy-annual' ? '4 Unit Tests + Half-Yearly + Annual' : 'Quarterly + Half-Yearly + Annual',
            }),
          }
        }),

      resetTenantConfig: (tenantId) =>
        set((s) => {
          const tenant = TENANTS.find((t) => t.id === tenantId)
          if (!tenant) return s
          return {
            configs: { ...s.configs, [tenantId]: structuredClone(tenant.config) },
            changeLog: pushChange(s.changeLog, tenantId, {
              target: 'config',
              label: 'Configuration reset to platform defaults',
              value: 'reset',
            }),
          }
        }),
    }),
    {
      name: ACTIVE_TENANT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeTenantId: s.activeTenantId, configs: s.configs, changeLog: s.changeLog }),
      /**
       * Rehydrate merge — persisted per-tenant configs are merged OVER the
       * seeded defaults KEY-BY-KEY for the maps (features / subFeatures /
       * capabilities), never wholesale. This is what makes adding a new
       * catalog key (e.g. the fee_entry_policy_manage capability) safe for
       * browsers with older persisted state: keys the persisted config
       * doesn't know about fall back to the platform seed (the catalog
       * default), while every key it DOES know about keeps its persisted
       * value. Without this, a new capability would read as `undefined` in
       * the School Control Center toggle and `!== false` in permission
       * resolution — two different truths for the same flag.
       */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TenantState>
        const seeded = seedConfigs()
        const configs: Record<TenantId, TenantConfig> = { ...current.configs }
        const persistedConfigs = (p.configs ?? {}) as Record<TenantId, TenantConfig>
        for (const id of Object.keys(persistedConfigs)) {
          const pc = persistedConfigs[id]
          if (!pc) continue
          const base = configs[id] ?? seeded[id]
          if (!base) continue
          configs[id] = {
            ...base,
            ...pc,
            features: { ...base.features, ...(pc.features ?? {}) },
            subFeatures: { ...base.subFeatures, ...(pc.subFeatures ?? {}) },
            capabilities: { ...base.capabilities, ...(pc.capabilities ?? {}) },
          }
        }
        return {
          ...current,
          activeTenantId: p.activeTenantId ?? current.activeTenantId,
          configs,
          changeLog: p.changeLog ?? current.changeLog,
        }
      },
    }
  )
)

// ─── Synchronous accessors for non-hook contexts (store actions, seeds) ──

export function getActiveTenantId(): TenantId {
  return useTenantStore.getState().activeTenantId ?? DEFAULT_TENANT_ID
}

export function getActiveTenantConfigSync(): TenantConfig {
  const s = useTenantStore.getState()
  return s.configs[s.activeTenantId] ?? TENANTS.find((t) => t.id === s.activeTenantId)?.config ?? TENANTS[0].config
}

export function getTenantConfigSync(tenantId: TenantId): TenantConfig | undefined {
  return useTenantStore.getState().configs[tenantId]
}

/** Effective school-role permissions under the ACTIVE tenant's config. */
export function getActiveTenantPermissionsSync(): EffectivePermissions {
  return getEffectivePermissions('principal', getActiveTenantConfigSync())
}

/**
 * Switch the active mock tenant and reload. Reloading is REQUIRED (not a
 * shortcut): every tenant-scoped store must re-hydrate from the target
 * school's namespace with seed fallback — this is what makes cross-tenant
 * data leaks structurally impossible.
 */
export function switchTenant(id: TenantId): void {
  const s = useTenantStore.getState()
  if (s.activeTenantId === id) return
  s.setActiveTenant(id)
  if (typeof window !== 'undefined') {
    // Let the persist write flush before the reload.
    window.setTimeout(() => window.location.reload(), 30)
  }
}

// ─── Hooks (single gated reads for panels) ──────────────────────────────

export function useActiveTenant(): SchoolTenant {
  const activeTenantId = useTenantStore((s) => s.activeTenantId)
  const configs = useTenantStore((s) => s.configs)
  const tenant = TENANTS.find((t) => t.id === activeTenantId) ?? TENANTS[0]
  return { ...tenant, config: configs[tenant.id] ?? tenant.config }
}

export function useActiveTenantConfig(): TenantConfig {
  const activeTenantId = useTenantStore((s) => s.activeTenantId)
  const configs = useTenantStore((s) => s.configs)
  const tenant = TENANTS.find((t) => t.id === activeTenantId) ?? TENANTS[0]
  return configs[activeTenantId] ?? tenant.config
}

export interface FeatureGate {
  isModuleEnabled: (key: ModuleKey) => boolean
  isSubFeatureEnabled: (key: FeatureKey) => boolean
  config: TenantConfig
}

/** One gated read for panels — the ONLY way components consult flags. */
export function useFeatureGate(): FeatureGate {
  const config = useActiveTenantConfig()
  return {
    config,
    isModuleEnabled: (key) => config.features[key] === true,
    isSubFeatureEnabled: (key) => config.subFeatures[key] === true,
  }
}

/** Effective fee capabilities for the signed-in principal under this tenant. */
export function useEffectiveFeeCapabilities(): EffectivePermissions {
  const config = useActiveTenantConfig()
  return getEffectivePermissions('principal', config)
}
