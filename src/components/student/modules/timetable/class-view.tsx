'use client'

/**
 * Student Timetable — MY CLASS view (the default).
 *
 * Immediately answers "what is my class schedule?":
 *   1. Class context (Class 2-A · active session — both derived, never typed)
 *   2. TODAY — real day + date + live NOW/NEXT intelligence
 *   3. WEEKLY — day selector over the days the school actually scheduled
 *
 * Every slot comes from the Principal's PUBLISHED timetable (live sync);
 * recent publications affecting this class surface as subtle change chips.
 */
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Clock, Sparkles, Sun, PartyPopper, RefreshCw, GraduationCap } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { type DayType, type TimetableSlot } from '@/lib/timetable/config'
import {
  getRecentChangesForClass,
  getRecentChange,
  formatTimeAgo,
  type PublishedVersion,
} from '@/lib/store/timetable-store'
import { buildDayEntries, endTimeLabel, holidayName, liveState, longDateLabel, nextScheduledDay, nowMinutes, realTodayDay, scheduledDaysForClass, startTimeLabel, type DayEntry } from './time-utils'
import { PeriodCard } from './period-card'
import { subjectColor } from './subject-colors'

function dayPillLabel(day: DayType): string {
  return day.slice(0, 3)
}

/** Live NOW/NEXT derivation for today's entries. */
function useLiveBadges(entries: DayEntry[], isToday: boolean) {
  const [nowMin, setNowMin] = useState<number | null>(null)

  useEffect(() => {
    setNowMin(nowMinutes())
    const id = setInterval(() => setNowMin(nowMinutes()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!isToday || nowMin === null) {
    return { nowMin: null, states: new Map<number, 'completed' | 'current' | 'upcoming'>(), nextPeriod: null as number | null }
  }

  const states = new Map<number, 'completed' | 'current' | 'upcoming'>()
  let nextPeriod: number | null = null
  for (const e of entries) {
    if (e.isBreak || !e.slot) continue
    const st = liveState(e, nowMin)
    if (!st) continue
    states.set(e.period, st)
    if (st === 'upcoming' && nextPeriod === null) nextPeriod = e.period
  }
  return { nowMin, states, nextPeriod }
}

export function ClassView({
  className,
  sessionLabel,
  slots,
  publications,
}: {
  className: string
  sessionLabel: string
  slots: TimetableSlot[]
  publications: PublishedVersion[]
}) {
  const todayDay = realTodayDay()
  const scheduledDays = useMemo(() => scheduledDaysForClass(slots, className), [slots, className])
  const todayEntries = useMemo(
    () => (todayDay !== 'Sunday' ? buildDayEntries(slots, todayDay) : []),
    [slots, todayDay]
  )
  const todayHoliday = useMemo(() => {
    if (todayDay === 'Sunday') return { name: 'Weekend' }
    const h = holidayName(new Date())
    return h ? { name: h } : null
  }, [todayDay])

  const defaultDay: DayType = todayDay !== 'Sunday' && scheduledDays.includes(todayDay) ? todayDay : (scheduledDays[0] ?? 'Monday')
  const [selectedDay, setSelectedDay] = useState<DayType>(defaultDay)
  const selectedEntries = useMemo(() => buildDayEntries(slots, selectedDay), [slots, selectedDay])

  // Recent published changes affecting MY class (72h TTL inside the helper)
  const recentChanges = useMemo(() => getRecentChangesForClass(className, publications), [className, publications])
  const changeBySlot = useMemo(() => {
    const m = new Map<string, NonNullable<ReturnType<typeof getRecentChange>>>()
    for (const c of recentChanges) m.set(c.slotId, c)
    return m
  }, [recentChanges])

  const { nowMin, states, nextPeriod } = useLiveBadges(todayEntries, todayEntries.length > 0)

  // Next scheduled school day (for no-class days)
  const nextDay = useMemo(
    () => nextScheduledDay(new Date(), new Set(scheduledDays)),
    [scheduledDays]
  )
  const nextDayEntries = useMemo(
    () => (nextDay ? buildDayEntries(slots, nextDay.day) : []),
    [slots, nextDay]
  )

  const mySubjectCount = useMemo(
    () => new Set(slots.filter((s) => s.className === className).map((s) => s.subject)).size,
    [slots, className]
  )

  const todaySlotsCount = todayEntries.filter((e) => !e.isBreak && e.slot).length
  const daySlotsCount = selectedEntries.filter((e) => !e.isBreak && e.slot).length

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Class context — derived from enrollment + active session */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs">
          <GraduationCap className="h-3.5 w-3.5 text-primary" aria-hidden />
          {className}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-2xs">
          {sessionLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-2xs">
          {scheduledDays.length} school days · {mySubjectCount} subjects
        </span>
        {recentChanges.length > 0 && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            title={`Timetable updated by your school — latest ${formatTimeAgo(recentChanges[0].publishedAt)}`}
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Updated {formatTimeAgo(recentChanges[0].publishedAt)}
          </span>
        )}
      </div>

      {/* ── TODAY ── */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden /> Today&apos;s Classes
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {longDateLabel(new Date())}
              {todaySlotsCount > 0 &&
                ` · ${todaySlotsCount} periods · ${startTimeLabel(todayEntries[0]?.time ?? '')} – ${endTimeLabel(todayEntries[todayEntries.length - 1]?.time ?? '')}`}
            </p>
          </div>
          {nowMin !== null && todaySlotsCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
              {formatClock(nowMin)}
            </span>
          )}
        </div>

        {todaySlotsCount > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {todayEntries.map((entry, i) => (
              <PeriodCard
                key={entry.period}
                entry={entry}
                index={i}
                live={states.get(entry.period) ?? null}
                badge={nextPeriod === entry.period ? 'next' : null}
                change={entry.slot ? changeBySlot.get(entry.slot.id) ?? null : null}
              />
            ))}
          </div>
        ) : (
          <NoClassesToday
            reason={todayHoliday?.name}
            nextDay={nextDay}
            nextDayEntries={nextDayEntries}
          />
        )}
      </GlassCard>

      {/* ── WEEKLY ── */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden /> Weekly Timetable
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {className} · {scheduledDays.length} scheduled days
          </p>
        </div>

        {/* Day selector — only the days the school actually runs this class */}
        <div role="tablist" aria-label="Select day" className="mb-4 flex flex-wrap gap-1.5">
          {scheduledDays.map((day) => {
            const isToday = day === todayDay
            const active = day === selectedDay
            return (
              <button
                key={day}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'relative min-w-[64px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {dayPillLabel(day)}
                {isToday && (
                  <span
                    className={cn(
                      'absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full',
                      active ? 'bg-primary-foreground' : 'bg-primary'
                    )}
                    title="Today"
                  />
                )}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-foreground/80">
                {selectedDay} · {daySlotsCount} periods
                {selectedEntries.length > 0 &&
                  ` · ${startTimeLabel(selectedEntries[0].time)} – ${endTimeLabel(selectedEntries[selectedEntries.length - 1].time)}`}
              </p>
              {selectedDay === todayDay && <StatusBadge status="Today" variant="primary" dot />}
              {/* Compact subject legend for the selected day */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedEntries
                  .filter((e) => e.slot)
                  .map((e) => e.slot!.subject)
                  .filter((s, i, arr) => arr.indexOf(s) === i)
                  .slice(0, 7)
                  .map((s) => (
                    <span key={s} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className={cn('h-2 w-2 rounded-full', subjectColor(s).dot)} aria-hidden />
                      {s}
                    </span>
                  ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {selectedEntries.map((entry, i) => (
                <PeriodCard
                  key={entry.period}
                  entry={entry}
                  index={i}
                  change={entry.slot ? changeBySlot.get(entry.slot.id) ?? null : null}
                />
              ))}
            </div>
            {selectedEntries.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
                No classes scheduled for {className} on {selectedDay}.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </div>
  )
}

/* ─── No-classes state (holiday / weekend / unscheduled) ───────────── */

function NoClassesToday({
  reason,
  nextDay,
  nextDayEntries,
}: {
  reason?: string
  nextDay: { day: DayType; date: Date } | null
  nextDayEntries: DayEntry[]
}) {
  const isWeekend = reason === 'Weekend'
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 px-4 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isWeekend ? <Sun className="h-5 w-5" aria-hidden /> : <PartyPopper className="h-5 w-5" aria-hidden />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">No classes today</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isWeekend ? 'Enjoy your weekend — see you back at school.' : reason ? `${reason} — a school holiday.` : 'Nothing scheduled for your class today.'}
          </p>
        </div>
      </div>
      {nextDay && nextDayEntries.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
            <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden />
            Next school day — {nextDay.day}, {nextDay.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {nextDayEntries.map((entry, i) => (
              <PeriodCard key={entry.period} entry={entry} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatClock(nowMin: number): string {
  const h24 = Math.floor(nowMin / 60)
  const min = nowMin % 60
  const mer = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(min).padStart(2, '0')} ${mer}`
}
