// ──────────────────────────────────────────────────────────────────────
// Examinations service — P1 & P2 features.
// Splits: seating, exam attendance, invigilator roster, batch admit card,
// grace/moderation, promotion outcomes, CSV import, result publication.
// ──────────────────────────────────────────────────────────────────────

import 'server-only'
import { db } from '@/lib/db'
import {
  type AuthUserLike,
  type ScheduleItemDTO,
  type StudentDTO,
  type ExamMarkDTO,
  type MarkStatus,
  type WorkflowStatus,
  type AuditLogDTO,
} from './types'
import { toScheduleDTO, toMarkDTO, audit, deleteScheduleItem } from './service'
import { getGradeForPercentage } from './types'
import { computeAllResults } from './result-engine'

// Re-export deleteScheduleItem so callers of service-extended have a single import surface
export { deleteScheduleItem }

// ─── Schedule — Update existing item ─────────────────────────────────

export async function updateScheduleItem(
  examId: string,
  itemId: string,
  schoolId: string,
  user: AuthUserLike | null,
  data: {
    date?: string
    startTime?: string
    endTime?: string
    room?: string
    invigilatorId?: string | null
    invigilatorName?: string | null
  }
): Promise<ScheduleItemDTO> {
  const item = await db.examScheduleItem.findFirst({
    where: { id: itemId, examId },
    include: { exam: true },
  })
  if (!item || item.exam.schoolId !== schoolId) throw new Error('Schedule item not found')

  // Conflict detection on update (skip self)
  if (data.date && (data.startTime || data.room)) {
    const conflicts = await db.examScheduleItem.findMany({
      where: {
        examId,
        id: { not: itemId },
        date: new Date(data.date),
        startTime: data.startTime ?? item.startTime,
        OR: data.room ? [
          { classId: item.classId },
          { room: data.room },
        ] : [{ classId: item.classId }],
      },
    })
    if (conflicts.length > 0) {
      throw new Error('Schedule conflict: same class or room already booked at this time')
    }
  }

  const updated = await db.examScheduleItem.update({
    where: { id: itemId },
    data: {
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
      ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
      ...(data.room !== undefined ? { room: data.room } : {}),
      ...(data.invigilatorId !== undefined ? { invigilatorId: data.invigilatorId } : {}),
      ...(data.invigilatorName !== undefined ? { invigilatorName: data.invigilatorName } : {}),
    },
    include: { class: true, subject: true },
  })
  await audit(examId, user, 'SCHEDULE_UPDATED', 'SCHEDULE', itemId, item, data)
  return toScheduleDTO(updated)
}

// ─── Invigilator Duty Roster ──────────────────────────────────────────

export interface InvigilatorDTO {
  id: string
  name: string
  email: string | null
  department: string | null
  employeeId: string | null
  assignedCount: number
}

export async function listTeachers(schoolId: string): Promise<InvigilatorDTO[]> {
  const teachers = await db.teacher.findMany({
    where: { schoolId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  })
  return teachers.map((t) => ({
    id: t.id,
    name: t.user?.name ?? '',
    email: t.user?.email ?? null,
    department: t.department,
    employeeId: t.employeeId,
    assignedCount: 0,
  }))
}

export async function assignInvigilator(
  examId: string,
  scheduleItemId: string,
  schoolId: string,
  user: AuthUserLike | null,
  teacherId: string
): Promise<ScheduleItemDTO> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  const item = await db.examScheduleItem.findFirst({
    where: { id: scheduleItemId, examId },
    include: { exam: true },
  })
  if (!item || item.exam.schoolId !== schoolId) throw new Error('Schedule item not found')

  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, schoolId },
    include: { user: { select: { name: true } } },
  })
  if (!teacher) throw new Error('Teacher not found')

  // Check teacher availability — same date + overlapping time
  const sameDay = await db.examScheduleItem.findMany({
    where: {
      examId,
      invigilatorId: teacherId,
      id: { not: scheduleItemId },
      date: item.date,
    },
  })
  const overlap = sameDay.find((s) => {
    return !(item.endTime <= s.startTime || s.endTime <= item.startTime)
  })
  if (overlap) {
    throw new Error(`Teacher ${teacher.user?.name} already assigned to another exam at this time`)
  }

  const updated = await db.examScheduleItem.update({
    where: { id: scheduleItemId },
    data: {
      invigilatorId: teacherId,
      invigilatorName: teacher.user?.name ?? null,
    },
    include: { class: true, subject: true },
  })
  await audit(examId, user, 'INVIGILATOR_ASSIGNED', 'SCHEDULE', scheduleItemId, null, {
    teacherId,
    teacherName: teacher.user?.name,
  })
  return toScheduleDTO(updated)
}

