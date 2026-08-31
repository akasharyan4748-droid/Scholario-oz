'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TeachersStoreState } from './types'
import { SEED_TEACHERS } from './seed-data'
import { DEFAULT_POSITIONS } from './constants'
import { createAuditSlice } from './slices/audit-slice'
import { createLifecycleSlice } from './slices/lifecycle-slice'
import { createPositionsSlice } from './slices/positions-slice'
import { createWorkloadSlice } from './slices/workload-slice'
import { createCredentialsSlice } from './slices/credentials-slice'
import { createPayrollSlice } from './slices/payroll-slice'
// SaaS-STAGE-2A — tenant-scoped persistence (per-school staff dataset).
import { migrateLegacyScopedStore, createTenantScopedStorage, TENANT_SCOPED_BASES } from '@/lib/tenant/tenant-storage'
import { DEFAULT_TENANT_ID } from '@/lib/tenant/schools'

migrateLegacyScopedStore(TENANT_SCOPED_BASES.teachers, DEFAULT_TENANT_ID)

export const useTeachersStore = create<TeachersStoreState>()(
  persist(
    (...a) => ({
      teachers: SEED_TEACHERS,
      positionsList: DEFAULT_POSITIONS,
      ...createAuditSlice(...a),
      ...createLifecycleSlice(...a),
      ...createPositionsSlice(...a),
      ...createWorkloadSlice(...a),
      ...createCredentialsSlice(...a),
      ...createPayrollSlice(...a),
    }),
    {
      name: TENANT_SCOPED_BASES.teachers,
      storage: createTenantScopedStorage(TENANT_SCOPED_BASES.teachers),
    }
  )
)
