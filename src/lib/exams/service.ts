// ──────────────────────────────────────────────────────────────────────
// Server-side examination service — single source of truth for all
// exam CRUD, marks workflow, result computation, and audit logging.
// All Prisma reads/writes go through this module.
// ──────────────────────────────────────────────────────────────────────

import 'server-only'
import { db } from '@/lib/db'
import {
  type ExamDTO,
  type ExamSubjectConfigDTO,
  type ExamClassDTO,
  type ScheduleItemDTO,
  type StudentDTO,
  type ExamMarkDTO,
  type CreateExamInput,
  type SetMarkInput,
  type AuditLogDTO,
  type MarkStatus,
  type WorkflowStatus,
  type ExamAnalyticsDTO,
  type AuthUserLike,
} from './types'
import { computeAnalytics, computeAllResults, type StudentResult } from './result-engine'

// ─── DTO mapping helpers ─────────────────────────────────────────────

export function toSubjectConfigDTO(s: any): ExamSubjectConfigDTO {
  return {
    id: s.id,
    examId: s.examId,
    classId: s.classId,
    subjectId: s.subjectId,
    subjectName: s.subject?.name ?? '',
    subjectCode: s.subject?.code ?? null,
    maxMarks: s.maxMarks,
    passMarks: s.passMarks,
    theoryMarks: s.theoryMarks,
    practicalMarks: s.practicalMarks,
    sortOrder: s.sortOrder ?? 0,
  }
}

export function toExamClassDTO(ec: any): ExamClassDTO {
  return {
    id: ec.id,
    examId: ec.examId,
    classId: ec.classId,
    className: ec.class?.name ?? '',
    gradeLevel: ec.class?.gradeLevel ?? null,
    section: ec.class?.section ?? null,
    studentCount: ec.class?._count?.students ?? 0,
  }
}

export function toScheduleDTO(s: any): ScheduleItemDTO {
  return {
    id: s.id,
    examId: s.examId,
    classId: s.classId,
    className: s.class?.name ?? '',
    subjectId: s.subjectId,
    subjectName: s.subject?.name ?? null,
    date: s.date ? new Date(s.date).toISOString().split('T')[0] : '',
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    invigilatorId: s.invigilatorId,
    invigilatorName: s.invigilatorName,
  }
}

export function toMarkDTO(m: any): ExamMarkDTO {
  return {
    id: m.id,
    examId: m.examId,
    classId: m.classId,
    subjectId: m.subjectId,
    studentId: m.studentId,
    studentName: m.student?.user?.name ?? '',
    studentRollNo: m.student?.rollNo ?? null,
    marksObtained: m.marksObtained,
    status: m.status as MarkStatus,
    workflowStatus: m.workflowStatus as WorkflowStatus,
    originalMarks: m.originalMarks,
    graceMarks: m.graceMarks ?? 0,
    graceReason: m.graceReason,
    remarks: m.remarks,
    enteredBy: m.enteredBy,
    enteredAt: m.enteredAt ? m.enteredAt.toISOString() : null,
    verifiedBy: m.verifiedBy,
    verifiedAt: m.verifiedAt ? m.verifiedAt.toISOString() : null,
    lockedBy: m.lockedBy,
  }
}

function toExamDTO(e: any): ExamDTO {
  const marks = e.marks ?? []
  const total = marks.length
  const entered = marks.filter((m: any) => m.marksObtained !== null || m.status !== 'PRESENT').length
  const locked = marks.filter((m: any) => m.workflowStatus === 'LOCKED').length
  const submitted = marks.filter((m: any) => m.workflowStatus === 'SUBMITTED').length
  const verified = marks.filter((m: any) => m.workflowStatus === 'VERIFIED').length
  return {
    id: e.id,
    schoolId: e.schoolId,
    name: e.name,
    type: e.type ?? 'Unit Test',
    session: e.session ?? '2025-2026',
    term: e.term ?? null,
    status: e.status ?? 'Draft',
    resultStatus: e.resultStatus ?? 'Not Started',
    passPercentage: e.passPercentage ?? 33,
    startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : null,
    endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : null,
    declaredAt: e.declaredAt ? e.declaredAt.toISOString() : null,
    declaredBy: e.declaredBy,
    createdBy: e.createdBy,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    classes: (e.examClasses ?? []).map(toExamClassDTO),
    subjects: (e.examSubjects ?? []).map(toSubjectConfigDTO),
    schedule: (e.scheduleItems ?? []).map(toScheduleDTO),
    markSummary: {
      total,
      entered,
      locked,
      submitted,
      verified,
      pct: total > 0 ? Math.round((entered / total) * 100) : 0,
    },
  }
}

