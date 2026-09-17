'use client'

import { motion } from 'framer-motion'
import { Users, ArrowRight } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { students } from '@/lib/mock/students'

interface StudentSnapshotProps {
  onNavigate: (key: string) => void
}

const statuses = ['present', 'absent', 'present', 'present', 'late', 'present', 'leave'] as const
const scores = [48, 44, 38, 49, 36, 47, 50]

export function StudentSnapshot({ onNavigate }: StudentSnapshotProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <SectionHeading
        title="Class 2-A · Student Snapshot"
        subtitle="Today's attendance & latest Mathematics score"
        icon={<Users className="h-5 w-5" />}
        action={
          <button
            onClick={() => onNavigate('students')}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        }
        className="mb-4"
      />
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-3 py-2 font-medium">Student</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Roll</th>
              <th className="px-3 py-2 font-medium">Today</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">Attendance</th>
              <th className="px-3 py-2 font-medium">Math Score</th>
              <th className="px-3 py-2 font-medium hidden lg:table-cell">Parent Contact</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 7).map((s, i) => {
              const status = statuses[i]
              const score = scores[i]
              return (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <GradientAvatar name={s.name} size="sm" />
                      <p className="font-medium truncate">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell text-muted-foreground font-mono text-xs">{s.rollNo}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      status={status}
                      variant={status === 'present' ? 'success' : status === 'absent' ? 'danger' : status === 'late' ? 'warning' : 'info'}
                      dot
                    />
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.attendance} color={s.attendance > 95 ? 'oklch(0.55 0.14 162)' : s.attendance > 90 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={5} className="w-16" />
                      <span className="text-xs font-medium">{s.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-display font-bold text-sm ${score >= 45 ? 'text-emerald-600 dark:text-emerald-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>{score}/50</span>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground text-xs">{s.guardianPhone}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
