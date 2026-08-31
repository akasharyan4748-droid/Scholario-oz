import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SchoolSettingsState } from './types'
import { initialState } from './initial-state'
import { createProfileSlice } from './slices/profile-slice'
import { createInventorySlice } from './slices/inventory-slice'
import { createAcademicConfigSlice } from './slices/academic-config-slice'
import { createAdmissionSlice } from './slices/admission-slice'

export const useSchoolSettingsStore = create<SchoolSettingsState>()(
  persist(
    (...a) => ({
      ...initialState,
      ...createProfileSlice(...a),
      ...createInventorySlice(...a),
      ...createAcademicConfigSlice(...a),
      ...createAdmissionSlice(...a),
    }),
    {
      name: 'scholario_school_settings_v1',
      // PHASE 5 — bumped to v2 to merge in the enriched master fee-head
      // catalogue (added fh-7..fh-12 Transport/Board/Development/Smart
      // Class/Sports/Medical + description/effectiveFrom on existing
      // entries). Pre-v2 persisted state had only fh-1..fh-6 with the
      // old narrow type set; the migrate function appends the new
      // entries and patches the existing ones' names/types to match
      // the new seed WITHOUT losing any user-edited catalogue entries
      // they may have added on top.
      version: 4,
      migrate: (persistedState: any, fromVersion: number) => {
        // ─── v4 — ACTIVE SESSION REALIGNMENT (SaaS-STAGE-1) ────────────
        // The active session must agree with the live fee dataset
        // ('2026-2027'). Old persisted state carried the stale
        // '2025–2026' value; patch it forward (keeps any later value
        // the user already moved to).
        if (fromVersion < 4 && persistedState?.academics) {
          if (persistedState.academics.currentSession === '2025–2026' || persistedState.academics.currentSession === '2025-2026') {
            persistedState.academics.currentSession = initialState.academics.currentSession
          }
        }
        if (fromVersion < 2 && persistedState?.fees?.feeHeads) {
          const seeded = new Map<string, any>(initialState.fees.feeHeads.map((f) => [f.id, f]))
          // Merge: keep user-added heads (id not in seed), patch seeded
          // heads with the v2 fields (name/type/defaultAmount/frequency/
          // description/effectiveFrom), and append any seeded heads the
          // user didn't have.
          const existing = new Map<string, any>(persistedState.fees.feeHeads.map((f: any) => [f.id, f]))
          const merged: any[] = []
          for (const [id, seedEntry] of seeded) {
            const user = existing.get(id)
            if (user) {
              merged.push({
                ...seedEntry,
                // Preserve user-added archived/description overrides.
                archived: user.archived,
                description: user.description ?? seedEntry.description,
                isTaxable: user.isTaxable,
                taxRate: user.taxRate,
                gstHsnCode: user.gstHsnCode,
                effectiveFrom: user.effectiveFrom ?? seedEntry.effectiveFrom,
              })
              existing.delete(id)
            } else {
              merged.push(seedEntry)
            }
          }
          // Append any user-added heads not in the seed.
          for (const user of existing.values()) merged.push(user)
          persistedState.fees.feeHeads = merged
        }
        // ─── v3 — FINANCIAL CLASSIFICATION (Core / Examination / Additional) ───
        // Patches the financial `kind` onto every seeded head the user
        // still has (user-added heads keep kind undefined → derived via
        // deriveFeeHeadKind) and appends the new ADDITIONAL template
        // heads (fh-13..fh-16) if the user doesn't have them. Never
        // overwrites an explicit user-set kind.
        if (fromVersion < 3 && persistedState?.fees?.feeHeads) {
          const kindById = new Map(initialState.fees.feeHeads.map((f) => [f.id, f.kind]))
          const idSet = new Set(persistedState.fees.feeHeads.map((f: any) => f.id))
          persistedState.fees.feeHeads = persistedState.fees.feeHeads.map((f: any) =>
            f.kind ? f : { ...f, kind: kindById.get(f.id) ?? undefined },
          )
          for (const seedEntry of initialState.fees.feeHeads) {
            if (!idSet.has(seedEntry.id)) persistedState.fees.feeHeads.push({ ...seedEntry })
          }
        }
        return persistedState
      },
    }
  )
)
