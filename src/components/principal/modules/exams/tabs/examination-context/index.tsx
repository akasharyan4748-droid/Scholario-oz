'use client'

/**
 * ExaminationContext — context-aware academic status area.
 *
 * Replaces the old static "Current Examination" card.
 * Shows LIVE / UPCOMING / PERFORMANCE based on real schedule data.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, User, Calendar, Radio, ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExamDTO } from '@/lib/exams/types'
import { resolveExamContext, type ExamContext, type ScheduleItemContext } from './resolver'

interface Props {
  exams: ExamDTO[]
  onSelectExam: (id: string) => void
  onNavigate?: (s: string) => void
  className?: string
  classPerformance?: Array<{ className: string; averagePercentage: number }> | null
}

export function ExaminationContext({ exams, onSelectExam, onNavigate, classPerformance }: Props) {
  const ctx = resolveExamContext(exams)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={ctx.state}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {ctx.state === 'LIVE' && (
          <LiveExamination ctx={ctx} onSelectExam={onSelectExam} />
        )}
        {ctx.state === 'UPCOMING' && (
          <UpcomingExamination ctx={ctx} onSelectExam={onSelectExam} onNavigate={onNavigate} />
        )}
        {ctx.state === 'PERFORMANCE' && (
          <SessionPerformance ctx={ctx} onSelectExam={onSelectExam} onNavigate={onNavigate} classPerformance={classPerformance} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── LIVE ────────────────────────────────────────────────────────────

function LiveExamination({ ctx, onSelectExam }: { ctx: ExamContext; onSelectExam: (id: string) => void }) {
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const running = ctx.todaysSchedule.filter((s) => s.status === 'running')
  const upcomingToday = ctx.todaysSchedule.filter((s) => s.status === 'upcoming_today')
  const completedToday = ctx.todaysSchedule.filter((s) => s.status === 'completed_today')

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">Live Examination</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{todayLabel}</span>
      </div>

      {ctx.exam && (
        <div className="mb-3">
          <h2 className="font-display text-base font-bold tracking-tight">{ctx.exam.name}</h2>
          <p className="text-[11px] text-muted-foreground">{ctx.exam.type} · {ctx.exam.classes.map((c) => c.className).join(', ') || '—'}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-1">
        {ctx.todaysSchedule.map((item, i) => (
          <TimelineItem key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* Action */}
      {ctx.exam && (
        <div className="flex justify-end mt-3 pt-3 border-t border-border/40">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onSelectExam(ctx.exam!.id)}>
            Open Examination <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

function TimelineItem({ item, index }: { item: ScheduleItemContext; index: number }) {
  const isRunning = item.status === 'running'
  const isCompleted = item.status === 'completed_today'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className={cn(
        'flex items-start gap-3 p-2.5 rounded-lg border transition-colors',
        isRunning && 'border-emerald-500/30 bg-emerald-500/5',
        !isRunning && !isCompleted && 'border-border/60',
        isCompleted && 'border-border/40 opacity-60',
      )}
    >
      {/* Time */}
      <div className="shrink-0 text-right w-16">
        <p className="text-[10px] font-semibold tabular-nums">{item.startTime}</p>
        <p className="text-[9px] text-muted-foreground tabular-nums">{item.endTime}</p>
      </div>

      {/* Vertical line */}
      <div className={cn('w-px self-stretch', isRunning ? 'bg-emerald-500/40' : 'bg-border')} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold truncate">{item.subjectName ?? '—'}</p>
          {isRunning && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> LIVE
            </span>
          )}
          {!isRunning && !isCompleted && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 shrink-0">Upcoming</span>
          )}
          {isCompleted && (
            <span className="text-[9px] text-muted-foreground shrink-0">Done</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="truncate">{item.className}</span>
          {item.room && (
            <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {item.room}</span>
          )}
          {item.invigilatorName && (
            <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" /> {item.invigilatorName}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── UPCOMING ────────────────────────────────────────────────────────

function UpcomingExamination({ ctx, onSelectExam, onNavigate }: {
  ctx: ExamContext
  onSelectExam: (id: string) => void
  onNavigate?: (s: string) => void
}) {
  const exam = ctx.nextExam
  if (!exam) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-sky-500" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">Upcoming Examination</span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold tracking-tight truncate">{exam.name}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {exam.type} · {exam.classes.map((c) => c.className).join(', ') || '—'}
          </p>
          {exam.startDate && exam.endDate && (
            <p className="text-[11px] text-muted-foreground">{formatDate(exam.startDate)} — {formatDate(exam.endDate)}</p>
          )}
        </div>
        {ctx.daysUntilNext !== null && (
          <div className="text-right shrink-0">
            <p className="font-display text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
              {ctx.daysUntilNext === 0 ? 'Today' : ctx.daysUntilNext === 1 ? '1 day' : `${ctx.daysUntilNext}d`}
            </p>
            <p className="text-[9px] text-muted-foreground">{ctx.daysUntilNext === 0 ? 'starting soon' : 'until start'}</p>
          </div>
        )}
      </div>

      {/* Upcoming papers */}
      {ctx.upcomingPapers.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Scheduled Papers</p>
          <div className="space-y-1">
            {ctx.upcomingPapers.slice(0, 4).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 p-1.5 rounded border border-border/40 text-[10px]"
              >
                <div className="flex flex-col items-center w-10 shrink-0">
                  <span className="text-[8px] uppercase text-muted-foreground">{formatMonth(p.date)}</span>
                  <span className="font-display text-sm font-bold">{formatDay(p.date)}</span>
                </div>
                <span className="font-medium truncate flex-1">{p.subjectName ?? '—'}</span>
                <span className="text-muted-foreground tabular-nums">{p.startTime}</span>
                <span className="text-muted-foreground">{p.className}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Readiness */}
      <ReadinessPanel readiness={ctx.readiness} />

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onSelectExam(exam.id)}>
          Open Examination <ArrowRight className="h-3 w-3" />
        </Button>
        {onNavigate && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onNavigate('schedule')}>
            View Schedule <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

function ReadinessPanel({ readiness }: { readiness: ExamContext['readiness'] }) {
  const items = [
    { label: 'Timetable', done: readiness.schedule },
    { label: 'Rooms', done: readiness.rooms },
    { label: 'Invigilators', done: readiness.invigilators },
    { label: 'Seating', done: readiness.seating },
    { label: 'Marks Setup', done: readiness.marksSetup },
  ]
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Exam Readiness</span>
        <span className="text-[10px] font-bold tabular-nums">{readiness.overallPct}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted/60 overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${readiness.overallPct}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn('h-full rounded-full', readiness.overallPct >= 80 ? 'bg-emerald-500' : 'bg-amber-500')}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <span key={item.label} className="text-[9px] flex items-center gap-0.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', item.done ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── PERFORMANCE (no live/upcoming) ──────────────────────────────────

function SessionPerformance({ ctx, onSelectExam, onNavigate, classPerformance }: {
  ctx: ExamContext
  onSelectExam: (id: string) => void
  onNavigate?: (s: string) => void
  classPerformance?: Array<{ className: string; averagePercentage: number }> | null
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Session Performance</span>
        {ctx.nextExam && ctx.daysUntilNext !== null && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            Next exam in {ctx.daysUntilNext}d
          </span>
        )}
      </div>

      {ctx.nextExam ? (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">No examination is currently active.</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{ctx.nextExam.name}</span> starts in {ctx.daysUntilNext} days.
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 mt-2" onClick={() => onSelectExam(ctx.nextExam!.id)}>
            Open Examination <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">No examinations scheduled in the near term.</p>
      )}

      {/* Class-wise performance */}
      {classPerformance && classPerformance.length > 0 && (
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Class-wise Average</p>
          <div className="space-y-1">
            {classPerformance.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-foreground w-24 shrink-0 truncate">{c.className}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.averagePercentage}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <span className="text-[10px] font-semibold tabular-nums w-10 text-right">{c.averagePercentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onNavigate && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onNavigate('results')}>
            View Performance <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short' })
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '—' : String(d.getDate())
}
