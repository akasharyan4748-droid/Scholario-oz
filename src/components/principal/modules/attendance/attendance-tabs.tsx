'use client'

/**
 * AttendanceTabs — premium sub-navigation for the Attendance module.
 *
 * Brief section 1: Three sections (Overview / Teachers & Employees / History)
 * with a subtle Scholario-style active state. NOT a giant tab bar.
 *
 * Reuses the existing Scholario `SegmentedTabs` pattern (also used by
 * FiltersBar day selector). Consistent design language.
 */

import { SegmentedTabs } from '../shared/segmented-tabs'

export type AttendanceTab = 'overview' | 'staff' | 'history'

const TABS: { value: AttendanceTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'staff',    label: 'Teachers & Employees' },
  { value: 'history',  label: 'History' },
]

export function AttendanceTabs({
  value, onValueChange,
}: {
  value: AttendanceTab
  onValueChange: (v: AttendanceTab) => void
}) {
  return (
    <SegmentedTabs
      tabs={TABS}
      value={value}
      onValueChange={(v) => onValueChange(v as AttendanceTab)}
    />
  )
}
