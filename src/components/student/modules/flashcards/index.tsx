'use client'

/**
 * FlashcardsModule — the FLASHCARD HOME (spec §15/§16) and the shell that
 * decides between the HOME, the STUDY SESSION, the cards browser and the
 * notes system.
 *
 * Every number on this page is REAL (§61 no fake statistics): the stats
 * row derives from `dueStatsOf()` over the store's cards, the deck facts
 * and mastery bars from the decks/cards arrays, the streak chip from
 * `streakOf(sessions)`. The old mock "86 total / 14 day streak / 88%
 * accuracy" KPI wall is gone. When nothing is due the Start Review
 * button honestly says "You're all caught up" (§57).
 *
 * Local state owns the view: HOME ⇄ SESSION (session source can be the
 * full queue, one deck, or an explicit missed-cards list).
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Brain, CheckCircle2, ChevronRight, CircleDot, Clock3, Flame, Play, Plus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { StudentPageHeader, SectionLabel, type PageChip } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dueStatsOf, streakOf, useStudentLearningStore } from '@/lib/store/student-learning-store'
import { StatusChip, isDueNow } from './shared'
import { ReviewSession, type SessionSource } from './session'
import { CardsTab } from './cards-tab'
import { NotesTab } from './notes-tab'
import { NewCardModal, type NewCardPrefill } from './new-card-modal'

type View = 'home' | 'cards' | 'notes'

const SUBTABS: Array<{ key: View; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'cards', label: 'Cards' },
  { key: 'notes', label: 'Notes' },
]

type StatAccent = 'violet' | 'neutral' | 'amber' | 'emerald'

const STAT_TONES: Record<StatAccent, string> = {
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  neutral: 'bg-muted text-muted-foreground',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

function Stat({ icon: Icon, value, label, accent }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string; accent: StatAccent }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', STAT_TONES[accent])}>
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight tabular-nums">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

interface FlashcardsModuleProps {
  /** Cross-tab navigation inside the Learning module (resources link when all caught up). */
  goToTab?: (tab: string) => void
}

