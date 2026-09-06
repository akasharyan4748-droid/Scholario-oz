'use client'

// ============================================================
// CLASS RESPONSIBILITY STORE — the captain/monitor workspace data
// ------------------------------------------------------------
// Spec §22–§24: every WRITE goes through an authorization check that
// validates the acting student holds an ACTIVE position in the target
// class/section AND the capability the action needs. The check happens
// INSIDE the store action (the same enforcement layer the rest of this
// codebase uses for role-gated writes) — the UI never relies on merely
// hiding buttons. Reads are unrestricted within the tenant; writes are
// capability-scoped.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'
import { useStudentsStore, type StudentPosition } from '@/lib/store/students-store'
import { hasCapability, POSITION_DEFS, type StudentCapability } from '@/lib/student-positions'

// ─── Entities ────────────────────────────────────────────────────────

export type ClassUpdateCategory = 'notice' | 'event' | 'reminder' | 'activity'

export interface ClassUpdate {
  id: string
  classId: string
  section: string
  studentId: string
  authorName: string
  positionTitle: string
  title: string
  body: string
  category: ClassUpdateCategory
  postedOn: string
  /** Teacher/principal review state — 'pending-review' until approved. */
  status: 'pending-review' | 'approved' | 'removed'
  reviewedByName?: string
  reviewedOn?: string
}

export type IssueCategory = 'facility' | 'bullying' | 'academics' | 'safety' | 'other'
export type IssuePriority = 'low' | 'medium' | 'high'

export interface IssueReport {
  id: string
  classId: string
  section: string
  studentId: string
  reporterName: string
  category: IssueCategory
  title: string
  description: string
  priority: IssuePriority
  reportedOn: string
  status: 'open' | 'acknowledged' | 'resolved'
  acknowledgedByName?: string
  resolutionNote?: string
  resolvedOn?: string
}

export interface ResponsibilityTask {
  id: string
  classId: string
  section: string
  studentId: string
  studentName: string
  title: string
  detail: string
  assignedByName: string
  assignedOn: string
  dueOn?: string
  done: boolean
  doneOn?: string
}

export interface TeacherRequest {
  id: string
  classId: string
  section: string
  studentId: string
  studentName: string
  teacherId: string
  teacherName: string
  topic: string
  preferredSlot: string
  requestedOn: string
  status: 'requested' | 'acknowledged' | 'completed'
  acknowledgedByName?: string
}

// ─── Store contract ──────────────────────────────────────────────────

interface ClassResponsibilityState {
  classUpdates: ClassUpdate[]
  issueReports: IssueReport[]
  responsibilityTasks: ResponsibilityTask[]
  teacherRequests: TeacherRequest[]
  // Student-side writes (authorization-checked).
  postClassUpdate: (input: {
    actorStudentId: string
    title: string
    body: string
    category: ClassUpdateCategory
  }) => { ok: true; record: ClassUpdate } | { ok: false; error: string }
  reportIssue: (input: {
    actorStudentId: string
    category: IssueCategory
    title: string
    description: string
    priority: IssuePriority
  }) => { ok: true; record: IssueReport } | { ok: false; error: string }
  requestTeacherMeeting: (input: {
    actorStudentId: string
    teacherId: string
    teacherName: string
    topic: string
    preferredSlot: string
  }) => { ok: true; record: TeacherRequest } | { ok: false; error: string }
  completeTask: (taskId: string, actorStudentId: string) => { ok: true } | { ok: false; error: string }
  // Staff-side actions (principal review surface).
  reviewClassUpdate: (id: string, decision: 'approved' | 'removed', byName: string) => void
  resolveIssue: (id: string, status: 'acknowledged' | 'resolved', byName: string, note?: string) => void
  addResponsibilityTask: (input: {
    studentId: string
    studentName: string
    classId: string
    section: string
    title: string
    detail: string
    assignedByName: string
    dueOn?: string
  }) => { ok: true; record: ResponsibilityTask } | { ok: false; error: string }
  acknowledgeTeacherRequest: (id: string, byName: string) => void
  resetDemoData: () => void
}

// ─── Authorization helper (single enforcement point) ────────────────

function authorize(
  actorStudentId: string,
  capability: StudentCapability,
  target?: { classId: string; section: string },
): { ok: true; positions: StudentPosition[] } | { ok: false; error: string } {
  const positions = useStudentsStore
    .getState()
    .studentPositions.filter((p) => p.active && p.studentId === actorStudentId)
  if (positions.length === 0) {
    return { ok: false, error: 'You do not hold an active class responsibility.' }
  }
  if (!hasCapability(positions, capability)) {
    return { ok: false, error: 'Your class responsibility does not permit this action.' }
  }
  if (target) {
    const scoped = positions.some((p) => p.classId === target.classId && p.section === target.section)
    if (!scoped) {
      return { ok: false, error: 'Your responsibility is scoped to your own class section only.' }
    }
  }
  return { ok: true, positions }
}

const now = () => new Date().toISOString()

