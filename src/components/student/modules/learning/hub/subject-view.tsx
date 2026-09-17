'use client'

/**
 * learning/hub/subject-view — the focused subject experience (§9).
 *
 * Progressive disclosure, never overwhelm: mastery summary → due cards →
 * weak areas (REAL result data) → the subject's resources grouped by type.
 * The student always has exactly ONE obvious next action.
 */

import { useMemo } from 'react'
import { ArrowLeft, Award, Layers, TrendingDown } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLearningStore, dueCards } from '@/lib/store/learning-store'
import { useMyResults, pctOf } from '@/lib/store/student-results-store'
import { subjectColor } from '../../timetable/subject-colors'
import { SectionLabel } from '../../../shell/page-header'
import { ResourceCard } from '../shared/resource-card'
import { fmtMin } from '../shared/tokens'
import type { LearningResource } from '@/lib/store/learning-types'

interface SubjectViewProps {
  subject: string
  onBack: () => void
  onOpenResource: (resource: LearningResource) => void
  onAddToPlanner: (resource: LearningResource) => void
  onReviewDeck: (deckId: string) => void
}

export function SubjectView({ subject, onBack, onOpenResource, onAddToPlanner, onReviewDeck }: SubjectViewProps) {
  // Raw refs + useMemo — zustand v5 selectors must return stable references.
  const allResources = useLearningStore((s) => s.resources)
  const resources = useMemo(() => allResources.filter((r) => r.subject === subject), [allResources, subject])
  const progress = useLearningStore((s) => s.progress)
  const bookmarks = useLearningStore((s) => s.bookmarks)
  const toggleBookmark = useLearningStore((s) => s.toggleBookmark)
  const setProgress = useLearningStore((s) => s.setProgress)
  const cards = useLearningStore((s) => s.cards)
  const decks = useLearningStore((s) => s.decks)
  const sessions = useLearningStore((s) => s.sessions)

  const results = useMyResults()

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const sc = subjectColor(subject)
  const subjectDecks = useMemo(() => decks.filter((d) => d.subject === subject), [decks, subject])
  const subjectDeckIds = useMemo(() => new Set(subjectDecks.map((d) => d.id)), [subjectDecks])
  const subjectCards = useMemo(() => cards.filter((c) => subjectDeckIds.has(c.deckId)), [cards, subjectDeckIds])
  const due = useMemo(() => dueCards(cards, null, today).filter((c) => subjectDeckIds.has(c.deckId)), [cards, subjectDeckIds, today])
  const mastered = subjectCards.filter((c) => c.intervalDays >= 21 && c.reps > 0).length
  const completed = resources.filter((r) => progress[r.id]?.completedAt).length
  const total = subjectCards.length + resources.length
  const mastery = total > 0 ? Math.round(((mastered + completed) / total) * 100) : 0
  const studiedMin = sessions.filter((s) => s.subject === subject && s.completed).reduce((sum, s) => sum + s.durationMin, 0)

  const marks = useMemo(() => {
    const latest = results.latest
    const row = latest?.result.subjects.find((s) => s.subject === subject)
    return row ? { pct: pctOf(row.obtained, row.maxMarks), name: latest!.assessment.name } : null
  }, [results.latest, subject])

  /* Weak topics — derived from real lapses on this subject's cards (§28). */
  const weakTopics = useMemo(() => {
    const lapses = new Map<string, number>()
    for (const c of subjectCards) {
      if (c.lapses >= 1) {
        const deck = subjectDecks.find((d) => d.id === c.deckId)
        const key = deck?.topic ?? deck?.name ?? subject
        lapses.set(key, (lapses.get(key) ?? 0) + c.lapses)
      }
    }
    return [...lapses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([topic]) => topic)
  }, [subjectCards, subjectDecks, subject])

  const [deckCards, sheetCards, otherCards] = useMemo(() => [
    resources.filter((r) => r.type === 'deck'),
    resources.filter((r) => r.type === 'quiz' || r.type === 'worksheet'),
    resources.filter((r) => r.type !== 'deck' && r.type !== 'quiz' && r.type !== 'worksheet'),
  ], [resources])

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Learning Hub
        </Button>
      </div>
      <GlassCard hover={false} className="on-card overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-1', sc.bg, sc.text, sc.ring)} aria-hidden>
            {subject.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{subject}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>{fmtMin(studiedMin)} studied</span>
              <span>{completed}/{resources.length} resources done</span>
              <span>{mastered}/{subjectCards.length} cards mastered</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{mastery}<span className="text-lg font-semibold text-muted-foreground">%</span></p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">Mastery</p>
          </div>
        </div>
        <div className="h-1 w-full bg-muted" aria-hidden>
          <div className="h-full rounded-r-full bg-gradient-to-r transition-all duration-700" style={{ width: `${mastery}%` }} />
        </div>
      </GlassCard>

      {/* ── Continue: due cards + weak topics (one obvious action) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {due.length > 0 && (
          <GlassCard hover={false} className="on-card flex items-center gap-3.5 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/[0.09] text-violet-600 dark:text-violet-400" aria-hidden>
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{due.length} cards due today</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Keep the streak — a 5-minute review is enough.</p>
            </div>
            <Button size="sm" className="shrink-0" onClick={() => {
              const deck = subjectDecks.find((d) => due.some((c) => c.deckId === d.id))
              if (deck) onReviewDeck(deck.id)
            }}>
              Review
            </Button>
          </GlassCard>
        )}
        {marks && (
          <GlassCard hover={false} className="on-card flex items-center gap-3.5 p-4">
            <span className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
              marks.pct >= 85 ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-600' : 'border-amber-500/25 bg-amber-500/[0.08] text-amber-600',
            )} aria-hidden>
              <Award className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{Math.round(marks.pct)}% in {marks.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {marks.pct >= 85 ? 'A strong result — keep the rhythm.' : 'A short revision plan lifts this quickly.'}
              </p>
            </div>
          </GlassCard>
        )}
      </div>

      {weakTopics.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-4 py-3">
          <TrendingDown className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          <p className="min-w-0 flex-1 text-xs text-foreground/80">
            Cards you have found hard: <span className="font-semibold">{weakTopics.join(', ')}</span> — they come up more often until they stick.
          </p>
        </div>
      )}

      {/* ── Resources by type (§9 progressive disclosure) ── */}
      {deckCards.length > 0 && (
        <section aria-label={`${subject} flashcard decks`}>
          <SectionLabel hint={`${deckCards.length} decks`}>Flashcard decks</SectionLabel>
          <div className="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
            {deckCards.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                progress={progress[r.id]}
                bookmarked={bookmarks.includes(r.id)}
                onOpen={onOpenResource}
                onToggleBookmark={toggleBookmark}
                onAddToPlanner={onAddToPlanner}
                onMarkComplete={(res) => setProgress(res.id, 100)}
              />
            ))}
          </div>
        </section>
      )}
      <section aria-label={`${subject} practice`}>
        <SectionLabel>Practice &amp; quizzes</SectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
          {sheetCards.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              progress={progress[r.id]}
              bookmarked={bookmarks.includes(r.id)}
              onOpen={onOpenResource}
              onToggleBookmark={toggleBookmark}
              onAddToPlanner={onAddToPlanner}
              onMarkComplete={(res) => setProgress(res.id, 100)}
            />
          ))}
        </div>
      </section>
      {otherCards.length > 0 && (
        <section aria-label={`${subject} learn from`}>
          <SectionLabel>Learn from</SectionLabel>
          <div className="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
            {otherCards.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                progress={progress[r.id]}
                bookmarked={bookmarks.includes(r.id)}
                onOpen={onOpenResource}
                onToggleBookmark={toggleBookmark}
                onAddToPlanner={onAddToPlanner}
                onMarkComplete={(res) => setProgress(res.id, 100)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