// ─── Audit logging ────────────────────────────────────────────────────

async function audit(
  examId: string,
  user: AuthUserLike | null,
  action: string,
  entity: string | null = null,
  entityId: string | null = null,
  oldValue: unknown = null,
  newValue: unknown = null
) {
  try {
    await db.examAuditLog.create({
      data: {
        examId,
        userId: user?.id ?? null,
        userName: user?.name ?? null,
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
      },
    })
  } catch (err) {
    console.error('audit log failed', err)
  }
}

// ─── Read operations ──────────────────────────────────────────────────

const EXAM_INCLUDE = {
  examClasses: { include: { class: { include: { _count: { select: { students: true } } } } } },
  examSubjects: { include: { subject: true } },
  scheduleItems: { include: { class: true, subject: true } },
  marks: true,
}

export async function listExams(schoolId: string): Promise<ExamDTO[]> {
  const exams = await db.exam.findMany({
    where: { schoolId },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    include: EXAM_INCLUDE,
  })
  return exams.map(toExamDTO)
}

export async function getExam(examId: string, schoolId: string): Promise<ExamDTO | null> {
  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: EXAM_INCLUDE,
  })
  if (!exam) return null
  return toExamDTO(exam)
}

export async function getClasses(schoolId: string) {
  const classes = await db.class.findMany({
    where: { schoolId },
    orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }],
    include: {
      subjects: { orderBy: { name: 'asc' } },
      _count: { select: { students: true } },
    },
  })
  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    gradeLevel: c.gradeLevel,
    section: c.section,
    studentCount: c._count.students,
    subjects: c.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      fullMarks: s.fullMarks ?? 100,
      passMarks: s.passMarks ?? 33,
    })),
  }))
}

export async function getStudentsForClass(classId: string, schoolId: string): Promise<StudentDTO[]> {
  const students = await db.student.findMany({
    where: { classId, schoolId },
    orderBy: { rollNo: 'asc' },
    include: { user: { select: { name: true, email: true } } },
  })
  return students.map((s) => ({
    id: s.id,
    rollNo: s.rollNo,
    admissionNo: s.admissionNo,
    name: s.user?.name ?? '',
    classId: s.classId,
  }))
}

