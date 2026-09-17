'use client'

/**
 * Class Attendance — the CT baseline + ST prefill workflow (spec §11 of
 * the Teacher Workspace cleanup brief).
 *
 * WORKFLOW:
 *   Class Teacher marks attendance  →  the class's daily baseline
 *   ↓ (other teachers open their assigned class)
 *   students are ALREADY marked (prefilled from the baseline)
 *   ↓
 *   the subject teacher adjusts only exceptions and explicitly submits
 *   their OWN subject-session record (kept separate from the baseline).
 *
 * Data layer discipline mirrors use-lesson-planner: one aggregate fetch
 * (`cache: 'no-store', credentials: 'same-origin'`), a 401 that routes
 * through the shared signOut(), a single-flight submit lock, the POST
 * response REPLACES the view (no re-GET), and a friendly error
 * vocabulary for the server's error codes. Simply viewing prefilled
 * statuses never creates a submission — only the explicit Save does.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Check, CheckCircle2, Clock, Crown, Info, Plane, Save, Search, Sparkles, Users, X,
} from 'lucide-react'
import { GlassCard, GradientAvatar, PageTransition, StatusBadge } from '@/components/shared/ui'
import { ModuleToolbar } from '../teacher-panel/module-toolbar'
import {
  HubEmptyState,
  HubModuleSkeleton,
  HubSectionError,
} from './shared/hub-stat-cards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { signOut } from '@/lib/signout'
import { cn } from '@/lib/utils'
import {
  ATTENDANCE_MARKS,
  type AttendanceMark,
  type AttendanceScopeDTO,
  type ClassAttendanceScopesPayload,
  type ClassAttendanceViewDTO,
} from '@/lib/class-attendance-types'

// ─── request helper (house fetch discipline) ──────────────────────────

// A dead server session cannot be retried — reset auth ONCE, land on login.
let sessionExpiredInFlight = false

function handleExpiredSession(): void {
  if (sessionExpiredInFlight) return
  sessionExpiredInFlight = true
  void signOut().finally(() => {
    window.setTimeout(() => {
      sessionExpiredInFlight = false
    }, 2000)
  })
}

async function caRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body
      ? { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
      : init?.headers,
  })
  if (r.status === 401) {
    handleExpiredSession()
    throw new Error('UNAUTHORIZED')
  }
  let json: unknown = null
  try {
    json = await r.json()
  } catch {
    /* non-JSON error body — fall through to the generic message */
  }
  const envelope = json as { ok?: unknown; error?: unknown; data?: T } | null
  if (!r.ok || !envelope || envelope.ok !== true) {
    const message =
      envelope && typeof envelope.error === 'string' && envelope.error
        ? envelope.error
        : `Request failed (${r.status})`
    throw new Error(message)
  }
  return envelope.data as T
}

// Server error codes → human sentences (lesson-planner vocabulary style).
const CA_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "This class isn't assigned to you.",
  NOT_FOUND: 'That class or subject could not be found.',
  CLASS_REQUIRED: 'Select a class first.',
  SUBJECT_REQUIRED: 'Select a subject you teach for this class.',
  INVALID_DATE: 'Please pick a valid date.',
  FUTURE_DATE: 'Attendance cannot be marked for a future date.',
  BAD_STATUS: 'That attendance status is not supported.',
  BAD_ENTRIES: 'The attendance entries were malformed — please retry.',
  ROSTER_MISMATCH: 'The class roster changed while you were marking — reloading the latest roster.',
}

function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : ''
  return CA_ERROR_MESSAGES[raw] ?? 'Attendance could not be loaded. Please try again.'
}

// ─── presentation helpers ──────────────────────────────────────────────

interface StatusConfig {
  label: string
  icon: React.ReactNode
  active: string
  inactive: string
}

