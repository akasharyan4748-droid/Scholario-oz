'use client'

// Small reusable presentational helpers shared across the Examinations module.

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Exam } from '@/lib/mock/academics'

/** Colored type badge used on exam cards & details dialog. */
export function ExamTypeBadge({ type, className }: { type: Exam['type']; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide',
        type === 'Final'
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          : type === 'Mid Term'
            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
            : type === 'Surprise'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-primary/10 text-primary border-primary/20',
        className,
      )}
    >
      {type}
    </Badge>
  )
}

/** Small two-row tile used inside dialogs (label + value). */
export function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-semibold text-sm mt-1">{value}</p>
    </div>
  )
}

/** Grade pill with color driven by the letter grade. */
export function GradePill({ grade }: { grade: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-[10px] font-bold',
        grade === 'A+'
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : grade === 'A'
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            : grade === 'B+'
              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
              : 'bg-muted text-muted-foreground',
      )}
    >
      {grade}
    </Badge>
  )
}

/** Rank circle for the class-toppers list. */
export function RankBadge({ rank }: { rank: number }) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm',
        rank === 1
          ? 'bg-amber-400 text-white'
          : rank === 2
            ? 'bg-slate-300 text-slate-700'
            : rank === 3
              ? 'bg-orange-400 text-white'
              : 'bg-muted text-muted-foreground',
      )}
    >
      {rank}
    </div>
  )
}
