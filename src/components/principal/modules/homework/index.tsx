'use client'

/**
 * HomeworkModule — Principal-facing Homework oversight.
 *
 * Architecture: full-screen workspace, NOT modal.
 *   • List view (KPIs + analytics + filters + cards)
 *   • Homework Workspace (full-screen, 5 sections)
 *   • Assign Homework (full-screen, 5-step wizard)
 *
 * Reads exclusively from /api/homework/* — no localStorage, no mock data.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Clock, CheckCircle2, AlertTriangle, Search, X } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { InlineLoading } from '../exams/inline-loading'
import { useHomeworkList, useHomeworkAnalytics, type HomeworkDTO, type ClassOption, type TeacherOption } from '@/lib/homework/use-homework'
import { HomeworkWorkspace } from './homework-workspace'
import { AssignHomeworkFullScreen } from './assign-homework-fullscreen'
import { cn } from '@/lib/utils'

type View = { kind: 'list' } | { kind: 'workspace'; homeworkId: string } | { kind: 'assign' }

export function HomeworkModule() {
  const [view, setView] = useState<View>({ kind: 'list' })
  const { homework, classes, teachers, loading, error, reload } = useHomeworkList()
  const { analytics } = useHomeworkAnalytics()

  // Full-screen views take over
  if (view.kind === 'workspace') {
    return (
      <HomeworkWorkspace
        homeworkId={view.homeworkId}
        onBack={() => setView({ kind: 'list' })}
        onMutated={reload}
      />
    )
  }
  if (view.kind === 'assign') {
    return (
      <AssignHomeworkFullScreen
        classes={classes}
        teachers={teachers}
        onBack={() => setView({ kind: 'list' })}
        onCreated={(hw) => {
          reload()
          setView({ kind: 'workspace', homeworkId: hw.id })
        }}
      />
    )
  }

  return (
    <HomeworkList
      homework={homework}
      classes={classes}
      teachers={teachers}
      analytics={analytics}
      loading={loading}
      error={error}
      onOpen={(id) => setView({ kind: 'workspace', homeworkId: id })}
      onAssign={() => setView({ kind: 'assign' })}
      onReload={reload}
    />
  )
}

// ─── List View ────────────────────────────────────────────────────────

interface ListProps {
  homework: HomeworkDTO[]
  classes: ClassOption[]
  teachers: TeacherOption[]
  analytics: any
  loading: boolean
  error: string | null
  onOpen: (id: string) => void
  onAssign: () => void
  onReload: () => void
}

function HomeworkList({ homework, classes, teachers, analytics, loading, error, onOpen, onAssign }: ListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState('all')

  const filtered = useMemo(() => {
    return homework.filter((h) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'overdue' && h.derivedStatus !== 'OVERDUE') return false
        if (statusFilter === 'due_today' && h.derivedStatus !== 'DUE_TODAY') return false
        if (statusFilter === 'active' && !['ACTIVE', 'DUE_TODAY'].includes(h.derivedStatus)) return false
        if (statusFilter === 'draft' && h.derivedStatus !== 'DRAFT') return false
        if (statusFilter === 'closed' && h.derivedStatus !== 'CLOSED') return false
      }
      if (classFilter !== 'all' && h.classId !== classFilter) return false
      if (subjectFilter !== 'all' && h.subjectId !== subjectFilter) return false
      if (teacherFilter !== 'all' && h.teacherId !== teacherFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!h.title.toLowerCase().includes(q) && !(h.teacherName ?? '').toLowerCase().includes(q) && !(h.subjectName ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [homework, statusFilter, classFilter, subjectFilter, teacherFilter, search])

  const allSubjects = useMemo(() => {
    const seen = new Map<string, string>()
    classes.forEach((c) => c.subjects.forEach((s) => seen.set(s.id, s.name)))
    homework.forEach((h) => { if (h.subjectId && h.subjectName) seen.set(h.subjectId, h.subjectName) })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [classes, homework])

  const activeFilterCount = [statusFilter !== 'all', classFilter !== 'all', subjectFilter !== 'all', teacherFilter !== 'all', search !== ''].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setClassFilter('all')
    setSubjectFilter('all')
    setTeacherFilter('all')
  }

  if (loading) {
    return (
      <PageTransition>
        <InlineLoading label="Loading homework…" />
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">Failed to load homework</p>
          <p className="text-xs text-rose-600/70 mt-1">{error}</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Homework</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor and manage homework across classes, subjects and teachers.</p>
        </div>
        <Button onClick={onAssign} size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-3.5 w-3.5" /> Assign Homework
        </Button>
      </div>

      {/* KPI Row */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Active Homework" value={analytics.activeHomework} sub={`${analytics.totalHomework} total`} icon={<BookOpen className="h-3.5 w-3.5" />} tone="emerald" onClick={() => setStatusFilter('active')} />
          <KpiCard label="Total Submissions" value={analytics.totalSubmissions} sub={`${analytics.completionRate}% completion`} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="sky" />
          <KpiCard label="Completion Rate" value={`${analytics.completionRate}%`} sub="Across all homework" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" />
          <KpiCard label="Pending Review" value={analytics.pendingReview} sub={`${analytics.overdue} overdue`} icon={<Clock className="h-3.5 w-3.5" />} tone="amber" onClick={() => setStatusFilter('overdue')} />
        </div>
      )}

      {/* Secondary indicators */}
      {analytics && (analytics.dueToday > 0 || analytics.overdue > 0) && (
        <div className="flex flex-wrap gap-2">
          {analytics.dueToday > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              <Clock className="h-3 w-3" /> {analytics.dueToday} due today
            </div>
          )}
          {analytics.overdue > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 text-[10px] font-medium text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-3 w-3" /> {analytics.overdue} overdue
            </div>
          )}
        </div>
      )}

      {/* Analytics */}
      {analytics && analytics.totalHomework > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ClassCompletionChart data={analytics.byClass} />
          <SubjectDistributionChart data={analytics.bySubject} total={analytics.totalHomework} />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search homework, teacher, subject…"
              className="h-8 pl-8 pr-3 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="due_today">Due Today</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger size="sm" className="w-[140px] text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger size="sm" className="w-[140px] text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {allSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger size="sm" className="w-[140px] text-xs"><SelectValue placeholder="Teacher" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeFilterCount > 0 && (
            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Clear ({activeFilterCount})
            </Button>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} of {homework.length}</span>
        </div>
      </div>

      {/* Homework list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            {homework.length === 0 ? 'No homework assigned yet. Click "Assign Homework" to create one.' : 'No homework matches your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((hw, i) => (
            <HomeworkCard key={hw.id} homework={hw} delay={i} onOpen={() => onOpen(hw.id)} />
          ))}
        </div>
      )}
    </PageTransition>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, tone, onClick }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  tone: 'emerald' | 'sky' | 'amber'
  onClick?: () => void
}) {
  const toneClasses = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border hover:border-emerald-500/40' },
    sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/5', border: 'border-border hover:border-sky-500/40' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5', border: 'border-border hover:border-amber-500/40' },
  }[tone]
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn('text-left rounded-xl border p-3 sm:p-4 transition-all', toneClasses.bg, toneClasses.border, !onClick && 'cursor-default')}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
        <span className={toneClasses.text}>{icon}</span>
      </div>
      <p className={cn('font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', toneClasses.text)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </button>
  )
}

// ─── Class Completion Chart ──────────────────────────────────────────

function ClassCompletionChart({ data }: { data: Array<{ classId: string; className: string; assigned: number; submitted: number; pending: number; completionPct: number }> }) {
  if (data.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Completion Rate by Class</h3>
      <div className="space-y-2">
        {data.map((c, i) => (
          <div key={c.classId ?? i} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-foreground">{c.className}</span>
              <span className="text-muted-foreground tabular-nums">
                {c.submitted}/{c.assigned * 10} · {c.completionPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.completionPct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'h-full rounded-full',
                  c.completionPct >= 80 ? 'bg-emerald-500' :
                  c.completionPct >= 50 ? 'bg-amber-500' :
                  'bg-rose-500'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Subject Distribution Chart ──────────────────────────────────────

function SubjectDistributionChart({ data, total }: {
  data: Array<{ subjectId: string | null; subjectName: string; count: number }>
  total: number
}) {
  if (data.length === 0) return null
  const colors = ['oklch(0.55 0.14 162)', 'oklch(0.7 0.15 200)', 'oklch(0.75 0.15 75)', 'oklch(0.7 0.18 50)', 'oklch(0.62 0.2 25)', 'oklch(0.6 0.15 300)']
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Subject Distribution</h3>
      <div className="flex items-center gap-3">
        <div className="shrink-0" style={{ width: 110, height: 110 }}>
          <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
            {(() => {
              let offset = 0
              const circumference = 2 * Math.PI * 40
              return data.map((s, i) => {
                const pct = total > 0 ? (s.count / total) : 0
                const dash = pct * circumference
                const gap = circumference - dash
                const seg = (
                  <circle
                    key={i}
                    cx="55" cy="55" r="40"
                    fill="none"
                    stroke={colors[i % colors.length]}
                    strokeWidth="14"
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-offset}
                  />
                )
                offset += dash
                return seg
              })
            })()}
            <text x="55" y="50" textAnchor="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '55px 55px' }}>
              {total}
            </text>
            <text x="55" y="65" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8, transform: 'rotate(90deg)', transformOrigin: '55px 55px' }}>
              total
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-1">
          {data.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
              <span className="text-muted-foreground flex-1 truncate">{s.subjectName}</span>
              <span className="font-semibold tabular-nums">{s.count}</span>
              <span className="text-muted-foreground text-[9px]">{total > 0 ? Math.round((s.count / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Homework Card ───────────────────────────────────────────────────

function HomeworkCard({ homework, delay, onOpen }: { homework: HomeworkDTO; delay: number; onOpen: () => void }) {
  const sub = homework.submissionSummary
  const submitPct = sub.total > 0 ? Math.round((sub.submitted / sub.total) * 100) : 0
  const reviewPct = sub.submitted > 0 ? Math.round((sub.reviewed / sub.submitted) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay * 0.04, 0.3), duration: 0.25 }}
      onClick={onOpen}
      className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all group"
    >
      {/* Header: subject + class + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {homework.subjectName ?? 'General'} · {homework.className}
          </p>
          <p className="font-semibold text-sm text-foreground truncate mt-0.5">{homework.title}</p>
        </div>
        <DerivedStatusPill status={homework.derivedStatus} />
      </div>

      {/* Description */}
      {homework.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{homework.description}</p>
      )}

      {/* Teacher + dates */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
        <span className="truncate">{homework.teacherName ?? '—'}</span>
        <span>·</span>
        <span>Due {homework.dueDate}</span>
      </div>

      {/* Submission progress */}
      <div className="space-y-1.5 mb-2">
        <div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
            <span>Submissions</span>
            <span className="font-semibold tabular-nums">{sub.submitted}/{sub.total}</span>
          </div>
          <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${submitPct}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
        {sub.submitted > 0 && (
          <div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
              <span>Reviewed</span>
              <span className="font-semibold tabular-nums">{sub.reviewed}/{sub.submitted}</span>
            </div>
            <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${reviewPct}%` }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        {sub.late > 0 && (
          <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 dark:text-amber-300">
            <Clock className="h-2.5 w-2.5" /> {sub.late} late
          </span>
        )}
        {sub.pending > 0 && (
          <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-2.5 w-2.5" /> {sub.pending} pending review
          </span>
        )}
        <span className="text-[10px] text-primary ml-auto group-hover:translate-x-0.5 transition-transform font-medium">
          View →
        </span>
      </div>
    </motion.div>
  )
}

function DerivedStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground border-border',
    ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    DUE_TODAY: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    OVERDUE: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    CLOSED: 'bg-muted text-muted-foreground border-border',
    ARCHIVED: 'bg-muted text-muted-foreground border-border',
  }
  const label: Record<string, string> = {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    DUE_TODAY: 'Due Today',
    OVERDUE: 'Overdue',
    CLOSED: 'Closed',
    ARCHIVED: 'Archived',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold shrink-0', map[status] ?? 'bg-muted text-muted-foreground border-border')}>{label[status] ?? status}</span>
}
