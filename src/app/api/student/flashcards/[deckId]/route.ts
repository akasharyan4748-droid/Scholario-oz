import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent } from '@/lib/learning'

export const runtime = 'nodejs'

/// GET /api/student/flashcards/[deckId]?due=1
///
/// One deck + its cards with the CALLER's real review state. `?due=1`
/// returns only cards due now (new cards included). The deck must belong
/// to the caller's school (RLS — an unknown/foreign id is a 404).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const { deckId } = await params

      const deck = await db.flashcardDeck.findUnique({
        where: { id: deckId },
        include: { subject: { select: { name: true } } },
      })
      if (!deck || deck.schoolId !== ctx.schoolId) throw new Error('NOT_FOUND')

      const onlyDue = req.nextUrl.searchParams.get('due') === '1'
      const [cards, states] = await Promise.all([
        db.flashcardCard.findMany({
          where: { deckId },
          orderBy: { position: 'asc' },
        }),
        db.flashcardReviewState.findMany({
          where: { studentId: ctx.studentId, deckId },
        }),
      ])
      const stateByCard = new Map(states.map((s) => [s.cardId, s]))
      const now = Date.now()

      const shaped = cards.map((c) => {
        const state = stateByCard.get(c.id)
        const due = !state || state.dueAt.getTime() <= now
        return {
          id: c.id,
          front: c.front,
          back: c.back,
          position: c.position,
          due,
          dueAt: state ? state.dueAt.toISOString() : null,
          intervalDays: state?.intervalDays ?? 0,
          reps: state?.reps ?? 0,
        }
      })

      return {
        deck: {
          id: deck.id,
          name: deck.name,
          description: deck.description,
          subjectId: deck.subjectId,
          subjectName: deck.subject?.name ?? null,
        },
        cards: onlyDue ? shaped.filter((c) => c.due) : shaped,
        dueCount: shaped.filter((c) => c.due).length,
      }
    },
    { roles: ['STUDENT'] },
  )
}
