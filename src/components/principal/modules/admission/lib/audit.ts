/**
 * Audit logging helper.
 */

/* ---------- Audit logging helper ---------- */
export interface AuditAction {
  user: string
  role: string
  action: string
  entity: string
  entityId: string
  previousValue?: string
  newValue?: string
  notes?: string
  ip?: string
}

/**
 * Builds an audit entry compatible with AdmissionApplication.auditTrail.
 * In production this would POST to /api/audit; here we return the entry
 * for the store to append.
 */
export function buildAuditEntry(a: AuditAction) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    action: a.action,
    actor: `${a.user} (${a.role})`,
    notes: [
      a.notes || '',
      a.previousValue ? `From: ${a.previousValue}` : '',
      a.newValue ? `To: ${a.newValue}` : '',
    ].filter(Boolean).join(' · '),
  }
}
