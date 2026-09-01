import type { StateCreator } from 'zustand'
import type { SchoolSettingsState } from '../types'

export const createProfileSlice: StateCreator<
  SchoolSettingsState,
  [],
  [],
  Pick<
    SchoolSettingsState,
    | 'updateGeneral'
    | 'updateAcademics'
    | 'updateTimetable'
    | 'updateFees'
    | 'updatePayroll'
    | 'updateFacilities'
  >
> = (set) => ({
  updateGeneral: (data) =>
    set((state) => ({ general: { ...state.general, ...data } })),

  updateAcademics: (data) =>
    set((state) => ({ academics: { ...state.academics, ...data } })),

  updateTimetable: (data) =>
    set((state) => ({ timetable: { ...state.timetable, ...data } })),

  updateFees: (data) =>
    set((state) => ({ fees: { ...state.fees, ...data } })),

  updatePayroll: (data) =>
    set((state) => ({ payroll: { ...state.payroll, ...data } })),

  updateFacilities: (data) =>
    set((state) => ({
      facilities: { ...state.facilities, ...data },
    })),
})
