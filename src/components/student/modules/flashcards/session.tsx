'use client'

/**
 * ReviewSession — the distraction-free spaced-repetition session
 * (spec §17 SPACED REPETITION / §18 FLASHCARD SESSION).
 *
 * The queue comes from the store's `reviewQueueOf()` and RECOMPUTES as
 * cards are scheduled away: every quality press calls the real
 * `reviewCard()` SM-2-lite action, which moves the card's due date into
 * the future (or +10 minutes for "Again") so it naturally drops out of
 * the live queue. Every number on the completion screen comes from this
 * session's local log — nothing is invented (§61).
 *
 * Desktop keyboard: Space/Enter flip · 1 Again · 2 Hard · 3 Good ·
 * 4 Easy · Esc end. Shortcuts never fire while an input/textarea is
 * focused. Touch: tap the card to flip, big quality buttons (≥44px).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Eye, RotateCcw, X } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  reviewQueueOf,
  useStudentLearningStore,
  type LearningCard,
  type ReviewQuality,
} from '@/lib/store/student-learning-store'
import { DifficultyPill, QUALITY_META, QUALITY_ORDER, previewIntervalOf } from './shared'

/**
 * What the session reviews:
 *   · queue — the live due queue (optionally one deck only)
 *   · ids   — an explicit card list (the "review missed cards" restart)
 */
export type SessionSource = { kind: 'queue'; deckId?: string } | { kind: 'ids'; ids: string[] }

interface SessionLogEntry {
  cardId: string
  subject: string
  quality: ReviewQuality
  /** Flipped to mastered by this very review. */
  becameMastered: boolean
}

interface ReviewSessionProps {
  source: SessionSource
  onExit: () => void
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border bg-muted/70 px-1 font-sans text-[9px] font-semibold text-muted-foreground">
      {children}
    </kbd>
  )
}

