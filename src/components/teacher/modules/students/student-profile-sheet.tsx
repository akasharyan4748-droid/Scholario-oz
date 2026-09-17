'use client'

/**
 * students/student-profile-sheet — the teacher-facing student profile.
 *
 * A right-side Sheet (full-width on mobile) with four sections, every
 * value from the real directory payload:
 *   1. Overview            identity + class info (real Student/User rows)
 *   2. Attendance          summary + per-status counts + recent records
 *                          (canonical Attendance rows)
 *   3. Academic Performance latest exam marks per subject (ExamMark +
 *                          ExamSubjectConfig maxMarks) — honest empty
 *                          state when the class has no entered marks
 *   4. Parent / Guardian   guardian name + phone (server-authorized for
 *                          the teacher's classes — the route decides)
 *
 * Status chips use the documented thresholds in ./shared. Nothing is
 * fabricated: missing records render "Not recorded".
 */

import {
  Activity,
  Award,
  Calendar,
  CalendarCheck,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { InfoRow, SectionLabel, attendanceToneClass, statusOf } from './shared'
import type { DirectoryStudent } from './types'

const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

function ageFrom(dob: string | null): string | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (beforeBirthday) years -= 1
  return years >= 0 ? `${years} yrs` : null
}

/** Status chip tone for one attendance record. */
function attRecordClass(status: string): string {
  switch (status) {
    case 'PRESENT':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'LATE':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'LEAVE':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    default:
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
  }
}

function attStatusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

/** Small bordered count tile (behavior-sheet recipe). */
function CountTile({ label, value, className }: { label: string; value: number | string; className?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 px-2 py-2 text-center">
      <p className={cn('font-display text-lg font-bold tabular-nums', className)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

export function StudentProfileSheet({
  student,
  onClose,
}: {
  student: DirectoryStudent | null
  onClose: () => void
}) {
  const status = student ? statusOf(student) : null

  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className={cn('w-full gap-0 sm:max-w-lg', THIN_SCROLLBAR)}
      >
        {student && (
          <>
            <SheetHeader className="border-b border-border px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <GradientAvatar name={student.name} size="xl" />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-base font-semibold">{student.name}</SheetTitle>
                  <SheetDescription className="mt-0.5 truncate text-xs">
                    Roll {student.rollNo ?? '—'} · {student.classLabel} · Adm {student.admissionNo ?? '—'}
                  </SheetDescription>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {status && (
                      <StatusBadge
                        status={status.label}
                        variant={status.key === 'at-risk' ? 'danger' : 'success'}
                        dot
                      />
                    )}
                    {student.gender && (
                      <StatusBadge
                        status={
                          student.gender === 'MALE'
                            ? 'Male'
                            : student.gender === 'FEMALE'
                              ? 'Female'
                              : student.gender
                        }
                        variant="neutral"
                      />
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className={cn('flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5', THIN_SCROLLBAR)}>
              {/* ── 1. Overview ─────────────────────────────────────── */}
              <section className="space-y-2">
                <SectionLabel icon={<GraduationCap className="h-3 w-3" />}>Overview</SectionLabel>
                <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3 text-xs">
                  <InfoRow icon={<GraduationCap className="h-3 w-3" />} label="Class" value={student.classLabel} />
                  <InfoRow icon={<User className="h-3 w-3" />} label="Roll No" value={student.rollNo ?? 'Not recorded'} />
                  <InfoRow icon={<User className="h-3 w-3" />} label="Admission No" value={student.admissionNo ?? 'Not recorded'} />
                  <InfoRow icon={<Mail className="h-3 w-3" />} label="School Email" value={student.email} />
                  <InfoRow
                    icon={<Calendar className="h-3 w-3" />}
                    label="Date of Birth"
                    value={
                      student.dob
                        ? `${formatDate(student.dob)}${ageFrom(student.dob) ? ` (${ageFrom(student.dob)})` : ''}`
                        : 'Not recorded'
                    }
                  />
                  <InfoRow icon={<Activity className="h-3 w-3" />} label="Blood Group" value={student.bloodGroup ?? 'Not recorded'} />
                  <InfoRow icon={<MapPin className="h-3 w-3" />} label="Address" value={student.address ?? 'Not recorded'} />
                </div>
              </section>

              {/* ── 2. Attendance ───────────────────────────────────── */}
              <section className="space-y-2">
                <SectionLabel icon={<CalendarCheck className="h-3 w-3" />}>Attendance</SectionLabel>
                {student.attendance.records === 0 ? (
                  <p className="rounded-xl border border-border bg-card/40 px-3 py-3 text-xs text-muted-foreground">
                    No attendance recorded yet.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
                        <p
                          className={cn(
                            'font-display text-xl font-bold tabular-nums',
                            attendanceToneClass(student.attendance.pct),
                          )}
                        >
                          {student.attendance.pct != null ? `${student.attendance.pct}%` : '—'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Attendance</p>
                      </div>
                      <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
                        <p className="font-display text-xl font-bold tabular-nums text-foreground">
                          {student.attendance.records}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Days recorded</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <CountTile label="Present" value={student.attendance.present} className="text-emerald-600 dark:text-emerald-400" />
                      <CountTile label="Absent" value={student.attendance.absent} className="text-rose-600 dark:text-rose-400" />
                      <CountTile label="Late" value={student.attendance.late} className="text-amber-600 dark:text-amber-400" />
                      <CountTile label="On Leave" value={student.attendance.leave} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-border bg-card/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Recent records
                      </p>
                      {student.attendance.recent.map((r, i) => (
                        <div key={`${r.date}-${i}`} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{formatDate(r.date)}</span>
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', attRecordClass(r.status))}>
                            {attStatusLabel(r.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* ── 3. Academic Performance ─────────────────────────── */}
              <section className="space-y-2">
                <SectionLabel icon={<Award className="h-3 w-3" />}>Academic Performance</SectionLabel>
                {student.latestExam == null ? (
                  <p className="rounded-xl border border-border bg-card/40 px-3 py-3 text-xs text-muted-foreground">
                    No exam marks entered for this class yet.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/40 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{student.latestExam.examName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Latest exam with entered marks · {student.latestExam.subjects.length}{' '}
                          subject{student.latestExam.subjects.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <p
                        className={cn(
                          'font-display text-lg font-bold tabular-nums',
                          student.latestExam.averagePct < 40
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {student.latestExam.averagePct}%
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-border bg-card/40 p-3">
                      {student.latestExam.subjects.map((sub) => (
                        <div key={sub.subjectId} className="flex items-center justify-between gap-2 text-xs">
                          <span className="min-w-0 flex-1 truncate font-medium">{sub.subjectName}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {sub.marks} / {sub.maxMarks}
                          </span>
                          <span
                            className={cn(
                              'w-11 shrink-0 rounded-full px-2 py-0.5 text-right text-[10px] font-semibold tabular-nums',
                              sub.pct < 40
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            )}
                          >
                            {sub.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* ── 4. Parent / Guardian ────────────────────────────── */}
              <section className="space-y-2">
                <SectionLabel icon={<Users className="h-3 w-3" />}>Parent / Guardian</SectionLabel>
                <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3 text-xs">
                  <InfoRow icon={<Users className="h-3 w-3" />} label="Guardian" value={student.guardianName ?? 'Not recorded'} />
                  <InfoRow icon={<Phone className="h-3 w-3" />} label="Phone" value={student.guardianPhone ?? 'Not recorded'} />
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
