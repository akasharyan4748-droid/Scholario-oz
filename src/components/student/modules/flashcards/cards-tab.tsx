'use client'

/**
 * CardsTab — the DECKS & CARDS browser (spec §15/§16).
 *
 * A small deck filter chip row (All + every deck with its REAL card
 * count) over a read-only card list: question, subject/topic chips with
 * the subjectColor identity, difficulty pill, status chip (neutral new /
 * amber learning / sky reviewing / emerald mastered) and an honest due
 * label ("New" / "Due now" / "today" / "in 3d"). Every value comes from
 * the canonical learning store — the mock flashcard list is gone.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { useStudentLearningStore, type LearningCard } from '@/lib/store/student-learning-store'
import { DifficultyPill, StatusChip, dueLabelOf, isDueLabelHot } from './shared'

interface CardsTabProps {
  deckFilter: string | null
  onDeckFilterChange: (v: string | null) => void
  onNewCard: () => void
}

/** Due-soonest first; never-studied new cards first, mastered last. */
function sortCards(list: LearningCard[]): LearningCard[] {
  return [...list].sort((a, b) => {
    const time = (c: LearningCard) =>
      c.dueAt ? new Date(c.dueAt).getTime() : c.status === 'mastered' ? Number.MAX_SAFE_INTEGER : 0
    return time(a) - time(b)
  })
}

function DeckChip({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean
  onClick: () => void
  ariaLabel?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
        active ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function CardsTab({ deckFilter, onDeckFilterChange, onNewCard }: CardsTabProps) {
  const cards = useStudentLearningStore((s) => s.cards)
  const decks = useStudentLearningStore((s) => s.decks)

  const deckCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of cards) map.set(c.deckId, (map.get(c.deckId) ?? 0) + 1)
    return map
  }, [cards])

  const list = useMemo(() => sortCards(deckFilter ? cards.filter((c) => c.deckId === deckFilter) : cards), [cards, deckFilter])

  return (
    <section className="space-y-3">
      <SectionLabel hint={`${list.length} of ${cards.length} cards`}>Decks &amp; cards</SectionLabel>

      {/* Deck filter chips — All + every deck, with real counts */}
      <div className="flex flex-wrap items-center gap-1.5">
        <DeckChip active={deckFilter === null} onClick={() => onDeckFilterChange(null)} ariaLabel="Show cards from all decks">
          All
          <span className="tabular-nums opacity-60">{cards.length}</span>
        </DeckChip>
        {decks.map((d) => {
          const count = deckCounts.get(d.id) ?? 0
          const dot = d.subject ? subjectColor(d.subject).dot : 'bg-violet-500'
          return (
            <DeckChip
              key={d.id}
              active={deckFilter === d.id}
              onClick={() => onDeckFilterChange(deckFilter === d.id ? null : d.id)}
              ariaLabel={`Show ${d.name} — ${count} cards`}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', deckFilter === d.id ? 'bg-white' : dot)} aria-hidden />
              {d.name}
              <span className="tabular-nums opacity-60">{count}</span>
            </DeckChip>
          )
        })}
        <span className="ml-auto">
          <button
            type="button"
            onClick={onNewCard}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:text-violet-400 sm:h-9"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New card
          </button>
        </span>
      </div>

      {/* Card list — read-only rows, every fact real */}
      <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
        {list.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-muted-foreground">
              {deckFilter ? 'No cards in this deck yet.' : 'No cards yet.'}
            </p>
            <button
              type="button"
              onClick={onNewCard}
              className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-9"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Create your first card
            </button>
          </div>
        ) : (
          list.map((card, i) => {
            const sc = subjectColor(card.subject)
            const hot = isDueLabelHot(card)
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.24), duration: 0.2 }}
                className="flex min-h-11 items-center gap-3 px-3 py-2.5 sm:px-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-tight">{card.front}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                      {card.subject}
                    </span>
                    {card.topic && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="truncate">{card.topic}</span>
                      </>
                    )}
                    <DifficultyPill difficulty={card.difficulty} />
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                  <StatusChip status={card.status} />
                  <span className={cn('text-[10px] font-medium tabular-nums', hot ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground')}>
                    {dueLabelOf(card)}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </GlassCard>
    </section>
  )
}
