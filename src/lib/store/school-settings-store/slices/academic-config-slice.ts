import type { StateCreator } from 'zustand'
import type { SchoolSettingsState } from '../types'

export const createAcademicConfigSlice: StateCreator<
  SchoolSettingsState,
  [],
  [],
  Pick<
    SchoolSettingsState,
    'addFeeHead' | 'removeFeeHead' | 'addSubject' | 'removeSubject' | 'addClass' | 'removeClass'
  >
> = (set) => ({
  addFeeHead: (feeHead) =>
    set((state) => ({
      fees: {
        ...state.fees,
        feeHeads: [...state.fees.feeHeads, { ...feeHead, id: `fh-${Date.now()}` }],
      },
    })),

  removeFeeHead: (id) =>
    set((state) => ({
      fees: {
        ...state.fees,
        feeHeads: state.fees.feeHeads.filter((f) => f.id !== id),
      },
    })),

  addSubject: (sub) =>
    set((state) => ({
      academics: {
        ...state.academics,
        subjects: [...state.academics.subjects, { ...sub, id: `sub-${Date.now()}` }],
      },
    })),

  removeSubject: (id) =>
    set((state) => ({
      academics: {
        ...state.academics,
        subjects: state.academics.subjects.filter((s) => s.id !== id),
      },
    })),

  addClass: (cls) =>
    set((state) => ({
      academics: {
        ...state.academics,
        classes: [...state.academics.classes, { ...cls, id: `cls-${Date.now()}` }],
      },
    })),

  removeClass: (id) =>
    set((state) => ({
      academics: {
        ...state.academics,
        classes: state.academics.classes.filter((c) => c.id !== id),
      },
    })),
})
