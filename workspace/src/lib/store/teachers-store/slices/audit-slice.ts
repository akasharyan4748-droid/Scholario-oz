import type { StateCreator } from 'zustand'
import type { AuditLogItem, TeachersStoreState } from '../types'
import { INITIAL_AUDIT_LOGS } from '../seed-data'

export const createAuditSlice: StateCreator<
  TeachersStoreState,
  [],
  [],
  Pick<TeachersStoreState, 'auditLogs' | 'logAudit'>
> = (set) => ({
  auditLogs: INITIAL_AUDIT_LOGS,

  logAudit: (log) => {
    const newLogItem: AuditLogItem = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    }
    set((state) => ({ auditLogs: [newLogItem, ...state.auditLogs] }))
  },
})
