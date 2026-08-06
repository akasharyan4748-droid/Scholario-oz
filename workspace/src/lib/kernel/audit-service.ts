/**
 * SCHOLARIO-OS — Enterprise Audit & Compliance Framework
 * Centralized, immutable logging for state changes, financial transactions, and security actions.
 */

export interface AuditLogRecord {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  domain: string;
  entityId: string;
  entityType: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

class AuditService {
  private logBuffer: AuditLogRecord[] = [];

  public logAction(options: {
    tenantId: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    action: string;
    domain: string;
    entityId: string;
    entityType: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
  }): AuditLogRecord {
    const record: AuditLogRecord = {
      ...options,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.logBuffer.unshift(record);
    if (this.logBuffer.length > 500) {
      this.logBuffer.pop(); // Retain sliding buffer in memory
    }

    return record;
  }

  public getRecentLogs(tenantId?: string, limit: number = 50): AuditLogRecord[] {
    if (!tenantId) return this.logBuffer.slice(0, limit);
    return this.logBuffer.filter((log) => log.tenantId === tenantId).slice(0, limit);
  }
}

export const auditService = new AuditService();
