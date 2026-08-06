'use client'

import { motion } from 'framer-motion'
import { CalendarCheck, TrendingUp, CheckCircle2, XCircle, Clock, PartyPopper } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { ChartCard, AreaTrend, RadialGauge, ProgressBar } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { studentAttendanceCalendar } from '@/lib/mock/attendance'
import { formatDate } from '@/lib/format'

const presentCount = studentAttendanceCalendar.filter((d) => d.status === 'present').length
const lateCount = studentAttendanceCalendar.filter((d) => d.status === 'late').length
const absentCount = studentAttendanceCalendar.filter((d) => d.status === 'absent').length
const holidayCount = studentAttendanceCalendar.filter((d) => d.status === 'holiday').length
const totalDays = studentAttendanceCalendar.length
const attendancePct = Math.round(((presentCount + lateCount) / totalDays) * 100)

const trendData = [
  { name: 'Jun', v: 95 }, { name: 'Jul', v: 94 }, { name: 'Aug', v: 92 },
  { name: 'Sep', v: 95 }, { name: 'Oct', v: 93 }, { name: 'Nov', v: 93 },
]

// Build a November 2024 calendar (1 = Friday)
const novCalendar = (() => {
  const days: { date: number | null; status?: string; fullDate?: string }[] = []
  for (let i = 0; i < 5; i++) days.push({ date: null }) // Nov 1, 2024 is Friday (index 4 in Sun=0)
  for (let d = 1; d <= 30; d++) {
    const fullDate = `2024-11-${String(d).padStart(2, '0')}`
    const entry = studentAttendanceCalendar.find((e) => e.date === fullDate)
    days.push({ date: d, status: entry?.status, fullDate })
  }
  return days
})()

const statusColors: Record<string, string> = {
  present: 'bg-emerald-500 text-white',
  late: 'bg-amber-500 text-white',
  absent: 'bg-rose-500 text-white',
  holiday: 'bg-muted text-muted-foreground',
}

const statusRings: Record<string, string> = {
  present: 'ring-emerald-500/30',
  late: 'ring-amber-500/30',
  absent: 'ring-rose-500/30',
}

export function AttendanceModule() {
  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Attendance"
        subtitle="November 2024 · Class 2-A"
        icon={<CalendarCheck className="h-5 w-5" />}
        action={<StatusBadge status="Excellent" variant="success" dot />}
      />

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-1">Attendance Rate</h3>
          <p className="text-xs text-muted-foreground mb-3">Overall this month</p>
          <div className="flex items-center justify-center">
            <RadialGauge value={attendancePct} label="present" size={180} color="oklch(0.55 0.14 162)" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+1.4%</span>
            <span className="text-muted-foreground">vs last month (92%)</span>
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4">Status Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="rounded-2xl bg-emerald-500/10 p-4 text-center"
            >
              <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedCounter value={presentCount} />
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Present Days</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl bg-amber-500/10 p-4 text-center"
            >
              <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-2">
                <Clock className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
                <AnimatedCounter value={lateCount} />
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Late Arrivals</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="rounded-2xl bg-rose-500/10 p-4 text-center"
            >
              <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 mb-2">
                <XCircle className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-rose-600 dark:text-rose-400">
                <AnimatedCounter value={absentCount} />
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Absent Days</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="rounded-2xl bg-violet-500/10 p-4 text-center"
            >
              <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 mb-2">
                <PartyPopper className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-violet-600 dark:text-violet-400">
                <AnimatedCounter value={holidayCount} />
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Holidays</p>
            </motion.div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">School working days</span>
              <span className="font-semibold">{totalDays - holidayCount} days</span>
            </div>
            <ProgressBar value={attendancePct} color="oklch(0.55 0.14 162)" height={8} />
          </div>
        </GlassCard>
      </div>

      {/* Monthly calendar heatmap */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">November 2024 — Attendance Calendar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily attendance heatmap</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500" /> Present</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500" /> Late</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-500" /> Absent</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-muted" /> Holiday</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground pb-1">{d}</div>
          ))}
          {novCalendar.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.005 }}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium ${
                day.date === null
                  ? 'bg-transparent'
                  : day.status
                    ? `${statusColors[day.status]} ${statusRings[day.status] ?? ''} ring-1`
                    : 'bg-card/40 border border-border text-muted-foreground'
              }`}
              title={day.fullDate ? `${day.fullDate} · ${day.status ?? 'no record'}` : ''}
            >
              {day.date !== null && (
                <>
                  <span className="leading-none">{day.date}</span>
                  {day.status === 'present' && <CheckCircle2 className="h-2.5 w-2.5 mt-0.5 opacity-80" />}
                  {day.status === 'late' && <Clock className="h-2.5 w-2.5 mt-0.5 opacity-80" />}
                  {day.status === 'absent' && <XCircle className="h-2.5 w-2.5 mt-0.5 opacity-80" />}
                </>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Trend chart + recent records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard
          title="Monthly Attendance Trend"
          subtitle="Last 6 months"
          className="lg:col-span-2"
          action={<StatusBadge status="Above 90%" variant="success" dot />}
        >
          <AreaTrend data={trendData} xKey="name" yKey="v" color="oklch(0.55 0.14 162)" height={260} gradientId="attTr" />
        </ChartCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4">Recent Records</h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {[...studentAttendanceCalendar].reverse().slice(0, 7).map((d, i) => {
              const variant = d.status === 'present' ? 'success' : d.status === 'late' ? 'warning' : d.status === 'absent' ? 'danger' : 'neutral'
              return (
                <motion.div
                  key={d.date}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusColors[d.status] ?? 'bg-muted'}`}>
                      {d.status === 'present' && <CheckCircle2 className="h-4 w-4" />}
                      {d.status === 'late' && <Clock className="h-4 w-4" />}
                      {d.status === 'absent' && <XCircle className="h-4 w-4" />}
                      {d.status === 'holiday' && <PartyPopper className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatDate(d.date)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={d.status} variant={variant} dot />
                </motion.div>
              )
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
