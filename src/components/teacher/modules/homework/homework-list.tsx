'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { students } from '@/lib/mock/students'
import { formatDate } from '@/lib/format'
import type { Homework } from '@/lib/mock/academics'

interface Props {
  myHomeworks: Homework[]
  onSelect: (h: Homework) => void
}

export function HomeworkList({ myHomeworks, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {myHomeworks.map((h, i) => {
        const pct = (h.submissions / h.total) * 100
        return (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full" hover>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">{h.subject}</span>
                    <StatusBadge status={h.status} variant={h.status === 'Active' ? 'warning' : 'success'} dot />
                  </div>
                  <p className="font-semibold text-sm">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{h.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Assigned</p>
                  <p className="text-xs font-semibold">{formatDate(h.assignedOn)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Due Date</p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{formatDate(h.dueDate)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Class</p>
                  <p className="text-xs font-semibold">{h.className}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Submission progress</span>
                  <span className="font-semibold">{h.submissions}/{h.total} · {pct.toFixed(0)}%</span>
                </div>
                <ProgressBar value={h.submissions} max={h.total} color={pct === 100 ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'} height={7} />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                <div className="flex -space-x-2">
                  {students.slice(0, 4).map((s) => (
                    <GradientAvatar key={s.id} name={s.name} size="sm" className="ring-2 ring-background" />
                  ))}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-background">
                    +{h.total - 4}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(h)}
                  className="h-8"
                >
                  View submissions <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}
