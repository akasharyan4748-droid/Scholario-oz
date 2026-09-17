'use client'

/**
 * Class Attendance (TWC-FE-2) — the module composition root.
 *
 * Server-backed rewrite on the two-layer model:
 *   · CLASS TEACHER → the official daily baseline for her class (the
 *     canonical rows students and parents see). One Save writes the day.
 *   · SUBJECT TEACHER → the class teacher's baseline arrives PREFILLED;
 *     she changes only exceptions and explicitly submits her OWN subject
 *     session (a separate record — viewing never writes anything).
 *
 * Quiet ModuleToolbar (class + subject + date + Save) → 4 count cards →
 * roster with per-student status buttons, search and a bulk "mark all
 * present". The top application bar already names the module — this page
 * never repeats it with a giant H1.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Plane,
  Save,
  Search,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { GlassCard, GradientAvatar, PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import {
  HubEmptyState,
  HubModuleSkeleton,
  HubSectionError,
} from '../shared/hub-stat-cards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAttendanceModule } from './hooks'
import {
  ATTENDANCE_STATUSES,
  STATUS_CONFIG,
  longDate,
  rosterContextLine,
  todayKey,
  type AttendanceStatus,
  type AttendanceStudent,
  type SaveCounts,
} from './shared'

// ─── count-card tones (recipe of the previous module) ─────────────────

type StripTone = 'emerald' | 'rose' | 'amber' | 'info'

const STRIP_TONES: Record<StripTone, { chip: string; text: string }> = {
  emerald: { chip: 'bg-emerald-500/10 text-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
  rose: { chip: 'bg-rose-500/10 text-rose-600', text: 'text-rose-600 dark:text-rose-400' },
  amber: { chip: 'bg-amber-500/10 text-amber-600', text: 'text-amber-600 dark:text-amber-400' },
  info: { chip: 'bg-info/10 text-info', text: 'text-info' },
}

/** House <input type="date"> — matches the h-9 controls around it. */
const DATE_INPUT_CLASS =
  'h-9 rounded-md border border-input bg-transparent px-2.5 text-xs font-medium text-foreground shadow-xs transition-[color,box-shadow] outline-none [color-scheme:light] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:[color-scheme:dark]'

// ─── module ───────────────────────────────────────────────────────────

