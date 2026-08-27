// Barrel module for student-profile tab views.
//
// Originally a single 326-line file, now split into focused `profile-tab-*.tsx`
// feature files (one per tab) to keep every file well under the 300-line cap.
// `student-profile.tsx` continues to import all ten tab components from this
// barrel via `from './profile-tabs'`, so the public export surface is unchanged.

export { OverviewTab } from './profile-tab-overview'
export { AcademicsTab } from './profile-tab-academics'
export { AttendanceTab } from './profile-tab-attendance'
export { FeesTab } from './profile-tab-fees'
export { DocumentsTab } from './profile-tab-documents'
export { MedicalTab } from './profile-tab-medical'
export { ParentsTab } from './profile-tab-parents'
export { TransportTab } from './profile-tab-transport'
export { DisciplineTab } from './profile-tab-discipline'
export { TimelineTab } from './profile-tab-timeline'
