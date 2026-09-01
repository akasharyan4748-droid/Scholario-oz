'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin,
  ArrowUpRight, Sparkles,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { calendarEvents } from '@/lib/mock/operations'
import { formatDate } from '@/lib/format'

const eventTypeColors: Record<string, { bg: string; text: string; dot: string; gradient: string }> = {
  Cultural: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', gradient: 'from-violet-400 to-purple-500' },
  Competition: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', gradient: 'from-emerald-400 to-teal-500' },
  Meeting: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500', gradient: 'from-cyan-400 to-sky-500' },
  Exam: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', gradient: 'from-rose-400 to-pink-500' },
  Event: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', gradient: 'from-amber-400 to-orange-500' },
  Holiday: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', dot: 'bg-fuchsia-500', gradient: 'from-fuchsia-400 to-pink-500' },
  General: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground', gradient: 'from-slate-400 to-slate-500' },
}

// Build December 2024 calendar — Dec 1, 2024 is Sunday
const decemberCalendar = (() => {
  const days: { date: number | null; fullDate?: string }[] = []
  // Dec 1, 2024 is a Sunday (index 0)
  for (let i = 0; i < 0; i++) days.push({ date: null }) // No offset needed
  for (let d = 1; d <= 31; d++) {
    const fullDate = `2024-12-${String(d).padStart(2, '0')}`
    days.push({ date: d, fullDate })
  }
  return days
})()

export function CalendarModule() {
  const [selectedDate, setSelectedDate] = useState<string | null>('2024-12-15')
  const [currentMonth] = useState('December 2024')

  const eventsForDate = (date: string | undefined) => {
    if (!date) return []
    return calendarEvents.filter((e) => e.date === date)
  }

  const selectedEvents = eventsForDate(selectedDate ?? undefined)
  const upcomingEvents = calendarEvents
    .filter((e) => new Date(e.date).getTime() >= new Date('2024-11-27').getTime())
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <SectionHeading
        title="School Calendar"
        subtitle="December 2024 · Events, exams & holidays"
        icon={<CalendarDays className="h-5 w-5" />}
        action={<StatusBadge status={`${calendarEvents.filter((e) => e.date.startsWith('2024-12')).length} events this month`} variant="primary" dot />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Calendar view */}
        <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-bold">{currentMonth}</h3>
              <span className="text-xs text-muted-foreground">Demo School of Scholario</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground pb-2">{d}</div>
            ))}
            {decemberCalendar.map((day, i) => {
              if (day.date === null) {
                return <div key={i} />
              }
              const events = eventsForDate(day.fullDate)
              const isSelected = selectedDate === day.fullDate
              const isToday = day.fullDate === '2024-12-15'
              return (
                <motion.button
                  key={i}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day.fullDate ?? null)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-premium'
                      : events.length > 0
                        ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                        : 'border-transparent hover:bg-accent/50'
                  }`}
                >
                  <span className={`leading-none ${isToday && !isSelected ? 'text-primary font-bold' : ''}`}>
                    {day.date}
                  </span>
                  {isToday && !isSelected && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  {events.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {events.slice(0, 3).map((e, ei) => (
                        <span
                          key={ei}
                          className={`h-1 w-1 rounded-full ${eventTypeColors[e.type]?.dot ?? 'bg-muted-foreground'} ${isSelected ? 'bg-primary-foreground' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-3 text-[10px]">
            {Object.entries(eventTypeColors).filter(([k]) => k !== 'General').map(([type, c]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                <span className="text-muted-foreground">{type}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Selected day events */}
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            {selectedDate ? formatDate(selectedDate) : 'Select a date'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long' }) : ''}
          </p>
          <AnimatePresence mode="wait">
            {selectedEvents.length > 0 ? (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5 max-h-72 overflow-y-auto pr-1"
              >
                {selectedEvents.map((e, i) => {
                  const c = eventTypeColors[e.type] ?? eventTypeColors.General
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-border bg-card/40 p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${c.gradient} text-white`}>
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm leading-tight">{e.title}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {e.time}</span>
                          </div>
                          <div className="mt-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.bg} ${c.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                              {e.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <p className="font-semibold text-sm">No events today</p>
                <p className="text-xs text-muted-foreground mt-1">Pick another date to see events.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Upcoming events */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-primary" /> Upcoming Events
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Next 30 days</p>
          </div>
          <StatusBadge status={`${upcomingEvents.length} scheduled`} variant="info" dot />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingEvents.map((e, i) => {
            const c = eventTypeColors[e.type] ?? eventTypeColors.General
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2 }}
                className="group rounded-2xl border border-border bg-card/40 p-4 hover:shadow-premium transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-col items-center justify-center h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-md">
                    <span className="text-base font-extrabold leading-none">{new Date(e.date).getDate()}</span>
                    <span className="text-[9px] uppercase">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.bg} ${c.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {e.type}
                  </span>
                </div>
                <p className="font-semibold text-sm leading-tight">{e.title}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {e.time}
                  <span className="text-border mx-1">·</span>
                  <MapPin className="h-3 w-3" /> School Campus
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
