'use client'

import { motion } from 'framer-motion'
import { Clock, ChevronRight, ListChecks } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import type { Assignment } from '@/lib/mock/academics'
import { statusVariant, type Submission } from './data'

interface AssignmentCardProps {
  a: Assignment
  submissions: Submission[]
  onSelect: () => void
  index: number
}

export function AssignmentCard({ a, submissions, onSelect, index }: AssignmentCardProps) {
  const graded = submissions.filter((s) => s.status === 'Graded').length
  const submitted = submissions.filter((s) => s.status === 'Submitted' || s.status === 'Graded').length
  const pct = (submitted / 18) * 100
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5 h-full" hover>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">{a.subject}</span>
              <StatusBadge status={a.status} variant={statusVariant(a.status as Submission['status'])} dot />
            </div>
            <p className="font-semibold text-sm">{a.title}</p>
            <p className="text-xs text-muted-foreground mt-1">Due {formatDate(a.dueDate)} · {a.marks} marks · Rubric: {a.rubric.length} criteria</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground">Marks</p>
            <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">{a.marks}</p>
          </div>
        </div>

        {/* Rubric preview */}
        <div className="rounded-lg bg-muted/40 p-3 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
            <ListChecks className="h-3 w-3" /> Rubric
          </p>
          <div className="flex flex-wrap gap-1">
            {a.rubric.map((r, idx) => (
              <span key={idx} className="rounded-md bg-card border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Submission progress */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Submissions</span>
            <span className="font-semibold">{submitted}/18 · Graded: {graded}</span>
          </div>
          <ProgressBar value={submitted} max={18} color={pct === 100 ? 'oklch(0.55 0.14 162)' : 'oklch(0.6 0.18 300)'} height={7} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Due in {Math.max(0, Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
          </div>
          <Button variant="outline" size="sm" onClick={onSelect} className="h-8">
            View submissions <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  )
}
