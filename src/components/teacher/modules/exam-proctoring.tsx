'use client'

/**
 * Exam Proctoring — real exam operations for the teaching staff.
 *
 * Everything is derived from the school's exam records via
 * GET /api/teacher/proctoring: the exam schedule (papers with rooms,
 * slots and invigilators), the room-level seating plan, the invigilation
 * duty roster (own duties highlighted) and hall tickets for the teacher's
 * own classes. No mock data, no fake actions — informational cards only.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck, Calendar, Clock, Users, DoorOpen, Ticket,
  MapPin, Grid3x3, Loader2, AlertTriangle, RefreshCw, UserCheck,
} from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ModuleToolbar } from '../teacher-panel/module-toolbar'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend } from '@/components/shared/charts'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/signout'

// ─── API contract ─────────────────────────────────────────────────────

interface Paper {
  id: string
  examId: string
  examName: string
  subject: string
  classLabel: string
  date: string
  startTime: string
  endTime: string
  room: string | null
  invigilator: string | null
  isMine: boolean
  done: boolean
}

interface ExamEntry {
  id: string
  name: string
  type: string
  term: string | null
  status: string
  startDate: string
  endDate: string
  classes: string[]
  paperCount: number
  studentCount: number
}

interface SeatingRoom {
  room: string
  examName: string
  allocated: number
  capacity: number
  rows: number
  cols: number
  invigilator: string
  seatNumbers: number[]
  students: { name: string; rollNo: string | null; classLabel: string; seatNumber: number }[]
}

interface Ticket {
  studentId: string
  studentName: string
  rollNo: string | null
  classLabel: string
  examName: string
  room: string
  seatNumber: number
  subjects: { subject: string; date: string; time: string }[]
}

interface ProctoringPayload {
  teacherName: string
  exams: ExamEntry[]
  papers: Paper[]
  seating: SeatingRoom[]
  duties: Paper[]
  tickets: Ticket[]
  stats: {
    upcomingPapers: number
    upcomingExams: number
    studentsSeated: number
    roomsUsed: number
    myDuties: number
    monthly: { month: string; count: number }[]
  }
}

// ─── envelope fetch (house pattern) ───────────────────────────────────

async function proctoringFetch(): Promise<ProctoringPayload> {
  const res = await fetch('/api/teacher/proctoring', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (res.status === 401) {
    void signOut()
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const body = (await res.json()) as { ok?: boolean; data?: ProctoringPayload; error?: string }
  if (!body.ok || !body.data) throw new Error(body.error || 'Failed to load exam operations')
  return body.data
}

type Tab = 'schedule' | 'seating' | 'duties' | 'tickets'

const examStatusConfig: Record<string, { variant: 'info' | 'warning' | 'success' | 'neutral'; label: string }> = {
  SCHEDULED: { variant: 'info', label: 'Scheduled' },
  ONGOING: { variant: 'warning', label: 'Ongoing' },
  COMPLETED: { variant: 'success', label: 'Completed' },
}

export function ExamProctoringModule() {
  const [tab, setTab] = useState<Tab>('schedule')
  const [data, setData] = useState<ProctoringPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    proctoringFetch()
      .then((payload) => { if (!cancelled) setData(payload) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [reload])

  if (error) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t load exam operations</p>
        <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => setReload((r) => r + 1)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
        </button>
      </GlassCard>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading exam operations">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
        <div className="h-[220px] animate-pulse rounded-xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    )
  }

  const { exams, papers, seating, duties, tickets, stats } = data
  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'schedule', label: 'Exam Schedule', icon: <Calendar className="h-3.5 w-3.5" />, count: exams.length },
    { id: 'seating', label: 'Seating', icon: <Grid3x3 className="h-3.5 w-3.5" />, count: seating.length },
    { id: 'duties', label: 'Invigilation', icon: <ClipboardCheck className="h-3.5 w-3.5" />, count: duties.length },
    { id: 'tickets', label: 'Hall Tickets', icon: <Ticket className="h-3.5 w-3.5" />, count: tickets.length },
  ]

  return (
    <div className="space-y-5">
      <ModuleToolbar
        context={`Exam operations · ${stats.upcomingExams} upcoming exam${stats.upcomingExams === 1 ? '' : 's'}`}
      />

      {/* KPI cards — real counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Upcoming Papers" value={stats.upcomingPapers} icon={<Calendar className="h-5 w-5" />} accent="amber" trendLabel={`${stats.upcomingExams} exams scheduled`} delay={0} />
        <KpiCard label="Rooms in Use" value={stats.roomsUsed} icon={<DoorOpen className="h-5 w-5" />} accent="violet" trendLabel={`${stats.studentsSeated} students seated`} delay={0.05} />
        <KpiCard label="My Duties" value={stats.myDuties} icon={<ClipboardCheck className="h-5 w-5" />} accent="emerald" trendLabel="invigilation slots" delay={0.1} />
        <KpiCard label="Students Seated" value={stats.studentsSeated} icon={<Users className="h-5 w-5" />} accent="cyan" trendLabel="across all rooms" delay={0.15} />
      </div>

      {/* Clear information — papers per month + rooms at a glance (no donut) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.monthly.length > 0 ? (
          <ChartCard title="Papers per Month" subtitle="Exam schedule" className="lg:col-span-2">
            <BarTrend data={stats.monthly} xKey="month" yKey="count" color="oklch(0.65 0.16 75)" height={220} />
          </ChartCard>
        ) : (
          <GlassCard className="flex h-[220px] flex-col items-center justify-center text-center lg:col-span-2">
            <Calendar className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">No papers scheduled yet</p>
          </GlassCard>
        )}
        <GlassCard className="p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rooms at a Glance</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Seats allocated per room</p>
          <div className="mt-3 space-y-2.5">
            {seating.slice(0, 5).map((s) => {
              const pct = Math.round((s.allocated / s.capacity) * 100)
              return (
                <div key={`${s.examName}-${s.room}`}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="font-medium">{s.room}</span>
                    <span className="tabular-nums text-muted-foreground">{s.allocated}/{s.capacity}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${s.room} occupancy`}
                    />
                  </div>
                </div>
              )
            })}
            {seating.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Seating not published yet</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Exam proctoring views">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', tab === t.id ? 'bg-primary-foreground/20' : 'bg-muted')}>{t.count}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Schedule: exam cards with their papers ── */}
        {tab === 'schedule' && (
          <motion.div key="sc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
            {exams.map((e, i) => {
              const cfg = examStatusConfig[e.status] ?? examStatusConfig.SCHEDULED
              const examPapers = papers.filter((p) => p.examId === e.id)
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{e.type}{e.term ? ` · ${e.term}` : ''}</p>
                        <h3 className="font-display text-base font-bold tracking-tight">{e.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(e.startDate)} – {formatDate(e.endDate)} · {e.classes.join(', ') || 'No classes assigned'}
                        </p>
                      </div>
                      <StatusBadge status={cfg.label} variant={cfg.variant} />
                    </div>
                    {examPapers.length > 0 ? (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {examPapers.map((p) => (
                          <div key={p.id} className={cn(
                            'rounded-xl border p-3',
                            p.isMine ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/40'
                          )}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold">{p.subject}</p>
                              {p.isMine && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">You invigilate</span>}
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{p.classLabel}</p>
                            <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                              <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3 shrink-0" /> {formatDate(p.date)} · {p.startTime}–{p.endTime}</p>
                              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /> {p.room ?? 'Room TBA'}</p>
                              <p className="flex items-center gap-1.5"><UserCheck className="h-3 w-3 shrink-0" /> {p.invigilator ?? 'Invigilator TBA'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-lg border border-dashed border-border bg-card/30 px-3 py-2.5 text-[11px] text-muted-foreground">
                        Papers not scheduled yet — the exam office publishes the subject-wise schedule here.
                      </p>
                    )}
                  </GlassCard>
                </motion.div>
              )
            })}
            {exams.length === 0 && (
              <GlassCard className="flex flex-col items-center justify-center p-10 text-center">
                <Calendar className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">No exams scheduled</p>
                <p className="mt-1 text-xs text-muted-foreground">Exam operations will appear here once the exam office schedules them.</p>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* ── Seating: room plans ── */}
        {tab === 'seating' && (
          <motion.div key="st" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
            {seating.map((s, i) => {
              const pct = Math.round((s.allocated / s.capacity) * 100)
              return (
                <motion.div key={`${s.examName}-${s.room}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-3 sm:p-4 lg:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                          <DoorOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{s.room}</p>
                          <p className="text-[11px] text-muted-foreground">{s.examName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold">{s.allocated}/{s.capacity}</p>
                        <p className="text-[10px] text-muted-foreground">{pct}% filled</p>
                      </div>
                    </div>

                    {/* Seating grid — occupied seats carry the seat number */}
                    <div className="rounded-xl border border-border bg-card/30 p-3 mb-3">
                      <p className="text-[10px] text-muted-foreground mb-2 text-center">Blackboard ↑ · Front of Room</p>
                      <div className="space-y-1.5">
                        {Array.from({ length: s.rows }).map((_, rowIdx) => (
                          <div key={rowIdx} className="flex justify-center gap-1.5">
                            {Array.from({ length: s.cols }).map((_, colIdx) => {
                              const seatNum = rowIdx * s.cols + colIdx + 1
                              const isOccupied = s.seatNumbers.includes(seatNum)
                              const occupant = isOccupied ? s.students.find((st) => st.seatNumber === seatNum) : null
                              return (
                                <motion.div
                                  key={colIdx}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: (rowIdx * s.cols + colIdx) * 0.015 }}
                                  className={cn(
                                    'flex h-7 w-7 items-center justify-center rounded-md text-[9px] font-bold',
                                    isOccupied ? 'bg-violet-500/20 text-violet-600 ring-1 ring-violet-500/30' : 'bg-muted text-muted-foreground/40'
                                  )}
                                  title={occupant ? `Seat ${seatNum} — ${occupant.name} (${occupant.classLabel})` : `Seat ${seatNum} — Empty`}
                                >
                                  {seatNum}
                                </motion.div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">Invigilator: {s.invigilator}</p>
                    </div>

                    {/* Seated students list */}
                    <div className="flex flex-wrap gap-1.5">
                      {s.students.map((st) => (
                        <span key={`${s.room}-${st.seatNumber}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-2 py-0.5 text-[10px]">
                          <span className="font-mono font-bold text-violet-600">{st.seatNumber}</span>
                          {st.name}
                          <span className="text-muted-foreground">· {st.classLabel}</span>
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
            {seating.length === 0 && (
              <GlassCard className="flex flex-col items-center justify-center p-10 text-center">
                <Grid3x3 className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Seating not published yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Room plans appear here once the exam office allocates seats.</p>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* ── Duties: invigilation roster, own duties first ── */}
        {tab === 'duties' && (
          <motion.div key="dt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
            {[...duties].sort((a, b) => (Number(b.isMine) - Number(a.isMine)) || a.date.localeCompare(b.date)).map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard className={cn('p-3 sm:p-4', d.isMine && 'border-primary/40')}>
                  <div className="flex items-start gap-3">
                    <GradientAvatar name={d.invigilator ?? 'Faculty'} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{d.invigilator}</p>
                        {d.isMine && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">You</span>}
                        <StatusBadge status={d.done ? 'Completed' : 'Assigned'} variant={d.done ? 'success' : 'info'} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.examName} · {d.subject} · {d.classLabel}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {formatDate(d.date)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {d.startTime}–{d.endTime}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {d.room ?? 'TBA'}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
            {duties.length === 0 && (
              <GlassCard className="flex flex-col items-center justify-center p-10 text-center">
                <ClipboardCheck className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">No invigilation duties assigned</p>
                <p className="mt-1 text-xs text-muted-foreground">The duty roster appears here once the exam office allocates invigilators.</p>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* ── Hall tickets: the teacher's own classes' students ── */}
        {tab === 'tickets' && (
          <motion.div key="tk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
            {tickets.map((t, i) => (
              <motion.div key={t.studentId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
                <GlassCard className="p-3 sm:p-4 lg:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <GradientAvatar name={t.studentName} size="md" />
                      <div>
                        <p className="font-semibold text-sm">{t.studentName}</p>
                        <p className="text-[11px] text-muted-foreground">Roll #{t.rollNo ?? '—'} · {t.classLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-border bg-card/30 p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          <span className="font-display text-xs font-bold">S</span>
                        </div>
                        <span className="text-[10px] font-bold">{t.examName}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div>
                        <p className="text-muted-foreground">Room</p>
                        <p className="font-bold">{t.room}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Seat</p>
                        <p className="font-bold">{t.seatNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Roll</p>
                        <p className="font-bold">#{t.rollNo ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {t.subjects.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] rounded bg-muted/40 px-2 py-1">
                        <span className="font-medium">{s.subject}</span>
                        <span className="text-muted-foreground">{formatDate(s.date)} · {s.time}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
            {tickets.length === 0 && (
              <GlassCard className="flex flex-col items-center justify-center p-10 text-center">
                <Ticket className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">No hall tickets for your classes</p>
                <p className="mt-1 text-xs text-muted-foreground">Tickets appear once seating is allocated for your class&apos;s exams.</p>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
