'use client'

/**
 * dashboard/welcome-banner — the student's daily greeting surface.
 *
 * GREEN IS THE STUDENT PRIMARY ACCENT (locked): a refined emerald→teal
 * identity gradient (one key highlight — the workspace's welcome
 * moment), never a generic purple banner. The right-hand facts are
 * LIVE: attendance from the canonical attendance records, last score
 * and class rank from the canonical results store (privacy-gated by
 * the school's result policy — the rank chip disappears entirely when
 * the school hides ranks).
 */

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useMyResults, fmtPct } from '@/lib/store/student-results-store'
import { useAttendanceSnapshot } from './data'

interface WelcomeBannerProps {
  student: {
    name: string
    avatar: string
    className: string
    section: string
    rollNo: string
  }
}

export function WelcomeBanner({ student }: WelcomeBannerProps) {
  // STU-ATT — live from the canonical attendance records.
  const attendance = useAttendanceSnapshot()
  // STU-RES — live from the canonical results store (one source, §34).
  const results = useMyResults()
  const latest = results.latest

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-8 text-white shadow-premium-lg"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-amber-300/25 blur-2xl" />
      <div className="absolute left-1/3 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-2xl sm:text-3xl font-extrabold border-2 border-white/30">
              {student.avatar}
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium mb-1.5">
              <Sparkles className="h-3 w-3" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hi {student.name.split(' ').slice(0, 1).join(' ')}!
            </h1>
            <p className="text-emerald-50/90 mt-1 text-sm sm:text-base">
              {student.className}-{student.section} · Roll #{student.rollNo} · Ready to learn today?
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 text-center border border-white/20">
            <p className="font-display text-2xl font-bold">{attendance.pct}%</p>
            <p className="text-[11px] text-emerald-100">Attendance</p>
          </div>
          <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 text-center border border-white/20">
            <p className="font-display text-2xl font-bold">{latest ? `${fmtPct(latest.totals.pct)}%` : '—'}</p>
            <p className="text-[11px] text-emerald-100">Last Score</p>
          </div>
          {latest?.rank != null && (
            <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 text-center border border-white/20 hidden sm:block">
              <p className="font-display text-2xl font-bold">#{latest.rank}</p>
              <p className="text-[11px] text-emerald-100">Class Rank</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