export const useClassResponsibilityStore = create<ClassResponsibilityState>()(
  persist(
    (set, get) => ({
      classUpdates: [],
      issueReports: [],
      responsibilityTasks: [],
      teacherRequests: [],

      postClassUpdate: ({ actorStudentId, title, body, category }) => {
        const student = useStudentsStore.getState().students.find((s) => s.id === actorStudentId)
        if (!student) return { ok: false, error: 'Student not found.' }
        const auth = authorize(actorStudentId, 'post-class-updates', {
          classId: student.classId,
          section: student.section,
        })
        if (!auth.ok) return auth
        const positionTitle = POSITION_TITLE(auth.positions)
        const record: ClassUpdate = {
          id: `CU-${Date.now().toString(36)}`,
          classId: student.classId,
          section: student.section,
          studentId: student.id,
          authorName: student.name,
          positionTitle,
          title,
          body,
          category,
          postedOn: now(),
          status: 'pending-review',
        }
        set((s) => ({ classUpdates: [record, ...s.classUpdates] }))
        return { ok: true, record }
      },

      reportIssue: ({ actorStudentId, category, title, description, priority }) => {
        const student = useStudentsStore.getState().students.find((s) => s.id === actorStudentId)
        if (!student) return { ok: false, error: 'Student not found.' }
        const auth = authorize(actorStudentId, 'report-issues', {
          classId: student.classId,
          section: student.section,
        })
        if (!auth.ok) return auth
        const record: IssueReport = {
          id: `IR-${Date.now().toString(36)}`,
          classId: student.classId,
          section: student.section,
          studentId: student.id,
          reporterName: student.name,
          category,
          title,
          description,
          priority,
          reportedOn: now(),
          status: 'open',
        }
        set((s) => ({ issueReports: [record, ...s.issueReports] }))
        return { ok: true, record }
      },

      requestTeacherMeeting: ({ actorStudentId, teacherId, teacherName, topic, preferredSlot }) => {
        const student = useStudentsStore.getState().students.find((s) => s.id === actorStudentId)
        if (!student) return { ok: false, error: 'Student not found.' }
        const auth = authorize(actorStudentId, 'request-teacher', {
          classId: student.classId,
          section: student.section,
        })
        if (!auth.ok) return auth
        const record: TeacherRequest = {
          id: `TR-${Date.now().toString(36)}`,
          classId: student.classId,
          section: student.section,
          studentId: student.id,
          studentName: student.name,
          teacherId,
          teacherName,
          topic,
          preferredSlot,
          requestedOn: now(),
          status: 'requested',
        }
        set((s) => ({ teacherRequests: [record, ...s.teacherRequests] }))
        return { ok: true, record }
      },

      completeTask: (taskId, actorStudentId) => {
        const task = get().responsibilityTasks.find((t) => t.id === taskId)
        if (!task) return { ok: false, error: 'Task not found.' }
        if (task.studentId !== actorStudentId) return { ok: false, error: 'This task is not assigned to you.' }
        const auth = authorize(actorStudentId, 'view-class-tasks', {
          classId: task.classId,
          section: task.section,
        })
        if (!auth.ok) return auth
        set((s) => ({
          responsibilityTasks: s.responsibilityTasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done, doneOn: t.done ? undefined : now() } : t,
          ),
        }))
        return { ok: true }
      },

      reviewClassUpdate: (id, decision, byName) => {
        set((s) => ({
          classUpdates: s.classUpdates.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: decision,
                  reviewedByName: byName,
                  reviewedOn: now(),
                }
              : u,
          ),
        }))
      },

      resolveIssue: (id, status, byName, note) => {
        set((s) => ({
          issueReports: s.issueReports.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status,
                  acknowledgedByName: byName,
                  ...(status === 'resolved' ? { resolutionNote: note, resolvedOn: now() } : {}),
                }
              : i,
          ),
        }))
      },

      addResponsibilityTask: ({ studentId, studentName, classId, section, title, detail, assignedByName, dueOn }) => {
        const student = useStudentsStore.getState().students.find((s) => s.id === studentId)
        if (!student) return { ok: false, error: 'Student not found.' }
        const holdsPosition = useStudentsStore
          .getState()
          .studentPositions.some((p) => p.active && p.studentId === studentId)
        if (!holdsPosition) {
          return { ok: false, error: 'This student does not hold an active class responsibility.' }
        }
        const record: ResponsibilityTask = {
          id: `RT-${Date.now().toString(36)}`,
          classId,
          section,
          studentId,
          studentName,
          title,
          detail,
          assignedByName,
          assignedOn: now(),
          dueOn,
          done: false,
        }
        set((s) => ({ responsibilityTasks: [record, ...s.responsibilityTasks] }))
        return { ok: true, record }
      },

      acknowledgeTeacherRequest: (id, byName) => {
        set((s) => ({
          teacherRequests: s.teacherRequests.map((r) =>
            r.id === id ? { ...r, status: 'acknowledged', acknowledgedByName: byName } : r,
          ),
        }))
      },

      resetDemoData: () => {
        set({ classUpdates: [], issueReports: [], responsibilityTasks: [], teacherRequests: [] })
      },
    }),
    {
      name: 'scholario-class-responsibility-v1',
      storage: createTenantScopedStorage('scholario-class-responsibility-v1'),
      version: 1,
      partialize: (s) => ({
        classUpdates: s.classUpdates,
        issueReports: s.issueReports,
        responsibilityTasks: s.responsibilityTasks,
        teacherRequests: s.teacherRequests,
      }),
    },
  ),
)

/** Display title for a holder's active positions (e.g. "Class Captain"). */
function POSITION_TITLE(positions: StudentPosition[]): string {
  return positions.map((p) => POSITION_DEFS[p.key]?.title ?? p.key).join(' · ')
}