export function AttendanceModule() {
  const {
    classes,
    classesError,
    reloadClasses,
    classId,
    selectClass,
    subjectId,
    selectSubject,
    date,
    selectDate,
    board,
    boardLoading,
    boardError,
    reloadBoard,
    draft,
    source,
    dirty,
    setStatus,
    markAllPresent,
    counts,
    saving,
    justSaved,
    save,
  } = useAttendanceModule()
  const [search, setSearch] = useState('')

  const classOptions = classes ?? []
  const total = board?.students.length ?? 0
  const isSubjectMode = board != null && !board.isClassTeacher
  const canSave =
    board != null && total > 0 && !saving && !boardLoading && (board.isClassTeacher || subjectId != null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = board?.students ?? []
    if (!q) return list
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rollNo.includes(q),
    )
  }, [board, search])

  // ── module-level states (all hooks above run unconditionally) ──────

  if (classes == null) {
    return (
      <PageTransition className="space-y-4">
        {classesError != null ? (
          <HubSectionError message={classesError} onRetry={reloadClasses} />
        ) : (
          <HubModuleSkeleton />
        )}
      </PageTransition>
    )
  }

  if (classes.length === 0) {
    return (
      <PageTransition className="space-y-4">
        <GlassCard hover={false}>
          <HubEmptyState
            icon={Users}
            title="No classes assigned yet"
            hint="Classes appear here once you are a class teacher or teach a subject in them."
          />
        </GlassCard>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="space-y-4">
      {/* quiet toolbar: scope line + class / subject / date / Save */}
      <ModuleToolbar
        context={`Mark attendance · ${longDate(date)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={classId ?? undefined} onValueChange={selectClass}>
              <SelectTrigger className="h-9 w-[120px] sm:w-[132px]" aria-label="Class">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((c) => (
                  <SelectItem key={c.classId} value={c.classId}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isSubjectMode && (
              <Select value={subjectId ?? undefined} onValueChange={selectSubject}>
                <SelectTrigger className="h-9 w-[120px] sm:w-[136px]" aria-label="Subject">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {(board?.subjects ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => selectDate(e.target.value)}
              aria-label="Attendance date"
              className={DATE_INPUT_CLASS}
            />

            <Button onClick={save} disabled={!canSave} className="h-9">
              <AnimatePresence mode="wait" initial={false}>
                {saving ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                  </motion.span>
                ) : justSaved ? (
                  <motion.span
                    key="saved"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSubjectMode ? 'Save session' : 'Save attendance'}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        }
      />

      {boardError != null ? (
        <HubSectionError message={boardError} onRetry={reloadBoard} />
      ) : board == null ? (
        <BoardSkeleton />
      ) : board.students.length === 0 ? (
        <GlassCard hover={false}>
          <HubEmptyState
            icon={Users}
            title="No students in this class"
            hint="Active students enrolled in this class will appear here."
          />
        </GlassCard>
      ) : (
        <>
          {/* live count cards */}
          <CountsStrip counts={counts} total={total} />

          {/* roster */}
          <GlassCard
            className={cn(
              'p-3 sm:p-4 lg:p-5 transition-opacity',
              boardLoading && 'opacity-60',
            )}
          >
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{board.label} · Student roster</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {rosterContextLine(board, subjectId, source)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
                <Button
                  variant="outline"
                  onClick={markAllPresent}
                  disabled={saving}
                  className="h-9"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Mark all present
                </Button>
              </div>
            </div>

            <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1 -mr-1">
              {filtered.length === 0 ? (
                <HubEmptyState
                  icon={Search}
                  title={`No students match “${search.trim()}”`}
                  hint="Try a different name or roll number."
                  className="py-8"
                />
              ) : (
                filtered.map((student, i) => (
                  <RosterRow
                    key={student.id}
                    student={student}
                    index={i}
                    current={draft[student.id] ?? 'PRESENT'}
                    disabled={saving}
                    onSetStatus={setStatus}
                  />
                ))
              )}
            </div>

            {/* footer summary */}
            <div className="mt-4 flex flex-col items-start justify-between gap-2.5 border-t border-border pt-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Total:{' '}
                  <span className="font-semibold text-foreground">
                    {total} student{total === 1 ? '' : 's'}
                  </span>
                  <span className="mx-1.5">·</span>
                  Attendance rate:{' '}
                  <span className="font-semibold text-foreground">
                    {total > 0 ? ((counts.present / total) * 100).toFixed(1) : '0.0'}%
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {dirty ? (
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Unsaved changes — remember to save
                  </span>
                ) : source === 'present' ? (
                  'Nothing saved for this date yet'
                ) : (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    In sync with the saved record
                  </span>
                )}
              </p>
            </div>
          </GlassCard>
        </>
      )}
    </PageTransition>
  )
}

// ─── local pieces ─────────────────────────────────────────────────────

/** The 4 live count cards (Present / Absent / Late / On Leave out of total). */
function CountsStrip({ counts, total }: { counts: SaveCounts; total: number }) {
  const cards: { key: AttendanceStatus; label: string; value: number; icon: LucideIcon; tone: StripTone }[] = [
    { key: 'PRESENT', label: 'Present', value: counts.present, icon: Check, tone: 'emerald' },
    { key: 'ABSENT', label: 'Absent', value: counts.absent, icon: X, tone: 'rose' },
    { key: 'LATE', label: 'Late', value: counts.late, icon: Clock, tone: 'amber' },
    { key: 'LEAVE', label: 'On Leave', value: counts.leave, icon: Plane, tone: 'info' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c, i) => {
        const tone = STRIP_TONES[c.tone]
        const Icon = c.icon
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <GlassCard className="p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', tone.chip)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={cn('font-display text-2xl font-bold', tone.text)}>
                <motion.span
                  key={`${c.key}-${c.value}`}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                >
                  {c.value}
                </motion.span>
                <span className="text-base font-normal text-muted-foreground">/{total}</span>
              </p>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}

/** One roster row: roll tile + avatar + name + the four status buttons. */
function RosterRow({
  student,
  index,
  current,
  disabled,
  onSetStatus,
}: {
  student: AttendanceStudent
  index: number
  current: AttendanceStatus
  disabled: boolean
  onSetStatus: (studentId: string, status: AttendanceStatus) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.025, duration: 0.25 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 transition-colors',
        STATUS_CONFIG[current].row,
      )}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground"
        aria-hidden="true"
      >
        {student.rollNo}
      </div>
      <GradientAvatar name={student.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{student.name}</p>
        <p className="text-[11px] text-muted-foreground">Roll #{student.rollNo}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {ATTENDANCE_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status]
          const isActive = current === status
          const Icon = cfg.icon
          return (
            <motion.button
              key={status}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => onSetStatus(student.id, status)}
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
    </motion.div>
  )
}

/** Skeleton for a board load: 4 count cards + roster rows. */
function BoardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} hover={false} className="animate-pulse p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-7 w-7 rounded-lg bg-muted" />
            </div>
            <div className="h-7 w-12 rounded bg-muted" />
          </GlassCard>
        ))}
      </div>
      <GlassCard hover={false} className="p-3 sm:p-4 lg:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-3.5 w-44 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="hidden h-9 w-64 animate-pulse rounded-md bg-muted sm:block" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-6 w-8 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
