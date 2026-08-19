/**
 * Mock marks store — paper-level workflow with demo data for Classes 9-12.
 *
 * Each (exam × class × subject) paper tracks its own lifecycle independently:
 * DRAFT → SUBMITTED → VERIFIED → LOCKED.
 * Classes can be locked/declared independently of each other.
 */

import { create } from 'zustand'
import type { ExamMarkDTO, ExamDTO, MarkStatus, WorkflowStatus } from '@/lib/exams/types'
import { useMockAuditStore } from './mock-audit-data'

type MockMark = ExamMarkDTO

/** Paper-level status: the aggregate status of all marks for one class+subject. */
export type PaperStatus = 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'VERIFIED' | 'LOCKED'

/** A timeline event for a paper (class + subject). Feeds the Audit tab. */
export interface PaperTimelineEvent {
  id: string
  examId: string
  classId: string
  subjectId: string
  /** The workflow action. */
  action: 'OPENED' | 'ENTERED' | 'SUBMITTED' | 'VERIFIED' | 'LOCKED' | 'UNLOCKED'
  /** Who performed it. */
  byName: string
  byRole: 'TEACHER' | 'PRINCIPAL' | 'SYSTEM'
  at: string
  note?: string
}

interface MockMarksState {
  marks: MockMark[]
  /** Per-class declaration state. */
  declaredClassIds: string[]
  /** Per-class publish state. */
  publishedClassIds: string[]
  /** Paper timeline events (class + subject → events). */
  timeline: PaperTimelineEvent[]
  /** Initialize marks for an exam. Seeds demo data for Classes 9-12. */
  initMarks: (exam: ExamDTO, students: Array<{ id: string; name: string; rollNo: string | null; classId: string; className: string }>) => void
  /** Upsert a single mark. */
  setMark: (examId: string, input: { classId: string; subjectId: string; studentId: string; marksObtained: number | null; status: MarkStatus; remarks?: string }) => MockMark | null
  /** Get marks for a specific class+subject. */
  getMarks: (examId: string, classId: string, subjectId: string) => MockMark[]
  /** Submit marks for a class+subject paper (DRAFT → SUBMITTED). */
  submitMarks: (examId: string, classId: string, subjectId: string) => number
  /** Verify marks for a class+subject paper (SUBMITTED → VERIFIED). */
  verifyMarks: (examId: string, classId: string, subjectId: string) => number
  /** Lock marks for a class+subject paper (VERIFIED → LOCKED). */
  lockMarks: (examId: string, classId: string, subjectId: string) => number
  /** Unlock marks for a class+subject paper (LOCKED → VERIFIED). */
  unlockMarks: (examId: string, classId: string, subjectId: string, reason: string) => number
  /** Apply grace marks to a single mark (preserves originalMarks). */
  applyGrace: (examId: string, markId: string, graceMarks: number, reason: string) => boolean
  /** Declare results for a class. */
  declareClass: (examId: string, classId: string) => boolean
  /** Publish results for a class. */
  publishClass: (examId: string, classId: string) => number
  /** Compute paper-level status for a class+subject. */
  getPaperStatus: (examId: string, classId: string, subjectId: string) => PaperStatus
  /** Check if a class has all papers locked (result ready). */
  isClassReady: (examId: string, classId: string) => boolean
  /** Check if all marks for the exam are locked. */
  allLocked: (examId: string) => boolean
  /** Get timeline events for a paper. */
  getPaperTimeline: (examId: string, classId: string, subjectId: string) => PaperTimelineEvent[]
  /** Internal: push a timeline event. Called by workflow methods. */
  pushTimeline: (examId: string, classId: string, subjectId: string, action: PaperTimelineEvent['action'], byName: string, byRole: PaperTimelineEvent['byRole'], note?: string) => void
}

/** Generate random marks for demo seeding. */
function randomMark(max: number): number {
  return Math.round((Math.random() * 0.4 + 0.5) * max) // 50%-90% range
}

