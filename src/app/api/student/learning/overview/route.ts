import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireStudent,
  materialVisibleToStudent,
  targetedMaterialIds,
  subjectNamesById,
  mySubjects,
  type LearningMaterialCard,
} from '@/lib/learning'
import { toStudyMaterialMeta } from '@/lib/study-materials'
import type { StudyMaterial } from '@prisma/client'

export const runtime = 'nodejs'

/// GET /api/student/learning/overview
///
/// The ONE aggregate behind the Learning home tab. Everything is derived
/// from REAL rows, session-scoped (student + school resolved from the
/// erp_session cookie — client ids are never trusted):
///
///   continueLearning   latest opened, not-yet-completed authorized material
///   forYou             newest published+authorized materials not completed
///                      (deterministic — no fake recommendations, spec §18)
///   subjects           the student's real class subjects + material counts
///   recent             last 5 opened authorized materials
///   saved              bookmarked authorized materials
///   counts             dueFlashcards · activeTasks · completedResources
///
/// Optional: ?subjectId=<id> — when present, `forYou` instead carries the
/// FULL authorized material list for that subject (cap 24, same card
/// shape) for the subject drill-down view.
///
/// Permission-aware by construction: only `published` materials that are
/// whole-school, targeted at the student's class label, or explicitly
/// targeted at the student ever appear (spec §31/§33/§58).
export async function GET(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const subjectFilter = req.nextUrl.searchParams.get('subjectId')?.trim() || undefined

      // ── Authorized materials (published + visible to THIS student) ──
      const targeted = await targetedMaterialIds(ctx.studentId)
      const materials = await db.studyMaterial.findMany({
        where: {
          schoolId: ctx.schoolId,
          status: 'published',
          ...(subjectFilter ? { subjectId: subjectFilter } : {}),
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      })
      const authorized = materials.filter((m) => materialVisibleToStudent(m, ctx, targeted))

      const nameById = await subjectNamesById(
        ctx.schoolId,
        authorized.map((m) => m.subjectId),
      )

      // ── The student's real activity + bookmarks ──────────────────────
      const [activities, bookmarks] = await Promise.all([
        db.learningActivity.findMany({
          where: { studentId: ctx.studentId, schoolId: ctx.schoolId },
          orderBy: { lastOpenedAt: 'desc' },
          include: { studyMaterial: true },
        }),
        db.learningBookmark.findMany({
          where: { studentId: ctx.studentId, schoolId: ctx.schoolId },
          orderBy: { createdAt: 'desc' },
          include: { studyMaterial: true },
        }),
      ])

      const completedIds = new Set(
        activities.filter((a) => a.completedAt != null).map((a) => a.studyMaterialId),
      )
      const bookmarkedIds = new Set(bookmarks.map((b) => b.studyMaterialId))
      const activityByMaterial = new Map(activities.map((a) => [a.studyMaterialId, a]))

      // Activities/bookmarks may reference materials that have since been
      // unpublished or re-targeted — they drop out of every section here.
      const stillAuthorized = (m: StudyMaterial | null): m is StudyMaterial =>
        !!m && materialVisibleToStudent(m, ctx, targeted)

      const toCard = (m: StudyMaterial): LearningMaterialCard => {
        const meta = toStudyMaterialMeta(m, m.subjectId ? nameById.get(m.subjectId) ?? null : null)
        const activity = activityByMaterial.get(m.id)
        return {
          ...meta,
          createdAt: meta.createdAt.toISOString(),
          publishedAt: meta.publishedAt ? meta.publishedAt.toISOString() : null,
          opened: !!activity,
          completed: completedIds.has(m.id),
          bookmarked: bookmarkedIds.has(m.id),
          lastOpenedAt: activity ? activity.lastOpenedAt.toISOString() : null,
        }
      }

      // Continue Learning — latest opened, incomplete, still authorized.
      const continueActivity = activities.find(
        (a) => a.completedAt == null && stillAuthorized(a.studyMaterial),
      )
      const continueLearning = continueActivity ? toCard(continueActivity.studyMaterial) : null

      // For You — deterministic: newest published+authorized, not completed.
      // With a subject filter, the full subject list (cap 24) is returned
      // instead so the drill-down view has complete (honest) state.
      const forYou = subjectFilter
        ? authorized.slice(0, 24).map(toCard)
        : authorized.filter((m) => !completedIds.has(m.id)).slice(0, 6).map(toCard)

      // Recently Opened — compact, honest.
      const recent = activities
        .filter((a) => stillAuthorized(a.studyMaterial))
        .slice(0, 5)
        .map((a) => toCard(a.studyMaterial))

      // Saved — bookmarked + still authorized.
      const saved = bookmarks
        .filter((b) => stillAuthorized(b.studyMaterial))
        .map((b) => toCard(b.studyMaterial))

      // ── Subjects — the student's real subjects with real counts ─────
      const subjects = await mySubjects(ctx, authorized)

      // ── Counts (real, never fabricated) ─────────────────────────────
      const [deckCards, reviewStates, activeTasks] = await Promise.all([
        db.flashcardCard.count({ where: { deck: { schoolId: ctx.schoolId } } }),
        db.flashcardReviewState.findMany({
          where: { studentId: ctx.studentId, deck: { schoolId: ctx.schoolId } },
          select: { dueAt: true },
        }),
        db.studyTask.count({
          where: { studentId: ctx.studentId, schoolId: ctx.schoolId, completedAt: null },
        }),
      ])
      const now = Date.now()
      const scheduled = reviewStates.filter((s) => s.dueAt.getTime() > now).length
      const dueFlashcards = Math.max(0, deckCards - scheduled)

      const completedResources = activities.filter((a) => a.completedAt != null).length

      return {
        continueLearning,
        forYou,
        subjects,
        recent,
        saved,
        counts: { dueFlashcards, activeTasks, completedResources },
      }
    },
    { roles: ['STUDENT'] },
  )
}
