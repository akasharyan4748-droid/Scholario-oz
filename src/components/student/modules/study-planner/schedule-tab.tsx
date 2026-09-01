'use client'

import { motion } from 'framer-motion'
import { CalendarClock, Coffee, Play } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { BarTrend, Donut } from '@/components/shared/charts'
import { todayPlan, plannerStats } from '@/lib/mock/study-planner'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ScheduleTab() {
  return (
    <motion.div key="sc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Timeline */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" /> Today's Study Plan
        </h3>
        <div className="relative space-y-2">
          {todayPlan.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn('flex items-center gap-3 rounded-xl border p-3', b.type === 'break' ? 'border-dashed border-border bg-muted/20' : 'border-border bg-card/40')}
            >
              <div className="shrink-0 w-16">
                <p className="text-xs font-bold tabular-nums">{b.time}</p>
                <p className="text-[9px] text-muted-foreground">{b.duration} min</p>
              </div>
              <div className="h-8 w-1 rounded-full shrink-0" style={{ background: b.color }} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', b.type === 'break' && 'text-muted-foreground italic')}>
                  {b.type === 'break' && <Coffee className="h-3.5 w-3.5 inline mr-1" />}{b.activity}
                </p>
                {b.subject && <p className="text-[11px] text-muted-foreground">{b.subject} · {b.type}</p>}
              </div>
              {b.type === 'study' && (
                <button onClick={() => toast.info(`Starting ${b.subject}`)} className="shrink-0 flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors">
                  <Play className="h-2.5 w-2.5" /> Start
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Weekly chart + time allocation */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3">Weekly Tasks</h3>
          <BarTrend data={plannerStats.weeklyTasks.map((w) => ({ name: w.day, value: w.completed }))} xKey="name" yKey="value" color="oklch(0.6 0.2 300)" height={140} />
        </GlassCard>
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3">Time by Subject</h3>
          <Donut data={plannerStats.subjectTimeAllocation.map((s) => ({ name: s.name, value: s.value, color: s.color }))} centerValue={`${plannerStats.weeklyStudyHours}h`} centerLabel="this week" height={160} />
        </GlassCard>
      </div>
    </motion.div>
  )
}
