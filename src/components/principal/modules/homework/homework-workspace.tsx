'use client'

/**
 * HomeworkWorkspace — full-screen homework workspace.
 *
 * Top header: ← Back to Homework + title + subject · class · teacher + status.
 * Sections: Overview | Submissions | Students | Content | Activity
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, Users, BookOpen, History, FileText, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { InlineLoading } from '../exams/inline-loading'
import { useHomework, useHomeworkAudit, useHomeworkAction } from '@/lib/homework/use-homework'
import { ReviewSubmissionDialog } from './review-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  homeworkId: string
  onBack: () => void
  onMutated: () => void
}

type Tab = 'overview' | 'submissions' | 'students' | 'content' | 'activity'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'students', label: 'Students' },
  { value: 'content', label: 'Content' },
  { value: 'activity', label: 'Activity' },
]

export function HomeworkWorkspace({ homeworkId, onBack, onMutated }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { homework, submissions, loading, error, reload } = useHomework(homeworkId)

  const handleReload = () => {
    reload()
    onMutated()
  }

  return (
    <div className="flex flex-col h-full -mt-4 -mx-4 sm:-mx-6">
      {/* Top header */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" /> Homework
              </Button>
              <div className="h-5 w-px bg-border" />
              <div className="min-w-0">
                <h1 className="text-base font-semibold truncate">{homework?.title ?? 'Loading…'}</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {homework ? `${homework.subjectName ?? 'General'} · ${homework.className} · ${homework.teacherName ?? '—'}` : ''}
                </p>
              </div>
            </div>
            {homework && <DerivedStatusPill status={homework.derivedStatus} />}
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-3 overflow-x-auto">
          <SegmentedTabs tabs={TABS} value={tab} onValueChange={(v) => setTab(v as Tab)} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <InlineLoading label="Loading homework…" />
        ) : error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        ) : !homework ? null : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
              {tab === 'overview' && <OverviewSection homework={homework} onReload={handleReload} onNavigate={setTab} />}
              {tab === 'submissions' && <SubmissionsSection homework={homework} submissions={submissions} onReload={handleReload} />}
              {tab === 'students' && <StudentsSection homework={homework} submissions={submissions} onReload={handleReload} />}
              {tab === 'content' && <ContentSection homework={homework} />}
              {tab === 'activity' && <ActivitySection homeworkId={homework.id} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
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
    DRAFT: 'Draft', ACTIVE: 'Active', DUE_TODAY: 'Due Today', OVERDUE: 'Overdue', CLOSED: 'Closed', ARCHIVED: 'Archived',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', map[status] ?? 'bg-muted text-muted-foreground border-border')}>{label[status] ?? status}</span>
}

// ─── Overview Section ─────────────────────────────────────────────────

