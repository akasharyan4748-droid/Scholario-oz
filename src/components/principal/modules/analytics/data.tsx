// Analytics module: shared tab definitions + derived mock datasets.
//
// No JSX render components live here — only the `TABS` array (which contains
// small icon elements, hence the `.tsx` extension) and the derived chart data
// computed once at module scope.

import {
  CalendarCheck, IndianRupee, Award, Wallet, GraduationCap, UserPlus,
} from 'lucide-react'
import { attendanceOverview } from '@/lib/mock/attendance'
import { teachers } from '@/lib/mock/teachers'
import { departments } from '@/lib/mock/school'

export type TabKey = 'attendance' | 'fee' | 'performance' | 'revenue' | 'teacher' | 'admission'

export const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'attendance', label: 'Attendance', icon: <CalendarCheck className="h-4 w-4" /> },
  { key: 'fee', label: 'Fees', icon: <IndianRupee className="h-4 w-4" /> },
  { key: 'performance', label: 'Performance', icon: <Award className="h-4 w-4" /> },
  { key: 'revenue', label: 'Revenue', icon: <Wallet className="h-4 w-4" /> },
  { key: 'teacher', label: 'Teachers', icon: <GraduationCap className="h-4 w-4" /> },
  { key: 'admission', label: 'Admissions', icon: <UserPlus className="h-4 w-4" /> },
]

// Mock monthly attendance trend (Apr–Nov)
export const attendanceMonthlyTrend = attendanceOverview.monthly.map((m) => ({ name: m.month, value: m.rate }))

// Mock weekly heatmap (15 weeks x Mon-Sat) — rate per cell
const heatmapRows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const heatmapData = heatmapRows.map((day, di) => ({
  day,
  cells: Array.from({ length: 15 }, (_, wi) => {
    const base = 92 + ((wi * 7 + di * 3) % 8)
    return base
  }),
}))

// Admission analytics mocks
export const admissionsMonthly = [
  { name: 'Apr', value: 312 },
  { name: 'May', value: 48 },
  { name: 'Jun', value: 18 },
  { name: 'Jul', value: 24 },
  { name: 'Aug', value: 31 },
  { name: 'Sep', value: 22 },
  { name: 'Oct', value: 36 },
  { name: 'Nov', value: 47 },
]

export const admissionGender = [
  { name: 'Boys', value: 962, color: 'oklch(0.6 0.18 250)' },
  { name: 'Girls', value: 880, color: 'oklch(0.7 0.18 0)' },
]

// Teacher analytics
export const teacherAttendanceRank = [...teachers]
  .sort((a, b) => b.attendance - a.attendance)
  .slice(0, 8)
  .map((t) => ({ name: t.name.split(' ').slice(-1)[0], value: t.attendance }))

export const teacherDeptDistribution = departments.map((d) => ({
  name: d.name,
  value: d.teachers,
  color: ['oklch(0.55 0.14 162)', 'oklch(0.65 0.16 75)', 'oklch(0.7 0.15 200)', 'oklch(0.6 0.18 300)', 'oklch(0.62 0.2 25)', 'oklch(0.55 0.16 250)', 'oklch(0.65 0.2 50)'][departments.indexOf(d) % 7],
}))

export const classComparison = [
  { name: 'Class 2-A', avg: 91.3 },
  { name: 'Class 2-B', avg: 88.4 },
  { name: 'Class 5-A', avg: 84.7 },
  { name: 'Class 8-A', avg: 79.2 },
  { name: 'Class 10-A', avg: 82.6 },
  { name: 'Class 12-A', avg: 86.4 },
]

// Revenue analytics expense breakdown
export const expenseBreakdown = [
  { name: 'Salaries', value: 86400000, color: 'oklch(0.55 0.14 162)' },
  { name: 'Infrastructure', value: 18400000, color: 'oklch(0.65 0.16 75)' },
  { name: 'Operations', value: 9400000, color: 'oklch(0.6 0.18 300)' },
  { name: 'Transport', value: 4200000, color: 'oklch(0.7 0.15 200)' },
  { name: 'Miscellaneous', value: 8400000, color: 'oklch(0.62 0.2 25)' },
]