// ─── Seating Plan ─────────────────────────────────────────────────────

export interface SeatAssignmentDTO {
  id: string
  examId: string
  classId: string
  className: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  room: string
  seatNumber: number
  row: number | null
  column: number | null
}

export async function generateSeatingPlan(
  examId: string,
  classId: string,
  schoolId: string,
  user: AuthUserLike | null,
  rooms: Array<{ name: string; capacity: number }>
): Promise<{ generated: number }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (rooms.length === 0) throw new Error('At least one room is required')

  // Get real students of this class
  const students = await db.student.findMany({
    where: { classId, schoolId },
    orderBy: { rollNo: 'asc' },
    include: { user: { select: { name: true } }, class: true },
  })
  if (students.length === 0) throw new Error('No students in this class')

  // Total capacity check
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0)
  if (totalCapacity < students.length) {
    throw new Error(`Insufficient capacity: ${students.length} students, ${totalCapacity} seats available`)
  }

  // Clear any existing assignments for this exam+class
  await db.examSeatAssignment.deleteMany({ where: { examId, classId } })

  // Distribute students across rooms, sorted by roll number
  let seatCounter = 0
  for (const room of rooms) {
    for (let i = 0; i < room.capacity && seatCounter < students.length; i++) {
      const s = students[seatCounter]
      const seatNumber = i + 1
      const row = Math.floor(i / 5) + 1
      const col = (i % 5) + 1
      await db.examSeatAssignment.create({
        data: {
          examId,
          classId,
          studentId: s.id,
          room: room.name,
          seatNumber,
          row,
          column: col,
        },
      })
      seatCounter++
      if (seatCounter >= students.length) break
    }
  }

  await audit(examId, user, 'SEATING_GENERATED', 'SEATING', null, null, {
    classId,
    studentCount: students.length,
    rooms,
  })
  return { generated: seatCounter }
}

export async function getSeatingPlan(
  examId: string,
  classId: string | null,
  schoolId: string
): Promise<SeatAssignmentDTO[]> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) return []
  const seats = await db.examSeatAssignment.findMany({
    where: { examId, ...(classId ? { classId } : {}) },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: [{ room: 'asc' }, { seatNumber: 'asc' }],
  })
  // Resolve classNames separately
  const classIds = [...new Set(seats.map((s) => s.classId))]
  const classes = await db.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
  const classMap = new Map(classes.map((c) => [c.id, c.name]))
  return seats.map((s) => ({
    id: s.id,
    examId: s.examId,
    classId: s.classId,
    className: classMap.get(s.classId) ?? '',
    studentId: s.studentId,
    studentName: s.student?.user?.name ?? '',
    studentRollNo: s.student?.rollNo ?? null,
    room: s.room,
    seatNumber: s.seatNumber,
    row: s.row,
    column: s.column,
  }))
}

// ─── Exam Attendance ─────────────────────────────────────────────────

export interface ExamAttendanceDTO {
  id: string
  examId: string
  scheduleItemId: string | null
  classId: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  subjectId: string | null
  subjectName: string | null
  date: string
  status: MarkStatus
  remarks: string | null
}