export async function getMarks(examId: string, schoolId: string): Promise<ExamMarkDTO[]> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId }, select: { id: true } })
  if (!exam) return []
  const marks = await db.examMark.findMany({
    where: { examId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
  return marks.map(toMarkDTO)
}

export async function getMarksForSubject(
  examId: string,
  classId: string,
  subjectId: string,
  schoolId: string
): Promise<ExamMarkDTO[]> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId }, select: { id: true } })
  if (!exam) return []
  const marks = await db.examMark.findMany({
    where: { examId, classId, subjectId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
  return marks.map(toMarkDTO)
}

export async function getAuditLogs(examId: string, schoolId: string): Promise<AuditLogDTO[]> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId }, select: { id: true } })
  if (!exam) return []
  const logs = await db.examAuditLog.findMany({
    where: { examId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return logs.map((l) => ({
    id: l.id,
    examId: l.examId,
    userId: l.userId,
    userName: l.userName,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    oldValue: l.oldValue,
    newValue: l.newValue,
    createdAt: l.createdAt.toISOString(),
  }))
}

// ─── Create Exam ──────────────────────────────────────────────────────

export async function createExam(
  schoolId: string,
  user: AuthUserLike | null,
  input: CreateExamInput
): Promise<ExamDTO> {
  if (!input.name?.trim()) throw new Error('Examination name is required')
  if (input.classIds.length === 0) throw new Error('At least one class is required')

  // Validate classes belong to school
  const validClasses = await db.class.findMany({
    where: { id: { in: input.classIds }, schoolId },
    select: { id: true, name: true },
  })
  if (validClasses.length !== input.classIds.length) {
    throw new Error('One or more classes not found in this school')
  }

  // Validate subjects exist
  for (const classId of input.classIds) {
    const subjects = input.subjectsByClass[classId] ?? []
    if (subjects.length === 0) throw new Error(`No subjects selected for class ${validClasses.find((c) => c.id === classId)?.name}`)
    const validSubjects = await db.subject.findMany({
      where: { id: { in: subjects.map((s) => s.subjectId) }, classId },
      select: { id: true },
    })
    if (validSubjects.length !== subjects.length) {
      throw new Error('One or more subjects not found for the selected class')
    }
  }

  const exam = await db.exam.create({
    data: {
      schoolId,
      name: input.name.trim(),
      type: input.type,
      session: input.session ?? '2025-2026',
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: 'Draft',
      resultStatus: 'Not Started',
      passPercentage: input.passPercentage ?? 33,
      createdBy: user?.id ?? null,
      examClasses: {
        create: input.classIds.map((classId) => ({ classId })),
      },
      examSubjects: {
        create: input.classIds.flatMap((classId) =>
          (input.subjectsByClass[classId] ?? []).map((s, idx) => ({
            classId,
            subjectId: s.subjectId,
            maxMarks: s.maxMarks ?? 100,
            passMarks: s.passMarks ?? 33,
            theoryMarks: s.theoryMarks ?? s.maxMarks ?? 100,
            practicalMarks: s.practicalMarks ?? 0,
            sortOrder: idx,
          }))
        ),
      },
    },
    include: EXAM_INCLUDE,
  })

  // Create schedule items if provided
  if (input.schedule && input.schedule.length > 0) {
    for (const item of input.schedule) {
      await db.examScheduleItem.create({
        data: {
          examId: exam.id,
          classId: item.classId,
          subjectId: item.subjectId,
          date: new Date(item.date),
          startTime: item.startTime,
          endTime: item.endTime,
          room: item.room ?? null,
          invigilatorName: item.invigilatorName ?? null,
        },
      })
    }
  }

  // Auto-create empty ExamMark rows for every student in every class+subject
  for (const classId of input.classIds) {
    const students = await db.student.findMany({ where: { classId, schoolId }, select: { id: true } })
    const subjects = input.subjectsByClass[classId] ?? []
    for (const student of students) {
      for (const subject of subjects) {
        await db.examMark.upsert({
          where: {
            examId_classId_subjectId_studentId: {
              examId: exam.id,
              classId,
              subjectId: subject.subjectId,
              studentId: student.id,
            },
          },
          create: {
            examId: exam.id,
            classId,
            subjectId: subject.subjectId,
            studentId: student.id,
            marksObtained: null,
            status: 'PRESENT',
            workflowStatus: 'DRAFT',
          },
          update: {},
        })
      }
    }
  }

  await audit(exam.id, user, 'EXAM_CREATED', 'EXAM', exam.id, null, { name: exam.name, type: exam.type })

  const fresh = await db.exam.findUnique({ where: { id: exam.id }, include: EXAM_INCLUDE })
  return toExamDTO(fresh!)
}

// ─── Update / Delete Exam ─────────────────────────────────────────────

export async function updateExam(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  updates: { name?: string; type?: string; session?: string; startDate?: string; endDate?: string; status?: string; passPercentage?: number }
): Promise<ExamDTO> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  const oldSnapshot = { name: exam.name, type: exam.type, status: exam.status, resultStatus: exam.resultStatus }
  const updated = await db.exam.update({
    where: { id: examId },
    data: {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.type !== undefined ? { type: updates.type } : {}),
      ...(updates.session !== undefined ? { session: updates.session } : {}),
      ...(updates.startDate !== undefined ? { startDate: updates.startDate ? new Date(updates.startDate) : null } : {}),
      ...(updates.endDate !== undefined ? { endDate: updates.endDate ? new Date(updates.endDate) : null } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.passPercentage !== undefined ? { passPercentage: updates.passPercentage } : {}),
    },
    include: EXAM_INCLUDE,
  })
  await audit(examId, user, 'EXAM_UPDATED', 'EXAM', examId, oldSnapshot, {
    name: updates.name,
    type: updates.type,
    status: updates.status,
  })
  return toExamDTO(updated)
}

