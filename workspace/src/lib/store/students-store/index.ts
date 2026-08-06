// Barrel module for the students store.
//
// Re-exports the zustand `useStudentsStore`, the deterministic
// `getVirtualOccupied` helper, and every entity type so that
// `@/lib/store/students-store` continues to resolve to the same
// public surface as the original monolithic file.

export { useStudentsStore } from './store'
export { getVirtualOccupied } from './helpers'
export type {
  StudentStatus,
  FeeStatus,
  Gender,
  TimelineEvent,
  StudentRecord,
  SectionRecord,
  ClassRecord,
  House,
  PromotionRecord,
  TransferRecord,
  StudentsState,
} from './types'