export async function markExamAttendance(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  input: {
    scheduleItemId?: string
    classId: string
    studentId: string
    subjectId: string // required — exam attendance is per-subject
    date: string
    status: MarkStatus
    remarks?: string
  }
): Promise<{ upserted: boolean }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (!input.subjectId) throw new Error('subjectId is required for exam attendance')

  await db.examAttendance.upsert({
    where: {
      examId_studentId_subjectId_date: {
        examId,
        studentId: input.studentId,
        subjectId: input.subjectId,
        date: new Date(input.date),
      },
    },
    create: {
      examId,
      scheduleItemId: input.scheduleItemId ?? null,
      classId: input.classId,
      studentId: input.studentId,
      subjectId: input.subjectId,
      date: new Date(input.date),
      status: input.status,
      remarks: input.remarks ?? null,
      markedBy: user?.id ?? null,
    },
    update: {
      status: input.status,
      remarks: input.remarks ?? null,
      markedBy: user?.id ?? null,
    },
  })
  await audit(examId, user, 'EXAM_ATTENDANCE_MARKED', 'ATTENDANCE', input.studentId, null, input)
  return { upserted: true }
}

export async function getExamAttendance(
  examId: string,
  classId: string | null,
  schoolId: string
): Promise<ExamAttendanceDTO[]> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) return []
  const attendance = await db.examAttendance.findMany({
    where: { examId, ...(classId ? { classId } : {}) },
    include: {
      student: { include: { user: { select: { name: true } } } },
      scheduleItem: { include: { subject: true } },
    },
    orderBy: { date: 'asc' },
  })
  return attendance.map((a) => ({
    id: a.id,
    examId: a.examId,
    scheduleItemId: a.scheduleItemId,
    classId: a.classId,
    studentId: a.studentId,
    studentName: a.student?.user?.name ?? '',
    studentRollNo: a.student?.rollNo ?? null,
    subjectId: a.subjectId,
    subjectName: a.scheduleItem?.subject?.name ?? null,
    date: a.date.toISOString().split('T')[0],
    status: a.status as MarkStatus,
    remarks: a.remarks,
  }))
}

export async function autoMarkAttendanceFromExamMarks(
  examId: string,
  classId: string,
  schoolId: string,
  user: AuthUserLike | null
): Promise<{ marked: number }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')

  // For every mark where status != PRESENT, create exam attendance entry
  const marks = await db.examMark.findMany({
    where: { examId, classId, status: { not: 'PRESENT' } },
  })
  let count = 0
  for (const m of marks) {
    const scheduleItem = await db.examScheduleItem.findFirst({
      where: { examId, classId, subjectId: m.subjectId },
    })
    if (!scheduleItem) continue
    await db.examAttendance.upsert({
      where: {
        examId_studentId_subjectId_date: {
          examId,
          studentId: m.studentId,
          subjectId: m.subjectId,
          date: scheduleItem.date,
        },
      },
      create: {
        examId,
        scheduleItemId: scheduleItem.id,
        classId,
        studentId: m.studentId,
        subjectId: m.subjectId,
        date: scheduleItem.date,
        status: m.status as MarkStatus,
        markedBy: user?.id ?? null,
      },
      update: {
        status: m.status as MarkStatus,
        markedBy: user?.id ?? null,
      },
    })
    count++
  }
  await audit(examId, user, 'EXAM_ATTENDANCE_AUTO_MARKED', 'ATTENDANCE', null, null, { count })
  return { marked: count }
}

// ─── Grace / Moderation ───────────────────────────────────────────────

