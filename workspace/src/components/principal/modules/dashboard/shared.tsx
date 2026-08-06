'use client'

import { motion } from 'framer-motion'
import { attendanceOverview } from '@/lib/mock/attendance'
import { studentStats } from '@/lib/mock/students'
import { school } from '@/lib/mock/school'
import { useAuth } from '@/lib/store/auth-store'

// Welcome banner — the emerald/teal hero at the top of the principal dashboard.
// Shows a personalised greeting plus the live "Present Today" / "Birthdays"
// quick-glance stats. Kept in shared.tsx because it is self-contained and
// reused as the visual anchor for the entire page.
export function WelcomeBanner() {
  const { user } = useAuth()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-8 text-white shadow-premium-lg"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, {user?.name.split(' ').slice(0, 2).join(' ')} 👋
          </h1>
          <p className="text-emerald-50/90 mt-1.5 text-sm sm:text-base max-w-xl">
            Here&rsquo;s what&rsquo;s happening at {school.shortName} today. Attendance is at {attendanceOverview.today.rate}% and {studentStats.birthdaysToday} birthdays to celebrate.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
            <p className="text-2xl font-bold">{attendanceOverview.today.present}</p>
            <p className="text-[11px] text-emerald-100">Present Today</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
            <p className="text-2xl font-bold">{studentStats.birthdaysToday}</p>
            <p className="text-[11px] text-emerald-100">Birthdays 🎂</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
