'use client'

/**
 * Exam Proctoring (EP-6) — the full duty workspace panel.
 *
 * An in-module takeover of the duty list: one duty's complete operational
 * surface, in a fixed order —
 *   1. header row (back + status + exam identity)
 *   2. exam details (date / time / room / students / class / your role)
 *   3. student roster — the core: per-student Present/Absent/Late
 *      controls (Class Attendance recipe), counts strip, Mark All
 *      Present, explicit Save; read-only chips for history duties
 *   4. incidents — report (editable duties) + the recorded list
 *   5. duty checklist — STATIC reference guidance, never fake controls
 *   6. seating — read-only room grid + seat list for THIS duty's room
 *
 * Completed/Cancelled duties arrive with editable:false and render as
 * read-only history. Every save round-trips through the server and the
 * payload is refetched — the panel never trusts local state as truth.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Flag,
  Loader2,
  PackageCheck,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, GradientAvatar, PageTransition, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { reportDutyIncident, saveDutyAttendance, useDutyDetail } from './hooks'
import {
  ATTENDANCE_CONFIG,
  DUTY_STATUS_CONFIG,
  EXAM_ATTENDANCE_STATUSES,
  EXAM_INCIDENT_TYPES,
  INCIDENT_TYPE_CONFIG,
  UNMARKED_CHIP,
  buildDraft,
  countsParts,
  draftCounts,
  draftsEqual,
  formatClockRange,
  incidentTypeLabel,
  longDate,
  savedAtLabel,
  seatGrid,
  type DutyDetail,
  type DutyDraft,
  type DutyIncident,
  type DutyRosterStudent,
  type ExamAttendanceStatus,
  type ExamIncidentType,
} from './shared'

/** Thin scrollbar utilities (house recipe — no global CSS needed). */
const SCROLLBAR_THIN =
  'pr-1 -mr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

/** Select value for the "no specific student" (room-level) option. */
const ROOM_LEVEL = 'room'

// ─── static duty checklist (reference guidance — never fake controls) ─

const CHECKLIST: { group: string; icon: LucideIcon; items: string[] }[] = [
  {
    group: 'Before the exam',
    icon: ClipboardList,
    items: [
      'Report to the room',
      'Verify the seating plan',
      'Receive question papers',
      'Verify student attendance',
    ],
  },
  {
    group: 'During',
    icon: Eye,
    items: ['Monitor the room', 'Record incidents if required'],
  },
  {
    group: 'After',
    icon: PackageCheck,
    items: ['Collect answer scripts', 'Complete attendance', 'Submit the duty'],
  },
]

// ─── the panel ────────────────────────────────────────────────────────

