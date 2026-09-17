'use client'

/**
 * TimetableModule — the student's personal, LIVE view of the school's
 * canonical master timetable.
 *
 * Architecture (single source of truth — spec §10/§33):
 *   The Principal edits the timetable in THEIR workspace and PUBLISHES it.
 *   This module reads `publishedSlots` + `publications` from the SAME
 *   canonical zustand store (`scholario-timetable-store`). Principal
 *   publishes → this view updates automatically. There is NO parallel
 *   student schedule dataset and NO student-side mutation surface: only
 *   state selectors are imported — never store actions — and the student
 *   app has no API route that can write timetable data (read-only by
 *   construction, enforced server-side by role isolation).
 *
 * Design (Principal language, student purpose — spec §1/§3/§31):
 *   - NO redundant page title — the app header already says "Timetable".
 *     Content opens with a context row (class · session) like the
 *     Principal workspace does.
 *   - Default view: MY CLASS (personal schedule). Secondary read-only
 *     SCHOOL view with light Class/Day filters (§8/§9).
 *   - TODAY is the primary experience: live NOW/NEXT states, breaks are
 *     visually neutral, unassigned periods render honest free rows (§4-§5).
 *   - Recent-change awareness: a calm one-line strip + per-card UPDATED
 *     chips (old → new) that auto-expire after 72h from the publication
 *     timestamp (§11/§12).
 *   - Only days the school actually scheduled appear in the day selector
 *     (§7); weekend/holiday shows a polished state + next school day (§16).
 *   - Subject colors are consistent everywhere via shared/timetable-utils.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, CalendarDays, Clock, Coffee, GraduationCap, History,
  MapPin, Printer, Sparkles, User, UserCheck, UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useTimetableStore,
  getRecentChange,
  formatTimeAgo,
  type PublishedVersion,
  type TimetableChange,
} from '@/components/principal/modules/timetable/timetable-store'
import { CLASSES } from '@/components/principal/modules/timetable/data'
import { useStudentsStore } from '@/lib/store/students-store'
import { DEMO_STUDENT_ID } from './applications/student'
import { Panel, SegmentedTabs, StudentEmptyState, StudentPage } from './shared/kit'
import {
  PERIODS,
  buildDayTimeline,
  classKeyOf,
  compactClock,
  configuredDays,
  nextSchoolDayFrom,
  parseRangeMinutes,
  periodStateOf,
  subjectColor,
  type DayTimelineEntry,
  type DayType,
  type PeriodState,
  type TimetableSlot,
} from './shared/timetable-utils'
import { ACTIVE_SESSION_ID, formatSessionLabel } from '@/lib/academic-session'

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000

type ViewMode = 'my-class' | 'school'

// ── Updated chip (spec §11/§12 — subtle, old → new, auto-expiring) ──────

function UpdatedChip({ change }: { change: TimetableChange }) {
  const timeAgo = formatTimeAgo(change.publishedAt)
  return (
    <span
      title={`${change.summary} · ${timeAgo}`}
      className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300"
    >
      <History className="h-2.5 w-2.5" />
      <span className="truncate max-w-[140px] sm:max-w-[180px]">{change.changeLabel ?? 'Updated'}</span>
    </span>
  )
}

// ── Timeline entry card (Today + Weekly — the personal card language) ──

function TimelineEntryCard({
  entry, index, state, nextKey, publications,
}: {
  entry: DayTimelineEntry
  index: number
  /** Live clock state — only passed when rendering a day that IS today. */
  state?: PeriodState
  /** Key of the next upcoming teaching entry (drives the NEXT pill). */
  nextKey?: string
  publications: PublishedVersion[]
}) {
  const { period } = entry
  const isCurrent = state === 'current'
  const isDone = state === 'done'
  const isNext = state === 'upcoming' && nextKey === entry.key
  const range = parseRangeMinutes(period.time)

  // ── Break rows: neutral, dashed, never look like subjects (§4) ──
  if (entry.kind === 'break') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.24) }}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-2.5',
          isCurrent && 'border-emerald-500/40 bg-emerald-500/5',
          isDone && 'opacity-60',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {period.breakType === 'lunch' ? <UtensilsCrossed className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{period.name}</p>
          <p className="text-[11px] text-muted-foreground/80 tabular-nums">
            {compactClock(period.time.split(' - ')[0])} – {compactClock(period.time.split(' - ')[1])}
          </p>
        </div>
      </motion.div>
    )
  }

  // ── Free rows: honest, quiet — the period exists but nothing is scheduled ──
  if (entry.kind === 'free') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.24) }}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/20 p-2.5',
          isDone && 'opacity-55',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/50 text-[9px] font-bold text-muted-foreground/60 tabular-nums">
          {compactClock(period.time.split(' - ')[0] ?? period.time)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground/70">Free period</p>
          <p className="text-[11px] text-muted-foreground/60">No class scheduled</p>
        </div>
      </motion.div>
    )
  }

  // ── Teaching card (subject color = recognition, not decoration — §6) ──
  const slot = entry.slot!
  const sc = subjectColor(slot.subject)
  const change = getRecentChange(slot.id, publications)
  const clock = compactClock(range ? period.time.split(' - ')[0] ?? period.time : period.time)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.24) }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-xs',
        isCurrent
          ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/30'
          : `${sc.bg} border-transparent ring-1 ${sc.ring}`,
        change && !isCurrent && 'border-emerald-500/25',
        isDone && 'opacity-55 grayscale-[30%]',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md',
          sc.gradient,
          isDone && 'grayscale-[40%]',
        )}
      >
        <span className="text-[10px] font-bold leading-tight text-center tabular-nums">{clock}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <p className={cn('font-semibold text-sm truncate', sc.text)}>{slot.subject}</p>
          {isCurrent && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Now
            </span>
          )}
          {isNext && (
            <span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Next
            </span>
          )}
          {change && <UpdatedChip change={change} />}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          {slot.teacherName && (
            <span className="flex items-center gap-0.5 min-w-0">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{slot.teacherName}</span>
            </span>
          )}
          {slot.room && (
            <span className="flex items-center gap-0.5 min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{slot.room}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── School view card — the Principal's calm administrative card language,
//    read-only (type-tinted: Lab violet / Sports teal / Lecture primary) ──

function SchoolSlotCard({ slot }: { slot: TimetableSlot }) {
  const isLab = slot.type === 'Lab'
  const isSports = slot.type === 'Sports'
  return (
    <div
      className={cn(
        'rounded-lg border p-2',
        isLab
          ? 'border-violet-500/20 bg-violet-500/5'
          : isSports
            ? 'border-teal-500/20 bg-teal-500/5'
            : 'border-primary/20 bg-primary/5',
      )}
    >
      <p
        className={cn(
          'font-bold text-[11px] truncate',
          isLab ? 'text-violet-700 dark:text-violet-300' : isSports ? 'text-teal-700 dark:text-teal-300' : 'text-primary',
        )}
      >
        {slot.subject}
      </p>
      {slot.teacherName && (
        <p className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-foreground">
          <UserCheck className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{slot.teacherName}</span>
        </p>
      )}
      {slot.room && (
        <p className="mt-0.5 flex items-center gap-0.5 text-[9px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{slot.room}</span>
        </p>
      )}
    </div>
  )
}

// ── Printable personal timetable (results-module print pattern, §25) ────

function buildPrintableTimetableHTML(
  classKey: string,
  sessionLabel: string,
  days: { day: string; timeline: DayTimelineEntry[] }[],
): string {
  const daySections = days
    .map(({ day, timeline }) => {
      const rows = timeline
        .map((entry) => {
          if (entry.kind === 'break') {
            return `<tr class="break"><td>${entry.period.time}</td><td colspan="3">${entry.period.name}</td></tr>`
          }
          if (entry.kind === 'free') {
            return `<tr><td>${entry.period.time}</td><td colspan="3" class="free">Free period — no class scheduled</td></tr>`
          }
          const s = entry.slot!
          return `<tr><td>${entry.period.time}</td><td class="subj">${s.subject}</td><td>${s.teacherName ?? ''}</td><td>${s.room ?? ''}</td></tr>`
        })
        .join('')
      return `<h2>${day}</h2><table><thead><tr><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead><tbody>${rows}</tbody></table>`
    })
    .join('')

  return `<!doctype html><html><head><meta charset="utf-8"><title>${classKey} Timetable</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 28px; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0; }
  .sub { color: #666; font-size: 12px; margin: 4px 0 18px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #444; margin: 18px 0 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; border-bottom: 1.5px solid #333; padding: 4px 6px; }
  td { border-bottom: 1px solid #e2e2e2; padding: 5px 6px; }
  td:first-child { white-space: nowrap; color: #555; font-variant-numeric: tabular-nums; width: 130px; }
  .subj { font-weight: 700; }
  tr.break td { background: #f5f5f4; color: #777; font-style: italic; }
  .free { color: #999; font-style: italic; }
  @media print { body { padding: 12px; } h2 { page-break-after: avoid; } table { page-break-inside: avoid; } }
</style></head><body>
<h1>${classKey} — Weekly Timetable</h1>
<p class="sub">Scholario · ${sessionLabel}</p>
${daySections}
</body></html>`
}

// ── Module ──────────────────────────────────────────────────────────────

export function TimetableModule() {
  const [view, setView] = useState<ViewMode>('my-class')

  // Canonical, READ-ONLY selectors — the Principal's published snapshot.
  // (No store actions are ever imported into the Student app — §28.)
  const publishedSlots = useTimetableStore((s) => s.publishedSlots)
  const publications = useTimetableStore((s) => s.publications)

  const student = useStudentsStore((st) => st.students.find((x) => x.id === DEMO_STUDENT_ID))
  const now = new Date()
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }) as DayType | 'Sunday'
  const sessionLabel = formatSessionLabel(ACTIVE_SESSION_ID)

  if (!student) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading timetable" />
      </div>
    )
  }

  return (
    <StudentPage>
      {/* Context row — no redundant page title (the app header says
          "Timetable"); this row carries the personal scope instead (§1/§3). */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{classKeyOf(student)}</p>
          <p className="text-xs text-muted-foreground truncate">{sessionLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedTabs
            tabs={[
              { value: 'my-class', label: 'My Class', icon: <GraduationCap className="h-3.5 w-3.5" /> },
              { value: 'school', label: 'School Timetable', icon: <Building2 className="h-3.5 w-3.5" /> },
            ]}
            value={view}
            onValueChange={setView}
          />
          {view === 'my-class' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => handlePrint(classKeyOf(student), sessionLabel, publishedSlots)}
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          )}
        </div>
      </div>

      {view === 'my-class' ? (
        <MyClassView
          classKey={classKeyOf(student)}
          publishedSlots={publishedSlots}
          publications={publications}
          dayName={dayName}
          now={now}
        />
      ) : (
        <SchoolView publishedSlots={publishedSlots} dayName={dayName} />
      )}
    </StudentPage>
  )
}