export function ReviewSession({ source, onExit }: ReviewSessionProps) {
  const cards = useStudentLearningStore((s) => s.cards)
  const reviewCard = useStudentLearningStore((s) => s.reviewCard)
  const recordSession = useStudentLearningStore((s) => s.recordSession)

  const [activeSource, setActiveSource] = useState<SessionSource>(source)
  const [flipped, setFlipped] = useState(false)
  const [log, setLog] = useState<SessionLogEntry[]>([])
  const [initialTotal, setInitialTotal] = useState<number | null>(null)
  const startedAtRef = useRef(Date.now())
  const recordedRef = useRef(false)

  // ── The live queue — recompute as the store schedules cards away ──
  const queue = useMemo<LearningCard[]>(() => {
    if (activeSource.kind === 'ids') {
      const seen = new Set(log.map((l) => l.cardId))
      return activeSource.ids
        .map((id) => cards.find((c) => c.id === id))
        .filter((c): c is LearningCard => !!c && !seen.has(c.id))
    }
    let q = reviewQueueOf(cards)
    if (activeSource.kind === 'queue' && activeSource.deckId) q = q.filter((c) => c.deckId === activeSource.deckId)
    return q
  }, [cards, activeSource, log])

  // Freeze the session's total once (progress denominator).
  useEffect(() => {
    if (initialTotal === null && queue.length > 0) setInitialTotal(queue.length)
  }, [queue.length, initialTotal])

  const current = queue[0]
  const total = initialTotal ?? queue.length
  const reviewedCount = log.length
  const position = Math.min(reviewedCount + 1, Math.max(total, 1))
  const progressPct = total > 0 ? Math.min(100, Math.round((reviewedCount / total) * 100)) : 0

  // ── Review action — the REAL store write, then an honest log entry ──
  const review = useCallback(
    (quality: ReviewQuality) => {
      const target = queue[0]
      if (!target) return
      const before = useStudentLearningStore.getState().cards.find((c) => c.id === target.id) ?? target
      reviewCard(target.id, quality)
      const after = useStudentLearningStore.getState().cards.find((c) => c.id === target.id)
      const becameMastered = after?.status === 'mastered' && before.status !== 'mastered'
      setLog((l) => [...l, { cardId: target.id, subject: target.subject, quality, becameMastered }])
      setFlipped(false)
    },
    [queue, reviewCard],
  )

  // ── End of session — record the honest study minutes, once ──
  const finalize = useCallback(() => {
    if (!recordedRef.current && log.length > 0) {
      recordedRef.current = true
      const minutes = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60_000))
      const counts = new Map<string, number>()
      for (const entry of log) counts.set(entry.subject, (counts.get(entry.subject) ?? 0) + 1)
      const subject = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'General'
      recordSession({ subject, minutes, mode: 'manual' })
      toast.success('Review session recorded', { description: `${minutes} min · ${log.length} cards` })
    }
    onExit()
  }, [log, recordSession, onExit])

  // ── Desktop keyboard shortcuts (§18) — never inside inputs ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = ((e.target as HTMLElement | null) ?? document.activeElement) as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        e.preventDefault()
        finalize()
        return
      }
      // Focused buttons/links activate natively on Enter/Space (the flip
      // card itself is a button — its native activation flips it).
      const interactive = el?.closest('button, a, [role="button"]') != null
      if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
        if (interactive) return
        if (!current) return
        e.preventDefault()
        setFlipped((f) => !f)
        return
      }
      if (!flipped) return
      const map: Record<string, ReviewQuality> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }
      const quality = map[e.key]
      if (quality) {
        e.preventDefault()
        review(quality)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, flipped, review, finalize])

  // ── Completion numbers — all from this session's real log ──
  const recalled = log.filter((l) => l.quality !== 'again').length
  const accuracy = reviewedCount > 0 ? Math.round((recalled / reviewedCount) * 100) : 0
  const newlyMastered = log.filter((l) => l.becameMastered).length
  const missedIds = Array.from(new Set(log.filter((l) => l.quality === 'again').map((l) => l.cardId)))
  const missedCount = missedIds.length

  const restartMissed = () => {
    if (missedIds.length === 0) return
    setActiveSource({ kind: 'ids', ids: missedIds })
    setLog([])
    setFlipped(false)
    setInitialTotal(missedIds.length)
  }

  // ── Session over (or nothing was due) → completion screen ──
  if (!current) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <GlassCard hover={false} className="on-card p-6 text-center sm:p-8" role="status">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-3 font-display text-lg font-bold tracking-tight">
            {reviewedCount > 0 ? 'Session complete' : 'Nothing due right now'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {reviewedCount > 0
              ? `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'} this session.`
              : 'Every card is scheduled for later — come back when it’s due.'}
          </p>

          {reviewedCount > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/40 px-2 py-3">
                <p className="text-lg font-bold tabular-nums">{reviewedCount}</p>
                <p className="text-[10px] text-muted-foreground">Reviewed</p>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-3">
                <p className="text-lg font-bold tabular-nums text-sky-600 dark:text-sky-400">{accuracy}%</p>
                <p className="text-[10px] text-muted-foreground">Recall</p>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-3">
                <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{newlyMastered}</p>
                <p className="text-[10px] text-muted-foreground">Newly mastered</p>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-3">
                <p className={cn('text-lg font-bold tabular-nums', missedCount > 0 ? 'text-rose-600 dark:text-rose-400' : '')}>{missedCount}</p>
                <p className="text-[10px] text-muted-foreground">Missed</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {missedCount > 0 && (
              <button
                type="button"
                onClick={restartMissed}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-10"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Review the {missedCount} missed card{missedCount === 1 ? '' : 's'}
              </button>
            )}
            <button
              type="button"
              onClick={finalize}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/60 px-4 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-10"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Done
            </button>
          </div>
        </GlassCard>
      </div>
    )
  }

  // ── Active card ──
  const sc = subjectColor(current.subject)

  return (
    <div className="mx-auto w-full max-w-xl">
      <GlassCard hover={false} className="on-card space-y-4 p-4 sm:space-y-5 sm:p-6">
        {/* Progress + escape hatch */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Card <span className="font-semibold tabular-nums text-foreground">{position}</span> of{' '}
            <span className="tabular-nums">{total}</span>
          </p>
          <button
            type="button"
            onClick={finalize}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            End session
          </button>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Session progress — card ${position} of ${total}`}
        >
          <motion.div className="h-full rounded-full bg-violet-500" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* The card — tap/click/Space to flip */}
        <div style={{ perspective: '1000px' }}>
          <motion.button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            aria-label={flipped ? 'Show the question again' : 'Reveal the answer'}
            className="relative block w-full cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2"
          >
            {/* Front — question */}
            <div
              className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/[0.04] px-5 py-8 text-center sm:min-h-[340px] sm:px-8"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400">
                <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                {current.subject}
                {current.topic ? ` · ${current.topic}` : ''}
              </p>
              <p className="mt-4 font-display text-xl font-semibold leading-snug sm:text-2xl">{current.front}</p>
              <span className="mt-6">
                <DifficultyPill difficulty={current.difficulty} />
              </span>
              <p className="mt-5 text-[11px] text-muted-foreground">Tap to reveal the answer</p>
            </div>

            {/* Back — answer (scrolls safely when a custom card is long) */}
            <div
              className="absolute inset-0 overflow-y-auto rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex min-h-full flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">Answer</p>
                <p className="mt-4 max-w-full font-display text-lg font-semibold leading-snug text-emerald-700 dark:text-emerald-400 sm:text-xl">
                  {current.back}
                </p>
                <p className="mt-5 text-[11px] text-muted-foreground">How well did you recall it?</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Reveal / grading */}
        {flipped ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {QUALITY_ORDER.map((quality, i) => (
              <button
                key={quality}
                type="button"
                onClick={() => review(quality)}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:min-h-16',
                  QUALITY_META[quality].btn,
                )}
                aria-label={`${QUALITY_META[quality].label} — next review in ${previewIntervalOf(current, quality)}`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{QUALITY_META[quality].label}</span>
                  <span className="hidden sm:inline-flex">
                    <Kbd>{i + 1}</Kbd>
                  </span>
                </span>
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{previewIntervalOf(current, quality)}</span>
              </button>
            ))}
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-12"
          >
            <Eye className="h-4 w-4" aria-hidden />
            Show answer
          </button>
        )}

        {/* Subtle desktop-only shortcut hints (§18) */}
        <p className="hidden items-center justify-center gap-3 text-[10px] text-muted-foreground/80 md:flex">
          <span className="flex items-center gap-1">
            <Kbd>Space</Kbd> flip
          </span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            <Kbd>1</Kbd>–<Kbd>4</Kbd> grade
          </span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> end
          </span>
        </p>
      </GlassCard>
    </div>
  )
}
