'use client'

import { motion } from 'framer-motion'
import { ClipboardList, Clock, CheckCircle2, FileText } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { Assignment } from '@/lib/mock/academics'

interface KpiRowProps {
  myAssignments: Assignment[]
  toGrade: number
}

export function AssignmentsKpiRow({ myAssignments, toGrade }: KpiRowProps) {
  const stats = [
    { label: 'Total Assignments', value: myAssignments.length, color: 'violet', icon: <ClipboardList className="h-4 w-4" /> },
    { label: 'Pending Submission', value: myAssignments.filter((a) => a.status === 'Pending').length, color: 'amber', icon: <Clock className="h-4 w-4" /> },
    { label: 'To Grade', value: toGrade, color: 'rose', icon: <FileText className="h-4 w-4" /> },
    { label: 'Graded', value: myAssignments.filter((a) => a.status === 'Graded').length, color: 'emerald', icon: <CheckCircle2 className="h-4 w-4" /> },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                s.color === 'amber' && 'bg-amber-500/10 text-amber-600',
                s.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600',
                s.color === 'cyan' && 'bg-cyan-500/10 text-cyan-600',
                s.color === 'rose' && 'bg-rose-500/10 text-rose-600',
                s.color === 'violet' && 'bg-violet-500/10 text-violet-600',
              )}>{s.icon}</div>
            </div>
            <p className="font-display text-2xl font-bold">{s.value}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
