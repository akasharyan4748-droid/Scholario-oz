'use client'

/**
 * StudyPlannerModule — the planner shell (spec §21/§22/§52).
 *
 * One of Scholario's strongest student tools: To-do + Calendar + Goals +
 * Focus timer in one place. Advanced functionality lives INSIDE the
 * section as compact local tabs — Today · Tasks · Calendar · Goals ·
 * Focus (§52) — never as more top-level navigation.
 *
 * The header is minimal ("Study Planner / Your plan, your pace") — the
 * workspace already knows who the student is (§4 no repeated context).
 *
 * The focus timer lives in the module-level focus-store, so a running
 * session survives every tab switch; while it runs, a compact FocusPill
 * (outside the Focus tab) shows the live countdown and jumps back to it.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { StudentPageHeader } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { useFocusStore } from './focus-store'
import { PLANNER_TABS, type PlannerTab } from './shared'
import { TodayTab } from './today-tab'
import { TasksTab } from './tasks-tab'
import { CalendarTab } from './calendar-tab'
import { GoalsTab } from './goals-tab'
import { FocusTab } from './focus-tab'

function clockOf(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * FocusPill — the running-session tether. Subscribes to the countdown
 * itself (so only this tiny component re-renders each second) and hides
 * when no focus session is running or when the Focus tab is already open.
 */
function FocusPill({ onOpen }: { onOpen: () => void }) {
  const phase = useFocusStore((s) => s.phase)
  const paused = useFocusStore((s) => s.paused)
  const remainingSec = useFocusStore((s) => s.remainingSec)
  const context = useFocusStore((s) => s.context)

  if (phase !== 'focus') return null
  const label =
    context?.kind === 'task'
      ? context.title ?? 'Study task'
      : context?.kind === 'subject'
        ? [context.subject, context.topic].filter(Boolean).join(' · ')
        : 'Quick session'
  const sc = context?.subject ? subjectColor(context.subject) : null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 rounded-xl border border-violet-500/30 bg-violet-500/[0.07] px-3 py-2.5 text-left transition-colors hover:bg-violet-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
            paused ? 'bg-muted-foreground' : 'bg-violet-500',
          )}
          aria-hidden
        />
        <span
          className={cn('relative inline-flex h-2 w-2 rounded-full', paused ? 'bg-muted-foreground' : 'bg-violet-500')}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-foreground">
          {paused ? 'Focus paused' : 'Focusing'} · <span className="tabular-nums">{clockOf(remainingSec)} left</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
          {sc && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />}
          <span className="truncate">{label}</span>
        </span>
      </span>
      <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-[11px] font-semibold text-white">
        <Play className="h-3 w-3" aria-hidden />
        Open timer
      </span>
    </button>
  )
}

export function StudyPlannerModule() {
  const [tab, setTab] = useState<PlannerTab>('today')

  return (
    <div className="space-y-5 sm:space-y-6">
      <StudentPageHeader title="Study Planner" subtitle="Your plan, your pace" />

      {tab !== 'focus' && <FocusPill onOpen={() => setTab('focus')} />}

      {/* Local compact section tabs (§52) */}
      <div
        role="tablist"
        aria-label="Study planner sections"
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1"
      >
        {PLANNER_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9 sm:flex-none sm:px-4',
              tab === t.key
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <motion.div key="today" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <TodayTab onGoFocus={() => setTab('focus')} />
        </motion.div>
      )}
      {tab === 'tasks' && (
        <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <TasksTab />
        </motion.div>
      )}
      {tab === 'calendar' && (
        <motion.div key="calendar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <CalendarTab />
        </motion.div>
      )}
      {tab === 'goals' && (
        <motion.div key="goals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <GoalsTab />
        </motion.div>
      )}
      {tab === 'focus' && (
        <motion.div key="focus" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <FocusTab />
        </motion.div>
      )}
    </div>
  )
}
