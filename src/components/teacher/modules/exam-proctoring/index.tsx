'use client'

/**
 * Exam Proctoring (EP-6) — the module composition root.
 *
 * An OPERATIONAL DUTY WORKSPACE, not an exam-administration dashboard.
 * The page answers one question for the signed-in teacher: "Which exam
 * duty do I have, when is it, where is it, and what do I need to do?"
 *
 *   · ModuleToolbar — dynamic duty context + "Open Today's Duty" (only
 *     when one exists); never the module name (the top bar owns that)
 *   · 4 teacher-specific KPI cards (upcoming / today / students / hours)
 *   · Tabs — My Duties (TODAY hero + upcoming) · Duty History · Exam
 *     Schedule (authorized exams only)
 *   · Opening a duty takes over the module with the full duty workspace
 *
 * Everything derives from GET /api/teacher/proctoring ({ ok, data }
 * envelope). No school-wide stats, no charts, no hall tickets, no
 * seating administration — those belong to the exam office.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  History,
  RefreshCw,
  Timer,
  Users,
} from 'lucide-react'
import { GlassCard, PageTransition, StatusBadge } from '@/components/shared/ui'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import { KpiCard } from '@/components/shared/kpi-card'
import {
  HubEmptyState,
  HubModuleSkeleton,
} from '../shared/hub-stat-cards'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProctoringModule } from './hooks'
import { DutyDetailPanel } from './duty-detail'
import {
  DUTY_STATUS_CONFIG,
  countsParts,
  examStatusConfig,
  formatCompactRange,
  formatDutyMinutes,
  heroMeta,
  rowMeta,
  sessionLabel,
  shortDate,
  todayKey,
  type DutySummary,
  type ScheduleExam,
} from './shared'

type Tab = 'duties' | 'history' | 'schedule'

export function ExamProctoringModule() {
  const { data, error, reload } = useProctoringModule()
  const [tab, setTab] = useState<Tab>('duties')
  const [activeDutyId, setActiveDutyId] = useState<string | null>(null)

  // ── module-level states (hooks above run unconditionally) ──────────

  if (error != null && data == null) {
    return (
      <PageTransition>
        <GlassCard
          hover={false}
          className="flex flex-col items-center justify-center gap-3 p-10 text-center"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">Couldn&apos;t load your exam duties</p>
          <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
          <Button onClick={reload} className="h-9">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </GlassCard>
      </PageTransition>
    )
  }

  if (data == null) {
    return (
      <PageTransition>
        <div aria-busy="true" aria-label="Loading exam duties">
          <HubModuleSkeleton />
        </div>
      </PageTransition>
    )
  }

  // ── the duty workspace takeover ────────────────────────────────────

  if (activeDutyId != null) {
    return <DutyDetailPanel dutyId={activeDutyId} onBack={() => setActiveDutyId(null)} />
  }

  const { duties, stats, schedule, academicSession } = data
  const today = todayKey()

  // Today's duties (any non-cancelled status — the paper is dated today).
  const todayDuties = duties.filter((d) => d.date === today && d.status !== 'Cancelled')
  // Upcoming: strictly future papers still to be supervised.
  const upcomingDuties = duties.filter(
    (d) => d.date > today && (d.status === 'Upcoming' || d.status === 'In Progress'),
  )
  // History: completed duties, plus cancelled ones (read-only records —
  // the teacher must still see that a duty was called off).
  const historyDuties = duties.filter((d) => d.status === 'Completed' || d.status === 'Cancelled')
  const nextDuty = upcomingDuties[0] ?? null

  const session = sessionLabel(academicSession)
  const toolbarContext = [
    stats.upcomingDuties === 0
      ? 'No upcoming duties'
      : `${stats.upcomingDuties} upcoming ${stats.upcomingDuties === 1 ? 'duty' : 'duties'}`,
    session ? `Academic Session ${session}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'duties',
      label: 'My Duties',
      icon: <ClipboardCheck className="h-3.5 w-3.5" />,
      count: todayDuties.length + upcomingDuties.length,
    },
    {
      id: 'history',
      label: 'Duty History',
      icon: <History className="h-3.5 w-3.5" />,
      count: historyDuties.length,
    },
    {
      id: 'schedule',
      label: 'Exam Schedule',
      icon: <Calendar className="h-3.5 w-3.5" />,
      count: schedule.length,
    },
  ]

  const noDutiesAtAll = duties.length === 0

  return (
    <PageTransition className="space-y-4 sm:space-y-5">
      <ModuleToolbar
        context={toolbarContext}
        action={
          todayDuties.length > 0 ? (
            <Button
              onClick={() => setActiveDutyId(todayDuties[0].id)}
              className="h-9"
            >
              <ClipboardCheck className="h-3.5 w-3.5" /> Open Today&apos;s Duty
            </Button>
          ) : undefined
        }
      />

      {/* KPI cards — teacher-specific only (spec: no school-wide stats). */}
      {!noDutiesAtAll && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <KpiCard
            label="Upcoming Duties"
            value={stats.upcomingDuties}
            icon={<CalendarClock className="h-5 w-5" />}
            accent="sky"
            trendLabel="next 30 days"
            delay={0}
          />
          <KpiCard
            label="Today's Duty"
            value={stats.todaysDuties}
            icon={<ClipboardCheck className="h-5 w-5" />}
            accent="emerald"
            trendLabel="assigned today"
            delay={0.05}
          />
          <KpiCard
            label="Students to Supervise"
            value={stats.studentsToSupervise}
            icon={<Users className="h-5 w-5" />}
            accent="violet"
            trendLabel="across upcoming duties"
            delay={0.1}
          />
          <KpiCard
            label="Duty Hours"
            value={stats.dutyMinutes}
            format={formatDutyMinutes}
            icon={<Timer className="h-5 w-5" />}
            accent="amber"
            trendLabel="scheduled"
            delay={0.15}
          />
        </div>
      )}

      {/* Tabs (house pill recipe) */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Exam proctoring views">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'glass text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                tab === t.id ? 'bg-primary-foreground/20' : 'bg-muted',
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── My Duties: TODAY hero + upcoming list ── */}
        {tab === 'duties' && (
          <motion.div
            key="duties"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {noDutiesAtAll ? (
              <GlassCard hover={false}>
                <HubEmptyState
                  icon={ClipboardCheck}
                  title="No examination duties"
                  hint="You currently have no examination invigilation assigned."
                />
              </GlassCard>
            ) : (
              <>
                {/* TODAY'S DUTY — the primary section */}
                <section aria-label="Today's duty">
                  <SectionLabel>
                    {todayDuties.length > 0 ? "Today's Duty" : 'Next Duty'}
                  </SectionLabel>
                  <div className="mt-2 space-y-3">
                    {todayDuties.length > 0 ? (
                      todayDuties.map((duty, i) => (
                        <DutyHeroCard
                          key={duty.id}
                          duty={duty}
                          index={i}
                          variant="today"
                          onOpen={() => setActiveDutyId(duty.id)}
                        />
                      ))
                    ) : nextDuty != null ? (
                      <>
                        <GlassCard hover={false} className="p-3 sm:p-4">
                          <p className="text-xs text-muted-foreground">
                            No examination duty assigned today.
                          </p>
                        </GlassCard>
                        <DutyHeroCard
                          duty={nextDuty}
                          index={0}
                          variant="next"
                          onOpen={() => setActiveDutyId(nextDuty.id)}
                        />
                      </>
                    ) : (
                      <GlassCard hover={false} className="p-3 sm:p-4">
                        <p className="text-xs text-muted-foreground">
                          No examination duty assigned today.
                        </p>
                      </GlassCard>
                    )}
                  </div>
                </section>

                {/* UPCOMING DUTIES — clean list, no decorative graphics */}
                <section aria-label="Upcoming duties">
                  <SectionLabel>Upcoming Duties</SectionLabel>
                  <div className="mt-2 space-y-2.5">
                    {upcomingDuties.length === 0 ? (
                      <GlassCard hover={false}>
                        <HubEmptyState
                          icon={CalendarClock}
                          title="No upcoming examination duties"
                          hint="You currently have no examination invigilation assigned."
                        />
                      </GlassCard>
                    ) : (
                      upcomingDuties.map((duty, i) => (
                        <DutyRowCard
                          key={duty.id}
                          duty={duty}
                          index={i}
                          actionLabel="Open Duty"
                          onOpen={() => setActiveDutyId(duty.id)}
                        />
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </motion.div>
        )}

        {/* ── Duty History: completed (and cancelled) duties ── */}
        {tab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-2.5"
          >
            {historyDuties.length === 0 ? (
              <GlassCard hover={false}>
                <HubEmptyState
                  icon={History}
                  title="No completed duties yet"
                  hint="Duties you have invigilated will appear here as records."
                />
              </GlassCard>
            ) : (
              historyDuties.map((duty, i) => (
                <HistoryRowCard
                  key={duty.id}
                  duty={duty}
                  index={i}
                  onOpen={() => setActiveDutyId(duty.id)}
                />
              ))
            )}
          </motion.div>
        )}

        {/* ── Exam Schedule: authorized exams only ── */}
        {tab === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {schedule.length === 0 ? (
              <GlassCard hover={false}>
                <HubEmptyState
                  icon={Calendar}
                  title="No exams scheduled"
                  hint="Exams involving your classes will appear here once the exam office schedules them."
                />
              </GlassCard>
            ) : (
              schedule.map((exam, i) => (
                <ExamScheduleCard key={exam.examId} exam={exam} index={i} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

// ─── local pieces ─────────────────────────────────────────────────────

/** Small uppercase section label (house recipe). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

/**
 * The prominent today/next duty card — the module's most important
 * element. Today's duties carry the subtle emerald accent; the "next
 * duty" fallback stays neutral.
 */
function DutyHeroCard({
  duty,
  index,
  variant,
  onOpen,
}: {
  duty: DutySummary
  index: number
  variant: 'today' | 'next'
  onOpen: () => void
}) {
  const cfg = DUTY_STATUS_CONFIG[duty.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <GlassCard
        hover={false}
        className={cn(
          'relative overflow-hidden p-4 sm:p-5',
          variant === 'today'
            ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
            : 'border-border bg-card',
        )}
      >
        {variant === 'today' && (
          <span
            className="absolute inset-y-0 left-0 w-1 bg-emerald-500/50"
            aria-hidden="true"
          />
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                variant === 'today'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
              )}
            >
              {variant === 'today' ? 'Today' : 'Next Duty'}
            </span>
            <h3 className="mt-1.5 font-display text-base font-bold tracking-tight sm:text-lg">
              {duty.subject} — {duty.examName}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {duty.classLabel} · Role: {duty.role}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{heroMeta(duty)}</p>
          </div>
          <StatusBadge status={duty.status} variant={cfg.variant} dot />
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button onClick={onOpen} className="h-9">
            Open Duty <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          {duty.incidentCount > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {duty.incidentCount} incident{duty.incidentCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

/** A clean upcoming-duty row — text, badges, one action. No graphics. */
function DutyRowCard({
  duty,
  index,
  actionLabel,
  onOpen,
}: {
  duty: DutySummary
  index: number
  actionLabel: string
  onOpen: () => void
}) {
  const cfg = DUTY_STATUS_CONFIG[duty.status]
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
    >
      <GlassCard className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {duty.subject} — {duty.examName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {duty.classLabel} · {duty.role}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{rowMeta(duty)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={duty.status} variant={cfg.variant} />
            <Button variant="outline" size="sm" onClick={onOpen} className="h-9">
              {actionLabel}
            </Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/** A completed (or cancelled) duty record — read-only history. */
function HistoryRowCard({
  duty,
  index,
  onOpen,
}: {
  duty: DutySummary
  index: number
  onOpen: () => void
}) {
  const cfg = DUTY_STATUS_CONFIG[duty.status]
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
    >
      <GlassCard className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {duty.examName} — {duty.subject}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {duty.classLabel} · {duty.role}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{rowMeta(duty)}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {duty.attendance != null && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {countsParts(duty.attendance).join(' · ') || 'Attendance recorded'}
                </span>
              )}
              {duty.incidentCount > 0 && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  {duty.incidentCount} incident{duty.incidentCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={duty.status} variant={cfg.variant} />
            <Button variant="outline" size="sm" onClick={onOpen} className="h-9">
              Open Record
            </Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/** One authorized exam with its papers (compact grid). */
function ExamScheduleCard({ exam, index }: { exam: ScheduleExam; index: number }) {
  const cfg = examStatusConfig(exam.status)
  const dateRange =
    exam.startDate != null && exam.endDate != null
      ? `${shortDate(exam.startDate)} – ${shortDate(exam.endDate)}`
      : 'Dates to be announced'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
    >
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {exam.type}
            </p>
            <h3 className="font-display text-base font-bold tracking-tight">{exam.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dateRange} · {exam.classes.join(', ') || 'No classes assigned'}
            </p>
          </div>
          <StatusBadge status={cfg.label} variant={cfg.variant} />
        </div>

        {exam.papers.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border bg-card/30 px-3 py-2.5 text-[11px] text-muted-foreground">
            Papers not scheduled yet — the exam office publishes the subject-wise schedule here.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {exam.papers.map((paper) => (
              <div
                key={paper.id}
                className={cn(
                  'rounded-xl border p-3',
                  paper.isMine
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold">{paper.subject}</p>
                  {paper.isMine && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                      You invigilate
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{paper.classLabel}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {shortDate(paper.date)} · {formatCompactRange(paper.startTime, paper.endTime)}
                  {' · '}
                  {paper.room ?? 'Room TBA'}
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}
