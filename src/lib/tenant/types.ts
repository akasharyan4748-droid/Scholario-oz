/**
 * Scholario TENANT MODEL (SaaS-STAGE-2A).
 *
 * ONE SCHOLARIO PLATFORM
 *         ↓
 * MANY SCHOOLS (tenants)
 *         ↓
 * EACH SCHOOL HAS ITS OWN
 *   data · users · config · features · permissions
 *
 * This module defines the canonical types. The three demo tenants live in
 * `schools.ts`; the live runtime state (active tenant + per-tenant config
 * overrides + change log) lives in `store.ts`. Per-tenant DATA isolation is
 * provided by `tenant-storage.ts`, which namespaces the persisted zustand
 * stores by tenant id (`feeStore(tenantId)` semantics — no store clones).
 *
 * The model mirrors the Prisma schema relationships so the mock layer maps
 * 1:1 onto the future Supabase/Postgres implementation:
 *
 *   Tenant (School row in Prisma)
 *     ├─ config: TenantConfig (modules / sub-features / capabilities)
 *     ├─ identity: name, code, city, session, principal, stats
 *     ├─ users → User rows (role + schoolId)          [Stage 3]
 *     ├─ classes / students / teachers                [platform master + tenant data]
 *     ├─ fee catalogue usage → school-settings feeHeads (tenant-scoped)
 *     ├─ fee structures + versions → fee-store (tenant-scoped)
 *     ├─ transactions → fee-store (tenant-scoped)
 *     ├─ payroll → salary-store (tenant-scoped)
 *     ├─ examination config → exam template + fee-store examFeeSchedule
 *     └─ payment config → subFeatures.fee_online_payments (gateway capability)
 */

export type TenantId = string

export type TenantStatus = 'active' | 'trial' | 'suspended'

/** Commercial plan label (display + future billing; no billing engine yet). */
export type TenantPlan = 'starter' | 'growth' | 'enterprise'

/**
 * Platform MODULES a school can be granted or denied. A disabled module is
 * hidden from the school's panels (single choke point: each panel maps its
 * nav keys through MODULE_KEY_BY_NAV — never scattered conditionals).
 */
export type ModuleKey =
  | 'admissions'
  | 'students'
  | 'teachers'
  | 'attendance'
  | 'timetable'
  | 'examinations'
  | 'fees'
  | 'payroll'
  | 'finance'
  | 'communication'
  | 'messages'
  | 'calendar'
  | 'library'
  | 'transport'
  | 'inventory'
  | 'certificates'
  | 'downloads'

/**
 * SUB-FEATURES — fine-grained availability inside an enabled module.
 * Grouped by their parent module; see SUB_FEATURE_CATALOG in registry.ts.
 */
export type FeatureKey =
  // Fee Management
  | 'fee_structures'
  | 'fee_catalogue'
  | 'fee_collect'
  | 'fee_online_payments' // = school-level onlinePayments.enabled
  | 'fee_transactions'
  | 'receipt_templates'
  // Examinations
  | 'exam_create'
  | 'exam_edit_draft'
  | 'exam_publish'
  | 'exam_modify_published'
  // Salary & Payroll
  | 'payroll_structures'
  | 'payroll_run'
  | 'payroll_payments'

/**
 * School CAPABILITIES the platform grants to school roles (currently the
 * Principal). Super Admin → school capability → Principal. Enforced BOTH
 * in the UI (gated controls) AND in the store actions (see fee-store.ts
 * permission guards) so the client cannot bypass them.
 *
 * fee_structure_delete is PLATFORM-RESERVED: principals NEVER permanently
 * delete fee structures. It exists in the model so the Super Admin layer
 * and the retention/purge boundary can reference it, but no school-side
 * configuration can ever enable it for a school role.
 */
export type CapabilityKey =
  | 'fee_structure_edit'
  | 'fee_structure_publish'
  | 'fee_structure_archive'
  | 'fee_structure_delete'
  | 'fee_catalogue_manage'
  | 'fee_entry_policy_manage'

/** Which default examination pattern the school follows (see EXAM_TEMPLATES). */
export type ExamTemplateId = 'ut4-hy-annual' | 'quarterly-hy-annual'

/**
 * Per-tenant runtime configuration. Every tenant carries its OWN instance —
 * changing School A's config NEVER mutates School B's.
 */
export interface TenantConfig {
  status: TenantStatus
  plan: TenantPlan
  /** Module availability (visibility of whole modules in school panels). */
  features: Record<ModuleKey, boolean>
  /** Sub-feature availability inside enabled modules. */
  subFeatures: Record<FeatureKey, boolean>
  /** School-role capabilities (see CapabilityKey). delete stays false. */
  capabilities: Record<CapabilityKey, boolean>
  /** Default examination pattern for this school (fee schedules + exam module defaults). */
  examTemplateId: ExamTemplateId
  /**
   * Archive retention window (days) before platform-side auto purge.
   * Centralized logic in archive-retention.ts; the purge itself is a
   * FUTURE SERVER JOB — never a client timer.
   */
  archiveRetentionDays: number
}

/** Static identity for a demo tenant (display + seeding). */
export interface TenantIdentity {
  id: TenantId
  code: string
  name: string
  shortName: string
  city: string
  initials: string
  /** Active academic session for this school ('2026-2027' convention). */
  session: string
  principalName: string
  principalEmail: string
  /** School-profile seed fields (school-settings `general`). */
  established: number
  vicePrincipalName: string
  /** Compact demo stats for the Schools screen (not live counts). */
  stats: { students: number; teachers: number; classes: number; users: number }
  /**
   * Per-school FEE PROFILE consumed by the tenant-aware seed factory:
   * scales amounts and selects the exam pattern so each school's data is
   * visibly different without duplicating any store.
   */
  feeProfile: {
    /** Amount scale applied to seed structures + seed transactions. */
    scale: number
    examTemplateId: ExamTemplateId
  }
}

export interface SchoolTenant extends TenantIdentity {
  /** Factory-default config; the live config lives in the tenant store. */
  config: TenantConfig
}

/** Audit entry appended (per tenant) whenever Super Admin changes its config. */
export interface TenantChangeEntry {
  at: string
  actor: 'superadmin'
  /** e.g. 'module:fees' | 'sub:fee_online_payments' | 'cap:fee_structure_publish' | 'examTemplate' | 'status' */
  target: string
  label: string
  value: boolean | string
}

/** Convenience predicate — the canonical onlinePayments.enabled read. */
export function onlinePaymentsEnabled(config: TenantConfig): boolean {
  return config.subFeatures.fee_online_payments === true
}
