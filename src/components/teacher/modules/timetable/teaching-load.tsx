'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/ui'
import { weeklyTimetable } from '@/lib/mock/academics'
import { cn } from '@/lib/utils'
import { days, dayShort } from './data'

interface Props {
  today: string
}

const SUBJECT_DISTRIBUTION = [
  { subject: 'Mathematics', count: 5, color: 'violet', icon: '📐' },
  { subject: 'Computer Science', count: 2, color: 'cyan', icon: '💻' },
  { subject: 'Free Periods', count: 18, color: 'slate', icon: '☕' },
  { subject: 'Morning Assembly', count: 5, color: 'amber', icon: '🌅' },
  { subject: 'Breaks', count: 5, color: 'amber', icon: '🍪' },
  { subject: 'Lunch', count: 5, color: 'rose', icon: '🍱' },
]

export function TeachingLoad({ today }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-1">
        <h3 className="font-semibold text-sm mb-4">Weekly Teaching Load</h3>
        <div className="space-y-3">
          {days.map((d, i) => {
            const count = weeklyTimetable[d].filter((p) => p.teacher === 'Rohan Mehta').length
            const pct = (count / 5) * 100
            return (
              <motion.div
                key={d}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className={cn('text-xs font-medium w-10', d === today && 'text-primary')}>{dayShort[d]}</span>
                <div className="flex-1 h-6 rounded-md bg-muted/40 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={cn('h-full rounded-md flex items-center justify-end pr-2 text-[10px] font-bold text-white', d === today ? 'bg-primary' : 'bg-amber-500/70')}
                  >
                    {count}
                  </motion.div>
                </div>
                <span className="text-[10px] text-muted-foreground w-12 text-right">{count} periods</span>
              </motion.div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">
              {days.reduce((a, d) => a + weeklyTimetable[d].filter((p) => p.teacher === 'Rohan Mehta').length, 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Periods</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">22.5</p>
            <p className="text-[10px] text-muted-foreground">Teaching Hours</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <h3 className="font-semibold text-sm mb-4">Subject Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUBJECT_DISTRIBUTION.map((s, i) => (
            <motion.div
              key={s.subject}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="font-display text-lg font-bold">{s.count}</span>
              </div>
              <p className="text-[11px] font-medium">{s.subject}</p>
              <p className="text-[10px] text-muted-foreground">{((s.count / 45) * 100).toFixed(0)}% of week</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
