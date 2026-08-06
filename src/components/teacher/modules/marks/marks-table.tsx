'use client'

import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { students } from '@/lib/mock/students'
import { cn } from '@/lib/utils'

// Marks entry table. `marks` is the per-student mark string map; `onMarkChange`
// is called with (id, value). `onAutoFill` triggers the random plausible
// scores action from the header "Auto-fill (mock)" button.
export function MarksTable({
  subject,
  marks,
  maxMarks,
  onMarkChange,
  onAutoFill,
  onPublish,
}: {
  subject: string
  marks: Record<string, string>
  maxMarks: number
  onMarkChange: (id: string, value: string) => void
  onAutoFill: () => void
  onPublish: () => void
}) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Marks Entry · Class 2-A</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subject} · Max {maxMarks} marks · Enter marks for each student</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAutoFill}>
            Auto-fill (mock)
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-3 py-2 font-medium">Roll</th>
              <th className="px-3 py-2 font-medium">Student</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Attendance</th>
              <th className="px-3 py-2 font-medium">Marks Obtained</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">Grade</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const val = marks[s.id]
              const num = parseInt(val)
              const pct = (num / maxMarks) * 100
              const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'F'
              const pass = num >= maxMarks * 0.4
              return (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2.5 font-mono text-xs">{s.rollNo}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <GradientAvatar name={s.name} size="sm" />
                      <p className="font-medium truncate">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.attendance} color={s.attendance > 95 ? 'oklch(0.55 0.14 162)' : s.attendance > 90 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={5} className="w-14" />
                      <span className="text-xs">{s.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={val}
                        onChange={(e) => onMarkChange(s.id, e.target.value)}
                        className={cn(
                          'h-8 w-20 font-semibold',
                          !pass ? 'border-rose-500/40 bg-rose-500/5' : pct >= 90 ? 'border-emerald-500/40 bg-emerald-500/5' : ''
                        )}
                      />
                      <span className="text-xs text-muted-foreground">/{maxMarks}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <span className={cn(
                      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold',
                      grade === 'A+' && 'bg-emerald-500/10 text-emerald-600',
                      grade === 'A' && 'bg-teal-500/10 text-teal-600',
                      grade === 'B+' && 'bg-amber-500/10 text-amber-600',
                      grade === 'B' && 'bg-orange-500/10 text-orange-600',
                      grade === 'C' && 'bg-rose-500/10 text-rose-600',
                      grade === 'F' && 'bg-destructive/15 text-destructive',
                    )}>{grade}</span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <StatusBadge status={pass ? 'Pass' : 'Fail'} variant={pass ? 'success' : 'danger'} dot />
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Marks auto-save every change. Last saved: <span className="font-medium text-foreground">just now</span>
        </p>
        <Button onClick={onPublish} className="bg-gradient-to-r from-emerald-600 to-teal-600">
          <Send className="h-4 w-4" /> Publish Results
        </Button>
      </div>
    </GlassCard>
  )
}
