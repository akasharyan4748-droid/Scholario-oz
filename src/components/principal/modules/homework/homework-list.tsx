'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Calendar } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared/charts'
import { students } from '@/lib/mock/students'
import { formatDate } from '@/lib/format'
import type { Homework } from '@/lib/mock/academics'
import { SubjectTag, StatusChip } from './shared'

interface Props {
  filtered: Homework[]
  totalCount: number
  onSelect: (h: Homework) => void
}

export function HomeworkList({ filtered, totalCount, onSelect }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">All Homework</h3>
        <p className="text-xs text-muted-foreground">{filtered.length} of {totalCount} shown</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filtered.map((h, i) => {
          const pct = (h.submissions / h.total) * 100
          return (
            <motion.div key={h.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-3 sm:p-4 lg:p-5 h-full" hover>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <SubjectTag subject={h.subject} />
                      <Badge variant="outline" className="text-[10px]">{h.className}</Badge>
                      <StatusChip status={h.status} />
                    </div>
                    <p className="font-semibold text-sm">{h.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{h.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <GradientAvatar name={h.assignedBy} size="sm" />
                  <div>
                    <p className="font-medium text-foreground text-xs">{h.assignedBy}</p>
                    <p className="text-[10px] flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />Assigned {formatDate(h.assignedOn)}</p>
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
                    <p className="text-[10px] text-muted-foreground">Submissions</p>
                    <p className="text-xs font-semibold">{h.submissions}/{h.total}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Submission progress</span>
                    <span className="font-semibold">{pct.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={h.submissions} max={h.total} color={pct === 100 ? 'oklch(0.55 0.14 162)' : pct >= 75 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={7} />
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
                  <Button variant="outline" size="sm" onClick={() => onSelect(h)} className="h-8">
                    View Submissions <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
