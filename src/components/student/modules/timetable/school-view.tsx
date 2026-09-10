'use client'

/**
 * Student Timetable — SCHOOL MASTER view (read-only).
 *
 * "If I want to see what is happening across the school, I can."
 * Student-friendly discovery over the SAME published timetable the
 * Principal manages — never the Principal's administrative grid and NEVER
 * an editing control in sight (view-only by design; the role's permissions
 * are enforced server-side in the API layer).
 *
 * Two scannable modes:
 *   - By Day: day selector → every class's schedule for that day
 *   - Full Week: the whole school week grouped day → class
 */
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, CalendarDays, Eye, LayoutList, CalendarRange, User, MapPin } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { DAYS, type DayType, type TimetableSlot } from '@/lib/timetable/config'
import { endTimeLabel, realTodayDay, startTimeLabel } from './time-utils'
import { subjectColor } from './subject-colors'

type Mode = 'day' | 'week'

export function SchoolView({ slots }: { slots: TimetableSlot[] }) {
  const todayDay = realTodayDay()
  const schoolDays = useMemo(() => {
    const present = new Set(slots.map((s) => s.day))
    return DAYS.filter((d) => present.has(d))
  }, [slots])
  // Unique class names in school order — plain derivation (the React
  // Compiler memoizes it; a manual useMemo with sort() cannot be preserved).
  const classes = (() => {
    const seen: string[] = []
    for (const s of slots) {
      if (!seen.includes(s.className)) seen.push(s.className)
    }
    return seen.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  })()

  const defaultDay: DayType = todayDay !== 'Sunday' && schoolDays.includes(todayDay) ? todayDay : (schoolDays[0] ?? 'Monday')
  const [selectedDay, setSelectedDay] = useState<DayType>(defaultDay)
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [mode, setMode] = useState<Mode>('day')

  const visibleSlots = useMemo(
    () => (selectedClass === 'all' ? slots : slots.filter((s) => s.className === selectedClass)),
    [slots, selectedClass]
  )

  const dayGroups = useMemo(() => groupByClass(visibleSlots, selectedDay), [visibleSlots, selectedDay])

  if (slots.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden />
        <p className="text-sm font-semibold">School timetable not published yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your school has not published a master timetable — check back soon.
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Read-only intent — set once, quietly */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-2xs">
          <Eye className="h-3.5 w-3.5 text-primary" aria-hidden />
          View only · managed by your school
        </span>
        <div className="inline-flex overflow-hidden rounded-lg border border-border bg-card p-0.5 shadow-2xs" role="tablist" aria-label="Timetable scope">
          <button
            role="tab"
            aria-selected={mode === 'day'}
            onClick={() => setMode('day')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              mode === 'day' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutList className="h-3.5 w-3.5" aria-hidden /> By Day
          </button>
          <button
            role="tab"
            aria-selected={mode === 'week'}
            onClick={() => setMode('week')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              mode === 'week' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CalendarRange className="h-3.5 w-3.5" aria-hidden /> Full Week
          </button>
        </div>
      </div>

      {/* Filters — only what genuinely helps a student scan the school */}
      <GlassCard className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Select day">
            {schoolDays.map((day) => {
              const isToday = day === todayDay
              const active = mode === 'day' && day === selectedDay
              return (
                <button
                  key={day}
                  role="tab"
                  aria-selected={active}
                  disabled={mode !== 'day'}
                  onClick={() => { setMode('day'); setSelectedDay(day) }}
                  className={cn(
                    'relative min-w-[56px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-45',
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {day.slice(0, 3)}
                  {isToday && (
                    <span className={cn('absolute right-1 top-1 h-1.5 w-1.5 rounded-full', active ? 'bg-primary-foreground' : 'bg-primary')} title="Today" />
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter class">
            <button
              role="tab"
              aria-selected={selectedClass === 'all'}
              onClick={() => setSelectedClass('all')}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all',
                selectedClass === 'all'
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              All Classes
            </button>
            {classes.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={selectedClass === c}
                onClick={() => setSelectedClass(c)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all',
                  selectedClass === c
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ── BY DAY ── */}
      {mode === 'day' && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDay}-${selectedClass}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="text-sm font-semibold">{selectedDay}</h3>
              <span className="text-xs text-muted-foreground">
                {dayGroups.length > 0 ? `${dayGroups.length} class${dayGroups.length === 1 ? '' : 'es'} scheduled` : 'no classes scheduled'}
              </span>
            </div>
            {dayGroups.map((g) => (
              <ClassSection key={g.className} className={g.className} slots={g.slots} />
            ))}
            {dayGroups.length === 0 && (
              <GlassCard className="px-4 py-8 text-center text-xs text-muted-foreground">
                No timetable entries for {selectedClass === 'all' ? 'any class' : selectedClass} on {selectedDay}.
              </GlassCard>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── FULL WEEK ── */}
      {mode === 'week' && (
        <div className="space-y-3">
          {schoolDays.map((day) => {
            const groups = groupByClass(visibleSlots, day)
            if (groups.length === 0) return null
            return (
              <GlassCard key={day} className="p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className={cn('text-sm font-semibold', day === todayDay && 'text-primary')}>{day}</h3>
                  {day === todayDay && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Today</span>
                  )}
                  <span className="text-xs text-muted-foreground">{groups.length} classes</span>
                </div>
                <div className="space-y-3">
                  {groups.map((g) => (
                    <ClassSection key={g.className} className={g.className} slots={g.slots} embedded />
                  ))}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Class group with compact scannable rows ───────────────────────── */

function ClassSection({ className, slots, embedded }: { className: string; slots: TimetableSlot[]; embedded?: boolean }) {
  const sorted = [...slots].sort((a, b) => a.period - b.period)
  const first = startTimeLabel(sorted[0].time)
  const last = endTimeLabel(sorted[sorted.length - 1].time)
  return (
    <GlassCard className={cn('p-3 sm:p-4', embedded && 'bg-card/60 p-3')}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary" aria-hidden>
            {className.replace(/^Class /, '')}
          </span>
          <p className="text-sm font-semibold">{className}</p>
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {sorted.length} periods · {first} – {last}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((s, i) => {
          const sc = subjectColor(s.subject)
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className={cn('flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2', sc.bg, 'ring-1', sc.ring)}
              aria-label={`${s.subject}, ${s.time}, ${s.teacherName}, ${s.room}, ${className}`}
            >
              <span className="w-16 shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {startTimeLabel(s.time)}
              </span>
              <span className={cn('min-w-0 flex-1 truncate text-xs font-semibold', sc.text)}>{s.subject}</span>
              <span className="hidden min-w-0 items-center gap-0.5 text-[10px] text-muted-foreground sm:flex">
                <User className="h-2.5 w-2.5 shrink-0" aria-hidden />
                <span className="max-w-[90px] truncate">{s.teacherName}</span>
              </span>
              <span className="hidden min-w-0 items-center gap-0.5 text-[10px] text-muted-foreground lg:flex">
                <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                <span className="max-w-[80px] truncate">{s.room}</span>
              </span>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}

function groupByClass(slots: TimetableSlot[], day: DayType): { className: string; slots: TimetableSlot[] }[] {
  const map = new Map<string, TimetableSlot[]>()
  for (const s of slots) {
    if (s.day !== day) continue
    const arr = map.get(s.className) ?? []
    arr.push(s)
    map.set(s.className, arr)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([className, ss]) => ({ className, slots: ss }))
}
