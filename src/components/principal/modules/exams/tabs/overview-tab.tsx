'use client'

/**
 * ExamsOverviewTab — Principal Examination Command Center.
 *
 * NOT a marks-entry screen. This is an examination control center that
 * answers: What's active? What needs attention? What's happening today?
 * How far along is the process? What's coming next?
 *
 * All data derived from real /api/exams payload via useExamsList.
 * Reuses SummaryCard, StatusBadge, SectionHeading from the shared
 * Schollez design system.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Calendar, Clock, CheckCircle2, AlertTriangle,
  ShieldCheck, ChevronRight, ArrowRight, Activity, CalendarDays,
  GraduationCap, ClipboardList, BarChart3, Zap,
} from 'lucide-react'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SummaryCard, SummaryCardGrid, type SummaryTone } from '../../shared/summary-card'
import { cn } from '@/lib/utils'
import type { ExamDTO } from '@/lib/exams/types'
import { InlineLoading } from '../inline-loading'

interface Props {
  exams: ExamDTO[]
  classes: any[]
  loading: boolean
  error: string | null
  onSelectExam: (id: string) => void
  onGoToExams: () => void
  onNavigate?: (section: string) => void
}

export function ExamsOverviewTab({ exams, classes, loading, error, onSelectExam, onGoToExams, onNavigate }: Props) {
  // ─── Derived data ──────────────────────────────────────────────────
  
  const derived = useMemo(() => {
    const active = exams.filter((e) => ['Ongoing', 'Scheduled'].includes(e.status) && e.status !== 'Draft')
    const drafts = exams.filter((e) => e.status === 'Draft')
    const completed = exams.filter((e) => e.status === 'Completed')
    const declared = exams.filter((e) => e.resultStatus === 'Result Declared')
    
    // Pick the "current" exam — prefer Ongoing, then most recent Scheduled
    const current = exams.find((e) => e.status === 'Ongoing') 
      ?? [...active].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))[0]
      ?? null

    // Aggregate mark progress across all exams
    const totalMarks = exams.reduce((s, e) => s + e.markSummary.total, 0)
    const enteredMarks = exams.reduce((s, e) => s + e.markSummary.entered, 0)
    const verifiedMarks = exams.reduce((s, e) => s + e.markSummary.verified, 0)
    const submittedMarks = exams.reduce((s, e) => s + e.markSummary.submitted, 0)
    const lockedMarks = exams.reduce((s, e) => s + e.markSummary.locked, 0)

    const marksEntryPct = totalMarks > 0 ? Math.round((enteredMarks / totalMarks) * 100) : 0
    const verificationPct = totalMarks > 0 ? Math.round((verifiedMarks / totalMarks) * 100) : 0

    // Action items
    const actions: ActionItem[] = []
    
    // Marks pending verification
    const pendingVerification = submittedMarks - verifiedMarks
    if (pendingVerification > 0) {
      actions.push({
        severity: 'warning',
        title: `${pendingVerification} marks entries awaiting verification`,
        detail: 'Submitted by teachers, pending Principal review',
        action: 'Review',
        onAction: () => onNavigate?.('marks'),
      })
    }
    
    // Results ready to declare
    const readyToDeclare = exams.filter((e) => e.resultStatus === 'Result Ready')
    if (readyToDeclare.length > 0) {
      actions.push({
        severity: 'info',
        title: `${readyToDeclare.length} ${readyToDeclare.length === 1 ? 'exam' : 'exams'} ready for result declaration`,
        detail: readyToDeclare.map((e) => e.name).join(', '),
        action: 'Declare',
        onAction: () => onNavigate?.('results'),
      })
    }
    
    // Under verification
    const underVerification = exams.filter((e) => e.resultStatus === 'Under Verification')
    if (underVerification.length > 0) {
      actions.push({
        severity: 'info',
        title: `${underVerification.length} ${underVerification.length === 1 ? 'exam' : 'exams'} under verification`,
        detail: underVerification.map((e) => e.name).join(', '),
        action: 'View',
        onAction: () => onNavigate?.('marks'),
      })
    }
    
    // Marks entry in progress
    const marksEntryInProgress = exams.filter((e) => e.resultStatus === 'Marks Entry')
    if (marksEntryInProgress.length > 0) {
      actions.push({
        severity: 'info',
        title: `${marksEntryInProgress.length} ${marksEntryInProgress.length === 1 ? 'exam' : 'exams'} in marks entry`,
        detail: marksEntryInProgress.map((e) => e.name).join(', '),
        action: 'View',
        onAction: () => onNavigate?.('marks'),
      })
    }

    // Today's schedule items
    const today = new Date().toISOString().split('T')[0]
    const todaysSchedule = exams.flatMap((e) => 
      e.schedule.map((s) => ({ ...s, examName: e.name, examId: e.id, examStatus: e.status }))
    ).filter((s) => s.date === today)

    // Upcoming exams (next 5, sorted by start date)
    const upcoming = [...active]
      .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
      .slice(0, 5)

    // Total students across all exams
    const totalStudents = exams.reduce((s, e) => 
      s + e.classes.reduce((cs, c) => cs + c.studentCount, 0), 0
    )

    return {
      active: active.length,
      drafts: drafts.length,
      completed: completed.length,
      declared: declared.length,
      current,
      marksEntryPct,
      verificationPct,
      totalMarks,
      enteredMarks,
      verifiedMarks,
      submittedMarks,
      lockedMarks,
      actions,
      todaysSchedule,
      upcoming,
      totalStudents,
    }
  }, [exams, onNavigate])

  // ─── States ────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonHeader />
        <SummaryCardGrid columns={4}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </SummaryCardGrid>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonBlock className="lg:col-span-2" />
          <SkeletonBlock />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-rose-500/50 mx-auto mb-3" />
        <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Unable to load examination overview</p>
        <p className="text-xs text-rose-600/70 mt-1">{error}</p>
        <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  // ─── Empty state ───────────────────────────────────────────────────
  
  if (exams.length === 0) {
    return (
      <div className="space-y-4">
        <OverviewHeader onGoToExams={onGoToExams} />
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-base font-semibold">No examinations created yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Create your first examination to start scheduling papers, entering marks, and generating results.
          </p>
          <Button size="sm" className="mt-4 h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onGoToExams}>
            Go to Exams <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  // ─── Main render ───────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <OverviewHeader onGoToExams={onGoToExams} />

      {/* Current Examination Hero */}
      {derived.current && (
        <CurrentExamHero exam={derived.current} totalStudents={derived.totalStudents} onSelect={onSelectExam} />
      )}

      {/* Key Metrics */}
      <SummaryCardGrid columns={4}>
        <SummaryCard
          label="Active Examinations"
          value={derived.active}
          sub={`${exams.length} total this year`}
          tone="emerald"
          icon={<FileText className="h-4 w-4" />}
          delay={0}
          onClick={onGoToExams}
        />
        <SummaryCard
          label="Marks Entry"
          value={derived.marksEntryPct}
          suffix="%"
          sub={`${derived.enteredMarks}/${derived.totalMarks} marks entered`}
          tone="amber"
          icon={<ClipboardList className="h-4 w-4" />}
          delay={0.04}
          onClick={() => onNavigate?.('marks')}
        />
        <SummaryCard
          label="Verification"
          value={derived.verificationPct}
          suffix="%"
          sub={`${derived.verifiedMarks} verified`}
          tone="violet"
          icon={<ShieldCheck className="h-4 w-4" />}
          delay={0.08}
          onClick={() => onNavigate?.('marks')}
        />
        <SummaryCard
          label="Results Declared"
          value={derived.declared}
          sub={`${derived.completed} completed`}
          tone="cyan"
          icon={<CheckCircle2 className="h-4 w-4" />}
          delay={0.12}
          onClick={() => onNavigate?.('results')}
        />
      </SummaryCardGrid>

      {/* Action Required + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <ActionRequired actions={derived.actions} onNavigate={onNavigate} />
        <ExaminationProgress
          marksEntryPct={derived.marksEntryPct}
          verificationPct={derived.verificationPct}
          activeCount={derived.active}
          declaredCount={derived.declared}
        />
      </div>

      {/* Today's Examinations */}
      <TodaysExaminations
        schedule={derived.todaysSchedule}
        onSelectExam={onSelectExam}
      />

      {/* Upcoming + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingExaminations exams={derived.upcoming} onSelectExam={onSelectExam} />
        <RecentActivity exams={exams} onSelectExam={onSelectExam} />
      </div>

      {/* Quick Actions */}
      <QuickActions onNavigate={onNavigate} onGoToExams={onGoToExams} />
    </div>
  )
}

