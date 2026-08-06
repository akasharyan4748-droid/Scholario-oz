import type { StateCreator } from 'zustand'
import type { AdmissionApplication, AdmissionStoreState } from '../types'
import { defaultInitialFeeData, defaultInitialFormData, defaultSectionReviews } from '../defaults'

export const createDraftSlice: StateCreator<
  AdmissionStoreState,
  [],
  [],
  Pick<AdmissionStoreState, 'createOrUpdateDraft'>
> = (set, get) => ({
  createOrUpdateDraft: (formDataInput, feeDataInput, appId) => {
    const state = get()
    const targetId = appId || state.selectedApplicationId || `APP-${Date.now().toString().slice(-6)}`
    const existing = state.applications.find((a) => a.id === targetId)
    const now = new Date().toISOString().split('T')[0]

    const mergedFormData = {
      ...defaultInitialFormData,
      ...(existing ? existing.formData : {}),
      ...formDataInput,
    }

    const mergedFeeData = {
      ...defaultInitialFeeData,
      ...(existing ? existing.feeData : {}),
      ...(feeDataInput || {}),
    }

    const applicantName = `${mergedFormData.firstName} ${mergedFormData.lastName}`.trim() || 'Untitled Applicant'

    if (existing) {
      const updatedApps = state.applications.map((app) =>
        app.id === targetId
          ? {
              ...app,
              applicantName,
              className: mergedFormData.className || app.className,
              section: mergedFormData.section || app.section,
              formData: mergedFormData,
              feeData: mergedFeeData,
              lastUpdatedDate: now,
              auditTrail: [
                ...app.auditTrail,
                {
                  id: `a-${Date.now()}`,
                  timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                  action: 'Draft Updated',
                  actor: 'Applicant / Admin',
                  notes: 'Form data saved in draft state',
                },
              ],
            }
          : app
      )
      set({ applications: updatedApps })
      return targetId
    } else {
      const newApp: AdmissionApplication = {
        id: targetId,
        admissionNo: `ADM-DRAFT-${Math.floor(Math.random() * 900 + 100)}`,
        studentId: `STU-DRAFT-${Math.floor(Math.random() * 900 + 100)}`,
        rollNo: '—',
        regNo: '—',
        applicantName,
        className: mergedFormData.className || 'Class 2',
        section: mergedFormData.section || 'A',
        academicSession: '2025–2026',
        submittedDate: now,
        lastUpdatedDate: now,
        status: 'Draft',
        formData: mergedFormData,
        feeData: mergedFeeData,
        sectionReviews: defaultSectionReviews(),
        auditTrail: [
          {
            id: `a-${Date.now()}`,
            timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            action: 'Draft Created',
            actor: 'Applicant / Admin',
            notes: 'New admission application draft initialized',
          },
        ],
      }
      set({ applications: [newApp, ...state.applications], selectedApplicationId: targetId })
      return targetId
    }
  },
})
