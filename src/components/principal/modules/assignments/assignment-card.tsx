'use client'

// Single assignment card: subject chip, class badge, status badge, due/marks
// tiles, graded score progress bar (or rubric chips for non-graded), and a
// primary action button that opens the details/grading dialog.

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { type Assignment } from '@/lib/mock/academics'
import { statusVariant, subjectColor } from './data'

interface AssignmentCardProps {
  a: Assignment
  index: number
  onSelect: (a: Assignment) => void
}

export function AssignmentCard({ a, index, onSelect }: AssignmentCardProps) {
  const pct = a.obtainedMarks != null ? (a.obtainedMarks / a.marks) * 100 : 0

  return (
    <motion.div
      key={a.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard className="p-3 sm:p-4 lg:p-5 h-full" hover>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className="rounded-md text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide"
                style={{ background: `${subjectColor(a.subject)}1a`, color: subjectColor(a.subject) }}
              >
                {a.subject}
              </span>
              <Badge variant="outline" className="text-[10px]">{a.className}</Badge>
            </div>
            <p className="font-semibold text-sm">{a.title}</p>
          </div>
          <StatusBadge status={a.status} variant={statusVariant[a.status]} dot />
        </div>

        <div className="grid grid-cols-2 gap-2 my-3 text-center">
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-[10px] text-muted-foreground">Due Date</p>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{formatDate(a.dueDate)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-[10px] text-muted-foreground">Max Marks</p>
            <p className="text-xs font-semibold">{a.marks}</p>
          </div>
        </div>

        {a.status === 'Graded' && a.obtainedMarks != null && (
          <div className="mb-3">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">Score</span>
              <span className="font-semibold">{a.obtainedMarks}/{a.marks} · {pct.toFixed(0)}%</span>
            </div>
            <ProgressBar value={pct} color={pct >= 80 ? 'oklch(0.55 0.14 162)' : pct >= 60 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={7} />
            {a.remarks && (
              <p className="text-[11px] text-muted-foreground italic mt-1.5">&ldquo;{a.remarks}&rdquo;</p>
            )}
          </div>
        )}

        {a.status !== 'Graded' && (
          <div className="mb-3">
            <p className="text-[11px] text-muted-foreground mb-1.5">Rubric ({a.rubric.length} criteria)</p>
            <div className="flex flex-wrap gap-1">
              {a.rubric.map((r) => (
                <span key={r} className="text-[10px] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 mt-1"
          onClick={() => onSelect(a)}
        >
          {a.status === 'Graded' ? 'View Grading' : a.status === 'Submitted' ? 'Evaluate' : 'View Details'} <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </GlassCard>
    </motion.div>
  )
}
