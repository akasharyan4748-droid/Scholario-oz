'use client'

import { motion } from 'framer-motion'
import { CalendarDays, TrendingUp, ClipboardCheck } from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { upcomingEvents } from '@/lib/mock/operations'
import { classToppers } from '@/lib/mock/academics'

// Upcoming Events card — calendar-style vertical list of upcoming events with
// date chips and category status badges.
function UpcomingEventsCard() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" /> Upcoming Events
      </h3>
      <div className="space-y-3">
        {upcomingEvents.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-xl bg-primary/10 text-primary">
              <span className="text-xs font-bold leading-none">{new Date(e.date).getDate()}</span>
              <span className="text-[9px] uppercase">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.type} · {e.time}</p>
            </div>
            <StatusBadge status={e.type} variant={e.type === 'Exam' ? 'danger' : e.type === 'Holiday' ? 'warning' : 'primary'} />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

// Class 2-A Top Performers card — ranked list with medal emoji + gradient
// avatar + percentage score per student.
function ClassToppersCard() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-500" /> Class 2-A Top Performers
      </h3>
      <div className="space-y-2.5">
        {classToppers.map((t, i) => (
          <motion.div
            key={t.rank}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
              i === 0 ? 'bg-amber-400/20 text-amber-600' : i === 1 ? 'bg-slate-300/30 text-slate-600' : i === 2 ? 'bg-orange-400/20 text-orange-600' : 'bg-muted text-muted-foreground'
            }`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : t.rank}
            </div>
            <GradientAvatar name={t.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">Roll #{t.rollNo}</p>
            </div>
            <span className="font-display font-bold text-sm text-emerald-600">{t.percentage}%</span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

// Pending Reviews card — progress bars for homework/assignment/fee/leave
// review queues + a final admission applications count.
function PendingReviewsCard() {
  const reviews = [
    { label: 'Homework Review', done: 14, total: 18, color: 'oklch(0.6 0.18 300)' },
    { label: 'Assignment Grading', done: 9, total: 18, color: 'oklch(0.65 0.16 75)' },
    { label: 'Fee Approvals', done: 7, total: 12, color: 'oklch(0.62 0.2 25)', pendingLabel: '7 pending' },
    { label: 'Leave Requests', done: 3, total: 8, color: 'oklch(0.7 0.15 200)', pendingLabel: '3 pending' },
  ]
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-violet-500" /> Pending Reviews
      </h3>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium">{r.label}</span>
              <span className="text-muted-foreground">{r.pendingLabel ?? `${r.done} / ${r.total}`}</span>
            </div>
            <ProgressBar value={r.done} max={r.total} color={r.color} />
          </div>
        ))}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Admission Applications</span>
            <span className="font-display font-bold text-lg">23</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// EventsRow — composes the three side-by-side cards (Upcoming Events,
// Class Top Performers, Pending Reviews) in a single responsive grid row.
export function EventsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <UpcomingEventsCard />
      <ClassToppersCard />
      <PendingReviewsCard />
    </div>
  )
}