export async function applyGraceMarks(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  input: {
    markId: string
    graceMarks: number
    reason: string
  }
): Promise<ExamMarkDTO> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus === 'Result Declared' && user?.role !== 'PRINCIPAL') {
    throw new Error('Grace marks after declaration require Principal override')
  }
  if (input.graceMarks <= 0) throw new Error('Grace marks must be positive')
  if (!input.reason?.trim()) throw new Error('Reason is required for grace marks')

  // Read graceMarksLimit rule from school config (default: 5)
  const rule = await db.examRule.findUnique({
    where: { schoolId_key: { schoolId, key: 'graceMarksLimit' } },
  })
  const limit = rule ? Number(rule.value) : 5
  if (input.graceMarks > limit) {
    throw new Error(`Grace marks cannot exceed the school limit of ${limit}`)
  }

  const mark = await db.examMark.findUnique({
    where: { id: input.markId },
    include: { student: { include: { user: { select: { name: true } } } }, subject: true },
  })
  if (!mark || mark.examId !== examId) throw new Error('Mark not found')

  const oldValues = {
    marksObtained: mark.marksObtained,
    graceMarks: mark.graceMarks,
    originalMarks: mark.originalMarks,
  }

  // Preserve original marks the first time grace is applied
  const originalMarks = mark.originalMarks ?? mark.marksObtained ?? 0
  const newMarksObtained = (mark.marksObtained ?? 0) + input.graceMarks

  // Don't allow grace to exceed max marks
  const max = await db.examSubjectConfig.findFirst({
    where: { examId, classId: mark.classId, subjectId: mark.subjectId },
    select: { maxMarks: true },
  })
  const maxMarks = max?.maxMarks ?? 100
  if (newMarksObtained > maxMarks) {
    throw new Error(`Grace marks would exceed the maximum (${maxMarks})`)
  }

  const updated = await db.examMark.update({
    where: { id: input.markId },
    data: {
      originalMarks,
      graceMarks: mark.graceMarks + input.graceMarks,
      graceReason: input.reason,
      graceBy: user?.id ?? null,
      marksObtained: newMarksObtained,
    },
    include: { student: { include: { user: { select: { name: true } } } } },
  })

  await audit(examId, user, 'GRACE_APPLIED', 'MARK', mark.id, oldValues, {
    graceMarks: input.graceMarks,
    reason: input.reason,
    newTotal: newMarksObtained,
    appliedBy: user?.name,
  })

  return toMarkDTO(updated)
}

// ─── Promotion / Compartment / Retest ──────────────────────────────────

export interface ResultOutcomeDTO {
  id: string
  examId: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  classId: string
  className: string
  outcome: 'PROMOTED' | 'COMPARTMENT' | 'RETEST' | 'NOT_PROMOTED'
  reason: string | null
  overrideBy: string | null
  notes: string | null
  percentage: number
  grade: string
  passed: boolean
  subjectsFailed: number
}

