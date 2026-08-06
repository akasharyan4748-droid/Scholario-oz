// Static data and constants for the Teacher Dashboard module

export const performanceTrend = [
  { name: 'Jul', v: 78 },
  { name: 'Aug', v: 82 },
  { name: 'Sep', v: 79 },
  { name: 'Oct', v: 85 },
  { name: 'Nov', v: 88 },
]

export const subjectSplit = [
  { name: 'Mathematics', value: 18, color: 'oklch(0.6 0.18 300)' },
  { name: 'Comp. Sci.', value: 18, color: 'oklch(0.55 0.16 250)' },
  { name: 'Other', value: 4, color: 'oklch(0.65 0.16 75)' },
]

export const weeklyBars = [
  { week: 'W1', score: 78, color: 'bg-amber-400' },
  { week: 'W2', score: 81, color: 'bg-amber-500' },
  { week: 'W3', score: 75, color: 'bg-rose-400' },
  { week: 'W4', score: 84, color: 'bg-amber-500' },
  { week: 'W5', score: 86, color: 'bg-amber-600' },
  { week: 'W6', score: 87, color: 'bg-emerald-500' },
]

export const quickInsights = [
  {
    label: 'Class Avg Score',
    value: '87.4%',
    sub: 'Unit Test 3',
    icon: 'Award',
    color: 'text-emerald-600 bg-emerald-500/10',
    trend: '+2.1%',
    trendUp: true,
  },
  {
    label: 'Homework Completion',
    value: '92%',
    sub: 'this week',
    icon: 'BookOpen',
    color: 'text-amber-600 bg-amber-500/10',
    trend: '+5%',
    trendUp: true,
  },
  {
    label: 'Parent Engagement',
    value: '78%',
    sub: 'messages read',
    icon: 'Users',
    color: 'text-violet-600 bg-violet-500/10',
    trend: '+12%',
    trendUp: true,
  },
  {
    label: 'Lessons Completed',
    value: '42/48',
    sub: 'this term',
    icon: 'FileText',
    color: 'text-cyan-600 bg-cyan-500/10',
    trend: '88%',
    trendUp: true,
  },
] as const

export const quickActions = [
  { label: 'Mark Attendance', icon: 'CalendarCheck', color: 'from-amber-500 to-orange-600', key: 'attendance' },
  { label: 'Create Homework', icon: 'BookOpen', color: 'from-emerald-500 to-teal-600', key: 'homework' },
  { label: 'Grade Assignment', icon: 'ClipboardList', color: 'from-violet-500 to-purple-600', key: 'assignments' },
  { label: 'Enter Marks', icon: 'FileText', color: 'from-rose-500 to-pink-600', key: 'marks' },
  { label: 'Message Parents', icon: 'Megaphone', color: 'from-cyan-500 to-sky-600', key: 'communication' },
  { label: 'View Analytics', icon: 'TrendingUp', color: 'from-lime-500 to-green-600', key: 'analytics' },
] as const

export const recentActivity = [
  { icon: 'CheckCircle2', color: 'text-emerald-600 bg-emerald-500/10', title: 'Homework HW001 reviewed', desc: '14 submissions approved', time: '12 min ago' },
  { icon: 'AlertCircle', color: 'text-amber-600 bg-amber-500/10', title: '3 students absent today', desc: 'Vivaan, Kabir, Sai — Class 2-A', time: '38 min ago' },
  { icon: 'FileText', color: 'text-violet-600 bg-violet-500/10', title: 'UT3 marks published', desc: 'Mathematics · Class 2-A', time: '2 hrs ago' },
  { icon: 'ClipboardList', color: 'text-rose-600 bg-rose-500/10', title: 'New assignment created', desc: 'Numbers 1–100 — Number Line', time: 'Yesterday' },
  { icon: 'Users', color: 'text-cyan-600 bg-cyan-500/10', title: 'Parent message received', desc: 'From Vivaan Reddy\'s guardian', time: 'Yesterday' },
] as const
