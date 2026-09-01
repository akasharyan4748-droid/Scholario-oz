import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SchoolSettingsState } from './types'
import { initialState } from './initial-state'
import { createProfileSlice } from './slices/profile-slice'
import { createInventorySlice } from './slices/inventory-slice'
import { createAcademicConfigSlice } from './slices/academic-config-slice'
import { createAdmissionSlice } from './slices/admission-slice'
// SaaS-STAGE-2A — tenant-scoped persistence: every school gets its OWN
// settings namespace (profile, sessions, fee-head catalogue, admission
// config) + a one-time legacy copy into the demo school's namespace.
import { migrateLegacyScopedStore, createTenantScopedStorage, TENANT_SCOPED_BASES } from '@/lib/tenant/tenant-storage'
import { DEFAULT_TENANT_ID } from '@/lib/tenant/schools'

migrateLegacyScopedStore(TENANT_SCOPED_BASES.schoolSettings, DEFAULT_TENANT_ID)

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
      name: TENANT_SCOPED_BASES.schoolSettings,
      // SaaS-STAGE-2A — TENANT-SCOPED: the real localStorage key is
      // `${name}::t:${activeTenantId}` (see lib/tenant/tenant-storage.ts).
      storage: createTenantScopedStorage(TENANT_SCOPED_BASES.schoolSettings),
      // PHASE 5 — bumped to v2 to merge in the enriched master fee-head
      // catalogue (added fh-7..fh-12 Transport/Board/Development/Smart
      // Class/Sports/Medical + description/effectiveFrom on existing
      // entries). Pre-v2 persisted state had only fh-1..fh-6 with the
      // old narrow type set; the migrate function appends the new
      // entries and patches the existing ones' names/types to match
      // the new seed WITHOUT losing any user-edited catalogue entries
      // they may have added on top.
      version: 6,
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
        // ─── v5 — SaaS-STAGE-2A fee-model vocabulary (§3–§6) ───────────
        // 1) Append the new OPTIONAL head templates (fh-20 Books &
        //    Material, fh-21 Uniform & Sports Kit) to persisted
        //    catalogues that predate them — user-added heads preserved.
        // 2) fh-6 Examination Fee: frequency One-Time → 'Per-Exam' ONLY
        //    when untouched (semantic correction, not a user override).
        if (persistedState?.fees?.feeHeads && fromVersion < 5) {
          const idSet = new Set(persistedState.fees.feeHeads.map((f: any) => f.id))
          for (const seedEntry of initialState.fees.feeHeads) {
            if ((seedEntry.id === 'fh-20' || seedEntry.id === 'fh-21') && !idSet.has(seedEntry.id)) {
              persistedState.fees.feeHeads.push({ ...seedEntry })
            }
          }
          const fh6 = persistedState.fees.feeHeads.find((f: any) => f.id === 'fh-6')
          if (fh6 && (fh6.frequency === 'One-Time' || !fh6.frequency)) {
            fh6.frequency = 'Per-Exam'
            if (!fh6.description || fh6.description.startsWith('Session-wide exam conduct')) {
              const seedFh6 = initialState.fees.feeHeads.find((f) => f.id === 'fh-6')
              if (seedFh6) fh6.description = seedFh6.description
            }
          }
        }
        // ─── v6 — PRINCIPAL-FIRST DESCRIPTIONS ──────────────────────
        // fh-2 / fh-6 descriptions previously carried internal engineering
        // vocabulary. Replace them ONLY when the persisted text is still
        // the untouched seed — user-authored descriptions are preserved.
        if (fromVersion < 6 && persistedState?.fees?.feeHeads) {
          const legacyDescriptions: Record<string, string[]> = {
            'fh-2': [
              'Admission: boys ₹500 one-time (girls free above Class 5). Registration ₹300 for Class 9 & 11 entry points. SaaS-STAGE-2A §5: charged at admission events — schools that levy it EVERY academic year simply switch this head’s frequency to Annual (one model, policy-driven frequency).',
            ],
            'fh-6': [
              'SaaS-STAGE-2A §4/§7: per-examination charge (never ×12) — the school’s exam pattern maps amounts per exam type (Pattern A: UT×4 + Half-Yearly + Annual · Pattern B: Quarterly + Half-Yearly + Annual). Fee configuration ≠ exam creation: actual exams are produced in the Examination module.',
              'Session-wide exam conduct charge — see Fee Structure (exam fee schedule).',
            ],
          }
          for (const head of persistedState.fees.feeHeads) {
            const legacy = legacyDescriptions[head.id]
            const seed = initialState.fees.feeHeads.find((f) => f.id === head.id)
            if (head && legacy?.includes(head.description) && seed) head.description = seed.description
          }
        }
        return persistedState
      },
    }
  )
)
