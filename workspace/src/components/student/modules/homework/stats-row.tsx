'use client'

import { motion } from 'framer-motion'
import { BookOpen, Clock, CheckCircle2, FileText } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'

interface StatsRowProps {
  totalAssigned: number
  activeCount: number
  submittedCount: number
  closedCount: number
}

export function StatsRow({ totalAssigned, activeCount, submittedCount, closedCount }: StatsRowProps) {
  const stats = [
    { label: 'Total Assigned', value: totalAssigned, color: 'from-violet-400 to-purple-500', icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Active', value: activeCount, color: 'from-amber-400 to-orange-500', icon: <Clock className="h-4 w-4" /> },
    { label: 'Submitted', value: submittedCount, color: 'from-emerald-400 to-teal-500', icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'Closed', value: closedCount, color: 'from-cyan-400 to-sky-500', icon: <FileText className="h-4 w-4" /> },
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
