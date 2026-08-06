'use client'

import { motion } from 'framer-motion'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { eventTasks, events } from '@/lib/mock/events'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { taskStatusConfig, priorityConfig } from './data'

export function TasksTab() {
  return (
    <motion.div key="tk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Event Tasks & Checklist</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Done</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> In Progress</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Pending</span>
          </div>
        </div>
        <div className="space-y-2">
          {eventTasks.map((task, i) => {
            const cfg = taskStatusConfig[task.status]
            const ev = events.find((e) => e.id === task.eventId)
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
              >
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.color)}>{cfg.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{task.task}</p>
                  <p className="text-[11px] text-muted-foreground">{ev?.name} · Due {formatDate(task.deadline)}</p>
                </div>
                <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase', priorityConfig[task.priority])}>{task.priority}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <GradientAvatar name={task.assignee} size="sm" />
                  <span className="text-[11px] text-muted-foreground hidden sm:block">{task.assignee.split(' ')[0]}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