export function FlashcardsModule({ goToTab }: FlashcardsModuleProps) {
  // ── Canonical data — the only source of truth ──
  const cards = useStudentLearningStore((s) => s.cards)
  const decks = useStudentLearningStore((s) => s.decks)
  const sessions = useStudentLearningStore((s) => s.sessions)

  const [view, setView] = useState<View>('home')
  const [sessionSource, setSessionSource] = useState<SessionSource | null>(null)
  const [deckFilter, setDeckFilter] = useState<string | null>(null)
  const [newCardOpen, setNewCardOpen] = useState(false)
  const [newCardPrefill, setNewCardPrefill] = useState<NewCardPrefill | null>(null)

  const stats = useMemo(() => dueStatsOf(cards), [cards])
  const streak = useMemo(() => streakOf(sessions), [sessions])
  const recent = useMemo(
    () =>
      cards
        .filter((c) => c.lastReviewedAt !== null)
        .sort((a, b) => (a.lastReviewedAt! < b.lastReviewedAt! ? 1 : -1))
        .slice(0, 5),
    [cards],
  )
  const deckRows = useMemo(
    () =>
      decks.map((deck) => {
        const list = cards.filter((c) => c.deckId === deck.id)
        const mastered = list.filter((c) => c.status === 'mastered').length
        const due = list.filter((c) => isDueNow(c)).length
        return { deck, total: list.length, mastered, due }
      }),
    [decks, cards],
  )

  const openNewCard = (prefill?: NewCardPrefill) => {
    setNewCardPrefill(prefill ?? null)
    setNewCardOpen(true)
  }

  const browseDeck = (deckId: string) => {
    setDeckFilter(deckId)
    setView('cards')
  }

  // ── The session replaces the whole module surface while active ──
  if (sessionSource) {
    return <ReviewSession source={sessionSource} onExit={() => setSessionSource(null)} />
  }

  const headerChips: PageChip[] | undefined =
    streak.current > 0
      ? [{ label: `${streak.current} day streak`, icon: Flame, title: 'Days in a row with at least one study session' }]
      : undefined

  return (
    <div className="space-y-6 sm:space-y-7">
      <StudentPageHeader title="Flashcards" subtitle="Spaced repetition for lasting recall" chips={headerChips} />

      {/* Internal sections — Home / Cards / Notes */}
      <div
        role="tablist"
        aria-label="Flashcards sections"
        className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1"
      >
        {SUBTABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={view === t.key}
            onClick={() => setView(t.key)}
            className={cn(
              'min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9 sm:flex-none sm:px-4',
              view === t.key
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'home' && (
        <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6 sm:space-y-7">
          {/* ── Stats + Start Review (§16) — every count real ── */}
          <GlassCard hover={false} className="on-card p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <Stat icon={Clock3} value={stats.due} label="due today" accent="violet" />
              <Stat icon={CircleDot} value={stats.newCards} label="new · not seen yet" accent="neutral" />
              <Stat icon={Brain} value={stats.learning} label="learning" accent="amber" />
              <Stat icon={Award} value={stats.mastered} label={`mastered of ${stats.total}`} accent="emerald" />
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:gap-3">
              {stats.due > 0 ? (
                <button
                  type="button"
                  onClick={() => setSessionSource({ kind: 'queue' })}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-10"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Start review · {stats.due} card{stats.due === 1 ? '' : 's'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex h-11 cursor-default items-center justify-center gap-1.5 rounded-lg bg-muted px-5 text-xs font-semibold text-muted-foreground sm:h-10"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  You&apos;re all caught up
                </button>
              )}
              <button
                type="button"
                onClick={() => openNewCard()}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/50 px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-10"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New card
              </button>
              {stats.due === 0 && goToTab && (
                <button
                  type="button"
                  onClick={() => goToTab('resources')}
                  className="inline-flex h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-10"
                >
                  Browse learning resources
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>
          </GlassCard>

          {/* ── Your decks (§16) ── */}
          <section className="space-y-3">
            <SectionLabel hint={`${decks.length} decks · ${cards.length} cards`}>Your decks</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deckRows.map(({ deck, total, mastered, due }, i) => {
                const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
                const dot = deck.subject ? subjectColor(deck.subject).dot : 'bg-violet-500'
                return (
                  <motion.div
                    key={deck.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.25), duration: 0.2 }}
                  >
                    <GlassCard className="on-card flex h-full flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden />
                            <h3 className="truncate text-sm font-semibold">{deck.name}</h3>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{deck.description}</p>
                        </div>
                        {deck.id === 'D-my' && (
                          <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-400">
                            Yours
                          </span>
                        )}
                      </div>

                      {total === 0 ? (
                        <p className="mt-3 text-[11px] text-muted-foreground">No cards yet — cards you create appear here.</p>
                      ) : (
                        <>
                          <p className="mt-3 text-xs text-muted-foreground">
                            <span className="font-semibold tabular-nums text-foreground">{total}</span> cards ·{' '}
                            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{mastered}</span> mastered ·{' '}
                            <span className={cn('font-semibold tabular-nums', due > 0 ? 'text-amber-600 dark:text-amber-500' : '')}>{due}</span> due
                          </p>
                          <div className="mt-2.5">
                            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Mastery</span>
                              <span className="font-medium tabular-nums">{pct}%</span>
                            </div>
                            <div
                              className="h-1.5 overflow-hidden rounded-full bg-muted"
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${deck.name} mastery`}
                            >
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                        {total === 0 ? (
                          <button
                            type="button"
                            onClick={() => openNewCard()}
                            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:text-violet-400 sm:h-9"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            New card
                          </button>
                        ) : (
                          <>
                            {due > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSessionSource({ kind: 'queue', deckId: deck.id })}
                                className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-[11px] font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-9"
                              >
                                <Play className="h-3 w-3" aria-hidden />
                                Review {due}
                              </button>
                            ) : (
                              <span className="inline-flex h-11 items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 sm:h-9">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                All caught up
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => browseDeck(deck.id)}
                              className="inline-flex h-11 items-center gap-0.5 rounded-lg px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
                            >
                              Browse
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
            </div>
          </section>

          {/* ── Recently reviewed — real lastReviewedAt history ── */}
          {recent.length > 0 && (
            <section className="space-y-3">
              <SectionLabel>Recently reviewed</SectionLabel>
              <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
                {recent.map((c, i) => {
                  const sc = subjectColor(c.subject)
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.2 }}
                      className="flex min-h-11 items-center gap-2.5 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium leading-tight">{c.front}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                          {c.subject}
                          {c.topic && ` · ${c.topic}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <StatusChip status={c.status} />
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.lastReviewedAt!)}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </GlassCard>
            </section>
          )}
        </motion.div>
      )}

      {view === 'cards' && (
        <motion.div key="cards" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <CardsTab deckFilter={deckFilter} onDeckFilterChange={setDeckFilter} onNewCard={() => openNewCard()} />
        </motion.div>
      )}

      {view === 'notes' && (
        <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <NotesTab onMakeCard={(prefill) => openNewCard(prefill)} />
        </motion.div>
      )}

      <NewCardModal open={newCardOpen} prefill={newCardPrefill} onClose={() => setNewCardOpen(false)} />
    </div>
  )
}