function OverviewSection({ homework, onReload, onNavigate }: { homework: any; onReload: () => void; onNavigate: (t: Tab) => void }) {
  const { action } = useHomeworkAction()
  const sub = homework.submissionSummary

  const handleAction = async (a: 'publish' | 'close' | 'archive' | 'duplicate') => {
    try {
      await action(homework.id, { action: a })
      toast.success(`Homework ${a}${a === 'duplicate' ? 'd' : 'ed'}`)
      onReload()
    } catch (e: any) {
      toast.error(`Failed to ${a}`, { description: e.message })
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Assigned" value={sub.total} sub="students" />
        <Kpi label="Submitted" value={sub.submitted} sub={`${sub.late} late`} />
        <Kpi label="Reviewed" value={sub.reviewed} sub={`${sub.pending} pending`} />
        <Kpi label="Completion" value={`${sub.total > 0 ? Math.round((sub.submitted / sub.total) * 100) : 0}%`} sub="submission rate" />
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Homework Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DetailField label="Subject" value={homework.subjectName ?? 'General'} />
          <DetailField label="Class" value={homework.className} />
          <DetailField label="Teacher" value={homework.teacherName ?? '—'} />
          <DetailField label="Assigned" value={homework.assignedDate} />
          <DetailField label="Due Date" value={homework.dueDate} />
          <DetailField label="Due Time" value={homework.dueTime} />
          <DetailField label="Max Marks" value={homework.maxMarks ? String(homework.maxMarks) : '—'} />
          <DetailField label="Grading" value={homework.gradingType} />
        </div>
        {homework.description && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Description</p>
            <p className="text-xs text-foreground">{homework.description}</p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Submission Progress</h3>
          <ProgressBar label="Submitted" value={sub.submitted} total={sub.total} color="bg-primary" />
          <ProgressBar label="Reviewed" value={sub.reviewed} total={sub.total} color="bg-emerald-500" />
          <ProgressBar label="Not Started" value={sub.notStarted} total={sub.total} color="bg-muted-foreground" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Late & Returns</h3>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Late Submissions" value={sub.late} tone="amber" />
            <StatBox label="Returned" value={sub.returned} tone="rose" />
            <StatBox label="Pending Review" value={sub.pending} tone="sky" />
            <StatBox label="Reviewed" value={sub.reviewed} tone="emerald" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {homework.status === 'DRAFT' && (
            <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction('publish')}>
              <CheckCircle2 className="h-3 w-3" /> Publish
            </Button>
          )}
          {['PUBLISHED', 'ACTIVE'].includes(homework.status) && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('close')}>
              Close
            </Button>
          )}
          {homework.status !== 'ARCHIVED' && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('archive')}>
              Archive
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('duplicate')}>
            Duplicate
          </Button>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="text-xs font-medium truncate">{value}</p>
    </div>
  )
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatBox({ label, value, tone }: { label: string; value: number; tone: string }) {
  const cls = {
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    sky: 'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  }[tone] ?? 'text-foreground'
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={cn('font-display text-lg font-bold', cls)}>{value}</p>
    </div>
  )
}

// ─── Submissions Section ─────────────────────────────────────────────

function SubmissionsSection({ homework, submissions, onReload }: { homework: any; submissions: any[]; onReload: () => void }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reviewing, setReviewing] = useState<string | null>(null)

  const filtered = submissions.filter((s) => {
    if (filter === 'pending' && !['SUBMITTED', 'LATE'].includes(s.status)) return false
    if (filter === 'submitted' && !['SUBMITTED', 'LATE', 'REVIEWED', 'RETURNED', 'RESUBMISSION_REQUIRED'].includes(s.status)) return false
    if (filter === 'reviewed' && s.status !== 'REVIEWED') return false
    if (filter === 'late' && !s.submittedLate) return false
    if (filter === 'missing' && s.status !== 'NOT_STARTED') return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.studentName.toLowerCase().includes(q) && !(s.studentRollNo ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const reviewingSubmission = submissions.find((s) => s.id === reviewing)

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-2">
        <SegmentedTabs
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'late', label: 'Late' },
            { value: 'missing', label: 'Missing' },
          ]}
          value={filter}
          onValueChange={setFilter}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student…"
          className="h-8 text-xs w-[180px]"
        />
        <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} of {submissions.length}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Roll No</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Student</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Submitted</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Late</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Marks</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">No submissions match filters.</TableCell>
                </TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <TableCell className="text-xs font-mono">{s.studentRollNo ?? '—'}</TableCell>
                  <TableCell className="text-xs font-medium">{s.studentName}</TableCell>
                  <TableCell><SubmissionStatusPill status={s.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    {s.submittedLate ? (
                      <span className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                        {s.lateByMinutes ? `${Math.floor(s.lateByMinutes / 60)}h ${s.lateByMinutes % 60}m` : 'Late'}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-center tabular-nums">
                    {s.marks !== null ? `${s.marks}/${homework.maxMarks ?? '?'}` : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={() => setReviewing(s.id)}
                      disabled={s.status === 'NOT_STARTED'}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {reviewingSubmission && (
        <ReviewSubmissionDialog
          submission={reviewingSubmission}
          homework={homework}
          onClose={() => setReviewing(null)}
          onReviewed={() => {
            setReviewing(null)
            onReload()
          }}
        />
      )}
    </div>
  )
}

function SubmissionStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    NOT_STARTED: 'bg-muted text-muted-foreground border-border',
    IN_PROGRESS: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    SUBMITTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    LATE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    REVIEWED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    RETURNED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    RESUBMISSION_REQUIRED: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  }
  const label: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    SUBMITTED: 'Submitted',
    LATE: 'Late',
    REVIEWED: 'Reviewed',
    RETURNED: 'Returned',
    RESUBMISSION_REQUIRED: 'Resubmit Required',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', map[status] ?? 'bg-muted text-muted-foreground border-border')}>{label[status] ?? status}</span>
}

