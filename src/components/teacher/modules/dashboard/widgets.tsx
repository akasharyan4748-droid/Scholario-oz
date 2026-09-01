'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Clock, CheckCircle2, AlertCircle, FileText, ClipboardList, Users } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { RadialGauge } from '@/components/shared/charts'
import { recentActivity } from './data'

const activityIconMap: Record<string, React.ReactNode> = {
  CheckCircle2: <CheckCircle2 className="h-3.5 w-3.5" />,
  AlertCircle: <AlertCircle className="h-3.5 w-3.5" />,
  FileText: <FileText className="h-3.5 w-3.5" />,
  ClipboardList: <ClipboardList className="h-3.5 w-3.5" />,
  Users: <Users className="h-3.5 w-3.5" />,
}

export function CalendarWidget() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" /> November 2024
      </h3>
      <MiniCalendar />
    </GlassCard>
  )
}

export function AttendanceGauge() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-1">My Attendance</h3>
      <p className="text-xs text-muted-foreground mb-4">This academic year</p>
      <div className="flex items-center justify-center">
        <RadialGauge value={98} label="present" size={170} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mt-4">
        <div className="rounded-xl bg-emerald-500/10 py-2">
          <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">196</p>
          <p className="text-[10px] text-muted-foreground">Present</p>
        </div>
        <div className="rounded-xl bg-rose-500/10 py-2">
          <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">4</p>
          <p className="text-[10px] text-muted-foreground">Absent</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 py-2">
          <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">0</p>
          <p className="text-[10px] text-muted-foreground">Late</p>
        </div>
      </div>
    </GlassCard>
  )
}

export function RecentActivity() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recentActivity.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-3"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.color}`}>
              {activityIconMap[a.icon]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{a.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{a.desc}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {a.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

function MiniCalendar() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  // November 2024 starts on Friday (index 5)
  const startOffset = 5
  const totalDays = 30
  const today = 27
  const eventDays = [7, 12, 15, 20, 26]
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center rounded-md text-xs relative ${
              c === null ? '' :
              c === today ? 'bg-primary text-primary-foreground font-bold' :
              eventDays.includes(c) ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium' :
              'hover:bg-accent cursor-pointer'
            }`}
          >
            {c}
            {c !== null && eventDays.includes(c) && c !== today && (
              <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-amber-500" />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-[10px]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Today</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Event</span>
      </div>
    </div>
  )
}