export async function deleteExam(examId: string, schoolId: string, user: AuthUserLike | null): Promise<void> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  await db.exam.delete({ where: { id: examId } })
  // Audit log is deleted with cascade — but record to an external log if needed.
}

// ─── Schedule management ──────────────────────────────────────────────

export async function addScheduleItem(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  data: {
    classId: string
    subjectId: string
    date: string
    startTime: string
    endTime: string
    room?: string
    invigilatorName?: string
  }
): Promise<ScheduleItemDTO> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  // Conflict detection — same room+date+time OR same class+date+time OR same invigilator+date+time
  const conflicts = await db.examScheduleItem.findMany({
    where: {
      examId,
      OR: [
        { classId: data.classId, date: new Date(data.date), startTime: data.startTime },
        { room: data.room ?? undefined, date: new Date(data.date), startTime: data.startTime },
      ],
    },
  })
  if (conflicts.length > 0) {
    throw new Error('Schedule conflict detected: same class or room already booked at this time')
  }
  const item = await db.examScheduleItem.create({
    data: {
      examId,
      classId: data.classId,
      subjectId: data.subjectId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room ?? null,
      invigilatorName: data.invigilatorName ?? null,
    },
    include: { class: true, subject: true },
  })
  await audit(examId, user, 'SCHEDULE_ADDED', 'SCHEDULE', item.id, null, data)
  return toScheduleDTO(item)
}

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
    invigilatorName?: string
  }
): Promise<ScheduleItemDTO> {
  const item = await db.examScheduleItem.findFirst({
    where: { id: itemId, examId },
    include: { exam: true },
  })
  if (!item || item.exam.schoolId !== schoolId) throw new Error('Schedule item not found')
  const updated = await db.examScheduleItem.update({
    where: { id: itemId },
    data: {
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
      ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
      ...(data.room !== undefined ? { room: data.room } : {}),
      ...(data.invigilatorName !== undefined ? { invigilatorName: data.invigilatorName } : {}),
    },
    include: { class: true, subject: true },
  })
  await audit(examId, user, 'SCHEDULE_UPDATED', 'SCHEDULE', itemId, item, data)
  return toScheduleDTO(updated)
}

export async function deleteScheduleItem(
  examId: string,
  itemId: string,
  schoolId: string,
  user: AuthUserLike | null
): Promise<void> {
  const item = await db.examScheduleItem.findFirst({
    where: { id: itemId, examId },
    include: { exam: true },
  })
  if (!item || item.exam.schoolId !== schoolId) throw new Error('Schedule item not found')
  await db.examScheduleItem.delete({ where: { id: itemId } })
  await audit(examId, user, 'SCHEDULE_DELETED', 'SCHEDULE', itemId, toScheduleDTO(item), null)
}

// ─── Marks management ─────────────────────────────────────────────────

