/**
 * permissions — effective permission resolution (SaaS-STAGE-1 preparation).
 *
 * The school UI must NEVER hard-code "who may edit/publish" — it consumes
 * the EFFECTIVE permissions derived from the school's configuration. Today
 * the school configuration itself is mock (Stage 5 wires the Super Admin
 * Feature/Permission management UI to it); the boundary is already the
 * production one:
 *
 *   school configuration (per-school overrides, Stage 5)
 *     → getEffectivePermissions(role, config)
 *       → UI gates (publish/archive/delete buttons disabled with reasons)
 *
 * Keys follow the agreed capability vocabulary:
 *   fee_structure_edit / fee_structure_publish / fee_structure_archive /
 *   fee_structure_delete
 *
 * When publish is disabled for the viewer: drafts can still be edited and
 * saved, the publish action is unavailable, and historical versions remain
 * read-only — enforced in the Fee Structures UI via these flags.
 */

export type CapabilityKey =
  | 'fee_structure_edit'
  | 'fee_structure_publish'
  | 'fee_structure_archive'
  | 'fee_structure_delete'

export type EffectivePermissions = Record<CapabilityKey, boolean>

export type PrincipalRole = 'principal' | 'teacher' | 'student' | 'superadmin'

/** Per-school capability configuration (mock today — Stage 5 makes this
 *  tenant-specific and editable from the Super Admin platform). */
export interface SchoolPermissionConfig {
  capabilities?: Partial<Record<CapabilityKey, boolean>>
}

/** Default school configuration: the Principal holds the full fee-office
 *  capability set (demo-school baseline). */
export const DEFAULT_SCHOOL_PERMISSIONS: SchoolPermissionConfig = {
  capabilities: {
    fee_structure_edit: true,
    fee_structure_publish: true,
    fee_structure_archive: true,
    fee_structure_delete: true,
  },
}

const ROLE_BASE: Record<PrincipalRole, EffectivePermissions> = {
  principal: { fee_structure_edit: true, fee_structure_publish: true, fee_structure_archive: true, fee_structure_delete: true },
  teacher: { fee_structure_edit: false, fee_structure_publish: false, fee_structure_archive: false, fee_structure_delete: false },
  student: { fee_structure_edit: false, fee_structure_publish: false, fee_structure_archive: false, fee_structure_delete: false },
  superadmin: { fee_structure_edit: true, fee_structure_publish: true, fee_structure_archive: true, fee_structure_delete: true },
}

/**
 * Resolve the effective permission set for a role under a school's
 * configuration. School-level overrides WIN over the role baseline
 * (explicit false keeps a capability off even for principals — that is
 * what makes "publish disabled" flows possible).
 */
export function getEffectivePermissions(
  role: PrincipalRole,
  config: SchoolPermissionConfig = DEFAULT_SCHOOL_PERMISSIONS,
): EffectivePermissions {
  const base = ROLE_BASE[role] ?? ROLE_BASE.student
  const caps = config.capabilities ?? {}
  return {
    fee_structure_edit: base.fee_structure_edit && caps.fee_structure_edit !== false,
    fee_structure_publish: base.fee_structure_publish && caps.fee_structure_publish !== false,
    fee_structure_archive: base.fee_structure_archive && caps.fee_structure_archive !== false,
    fee_structure_delete: base.fee_structure_delete && caps.fee_structure_delete !== false,
  }
}
