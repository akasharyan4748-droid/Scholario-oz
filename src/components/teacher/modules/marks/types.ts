/**
 * marks/types — the client-side DTO contract for the Marks Entry module.
 *
 * Every shape mirrors EXACTLY what the four server routes return (see
 * src/app/api/teacher/marks-entry/*, built in TWC-2 and curl-verified):
 * no mock arrays, no client-side derivations of server concepts. Pure
 * types only — safe to import from any client component.
 */

/** One subject the teacher can enter marks for, inside one exam × class. */
export interface SubjectOption {
  id: string
  name: string
  maxMarks: number
  passMarks: number
}

/** One class of one exam, restricted to the subjects this teacher teaches. */
export interface ExamClassOption {
  classId: string
  label: string
  subjects: SubjectOption[]
}

/** An exam the teacher can enter marks for (GET /api/teacher/marks-entry). */
export interface MarksExam {
  id: string
  name: string
  type: string
  status: string
  resultStatus: string
  dateLabel: string
  classes: ExamClassOption[]
}

export interface MarksExamsPayload {
  exams: MarksExam[]
}

/** One roster row (GET /api/teacher/marks-entry/grid). */
export interface GridStudent {
  id: string
  rollNo: string
  name: string
  marks: number | null
  remarks: string | null
  workflowStatus: 'DRAFT' | 'SUBMITTED' | null
  grade: string | null
  passed: boolean | null
}

/** The full marks grid for one exam × class × subject. */
export interface MarksGrid {
  exam: { id: string; name: string; type: string; resultStatus: string }
  classId: string
  label: string
  subjectName: string
  maxMarks: number
  passMarks: number
  students: GridStudent[]
  /** True when every existing row is already SUBMITTED. */
  submitted: boolean
}

/** exam × class × subject coordinate — identifies exactly one grid. */
export interface GridSelection {
  examId: string
  classId: string
  subjectId: string
}

/** POST /api/teacher/marks-entry/save entry (null marks = cleared/not entered). */
export interface SaveEntry {
  studentId: string
  marks: number | null
}

export interface SaveResult {
  saved: number
  locked: number
}

export interface SubmitResult {
  submitted: number
}
