'use client'

/**
 * Marks section for the ExamWorkspace.
 *
 * The paper-level workflow control center — entry → submit → verify →
 * lock → declare → publish. Contains:
 *  - MarksSection (parent)
 *  - SubjectAnalytics
 *  - ResultsInline (per-class results table + drill-down)
 *  - StudentResultDetail (single-student breakdown)
 *  - PaperTimelineInline (audit timeline drawer for one paper)
 */

import { useState, useMemo } from 'react'
import { Award, CheckCircle2, Clock, Download, FileText, Lock, Megaphone, Pencil, RotateCcw, Search, Send, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useSubmitMarksMock,
  useVerifyMarksMock,
  useLockMarksMock,
  useUnlockMarksMock,
  useDeclareResultsMock,
  usePublishResultsMock,
} from '@/lib/exams/use-marks-mock'
import {
  useMockMarksStore,
  type PaperTimelineEvent,
} from '@/lib/exams/mock-marks-data'
import { useStudentsStore } from '@/lib/store/students-store'
import { generateClassResultPDF, generateStudentResultPDF } from '@/lib/exams/result-pdf'
import type { ExamDTO } from '@/lib/exams/types'
import { CollapsibleSection } from './collapsible-section'
import { Stat, teacherForSubject } from './workspace-shared'

// ─── Marks Section — paper-level workflow control center ──────────────

