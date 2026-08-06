'use client'

import { motion } from 'framer-motion'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { studentStats, students } from '@/lib/mock/students'

// Recent Admissions table — surfaces the latest 6 enrolled students with
// avatar, admission number, class, guardian phone, and fee-status badge.
// Rendered as the final widget at the bottom of the principal dashboard.
export function RecentAdmissions() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Recent Admissions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest students enrolled this term</p>
        </div>
        <StatusBadge status={`${studentStats.newThisMonth} this month`} variant="success" dot />
      </div>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-3 py-2 font-medium">Student</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Admission No</th>
              <th className="px-3 py-2 font-medium">Class</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">Guardian</th>
              <th className="px-3 py-2 font-medium">Fee Status</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 6).map((s, i) => (
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
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.fatherName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell text-muted-foreground font-mono text-xs">{s.admissionNo}</td>
                <td className="px-3 py-2.5">{s.className}-{s.section}</td>
                <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs">{s.guardianPhone}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge
                    status={s.feeStatus}
                    variant={s.feeStatus === 'Paid' ? 'success' : s.feeStatus === 'Partial' ? 'warning' : 'danger'}
                    dot
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