// ─── Page Header ─────────────────────────────────────────────────────

function OverviewHeader({ onGoToExams }: { onGoToExams: () => void }) {
  return (
    <SectionHeading
      title="Examination"
      subtitle="Monitor examinations, assessment progress, results readiness, and academic performance across the school."
      icon={<FileText className="h-5 w-5" />}
      action={
        <div className="flex items-center gap-2">
          <Select defaultValue="2025-2026">
            <SelectTrigger size="sm" className="w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-2026">2025–2026</SelectItem>
              <SelectItem value="2024-2025">2024–2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
  )
}

// ─── Current Exam Hero ───────────────────────────────────────────────

function CurrentExamHero({ exam, totalStudents, onSelect }: { exam: ExamDTO; totalStudents: number; onSelect: (id: string) => void }) {
  const isActive = exam.status === 'Ongoing'
  const totalPapers = exam.schedule.length
  const totalClasses = exam.classes.length
  const totalExamStudents = exam.classes.reduce((s, c) => s + c.studentCount, 0)
  const progressPct = exam.markSummary.pct

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect(exam.id)}
      className="w-full text-left rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Current Examination
            </span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight truncate">{exam.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {exam.session} · {exam.type}
            {exam.startDate && exam.endDate && (
              <span> · {formatDate(exam.startDate)} — {formatDate(exam.endDate)}</span>
            )}
          </p>
        </div>
        <StatusBadge
          status={isActive ? 'Active' : exam.status}
          variant={isActive ? 'success' : 'info'}
          dot
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HeroStat label="Classes" value={totalClasses} />
        <HeroStat label="Students" value={totalExamStudents} />
        <HeroStat label="Papers" value={totalPapers} />
        <div>
          <p className="text-[9px] uppercase font-semibold text-muted-foreground">Overall Progress</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden max-w-[80px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-primary"
              />
            </div>
            <span className="font-display text-sm font-bold tabular-nums">{progressPct}%</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

function HeroStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  )
}