export function MarksSection({ exam, onReload }: { exam: ExamDTO; onReload: () => void }) {
  const { submit } = useSubmitMarksMock()
  const { verify } = useVerifyMarksMock()
  const { lock } = useLockMarksMock()
  const { unlock } = useUnlockMarksMock()
  const { declare } = useDeclareResultsMock()
  const { publish } = usePublishResultsMock()
  const [classId, setClassId] = useState(exam.classes[0]?.classId ?? '')
  const [showResults, setShowResults] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<{ classId: string; subjectId: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const storeMarks = useMockMarksStore((s) => s.marks)
  const declaredClassIds = useMockMarksStore((s) => s.declaredClassIds)
  const publishedClassIds = useMockMarksStore((s) => s.publishedClassIds)

  const allMarks = useMemo(() => storeMarks.filter((m) => m.examId === exam.id), [storeMarks, exam.id])

  // Summary
  const summary = useMemo(() => {
    const total = allMarks.length
    const entered = allMarks.filter((m) => m.marksObtained !== null).length
    const submitted = allMarks.filter((m) => ['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(m.workflowStatus)).length
    const verified = allMarks.filter((m) => ['VERIFIED', 'LOCKED'].includes(m.workflowStatus)).length
    const locked = allMarks.filter((m) => m.workflowStatus === 'LOCKED').length
    const pct = total > 0 ? Math.round((entered / total) * 100) : 0
    return { total, entered, submitted, verified, locked, pct }
  }, [allMarks])

  // Per-class result readiness
  const classReadiness = useMemo(() => {
    return exam.classes.map((c: any) => {
      const classMarks = allMarks.filter((m) => m.classId === c.classId)
      const classSubjects = exam.subjects.filter((s: any) => s.classId === c.classId)
      const lockedPapers = new Set(
        classMarks.filter((m) => m.workflowStatus === 'LOCKED').map((m) => m.subjectId)
      )
      const isReady = classSubjects.length > 0 && classSubjects.every((s: any) => lockedPapers.has(s.subjectId))
      const isDeclared = declaredClassIds.includes(`${exam.id}:${c.classId}`)
      const isPublished = publishedClassIds.includes(`${exam.id}:${c.classId}`)
      return {
        classId: c.classId, className: c.className,
        totalPapers: classSubjects.length,
        lockedPapers: lockedPapers.size,
        missingPapers: classSubjects.filter((s: any) => !lockedPapers.has(s.subjectId)),
        isReady, isDeclared, isPublished,
      }
    })
  }, [exam, allMarks, declaredClassIds, publishedClassIds])

  // Subject-wise progress rows — with teacher ownership
  const subjectRows = useMemo(() => {
    const rows: Array<{ classId: string; className: string; subjectId: string; subjectName: string; teacher: string; total: number; entered: number; status: string }> = []
    for (const c of exam.classes) {
      for (const subj of exam.subjects.filter((s: any) => s.classId === c.classId)) {
        const marks = allMarks.filter((m) => m.classId === c.classId && m.subjectId === subj.subjectId)
        const entered = marks.filter((m) => m.marksObtained !== null).length
        const statuses = new Set(marks.map((m) => m.workflowStatus))
        const allLocked = marks.length > 0 && [...statuses].every((s) => s === 'LOCKED')
        const allVerified = marks.length > 0 && [...statuses].every((s) => ['VERIFIED', 'LOCKED'].includes(s))
        const allSubmitted = marks.length > 0 && [...statuses].every((s) => ['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(s))
        const status = allLocked ? 'LOCKED' : allVerified ? 'VERIFIED' : allSubmitted ? 'SUBMITTED' : entered > 0 ? 'IN_PROGRESS' : 'DRAFT'
        rows.push({
          classId: c.classId, className: c.className,
          subjectId: subj.subjectId, subjectName: subj.subjectName,
          teacher: teacherForSubject(subj.subjectName),
          total: marks.length, entered, status,
        })
      }
    }
    return rows
  }, [exam, allMarks])

  // Filtered subject rows (search + status filter).
  const filteredSubjectRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return subjectRows.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (q) {
        return r.subjectName.toLowerCase().includes(q) ||
               r.className.toLowerCase().includes(q) ||
               r.teacher.toLowerCase().includes(q)
      }
      return true
    })
  }, [subjectRows, searchQuery, filterStatus])

  const hasFilters = searchQuery.trim() !== '' || filterStatus !== 'all'

  // Bulk action: verify all submitted papers in the filtered view.
  const handleBulkVerify = async () => {
    const toVerify = filteredSubjectRows.filter((r) => r.status === 'SUBMITTED')
    if (toVerify.length === 0) { toast.info('No submitted papers to verify in the current view'); return }
    let total = 0
    for (const r of toVerify) {
      const res = await verify(exam.id, { classId: r.classId, subjectId: r.subjectId })
      total += res.verified
    }
    toast.success(`Verified ${total} marks across ${toVerify.length} papers`)
    onReload()
  }

  // Bulk action: lock all verified papers in the filtered view.
  const handleBulkLock = async () => {
    const toLock = filteredSubjectRows.filter((r) => r.status === 'VERIFIED')
    if (toLock.length === 0) { toast.info('No verified papers to lock in the current view'); return }
    let total = 0
    for (const r of toLock) {
      const res = await lock(exam.id, { classId: r.classId, subjectId: r.subjectId })
      total += res.locked
    }
    toast.success(`Locked ${total} marks across ${toLock.length} papers`)
    onReload()
  }

  const bulkVerifyCount = filteredSubjectRows.filter((r) => r.status === 'SUBMITTED').length
  const bulkLockCount = filteredSubjectRows.filter((r) => r.status === 'VERIFIED').length

  const handleAction = async (action: 'submit' | 'verify' | 'lock' | 'unlock' | 'declare' | 'publish', cid?: string, sid?: string) => {
    try {
      const filter = cid ? { classId: cid, ...(sid ? { subjectId: sid } : {}) } : {}
      if (action === 'submit') { const r = await submit(exam.id, filter); toast.success(`Submitted ${r.submitted} marks`) }
      else if (action === 'verify') { const r = await verify(exam.id, filter); toast.success(`Verified ${r.verified} marks`) }
      else if (action === 'lock') { const r = await lock(exam.id, filter); toast.success(`Locked ${r.locked} marks`) }
      else if (action === 'unlock') { const r = await unlock(exam.id, filter, 'Principal review'); toast.success(`Unlocked ${r.unlocked} marks for review`) }
      else if (action === 'declare') { await declare(exam.id, cid); toast.success(`${classReadiness.find((c) => c.classId === cid)?.className} results declared`) }
      else if (action === 'publish') { const r = await publish(exam.id, cid); toast.success(`Published · ${r.notificationsSent} students notified`) }
      onReload()
    } catch (e: any) { toast.error('Action failed', { description: e.message }) }
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label="Students" value={String(summary.total)} />
        <Stat label="Entered" value={`${summary.entered}/${summary.total}`} pct={summary.pct} />
        <Stat label="Submitted" value={String(summary.submitted)} />
        <Stat label="Verified" value={String(summary.verified)} />
        <Stat label="Locked" value={String(summary.locked)} />
        <Stat label="Papers" value={String(subjectRows.length)} />
      </div>

      {/* Subject-wise progress — paper-level actions with teacher ownership */}
      <CollapsibleSection
        title="Subject Progress (per paper)"
        subtitle={`${filteredSubjectRows.length} of ${subjectRows.length} papers`}
        accent="violet"
        actions={
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, class, teacher…"
                className="h-6 text-[10px] pl-5 pr-2 rounded bg-transparent border border-border/40 focus:border-primary/40 focus:outline-none w-44"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1"
            >
              <option value="all">All Status</option>
              <option value="LOCKED">Locked</option>
              <option value="VERIFIED">Verified</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DRAFT">Not Started</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => { setSearchQuery(''); setFilterStatus('all') }}
                className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                title="Clear filters"
              >
                <RotateCcw className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        }
      >
        {/* Bulk actions bar */}
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 bg-muted/20">
          <span className="text-[9px] uppercase font-semibold text-muted-foreground">Bulk Actions:</span>
          <button
            onClick={handleBulkVerify}
            disabled={bulkVerifyCount === 0}
            className={cn(
              'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-medium transition-colors',
              bulkVerifyCount > 0 ? 'text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20' : 'text-muted-foreground/40 bg-muted/20 cursor-not-allowed',
            )}
            title={bulkVerifyCount > 0 ? `Verify ${bulkVerifyCount} submitted paper(s)` : 'No submitted papers to verify'}
          >
            <CheckCircle2 className="h-2.5 w-2.5" /> Verify All
            {bulkVerifyCount > 0 && <span className="ml-0.5 px-1 rounded bg-sky-500/20 text-[8px] font-bold">{bulkVerifyCount}</span>}
          </button>
          <button
            onClick={handleBulkLock}
            disabled={bulkLockCount === 0}
            className={cn(
              'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-medium transition-colors',
              bulkLockCount > 0 ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-muted-foreground/40 bg-muted/20 cursor-not-allowed',
            )}
            title={bulkLockCount > 0 ? `Lock ${bulkLockCount} verified paper(s)` : 'No verified papers to lock'}
          >
            <Lock className="h-2.5 w-2.5" /> Lock All
            {bulkLockCount > 0 && <span className="ml-0.5 px-1 rounded bg-emerald-500/20 text-[8px] font-bold">{bulkLockCount}</span>}
          </button>
          <span className="ml-auto text-[9px] text-muted-foreground">
            Applies to {filteredSubjectRows.length} filtered paper(s)
          </span>
        </div>
        <div className="overflow-x-auto max-h-[20rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Class</th>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Subject</th>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Teacher</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Entered</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjectRows.map((r, i) => {
                const enteredPct = r.total > 0 ? Math.round((r.entered / r.total) * 100) : 0
                return (
                <tr key={i} className="border-t border-border/40 hover:bg-muted/40 even:bg-muted/15 transition-colors">
                  <td className="px-2 py-2 text-muted-foreground text-[11px]">{r.className}</td>
                  <td className="px-2 py-2 font-medium text-[11px]">{r.subjectName}</td>
                  <td className="px-2 py-2 text-muted-foreground text-[11px]">{r.teacher}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="text-[11px] tabular-nums font-medium">{r.entered}/{r.total}</span>
                      <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', enteredPct === 100 ? 'bg-emerald-500' : enteredPct > 0 ? 'bg-amber-500' : 'bg-muted-foreground/30')}
                          style={{ width: `${enteredPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {r.status === 'LOCKED' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <Lock className="h-2.5 w-2.5" /> Locked
                      </span>
                    ) : r.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                      </span>
                    ) : r.status === 'SUBMITTED' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <Send className="h-2.5 w-2.5" /> Submitted
                      </span>
                    ) : r.status === 'IN_PROGRESS' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/5 text-amber-600 border border-amber-500/15">
                        <Clock className="h-2.5 w-2.5" /> In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-muted/40 text-muted-foreground border border-border/40">
                        Not Started
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {r.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleAction('submit', r.classId, r.subjectId)} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-primary hover:bg-primary/10 transition-colors">
                          <Send className="h-2.5 w-2.5" /> Submit
                        </button>
                      )}
                      {r.status === 'SUBMITTED' && (
                        <button onClick={() => handleAction('verify', r.classId, r.subjectId)} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-sky-600 hover:bg-sky-500/10 transition-colors">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verify
                        </button>
                      )}
                      {r.status === 'VERIFIED' && (
                        <button onClick={() => handleAction('lock', r.classId, r.subjectId)} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-emerald-600 hover:bg-emerald-500/10 transition-colors">
                          <Lock className="h-2.5 w-2.5" /> Lock
                        </button>
                      )}
                      {r.status === 'LOCKED' && (
                        <button
                          onClick={() => handleAction('unlock', r.classId, r.subjectId)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
                          title="Unlock for editing (Principal only)"
                        >
                          <Unlock className="h-2.5 w-2.5" /> Unlock
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPaper({ classId: r.classId, subjectId: r.subjectId })}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View timeline"
                      >
                        <Clock className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {filteredSubjectRows.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">{hasFilters ? `No papers match your filters.` : 'No subjects configured.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Class result control — per-class declaration + publish */}
      <CollapsibleSection title="Class Results" subtitle={`${classReadiness.length} classes`} accent="emerald">
        <div className="divide-y divide-border/40">
          {classReadiness.map((c) => (
            <div key={c.classId} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium">{c.className}</p>
                <p className="text-[9px] text-muted-foreground">
                  {c.lockedPapers}/{c.totalPapers} papers locked
                  {!c.isReady && c.missingPapers.length > 0 && ` · Missing: ${c.missingPapers.map((m: any) => m.subjectName).join(', ')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.isPublished ? (
                  <span className="text-[9px] font-medium text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> Published</span>
                ) : c.isDeclared ? (
                  <button onClick={() => handleAction('publish', c.classId)} className="text-[9px] text-primary hover:underline flex items-center gap-0.5"><Megaphone className="h-2.5 w-2.5" /> Publish</button>
                ) : c.isReady ? (
                  <button onClick={() => handleAction('declare', c.classId)} className="text-[9px] text-primary hover:underline flex items-center gap-0.5"><Award className="h-2.5 w-2.5" /> Declare</button>
                ) : (
                  <span className="text-[9px] text-amber-600">Pending</span>
                )}
                <button onClick={() => { setClassId(c.classId); setShowResults(true) }} className="text-[9px] text-muted-foreground hover:text-foreground hover:underline">View</button>
              </div>
            </div>
          ))}
          {classReadiness.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground">No classes configured.</div>}
        </div>
      </CollapsibleSection>

      {/* Paper timeline drawer */}
      {selectedPaper && (
        <PaperTimelineInline
          exam={exam}
          classId={selectedPaper.classId}
          subjectId={selectedPaper.subjectId}
          onClose={() => setSelectedPaper(null)}
        />
      )}

      {/* Results view */}
      {showResults && (
        <ResultsInline exam={exam} classId={classId} onClose={() => setShowResults(false)} />
      )}

      {/* Subject analytics */}
      <SubjectAnalytics exam={exam} allMarks={allMarks} />
    </div>
  )
}

function SubjectAnalytics({ exam, allMarks }: { exam: ExamDTO; allMarks: any[] }) {
  const [filterClass, setFilterClass] = useState('all')
  const analytics = useMemo(() => {
    const rows: Array<{ className: string; subjectName: string; entered: number; total: number; avg: number; highest: number; lowest: number; passCount: number; failCount: number; absentCount: number; pendingCount: number; pct: number }> = []
    for (const c of exam.classes) {
      if (filterClass !== 'all' && c.classId !== filterClass) continue
      for (const subj of exam.subjects.filter((s: any) => s.classId === c.classId)) {
        const marks = allMarks.filter((m) => m.classId === c.classId && m.subjectId === subj.subjectId)
        const entered = marks.filter((m) => m.marksObtained !== null)
        const total = marks.length
        const values = entered.map((m) => m.marksObtained!)
        const avg = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0
        const highest = values.length > 0 ? Math.max(...values) : 0
        const lowest = values.length > 0 ? Math.min(...values) : 0
        const passCount = values.filter((v) => v >= subj.maxMarks * 0.33).length
        const failCount = values.filter((v) => v < subj.maxMarks * 0.33).length
        const absentCount = marks.filter((m) => m.status === 'ABSENT').length
        const pendingCount = total - entered.length
        const pct = total > 0 ? Math.round((entered.length / total) * 100) : 0
        rows.push({ className: c.className, subjectName: subj.subjectName, entered: entered.length, total, avg, highest, lowest, passCount, failCount, absentCount, pendingCount, pct })
      }
    }
    return rows
  }, [exam, allMarks, filterClass])

  return (
    <CollapsibleSection
      title="Subject Analytics"
      subtitle={`${analytics.length} rows`}
      accent="sky"
      actions={
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="h-5 text-[9px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Classes</option>
          {exam.classes.map((c: any) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
        </select>
      }
    >
      <div className="overflow-x-auto max-h-[16rem]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="text-left px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Class</th>
              <th className="text-left px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Subject</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Entered</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Avg</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">High</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Low</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Pass</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Fail</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Absent</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {analytics.map((r, i) => (
              <tr key={i} className="border-t border-border/30 hover:bg-muted/20">
                <td className="px-2 py-1 text-muted-foreground">{r.className}</td>
                <td className="px-2 py-1 font-medium">{r.subjectName}</td>
                <td className="px-2 py-1 text-center tabular-nums">{r.entered}/{r.total}</td>
                <td className="px-2 py-1 text-center tabular-nums">{r.avg}</td>
                <td className="px-2 py-1 text-center tabular-nums text-emerald-600">{r.highest}</td>
                <td className="px-2 py-1 text-center tabular-nums text-rose-600">{r.lowest}</td>
                <td className="px-2 py-1 text-center tabular-nums text-emerald-600">{r.passCount}</td>
                <td className="px-2 py-1 text-center tabular-nums text-rose-600">{r.failCount}</td>
                <td className="px-2 py-1 text-center tabular-nums text-amber-600">{r.absentCount}</td>
                <td className="px-2 py-1 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-8 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-[8px] tabular-nums">{r.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {analytics.length === 0 && <tr><td colSpan={10} className="py-4 text-center text-muted-foreground">No data available.</td></tr>}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  )
}

function ResultsInline({ exam, classId, onClose }: { exam: ExamDTO; classId: string; onClose: () => void }) {
  const storeMarks = useMockMarksStore((s) => s.marks)
  const allExamMarks = storeMarks
  const marks = useMemo(() => allExamMarks.filter((m) => m.examId === exam.id && m.classId === classId), [allExamMarks, exam.id, classId])
  const allStudents = useStudentsStore((s) => s.students)
  const students = useMemo(() => allStudents.filter((st) => st.classId === classId && st.status === 'Active'), [allStudents, classId])
  const subjects = exam.subjects.filter((s: any) => s.classId === classId)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  const results = useMemo(() => {
    return students.map((st) => {
      let totalObtained = 0; let totalMax = 0
      const subjResults = subjects.map((subj: any) => {
        const mark = marks.find((m) => m.studentId === st.id && m.subjectId === subj.subjectId)
        const obtained = mark?.marksObtained ?? null
        if (obtained !== null) totalObtained += obtained
        totalMax += subj.maxMarks
        const pct = obtained !== null && subj.maxMarks > 0 ? Math.round((obtained / subj.maxMarks) * 100 * 100) / 100 : 0
        const grade = pct >= 90 ? 'A1' : pct >= 80 ? 'A2' : pct >= 70 ? 'B1' : pct >= 60 ? 'B2' : pct >= 50 ? 'C1' : pct >= 33 ? 'C2' : 'E'
        return { subjectName: subj.subjectName, maxMarks: subj.maxMarks, obtained, percentage: pct, grade, passed: pct >= 33 }
      })
      const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 100) / 100 : 0
      const grade = pct >= 90 ? 'A1' : pct >= 80 ? 'A2' : pct >= 70 ? 'B1' : pct >= 60 ? 'B2' : pct >= 50 ? 'C1' : pct >= 33 ? 'C2' : 'E'
      return { studentId: st.id, name: st.name, rollNo: st.rollNo, className: exam.classes.find((c: any) => c.classId === classId)?.className ?? '', subjects: subjResults, totalObtained, totalMax, percentage: pct, grade, passed: pct >= 33, rank: 0 as number | null }
    }).sort((a, b) => b.percentage - a.percentage).map((r, i) => ({ ...r, rank: i + 1 }))
  }, [marks, students, subjects, exam, classId])

  const selectedResult = results.find((r) => r.studentId === selectedStudent)

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">Class Result — {exam.classes.find((c: any) => c.classId === classId)?.className}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1" onClick={() => { generateClassResultPDF(exam, exam.classes.find((c: any) => c.classId === classId)?.className ?? '', results) }}>
            <Download className="h-3 w-3" /> PDF
          </Button>
          <button onClick={onClose} className="text-[9px] text-muted-foreground hover:text-foreground">Close</button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[24rem]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Roll</th>
              <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Student</th>
              {subjects.map((s: any) => <th key={s.subjectId} className="text-center px-1 py-1.5 text-[8px] font-semibold text-muted-foreground">{s.subjectName.substring(0, 6)}</th>)}
              <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Total</th>
              <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">%</th>
              <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Grade</th>
              <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.studentId} className="border-t border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedStudent(r.studentId)}>
                <td className="px-2 py-1 text-muted-foreground tabular-nums">{r.rollNo}</td>
                <td className="px-2 py-1 font-medium">{r.name} {r.rank && r.rank <= 3 && <span className="text-[8px] text-amber-600">#{r.rank}</span>}</td>
                {r.subjects.map((s, i) => <td key={i} className="px-1 py-1 text-center tabular-nums">{s.obtained ?? '—'}</td>)}
                <td className="px-2 py-1 text-right tabular-nums">{r.totalObtained}/{r.totalMax}</td>
                <td className="px-2 py-1 text-right tabular-nums font-semibold">{r.percentage}%</td>
                <td className="px-2 py-1 text-center font-semibold">{r.grade}</td>
                <td className="px-2 py-1 text-center"><span className={cn('text-[9px] font-medium', r.passed ? 'text-emerald-600' : 'text-rose-600')}>{r.passed ? 'PASS' : 'FAIL'}</span></td>
              </tr>
            ))}
            {results.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No results available.</td></tr>}
          </tbody>
        </table>
      </div>
      {selectedResult && (
        <StudentResultDetail exam={exam} result={selectedResult} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  )
}

function StudentResultDetail({ exam, result, onClose }: { exam: ExamDTO; result: any; onClose: () => void }) {
  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{result.name}</p>
          <p className="text-[9px] text-muted-foreground">Roll {result.rollNo} · {result.className}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1" onClick={() => generateStudentResultPDF(exam, result)}>
            <Download className="h-3 w-3" /> PDF
          </Button>
          <button onClick={onClose} className="text-[9px] text-muted-foreground hover:text-foreground">Close</button>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead><tr>
          <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground py-1">Subject</th>
          <th className="text-right text-[9px] uppercase font-semibold text-muted-foreground py-1">Max</th>
          <th className="text-right text-[9px] uppercase font-semibold text-muted-foreground py-1">Obtained</th>
          <th className="text-right text-[9px] uppercase font-semibold text-muted-foreground py-1">%</th>
          <th className="text-center text-[9px] uppercase font-semibold text-muted-foreground py-1">Grade</th>
        </tr></thead>
        <tbody>
          {result.subjects.map((s: any, i: number) => (
            <tr key={i} className="border-t border-border/30">
              <td className="py-1 font-medium">{s.subjectName}</td>
              <td className="py-1 text-right tabular-nums">{s.maxMarks}</td>
              <td className="py-1 text-right tabular-nums">{s.obtained ?? '—'}</td>
              <td className="py-1 text-right tabular-nums">{s.percentage}%</td>
              <td className="py-1 text-center">{s.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 pt-1 border-t border-border/40">
        <span className="text-[10px] font-semibold">Total: {result.totalObtained}/{result.totalMax}</span>
        <span className="text-[10px] font-semibold">Percentage: {result.percentage}%</span>
        <span className="text-[10px] font-semibold">Grade: {result.grade}</span>
        <span className={cn('text-[10px] font-semibold', result.passed ? 'text-emerald-600' : 'text-rose-600')}>{result.passed ? 'PASS' : 'FAIL'}</span>
      </div>
    </div>
  )
}

// ─── Paper Timeline (inline drawer) ──────────────────────────────────

function PaperTimelineInline({ exam, classId, subjectId, onClose }: {
  exam: ExamDTO
  classId: string
  subjectId: string
  onClose: () => void
}) {
  // Select the raw timeline array (stable reference) and derive with useMemo.
  const timeline = useMockMarksStore((s) => s.timeline)
  const paperTimeline = useMemo(
    () => timeline
      .filter((e) => e.examId === exam.id && e.classId === classId && e.subjectId === subjectId)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [timeline, exam.id, classId, subjectId],
  )
  const className = exam.classes.find((c: any) => c.classId === classId)?.className ?? classId
  const subjectName = exam.subjects.find((s: any) => s.classId === classId && s.subjectId === subjectId)?.subjectName ?? subjectId
  const teacher = teacherForSubject(subjectName)

  const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    OPENED: { label: 'Marks Entry Opened', icon: <FileText className="h-3 w-3" />, color: 'text-slate-500' },
    ENTERED: { label: 'Marks Entered', icon: <Pencil className="h-3 w-3" />, color: 'text-amber-600' },
    SUBMITTED: { label: 'Marks Submitted', icon: <Send className="h-3 w-3" />, color: 'text-amber-600' },
    VERIFIED: { label: 'Marks Verified', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-blue-600' },
    LOCKED: { label: 'Marks Locked', icon: <Lock className="h-3 w-3" />, color: 'text-emerald-600' },
    UNLOCKED: { label: 'Marks Unlocked', icon: <Unlock className="h-3 w-3" />, color: 'text-rose-600' },
  }

  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-3 bg-card/40">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{className} · {subjectName}</p>
          <p className="text-[9px] text-muted-foreground">Teacher: {teacher} · {paperTimeline.length} events</p>
        </div>
        <button onClick={onClose} className="text-[9px] text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <div className="relative pl-5 space-y-2 max-h-64 overflow-y-auto">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/60" />
        {paperTimeline.length === 0 && (
          <p className="text-[10px] text-muted-foreground py-2">No timeline events yet.</p>
        )}
        {paperTimeline.map((e: PaperTimelineEvent) => {
          const cfg = actionConfig[e.action] ?? { label: e.action, icon: <Clock className="h-3 w-3" />, color: 'text-muted-foreground' }
          return (
            <div key={e.id} className="relative">
              <span className={cn('absolute -left-[14px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-card border border-border', cfg.color)}>
                {cfg.icon}
              </span>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium">{cfg.label}</p>
                  <p className="text-[9px] text-muted-foreground">by {e.byName} · {e.byRole}</p>
                  {e.note && <p className="text-[9px] text-muted-foreground/80 mt-0.5">{e.note}</p>}
                </div>
                <span className="text-[9px] text-muted-foreground/70 shrink-0 tabular-nums">
                  {new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
