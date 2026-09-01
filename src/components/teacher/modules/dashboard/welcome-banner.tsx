'use client'

import { motion } from 'framer-motion'

interface WelcomeBannerProps {
  userName: string | undefined
  today: string
  teachingPeriodsCount: number
  activeHomeworksCount: number
}

export function WelcomeBanner({ userName, today, teachingPeriodsCount, activeHomeworksCount }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 sm:p-8 text-white shadow-premium-lg"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-100 text-xs font-medium mb-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-200 animate-pulse" />
            {today} · Period 3 ongoing
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, {userName?.split(' ').slice(0, 1).join(' ')} 👋
          </h1>
          <p className="text-amber-50/90 mt-1.5 text-sm sm:text-base max-w-xl">
            Class Teacher · Class 2-A · Senior Teacher, Mathematics &amp; Computer Science. You have {teachingPeriodsCount} periods today and {activeHomeworksCount} active homework to review.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-white/15 backdrop-blur px-5 py-3 text-center">
            <p className="text-2xl font-bold">{teachingPeriodsCount}</p>
            <p className="text-[11px] text-amber-100">Classes Today</p>
          </div>
          <div className="rounded-2xl bg-white/15 backdrop-blur px-5 py-3 text-center">
            <p className="text-2xl font-bold">18</p>
            <p className="text-[11px] text-amber-100">Students · 2-A</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