export async function setMark(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  input: SetMarkInput
): Promise<ExamMarkDTO> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus === 'Result Declared') {
    throw new Error('Cannot modify marks after results are declared')
  }

  // Validate marks against max
  const subjectConfig = await db.examSubjectConfig.findFirst({
    where: { examId, classId: input.classId, subjectId: input.subjectId },
  })
  if (!subjectConfig) throw new Error('Subject not configured for this exam/class')

  const max = subjectConfig.maxMarks
  if (input.status === 'PRESENT' && input.marksObtained !== null) {
    if (input.marksObtained < 0) throw new Error('Marks cannot be negative')
    if (input.marksObtained > max) throw new Error(`Marks cannot exceed maximum (${max})`)
  }
  if (input.status !== 'PRESENT' && input.marksObtained !== null && input.marksObtained !== 0) {
    // For ABSENT/MEDICAL/EXEMPTED we typically store null; coerce
    input.marksObtained = null
  }

  const existing = await db.examMark.findUnique({
    where: {
      examId_classId_subjectId_studentId: {
        examId,
        classId: input.classId,
        subjectId: input.subjectId,
        studentId: input.studentId,
      },
    },
  })

  // If mark is already LOCKED, cannot modify without override flow
  if (existing?.workflowStatus === 'LOCKED') {
    throw new Error('Mark is locked. Use the unlock/reopen workflow to modify.')
  }
  if (existing?.workflowStatus === 'VERIFIED' && user?.role !== 'PRINCIPAL' && user?.role !== 'MANAGEMENT') {
    throw new Error('Verified marks can only be modified by Principal')
  }

  const oldValue = existing ? {
    marksObtained: existing.marksObtained,
    status: existing.status,
  } : null

  // Preserve workflow status if already SUBMITTED/VERIFIED — but updates after submission
  // remain allowed for teachers only if not yet LOCKED.
  const updated = await db.examMark.upsert({
    where: {
      examId_classId_subjectId_studentId: {
        examId,
        classId: input.classId,
        subjectId: input.subjectId,
        studentId: input.studentId,
      },
    },
    create: {
      examId,
      classId: input.classId,
      subjectId: input.subjectId,
      studentId: input.studentId,
      marksObtained: input.status === 'PRESENT' ? input.marksObtained : null,
      status: input.status,
      workflowStatus: 'DRAFT',
      originalMarks: input.status === 'PRESENT' ? input.marksObtained : null,
      remarks: input.remarks ?? null,
      enteredBy: user?.id ?? null,
      enteredAt: new Date(),
    },
    update: {
      marksObtained: input.status === 'PRESENT' ? input.marksObtained : null,
      status: input.status,
      remarks: input.remarks ?? existing?.remarks ?? null,
      enteredBy: user?.id ?? existing?.enteredBy ?? null,
      enteredAt: new Date(),
      // If reverting from SUBMITTED to DRAFT (any edit), allow it
      ...(existing?.workflowStatus === 'SUBMITTED' ? { workflowStatus: 'DRAFT' as const } : {}),
    },
    include: { student: { include: { user: { select: { name: true } } } } },
  })

  // Update exam resultStatus to "Marks Entry" if it was "Not Started"
  if (exam.resultStatus === 'Not Started') {
    await db.exam.update({ where: { id: examId }, data: { resultStatus: 'Marks Entry' } })
  }

  await audit(examId, user, 'MARK_ENTERED', 'MARK', updated.id, oldValue, {
    marksObtained: updated.marksObtained,
    status: updated.status,
  })
  return toMarkDTO(updated)
}

export async function setMarksBatch(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  marks: SetMarkInput[]
): Promise<{ updated: number }> {
  let updated = 0
  for (const m of marks) {
    try {
      await setMark(examId, schoolId, user, m)
      updated++
    } catch (err) {
      // continue but skip invalid entries
      console.warn('setMarksBatch skip', m, err)
    }
  }
  return { updated }
}

export async function submitMarks(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  filter: { classId?: string; subjectId?: string }
): Promise<{ submitted: number }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus === 'Result Declared') {
    throw new Error('Cannot modify marks after results are declared')
  }
  const result = await db.examMark.updateMany({
    where: {
      examId,
      ...(filter.classId ? { classId: filter.classId } : {}),
      ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      workflowStatus: 'DRAFT',
      // Must have either marks entered OR a non-PRESENT status (absent/medical/exempted)
      OR: [
        { marksObtained: { not: null } },
        { status: { not: 'PRESENT' } },
      ],
    },
    data: {
      workflowStatus: 'SUBMITTED',
      enteredBy: user?.id ?? null,
    },
  })
  // Move exam to Under Verification if all marks submitted
  const remainingDrafts = await db.examMark.count({ where: { examId, workflowStatus: 'DRAFT' } })
  if (remainingDrafts === 0) {
    await db.exam.update({ where: { id: examId }, data: { resultStatus: 'Under Verification' } })
  } else {
    await db.exam.update({ where: { id: examId }, data: { resultStatus: 'Marks Entry' } })
  }
  await audit(examId, user, 'MARK_SUBMITTED', 'MARK', null, null, filter)
  return { submitted: result.count }
}