export async function computeAutoOutcomes(
  examId: string,
  classId: string,
  schoolId: string
): Promise<{ autoCount: number }> {
  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: {
      examSubjects: { where: { classId }, include: { subject: true } },
      marks: { where: { classId }, include: { student: { include: { user: { select: { name: true } } } } } },
      examClasses: { include: { class: true } },
    },
  })
  if (!exam) throw new Error('Exam not found')
  const classLink = exam.examClasses.find((ec) => ec.classId === classId)
  if (!classLink) throw new Error('Class not in this exam')

  // Read promotion thresholds from ExamRule (defaults: 1 fail → COMPARTMENT, 2 fails → RETEST)
  const [compartmentRule, retestRule] = await Promise.all([
    db.examRule.findUnique({ where: { schoolId_key: { schoolId, key: 'compartmentThreshold' } } }),
    db.examRule.findUnique({ where: { schoolId_key: { schoolId, key: 'retestThreshold' } } }),
  ])
  const compartmentThreshold = compartmentRule ? Number(compartmentRule.value) : 1
  const retestThreshold = retestRule ? Number(retestRule.value) : 2

  // Fetch grade scale for accurate grading
  const gradeScaleRows = await db.gradeScale.findMany({
    where: { schoolId },
    orderBy: { minPct: 'desc' },
  })
  const gradeScale = gradeScaleRows.map((g) => ({
    grade: g.grade, minPct: g.minPct, maxPct: g.maxPct, color: g.color, sortOrder: g.sortOrder,
  }))

  // Get real students
  const students = await db.student.findMany({
    where: { classId, schoolId },
    orderBy: { rollNo: 'asc' },
    include: { user: { select: { name: true } } },
  })
  const studentDTOs: StudentDTO[] = students.map((s) => ({
    id: s.id, rollNo: s.rollNo, admissionNo: s.admissionNo,
    name: s.user?.name ?? '', classId: s.classId,
  }))
  const subjectDTOs = exam.examSubjects.map((s) => ({
    id: s.id, examId: s.examId, classId: s.classId, subjectId: s.subjectId,
    subjectName: s.subject.name, subjectCode: s.subject.code,
    maxMarks: s.maxMarks, passMarks: s.passMarks,
    theoryMarks: s.theoryMarks, practicalMarks: s.practicalMarks, sortOrder: s.sortOrder,
  }))
  const markDTOs = exam.marks.map((m) => ({
    id: m.id, examId: m.examId, classId: m.classId, subjectId: m.subjectId, studentId: m.studentId,
    studentName: m.student?.user?.name ?? '', studentRollNo: m.student?.rollNo ?? null,
    marksObtained: m.marksObtained, status: m.status as MarkStatus,
    workflowStatus: m.workflowStatus as WorkflowStatus,
    originalMarks: m.originalMarks, graceMarks: m.graceMarks ?? 0,
    graceReason: m.graceReason, remarks: m.remarks, enteredBy: m.enteredBy,
    enteredAt: m.enteredAt?.toISOString() ?? null,
    verifiedBy: m.verifiedBy, verifiedAt: m.verifiedAt?.toISOString() ?? null, lockedBy: m.lockedBy,
  }))

  const results = computeAllResults({
    students: studentDTOs, subjects: subjectDTOs, marks: markDTOs,
    passPercentage: exam.passPercentage, gradeScale,
  })

  // Clear existing auto outcomes for this class
  await db.examResultOutcome.deleteMany({ where: { examId, classId } })

  let count = 0
  for (const r of results) {
    let outcome: 'PROMOTED' | 'COMPARTMENT' | 'RETEST' | 'NOT_PROMOTED' = 'PROMOTED'
    if (r.passed) {
      outcome = 'PROMOTED'
    } else {
      const failedCount = r.subjectsCount - r.subjectsPassed
      if (failedCount <= compartmentThreshold) outcome = 'COMPARTMENT'
      else if (failedCount <= retestThreshold) outcome = 'RETEST'
      else outcome = 'NOT_PROMOTED'
    }
    await db.examResultOutcome.create({
      data: {
        examId,
        studentId: r.studentId,
        classId,
        outcome,
        reason: r.passed ? null : `${r.subjectsCount - r.subjectsPassed} subjects failed`,
      },
    })
    count++
  }
  return { autoCount: count }
}

export async function overrideOutcome(
  examId: string,
  studentId: string,
  schoolId: string,
  user: AuthUserLike | null,
  input: { outcome: 'PROMOTED' | 'COMPARTMENT' | 'RETEST' | 'NOT_PROMOTED'; reason?: string; notes?: string }
): Promise<void> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')

  // Look up the student's actual classId (for new outcome rows)
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { classId: true },
  })
  if (!student) throw new Error('Student not found')

  const existing = await db.examResultOutcome.findUnique({
    where: { examId_studentId: { examId, studentId } },
  })
  if (existing) {
    await db.examResultOutcome.update({
      where: { id: existing.id },
      data: {
        outcome: input.outcome,
        reason: input.reason ?? existing.reason,
        notes: input.notes ?? existing.notes,
        overrideBy: user?.id ?? null,
      },
    })
  } else {
    await db.examResultOutcome.create({
      data: {
        examId,
        studentId,
        classId: student.classId ?? '',
        outcome: input.outcome,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        overrideBy: user?.id ?? null,
      },
    })
  }
  await audit(examId, user, 'OUTCOME_OVERRIDDEN', 'OUTCOME', studentId, existing?.outcome, input)
}

