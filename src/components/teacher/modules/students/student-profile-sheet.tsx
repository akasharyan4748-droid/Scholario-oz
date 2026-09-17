'use client'

/**
 * Slide-out profile sheet — real DB fields only: identity, personal
 * information, guardian contact and the student's recent attendance
 * history. No fabricated grades, ranks or activity.
 */

import {
  Calendar, Activity, MapPin, ShieldCheck, Users, Phone, Mail, CalendarCheck,
} from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DirectoryStudent } from './hooks'
import { InfoRow } from './shared'

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

function attBadgeClass(status: string): string {
  switch (status) {
    case 'PRESENT': return 'bg-emerald-500/10 text-emerald-600'
    case 'LATE': return 'bg-amber-500/10 text-amber-600'
    case 'LEAVE': return 'bg-sky-500/10 text-sky-600'
    default: return 'bg-rose-500/10 text-rose-600'
  }
}

export function StudentProfileSheet({
  student,
  onClose,
}: {
  student: DirectoryStudent | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md overflow-y-auto">
        {student && (
          <>
            <SheetHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <GradientAvatar name={student.name} size="xl" />
                <div className="min-w-0">
                  <SheetTitle className="text-lg">{student.name}</SheetTitle>
                  <SheetDescription className="text-xs">
                    Roll #{student.rollNo ?? '—'} · {student.admissionNo ?? '—'}
                  </SheetDescription>
                  <div className="flex items-center gap-1.5 mt-1">
                    {student.gender && (
                      <StatusBadge
                        status={student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : student.gender}
                        variant="neutral"
                      />
                    )}
                    {student.attendancePct != null && (
                      <StatusBadge
                        status={`${student.attendancePct}% attendance`}
                        variant={student.attendancePct >= 95 ? 'success' : student.attendancePct >= 90 ? 'info' : 'warning'}
                        dot
                      />
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="px-4 py-4 space-y-5">
              {/* Attendance summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-center">
                  <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {student.attendancePct != null ? `${student.attendancePct}%` : '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                </div>
                <div className="rounded-xl bg-sky-500/10 p-2.5 text-center">
                  <p className="font-display text-xl font-bold text-sky-600 dark:text-sky-400">{student.attendanceRecords}</p>
                  <p className="text-[10px] text-muted-foreground">Days Recorded</p>
                </div>
              </div>

              {/* Personal info */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Personal Information
                </p>
                <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3 text-xs">
                  <InfoRow icon={<Calendar className="h-3 w-3" />} label="Date of Birth" value={student.dob ? `${formatDate(student.dob)}${ageFrom(student.dob) ? ` (${ageFrom(student.dob)})` : ''}` : 'Not recorded'} />
                  <InfoRow icon={<Activity className="h-3 w-3" />} label="Blood Group" value={student.bloodGroup ?? 'Not recorded'} />
                  <InfoRow icon={<MapPin className="h-3 w-3" />} label="Address" value={student.address ?? 'Not recorded'} />
                </div>
              </div>

              {/* Parent / Guardian */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Parent / Guardian
                </p>
                <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2 text-xs">
                  <InfoRow icon={<Users className="h-3 w-3" />} label="Guardian" value={student.guardianName ?? 'Not recorded'} />
                  <InfoRow icon={<Phone className="h-3 w-3" />} label="Phone" value={student.guardianPhone ?? 'Not recorded'} />
                  <InfoRow icon={<Mail className="h-3 w-3" />} label="Email" value={student.email} />
                </div>
              </div>

              {/* Recent attendance — real records, newest first */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" /> Recent Attendance
                </p>
                <div className="rounded-xl border border-border bg-card/40 p-3 space-y-1.5">
                  {student.recentAttendance.length > 0 ? (
                    student.recentAttendance.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{formatDate(r.date)}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', attBadgeClass(r.status))}>
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="py-2 text-center text-xs text-muted-foreground">No attendance recorded yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
