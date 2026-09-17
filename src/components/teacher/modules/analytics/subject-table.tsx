'use client'

import { motion } from 'framer-motion'
import { BookOpen, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import { subjectAverages } from './data'

export function SubjectTable() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <SectionHeading
        title="Subject-wise Performance"
        subtitle="Class 2-A · UT3 results · All subjects"
        icon={<BookOpen className="h-5 w-5" />}
        className="mb-4"
      />
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-3 py-2 font-medium">Subject</th>
              <th className="px-3 py-2 font-medium">Class Avg</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Highest</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">Lowest</th>
              <th className="px-3 py-2 font-medium">Pass Rate</th>
              <th className="px-3 py-2 font-medium hidden lg:table-cell">Trend</th>
            </tr>
          </thead>
          <tbody>
            {subjectAverages.map((s, i) => {
              const highest = Math.min(100, s.avg + 8)
              const lowest = Math.max(50, s.avg - 20)
              const passRate = Math.min(100, s.avg + 6)
              const trend = [3, 2, 4, -1, 1, 5][i] ?? 2
              return (
                <motion.tr
                  key={s.subject}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                      <span className="font-medium">{s.subject}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-display font-bold">{s.avg}%</span>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell text-emerald-600 dark:text-emerald-400 font-semibold">{highest}%</td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-rose-600 dark:text-rose-400 font-semibold">{lowest}%</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={passRate} color={s.color} height={5} className="w-14" />
                      <span className="text-xs">{passRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold',
                      trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}>
                      {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(trend)}%
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
