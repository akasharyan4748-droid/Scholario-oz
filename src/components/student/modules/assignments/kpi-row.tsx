'use client'

import { motion } from 'framer-motion'
import { ClipboardList, Clock, CheckCircle2, Award } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'

interface KpiRowProps {
  total: number
  pending: number
  submitted: number
  graded: number
}

export function AssignmentsKpiRow({ total, pending, submitted, graded }: KpiRowProps) {
  const stats = [
    { label: 'Total', value: total, color: 'from-violet-400 to-purple-500', icon: <ClipboardList className="h-4 w-4" /> },
    { label: 'Pending', value: pending, color: 'from-amber-400 to-orange-500', icon: <Clock className="h-4 w-4" /> },
    { label: 'Submitted', value: submitted, color: 'from-cyan-400 to-sky-500', icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'Graded', value: graded, color: 'from-emerald-400 to-teal-500', icon: <Award className="h-4 w-4" /> },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <GlassCard className="p-3 sm:p-4" hover>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white shadow-md mb-2`}>
              {s.icon}
            </div>
            <p className="font-display text-2xl font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
