// Static data and constants for the Teacher Dashboard module.
// MODULE-REDUCTION PASS: every reference to the removed Homework /
// Assignments modules is gone. Numbers that matter are wired live in
// index.tsx (Lesson Planner summary + Parent Connect aggregate, both
// server-derived); the constants left here are clearly-seeded Demo
// School data only.

export const performanceTrend = [
  { name: 'Jul', v: 78 },
  { name: 'Aug', v: 82 },
  { name: 'Sep', v: 79 },
  { name: 'Oct', v: 85 },
  { name: 'Nov', v: 88 },
]

export const quickActions = [
  { label: 'Mark Attendance', icon: 'CalendarCheck', color: 'from-amber-500 to-orange-600', key: 'attendance' },
  { label: "Today's Lessons", icon: 'BookMarked', color: 'from-emerald-500 to-teal-600', key: 'lesson-planner' },
  { label: 'Enter Marks', icon: 'FileText', color: 'from-rose-500 to-pink-600', key: 'marks' },
  { label: 'Student Directory', icon: 'Users', color: 'from-cyan-500 to-sky-600', key: 'students' },
  { label: 'Message Parents', icon: 'Megaphone', color: 'from-violet-500 to-purple-600', key: 'communication' },
  { label: 'View Analytics', icon: 'TrendingUp', color: 'from-lime-500 to-green-600', key: 'analytics' },
] as const