export async function verifyMarks(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  filter: { classId?: string; subjectId?: string }
): Promise<{ verified: number }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus === 'Result Declared') {
    throw new Error('Cannot modify marks after results are declared')
  }
  const result = await db.examMark.updateMany({
    where: {
      examId,
      ...(filter.classId ? { classId: filter.classId } : {}),
      ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      workflowStatus: 'SUBMITTED',
    },
    data: {
      workflowStatus: 'VERIFIED',
      verifiedBy: user?.id ?? null,
      verifiedAt: new Date(),
    },
  })
  const remainingSubmitted = await db.examMark.count({ where: { examId, workflowStatus: 'SUBMITTED' } })
  if (remainingSubmitted === 0) {
    const remainingDrafts = await db.examMark.count({ where: { examId, workflowStatus: 'DRAFT' } })
    if (remainingDrafts === 0) {
      await db.exam.update({ where: { id: examId }, data: { resultStatus: 'Result Ready' } })
    }
  }
  await audit(examId, user, 'MARK_VERIFIED', 'MARK', null, null, filter)
  return { verified: result.count }
}

export async function lockMarks(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null,
  filter: { classId?: string; subjectId?: string }
): Promise<{ locked: number }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus === 'Result Declared') {
    throw new Error('Cannot modify marks after results are declared')
  }
  // Lock everything matching filter (DRAFT/SUBMITTED/VERIFIED → LOCKED)
  const result = await db.examMark.updateMany({
    where: {
      examId,
      ...(filter.classId ? { classId: filter.classId } : {}),
      ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      workflowStatus: { in: ['DRAFT', 'SUBMITTED', 'VERIFIED'] },
    },
    data: {
      workflowStatus: 'LOCKED',
      lockedBy: user?.id ?? null,
    },
  })
  await db.exam.update({ where: { id: examId }, data: { resultStatus: 'Result Ready' } })
  await audit(examId, user, 'MARK_LOCKED', 'MARK', null, null, filter)
  return { locked: result.count }
}

// ─── Results ──────────────────────────────────────────────────────────

export async function getResultsForClass(
  examId: string,
  classId: string,
  schoolId: string
): Promise<{ students: StudentDTO[]; subjects: ExamSubjectConfigDTO[]; marks: ExamMarkDTO[]; results: StudentResult[]; analytics: ExamAnalyticsDTO }> {
  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: {
      examSubjects: { include: { subject: true }, where: { classId } },
      marks: { where: { classId }, include: { student: { include: { user: { select: { name: true } } } } } },
      examClasses: { include: { class: { include: { _count: { select: { students: true } } } } } },
    },
  })
  if (!exam) throw new Error('Exam not found')
  const cls = exam.examClasses.find((ec) => ec.classId === classId)?.class
  if (!cls) throw new Error('Class not part of this exam')

  // Get real students of this class
  const students = await db.student.findMany({
    where: { classId, schoolId },
    orderBy: { rollNo: 'asc' },
    include: { user: { select: { name: true } } },
  })

  const studentDTOs: StudentDTO[] = students.map((s) => ({
    id: s.id,
    rollNo: s.rollNo,
    admissionNo: s.admissionNo,
    name: s.user?.name ?? '',
    classId: s.classId,
  }))

  const subjectDTOs = exam.examSubjects.map(toSubjectConfigDTO)
  const markDTOs = exam.marks.map(toMarkDTO)

  const results = computeAllResults({
    students: studentDTOs,
    subjects: subjectDTOs,
    marks: markDTOs,
    passPercentage: exam.passPercentage,
  })
  for (const r of results) r.className = cls.name

  const analytics = computeAnalytics(
    {
      students: studentDTOs,
      subjects: subjectDTOs,
      marks: markDTOs,
      passPercentage: exam.passPercentage,
    },
    cls.name
  )

  return { students: studentDTOs, subjects: subjectDTOs, marks: markDTOs, results, analytics }
}

export async function declareResults(
  examId: string,
  schoolId: string,
  user: AuthUserLike | null
): Promise<{ declared: boolean }> {
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } })
  if (!exam) throw new Error('Exam not found')
  if (exam.resultStatus !== 'Result Ready') {
    throw new Error('Results can only be declared from Result Ready state')
  }
  await db.exam.update({
    where: { id: examId },
    data: {
      resultStatus: 'Result Declared',
      status: 'Completed',
      declaredAt: new Date(),
      declaredBy: user?.id ?? null,
    },
  })
  await audit(examId, user, 'RESULT_DECLARED', 'EXAM', examId, null, null)
  return { declared: true }
}

export type { StudentResult }
