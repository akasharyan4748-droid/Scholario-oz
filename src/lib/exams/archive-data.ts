// ──────────────────────────────────────────────────────────────────────
// Examination Archive — mock historical records for past academic sessions.
//
// The Archive is for HISTORICAL records only — past sessions, published
// results, student historical performance. It is conceptually distinct
// from the ACTIVE session switcher on the Overview (which drives the
// current dashboard context).
//
// For this UI foundation we use mock data. The shape mirrors what a real
// aggregation query would produce, so a future backend swap is a drop-in.
//
// Each archived session contains a list of examinations that were
// conducted in that session, with their published results summary.
// ──────────────────────────────────────────────────────────────────────

export interface ArchivedExam {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string | null
  classes: Array<{ className: string; studentCount: number }>
  totalStudents: number
  totalSubjects: number
  totalPapers: number
  averagePercentage: number
  passRate: number
  topperName: string
  topperPercentage: number
  status: 'Published'
  publishedAt: string
}

export interface ArchivedSession {
  session: string // "2024-2025"
  label: string // "2024–25"
  examCount: number
  totalStudents: number
  averagePercentage: number
  topperName: string
  topperPercentage: number
  exams: ArchivedExam[]
}

// ─── Mock historical examination records ─────────────────────────────

const ARCHIVED_2024_2025: ArchivedExam[] = [
  {
    id: 'arc-2425-1',
    name: 'Annual Examination 2024-25',
    type: 'Annual Examination',
    startDate: '2025-02-10',
    endDate: '2025-02-20',
    classes: [
      { className: 'Grade 9 - A', studentCount: 11 },
      { className: 'Grade 10 - A', studentCount: 8 },
    ],
    totalStudents: 19,
    totalSubjects: 6,
    totalPapers: 18,
    averagePercentage: 78.4,
    passRate: 89.5,
    topperName: 'Rohan Khanna',
    topperPercentage: 96.2,
    status: 'Published',
    publishedAt: '2025-03-05T10:00:00.000Z',
  },
  {
    id: 'arc-2425-2',
    name: 'Half-Yearly 2024-25',
    type: 'Half-Yearly',
    startDate: '2024-09-15',
    endDate: '2024-09-25',
    classes: [
      { className: 'Grade 9 - A', studentCount: 11 },
      { className: 'Grade 10 - A', studentCount: 8 },
    ],
    totalStudents: 19,
    totalSubjects: 6,
    totalPapers: 12,
    averagePercentage: 72.1,
    passRate: 84.2,
    topperName: 'Meera Joshi',
    topperPercentage: 94.5,
    status: 'Published',
    publishedAt: '2024-10-10T14:00:00.000Z',
  },
  {
    id: 'arc-2425-3',
    name: 'Unit Test 3',
    type: 'Unit Test',
    startDate: '2024-11-20',
    endDate: '2024-11-22',
    classes: [{ className: 'Grade 10 - A', studentCount: 8 }],
    totalStudents: 8,
    totalSubjects: 5,
    totalPapers: 5,
    averagePercentage: 81.6,
    passRate: 100,
    topperName: 'Kabir Singh',
    topperPercentage: 92.8,
    status: 'Published',
    publishedAt: '2024-12-01T09:00:00.000Z',
  },
]

const ARCHIVED_2023_2024: ArchivedExam[] = [
  {
    id: 'arc-2324-1',
    name: 'Annual Examination 2023-24',
    type: 'Annual Examination',
    startDate: '2024-02-12',
    endDate: '2024-02-22',
    classes: [
      { className: 'Grade 8 - A', studentCount: 14 },
      { className: 'Grade 9 - A', studentCount: 12 },
    ],
    totalStudents: 26,
    totalSubjects: 7,
    totalPapers: 28,
    averagePercentage: 75.8,
    passRate: 88.5,
    topperName: 'Aditya Kapoor',
    topperPercentage: 95.4,
    status: 'Published',
    publishedAt: '2024-03-08T11:00:00.000Z',
  },
  {
    id: 'arc-2324-2',
    name: 'Half-Yearly 2023-24',
    type: 'Half-Yearly',
    startDate: '2023-09-18',
    endDate: '2023-09-28',
    classes: [
      { className: 'Grade 8 - A', studentCount: 14 },
      { className: 'Grade 9 - A', studentCount: 12 },
    ],
    totalStudents: 26,
    totalSubjects: 7,
    totalPapers: 21,
    averagePercentage: 70.3,
    passRate: 82.7,
    topperName: 'Sara Khan',
    topperPercentage: 93.1,
    status: 'Published',
    publishedAt: '2023-10-12T13:00:00.000Z',
  },
]