export async function getOutcomes(
  examId: string,
  classId: string | null,
  schoolId: string
): Promise<ResultOutcomeDTO[]> {
  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: {
      examSubjects: classId ? { where: { classId }, include: { subject: true } } : { include: { subject: true } },
      marks: classId ? { where: { classId }, include: { student: { include: { user: { select: { name: true } } } } } } : { include: { student: { include: { user: { select: { name: true } } } } } },
      examClasses: { include: { class: true } },
      resultOutcomes: true,
    },
  })
  if (!exam) return []

  const classFilter = classId
  const filteredOutcomes = classFilter
    ? exam.resultOutcomes.filter((o) => o.classId === classFilter)
    : exam.resultOutcomes

  if (filteredOutcomes.length === 0) return []

  // Compute analytics for each student
  const students = await db.student.findMany({
    where: { id: { in: filteredOutcomes.map((o) => o.studentId) }, schoolId },
    include: { user: { select: { name: true } }, class: true },
  })

  const studentDTOs: StudentDTO[] = students.map((s) => ({
    id: s.id, rollNo: s.rollNo, admissionNo: s.admissionNo,
    name: s.user?.name ?? '', classId: s.classId,
  }))
  const subjectDTOs = exam.examSubjects
    .filter((s) => !classFilter || s.classId === classFilter)
    .map((s) => ({
      id: s.id, examId: s.examId, classId: s.classId, subjectId: s.subjectId,
      subjectName: s.subject.name, subjectCode: s.subject.code,
      maxMarks: s.maxMarks, passMarks: s.passMarks,
      theoryMarks: s.theoryMarks, practicalMarks: s.practicalMarks, sortOrder: s.sortOrder,
    }))
  const markDTOs = exam.marks.map((m) => ({
    id: m.id, examId: m.examId, classId: m.classId, subjectId: m.subjectId, studentId: m.studentId,
    studentName: m.student?.user?.name ?? '', studentRollNo: m.student?.rollNo ?? null,
    marksObtained: m.marksObtained, status: m.status as MarkStatus,
    workflowStatus: m.workflowStatus as WorkflowStatus,
    originalMarks: m.originalMarks, graceMarks: m.graceMarks ?? 0,
    graceReason: m.graceReason, remarks: m.remarks, enteredBy: m.enteredBy,
    enteredAt: m.enteredAt?.toISOString() ?? null,
    verifiedBy: m.verifiedBy, verifiedAt: m.verifiedAt?.toISOString() ?? null, lockedBy: m.lockedBy,
  }))

  const results = computeAllResults({
    students: studentDTOs, subjects: subjectDTOs, marks: markDTOs,
    passPercentage: exam.passPercentage,
  })

  return filteredOutcomes.map((outcome) => {
    const r = results.find((x) => x.studentId === outcome.studentId)
    const student = students.find((s) => s.id === outcome.studentId)
    return {
      id: outcome.id,
      examId: outcome.examId,
      studentId: outcome.studentId,
      studentName: student?.user?.name ?? '',
      studentRollNo: student?.rollNo ?? null,
      classId: outcome.classId,
      className: student?.class?.name ?? '',
      outcome: outcome.outcome as 'PROMOTED' | 'COMPARTMENT' | 'RETEST' | 'NOT_PROMOTED',
      reason: outcome.reason,
      overrideBy: outcome.overrideBy,
      notes: outcome.notes,
      percentage: r?.percentage ?? 0,
      grade: r?.grade ?? 'E',
      passed: r?.passed ?? false,
      subjectsFailed: r ? (r.subjectsCount - r.subjectsPassed) : 0,
    }
  })
}

// ─── CSV Import ──────────────────────────────────────────────────────

export interface CsvImportRow {
  rollNo: string
  studentName: string
  marksObtained: number | null
  status: MarkStatus
  remarks?: string
}

export interface CsvImportResult {
  accepted: number
  rejected: number
  errors: Array<{ row: number; message: string }>
  applied: Array<{ studentId: string; studentName: string; marks: number | null; status: MarkStatus }>
}

