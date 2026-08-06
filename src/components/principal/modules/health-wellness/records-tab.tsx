'use client'

import { motion } from 'framer-motion'
import { Search, ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { studentHealthRecords, type StudentHealth } from '@/lib/mock/health'
import { bmiStatusConfig } from './data'

// Health Records tab — search input + student health records table. Row click
// opens the detail modal (onSelectStudent callback).
export function RecordsTab({
  search,
  onSearchChange,
  onSelectStudent,
}: {
  search: string
  onSearchChange: (v: string) => void
  onSelectStudent: (s: StudentHealth) => void
}) {
  const filtered = studentHealthRecords.filter(
    (s) => s.studentName.toLowerCase().includes(search.toLowerCase()) || s.admissionNo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div key="rec" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by student name or admission number…"
            className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </GlassCard>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-3 py-2 font-medium">Student</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Blood</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">BMI</th>
              <th className="px-3 py-2 font-medium hidden lg:table-cell">Allergies</th>
              <th className="px-3 py-2 font-medium hidden lg:table-cell">Conditions</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const bmiCfg = bmiStatusConfig[s.bmiStatus]
              return (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => onSelectStudent(s)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <GradientAvatar name={s.studentName} initials={s.avatar} size="sm" />
                      <div>
                        <p className="font-medium">{s.studentName}</p>
                        <p className="text-[11px] text-muted-foreground">{s.className}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{s.bloodGroup}</span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">{s.bmi}</span>
                      <StatusBadge status={bmiCfg.label} variant={bmiCfg.variant} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    {s.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.allergies.map((a) => (
                          <span key={a} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">⚠ {a}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    {s.chronicConditions.length > 0 ? (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">{s.chronicConditions.join(', ')}</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={s.status} variant={s.status === 'Healthy' ? 'success' : s.status === 'Monitoring' ? 'warning' : 'danger'} dot />
                  </td>
                  <td className="px-3 py-2.5">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
