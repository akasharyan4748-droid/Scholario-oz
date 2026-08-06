'use client'

// Attendance module entry point.
//
// `principal-panel.tsx` lazy-loads this file and reads the named
// `AttendanceModule` export:
//   import('./modules/attendance').then((m) => ({ default: m.AttendanceModule }))
//
// The module is currently 100% student-attendance focused, so the entry simply
// renders `<StudentWorkspace />`. A future staff-workspace / settings modal
// can be added here without touching the rest of the codebase.

import { StudentWorkspace } from './student-workspace'

export function AttendanceModule() {
  return <StudentWorkspace />
}
