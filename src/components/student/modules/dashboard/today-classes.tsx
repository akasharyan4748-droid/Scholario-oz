'use client'

import { motion } from 'framer-motion'
import { Clock, ArrowUpRight } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { RadialGauge } from '@/components/shared/charts'
import { todaySchedule } from '@/lib/mock/academics'
import { cn } from '@/lib/utils'
import { absentCount, attendancePct, lateCount, presentCount } from './data'

const subjectColors: Record<string, string> = {
  English: 'from-emerald-400 to-teal-500',
  Mathematics: 'from-violet-400 to-purple-500',
  Science: 'from-amber-400 to-orange-500',
  Hindi: 'from-rose-400 to-pink-500',
  'Art & Craft': 'from-fuchsia-400 to-pink-500',
  Library: 'from-cyan-400 to-sky-500',
  'Computer Science': 'from-lime-400 to-green-500',
  'Social Studies': 'from-orange-400 to-red-500',
  Music: 'from-purple-400 to-fuchsia-500',
  'Physical Education': 'from-sky-400 to-blue-500',
}

export function TodayClasses() {
  const todayClasses = todaySchedule.filter((p) => p.subject !== 'Break' && p.subject !== 'Lunch' && p.subject !== 'Assembly')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Today's classes */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <SectionHeading
          title="Today's Classes"
          subtitle="Wednesday · 7 periods scheduled"
          icon={<Clock className="h-5 w-5" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {todayClasses.map((p, i) => {
            const color = subjectColors[p.subject] ?? 'from-emerald-400 to-teal-500'
            return (
              <motion.div
                key={p.time}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="group relative flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3 hover:shadow-premium transition-shadow overflow-hidden"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                  <span className="text-[10px] font-bold leading-tight text-center">
                    {p.time.split('–')[0].trim()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.teacher} · Room {p.room}</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )
          })}
        </div>
      </GlassCard>

      {/* Attendance gauge */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-1">My Attendance</h3>
        <p className="text-xs text-muted-foreground mb-3">November 2024</p>
        <div className="flex items-center justify-center mb-3">
          <RadialGauge value={attendancePct} label="present" size={150} color="oklch(0.55 0.14 162)" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-500/10 py-2">
            <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</p>
            <p className="text-[10px] text-muted-foreground">Present</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 py-2">
            <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">{lateCount}</p>
            <p className="text-[10px] text-muted-foreground">Late</p>
          </div>
          <div className={cn('rounded-xl bg-rose-500/10 py-2')}>
            <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">{absentCount}</p>
            <p className="text-[10px] text-muted-foreground">Absent</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
