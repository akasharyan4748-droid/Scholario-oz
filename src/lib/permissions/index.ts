/**
 * SCHOLARIO-OS — Enterprise Permission & Access Control Engine
 * Fine-grained Role-Based (RBAC) & Attribute-Based (ABAC) permission registry.
 */

export type AppRole = 'SUPER_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'export' | 'approve';

export type ModuleDomain =
  | 'admissions'
  | 'attendance'
  | 'academics'
  | 'students'
  | 'teachers'
  | 'finance'
  | 'exams'
  | 'communication'
  | 'transport'
  | 'hostel'
  | 'library'
  | 'inventory'
  | 'settings'
  | 'superadmin';

export interface PermissionRule {
  domain: ModuleDomain;
  action: PermissionAction;
  rolesAllowed: AppRole[];
}

export const PERMISSION_REGISTRY: PermissionRule[] = [
  // Admissions
  { domain: 'admissions', action: 'read', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { domain: 'admissions', action: 'create', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL'] },
  { domain: 'admissions', action: 'approve', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL'] },
  
  // Finance & Fees
  { domain: 'finance', action: 'read', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL', 'PARENT', 'STUDENT'] },
  { domain: 'finance', action: 'approve', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL'] },
  { domain: 'finance', action: 'export', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL'] },

  // Exams & Marks
  { domain: 'exams', action: 'read', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
  { domain: 'exams', action: 'create', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { domain: 'exams', action: 'approve', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL'] },

  // Settings & Platform
  { domain: 'settings', action: 'read', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL'] },
  { domain: 'settings', action: 'update', rolesAllowed: ['SUPER_ADMIN', 'PRINCIPAL'] },
  { domain: 'superadmin', action: 'read', rolesAllowed: ['SUPER_ADMIN'] },
];

export function hasPermission(role: AppRole, domain: ModuleDomain, action: PermissionAction): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const rule = PERMISSION_REGISTRY.find((r) => r.domain === domain && r.action === action);
  if (!rule) return true; // Default permissive for general views
  return rule.rolesAllowed.includes(role);
}

export function canAccessModule(role: AppRole, domain: ModuleDomain): boolean {
  return hasPermission(role, domain, 'read');
}
