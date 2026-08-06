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
      name: 'gws-teachers-lifecycle-store',
    }
  )
)
