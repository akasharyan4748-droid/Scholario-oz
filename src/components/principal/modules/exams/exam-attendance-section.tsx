'use client'

/**
 * ExamAttendanceSection — session-specific manual attendance.
 *
 * Uses the mock attendance store. Sessions are derived from the exam
 * schedule + students. Invigilators manually mark Present/Absent/Leave.
 * No auto-marking from marks.
 */

import { useState, useMemo, useEffect } from 'react'
import { Check, X, Clock, Send, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ExamDTO } from '@/lib/exams/types'
import { useMockAttendanceStore, type AttendanceStatus } from '@/lib/exams/mock-attendance-data'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatDateLong } from '@/lib/exams/format-helpers'

interface Props {
  exam: ExamDTO
}

export function ExamAttendanceSection({ exam }: Props) {
  const records = useMockAttendanceStore((s) => s.records)
  const sessions = useMockAttendanceStore((s) => s.sessions)
  const initAttendance = useMockAttendanceStore((s) => s.initAttendance)
  const markStatus = useMockAttendanceStore((s) => s.markStatus)
  const markAllPresent = useMockAttendanceStore((s) => s.markAllPresent)
  const submitSession = useMockAttendanceStore((s) => s.submitSession)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [filterClass, setFilterClass] = useState('all')

  const allStudents = useStudentsStore((s) => s.students)

  // Initialize when exam loads.
  useEffect(() => {
    if (!exam || exam.classes.length === 0 || exam.schedule.length === 0) return
    const students = allStudents
      .filter((s) => exam.classes.some((c) => c.classId === s.classId) && s.status === 'Active')
      .map((s) => ({ id: s.id, name: s.name, rollNo: s.rollNo, classId: s.classId, className: s.className }))
    if (students.length > 0) initAttendance(exam, students)
  }, [exam, allStudents, initAttendance])

  const examSessions = useMemo(() =>
    sessions.filter((s) => s.examId === exam.id && (filterClass === 'all' || s.classId === filterClass)),
    [sessions, exam.id, filterClass]
  )

  const examRecords = useMemo(() =>
    records.filter((r) => r.examId === exam.id),
    [records, exam.id]
  )

  // Summary
  const summary = useMemo(() => {
    const total = examRecords.length
    const present = examRecords.filter((r) => r.status === 'PRESENT').length
    const absent = examRecords.filter((r) => r.status === 'ABSENT').length
    const pending = examRecords.filter((r) => r.status === 'NOT_MARKED').length
    const submittedSessions = examSessions.filter((s) => s.submitted).length
    return { total, present, absent, pending, sessions: examSessions.length, submittedSessions }
  }, [examRecords, examSessions])

  const selectedSession = examSessions.find((s) => s.id === selectedSessionId)
  const sessionRecords = useMemo(() =>
    selectedSession ? examRecords.filter((r) =>
      r.date === selectedSession.date && r.startTime === selectedSession.startTime && r.roomId === selectedSession.roomId
    ) : [],
    [examRecords, selectedSession]
  )

  const sessionSummary = useMemo(() => {
    const present = sessionRecords.filter((r) => r.status === 'PRESENT').length
    const absent = sessionRecords.filter((r) => r.status === 'ABSENT').length
    const pending = sessionRecords.filter((r) => r.status === 'NOT_MARKED').length
    return { total: sessionRecords.length, present, absent, pending }
  }, [sessionRecords])

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <AttStat icon={<Calendar className="h-3 w-3" />} label="Sessions" value={String(summary.sessions)} />
        <AttStat icon={<Users className="h-3 w-3" />} label="Students" value={String(summary.total)} />
        <AttStat icon={<Check className="h-3 w-3" />} label="Present" value={String(summary.present)} />
        <AttStat icon={<X className="h-3 w-3" />} label="Absent" value={String(summary.absent)} />
        <AttStat icon={<Clock className="h-3 w-3" />} label="Pending" value={String(summary.pending)} />
        <AttStat icon={<Send className="h-3 w-3" />} label="Submitted" value={String(summary.submittedSessions)} />
      </div>

      {/* Class filter */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] uppercase font-semibold text-muted-foreground">Class:</span>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Classes</option>
          {exam.classes.map((c: any) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
        </select>
      </div>

      {/* Session list or session detail */}
      {selectedSession ? (
        <SessionDetail
          session={selectedSession}
          records={sessionRecords}
          summary={sessionSummary}
          onMark={markStatus}
          onMarkAllPresent={() => markAllPresent(selectedSession.id)}
          onSubmit={() => { submitSession(selectedSession.id); toast.success('Attendance submitted'); setSelectedSessionId(null) }}
          onBack={() => setSelectedSessionId(null)}
        />
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="px-2 py-1.5 border-b border-border/40 bg-muted/30">
            <p className="text-[9px] uppercase font-semibold text-muted-foreground">Exam Sessions</p>
          </div>
          <div className="divide-y divide-border/40">
            {examSessions.map((s) => {
              const sRecords = examRecords.filter((r) => r.date === s.date && r.startTime === s.startTime && r.roomId === s.roomId)
              const present = sRecords.filter((r) => r.status === 'PRESENT').length
              const absent = sRecords.filter((r) => r.status === 'ABSENT').length
              const pending = sRecords.filter((r) => r.status === 'NOT_MARKED').length
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedSessionId(s.id)}>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{s.subjectName} · {s.className}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDateLong(s.date)} · {s.shiftLabel} · {s.startTime}–{s.endTime} · {s.roomName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-muted-foreground">{sRecords.length} students</span>
                    {s.submitted ? (
                      <span className="text-[9px] font-medium text-emerald-600">✓ Submitted</span>
                    ) : pending > 0 ? (
                      <span className="text-[9px] font-medium text-amber-600">Pending</span>
                    ) : (
                      <span className="text-[9px] font-medium text-blue-600">Ready</span>
                    )}
                  </div>
                </div>
              )
            })}
            {examSessions.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground">No exam sessions available.</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function AttStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-[11px] font-semibold text-foreground truncate">{value}</p>
    </div>
  )
}

function SessionDetail({ session, records, summary, onMark, onMarkAllPresent, onSubmit, onBack }: {
  session: any
  records: any[]
  summary: { total: number; present: number; absent: number; pending: number }
  onMark: (id: string, status: AttendanceStatus) => void
  onMarkAllPresent: () => void
  onSubmit: () => void
  onBack: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{session.subjectName} · {session.className}</p>
          <p className="text-[9px] text-muted-foreground">{formatDateLong(session.date)} · {session.shiftLabel} · {session.startTime}–{session.endTime}</p>
        </div>
        <button onClick={onBack} className="text-[9px] text-muted-foreground hover:text-foreground">← Back</button>
      </div>

      {/* Session summary */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-muted-foreground">{summary.total} students</span>
        <span className="text-emerald-600 font-medium">{summary.present} Present</span>
        <span className="text-rose-600 font-medium">{summary.absent} Absent</span>
        <span className="text-amber-600 font-medium">{summary.pending} Pending</span>
      </div>

      {/* Mark All Present */}
      {!session.submitted && (
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onMarkAllPresent}>
          <Check className="h-3 w-3" /> Mark All Present
        </Button>
      )}

      {/* Roster */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="overflow-x-auto max-h-[20rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/30">
              <tr>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Roll</th>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Student</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Seat</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-border/30 hover:bg-muted/20">
                  <td className="px-2 py-1.5 text-muted-foreground tabular-nums">{r.studentRollNo}</td>
                  <td className="px-2 py-1.5 font-medium">{r.studentName}</td>
                  <td className="px-2 py-1.5 text-center text-[9px] text-muted-foreground font-mono">{r.seatNumber}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-center gap-1">
                      {!session.submitted && (
                        <>
                          <button onClick={() => onMark(r.id, 'PRESENT')} className={cn('w-5 h-5 rounded flex items-center justify-center text-[8px] transition-colors', r.status === 'PRESENT' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-emerald-500/20')} title="Present">P</button>
                          <button onClick={() => onMark(r.id, 'ABSENT')} className={cn('w-5 h-5 rounded flex items-center justify-center text-[8px] transition-colors', r.status === 'ABSENT' ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground hover:bg-rose-500/20')} title="Absent">A</button>
                          <button onClick={() => onMark(r.id, 'LEAVE')} className={cn('w-5 h-5 rounded flex items-center justify-center text-[8px] transition-colors', r.status === 'LEAVE' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-amber-500/20')} title="Leave">L</button>
                        </>
                      )}
                      {session.submitted && (
                        <span className={cn('text-[9px] font-medium',
                          r.status === 'PRESENT' ? 'text-emerald-600' :
                          r.status === 'ABSENT' ? 'text-rose-600' :
                          r.status === 'LEAVE' ? 'text-amber-600' : 'text-muted-foreground'
                        )}>{r.status}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No students in this session.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit */}
      {!session.submitted && (
        <div className="flex items-center justify-between gap-2">
          {summary.pending > 0 && <span className="text-[9px] text-amber-600">{summary.pending} students not marked</span>}
          <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white ml-auto" onClick={onSubmit} disabled={summary.pending > 0}>
            <Send className="h-3 w-3" /> Submit Attendance
          </Button>
        </div>
      )}
      {session.submitted && (
        <div className="text-center text-[10px] text-emerald-600 font-medium">
          ✓ Attendance Submitted
        </div>
      )}
    </div>
  )
}
