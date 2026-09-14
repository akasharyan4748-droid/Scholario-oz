import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent, subjectNamesById } from '@/lib/learning'

export const runtime = 'nodejs'

/// GET /api/student/flashcards
///
/// The student's decks with REAL counts only (spec §20-22):
///   totalCards — cards in the deck
///   dueCount   — cards with no review state yet (new) OR dueAt <= now
/// Nothing else — no streaks, no accuracy, no mastery percentages.
export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)

      const [decks, states] = await Promise.all([
        db.flashcardDeck.findMany({
          where: { schoolId: ctx.schoolId },
          orderBy: { createdAt: 'asc' },
          include: { _count: { select: { cards: true } } },
        }),
        db.flashcardReviewState.findMany({
          where: { studentId: ctx.studentId, deck: { schoolId: ctx.schoolId } },
          select: { deckId: true, dueAt: true },
        }),
      ])

      const nameById = await subjectNamesById(ctx.schoolId, decks.map((d) => d.subjectId))
      const now = Date.now()
      // Cards not yet scheduled (no state) count as due — they are new.
      const scheduledByDeck = new Map<string, number>()
      for (const s of states) {
        if (s.dueAt.getTime() > now) {
          scheduledByDeck.set(s.deckId, (scheduledByDeck.get(s.deckId) ?? 0) + 1)
        }
      }

      const deckList = decks.map((d) => {
        const total = d._count.cards
        const scheduled = scheduledByDeck.get(d.id) ?? 0
        return {
          id: d.id,
          name: d.name,
          description: d.description,
          subjectId: d.subjectId,
          subjectName: d.subjectId ? nameById.get(d.subjectId) ?? null : null,
          totalCards: total,
          dueCount: Math.max(0, total - scheduled),
        }
      })

      const dueTotal = deckList.reduce((sum, d) => sum + d.dueCount, 0)
      return { decks: deckList, dueTotal }
    },
    { roles: ['STUDENT'] },
  )
}