export const useMockMarksStore = create<MockMarksState>()((set, get) => ({
  marks: [],
  declaredClassIds: [],
  publishedClassIds: [],
  timeline: [],

  initMarks: (exam, students) => {
    const existing = get().marks.filter((m) => m.examId === exam.id)
    if (existing.length > 0) return
    _seedExamMeta(exam)

    const newMarks: MockMark[] = []
    // Demo states for Classes 9-12: some locked, some verified, some submitted, some in-progress.
    // Map classId → grade level to determine which demo state to use.
    const demoStates = new Map<string, { subjectStates: Record<string, WorkflowStatus> }>()

    // For each exam class, determine if it's a Class 9-12 (grade 9-12).
    for (const examClass of exam.classes) {
      const grade = parseInt(examClass.gradeLevel ?? '0', 10)
      if (grade >= 9 && grade <= 12) {
        // Seed demo states: first 2 subjects locked, next 1 verified, next 1 submitted, last 1 in-progress.
        const classSubjects = exam.subjects.filter((s) => s.classId === examClass.classId)
        const states: Record<string, WorkflowStatus> = {}
        classSubjects.forEach((subj, i) => {
          if (i === 0) states[subj.subjectId] = 'LOCKED'
          else if (i === 1) states[subj.subjectId] = 'LOCKED'
          else if (i === 2) states[subj.subjectId] = 'VERIFIED'
          else if (i === 3) states[subj.subjectId] = 'SUBMITTED'
          else states[subj.subjectId] = 'DRAFT'
        })
        demoStates.set(examClass.classId, { subjectStates: states })
      }
    }

    for (const examClass of exam.classes) {
      const classStudents = students.filter((s) => s.classId === examClass.classId)
      const demoState = demoStates.get(examClass.classId)
      for (const subject of exam.subjects.filter((s) => s.classId === examClass.classId)) {
        const targetStatus = demoState?.subjectStates[subject.subjectId] ?? 'DRAFT'
        for (const student of classStudents) {
          // For demo states that are SUBMITTED or higher, fill marks. For DRAFT, fill some.
          const shouldFill = targetStatus !== 'DRAFT' || Math.random() > 0.5
          const marks = shouldFill ? randomMark(subject.maxMarks) : null
          const wfStatus: WorkflowStatus = targetStatus === 'DRAFT' && marks !== null
            ? 'DRAFT' // In-progress: marks entered but not submitted
            : targetStatus
          newMarks.push({
            id: `mark-${exam.id}-${subject.subjectId}-${student.id}`,
            examId: exam.id,
            classId: examClass.classId,
            subjectId: subject.subjectId,
            studentId: student.id,
            studentName: student.name,
            studentRollNo: student.rollNo,
            marksObtained: marks,
            status: 'PRESENT' as MarkStatus,
            workflowStatus: wfStatus,
            originalMarks: marks,
            graceMarks: 0,
            graceReason: null,
            remarks: null,
            enteredBy: targetStatus !== 'DRAFT' ? 'demo-teacher' : null,
            enteredAt: targetStatus !== 'DRAFT' ? new Date().toISOString() : null,
            verifiedBy: (targetStatus === 'VERIFIED' || targetStatus === 'LOCKED') ? 'principal' : null,
            verifiedAt: (targetStatus === 'VERIFIED' || targetStatus === 'LOCKED') ? new Date().toISOString() : null,
            lockedBy: targetStatus === 'LOCKED' ? 'principal' : null,
          })
        }
      }
    }
    // Seed timeline events for the demo states.
    const newTimeline: PaperTimelineEvent[] = []
    let tlCounter = 0
    const baseTime = Date.now()
    for (const examClass of exam.classes) {
      const demoState = demoStates.get(examClass.classId)
      if (!demoState) continue
      const classSubjects = exam.subjects.filter((s) => s.classId === examClass.classId)
      const className = examClass.className
      for (const subj of classSubjects) {
        const target = demoState.subjectStates[subj.subjectId]
        const teacher = pickTeacherForSubject(subj.subjectName)
        newTimeline.push({ id: `tl-seed-${tlCounter++}`, examId: exam.id, classId: examClass.classId, subjectId: subj.subjectId, action: 'OPENED', byName: teacher, byRole: 'SYSTEM', at: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(), note: `${className} ${subj.subjectName} marks entry opened` })
        if (target === 'DRAFT') continue
        newTimeline.push({ id: `tl-seed-${tlCounter++}`, examId: exam.id, classId: examClass.classId, subjectId: subj.subjectId, action: 'ENTERED', byName: teacher, byRole: 'TEACHER', at: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(), note: `${className} ${subj.subjectName} marks entered` })
        if (['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(target))
          newTimeline.push({ id: `tl-seed-${tlCounter++}`, examId: exam.id, classId: examClass.classId, subjectId: subj.subjectId, action: 'SUBMITTED', byName: teacher, byRole: 'TEACHER', at: new Date(baseTime - 90 * 60 * 1000).toISOString(), note: `${className} ${subj.subjectName} marks submitted` })
        if (['VERIFIED', 'LOCKED'].includes(target))
          newTimeline.push({ id: `tl-seed-${tlCounter++}`, examId: exam.id, classId: examClass.classId, subjectId: subj.subjectId, action: 'VERIFIED', byName: 'Principal', byRole: 'PRINCIPAL', at: new Date(baseTime - 60 * 60 * 1000).toISOString(), note: `${className} ${subj.subjectName} marks verified` })
        if (target === 'LOCKED')
          newTimeline.push({ id: `tl-seed-${tlCounter++}`, examId: exam.id, classId: examClass.classId, subjectId: subj.subjectId, action: 'LOCKED', byName: 'Principal', byRole: 'PRINCIPAL', at: new Date(baseTime - 30 * 60 * 1000).toISOString(), note: `${className} ${subj.subjectName} marks locked` })
      }
    }
    set((state) => ({ marks: [...state.marks, ...newMarks], timeline: [...state.timeline, ...newTimeline] }))
  },

  setMark: (examId, input) => {
    const existing = get().marks.find(
      (m) => m.examId === examId && m.classId === input.classId &&
      m.subjectId === input.subjectId && m.studentId === input.studentId
    )
    if (existing?.workflowStatus === 'LOCKED') return null

    const updated: MockMark = {
      ...(existing ?? {
        id: `mark-${examId}-${input.subjectId}-${input.studentId}`,
        examId, classId: input.classId, subjectId: input.subjectId, studentId: input.studentId,
        studentName: '', studentRollNo: null,
      }),
      marksObtained: input.marksObtained,
      status: input.status,
      remarks: input.remarks ?? null,
      workflowStatus: existing?.workflowStatus === 'LOCKED' ? 'LOCKED' : 'DRAFT',
      originalMarks: existing?.originalMarks ?? input.marksObtained,
      enteredBy: 'current-user',
      enteredAt: new Date().toISOString(),
    }
    set((state) => ({
      marks: existing ? state.marks.map((m) => m.id === existing.id ? updated : m) : [...state.marks, updated],
    }))
    return updated
  },

  getMarks: (examId, classId, subjectId) => {
    return get().marks.filter((m) => m.examId === examId && m.classId === classId && m.subjectId === subjectId)
  },

  submitMarks: (examId, classId, subjectId) => {
    let count = 0
    set((state) => ({
      marks: state.marks.map((m) => {
        if (m.examId === examId && m.classId === classId && m.subjectId === subjectId && m.workflowStatus === 'DRAFT') {
          count++
          return { ...m, workflowStatus: 'SUBMITTED' as WorkflowStatus }
        }
        return m
      }),
    }))
    if (count > 0) {
      const exam = getExamMeta(examId)
      const teacher = pickTeacherForSubject(getSubjectName(examId, classId, subjectId))
      get().pushTimeline?.(examId, classId, subjectId, 'SUBMITTED', teacher, 'TEACHER')
      useMockAuditStore.getState().recordEvent({
        examId,
        action: 'MARKS_SUBMITTED',
        summary: `${exam.className} ${getSubjectName(examId, classId, subjectId)} marks submitted`,
        entityType: 'paper',
        entityId: `${examId}:${classId}:${subjectId}`,
        metadata: { className: exam.className, subjectName: getSubjectName(examId, classId, subjectId), count },
        userId: null, userName: teacher, userRole: 'TEACHER',
        oldValue: 'DRAFT', newValue: 'SUBMITTED',
      })
    }
    return count
  },

  verifyMarks: (examId, classId, subjectId) => {
    let count = 0
    set((state) => ({
      marks: state.marks.map((m) => {
        if (m.examId === examId && m.classId === classId && m.subjectId === subjectId && m.workflowStatus === 'SUBMITTED') {
          count++
          return { ...m, workflowStatus: 'VERIFIED' as WorkflowStatus, verifiedBy: 'principal', verifiedAt: new Date().toISOString() }
        }
        return m
      }),
    }))
    if (count > 0) {
      const exam = getExamMeta(examId)
      get().pushTimeline?.(examId, classId, subjectId, 'VERIFIED', 'Principal', 'PRINCIPAL')
      useMockAuditStore.getState().recordEvent({
        examId,
        action: 'MARKS_VERIFIED',
        summary: `${exam.className} ${getSubjectName(examId, classId, subjectId)} marks verified`,
        entityType: 'paper',
        entityId: `${examId}:${classId}:${subjectId}`,
        metadata: { className: exam.className, subjectName: getSubjectName(examId, classId, subjectId), count },
        userId: 'principal', userName: 'Principal', userRole: 'PRINCIPAL',
        oldValue: 'SUBMITTED', newValue: 'VERIFIED',
      })
    }
    return count
  },

  lockMarks: (examId, classId, subjectId) => {
    let count = 0
    set((state) => ({
      marks: state.marks.map((m) => {
        if (m.examId === examId && m.classId === classId && m.subjectId === subjectId && m.workflowStatus === 'VERIFIED') {
          count++
          return { ...m, workflowStatus: 'LOCKED' as WorkflowStatus, lockedBy: 'principal' }
        }
        return m
      }),
    }))
    if (count > 0) {
      const exam = getExamMeta(examId)
      get().pushTimeline?.(examId, classId, subjectId, 'LOCKED', 'Principal', 'PRINCIPAL')
      useMockAuditStore.getState().recordEvent({
        examId,
        action: 'MARKS_LOCKED',
        summary: `${exam.className} ${getSubjectName(examId, classId, subjectId)} marks locked`,
        entityType: 'paper',
        entityId: `${examId}:${classId}:${subjectId}`,
        metadata: { className: exam.className, subjectName: getSubjectName(examId, classId, subjectId) },
        userId: 'principal', userName: 'Principal', userRole: 'PRINCIPAL',
        oldValue: 'VERIFIED', newValue: 'LOCKED',
      })
    }
    return count
  },

  unlockMarks: (examId, classId, subjectId, reason) => {
    let count = 0
    set((state) => ({
      marks: state.marks.map((m) => {
        if (m.examId === examId && m.classId === classId && m.subjectId === subjectId && m.workflowStatus === 'LOCKED') {
          count++
          return { ...m, workflowStatus: 'VERIFIED' as WorkflowStatus, lockedBy: null }
        }
        return m
      }),
    }))
    if (count > 0) {
      const exam = getExamMeta(examId)
      get().pushTimeline?.(examId, classId, subjectId, 'UNLOCKED', 'Principal', 'PRINCIPAL', reason)
      useMockAuditStore.getState().recordEvent({
        examId,
        action: 'MARKS_UNLOCKED',
        summary: `${exam.className} ${getSubjectName(examId, classId, subjectId)} marks unlocked`,
        entityType: 'paper',
        entityId: `${examId}:${classId}:${subjectId}`,
        metadata: { className: exam.className, subjectName: getSubjectName(examId, classId, subjectId), reason },
        userId: 'principal', userName: 'Principal', userRole: 'PRINCIPAL',
        oldValue: 'LOCKED', newValue: 'VERIFIED',
      })
    }
    return count
  },

  applyGrace: (examId, markId, graceMarks, reason) => {
    const mark = get().marks.find((m) => m.id === markId)
    if (!mark) return false
    if (mark.workflowStatus === 'LOCKED') return false
    const original = mark.marksObtained ?? 0
    const final = original + graceMarks
    set((state) => ({
      marks: state.marks.map((m) => m.id === markId ? { ...m, graceMarks, graceReason: reason, marksObtained: final, originalMarks: m.originalMarks ?? original } : m),
    }))
    useMockAuditStore.getState().recordEvent({
      examId,
      action: 'GRACE_APPLIED',
      summary: `Grace marks applied to ${mark.studentName} — ${getSubjectName(examId, mark.classId, mark.subjectId)} +${graceMarks}`,
      entityType: 'student',
      entityId: markId,
      metadata: { studentName: mark.studentName, subjectName: getSubjectName(examId, mark.classId, mark.subjectId), original, grace: graceMarks, final, reason },
      userId: 'principal', userName: 'Principal', userRole: 'PRINCIPAL',
      oldValue: String(original), newValue: String(final),
    })
    return true
  },

  declareClass: (examId, classId) => {
    if (!get().isClassReady(examId, classId)) return false
    set((state) => ({
      declaredClassIds: [...state.declaredClassIds, `${examId}:${classId}`],
    }))
    const exam = getExamMeta(examId)
    useMockAuditStore.getState().recordEvent({
      examId,
      action: 'RESULT_DECLARED',
      summary: `${exam.className} results declared`,
      entityType: 'class',
      entityId: `${examId}:${classId}`,
      metadata: { className: exam.className },
      userId: 'principal', userName: 'Principal', userRole: 'PRINCIPAL',
      oldValue: 'Result Ready', newValue: 'Result Declared',
    })
    return true
  },

  publishClass: (examId, classId) => {
    const key = `${examId}:${classId}`
    if (!get().declaredClassIds.includes(key)) return 0
    if (get().publishedClassIds.includes(key)) return 0 // idempotent
    set((state) => ({
      publishedClassIds: [...state.publishedClassIds, key],
    }))
    // Count students in this class for notification count.
    const classMarks = get().marks.filter((m) => m.examId === examId && m.classId === classId)
    const studentIds = new Set(classMarks.map((m) => m.studentId))
    const notifCount = studentIds.size
    const exam = getExamMeta(examId)
    useMockAuditStore.getState().recordEvent({
      examId,
      action: 'RESULT_PUBLISHED',
      summary: `${exam.className} results published`,
      entityType: 'class',
      entityId: `${examId}:${classId}`,
      metadata: { className: exam.className, notificationsSent: notifCount },
      userId: 'principal', userName: 'Principal', userRole: 'PRINCIPAL',
      oldValue: 'Result Declared', newValue: 'Result Published',
    })
    return notifCount
  },

  getPaperStatus: (examId, classId, subjectId) => {
    const marks = get().marks.filter((m) => m.examId === examId && m.classId === classId && m.subjectId === subjectId)
    if (marks.length === 0) return 'DRAFT'
    if (marks.every((m) => m.workflowStatus === 'LOCKED')) return 'LOCKED'
    if (marks.every((m) => ['VERIFIED', 'LOCKED'].includes(m.workflowStatus))) return 'VERIFIED'
    if (marks.every((m) => ['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(m.workflowStatus))) return 'SUBMITTED'
    if (marks.some((m) => m.marksObtained !== null)) return 'IN_PROGRESS'
    return 'DRAFT'
  },

  isClassReady: (examId, classId) => {
    const classMarks = get().marks.filter((m) => m.examId === examId && m.classId === classId)
    if (classMarks.length === 0) return false
    return classMarks.every((m) => m.workflowStatus === 'LOCKED')
  },

  allLocked: (examId) => {
    const examMarks = get().marks.filter((m) => m.examId === examId)
    if (examMarks.length === 0) return false
    return examMarks.every((m) => m.workflowStatus === 'LOCKED')
  },

  getPaperTimeline: (examId, classId, subjectId) => {
    return get().timeline.filter(
      (e) => e.examId === examId && e.classId === classId && e.subjectId === subjectId,
    ).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  },

  pushTimeline: (examId, classId, subjectId, action, byName, byRole, note) => {
    set((state) => ({
      timeline: [{ id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, examId, classId, subjectId, action, byName, byRole, at: new Date().toISOString(), note }, ...state.timeline],
    }))
  },
}))

// ─── Helpers (module-private) ─────────────────────────────────────────

/** Cache of exam metadata for audit summaries. Populated by initMarks. */
const examMetaCache = new Map<string, { className: string; subjectName: string }>()
let currentExamMeta: { id: string; classes: any[]; subjects: any[] } | null = null

/** Called from initMarks to seed the meta cache. */
export function _seedExamMeta(exam: ExamDTO) {
  currentExamMeta = exam
  examMetaCache.clear()
  for (const c of exam.classes) {
    for (const s of exam.subjects.filter((s: any) => s.classId === c.classId)) {
      examMetaCache.set(`${exam.id}:${c.classId}:${s.subjectId}`, { className: c.className, subjectName: s.subjectName })
    }
  }
}

function getExamMeta(examId: string): { className: string; subjectName: string } {
  if (currentExamMeta && currentExamMeta.id === examId) {
    const c = currentExamMeta.classes[0]
    const s = currentExamMeta.subjects.find((s: any) => s.classId === c?.classId)
    return { className: c?.className ?? '', subjectName: s?.subjectName ?? '' }
  }
  return { className: '', subjectName: '' }
}

function getSubjectName(examId: string, classId: string, subjectId: string): string {
  return examMetaCache.get(`${examId}:${classId}:${subjectId}`)?.subjectName ?? 'subject'
}

function pickTeacherForSubject(subjectName: string): string {
  const lower = subjectName.toLowerCase()
  if (lower.includes('math')) return 'Mr. Anil Sharma'
  if (lower.includes('english')) return 'Ms. Priya Nair'
  if (lower.includes('science') || lower.includes('physics')) return 'Dr. Lakshmi Iyer'
  if (lower.includes('chemistry')) return 'Mr. Venkat Naidu'
  if (lower.includes('biology')) return 'Mrs. Anjali Desai'
  if (lower.includes('social')) return 'Mr. Karthik Reddy'
  if (lower.includes('hindi')) return 'Mrs. Meera Joshi'
  if (lower.includes('commerce') || lower.includes('account')) return 'Mr. Sandeep Gupta'
  return 'Mr. Rajesh Kumar'
}
