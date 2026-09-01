'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp, Award, AlertTriangle, Check, FileText,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { MarksStats } from './data'

// Stat strip — 5 mini KPI tiles derived from the live marks state.
// `maxMarks` is the per-subject maximum (used for "/50" sub labels).
export function StatStrip({ stats, maxMarks }: { stats: MarksStats; maxMarks: number }) {
  const tiles = [
    { label: 'Class Average', value: stats.avg.toFixed(1), sub: `/${maxMarks}`, color: 'emerald', icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'Highest', value: stats.highest, sub: `/${maxMarks}`, color: 'amber', icon: <Award className="h-4 w-4" /> },
    { label: 'Lowest', value: stats.lowest, sub: `/${maxMarks}`, color: 'rose', icon: <AlertTriangle className="h-4 w-4" /> },
    { label: 'Pass Rate', value: `${((stats.passCount / stats.total) * 100).toFixed(0)}%`, sub: `${stats.passCount}/${stats.total}`, color: 'cyan', icon: <Check className="h-4 w-4" /> },
    { label: 'Entries', value: stats.total, sub: '/18', color: 'violet', icon: <FileText className="h-4 w-4" /> },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <GlassCard className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md',
                s.color === 'amber' && 'bg-amber-500/10 text-amber-600',
                s.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600',
                s.color === 'cyan' && 'bg-cyan-500/10 text-cyan-600',
                s.color === 'rose' && 'bg-rose-500/10 text-rose-600',
                s.color === 'violet' && 'bg-violet-500/10 text-violet-600',
              )}>{s.icon}</div>
              <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className="font-display text-xl font-bold">{s.value}<span className="text-xs text-muted-foreground font-normal">{s.sub}</span></p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