const ARCHIVED_2022_2023: ArchivedExam[] = [
  {
    id: 'arc-2223-1',
    name: 'Annual Examination 2022-23',
    type: 'Annual Examination',
    startDate: '2023-02-14',
    endDate: '2023-02-24',
    classes: [{ className: 'Grade 7 - A', studentCount: 16 }],
    totalStudents: 16,
    totalSubjects: 6,
    totalPapers: 12,
    averagePercentage: 73.2,
    passRate: 87.5,
    topperName: 'Vivaan Mehta',
    topperPercentage: 94.0,
    status: 'Published',
    publishedAt: '2023-03-10T10:00:00.000Z',
  },
]

// ─── Session aggregates ──────────────────────────────────────────────

const ARCHIVED_SESSIONS: ArchivedSession[] = [
  {
    session: '2024-2025',
    label: '2024–25',
    examCount: ARCHIVED_2024_2025.length,
    totalStudents: 19,
    averagePercentage: 77.4,
    topperName: 'Rohan Khanna',
    topperPercentage: 96.2,
    exams: ARCHIVED_2024_2025,
  },
  {
    session: '2023-2024',
    label: '2023–24',
    examCount: ARCHIVED_2023_2024.length,
    totalStudents: 26,
    averagePercentage: 73.1,
    topperName: 'Aditya Kapoor',
    topperPercentage: 95.4,
    exams: ARCHIVED_2023_2024,
  },
  {
    session: '2022-2023',
    label: '2022–23',
    examCount: ARCHIVED_2022_2023.length,
    totalStudents: 16,
    averagePercentage: 73.2,
    topperName: 'Vivaan Mehta',
    topperPercentage: 94.0,
    exams: ARCHIVED_2022_2023,
  },
]

export function getArchivedSessions(): ArchivedSession[] {
  return ARCHIVED_SESSIONS
}

export function getArchivedSession(session: string): ArchivedSession | null {
  return ARCHIVED_SESSIONS.find((s) => s.session === session) ?? null
}

/**
 * Search archived examination records across all sessions.
 * Supports filtering by student name (matches topperName as a proxy for
 * "did this student appear in any archived exam"), class name, session,
 * and examination type/name.
 */
export interface ArchiveSearchFilters {
  query?: string // student name, ID, exam name, class
  session?: string // specific archived session, or 'all'
  className?: string // 'all' or specific class
}

export interface ArchiveSearchResult {
  session: string
  sessionLabel: string
  exam: ArchivedExam
  topperName: string
  topperPercentage: number
  matchedStudentName?: string
}

export function searchArchive(filters: ArchiveSearchFilters): ArchiveSearchResult[] {
  const q = filters.query?.trim().toLowerCase() ?? ''
  const results: ArchiveSearchResult[] = []

  for (const sess of ARCHIVED_SESSIONS) {
    if (filters.session && filters.session !== 'all' && sess.session !== filters.session) continue

    for (const exam of sess.exams) {
      // Class filter
      if (filters.className && filters.className !== 'all') {
        const hasClass = exam.classes.some((c) => c.className === filters.className)
        if (!hasClass) continue
      }

      // Query filter — match exam name, type, class, or topper name
      let matchedStudentName: string | undefined
      if (q) {
        const hay = [
          exam.name.toLowerCase(),
          exam.type.toLowerCase(),
          exam.classes.map((c) => c.className.toLowerCase()).join(' '),
          exam.topperName.toLowerCase(),
        ].join(' ')
        if (!hay.includes(q)) continue
        // Track which student matched (best-effort: topperName for now)
        if (exam.topperName.toLowerCase().includes(q)) {
          matchedStudentName = exam.topperName
        }
      }

      results.push({
        session: sess.session,
        sessionLabel: sess.label,
        exam,
        topperName: exam.topperName,
        topperPercentage: exam.topperPercentage,
        matchedStudentName,
      })
    }
  }

  return results
}

/** Returns the set of distinct class names that appear across all archived sessions. */
export function getArchivedClassNames(): string[] {
  const names = new Set<string>()
  for (const sess of ARCHIVED_SESSIONS) {
    for (const exam of sess.exams) {
      for (const c of exam.classes) names.add(c.className)
    }
  }
  return Array.from(names).sort()
}
