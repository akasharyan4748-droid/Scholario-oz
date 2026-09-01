import type { StateCreator } from 'zustand'
import type { AdmissionStoreState } from '../types'

export const createReviewSlice: StateCreator<
  AdmissionStoreState,
  [],
  [],
  Pick<AdmissionStoreState, 'submitApplication' | 'updateSectionReview'>
> = (set, get) => ({
  submitApplication: (id) => {
    const state = get()
    const now = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    set({
      applications: state.applications.map((app) =>
        app.id === id
          ? {
              ...app,
              status: 'Submitted',
              submittedDate: now,
              lastUpdatedDate: now,
              auditTrail: [
                ...app.auditTrail,
                {
                  id: `a-${Date.now()}`,
                  timestamp: `${now} ${nowTime}`,
                  action: 'Submitted Application',
                  actor: 'Applicant / Admin',
                  notes: 'Application submitted into Admissions Verification Queue',
                },
              ],
            }
          : app
      ),
    })
  },

  updateSectionReview: (appId, sectionKey, reviewState) => {
    const state = get()
    const now = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    set({
      applications: state.applications.map((app) => {
        if (app.id !== appId) return app
        const existingSection = app.sectionReviews[sectionKey] || { status: 'Complete', remarks: '' }
        const updatedSections = {
          ...app.sectionReviews,
          [sectionKey]: {
            ...existingSection,
            ...reviewState,
            reviewedBy: 'Admission Officer',
            reviewedAt: `${now} ${nowTime}`,
          },
        }
        return {
          ...app,
          sectionReviews: updatedSections,
          lastUpdatedDate: now,
        }
      }),
    })
  },
})