const STATUS_CONFIG: Record<AttendanceMark, StatusConfig> = {
  present: {
    label: 'Present',
    icon: <Check className="h-3.5 w-3.5" aria-hidden="true" />,
    active: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30',
    inactive: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30',
  },
  absent: {
    label: 'Absent',
    icon: <X className="h-3.5 w-3.5" aria-hidden="true" />,
    active: 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30',
    inactive: 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30',
  },
  late: {
    label: 'Late',
    icon: <Clock className="h-3.5 w-3.5" aria-hidden="true" />,
    active: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30',
    inactive: 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30',
  },
  leave: {
    label: 'Leave',
    icon: <Plane className="h-3.5 w-3.5" aria-hidden="true" />,
    active: 'bg-info text-white border-info shadow-sm',
    inactive: 'text-info hover:bg-info/10 border-info/30',
  },
}

const ROW_TINT: Record<AttendanceMark, string> = {
  present: 'border-emerald-500/20 bg-emerald-500/5',
  absent: 'border-rose-500/20 bg-rose-500/5',
  late: 'border-amber-500/20 bg-amber-500/5',
  leave: 'border-info/20 bg-info/5',
}

/** Thin-scrollbar utilities (the house recipe — no global CSS needed). */
const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

function fmtDay(day: string): string {
  return new Date(`${day}T00:00:00.000Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

/** Draft rule (the key prefill semantic): own session → CT baseline → present. */
function persistedStatus(s: { sessionStatus: AttendanceMark | null; baselineStatus: AttendanceMark | null }): AttendanceMark {
  return s.sessionStatus ?? s.baselineStatus ?? 'present'
}

function buildDraft(view: ClassAttendanceViewDTO): Record<string, AttendanceMark> {
  const draft: Record<string, AttendanceMark> = {}
  for (const s of view.roster) draft[s.studentId] = persistedStatus(s)
  return draft
}

// ─── the data hook ────────────────────────────────────────────────────

interface ClassAttendanceState {
  /** the teacher's allowed classes (always fresh from the last payload) */
  scopes: AttendanceScopeDTO[]
  /** true once the scopes request succeeded (empty list = no classes) */
  scopesLoaded: boolean
  /** set when the scopes request itself failed (nothing rendered yet) */
  scopesErrorMessage: string | null
  today: string
  scopeSel: { classId: string; subjectId: string | null }
  date: string
  view: ClassAttendanceViewDTO | null
  viewLoading: boolean
  viewError: string | null
  draft: Record<string, AttendanceMark>
  submitting: boolean
  selectClass: (classId: string) => void
  selectSubject: (subjectId: string) => void
  setDate: (day: string) => void
  setStatus: (studentId: string, status: AttendanceMark) => void
  markAllPresent: (studentIds: string[]) => void
  reloadView: () => void
  retryScopes: () => void
  submit: () => Promise<void>
}

function useClassAttendance(): ClassAttendanceState {
  const [scopesPayload, setScopesPayload] = useState<ClassAttendanceScopesPayload | null>(null)
  const [scopesError, setScopesError] = useState<string | null>(null)
  const [scopeSel, setScopeSel] = useState<{ classId: string; subjectId: string | null }>({ classId: '', subjectId: null })
  const [date, setDate] = useState('')
  const [view, setView] = useState<ClassAttendanceViewDTO | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, AttendanceMark>>({})
  const [submitting, setSubmitting] = useState(false)
  const [scopesTick, setScopesTick] = useState(0)
  const [viewTick, setViewTick] = useState(0)

  const mounted = useRef(true)
  const submittingRef = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const applyView = useCallback((v: ClassAttendanceViewDTO) => {
    setView(v)
    setDraft(buildDraft(v))
  }, [])

  // ① scopes — fetched once (and on retry); picks the default scope + date.
  useEffect(() => {
    let cancelled = false
    caRequest<ClassAttendanceScopesPayload>('/api/teacher/class-attendance')
      .then((d) => {
        if (cancelled || !mounted.current) return
        setScopesPayload(d)
        setScopesError(null)
        if (d.scopes.length) {
          setScopeSel((cur) =>
            cur.classId
              ? cur
              : { classId: d.scopes[0].classId, subjectId: d.scopes[0].subjects[0]?.subjectId ?? null },
          )
          setDate((cur) => cur || d.today)
        }
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setScopesError(e instanceof Error && e.message === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : friendlyError(e))
      })
    return () => {
      cancelled = true
    }
  }, [scopesTick])

  // ② the marking view — re-fetched on every scope / date change.
  useEffect(() => {
    if (!scopeSel.classId || !date) return
    let cancelled = false
    setViewLoading(true)
    setViewError(null)
    const params = new URLSearchParams({ classId: scopeSel.classId, date })
    if (scopeSel.subjectId) params.set('subjectId', scopeSel.subjectId)
    caRequest<ClassAttendanceViewDTO>(`/api/teacher/class-attendance?${params.toString()}`)
      .then((d) => {
        if (!cancelled && mounted.current) applyView(d)
      })
      .catch((e: unknown) => {
        if (!cancelled && mounted.current) setViewError(friendlyError(e))
      })
      .finally(() => {
        if (!cancelled && mounted.current) setViewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [scopeSel, date, viewTick, applyView])

  const selectClass = useCallback((classId: string) => {
    setScopeSel((cur) => {
      if (cur.classId === classId) return cur
      const scope = (view?.scopes ?? scopesPayload?.scopes ?? []).find((s) => s.classId === classId)
      return { classId, subjectId: scope?.subjects[0]?.subjectId ?? null }
    })
  }, [view, scopesPayload])

  const selectSubject = useCallback((subjectId: string) => {
    setScopeSel((cur) => (cur.subjectId === subjectId ? cur : { ...cur, subjectId }))
  }, [])

  const setStatus = useCallback((studentId: string, status: AttendanceMark) => {
    setDraft((prev) => (prev[studentId] === status ? prev : { ...prev, [studentId]: status }))
  }, [])

  const markAllPresent = useCallback((studentIds: string[]) => {
    setDraft((prev) => {
      const next = { ...prev }
      let changed = 0
      for (const id of studentIds) {
        if (next[id] !== 'present') changed++
        next[id] = 'present'
      }
      return changed ? next : prev
    })
  }, [])

  const reloadView = useCallback(() => setViewTick((t) => t + 1), [])
  const retryScopes = useCallback(() => setScopesTick((t) => t + 1), [])

  // ③ the explicit submission — the ONLY write path. Single-flight; the
  //    POST response replaces the view (persistence without a re-GET).
  const submit = useCallback(async () => {
    if (!view || submittingRef.current || !view.roster.length) return
    submittingRef.current = true
    setSubmitting(true)
    const entries = view.roster.map((s) => ({
      studentId: s.studentId,
      status: draft[s.studentId] ?? 'present',
    }))
    try {
      const data = await caRequest<ClassAttendanceViewDTO>('/api/teacher/class-attendance', {
        method: 'POST',
        body: JSON.stringify({
          classId: view.classId,
          subjectId: view.subjectId,
          date: view.date,
          entries,
        }),
      })
      submittingRef.current = false
      if (mounted.current) applyView(data)
      const present = entries.filter((e) => e.status === 'present').length
      if (data.mode === 'CT_DAILY') {
        toast.success('Class baseline saved', {
          description: `${data.classLabel} · ${fmtDay(data.date)} · ${present} of ${entries.length} present`,
        })
      } else if (data.isClassTeacher) {
        toast.success(`${data.subjectName} attendance saved`, {
          description: `${present} of ${entries.length} present · the class baseline for ${data.classLabel} was updated too`,
        })
      } else {
        toast.success(`${data.subjectName} attendance saved`, {
          description: `${data.classLabel} · ${fmtDay(data.date)} · ${present} of ${entries.length} present`,
        })
      }
    } catch (e: unknown) {
      submittingRef.current = false
      const code = e instanceof Error ? e.message : ''
      toast.error(friendlyError(e))
      if (code === 'ROSTER_MISMATCH') reloadView()
    } finally {
      if (mounted.current) setSubmitting(false)
    }
  }, [view, draft, applyView, reloadView])

  return {
    scopes: view?.scopes ?? scopesPayload?.scopes ?? [],
    scopesLoaded: scopesPayload != null,
    scopesErrorMessage: scopesError,
    today: view?.today ?? scopesPayload?.today ?? date,
    scopeSel,
    date,
    view,
    viewLoading,
    viewError,
    draft,
    submitting,
    selectClass,
    selectSubject,
    setDate,
    setStatus,
    markAllPresent,
    reloadView,
    retryScopes,
    submit,
  }
}

// ─── the module ───────────────────────────────────────────────────────

export function AttendanceModule() {
  const reduce = useReducedMotion()
  const [search, setSearch] = useState('')
  const ca = useClassAttendance()
  const { view, scopes, today, date, scopeSel, draft, submitting, viewLoading, viewError } = ca

  // ── derived state (the whole UI reads from these) ──
  const roster = useMemo(() => view?.roster ?? [], [view])
  const currentScope = useMemo(
    () => scopes.find((s) => s.classId === scopeSel.classId) ?? null,
    [scopes, scopeSel.classId],
  )
  const mode = view?.mode ?? (scopeSel.subjectId ? 'SUBJECT' : 'CT_DAILY')

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, leave: 0 }
    for (const s of roster) c[draft[s.studentId] ?? 'present']++
    return c
  }, [roster, draft])

  const total = roster.length
  const rate = total > 0 ? ((counts.present / total) * 100).toFixed(1) : '0.0'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.rollNo ?? '').toLowerCase().includes(q),
    )
  }, [roster, search])

  // A change = any draft status differs from what is persisted for that
  // student (own session → CT baseline → the implicit 'present' default).
  const hasChanges = useMemo(
    () => roster.some((s) => (draft[s.studentId] ?? 'present') !== persistedStatus(s)),
    [roster, draft],
  )
  // "Persisted" only counts when EVERY roster student has a row — a day
  // that only partially has records is still unsubmitted (e.g. legacy
  // one-student baseline rows must not fake a Saved state).
  const fullyPersisted = Boolean(
    view && total > 0 && (mode === 'SUBJECT'
      ? view.meta.session.count >= total
      : view.meta.baseline.count >= total),
  )
  const clean = fullyPersisted && !hasChanges

  const submittedNote =
    view && mode === 'SUBJECT' && view.meta.session.submitted && view.meta.session.submittedAt
      ? `Submitted ${fmtTime(view.meta.session.submittedAt)}`
      : view && mode === 'CT_DAILY' && view.meta.baseline.marked
        ? 'Baseline saved'
        : null

  const saveLabel = submitting
    ? 'Saving…'
    : clean
      ? mode === 'SUBJECT' ? 'Submitted' : 'Saved'
      : fullyPersisted
        ? mode === 'SUBJECT' ? 'Update Submission' : 'Update Attendance'
        : 'Save Attendance'
  const saveDisabled = submitting || clean || !total

  // Prefill semantics — calm, one line, never per-row shouting.
  const showPrefillNote =
    view != null && mode === 'SUBJECT' && !view.meta.session.submitted && view.meta.baseline.marked
  const showClassTeacherNote =
    view != null && (mode === 'CT_DAILY' || (mode === 'SUBJECT' && view.isClassTeacher && !view.meta.baseline.marked))

  const handleBulkPresent = () => {
    const ids = filtered.map((s) => s.studentId)
    if (!ids.length) return
    ca.markAllPresent(ids)
    toast.success(`Marked ${ids.length} student${ids.length === 1 ? '' : 's'} present`, {
      description: 'Review and save the attendance.',
    })
  }

  // ── early states ──
  if (!ca.scopesLoaded && ca.scopesErrorMessage != null) {
    return (
      <PageTransition className="space-y-5">
        <GlassCard className="p-4" hover={false}>
          <HubSectionError message={ca.scopesErrorMessage} onRetry={ca.retryScopes} />
        </GlassCard>
      </PageTransition>
    )
  }

  if (!ca.scopesLoaded) {
    return (
      <PageTransition>
        <HubModuleSkeleton />
      </PageTransition>
    )
  }

  if (!scopes.length) {
    return (
      <PageTransition className="space-y-5">
        <GlassCard hover={false} className="overflow-hidden">
          <HubEmptyState
            icon={Users}
            title="No classes assigned"
            hint="Attendance follows your class-subject assignments and class-teacher duties. Once the school office assigns you a class, its roster appears here automatically."
          />
        </GlassCard>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="space-y-5">
      <ModuleToolbar
        className="flex-col items-stretch sm:flex-row sm:items-center"
        context={`Mark daily attendance · ${fmtDay(date || today)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={scopeSel.classId} onValueChange={ca.selectClass}>
              <SelectTrigger className="h-9 w-[128px]" aria-label="Select class">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {scopes.map((s) => (
                  <SelectItem key={s.classId} value={s.classId}>
                    {s.classLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {mode === 'SUBJECT' && currentScope ? (
              <Select value={scopeSel.subjectId ?? undefined} onValueChange={ca.selectSubject}>
                <SelectTrigger className="h-9 w-[136px]" aria-label="Select subject">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {currentScope.subjects.map((sub) => (
                    <SelectItem key={sub.subjectId} value={sub.subjectId}>
                      {sub.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-xs font-medium text-muted-foreground">
                <Crown className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                Class Teacher · Daily Attendance
              </span>
            )}

            <div className="relative flex items-center gap-2">
              <Input
                type="date"
                value={date}
                max={today}
                onChange={(e) => {
                  if (e.target.value) ca.setDate(e.target.value)
                }}
                className="h-9 w-[142px]"
                aria-label="Attendance date"
              />
              {date && today && date !== today && (
                <button
                  type="button"
                  onClick={() => ca.setDate(today)}
                  className="flex h-9 shrink-0 items-center rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  Today
                </button>
              )}
            </div>

            {submittedNote && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {submittedNote}
              </span>
            )}

            <Button
              type="button"
              onClick={() => void ca.submit()}
              disabled={saveDisabled}
              className="h-9 min-w-[128px]"
            >
              <AnimatePresence mode="wait" initial={false}>
                {submitting ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Saving…
                  </motion.span>
                ) : clean ? (
                  <motion.span
                    key="saved"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {mode === 'SUBJECT' ? 'Submitted' : 'Saved'}
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    {fullyPersisted ? (mode === 'SUBJECT' ? 'Update Submission' : 'Update Attendance') : 'Save Attendance'}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        }
      />

      {viewError && !view ? (
        <GlassCard className="p-4" hover={false}>
          <HubSectionError message={viewError} onRetry={ca.reloadView} />
        </GlassCard>
      ) : !view ? (
        <HubModuleSkeleton />
      ) : (
        <div
          aria-busy={viewLoading}
          className={cn('space-y-5 transition-opacity duration-200', viewLoading && 'pointer-events-none opacity-60')}
        >
          {/* Live summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { key: 'present', label: 'Present', value: counts.present, color: 'emerald', icon: <Check className="h-4 w-4" /> },
              { key: 'absent', label: 'Absent', value: counts.absent, color: 'rose', icon: <X className="h-4 w-4" /> },
              { key: 'late', label: 'Late', value: counts.late, color: 'amber', icon: <Clock className="h-4 w-4" /> },
              { key: 'leave', label: 'On Leave', value: counts.leave, color: 'info', icon: <Plane className="h-4 w-4" /> },
            ].map((c, i) => (
              <motion.div
                key={c.key}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-3 sm:p-4" hover={false}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg',
                        c.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600',
                        c.color === 'rose' && 'bg-rose-500/10 text-rose-600',
                        c.color === 'amber' && 'bg-amber-500/10 text-amber-600',
                        c.color === 'info' && 'bg-info/10 text-info',
                      )}
                    >
                      {c.icon}
                    </div>
                  </div>
                  <p
                    className={cn(
                      'font-display text-2xl font-bold',
                      c.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                      c.color === 'rose' && 'text-rose-600 dark:text-rose-400',
                      c.color === 'amber' && 'text-amber-600 dark:text-amber-400',
                      c.color === 'info' && 'text-info',
                    )}
                  >
                    <motion.span
                      key={c.value}
                      initial={reduce ? false : { scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="tabular-nums"
                    >
                      {c.value}
                    </motion.span>
                    <span className="text-base text-muted-foreground font-normal">/{total}</span>
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Roster card */}
          <GlassCard className="p-3 sm:p-4 lg:p-5">
            {showPrefillNote && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Prefilled from the Class Teacher&rsquo;s attendance — adjust exceptions and submit.</span>
              </div>
            )}
            {showClassTeacherNote && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>You are the Class Teacher — your submission becomes the class baseline for the day.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {view.classLabel}
                  {view.subjectName ? ` · ${view.subjectName}` : ' · Daily Attendance'} · Student Roster
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap a status for each student · Attendance rate: {rate}%
                </p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <div className="relative min-w-0 flex-1 sm:flex-none">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student…"
                    aria-label="Search students"
                    className="pl-8 h-9 w-full sm:w-44"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBulkPresent}
                  disabled={!filtered.length}
                  className="h-9 shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" /> Mark all present
                </Button>
              </div>
            </div>

            {total === 0 ? (
              <HubEmptyState
                icon={Users}
                title="No students in this class"
                hint="Once students are enrolled into the class, their roster appears here for marking."
                className="py-8"
              />
            ) : (
              <div className={cn('space-y-2 max-h-[640px] overflow-y-auto pr-1 -mr-1', THIN_SCROLLBAR)}>
                {filtered.map((s, i) => {
                  const current = draft[s.studentId] ?? 'present'
                  return (
                    <motion.div
                      key={s.studentId}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.25) }}
                      className={cn(
                        'flex items-center gap-2 sm:gap-3 rounded-xl border p-2.5 sm:p-3 transition-colors',
                        ROW_TINT[current],
                      )}
                    >
                      <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                        {s.rollNo ?? '—'}
                      </div>
                      <GradientAvatar name={s.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Roll #{s.rollNo ?? '—'} · {view.classLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {ATTENDANCE_MARKS.map((m) => {
                          const cfg = STATUS_CONFIG[m]
                          const isActive = current === m
                          return (
                            <motion.button
                              key={m}
                              type="button"
                              whileTap={reduce ? undefined : { scale: 0.92 }}
                              onClick={() => ca.setStatus(s.studentId, m)}
                              aria-pressed={isActive}
                              aria-label={`Mark ${s.name} as ${cfg.label}`}
                              title={cfg.label}
                              className={cn(
                                'flex items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition-all',
                                'h-11 w-11 sm:h-8 sm:w-auto sm:px-2.5',
                                isActive ? cfg.active : cn('bg-transparent', cfg.inactive),
                              )}
                            >
                              {cfg.icon}
                              <span className="hidden sm:inline">{cfg.label}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="py-10 text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" aria-hidden="true" />
                    <p className="text-sm font-medium text-muted-foreground">No students match &ldquo;{search}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer summary */}
            <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{total} students</span>
                </span>
                <span className="text-muted-foreground">·</span>
                <StatusBadge
                  status={total > 0 && counts.present / total >= 0.85 ? 'Healthy' : total > 0 && counts.present / total >= 0.65 ? 'Average' : 'Low'}
                  variant={total > 0 && counts.present / total >= 0.85 ? 'success' : total > 0 && counts.present / total >= 0.65 ? 'warning' : 'danger'}
                  dot
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {clean ? (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">All changes saved</span>
                ) : (
                  <span className="font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>
                )}
              </p>
            </div>
          </GlassCard>
        </div>
      )}
    </PageTransition>
  )
}
