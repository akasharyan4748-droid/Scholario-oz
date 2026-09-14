'use client'

/**
 * Learning (L2D) — Flashcards tab (spec §20-22): a REAL due-count +
 * Start Review, My Decks, and a distraction-free study session with a
 * natural card flip and the four SM-2-lite grades. Every grade POSTs to
 * the server — the schedule (ease/interval/dueAt) is computed there and
 * nowhere else. No streaks, no accuracy KPIs, no mastery percentages.
 */

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Layers, Loader2, Play, RotateCcw, AlertTriangle, CheckCircle2, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { apiFetch, apiPost } from './api'
import type { FlashcardDeckSummary, FlashcardStudyCard, ReviewGrade } from './types'

// ─── Grade presentation (colour = status, restrained) ─────────────────

const GRADES: { key: ReviewGrade; label: string; hint: string; className: string }[] = [
  { key: 'again', label: 'Again', hint: '<10 min', className: 'border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10' },
  { key: 'hard', label: 'Hard', hint: 'soon', className: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10' },
  { key: 'good', label: 'Good', hint: 'normal', className: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10' },
  { key: 'easy', label: 'Easy', hint: 'longer', className: 'border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-400 hover:bg-teal-500/10' },
]

// ─── Flashcards tab ──────────────────────────────────────────────────

export function FlashcardsTab() {
  const [decks, setDecks] = useState<FlashcardDeckSummary[] | null>(null)
  const [dueTotal, setDueTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Session state
  const [session, setSession] = useState<{
    deckId: string
    deckName: string
    subjectName: string | null
    queue: FlashcardStudyCard[]
    idx: number
    flipped: boolean
    reviewed: number
  } | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    setError(null)
    apiFetch<{ decks: FlashcardDeckSummary[]; dueTotal: number }>('/api/student/flashcards', {
      signal: controller.signal,
    })
      .then((d) => {
        if (cancelled) return
        setDecks(d.decks)
        setDueTotal(d.dueTotal)
      })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setError(e instanceof Error ? e.message : 'Could not load flashcards.')
      })
    return () => { cancelled = true; controller.abort() }
  }, [reloadKey])

  const startSession = useCallback(async (deck: FlashcardDeckSummary) => {
    if (sessionLoading || deck.dueCount === 0) return
    setSessionLoading(true)
    try {
      const d = await apiFetch<{
        deck: { name: string; subjectName: string | null }
        cards: FlashcardStudyCard[]
      }>(`/api/student/flashcards/${deck.id}?due=1`)
      if (d.cards.length === 0) {
        setSession(null)
        setReloadKey((k) => k + 1)
        return
      }
      setSession({
        deckId: deck.id,
        deckName: d.deck.name,
        subjectName: d.deck.subjectName,
        queue: d.cards,
        idx: 0,
        flipped: false,
        reviewed: 0,
      })
    } catch {
      setError('Could not start the review.')
    } finally {
      setSessionLoading(false)
    }
  }, [sessionLoading])

  const flip = useCallback(() => {
    setSession((s) => (s ? { ...s, flipped: !s.flipped } : s))
  }, [])

  const grade = useCallback(async (g: ReviewGrade) => {
    if (!session || grading) return
    const card = session.queue[session.idx]
    if (!card) return
    setGrading(true)
    try {
      await apiPost('/api/student/flashcards/review', { cardId: card.id, grade: g })
      const nextIdx = session.idx + 1
      const reviewed = session.reviewed + 1
      if (nextIdx >= session.queue.length) {
        setSession({ ...session, idx: nextIdx, flipped: false, reviewed })
        // Session complete — refresh the due counts behind the scenes.
        setReloadKey((k) => k + 1)
      } else {
        setSession({ ...session, idx: nextIdx, flipped: false, reviewed })
      }
    } catch {
      import('sonner').then(({ toast }) => toast.error('Could not save that review.'))
    } finally {
      setGrading(false)
    }
  }, [session, grading])

  const endSession = () => {
    setSession(null)
    setReloadKey((k) => k + 1)
  }

  if (error && !decks) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t load Flashcards</p>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
        </Button>
      </div>
    )
  }

  if (session) {
    return (
      <StudySession
        session={session}
        grading={grading}
        onFlip={flip}
        onGrade={grade}
        onExit={endSession}
      />
    )
  }

  if (!decks) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading flashcards">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const busiest = decks.reduce<FlashcardDeckSummary | null>(
    (best, d) => (!best || d.dueCount > best.dueCount ? d : best),
    null,
  )

  return (
    <div className="space-y-6">
      {/* ── Due today + Start Review (spec §20) ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border',
            dueTotal > 0
              ? 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400'
              : 'border-border bg-muted text-muted-foreground',
          )}>
            <Layers className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {dueTotal > 0 ? `${dueTotal} card${dueTotal === 1 ? '' : 's'} due today` : 'Nothing due right now'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {decks.length} deck{decks.length === 1 ? '' : 's'} · spaced repetition schedule
            </p>
          </div>
        </div>
        <Button
          size="sm"
          disabled={dueTotal === 0 || sessionLoading || !busiest}
          onClick={() => busiest && startSession(busiest)}
          className="h-9 shrink-0 gap-1.5"
        >
          {sessionLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          Start Review
        </Button>
      </motion.div>

      {/* ── My Decks ─────────────────────────────────────────────────── */}
      <section className="space-y-3" aria-label="My decks">
        <h2 className="text-sm font-semibold text-foreground">My Decks</h2>
        {decks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
            No flashcard decks yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.25) }}
                whileHover={{ y: -2 }}
                className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-2xs transition-shadow hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">{d.name}</p>
                  {d.subjectName && (
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {d.subjectName}
                    </span>
                  )}
                </div>
                {d.description && (
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{d.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{d.totalCards} cards</span>
                  {d.dueCount > 0 && (
                    <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                      {d.dueCount} due
                    </span>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant={d.dueCount > 0 ? 'default' : 'outline'}
                    size="sm"
                    disabled={d.dueCount === 0 || sessionLoading}
                    onClick={() => startSession(d)}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    {d.dueCount > 0 ? (
                      <><Play className="h-3 w-3" aria-hidden /> Review</>
                    ) : (
                      'Nothing due'
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Study session (spec §21) ────────────────────────────────────────

function StudySession({
  session, grading, onFlip, onGrade, onExit,
}: {
  session: {
    deckName: string
    subjectName: string | null
    queue: FlashcardStudyCard[]
    idx: number
    flipped: boolean
    reviewed: number
  }
  grading: boolean
  onFlip: () => void
  onGrade: (g: ReviewGrade) => void
  onExit: () => void
}) {
  const card = session.queue[session.idx]
  const complete = session.idx >= session.queue.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onExit} className="h-8 gap-1.5 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Exit
        </Button>
        <p className="truncate text-xs font-medium text-muted-foreground">
          {session.subjectName ? `${session.subjectName} · ` : ''}{session.deckName}
        </p>
      </div>

      {!complete && card ? (
        <>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Card {session.idx + 1} of {session.queue.length}</span>
            <span>{session.reviewed} reviewed</span>
          </div>
          <Progress value={((session.idx) / session.queue.length) * 100} className="h-1" aria-label="Session progress" />

          {/* ── The card — natural flip via CSS perspective (spec §36) ── */}
          <div className="relative" style={{ perspective: '1200px' }}>
            <motion.div
              role="button"
              tabIndex={0}
              aria-label={session.flipped ? 'Answer shown. Choose how well you knew it.' : 'Question. Press Enter or space to reveal.'}
              onClick={onFlip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (!session.flipped) onFlip()
                }
              }}
              className="relative min-h-[260px] w-full cursor-pointer select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: session.flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-2xs"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Question</p>
                <p className="mt-4 font-display text-xl font-bold leading-snug sm:text-2xl">{card.front}</p>
                <p className="mt-6 text-[11px] text-muted-foreground/70">Tap to reveal</p>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 to-transparent p-8 text-center shadow-2xs"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Answer</p>
                <p className="mt-4 font-display text-xl font-bold leading-snug text-emerald-700 dark:text-emerald-300 sm:text-2xl">
                  {card.back}
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Reveal + grades ──────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {session.flipped ? (
              <motion.div
                key="grades"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {GRADES.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    disabled={grading}
                    onClick={() => onGrade(g.key)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50',
                      g.className,
                    )}
                  >
                    <span className="text-sm font-semibold">{g.label}</span>
                    <span className="text-[10px] opacity-70">{g.hint}</span>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.button
                key="reveal"
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onClick={onFlip}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Reveal answer
              </motion.button>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* ── Completion (real numbers only) ───────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 to-transparent px-4 py-14 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-base font-semibold">Review complete</p>
          <p className="text-xs text-muted-foreground">
            {session.reviewed} card{session.reviewed === 1 ? '' : 's'} reviewed · next due dates are scheduled
          </p>
          <Button size="sm" onClick={onExit} className="mt-1 h-9 gap-1.5">
            Back to decks
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
