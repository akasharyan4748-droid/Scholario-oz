'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, BookOpen, Sparkles } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import type { Homework } from '@/lib/mock/academics'
import { subjectColors } from './data'

interface ClosedHomeworkListProps {
  items: Homework[]
}

export function ClosedHomeworkList({ items }: ClosedHomeworkListProps) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Completed & Graded
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {items.map((h, i) => {
          const sc = subjectColors[h.subject] ?? subjectColors.English
          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard className="p-3 sm:p-4 lg:p-5 border-emerald-500/20" hover>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sc.gradient} text-white shadow-md`}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{h.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.subject} · {h.assignedBy}</p>
                    </div>
                  </div>
                  <StatusBadge status="Graded" variant="success" dot />
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <GradientAvatar name={h.assignedBy} size="sm" />
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Teacher Feedback</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Excellent work, Aarav! Your varnamala practice is neat and accurate. Keep up the great handwriting effort. 🌟
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      <Sparkles className="h-3 w-3" /> 5/5 stars
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">Submitted on 24 Nov 2024</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