// ─── Action Required ─────────────────────────────────────────────────

interface ActionItem {
  severity: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  action: string
  onAction: () => void
}

function ActionRequired({ actions, onNavigate }: { actions: ActionItem[]; onNavigate?: (s: string) => void }) {
  void onNavigate
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Action Required</h3>
        {actions.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            {actions.length} pending
          </span>
        )}
      </div>
      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/40 mb-2" />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Everything is on track</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">All examination tasks are currently up to date.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-start gap-3 p-2.5 rounded-lg border',
                a.severity === 'critical' && 'border-rose-500/20 bg-rose-500/5',
                a.severity === 'warning' && 'border-amber-500/20 bg-amber-500/5',
                a.severity === 'info' && 'border-sky-500/20 bg-sky-500/5',
              )}
            >
              <div className={cn(
                'mt-0.5 shrink-0',
                a.severity === 'critical' && 'text-rose-500',
                a.severity === 'warning' && 'text-amber-500',
                a.severity === 'info' && 'text-sky-500',
              )}>
                {a.severity === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight">{a.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{a.detail}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] shrink-0"
                onClick={a.onAction}
              >
                {a.action}
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Examination Progress ────────────────────────────────────────────

function ExaminationProgress({
  marksEntryPct, verificationPct, activeCount, declaredCount,
}: {
  marksEntryPct: number
  verificationPct: number
  activeCount: number
  declaredCount: number
}) {
  const stages = [
    { label: 'Planning', pct: 100, icon: FileText },
    { label: 'Scheduling', pct: activeCount > 0 ? 100 : 0, icon: CalendarDays },
    { label: 'Conduct', pct: activeCount > 0 ? 80 : 0, icon: Clock },
    { label: 'Marks Entry', pct: marksEntryPct, icon: ClipboardList },
    { label: 'Verification', pct: verificationPct, icon: ShieldCheck },
    { label: 'Results', pct: declaredCount > 0 ? 100 : 0, icon: CheckCircle2 },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Examination Pipeline</h3>
      </div>
      <div className="space-y-2.5">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <s.icon className={cn(
              'h-3.5 w-3.5 shrink-0',
              s.pct >= 100 ? 'text-emerald-500' : s.pct > 0 ? 'text-amber-500' : 'text-muted-foreground/40'
            )} />
            <span className="text-[11px] font-medium text-foreground w-20 shrink-0">{s.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'h-full rounded-full',
                  s.pct >= 100 ? 'bg-emerald-500' : s.pct > 0 ? 'bg-amber-500' : 'bg-transparent'
                )}
              />
            </div>
            <span className={cn(
              'text-[10px] font-semibold tabular-nums w-8 text-right',
              s.pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : s.pct > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/50'
            )}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Today's Examinations ────────────────────────────────────────────

function TodaysExaminations({ schedule, onSelectExam }: { schedule: any[]; onSelectExam: (id: string) => void }) {
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Today's Examinations</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{todayLabel}</span>
      </div>
      {schedule.length === 0 ? (
        <div className="flex items-center justify-center py-4 text-center">
          <div>
            <CalendarDays className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">No examinations scheduled for today.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {schedule.map((s, i) => {
            const now = new Date()
            const startTime = s.startTime
            const endTime = s.endTime
            const isRunning = now >= new Date(`${s.date}T${startTime}`) && now <= new Date(`${s.date}T${endTime}`)
            const isCompleted = now > new Date(`${s.date}T${endTime}`)
            const isUpcoming = now < new Date(`${s.date}T${startTime}`)

            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelectExam(s.examId)}
                className={cn(
                  'text-left rounded-lg border p-3 transition-all hover:shadow-sm',
                  isRunning ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/60 hover:border-primary/30'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-xs font-semibold truncate">{s.subjectName ?? '—'}</p>
                  {isRunning && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      LIVE
                    </span>
                  )}
                  {isUpcoming && <span className="text-[9px] text-muted-foreground shrink-0">Upcoming</span>}
                  {isCompleted && <span className="text-[9px] text-muted-foreground shrink-0">Done</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">{s.className}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{s.startTime} — {s.endTime}</span>
                </div>
                {s.room && (
                  <div className="text-[9px] text-muted-foreground mt-0.5">📍 {s.room}</div>
                )}
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Upcoming Examinations ───────────────────────────────────────────

function UpcomingExaminations({ exams, onSelectExam }: { exams: ExamDTO[]; onSelectExam: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Upcoming Examinations</h3>
      </div>
      {exams.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No upcoming examinations scheduled.</p>
      ) : (
        <div className="space-y-2">
          {exams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => onSelectExam(exam.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/60 hover:bg-muted/40 hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex flex-col items-center justify-center w-12 shrink-0 rounded-lg bg-primary/5 py-1.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">
                  {exam.startDate ? new Date(exam.startDate).toLocaleDateString('en-IN', { month: 'short' }) : '—'}
                </span>
                <span className="font-display text-base font-bold text-primary">
                  {exam.startDate ? new Date(exam.startDate).getDate() : '—'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{exam.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {exam.type} · {exam.classes[0]?.className ?? '—'}
                  {exam.classes.length > 1 && ` +${exam.classes.length - 1}`}
                  {' · '}{exam.subjects.length} subjects
                </p>
              </div>
              <StatusBadge status={exam.status} variant={exam.status === 'Ongoing' ? 'warning' : 'info'} />
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Recent Activity ─────────────────────────────────────────────────

function RecentActivity({ exams, onSelectExam }: { exams: ExamDTO[]; onSelectExam: (id: string) => void }) {
  const recent = [...exams]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  if (recent.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Recent Activity</h3>
      </div>
      <div className="space-y-2">
        {recent.map((exam) => (
          <button
            key={exam.id}
            onClick={() => onSelectExam(exam.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors text-left"
          >
            <div className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              exam.resultStatus === 'Result Declared' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              exam.resultStatus === 'Result Ready' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' :
              exam.resultStatus === 'Under Verification' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' :
              exam.resultStatus === 'Marks Entry' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
              'bg-muted text-muted-foreground'
            )}>
              {exam.resultStatus === 'Result Declared' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{exam.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {exam.type} · {relativeTime(exam.updatedAt)}
              </p>
            </div>
            <StatusBadge status={exam.resultStatus} variant={
              exam.resultStatus === 'Result Declared' ? 'success' :
              exam.resultStatus === 'Result Ready' ? 'info' :
              exam.resultStatus === 'Under Verification' ? 'primary' :
              exam.resultStatus === 'Marks Entry' ? 'warning' : 'neutral'
            } />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Quick Actions ───────────────────────────────────────────────────

function QuickActions({ onNavigate, onGoToExams }: { onNavigate?: (s: string) => void; onGoToExams: () => void }) {
  const actions = [
    { label: 'Create Examination', icon: FileText, onClick: onGoToExams, primary: true },
    { label: 'Schedule', icon: Calendar, onClick: () => onNavigate?.('schedule') },
    { label: 'Marks', icon: ClipboardList, onClick: () => onNavigate?.('marks') },
    { label: 'Results', icon: CheckCircle2, onClick: () => onNavigate?.('results') },
    { label: 'Reports', icon: BarChart3, onClick: () => onNavigate?.('reports') },
    { label: 'Settings', icon: Zap, onClick: () => onNavigate?.('settings') },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" /> Quick Actions
      </h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            size="sm"
            variant={a.primary ? 'default' : 'outline'}
            className={cn(
              'h-8 text-xs gap-1.5',
              a.primary && 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
            onClick={a.onClick}
          >
            <a.icon className="h-3.5 w-3.5" /> {a.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────

function SkeletonHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="h-3 w-64 rounded bg-muted/60 animate-pulse" />
        </div>
      </div>
      <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex justify-between">
        <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-7 w-20 rounded bg-muted animate-pulse" />
      <div className="h-2.5 w-24 rounded bg-muted/60 animate-pulse" />
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-3', className)}>
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
            <div className="h-3 flex-1 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
