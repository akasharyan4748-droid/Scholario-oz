'use client'

/**
 * TodaysFocus — the "Your focus today" strip (spec §8/§67).
 *
 * Three REAL facts, nothing else: open tasks due today (tasksDueOn),
 * minutes studied today against a soft 60-minute daily reference
 * (minutesOn), and flashcards due (dueStatsOf().due). Two cross-tab
 * actions — Start study → Study Planner, Review cards → Flashcards —
 * both real navigation, never dead buttons (§62).
 */

import { Clock3, Layers, ListTodo, type LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { cn } from '@/lib/utils'
import type { PlannerTask } from '@/lib/store/student-learning-store'
import { BTN_PRIMARY, BTN_SOFT_VIOLET } from './type-meta'

/** Soft daily reference for study minutes — a guide, not a school policy. */
const DAILY_MINUTES_REFERENCE = 60

interface TodaysFocusProps {
  tasksDue: PlannerTask[]
  minutesToday: number
  cardsDue: number
  goToTab: (tab: string) => void
}

type Accent = 'amber' | 'emerald' | 'violet'

const ACCENT_TONES: Record<Accent, string> = {
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

function Fact({ icon: Icon, value, label, accent, children }: {
  icon: LucideIcon
  value: string
  label: string
  accent: Accent
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', ACCENT_TONES[accent])}>
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  )
}

export function TodaysFocus({ tasksDue, minutesToday, cardsDue, goToTab }: TodaysFocusProps) {
  const minutesPct = Math.min(100, Math.round((minutesToday / DAILY_MINUTES_REFERENCE) * 100))
  const taskLabel = tasksDue.length === 1 ? 'task planned' : 'tasks planned'
  const cardLabel = cardsDue === 1 ? 'card due' : 'cards due'

  return (
    <section className="space-y-3">
      <SectionLabel>Today&apos;s focus</SectionLabel>
      <GlassCard hover={false} className="on-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Fact icon={ListTodo} value={String(tasksDue.length)} label={taskLabel} accent="amber" />
            <Fact
              icon={Clock3}
              value={`${minutesToday} / ${DAILY_MINUTES_REFERENCE}`}
              label="min studied today"
              accent="emerald"
            >
              <div
                className="mt-1.5 h-1 w-24 max-w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={minutesPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Minutes studied today against the daily reference"
              >
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${minutesPct}%` }} />
              </div>
            </Fact>
            <Fact icon={Layers} value={String(cardsDue)} label={cardLabel} accent="violet" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
            <button type="button" onClick={() => goToTab('planner')} className={BTN_PRIMARY}>
              <ListTodo className="h-3.5 w-3.5" aria-hidden />
              Start study
            </button>
            <button type="button" onClick={() => goToTab('flashcards')} className={BTN_SOFT_VIOLET}>
              <Layers className="h-3.5 w-3.5" aria-hidden />
              Review cards
            </button>
          </div>
        </div>
      </GlassCard>
    </section>
  )
}
