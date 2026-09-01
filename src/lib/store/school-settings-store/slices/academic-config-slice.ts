import type { StateCreator } from 'zustand'
import type { SchoolSettingsState } from '../types'
// SaaS-STAGE-2A — catalogue CRUD is a school GRANT (fee_catalogue_manage).
// The Super Admin can restrict it per school (School C ships restricted);
// the store enforces the grant — the UI gates are convenience, these
// no-op guards are the law (client cannot bypass them).
import { getActiveTenantPermissionsSync } from '@/lib/tenant/store'

export const createAcademicConfigSlice: StateCreator<
  SchoolSettingsState,
  [],
  [],
  Pick<
    SchoolSettingsState,
    'addFeeHead' | 'updateFeeHead' | 'archiveFeeHead' | 'restoreFeeHead' | 'removeFeeHead' | 'addSubject' | 'removeSubject' | 'addClass' | 'removeClass'
  >
> = (set) => ({
  addFeeHead: (feeHead) => {
    if (!getActiveTenantPermissionsSync().fee_catalogue_manage) return
    set((state) => ({
      fees: {
        ...state.fees,
        feeHeads: [...state.fees.feeHeads, { ...feeHead, id: `fh-${Date.now()}` }],
      },
    }))
  },

  // PHASE 5 — updateFeeHead: patch an existing master catalogue entry.
  // Used by the Master Catalogue drawer's inline edit form (name, type,
  // defaultAmount, frequency, description, isTaxable, taxRate,
  // gstHsnCode). Does NOT touch `archived` (use archiveFeeHead /
  // restoreFeeHead for that) and does NOT migrate the change into
  // existing per-class fee structures (versioning integrity preserved —
  // existing structures keep their snapshot; new structures picking this
  // head get the new defaults).
  updateFeeHead: (id, patch) => {
    if (!getActiveTenantPermissionsSync().fee_catalogue_manage) return
    set((state) => ({
      fees: {
        ...state.fees,
        feeHeads: state.fees.feeHeads.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      },
    }))
  },

  // PHASE 5 — archiveFeeHead: hide from the "pick from catalogue" picker.
  // Existing structures keep their snapshot; the head still renders in
  // their components list. Idempotent (re-archiving an archived head is
  // a no-op).
  archiveFeeHead: (id) => {
    if (!getActiveTenantPermissionsSync().fee_catalogue_manage) return
    set((state) => ({
      fees: {
        ...state.fees,
        feeHeads: state.fees.feeHeads.map((f) =>
          f.id === id ? { ...f, archived: true } : f,
        ),
      },
    }))
  },

  // PHASE 5 — restoreFeeHead: un-archive. Idempotent.
  restoreFeeHead: (id) => {
    if (!getActiveTenantPermissionsSync().fee_catalogue_manage) return
    set((state) => ({
      fees: {
        ...state.fees,
        feeHeads: state.fees.feeHeads.map((f) =>
          f.id === id ? { ...f, archived: false } : f,
        ),
      },
    }))
  },

  removeFeeHead: (id) => {
    if (!getActiveTenantPermissionsSync().fee_catalogue_manage) return
    set((state) => ({
      fees: {
        ...state.fees,
        feeHeads: state.fees.feeHeads.filter((f) => f.id !== id),
      },
    }))
  },

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
