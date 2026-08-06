'use client'

// Bottom-of-page insights + Live Class 2-A snapshot.
// Three highlight cards (best class, needs attention, school average) followed
// by an animated roster grid of today's 18 Class 2-A students.

import { motion } from 'framer-motion'
import { TrendingUp, UserX, CalendarCheck, UserCheck } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared/charts'
import { class2AAttendance } from '@/lib/mock/attendance'
import { classList, school } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'

export function AttendanceInsights() {
  return (
    <>
      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-semibold text-sm">Best Performing Class</h4>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">Nursery</p>
          <p className="text-xs text-muted-foreground mt-0.5">96.8% attendance · 48 students</p>
          <div className="mt-3"><ProgressBar value={96.8} color="oklch(0.65 0.16 162)" /></div>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <h4 className="font-semibold text-sm">Needs Attention</h4>
          </div>
          <p className="font-display text-2xl font-bold text-rose-600 dark:text-rose-400">Class 12</p>
          <p className="text-xs text-muted-foreground mt-0.5">88.8% attendance · 86 students</p>
          <div className="mt-3"><ProgressBar value={88.8} color="oklch(0.62 0.2 25)" /></div>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h4 className="font-semibold text-sm">School Average</h4>
          </div>
          <p className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400">93.3%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Across {classList.length} classes · {formatNumber(school.totalStudents)} students</p>
          <div className="mt-3"><ProgressBar value={93.3} color="oklch(0.7 0.15 75)" /></div>
        </GlassCard>
      </div>

      {/* Sample class attendance (Class 2-A) */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Live Class Snapshot — Class 2-A
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Today's roster · 18 students · Rohan Mehta (Class Teacher)</p>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            83.3% present
          </Badge>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
          {class2AAttendance.map((s, i) => (
            <motion.div
              key={`${s.rollNo}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className={`rounded-lg border p-2 text-center ${
                s.status === 'present' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : s.status === 'late' ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : s.status === 'absent' ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              <p className="text-[10px] font-mono opacity-70">#{s.rollNo}</p>
              <p className="text-[10px] font-semibold truncate" title={s.name}>{s.name.split(' ')[0]}</p>
              <p className="text-[9px] uppercase mt-0.5 font-bold">{s.status}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </>
  )
}