export function DutyDetailPanel({
  dutyId,
  onBack,
}: {
  dutyId: string
  onBack: () => void
}) {
  const { detail, refreshing, error, reload } = useDutyDetail(dutyId)
  const [draft, setDraft] = useState<DutyDraft>({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Incident form (inline — a quiet GlassCard form, no modal).
  const [formOpen, setFormOpen] = useState(false)
  const [formStudent, setFormStudent] = useState<string>(ROOM_LEVEL)
  const [formType, setFormType] = useState<ExamIncidentType | ''>('')
  const [formDescription, setFormDescription] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // The draft is ALWAYS rebuilt from the server payload — after every
  // refetch the panel reflects server truth, never stale local state.
  useEffect(() => {
    setDraft(buildDraft(detail?.rosterAttendance ?? {}))
  }, [detail])

  const roster = useMemo(() => detail?.roster ?? [], [detail])
  const editable = detail?.editable ?? false
  const savedDraft = useMemo(() => buildDraft(detail?.rosterAttendance ?? {}), [detail])
  const dirty = useMemo(() => !draftsEqual(draft, savedDraft), [draft, savedDraft])
  const counts = useMemo(() => draftCounts(roster, draft), [roster, draft])
  const canSave = editable && dirty && !saving && roster.length > 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.rollNo ?? '').toLowerCase().includes(q) ||
        s.seatLabel.toLowerCase().includes(q),
    )
  }, [roster, search])

  // ── attendance actions ─────────────────────────────────────────────

  const setStatus = (studentId: string, status: ExamAttendanceStatus) => {
    setDraft((prev) => (prev[studentId] === status ? prev : { ...prev, [studentId]: status }))
  }

  const markAllPresent = () => {
    if (roster.length === 0) return
    setDraft(() => {
      const next: DutyDraft = {}
      for (const s of roster) next[s.studentId] = 'PRESENT'
      return next
    })
    toast.success('All students marked present', {
      description: 'Review and save the attendance.',
    })
  }

  const save = async (): Promise<void> => {
    if (!detail || !canSave) return
    setSaving(true)
    try {
      const entries = roster.map((s) => ({
        studentId: s.studentId,
        status: draft[s.studentId] ?? ('PRESENT' as const),
      }))
      const res = await saveDutyAttendance(detail.duty.id, entries)
      toast.success('Attendance saved', {
        description: countsParts(res.counts).join(' · '),
      })
      // Refetch so markedBy / savedAt / unmarked reflect server truth.
      reload()
    } catch (e: unknown) {
      toast.error('Attendance could not be saved', {
        description: e instanceof Error ? e.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  // ── incident form ──────────────────────────────────────────────────

  const descriptionTrimmed = formDescription.trim()
  const formValid =
    formType !== '' && descriptionTrimmed.length >= 3 && descriptionTrimmed.length <= 500

  const submitIncident = async (): Promise<void> => {
    if (!detail || !formValid || formSubmitting) return
    setFormSubmitting(true)
    setFormError(null)
    try {
      await reportDutyIncident({
        scheduleItemId: detail.duty.id,
        studentId: formStudent === ROOM_LEVEL ? null : formStudent,
        incidentType: formType,
        description: descriptionTrimmed,
      })
      setFormOpen(false)
      setFormStudent(ROOM_LEVEL)
      setFormType('')
      setFormDescription('')
      setFormSuccess('Incident recorded — it now appears in the list below.')
      reload()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'The incident could not be recorded.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ── states (hooks above run unconditionally) ───────────────────────

  if (detail == null) {
    if (error != null) {
      return (
        <GlassCard hover={false} className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">Couldn&apos;t load this duty</p>
          <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" onClick={onBack} className="h-9">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to duties
            </Button>
            <Button onClick={reload} className="h-9">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </Button>
          </div>
        </GlassCard>
      )
    }
    return <DutyDetailSkeleton />
  }

  const { duty, attendance, incidents } = detail
  const statusCfg = DUTY_STATUS_CONFIG[duty.status]
  const rosterContext = rosterContextLine(detail, counts)

  return (
    <PageTransition
      className={cn('space-y-4 transition-opacity', refreshing && 'opacity-60')}
    >
      {/* 1 ─ header row: back + identity + status */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" onClick={onBack} className="h-9 shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to duties
          </Button>
          <p className="min-w-0 truncate text-sm font-semibold">
            {duty.subject} — {duty.examName}
          </p>
        </div>
        <StatusBadge status={duty.status} variant={statusCfg.variant} dot />
      </div>

      {/* 2 ─ exam details */}
      <GlassCard hover={false} className="p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Exam details
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
            {duty.subject}
          </h2>
          <p className="text-sm text-muted-foreground">
            {duty.examName} · {duty.examType}
          </p>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3.5 sm:grid-cols-3">
          <DetailItem label="Date" value={longDate(duty.date)} />
          <DetailItem label="Time" value={formatClockRange(duty.startTime, duty.endTime)} />
          <DetailItem label="Room" value={duty.room ?? 'Room TBA'} />
          <DetailItem label="Students" value={String(duty.studentCount)} />
          <DetailItem label="Class" value={duty.classLabel} />
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your role
            </dt>
            <dd className="mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Invigilator
              </span>
            </dd>
          </div>
        </dl>
      </GlassCard>

      {/* 3 ─ student roster (the core) */}
      <GlassCard hover={false} className="p-3 sm:p-4 lg:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">
              Student roster
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {roster.length} student{roster.length === 1 ? '' : 's'}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{rosterContext}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student…"
                aria-label="Search students"
                className="h-9 w-40 pl-8 sm:w-44"
              />
            </div>
            {editable && roster.length > 0 && (
              <Button
                variant="outline"
                onClick={markAllPresent}
                disabled={saving}
                className="h-9"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Mark all present
              </Button>
            )}
          </div>
        </div>

        {roster.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/30 px-3 py-6 text-center text-xs text-muted-foreground">
            No students are seated in this room — the seating plan has not been
            published for this paper yet.
          </p>
        ) : (
          <>
            {/* live counts strip */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <CountChip label="Present" value={counts.present} tone="emerald" />
              <CountChip label="Absent" value={counts.absent} tone="rose" />
              <CountChip label="Late" value={counts.late} tone="amber" />
              <CountChip label="Unmarked" value={counts.unmarked} tone="neutral" />
            </div>

            {/* roster rows */}
            <div className={cn('max-h-[560px] space-y-2 overflow-y-auto', SCROLLBAR_THIN)}>
              {filtered.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/30 px-3 py-6 text-center text-xs text-muted-foreground">
                  No students match &ldquo;{search.trim()}&rdquo; — try a different name, roll
                  number or seat.
                </p>
              ) : (
                filtered.map((student, i) => (
                  <RosterRow
                    key={student.studentId}
                    student={student}
                    index={i}
                    current={draft[student.studentId] ?? null}
                    editable={editable}
                    disabled={saving}
                    onSetStatus={setStatus}
                  />
                ))
              )}
            </div>

            {/* footer: save (editable) or the historical record line */}
            {editable ? (
              <div className="mt-4 flex flex-col items-start justify-between gap-2.5 border-t border-border pt-4 sm:flex-row sm:items-center">
                <p className="text-[11px] text-muted-foreground">
                  {dirty ? (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      Unsaved changes — remember to save
                    </span>
                  ) : counts.unmarked > 0 ? (
                    `${counts.unmarked} student${counts.unmarked === 1 ? '' : 's'} not marked yet — rows default to Present on save`
                  ) : (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      In sync with the saved record
                    </span>
                  )}
                </p>
                <Button onClick={save} disabled={!canSave} className="h-9">
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> Save attendance
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="mt-4 border-t border-border pt-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {attendance.savedAt != null ? (
                    <>
                      Attendance marked by{' '}
                      <span className="font-semibold text-foreground">
                        {attendance.markedBy ?? 'the invigilator'}
                      </span>
                      {savedAtLabel(attendance.savedAt, duty.date) && (
                        <> · {savedAtLabel(attendance.savedAt, duty.date)}</>
                      )}
                    </>
                  ) : (
                    'Attendance was never marked for this duty.'
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* 4 ─ incidents */}
      <GlassCard hover={false} className="p-3 sm:p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">
              {editable ? 'Incidents' : 'Recorded incidents'}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {incidents.length} record{incidents.length === 1 ? '' : 's'}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Professional, factual records — visible to the exam office.
            </p>
          </div>
          {editable && (
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen((o) => !o)
                setFormError(null)
              }}
              className="h-9 shrink-0"
            >
              <Flag className="h-3.5 w-3.5" /> Report incident
            </Button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {formOpen && editable && (
            <motion.div
              key="incident-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-xl border border-border bg-card/40 p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="incident-student" className="text-[11px] font-medium text-muted-foreground">
                      Student (optional)
                    </label>
                    <Select value={formStudent} onValueChange={setFormStudent}>
                      <SelectTrigger id="incident-student" className="h-9 w-full">
                        <SelectValue placeholder="Student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ROOM_LEVEL}>
                          Room-level (no specific student)
                        </SelectItem>
                        {roster.map((s) => (
                          <SelectItem key={s.studentId} value={s.studentId}>
                            {s.name}
                            {s.rollNo ? ` · Roll ${s.rollNo}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="incident-type" className="text-[11px] font-medium text-muted-foreground">
                      Incident type
                    </label>
                    <Select
                      value={formType === '' ? undefined : formType}
                      onValueChange={(v) => setFormType(v as ExamIncidentType)}
                    >
                      <SelectTrigger id="incident-type" className="h-9 w-full">
                        <SelectValue placeholder="Incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXAM_INCIDENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {INCIDENT_TYPE_CONFIG[t].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <label htmlFor="incident-description" className="text-[11px] font-medium text-muted-foreground">
                    Description
                  </label>
                  <Textarea
                    id="incident-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What happened, factually and calmly…"
                    maxLength={500}
                    className="min-h-20 text-sm"
                    aria-describedby="incident-description-hint"
                  />
                  <p id="incident-description-hint" className="text-right text-[10px] text-muted-foreground">
                    {descriptionTrimmed.length < 3
                      ? 'At least 3 characters'
                      : `${descriptionTrimmed.length}/500`}
                  </p>
                </div>
                {formError != null && (
                  <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                    {formError}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFormOpen(false)
                      setFormError(null)
                    }}
                    className="h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitIncident}
                    disabled={!formValid || formSubmitting}
                    className="h-9"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording…
                      </>
                    ) : (
                      <>
                        <Flag className="h-3.5 w-3.5" /> Record incident
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {formSuccess != null && (
          <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {formSuccess}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {incidents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card/30 px-3 py-5 text-center text-xs text-muted-foreground">
              {editable
                ? 'No incidents recorded — report one above if something needs documenting.'
                : 'No incidents were recorded for this duty.'}
            </p>
          ) : (
            incidents.map((inc) => <IncidentRow key={inc.id} incident={inc} dutyDate={duty.date} />)
          )}
        </div>
      </GlassCard>

      {/* 5 ─ duty checklist (static reference — never fake controls) */}
      <GlassCard hover={false} className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold">Duty checklist</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {CHECKLIST.map((group) => {
            const Icon = group.icon
            return (
              <div key={group.group} className="rounded-xl border border-border bg-card/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  {group.group}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <ChevronRight
                        className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] italic text-muted-foreground">
          Reference guidance for the duty — nothing is tracked or submitted here.
        </p>
      </GlassCard>

      {/* 6 ─ seating (read-only, this duty's room only) */}
      <SeatingCard detail={detail} />
    </PageTransition>
  )
}

// ─── local pieces ─────────────────────────────────────────────────────

/** One definition-grid cell of the exam details card. */
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-snug">{value}</dd>
    </div>
  )
}

/** One of the four live count chips. */
type CountTone = 'emerald' | 'rose' | 'amber' | 'neutral'

const COUNT_TONES: Record<CountTone, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  rose: 'text-rose-600 dark:text-rose-400',
  amber: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-foreground',
}

function CountChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: CountTone
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn('font-display text-lg font-bold tabular-nums', COUNT_TONES[tone])}>
        {value}
      </p>
    </div>
  )
}

/** The roster context line — prefill truth, never prose. */
function rosterContextLine(
  detail: DutyDetail,
  counts: { unmarked: number },
): string {
  const { duty, attendance } = detail
  if (!detail.editable) {
    return duty.status === 'Cancelled'
      ? 'Cancelled duty — attendance is read-only.'
      : 'Completed duty — attendance is read-only.'
  }
  const total = detail.roster.length
  if (total === 0) return 'The exam office has not seated students in this room yet.'
  if (attendance.savedAt == null || counts.unmarked === total) {
    return "Attendance hasn't been marked yet — rows default to Present."
  }
  if (counts.unmarked > 0) {
    return `${counts.unmarked} of ${total} students not marked yet.`
  }
  const at = savedAtLabel(attendance.savedAt, duty.date)
  const by = attendance.markedBy ?? 'the invigilator'
  return at ? `Marked by ${by} · ${at}` : `Marked by ${by}`
}

/** One roster row: roll + avatar + name + seat + status controls. */
function RosterRow({
  student,
  index,
  current,
  editable,
  disabled,
  onSetStatus,
}: {
  student: DutyRosterStudent
  index: number
  /** null = unmarked (Present shows as the visual default) */
  current: ExamAttendanceStatus | null
  editable: boolean
  disabled: boolean
  onSetStatus: (studentId: string, status: ExamAttendanceStatus) => void
}) {
  const visual = current ?? 'PRESENT'
  const rowTint = current == null ? 'border-border bg-card/40' : ATTENDANCE_CONFIG[current].row
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.025, duration: 0.25 }}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 transition-colors',
        rowTint,
      )}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground"
        aria-hidden="true"
      >
        {student.rollNo ?? '—'}
      </div>
      <GradientAvatar name={student.name} size="sm" />
      <div className="min-w-0 flex-1 basis-32">
        <p className="truncate text-sm font-medium">{student.name}</p>
        <p className="text-[11px] text-muted-foreground">{student.classLabel}</p>
      </div>
      <span
        className="shrink-0 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground"
        title={`Seat ${student.seatLabel}`}
      >
        {student.seatLabel}
      </span>
      {editable ? (
        <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
          {EXAM_ATTENDANCE_STATUSES.map((status) => {
            const cfg = ATTENDANCE_CONFIG[status]
            const isActive = visual === status
            const Icon = cfg.icon
            return (
              <motion.button
                key={status}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => onSetStatus(student.studentId, status)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all',
                  isActive ? cfg.active : cn('bg-transparent', cfg.inactive),
                )}
                title={cfg.label}
                aria-label={`Mark ${student.name} as ${cfg.label}`}
                aria-pressed={isActive}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </motion.button>
            )
          })}
        </div>
      ) : (
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium sm:ml-auto',
            current == null ? UNMARKED_CHIP : ATTENDANCE_CONFIG[current].chip,
          )}
        >
          {current == null ? 'Unmarked' : ATTENDANCE_CONFIG[current].label}
        </span>
      )}
    </motion.div>
  )
}

/** One recorded incident — calm and factual. */
function IncidentRow({ incident, dutyDate }: { incident: DutyIncident; dutyDate: string }) {
  const cfg = INCIDENT_TYPE_CONFIG[incident.incidentType]
  const at = savedAtLabel(incident.occurredAt, dutyDate)
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.chip)}>
          {cfg.label}
        </span>
        <span className="text-xs font-medium">{incident.studentName ?? 'Room-level'}</span>
        {at && <span className="text-[11px] text-muted-foreground">· {at}</span>}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{incident.description}</p>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Reported by {incident.reportedByName ?? 'the invigilator'}
      </p>
    </div>
  )
}

/** Read-only seating plan for this duty's room. */
function SeatingCard({ detail }: { detail: DutyDetail }) {
  const { duty, room, roster } = detail
  const grid = useMemo(() => seatGrid(room, roster), [room, roster])
  return (
    <GlassCard hover={false} className="p-3 sm:p-4 lg:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">Seating</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {duty.room ?? 'Room TBA'} · Capacity {room.capacity} · {roster.length} seated
        </p>
      </div>
      {roster.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/30 px-3 py-5 text-center text-xs text-muted-foreground">
          The seating plan has not been published for this room yet.
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card/30 p-3">
            <p className="mb-2 text-center text-[10px] text-muted-foreground">
              Blackboard ↑ · Front of Room
            </p>
            <div className="space-y-1.5">
              {grid.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-1.5">
                  {row.map((seat, ci) =>
                    seat ? (
                      <div
                        key={ci}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-400"
                        title={`Seat ${seat.seatLabel} — ${seat.name} (${seat.classLabel})`}
                      >
                        {seat.seatNumber}
                      </div>
                    ) : (
                      <div
                        key={ci}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-[9px] font-bold text-muted-foreground/40"
                        title={`Seat ${ri * room.cols + ci + 1} — Empty`}
                      >
                        {ri * room.cols + ci + 1}
                      </div>
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className={cn(
              'mt-3 grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2',
              SCROLLBAR_THIN,
            )}
          >
            {roster.map((s) => (
              <div
                key={s.studentId}
                className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-2.5 py-1.5 text-[11px]"
              >
                <span className="shrink-0 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {s.seatLabel}
                </span>
                <span className="min-w-0 truncate font-medium">{s.name}</span>
                <span className="ml-auto shrink-0 text-muted-foreground">{s.classLabel}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  )
}

/** Skeleton for a duty workspace load. */
function DutyDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the duty workspace">
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
      <div className="h-80 animate-pulse rounded-xl bg-muted/40" />
      <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
    </div>
  )
}