function handlePrint(classKey: string, sessionLabel: string, publishedSlots: TimetableSlot[]) {
  const days = configuredDays(publishedSlots, classKey).map((day) => ({
    day,
    timeline: buildDayTimeline(publishedSlots, day, classKey),
  }))
  if (days.length === 0) {
    toast.error('No timetable to print yet')
    return
  }
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    toast.error('Popup blocked — allow popups to print your timetable')
    return
  }
  win.document.write(buildPrintableTimetableHTML(classKey, sessionLabel, days))
  win.document.close()
  win.focus()
  setTimeout(() => {
    try {
      win.print()
    } catch {
      // The user can still print manually from the opened window.
    }
  }, 300)
}

// ── MY CLASS view (default — the personal schedule) ─────────────────────

function MyClassView({
  classKey, publishedSlots, publications, dayName, now,
}: {
  classKey: string
  publishedSlots: TimetableSlot[]
  publications: PublishedVersion[]
  dayName: string
  now: Date
}) {
  const mySlots = useMemo(
    () => publishedSlots.filter((s) => s.className === classKey),
    [publishedSlots, classKey],
  )
  const myDays = useMemo(() => configuredDays(mySlots), [mySlots])
  const defaultDay: DayType = myDays.includes(dayName as DayType) ? (dayName as DayType) : (myDays[0] ?? 'Monday')
  const [activeDay, setActiveDay] = useState<DayType>(defaultDay)

  const todayTimeline = useMemo(
    () => buildDayTimeline(publishedSlots, dayName, classKey),
    [publishedSlots, dayName, classKey],
  )
  const activeTimeline = useMemo(
    () => buildDayTimeline(publishedSlots, activeDay, classKey),
    [publishedSlots, activeDay, classKey],
  )

  const todayTeaching = todayTimeline.filter((e) => e.kind === 'teaching')
  const allDone = todayTeaching.length > 0 && todayTeaching.every((e) => periodStateOf(parseRangeMinutes(e.period.time), now) === 'done')
  const nextEntry = todayTeaching.find((e) => periodStateOf(parseRangeMinutes(e.period.time), now) === 'upcoming')
  const schoolStart = todayTimeline[0]?.period.time.split(' - ')[0]
  const schoolEnd = todayTimeline[todayTimeline.length - 1]?.period.time.split(' - ')[1]
  const isWorkingDay = myDays.includes(dayName as DayType)
  const nextSchoolDay = !isWorkingDay ? nextSchoolDayFrom(dayName, myDays) : null

  // Recent changes affecting MY class (72h TTL — spec §11). Recorded
  // changes carry the class in `context` (period_changed uses the bare
  // class name), and slot ids are checked against my current slots.
  const mySlotIds = useMemo(() => new Set(mySlots.map((s) => s.id)), [mySlots])
  const myRecentChanges = useMemo(() => {
    const out: TimetableChange[] = []
    for (const pub of publications) {
      if (Date.now() - new Date(pub.publishedAt).getTime() > SEVENTY_TWO_HOURS_MS) continue
      for (const c of pub.changes) {
        if (mySlotIds.has(c.slotId) || c.context === classKey || c.context.startsWith(`${classKey} ·`)) {
          out.push(c)
        }
      }
    }
    return out
  }, [publications, mySlotIds, classKey])

  const dateLabel = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })

  return (
    <>
      {/* Calm recent-change awareness — one line, never a loud banner (§11) */}
      {myRecentChanges.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
          <History className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="min-w-0 flex-1 truncate text-xs text-foreground">
            <span className="font-semibold">Timetable updated</span>
            <span className="text-muted-foreground">
              {' '}· {myRecentChanges[0].changeLabel ?? myRecentChanges[0].summary}
              {myRecentChanges.length > 1 && ` · +${myRecentChanges.length - 1} more`}
            </span>
          </p>
        </div>
      )}

      {/* ── TODAY — the primary experience (§4) ── */}
      <Panel
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> Today&apos;s Classes
          </span>
        }
        subtitle={
          isWorkingDay
            ? `${dayName}, ${dateLabel} · ${todayTeaching.length} classes${allDone ? ' · finished for today' : ''}`
            : `${dayName}, ${dateLabel} · no classes today`
        }
        action={
          schoolStart && schoolEnd ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {compactClock(schoolStart)} – {compactClock(schoolEnd)}
            </span>
          ) : undefined
        }
      >
        {isWorkingDay ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {todayTimeline.map((entry, i) => (
              <TimelineEntryCard
                key={entry.key}
                entry={entry}
                index={i}
                state={periodStateOf(parseRangeMinutes(entry.period.time), now)}
                nextKey={nextEntry?.key}
                publications={publications}
              />
            ))}
          </div>
        ) : (
          <StudentEmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title={`No classes today — ${dayName}`}
            description={
              dayName === 'Saturday' || dayName === 'Sunday'
                ? 'Enjoy the weekend! School days run Monday to Friday.'
                : 'It is a non-working day.'
            }
            action={
              nextSchoolDay ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setActiveDay(nextSchoolDay)}
                >
                  View {nextSchoolDay} schedule
                </Button>
              ) : undefined
            }
          />
        )}
      </Panel>

      {/* ── Weekly timetable — only days the school scheduled (§7) ── */}
      {myDays.length > 0 ? (
        <Panel
          title={
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Weekly Timetable
            </span>
          }
          subtitle={`${activeDay} · ${activeTimeline.filter((e) => e.kind === 'teaching').length} classes + breaks`}
        >
          <SegmentedTabs
            className="w-full sm:w-auto"
            tabs={myDays.map((d) => ({
              value: d,
              label: d.slice(0, 3),
              icon:
                d === dayName ? (
                  <span title="Today" className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ) : undefined,
            }))}
            value={activeDay}
            onValueChange={setActiveDay}
          />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeTimeline.map((entry, i) => {
              const isToday = activeDay === dayName
              return (
                <TimelineEntryCard
                  key={entry.key}
                  entry={entry}
                  index={i}
                  state={isToday ? periodStateOf(parseRangeMinutes(entry.period.time), now) : undefined}
                  nextKey={isToday ? nextEntry?.key : undefined}
                  publications={publications}
                />
              )
            })}
          </div>

          {/* Compact subject legend — derived from THIS schedule, one quiet
              row (§23: color identification genuinely helps at 10 subjects). */}
          <SubjectLegend slots={mySlots} />
        </Panel>
      ) : (
        <Panel title="Weekly Timetable" subtitle={`${classKey} · published schedule`}>
          <StudentEmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No timetable configured yet"
            description="Your school has not published a schedule for your class. Check back after the school publishes the timetable."
          />
        </Panel>
      )}
    </>
  )
}

