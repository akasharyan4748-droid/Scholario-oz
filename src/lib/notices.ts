import { db } from '@/lib/db'

// ============================================================
// LR-1 — Audience scoping for school announcements (shared lib)
// ------------------------------------------------------------
// One source of truth for "which announcements is THIS viewer allowed
// to see", used by BOTH the bell feed (/api/notifications-feed) and
// the student Notices module (/api/student/notices). Audience tags are
// free-form (`ALL`, `STUDENTS`, `CLASS:<class name>`, …) so matching
// stays defensive and case-insensitive.
// ============================================================

/** Which announcement audiences each viewer role is allowed to see. */
const AUDIENCE_BY_ROLE: Record<string, string[]> = {
  PRINCIPAL: ['ALL', 'TEACHERS', 'STAFF', 'STUDENTS', 'PRINCIPAL', 'ADMIN'],
  TEACHER: ['ALL', 'TEACHERS', 'STAFF'],
  STUDENT: ['ALL', 'STUDENTS'],
  PARENT: ['ALL', 'PARENTS', 'GUARDIANS'],
}

function baseAudienceAllows(audience: string, role: string): boolean {
  const allowed = AUDIENCE_BY_ROLE[role] ?? ['ALL']
  return allowed.includes(audience.toUpperCase())
}

/**
 * `CLASS:<class name>` notices target a specific class roster. Staff roles
 * (principal/teacher) always see them for oversight; students only when the
 * class matches their own (exact name, shared grade base, or prefix match).
 */
export async function audienceAllows(
  audience: string | null | undefined,
  user: { id: string; role: string; schoolId: string | null },
): Promise<boolean> {
  if (!audience) return true
  const aud = audience.trim()
  if (!aud.toUpperCase().startsWith('CLASS:')) return baseAudienceAllows(aud, user.role)

  // Staff oversight — principals & teachers see every class notice
  if (user.role === 'PRINCIPAL' || user.role === 'TEACHER' || user.role === 'SUPER_ADMIN') return true
  if (user.role !== 'STUDENT') return false

  const student = await db.student.findUnique({
    where: { userId: user.id },
    include: { class: { select: { name: true } } },
  })
  if (!student?.class?.name) return false
  const target = aud.slice(6).trim().toUpperCase()
  const mine = student.class.name.trim().toUpperCase()
  if (!target || !mine) return false
  if (target === mine) return true
  // "Grade 10" (grade-wide) should reach students of "Grade 10 - A"
  const baseOf = (s: string) => s.replace(/[-–]\s*[A-Z]\s*$/, '').trim()
  if (baseOf(mine) === baseOf(target) || mine.startsWith(target) || target.startsWith(mine)) return true
  // Cross-vocabulary grade match: the ERP layer names cohorts "Class 9" while
  // school rosters use "Grade 9 - A". Both denote the same numeric grade, so
  // compare the leading grade number before giving up (a class-wide audience
  // reaches every section of that grade).
  const gradeOf = (s: string) => s.match(/\d+/)?.[0] ?? null
  const targetGrade = gradeOf(target)
  const mineGrade = gradeOf(mine)
  return !!targetGrade && !!mineGrade && targetGrade === mineGrade
}

/** Human label for an audience tag — powers the small context chip. */
export function audienceLabel(audience: string | null | undefined): string {
  if (!audience) return 'School'
  const aud = audience.trim()
  const upper = aud.toUpperCase()
  if (upper === 'ALL') return 'Whole school'
  if (upper === 'STUDENTS') return 'Students'
  if (upper === 'TEACHERS') return 'Teachers'
  if (upper === 'STAFF') return 'Staff'
  if (upper === 'PARENTS' || upper === 'GUARDIANS') return 'Parents'
  if (upper.startsWith('CLASS:')) return aud.slice(6).trim() || 'Class'
  return aud
}
