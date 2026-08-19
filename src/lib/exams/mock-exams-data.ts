/**
 * Mock examinations data — Spec §2 / §3 / §20.
 *
 * In the current development/mock phase, Examination must render without
 * requiring a real DB session (which the production /api/exams route needs).
 * This module provides a small in-memory list of sample exams + a Zustand
 * store so that exams created via the Create Exam form persist for the
 * session (until page reload).
 *
 * The academic classes + subjects come from the SHARED mock academic
 * source (`@/lib/mock/academic`) — the same source Students & Classes uses.
 * There is NO duplicate subject/class catalogue here.
 *
 * Future phase: replace this with a real API client. The hook contract
 * in `use-exams-mock.ts` mirrors `use-exams.ts` so the swap is trivial.
 */

import { create } from 'zustand'
import type { ExamDTO, CreateExamInput, ExamClassDTO, ExamSubjectConfigDTO, ScheduleItemDTO } from './types'

// ─── Sample exams (seed) ────────────────────────────────────────────────
// These give the Examination list a non-empty default state so the UI
// doesn't show an empty list on first load. They reference mock class IDs
// from the shared academic module (e.g. 'C09' = Class 6, 'C14-PCM' = Class 11 PCM).

const NOW = new Date().toISOString()
const SEED_EXAMS: ExamDTO[] = [
  {
    id: 'exam-seed-1',
    schoolId: 'demo-school',
    name: 'Unit Test 2',
    type: 'UT2',
    session: '2025-2026',
    term: 'Term 1',
    status: 'Scheduled',
    resultStatus: 'Not Started',
    passPercentage: 33,
    startDate: '2025-10-10',
    endDate: '2025-10-10',
    declaredAt: null,
    declaredBy: null,
    createdBy: 'principal',
    createdAt: NOW,
    updatedAt: NOW,
    classes: [{ id: 'ec-1', examId: 'exam-seed-1', classId: 'C09', className: 'Class 6', gradeLevel: '6', section: null, stream: null, studentCount: 4 }],
    subjects: [],
    schedule: [],
    markSummary: { total: 0, entered: 0, locked: 0, submitted: 0, verified: 0, pct: 0 },
  },
  {
    id: 'exam-seed-2',
    schoolId: 'demo-school',
    name: 'Final Examination',
    type: 'ANNUAL',
    session: '2025-2026',
    term: 'Term 2',
    status: 'Scheduled',
    resultStatus: 'Not Started',
    passPercentage: 33,
    startDate: '2026-02-10',
    endDate: '2026-02-20',
    declaredAt: null,
    declaredBy: null,
    createdBy: 'principal',
    createdAt: NOW,
    updatedAt: NOW,
    classes: [{ id: 'ec-2', examId: 'exam-seed-2', classId: 'C13', className: 'Class 10', gradeLevel: '10', section: null, stream: null, studentCount: 4 }],
    subjects: [],
    schedule: [],
    markSummary: { total: 0, entered: 0, locked: 0, submitted: 0, verified: 0, pct: 0 },
  },
  {
    id: 'exam-seed-3',
    schoolId: 'demo-school',
    name: 'Mid-Term Examination',
    type: 'HALF_YEARLY',
    session: '2025-2026',
    term: 'Term 1',
    status: 'Completed',
    resultStatus: 'Result Declared',
    passPercentage: 33,
    startDate: '2025-09-15',
    endDate: '2025-09-25',
    declaredAt: '2025-09-26T10:00:00.000Z',
    declaredBy: 'principal',
    createdBy: 'principal',
    createdAt: NOW,
    updatedAt: NOW,
    classes: [{ id: 'ec-3', examId: 'exam-seed-3', classId: 'C12', className: 'Class 9', gradeLevel: '9', section: null, stream: null, studentCount: 4 }],
    subjects: [],
    schedule: [],
    markSummary: { total: 24, entered: 24, locked: 24, submitted: 24, verified: 24, pct: 100 },
  },
]

// ─── Mock exams store (in-memory, persists for the browser session) ─────

interface MockExamsState {
  exams: ExamDTO[]
  createExam: (input: CreateExamInput) => ExamDTO
  deleteExam: (id: string) => void
  getExam: (id: string) => ExamDTO | undefined
}

export const useMockExamsStore = create<MockExamsState>()((set, get) => ({
  exams: SEED_EXAMS.map((e) => ({ ...e })),
  createExam: (input) => {
    const id = `exam-mock-${Date.now()}`
    const now = new Date().toISOString()
    const classMeta = input.classMeta ?? {}
    const subjectMeta = input.subjectMeta ?? {}
    const classes: ExamClassDTO[] = input.classIds.map((classId, i) => {
      const meta = classMeta[classId]
      return {
        id: `ec-${id}-${i}`,
        examId: id,
        classId,
        className: meta?.className ?? classId,
        gradeLevel: meta?.gradeLevel ?? null,
        section: null,
        stream: meta?.stream ?? null,
        studentCount: meta?.studentCount ?? 0,
      }
    })
    const subjects: ExamSubjectConfigDTO[] = []
    let sortOrder = 0
    for (const [classId, subs] of Object.entries(input.subjectsByClass)) {
      for (const s of subs) {
        const sMeta = subjectMeta[s.subjectId]
        subjects.push({
          id: `sc-${classId}-${s.subjectId}`,
          examId: id,
          classId,
          subjectId: s.subjectId,
          subjectName: sMeta?.subjectName ?? s.subjectId,
          subjectCode: sMeta?.subjectCode ?? null,
          maxMarks: s.maxMarks ?? 100,
          passMarks: s.passMarks ?? 33,
          theoryMarks: s.theoryMarks ?? 100,
          practicalMarks: s.practicalMarks ?? 0,
          sortOrder: sortOrder++,
        })
      }
    }
    const schedule: ScheduleItemDTO[] = (input.schedule ?? []).map((s, i) => {
      const sMeta = subjectMeta[s.subjectId]
      const cMeta = classMeta[s.classId]
      return {
        id: `sch-${id}-${i}`,
        examId: id,
        classId: s.classId,
        className: cMeta?.className ?? s.classId,
        subjectId: s.subjectId,
        subjectName: sMeta?.subjectName ?? s.subjectId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room ?? null,
        invigilatorId: null,
        invigilatorName: s.invigilatorName ?? null,
      }
    })
    const exam: ExamDTO = {
      id,
      schoolId: 'demo-school',
      name: input.name,
      type: input.type,
      session: input.session ?? '2025-2026',
      term: null,
      status: 'Draft',
      resultStatus: 'Not Started',
      passPercentage: input.passPercentage ?? 33,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      declaredAt: null,
      declaredBy: null,
      createdBy: 'principal',
      createdAt: now,
      updatedAt: now,
      classes,
      subjects,
      schedule,
      markSummary: { total: 0, entered: 0, locked: 0, submitted: 0, verified: 0, pct: 0 },
    }
    set((state) => ({ exams: [exam, ...state.exams] }))
    return exam
  },
  deleteExam: (id) => set((state) => ({ exams: state.exams.filter((e) => e.id !== id) })),
  getExam: (id) => get().exams.find((e) => e.id === id),
}))

/** Academic year for the mock school. */
export const MOCK_ACADEMIC_YEAR = '2025-2026'
