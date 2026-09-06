'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { useClass2AStudents } from './data'

// Quick-stats strip — 4 mini KPI tiles derived from the canonical class roster.
export function QuickStats() {
  const students = useClass2AStudents()
  const stats = [
    { label: 'Total Students', value: students.length, color: 'emerald', sub: 'Class 2-A' },
    {
      label: 'Boys',
      value: students.filter((s) => s.gender === 'Male').length,
      color: 'cyan',
      sub: `${students.filter((s) => s.gender === 'Female').length} girls`,
    },
    {
      label: 'High Attendance',
      value: students.filter((s) => s.attendance >= 95).length,
      color: 'amber',
      sub: '≥ 95% attendance',
    },
    {
      label: 'At Risk',
      value: students.filter((s) => s.attendance < 90).length,
      color: 'rose',
      sub: '< 90% attendance',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className={cn(
              'font-display text-2xl font-bold',
              s.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
              s.color === 'amber' && 'text-amber-600 dark:text-amber-400',
              s.color === 'cyan' && 'text-cyan-600 dark:text-cyan-400',
              s.color === 'rose' && 'text-rose-600 dark:text-rose-400',
            )}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
