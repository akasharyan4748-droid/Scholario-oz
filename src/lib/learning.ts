// ============================================================
// LEARNING (L2D) — server-side helpers shared by the
// /api/student/learning|flashcards|study-tasks|study-groups routes.
// ------------------------------------------------------------
// Security model (spec §58/§59 — never trust the client):
//   · The STUDENT is resolved from the SESSION user, never the body.
//   · Every query is school-scoped (schoolId from the session).
//   · Resource authorization = student identity + school + class label
//     + specific-student targeting + publication state — recomputed
//     server-side for every request.
// ============================================================

import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/auth'
import { schoolScoped } from '@/lib/api'
import type { StudyMaterial, Prisma } from '@prisma/client'

/** Session-resolved student context — the ONLY identity these APIs trust. */
export interface StudentContext {
  schoolId: string
  studentId: string
  /** Class label (Class.name, e.g. "Grade 9 - A") — null if unassigned. */
  classLabel: string | null
  /** The student's Class.id (null when no class is assigned). */
  classId: string | null
}

/** Resolve the caller's Student row from the session user (RLS-safe). */
export async function requireStudent(user: AuthUser): Promise<StudentContext> {
  const schoolId = schoolScoped(user)
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { student: { include: { class: { select: { id: true, name: true } } } } },
  })
  const student = dbUser?.student
  if (!student) throw new Error('NO_STUDENT_RECORD')
  // The session user must belong to the same school as its student row —
  // a mismatched pair is treated as "no student record" (never trusted).
  if (student.schoolId !== schoolId) throw new Error('NO_STUDENT_RECORD')
  return {
    schoolId,
    studentId: student.id,
    classLabel: student.class?.name ?? null,
    classId: student.class?.id ?? null,
  }
}

/**
 * Authorization predicate for ONE material row (spec §31/§33/§58):
 *   published  AND  (whole-school  OR  my class label  OR  targeted to me)
 */
export function materialVisibleToStudent(
  m: Pick<StudyMaterial, 'id' | 'status' | 'className' | 'schoolId'>,
  ctx: StudentContext,
  targetedMaterialIds: Set<string>,
): boolean {
  if (m.schoolId !== ctx.schoolId) return false
  if (m.status !== 'published') return false
  if (m.className == null || m.className === '') return true // whole school
  if (ctx.classLabel && m.className === ctx.classLabel) return true
  return targetedMaterialIds.has(m.id)
}

/** The set of material ids specifically targeted at this student. */
export async function targetedMaterialIds(studentId: string): Promise<Set<string>> {
  const rows = await db.studyMaterialTarget.findMany({
    where: { studentId },
    select: { studyMaterialId: true },
  })
  return new Set(rows.map((r) => r.studyMaterialId))
}

/**
 * Load the authorized materials for a student (school + publication +
 * class/target scoping), newest published first. Optionally filtered by
 * subject and/or an extra Prisma where fragment (e.g. search OR clauses).
 * Caller shapes the payload — this returns rows only.
 */
export async function authorizedMaterials(
  ctx: StudentContext,
  opts: { subjectId?: string; filter?: Prisma.StudyMaterialWhereInput } = {},
): Promise<StudyMaterial[]> {
  const targeted = await targetedMaterialIds(ctx.studentId)
  const rows = await db.studyMaterial.findMany({
    where: {
      schoolId: ctx.schoolId,
      status: 'published',
      ...(opts.subjectId ? { subjectId: opts.subjectId } : {}),
      ...(opts.filter ?? {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  })
  return rows.filter((m) => materialVisibleToStudent(m, ctx, targeted))
}

/** Resolve subject display names for a set of subject ids (one query). */
export async function subjectNamesById(
  schoolId: string,
  subjectIds: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const ids = [...new Set(subjectIds.filter((v): v is string => !!v))]
  if (ids.length === 0) return new Map()
  const subjects = await db.subject.findMany({
    where: { schoolId, id: { in: ids } },
    select: { id: true, name: true },
  })
  return new Map(subjects.map((s) => [s.id, s.name]))
}

/**
 * The student's real subjects (Active, their class + whole-school), with
 * the optional material count when `authorized` is provided. Shared by
 * the overview aggregate and the planner's subject picker.
 */
export async function mySubjects(
  ctx: StudentContext,
  authorized: StudyMaterial[] = [],
): Promise<Array<{ id: string; name: string; count: number }>> {
  const rows = ctx.classId
    ? await db.subject.findMany({
        where: {
          schoolId: ctx.schoolId,
          status: 'Active',
          OR: [{ classId: null }, { classId: ctx.classId }],
        },
        orderBy: { name: 'asc' },
      })
    : await db.subject.findMany({
        where: { schoolId: ctx.schoolId, status: 'Active' },
        orderBy: { name: 'asc' },
      })
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    count: authorized.filter((m) => m.subjectId === s.id).length,
  }))
}

// ─── SM-2-lite spaced repetition (spec §22 — REAL state, server-computed) ──

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export const REVIEW_GRADES: readonly ReviewGrade[] = ['again', 'hard', 'good', 'easy']

export interface ReviewStateSnapshot {
  ease: number
  intervalDays: number
  dueAt: Date
  reps: number
  lapses: number
}

/**
 * SM-2-lite transition — applied on the SERVER only. Classic SM-2 factors
 * (ease, interval growth) with a simplified ladder tuned for young learners:
 *   again → lapse: ease −0.20 (floor 1.3), interval resets to 0 (due ~now)
 *   hard  → ease −0.15 (floor 1.3), interval 0→1 else ×1.2 (min 1)
 *   good  → interval 0→1, 1→3, else × ease
 *   easy  → ease +0.15 (cap 3.0), interval 0→3 else × ease × 1.3
 */
export function applyReviewGrade(
  prev: Pick<ReviewStateSnapshot, 'ease' | 'intervalDays' | 'reps' | 'lapses'>,
  grade: ReviewGrade,
  now: Date = new Date(),
): ReviewStateSnapshot {
  let { ease, intervalDays } = prev
  let { reps, lapses } = prev
  reps += 1

  switch (grade) {
    case 'again':
      ease = Math.max(1.3, ease - 0.2)
      intervalDays = 0
      lapses += 1
      break
    case 'hard':
      ease = Math.max(1.3, ease - 0.15)
      intervalDays = intervalDays === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2))
      break
    case 'good':
      intervalDays =
        intervalDays === 0 ? 1 : intervalDays < 3 ? 3 : Math.round(intervalDays * ease)
      break
    case 'easy':
      ease = Math.min(3.0, ease + 0.15)
      intervalDays =
        intervalDays === 0 ? 3 : Math.max(3, Math.round(intervalDays * ease * 1.3))
      break
  }

  // A lapsed card comes back quickly (10 minutes), everything else waits
  // its full interval.
  const dueAt =
    intervalDays === 0
      ? new Date(now.getTime() + 10 * 60 * 1000)
      : new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)

  // Keep numbers stable/clean.
  ease = Math.round(ease * 100) / 100

  return { ease, intervalDays, dueAt, reps, lapses }
}

// ─── Shared payload shapes (client mirrors these) ────────────────────

export interface LearningMaterialCard {
  id: string
  title: string
  description: string | null
  subjectId: string | null
  subjectName: string | null
  className: string | null
  category: string
  originalName: string
  sizeBytes: number
  mimeType: string
  createdAt: string
  publishedAt: string | null
  /** Real per-student state (never fabricated). */
  opened: boolean
  completed: boolean
  bookmarked: boolean
  lastOpenedAt: string | null
}
