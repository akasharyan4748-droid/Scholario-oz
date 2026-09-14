import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireStudent,
  materialVisibleToStudent,
  targetedMaterialIds,
  subjectNamesById,
} from '@/lib/learning'
import { toStudyMaterialMeta } from '@/lib/study-materials'

export const runtime = 'nodejs'

/// GET /api/student/learning/search?q=<text>
///
/// Cross-entity Learning search (spec §9): materials (title/description),
/// flashcard decks (name/description), study groups (name) and the
/// student's own planner tasks (title). Permission scoping identical to
/// the overview route — a student can never see an unauthorized material
/// through search. Metadata only, max 12 results.
export async function GET(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const q = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase()
      if (q.length < 2) return { results: [] }

      const matches = (...texts: (string | null | undefined)[]): boolean =>
        texts.some((t) => !!t && t.toLowerCase().includes(q))

      // ── Materials — published + authorized only ──────────────────────
      const targeted = await targetedMaterialIds(ctx.studentId)
      const materials = await db.studyMaterial.findMany({
        where: { schoolId: ctx.schoolId, status: 'published' },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      })
      const authorized = materials.filter(
        (m) => materialVisibleToStudent(m, ctx, targeted) && matches(m.title, m.description),
      )
      const nameById = await subjectNamesById(ctx.schoolId, authorized.map((m) => m.subjectId))

      // ── Decks / groups / my tasks ────────────────────────────────────
      const [decks, groups, tasks] = await Promise.all([
        db.flashcardDeck.findMany({
          where: { schoolId: ctx.schoolId },
          orderBy: { name: 'asc' },
        }),
        db.studyGroup.findMany({
          where: { schoolId: ctx.schoolId },
          orderBy: { name: 'asc' },
        }),
        db.studyTask.findMany({
          where: { studentId: ctx.studentId, schoolId: ctx.schoolId },
          orderBy: { createdAt: 'desc' },
          include: { subject: { select: { name: true } } },
        }),
      ])

      const results: Array<Record<string, unknown>> = []

      for (const m of authorized.slice(0, 6)) {
        results.push({
          kind: 'material',
          id: m.id,
          title: m.title,
          subtitle: [
            m.subjectId ? nameById.get(m.subjectId) ?? null : null,
            m.category,
          ].filter(Boolean).join(' · '),
          meta: toStudyMaterialMeta(m, m.subjectId ? nameById.get(m.subjectId) ?? null : null),
        })
      }
      for (const d of decks.filter((d) => matches(d.name, d.description)).slice(0, 3)) {
        results.push({
          kind: 'deck',
          id: d.id,
          title: d.name,
          subtitle: d.subjectId ? nameById.get(d.subjectId) ?? 'Flashcards' : 'Flashcards',
          tab: 'flashcards',
        })
      }
      for (const g of groups.filter((g) => matches(g.name, g.description)).slice(0, 3)) {
        results.push({
          kind: 'group',
          id: g.id,
          title: g.name,
          subtitle: g.subjectId ? nameById.get(g.subjectId) ?? 'Study group' : 'Study group',
          tab: 'groups',
        })
      }
      for (const t of tasks.filter((t) => matches(t.title)).slice(0, 3)) {
        results.push({
          kind: 'task',
          id: t.id,
          title: t.title,
          subtitle: ['Planner', t.subject ? t.subject.name : null, t.completedAt ? 'Done' : null]
            .filter(Boolean)
            .join(' · '),
          tab: 'planner',
        })
      }

      return { results: results.slice(0, 12) }
    },
    { roles: ['STUDENT'] },
  )
}
