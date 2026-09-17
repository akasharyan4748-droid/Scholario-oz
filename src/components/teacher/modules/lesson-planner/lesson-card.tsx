'use client'

/**
 * lesson-card — one lesson plan card in the Weekly Plans grid.
 *
 * Structure (FINAL spec §5): subject · class eyebrow → lesson title (the
 * strongest hierarchy) → status badge → Date / Period / Duration meta tiles
 * → learning objectives preview (2 + "+N more") → Activities / Resources
 * counts → View. Restrained borders, no gradients, no decorative chips —
 * the Attendance-card design language applied to lesson planning.
 */

import { motion } from 'framer-motion'
import { Calendar, Clock, Timer, Target, ListChecks, FileText, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import type { LessonPlanDTO } from '@/lib/lesson-planner-types'
import { cn } from '@/lib/utils'
import { formatLessonDate, lessonStatusConfig } from './vocabulary'

interface LessonCardProps {
  plan: LessonPlanDTO
  index: number
  isToday: boolean
  onSelect: (plan: LessonPlanDTO) => void
}

export function LessonCard({ plan, index, isToday, onSelect }: LessonCardProps) {
  const cfg = lessonStatusConfig[plan.status]
  const cancelled = plan.status === 'CANCELLED'
  const showProgress = plan.status === 'IN_PROGRESS' || plan.status === 'COMPLETED'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
      className="h-full"
    >
      <button
        type="button"
        onClick={() => onSelect(plan)}
        className={cn(
          'flex h-full w-full flex-col rounded-xl border bg-card p-3 text-left transition-all sm:p-4',
          'border-border hover:border-primary/40 hover:shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          cancelled && 'opacity-75',
        )}
      >
        {/* eyebrow + status */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {plan.subjectName} · {plan.classLabel}
            {plan.curriculumUnit ? <span className="font-medium normal-case tracking-normal"> · {plan.curriculumUnit}</span> : null}
          </p>
          <StatusBadge status={cfg.label} variant={cfg.variant} dot className="shrink-0 text-[10px]" />
        </div>

        {/* title — the strongest hierarchy on the card */}
        <p className={cn('text-sm font-semibold leading-snug text-foreground', cancelled && 'line-through decoration-muted-foreground/50')}>
          {plan.topic}
        </p>

        {/* meta tiles */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className={cn('rounded-lg px-2 py-1.5', isToday ? 'bg-primary/5' : 'bg-muted/50')}>
            <p className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" /> Date
            </p>
            <p className={cn('mt-0.5 text-xs font-semibold tabular-nums', isToday && 'text-primary')}>
              {formatLessonDate(plan.date).replace(/ \d{4}$/, '')}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-1.5">
            <p className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              <Clock className="h-2.5 w-2.5" /> Period
            </p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums">{plan.period ? `P${plan.period}` : '—'}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-1.5">
            <p className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              <Timer className="h-2.5 w-2.5" /> Duration
            </p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums">{plan.durationMin} min</p>
          </div>
        </div>

        {/* objectives preview */}
        <div className="mt-3 min-h-[52px]">
          <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            <Target className="h-3 w-3" /> Learning Objectives
          </p>
          <ul className="space-y-0.5">
            {plan.objectives.slice(0, 2).map((o, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
                <span className="mt-0.5 text-primary">•</span>
                <span className="line-clamp-1">{o}</span>
              </li>
            ))}
            {plan.objectives.length > 2 && (
              <li className="text-[10px] text-muted-foreground/60">+{plan.objectives.length - 2} more</li>
            )}
          </ul>
        </div>

        {/* delivery progress (in-progress / completed only) */}
        {showProgress && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-[10px]">
              <span className="text-muted-foreground">Delivery progress</span>
              <span className="font-semibold tabular-nums">{plan.progress}%</span>
            </div>
            <ProgressBar
              value={plan.progress}
              color={plan.status === 'COMPLETED' ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'}
            />
          </div>
        )}

        {/* footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <ListChecks className="h-2.5 w-2.5" /> {plan.activities.length} activities
            </span>
            <span className="hidden items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
              <FileText className="h-2.5 w-2.5" /> {plan.resources.length} resources
            </span>
          </div>
          <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary">
            View <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </button>
    </motion.div>
  )
}
