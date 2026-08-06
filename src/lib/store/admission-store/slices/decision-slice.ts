import type { StateCreator } from 'zustand'
import type { AdmissionStoreState } from '../types'

export const createDecisionSlice: StateCreator<
  AdmissionStoreState,
  [],
  [],
  Pick<
    AdmissionStoreState,
    'approveApplication' | 'requestCorrection' | 'rejectApplication' | 'restoreRejectedApplication'
  >
> = (set, get) => ({
  approveApplication: (appId, remarks) => {
    const state = get()
    const now = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    set({
      applications: state.applications.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: 'Approved',
              decisionBy: 'Admission Officer / Principal',
              decisionDate: now,
              generalRemarks: remarks || app.generalRemarks,
              lastUpdatedDate: now,
              auditTrail: [
                ...app.auditTrail,
                {
                  id: `a-${Date.now()}`,
                  timestamp: `${now} ${nowTime}`,
                  action: 'Approved Application',
                  actor: 'Admission Officer / Principal',
                  notes: remarks || 'All 9 sections verified & approved for enrollment',
                },
              ],
            }
          : app
      ),
    })
  },

  requestCorrection: (appId, generalRemarks) => {
    const state = get()
    const now = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    set({
      applications: state.applications.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: 'Need Correction',
              generalRemarks,
              lastUpdatedDate: now,
              auditTrail: [
                ...app.auditTrail,
                {
                  id: `a-${Date.now()}`,
                  timestamp: `${now} ${nowTime}`,
                  action: 'Returned for Correction',
                  actor: 'Admission Desk',
                  notes: generalRemarks || 'Flagged specific sections for applicant correction',
                },
              ],
            }
          : app
      ),
    })
  },

  rejectApplication: (appId, reason, retentionDays = 60) => {
    const state = get()
    const now = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    set({
      applications: state.applications.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: 'Rejected',
              decisionReason: reason,
              decisionBy: 'Admission Committee',
              decisionDate: now,
              rejectionRetentionDays: retentionDays,
              rejectedAt: now,
              lastUpdatedDate: now,
              auditTrail: [
                ...app.auditTrail,
                {
                  id: `a-${Date.now()}`,
                  timestamp: `${now} ${nowTime}`,
                  action: 'Application Rejected',
                  actor: 'Admission Committee',
                  notes: `Rejected: ${reason} (Retention: ${retentionDays} days)`,
                },
              ],
            }
          : app
      ),
    })
  },

  restoreRejectedApplication: (appId) => {
    const state = get()
    const now = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    set({
      applications: state.applications.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: 'Under Review',
              rejectedAt: undefined,
              decisionReason: undefined,
              lastUpdatedDate: now,
              auditTrail: [
                ...app.auditTrail,
                {
                  id: `a-${Date.now()}`,
                  timestamp: `${now} ${nowTime}`,
                  action: 'Application Restored',
                  actor: 'Admin / Officer',
                  notes: 'Restored from Rejected Queue back to Under Review',
                },
              ],
            }
          : app
      ),
    })
  },
})
