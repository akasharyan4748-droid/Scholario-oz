import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent, applyReviewGrade, REVIEW_GRADES, type ReviewGrade } from '@/lib/learning'

export const runtime = 'nodejs'

/// POST /api/student/flashcards/review
///
/// Body: { cardId: string, grade: 'again' | 'hard' | 'good' | 'easy' }
///
/// The SERVER is the only place the spaced-repetition math happens
/// (spec §22): ease / interval / dueAt are recomputed with SM-2-lite and
/// persisted on the caller's unique (studentId, cardId) state row. The
/// card's deck must belong to the caller's school (RLS). Returns the new
/// state so the client can render the next schedule honestly.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)

      const body = await req.json().catch(() => ({}))
      const cardId = typeof body?.cardId === 'string' ? body.cardId : ''
      const grade = body?.grade as ReviewGrade
      if (!cardId) throw new Error('cardId is required')
      if (!REVIEW_GRADES.includes(grade)) {
        throw new Error("grade must be one of 'again', 'hard', 'good', 'easy'")
      }

      const card = await db.flashcardCard.findUnique({
        where: { id: cardId },
        include: { deck: { select: { schoolId: true } } },
      })
      if (!card || card.deck.schoolId !== ctx.schoolId) throw new Error('NOT_FOUND')

      const prev = await db.flashcardReviewState.findUnique({
        where: { studentId_cardId: { studentId: ctx.studentId, cardId } },
      })
      const next = applyReviewGrade(
        prev ?? { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 },
        grade,
      )
      const now = new Date()

      const state = await db.flashcardReviewState.upsert({
        where: { studentId_cardId: { studentId: ctx.studentId, cardId } },
        create: {
          studentId: ctx.studentId,
          cardId,
          deckId: card.deckId,
          ease: next.ease,
          intervalDays: next.intervalDays,
          dueAt: next.dueAt,
          reps: next.reps,
          lapses: next.lapses,
          lastReviewedAt: now,
        },
        update: {
          ease: next.ease,
          intervalDays: next.intervalDays,
          dueAt: next.dueAt,
          reps: next.reps,
          lapses: next.lapses,
          lastReviewedAt: now,
        },
      })

      return {
        cardId,
        grade,
        ease: state.ease,
        intervalDays: state.intervalDays,
        dueAt: state.dueAt.toISOString(),
        reps: state.reps,
        lapses: state.lapses,
      }
    },
    { roles: ['STUDENT'] },
  )
}