// ─── Students Section ─────────────────────────────────────────────────

function StudentsSection({ submissions, onReload }: { homework: any; submissions: any[]; onReload: () => void }) {
  void onReload
  const submitted = submissions.filter((s) => ['SUBMITTED', 'LATE', 'REVIEWED', 'RETURNED', 'RESUBMISSION_REQUIRED'].includes(s.status))
  const notSubmitted = submissions.filter((s) => s.status === 'NOT_STARTED')

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Submitted ({submitted.length})
          </h3>
          <div className="space-y-1">
            {submitted.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs p-1.5 rounded border border-border/40">
                <span>{s.studentName} ({s.studentRollNo ?? '—'})</span>
                <SubmissionStatusPill status={s.status} />
              </div>
            ))}
            {submitted.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No submissions yet.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Not Submitted ({notSubmitted.length})
          </h3>
          <div className="space-y-1">
            {notSubmitted.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs p-1.5 rounded border border-border/40">
                <span>{s.studentName} ({s.studentRollNo ?? '—'})</span>
                <span className="text-[9px] text-muted-foreground">Pending</span>
              </div>
            ))}
            {notSubmitted.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">All students submitted.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Content Section ─────────────────────────────────────────────────

function ContentSection({ homework }: { homework: any }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Homework Content
        </h3>
        {homework.content ? (
          <div className="prose prose-sm max-w-none text-xs">
            <pre className="whitespace-pre-wrap font-sans text-xs text-foreground">{homework.content}</pre>
          </div>
        ) : homework.description ? (
          <p className="text-xs text-foreground">{homework.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground">No content provided.</p>
        )}
      </div>

      {homework.topic || homework.chapter || homework.learningObjective ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Learning Context</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {homework.topic && <DetailField label="Topic" value={homework.topic} />}
            {homework.chapter && <DetailField label="Chapter" value={homework.chapter} />}
            {homework.learningObjective && <DetailField label="Objective" value={homework.learningObjective} />}
          </div>
        </div>
      ) : null}

      {homework.attachments && homework.attachments.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Attachments</h3>
          <div className="space-y-1">
            {homework.attachments.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border border-border/40">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs flex-1 truncate">{a.name}</span>
                <span className="text-[9px] text-muted-foreground">{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── Activity Section ─────────────────────────────────────────────────

function ActivitySection({ homeworkId }: { homeworkId: string }) {
  const { logs, loading } = useHomeworkAudit(homeworkId)
  if (loading) return <InlineLoading label="Loading activity…" />
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
        No activity recorded yet.
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs font-semibold">Activity Trail ({logs.length} entries)</p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted/40 sticky top-0">
            <TableRow>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Timestamp</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Action</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">User</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="text-xs font-mono font-semibold text-primary">{log.action}</TableCell>
                <TableCell className="text-xs">{log.userName ?? '—'}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground max-w-[200px] truncate">
                  {log.oldValue && <span className="text-rose-600">-{log.oldValue.slice(0, 40)}</span>}
                  {log.newValue && <span className="text-emerald-600 ml-1">+{log.newValue.slice(0, 40)}</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
