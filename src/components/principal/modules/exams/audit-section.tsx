'use client'

/**
 * Audit section for the ExamWorkspace.
 *
 * Renders a filterable, timeline-style view of all exam audit events
 * pulled from the canonical audit store (useMockAuditStore). Supports
 * filtering by action type, user role, and user name.
 */

import { useState, useMemo } from 'react'
import { Award, CheckCircle2, Clock, FileText, Filter, Lock, Megaphone, Pencil, RotateCcw, Send, Unlock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMockAuditStore, AUDIT_ACTION_LABELS, type AuditAction } from '@/lib/exams/mock-audit-data'
import { CollapsibleSection } from './collapsible-section'

export function AuditSection({ examId }: { examId: string }) {
  const events = useMockAuditStore((s) => s.events)
  const [filterAction, setFilterAction] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterUser, setFilterUser] = useState('all')

  const examEvents = useMemo(
    () => events.filter((e) => e.examId === examId),
    [events, examId],
  )

  const users = useMemo(() => {
    const set = new Map<string, string>()
    for (const e of examEvents) {
      if (e.userName) set.set(e.userName, e.userName)
    }
    return Array.from(set.values())
  }, [examEvents])

  const filtered = useMemo(() => {
    return examEvents
      .filter((e) => filterAction === 'all' || e.action === filterAction)
      .filter((e) => filterRole === 'all' || e.userRole === filterRole)
      .filter((e) => filterUser === 'all' || e.userName === filterUser)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [examEvents, filterAction, filterRole, filterUser])

  const hasFilters = filterAction !== 'all' || filterRole !== 'all' || filterUser !== 'all'

  const actionIcon: Record<string, React.ReactNode> = {
    EXAM_CREATED: <FileText className="h-3 w-3" />,
    SCHEDULE_UPDATED: <Clock className="h-3 w-3" />,
    SEATING_GENERATED: <FileText className="h-3 w-3" />,
    INVIGILATOR_ASSIGNED: <User className="h-3 w-3" />,
    MARKS_ENTERED: <Pencil className="h-3 w-3" />,
    MARKS_SUBMITTED: <Send className="h-3 w-3" />,
    MARKS_VERIFIED: <CheckCircle2 className="h-3 w-3" />,
    MARKS_LOCKED: <Lock className="h-3 w-3" />,
    MARKS_UNLOCKED: <Unlock className="h-3 w-3" />,
    ATTENDANCE_SUBMITTED: <CheckCircle2 className="h-3 w-3" />,
    GRACE_APPLIED: <Award className="h-3 w-3" />,
    RESULT_DECLARED: <Award className="h-3 w-3" />,
    RESULT_PUBLISHED: <Megaphone className="h-3 w-3" />,
    OUTCOME_OVERRIDDEN: <FileText className="h-3 w-3" />,
  }

  const actionColor: Record<string, string> = {
    MARKS_LOCKED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    MARKS_UNLOCKED: 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30',
    MARKS_VERIFIED: 'text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-500/30',
    MARKS_SUBMITTED: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30',
    ATTENDANCE_SUBMITTED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    GRACE_APPLIED: 'text-violet-700 dark:text-violet-300 bg-violet-500/15 border-violet-500/30',
    RESULT_DECLARED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    RESULT_PUBLISHED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
        {hasFilters ? 'No audit events match your filters.' : 'No audit entries yet. Actions on marks, attendance, grace, and results will appear here.'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] uppercase font-semibold text-muted-foreground flex items-center gap-1"><Filter className="h-2.5 w-2.5" /> Filters:</span>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Actions</option>
          {Object.keys(AUDIT_ACTION_LABELS).map((a) => (
            <option key={a} value={a}>{AUDIT_ACTION_LABELS[a as AuditAction]}</option>
          ))}
        </select>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Roles</option>
          <option value="PRINCIPAL">Principal</option>
          <option value="TEACHER">Teacher</option>
          <option value="SYSTEM">System</option>
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Users</option>
          {users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilterAction('all'); setFilterRole('all'); setFilterUser('all') }}
            className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Clear
          </button>
        )}
        <span className="text-[9px] text-muted-foreground ml-auto">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <CollapsibleSection title="Audit Trail" subtitle={`${filtered.length} events`} accent="emerald">
        <div className="relative pl-8 py-3 space-y-3 max-h-[500px] overflow-y-auto">
          {/* Vertical line — stronger */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-border via-border/60 to-transparent" />
          {filtered.map((e) => {
            const label = AUDIT_ACTION_LABELS[e.action as AuditAction] ?? e.action
            const icon = actionIcon[e.action] ?? <Clock className="h-3 w-3" />
            const color = actionColor[e.action] ?? 'text-muted-foreground bg-muted border-border'
            return (
              <div key={e.id} className="relative group">
                <span className={cn('absolute -left-[20px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-transform group-hover:scale-110', color)}>
                  {icon}
                </span>
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2 hover:bg-muted/30 hover:border-border transition-colors shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{e.summary}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium bg-muted/60 text-muted-foreground">
                          <User className="h-2 w-2" /> {e.userName ?? 'System'}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-primary/10 text-primary">
                          {e.userRole}
                        </span>
                        {e.metadata && Object.keys(e.metadata).length > 0 && (
                          <span className="text-[9px] text-muted-foreground/70">
                            {Object.entries(e.metadata).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground/70 shrink-0 tabular-nums whitespace-nowrap font-mono">
                      {new Date(e.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>
    </div>
  )
}
