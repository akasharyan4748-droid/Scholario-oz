/**
 * Demo TENANTS (SaaS-STAGE-2A) — three clearly different mock schools.
 *
 * Each tenant is FULLY ISOLATED: its own id, identity, config, exam pattern,
 * fee profile and (via tenant-scoped persistence) its own data. The demo
 * school ("Demo School of Scholario") is the DEFAULT tenant so the existing
 * verified Principal experience is untouched on first login.
 *
 * Configurations are intentionally different (isolation test matrix):
 *
 *   SCHOOL A  Demo School of Scholario      → everything ON, Pattern A exams
 *   SCHOOL B  Scholario Public School       → structures read-only, no gateway, Pattern B exams
 *   SCHOOL C  St. Xavier's Academy          → editing ON, catalogue restricted, no gateway, payroll ON, trial
 */

import type {
  FeatureKey,
  ModuleKey,
  SchoolTenant,
  TenantConfig,
} from './types'
import { CAPABILITY_CATALOG, MODULE_CATALOG, SUB_FEATURE_CATALOG } from './registry'

export const DEFAULT_TENANT_ID = 't-dsg-gur-01'

// ─── Config factories ───────────────────────────────────────────────────

function allModulesOn(): Record<ModuleKey, boolean> {
  const out = {} as Record<ModuleKey, boolean>
  for (const m of MODULE_CATALOG) out[m.key] = true
  return out
}

function allSubFeaturesOn(): Record<FeatureKey, boolean> {
  const out = {} as Record<FeatureKey, boolean>
  for (const f of SUB_FEATURE_CATALOG) out[f.key] = true
  return out
}

function defaultCapabilities(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const c of CAPABILITY_CATALOG) {
    // fee_structure_delete is platform-reserved — never granted to schools.
    out[c.key] = !c.platformReserved
  }
  return out
}

function baseConfig(): TenantConfig {
  return {
    status: 'active',
    plan: 'growth',
    features: allModulesOn(),
    subFeatures: allSubFeaturesOn(),
    capabilities: defaultCapabilities() as TenantConfig['capabilities'],
    examTemplateId: 'ut4-hy-annual',
    archiveRetentionDays: 30,
  }
}

/** Produce a config by applying partial overrides to the full-on baseline. */
function configWith(overrides: {
  features?: Partial<Record<ModuleKey, boolean>>
  subFeatures?: Partial<Record<FeatureKey, boolean>>
  capabilities?: Partial<Record<string, boolean>>
  status?: TenantConfig['status']
  plan?: TenantConfig['plan']
  examTemplateId?: TenantConfig['examTemplateId']
}): TenantConfig {
  const base = baseConfig()
  return {
    ...base,
    status: overrides.status ?? base.status,
    plan: overrides.plan ?? base.plan,
    features: { ...base.features, ...(overrides.features ?? {}) },
    subFeatures: { ...base.subFeatures, ...(overrides.subFeatures ?? {}) },
    capabilities: { ...base.capabilities, ...(overrides.capabilities ?? {}) },
    examTemplateId: overrides.examTemplateId ?? base.examTemplateId,
  }
}

// ─── The three demo tenants ─────────────────────────────────────────────

export const TENANTS: SchoolTenant[] = [
  {
    id: DEFAULT_TENANT_ID,
    code: 'DSG-001',
    name: 'Demo School of Scholario',
    shortName: 'Demo School',
    city: 'Gurugram, NCR',
    initials: 'DS',
    session: '2026-2027',
    principalName: 'Dr. Ananya Iyer',
    principalEmail: 'principal@demoschool.edu',
    established: 2020,
    vicePrincipalName: 'Mr. Suresh Nair',
    stats: { students: 1842, teachers: 96, classes: 12, users: 2010 },
    feeProfile: { scale: 1, examTemplateId: 'ut4-hy-annual' },
    config: configWith({ plan: 'enterprise' }),
  },
  {
    id: 't-sps-del-02',
    code: 'SPS-002',
    name: 'Scholario Public School',
    shortName: 'SPS Delhi',
    city: 'Delhi',
    initials: 'SP',
    session: '2026-2027',
    principalName: 'Mrs. Kavitha Raghavan',
    principalEmail: 'principal@spsdelhi.edu',
    established: 1998,
    vicePrincipalName: 'Mr. Harpreet Singh',
    stats: { students: 2264, teachers: 118, classes: 14, users: 2452 },
    feeProfile: { scale: 1.12, examTemplateId: 'quarterly-hy-annual' },
    config: configWith({
      // §24 School B — Fee Management ON, editing/publishing OFF (read-only
      // structures), online payments OFF, examinations ON with Pattern B.
      capabilities: {
        fee_structure_edit: false,
        fee_structure_publish: false,
        fee_structure_archive: false,
      },
      subFeatures: { fee_online_payments: false },
      examTemplateId: 'quarterly-hy-annual',
      plan: 'growth',
    }),
  },
  {
    id: 't-sxa-mum-03',
    code: 'SXA-003',
    name: "St. Xavier's Academy",
    shortName: "St. Xavier's",
    city: 'Mumbai',
    initials: 'SX',
    session: '2026-2027',
    principalName: 'Fr. Jerome D Souza',
    principalEmail: 'principal@stxavier.edu',
    established: 1962,
    vicePrincipalName: 'Ms. Anita Fernandes',
    stats: { students: 1487, teachers: 84, classes: 10, users: 1620 },
    feeProfile: { scale: 0.92, examTemplateId: 'ut4-hy-annual' },
    config: configWith({
      // §24 School C — different combination: editing ON, catalogue
      // management RESTRICTED, online payments OFF, payroll ON, exams ON;
      // transport + inventory disabled at module level; on trial plan.
      capabilities: { fee_catalogue_manage: false },
      subFeatures: { fee_online_payments: false },
      features: { transport: false, inventory: false },
      status: 'trial',
      plan: 'starter',
    }),
  },
]

export function getTenantById(id: string | null | undefined): SchoolTenant {
  return TENANTS.find((t) => t.id === id) ?? TENANTS[0]
}