/** Compact legend row — subjects that actually appear in the schedule. */
function SubjectLegend({ slots }: { slots: TimetableSlot[] }) {
  const subjects = useMemo(() => {
    const seen: string[] = []
    for (const s of slots) {
      if (!seen.includes(s.subject)) seen.push(s.subject)
    }
    return seen
  }, [slots])
  if (subjects.length <= 4) return null // colors are obvious on few subjects
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/60 pt-2.5">
      {subjects.map((subject) => (
        <span key={subject} className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <span className={cn('h-2.5 w-2.5 rounded-full bg-gradient-to-br shrink-0', subjectColor(subject).gradient)} />
          {subject}
        </span>
      ))}
    </div>
  )
}

// ── SCHOOL view — read-only, light filters, Principal card language (§8/§9)

function SchoolView({ publishedSlots, dayName }: { publishedSlots: TimetableSlot[]; dayName: string }) {
  const schoolDays = useMemo(() => configuredDays(publishedSlots), [publishedSlots])
  const defaultDay: DayType = schoolDays.includes(dayName as DayType) ? (dayName as DayType) : (schoolDays[0] ?? 'Monday')
  const [schoolDay, setSchoolDay] = useState<DayType>(defaultDay)
  const [schoolClass, setSchoolClass] = useState<string>('all')

  const visibleClasses = useMemo(
    () => (schoolClass === 'all' ? CLASSES : [schoolClass]),
    [schoolClass],
  )
  const daySlots = useMemo(
    () => publishedSlots.filter((s) => s.day === schoolDay && visibleClasses.includes(s.className)),
    [publishedSlots, schoolDay, visibleClasses],
  )

  if (publishedSlots.length === 0) {
    return (
      <Panel title="School Timetable" subtitle="School-wide master schedule · read-only">
        <StudentEmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="No school timetable available"
          description="The school has not published a master timetable yet."
        />
      </Panel>
    )
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> School Timetable
        </span>
      }
      subtitle={`${schoolDay} · school-wide master schedule · read-only`}
    >
      {/* Light filters that genuinely help (§9): class + day only. */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedTabs
          className="max-w-full"
          tabs={[
            { value: 'all', label: 'All Classes' },
            ...CLASSES.map((c) => ({ value: c, label: c.replace('Class ', '') })),
          ]}
          value={schoolClass}
          onValueChange={setSchoolClass}
        />
      </div>
      <div className="mt-2">
        <SegmentedTabs
          className="max-w-full"
          tabs={schoolDays.map((d) => ({
            value: d,
            label: d.slice(0, 3),
            icon:
              d === dayName ? (
                <span title="Today" className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ) : undefined,
          }))}
          value={schoolDay}
          onValueChange={setSchoolDay}
        />
      </div>

      {daySlots.length === 0 ? (
        <div className="mt-3">
          <StudentEmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title={`Nothing scheduled on ${schoolDay}`}
            description={
              schoolClass === 'all'
                ? 'No class has periods on this day yet.'
                : `${schoolClass} has no periods on this day.`
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop: the Principal's table language, read-only (§31) */}
          <div className="mt-3 hidden lg:block rounded-lg border border-border/60 overflow-x-auto overscroll-x-contain [touch-action:pan-x]">
            <table className="text-left text-xs border-collapse w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-2.5 w-32 shrink-0 text-[10px] uppercase tracking-wider">Period</th>
                  {visibleClasses.map((cls) => (
                    <th
                      key={cls}
                      className={cn(
                        'p-2.5 border-l border-border/50 font-bold text-foreground text-[10px] uppercase tracking-wider',
                        visibleClasses.length === 1 ? 'w-full' : 'min-w-[180px]',
                      )}
                    >
                      {cls}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => {
                  if (period.isBreak) {
                    return (
                      <tr key={`school-p${period.number}`} className="bg-muted/20">
                        <td className="p-2.5 shrink-0">
                          <div className="flex items-center gap-1.5">
                            {period.breakType === 'lunch' ? (
                              <UtensilsCrossed className="h-3 w-3 shrink-0 text-amber-500" />
                            ) : (
                              <Coffee className="h-3 w-3 shrink-0 text-amber-500" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-foreground">{period.name}</p>
                              <p className="text-[9px] text-muted-foreground tabular-nums">{period.time}</p>
                            </div>
                          </div>
                        </td>
                        <td
                          colSpan={visibleClasses.length}
                          className="p-2.5 text-center text-[10px] font-medium text-muted-foreground/60 italic border-l border-border/50 bg-amber-500/5"
                        >
                          — {period.name} ({period.time}) —
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={`school-p${period.number}`} className="border-t border-border/40">
                      <td className="p-2.5 shrink-0">
                        <p className="text-[10px] font-bold text-foreground">{period.name}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 tabular-nums">{period.time}</p>
                      </td>
                      {visibleClasses.map((cls) => {
                        const slot = daySlots.find(
                          (s) => s.period === period.number && s.className === cls,
                        )
                        return (
                          <td key={`${cls}-p${period.number}`} className="p-1.5 border-l border-border/50 align-top">
                            {slot ? (
                              <SchoolSlotCard slot={slot} />
                            ) : (
                              <div className="h-12 rounded-lg border border-transparent" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile/tablet: stacked per-period cards (§20) */}
          <div className="mt-3 lg:hidden space-y-2">
            {PERIODS.map((period) => {
              if (period.isBreak) {
                return (
                  <div
                    key={`school-m-p${period.number}`}
                    className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
                  >
                    {period.breakType === 'lunch' ? (
                      <UtensilsCrossed className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    ) : (
                      <Coffee className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <p className="text-xs font-bold text-foreground">{period.name}</p>
                    <p className="ml-auto text-[10px] text-muted-foreground tabular-nums">{period.time}</p>
                  </div>
                )
              }
              const periodSlots = daySlots.filter((s) => s.period === period.number)
              return (
                <div key={`school-m-p${period.number}`} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-foreground">{period.name}</span>
                    <span className="text-[9px] text-muted-foreground tabular-nums">{period.time}</span>
                  </div>
                  {periodSlots.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/20 py-2 text-center text-[9px] text-muted-foreground/40">
                      No class scheduled
                    </div>
                  ) : (
                    <div className={cn('grid gap-1.5', visibleClasses.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                      {periodSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={cn(
                            'rounded-lg border p-2.5',
                            slot.type === 'Lab'
                              ? 'border-violet-500/20 bg-violet-500/5'
                              : slot.type === 'Sports'
                                ? 'border-teal-500/20 bg-teal-500/5'
                                : 'border-primary/20 bg-primary/5',
                          )}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm font-bold truncate',
                                slot.type === 'Lab'
                                  ? 'text-violet-700 dark:text-violet-300'
                                  : slot.type === 'Sports'
                                    ? 'text-teal-700 dark:text-teal-300'
                                    : 'text-primary',
                              )}
                            >
                              {slot.subject}
                            </p>
                            {visibleClasses.length > 1 && (
                              <p className="shrink-0 text-[10px] text-muted-foreground">{slot.className}</p>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 border-t border-border/30 pt-1.5">
                            {slot.teacherName && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground min-w-0">
                                <UserCheck className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{slot.teacherName}</span>
                              </span>
                            )}
                            {slot.room && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground min-w-0">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{slot.room}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Panel>
  )
}