export async function importMarksCsv(
  examId: string,
  classId: string,
  subjectId: string,
  schoolId: string,
  user: AuthUserLike | null,
  rows: CsvImportRow[]
): Promise<CsvImportResult> {
  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: {
      examSubjects: { where: { classId, subjectId }, include: { subject: true } },
      examClasses: { include: { class: true } },
    },
  })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus === 'Result Declared') {
    throw new Error('Cannot import marks after results are declared')
  }
  const subjConfig = exam.examSubjects[0]
  if (!subjConfig) throw new Error('Subject not configured for this exam/class')

  const classLink = exam.examClasses.find((ec) => ec.classId === classId)
  if (!classLink) throw new Error('Class not in this exam')

  // Get real students
  const students = await db.student.findMany({
    where: { classId, schoolId },
    include: { user: { select: { name: true } } },
  })

  const result: CsvImportResult = {
    accepted: 0, rejected: 0,
    errors: [], applied: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // header is row 1
    if (!row.rollNo || !row.rollNo.trim()) {
      result.errors.push({ row: rowNum, message: 'Roll number is required' })
      result.rejected++
      continue
    }

    const student = students.find((s) => s.rollNo === row.rollNo.trim())
    if (!student) {
      result.errors.push({ row: rowNum, message: `No student with roll number "${row.rollNo}" in this class` })
      result.rejected++
      continue
    }

    // Validate marks
    if (row.status === 'PRESENT' && row.marksObtained !== null) {
      if (row.marksObtained < 0) {
        result.errors.push({ row: rowNum, message: `Negative marks for "${row.rollNo}"` })
        result.rejected++
        continue
      }
      if (row.marksObtained > subjConfig.maxMarks) {
        result.errors.push({ row: rowNum, message: `Marks ${row.marksObtained} exceeds max ${subjConfig.maxMarks}` })
        result.rejected++
        continue
      }
    }

    // Apply via upsert (preserve existing workflowStatus)
    const existing = await db.examMark.findUnique({
      where: {
        examId_classId_subjectId_studentId: {
          examId, classId, subjectId, studentId: student.id,
        },
      },
    })
    if (existing?.workflowStatus === 'LOCKED') {
      result.errors.push({ row: rowNum, message: `Mark for "${row.rollNo}" is locked` })
      result.rejected++
      continue
    }

    await db.examMark.upsert({
      where: {
        examId_classId_subjectId_studentId: {
          examId, classId, subjectId, studentId: student.id,
        },
      },
      create: {
        examId, classId, subjectId, studentId: student.id,
        marksObtained: row.status === 'PRESENT' ? row.marksObtained : null,
        status: row.status,
        workflowStatus: 'DRAFT',
        originalMarks: row.status === 'PRESENT' ? row.marksObtained : null,
        remarks: row.remarks ?? null,
        enteredBy: user?.id ?? null,
        enteredAt: new Date(),
      },
      update: {
        marksObtained: row.status === 'PRESENT' ? row.marksObtained : null,
        status: row.status,
        remarks: row.remarks ?? existing?.remarks ?? null,
        enteredBy: user?.id ?? null,
        enteredAt: new Date(),
        ...(existing?.workflowStatus === 'SUBMITTED' ? { workflowStatus: 'DRAFT' as const } : {}),
      },
    })

    result.applied.push({
      studentId: student.id,
      studentName: student.user?.name ?? '',
      marks: row.marksObtained,
      status: row.status,
    })
    result.accepted++
  }

  await audit(examId, user, 'MARKS_IMPORTED_CSV', 'MARK', null, null, {
    classId, subjectId, total: rows.length, accepted: result.accepted, rejected: result.rejected,
  })

  return result
}

// ─── Result Publication ──────────────────────────────────────────────

export async function publishResults(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  options: { notifyStudents?: boolean; notifyParents?: boolean } = {}
): Promise<{ published: boolean; notificationsSent: number }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus !== 'Result Declared') {
    throw new Error('Results must be declared before publishing')
  }

  let notificationsSent = 0
  if (options.notifyStudents || options.notifyParents) {
    // Send notifications to all students of all classes in this exam
    const examClasses = await db.examClass.findMany({
      where: { examId },
      include: { class: { include: { students: { include: { user: true } } } } },
    })
    for (const ec of examClasses) {
      for (const student of ec.class.students) {
        if (student.userId) {
          await db.notification.create({
            data: {
              schoolId,
              title: `${exam.name} Results Published`,
              message: `Your results for ${exam.name} are now available. Please check the portal.`,
              audience: 'STUDENTS',
              priority: 'HIGH',
              senderId: user?.id ?? null,
            },
          })
          notificationsSent++
        }
      }
    }
  }
  await audit(examId, user, 'RESULT_PUBLISHED', 'EXAM', examId, null, options)
  return { published: true, notificationsSent }
}
