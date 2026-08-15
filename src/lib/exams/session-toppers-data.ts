// ──────────────────────────────────────────────────────────────────────
// Session Top Performers — mock data per academic session.
//
// Conceptually, this data is DERIVED from published examination results
// aggregated across all declared exams in the session:
//   student session-percentage = sum(marksObtained across declared exams)
//                                / sum(maxMarks across declared exams) × 100
//
// For this UI implementation we use mock data (per the user's brief —
// "mock data is completely acceptable"). The shape mirrors what a real
// aggregation would produce, so swapping in a real API later is a
// drop-in replacement.
//
// Sessions supported:
//   2025-2026 — current session (rich mock data, 8 toppers)
//   2024-2025 — previous session (5 toppers)
//   any other — empty array (triggers the polished empty state)
// ──────────────────────────────────────────────────────────────────────

export interface SessionTopper {
  studentId: string
  name: string
  rollNo: string
  className: string
  section: string | null
  stream: string | null
  totalObtained: number
  totalMax: number
  percentage: number
  grade: string
  examsConsidered: number
  avatarColor: string // tailwind color token, used for the avatar circle
}

export interface SessionSummary {
  session: string
  studentCount: number
  examsConsidered: number
  toppers: SessionTopper[]
}

const TOPPERS_2025_2026: SessionTopper[] = [
  {
    studentId: 'stu-001',
    name: 'Aarav Sharma',
    rollNo: '10A-01',
    className: 'Grade 10 - A',
    section: 'A',
    stream: null,
    totalObtained: 482,
    totalMax: 500,
    percentage: 96.4,
    grade: 'A1',
    examsConsidered: 5,
    avatarColor: 'emerald',
  },
  {
    studentId: 'stu-002',
    name: 'Priya Verma',
    rollNo: '10A-02',
    className: 'Grade 10 - A',
    section: 'A',
    stream: null,
    totalObtained: 474,
    totalMax: 500,
    percentage: 94.8,
    grade: 'A1',
    examsConsidered: 5,
    avatarColor: 'sky',
  },
  {
    studentId: 'stu-003',
    name: 'Ishaan Gupta',
    rollNo: '10A-03',
    className: 'Grade 10 - A',
    section: 'A',
    stream: null,
    totalObtained: 469,
    totalMax: 500,
    percentage: 93.9,
    grade: 'A1',
    examsConsidered: 5,
    avatarColor: 'amber',
  },
  {
    studentId: 'stu-004',
    name: 'Ananya Reddy',
    rollNo: '9A-04',
    className: 'Grade 9 - A',
    section: 'A',
    stream: null,
    totalObtained: 461,
    totalMax: 500,
    percentage: 92.2,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'violet',
  },
  {
    studentId: 'stu-005',
    name: 'Vihaan Mehta',
    rollNo: '9A-05',
    className: 'Grade 9 - A',
    section: 'A',
    stream: null,
    totalObtained: 455,
    totalMax: 500,
    percentage: 91.0,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'rose',
  },
  {
    studentId: 'stu-006',
    name: 'Saanvi Iyer',
    rollNo: '10A-06',
    className: 'Grade 10 - A',
    section: 'A',
    stream: null,
    totalObtained: 448,
    totalMax: 500,
    percentage: 89.6,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'cyan',
  },
  {
    studentId: 'stu-007',
    name: 'Arjun Nair',
    rollNo: '9A-07',
    className: 'Grade 9 - A',
    section: 'A',
    stream: null,
    totalObtained: 442,
    totalMax: 500,
    percentage: 88.4,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'emerald',
  },
  {
    studentId: 'stu-008',
    name: 'Diya Patel',
    rollNo: '10A-08',
    className: 'Grade 10 - A',
    section: 'A',
    stream: null,
    totalObtained: 435,
    totalMax: 500,
    percentage: 87.0,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'sky',
  },
]

const TOPPERS_2024_2025: SessionTopper[] = [
  {
    studentId: 'stu-101',
    name: 'Rohan Khanna',
    rollNo: '9A-11',
    className: 'Grade 9 - A',
    section: 'A',
    stream: null,
    totalObtained: 458,
    totalMax: 500,
    percentage: 91.6,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'emerald',
  },
  {
    studentId: 'stu-102',
    name: 'Meera Joshi',
    rollNo: '10A-12',
    className: 'Grade 10 - A',
    section: 'A',
    stream: null,
    totalObtained: 451,
    totalMax: 500,
    percentage: 90.2,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'sky',
  },
  {
    studentId: 'stu-103',
    name: 'Kabir Singh',
    rollNo: '9A-13',
    className: 'Grade 9 - A',
    section: 'A',
    stream: null,
    totalObtained: 446,
    totalMax: 500,
    percentage: 89.2,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'amber',
  },
  {
    studentId: 'stu-104',
    name: 'Anika Rao',
    rollNo: '10A-14',
    className: 'Grade 10 - A',
    section: 'A',
    stream: null,
    totalObtained: 439,
    totalMax: 500,
    percentage: 87.8,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'violet',
  },
  {
    studentId: 'stu-105',
    name: 'Ved Agarwal',
    rollNo: '9A-15',
    className: 'Grade 9 - A',
    section: 'A',
    stream: null,
    totalObtained: 432,
    totalMax: 500,
    percentage: 86.4,
    grade: 'A2',
    examsConsidered: 5,
    avatarColor: 'rose',
  },
]

const SESSION_DATA: Record<string, SessionTopper[]> = {
  '2025-2026': TOPPERS_2025_2026,
  '2024-2025': TOPPERS_2024_2025,
}

export const AVAILABLE_SESSIONS = [
  { value: '2025-2026', label: '2025–26' },
  { value: '2024-2025', label: '2024–25' },
]

/**
 * Returns the mock published-results summary for a given academic session.
 * The `toppers` array is already sorted by percentage descending and
 * includes a `rank` derived from position (1-indexed).
 *
 * Returns null when the session has no published results at all — the
 * caller renders the polished empty state in that case.
 */
export function getSessionSummary(session: string): SessionSummary | null {
  const toppers = SESSION_DATA[session]
  if (!toppers || toppers.length === 0) return null
  return {
    session,
    studentCount: toppers.length,
    examsConsidered: toppers[0].examsConsidered,
    toppers,
  }
}

/**
 * Returns the rank for a topper at the given index. Toppers with the same
 * percentage share the same rank (standard competition ranking).
 */
export function rankForIndex(toppers: SessionTopper[], index: number): number {
  if (index === 0) return 1
  if (toppers[index].percentage === toppers[index - 1].percentage) {
    return rankForIndex(toppers, index - 1)
  }
  return index + 1
}
