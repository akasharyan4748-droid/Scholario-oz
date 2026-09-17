'use client'

/**
 * learning/flashcards/review-session — the distraction-free study flow (§18).
 *
 * Front → reveal (tap / Space) → grade Again · Hard · Good · Easy
 * (keys 1–4 on desktop). Every grade runs the REAL SM-2 engine through the
 * store, so the schedule, buckets and mastery update live. Session ends with
 * an honest summary (reviewed, accuracy, needs-review) and the option to
 * re-run the cards that were graded Again.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Eye, RotateCcw, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useLearningStore } from '@/lib/store/learning-store'
import { subjectColor } from '../../timetable/subject-colors'
import { fmtMin } from '../shared/tokens'
import type { ReviewGrade } from '@/lib/learning/sm2'
import type { Flashcard, Deck } from '@/lib/store/learning-types'

const GRADES: { grade: ReviewGrade; label: string; key: string; btn: string; next: string }[] = [
  { grade: 'again', label: 'Again', key: '1', btn: 'border-rose-500/40 bg-rose-500/[0.09] text-rose-700 hover:bg-rose-500/[0.16] dark:text-rose-400', next: 'today' },
  { grade: 'hard', label: 'Hard', key: '2', btn: 'border-amber-500/40 bg-amber-500/[0.09] text-amber-700 hover:bg-amber-500/[0.16] dark:text-amber-400', next: 'soon' },
  { grade: 'good', label: 'Good', key: '3', btn: 'border-emerald-500/40 bg-emerald-500/[0.09] text-emerald-700 hover:bg-emerald-500/[0.16] dark:text-emerald-400', next: 'on schedule' },
  { grade: 'easy', label: 'Easy', key: '4', btn: 'border-sky-500/40 bg-sky-500/[0.09] text-sky-700 hover:bg-sky-500/[0.16] dark:text-sky-400', next: 'far ahead' },
]

interface ReviewSessionProps {
  /** Null → all due cards; a deck id → that deck only. */
  deckId: string | null
  /** Restrict to specific card ids (the "review tricky cards" re-run). */
  cardIds?: string[] | null
  onExit: () => void
  /** Re-run the Again-graded cards as a fresh mini-session. */
  onReviewAgain?: (cardIds: string[]) => void
}

export function ReviewSession({ deckId, cardIds, onExit, onReviewAgain }: ReviewSessionProps) {
  const cards = useLearningStore((s) => s.cards)
  const decks = useLearningStore((s) => s.decks)
  const reviewCard = useLearningStore((s) => s.reviewCard)

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const [queue] = useState<Flashcard[]>(() =>
    cards
      .filter((c) =>
        (!cardIds || cardIds.includes(c.id)) &&
        (!cardIds ? (!deckId || c.deckId === deckId) && c.due <= today : true),
      )
      .sort((a, b) => (b.reps > 0 ? 1 : 0) - (a.reps > 0 ? 1 : 0)),
  )
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [grades, setGrades] = useState<ReviewGrade[]>([])
  const [startedAt] = useState(() => Date.now())

  const deck: Deck | undefined = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])
  const card = queue[idx] ?? null
  const finished = idx >= queue.length
  const againIds = useMemo(
    () => queue.filter((_, i) => grades[i] === 'again').map((c) => c.id),
    [queue, grades],
  )

  const grade = useCallback((g: ReviewGrade) => {
    if (!card) return
    reviewCard(card.id, g)
    setGrades((prev) => [...prev, g])
    setRevealed(false)
    setIdx((i) => i + 1)
  }, [card, reviewCard])

  /* Keyboard: Space reveals, 1–4 grade (desktop §18). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (card && !revealed) setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        grade(GRADES[Number(e.key) - 1].grade)
      } else if (e.key === 'Escape') {
        onExit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, revealed, grade, onExit])

  /* ── Session summary (§18 — honest numbers only) ── */
  if (finished) {
    const again = grades.filter((g) => g === 'again').length
    const good = grades.filter((g) => g === 'good' || g === 'easy').length
    const accuracy = grades.length > 0 ? Math.round((good / grades.length) * 100) : 0
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000))
    return (
      <GlassCard hover={false} className="on-card mx-auto max-w-lg p-6 text-center sm:p-8">
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220 }}
          className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border',
            again === 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
              : 'border-violet-500/30 bg-violet-500/10 text-violet-600',
          )}
          aria-hidden
        >
          <Sparkles className="h-7 w-7" />
        </motion.span>
        <h3 className="mt-3 text-lg font-bold tracking-tight">Session complete</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {deck ? `${deck.name} · ` : 'All decks · '}{fmtMin(minutes)}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Reviewed', value: String(grades.length), tone: 'text-foreground' },
            { label: 'Recall', value: `${accuracy}%`, tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Needs review', value: String(again), tone: again > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/70 bg-muted/20 px-2 py-3">
              <p className={cn('text-xl font-bold tabular-nums tracking-tight', s.tone)}>{s.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        {grades.length > 0 && (
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Cards graded “Again” stay in today&apos;s queue — the scheduler brings them back until they stick.
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {againIds.length > 0 && (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => onReviewAgain?.(againIds)}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Review {againIds.length} tricky cards
            </Button>
          )}
          <Button onClick={onExit}>Done</Button>
        </div>
      </GlassCard>
    )
  }

  if (!card) {
    return (
      <GlassCard hover={false} className="on-card mx-auto max-w-lg p-8 text-center">
        <p className="text-sm font-semibold">Nothing due right now</p>
        <p className="mt-1.5 text-xs text-muted-foreground">You&apos;re all caught up — come back when the scheduler brings cards back.</p>
        <Button className="mt-4" variant="outline" onClick={onExit}>Back to decks</Button>
      </GlassCard>
    )
  }

  const deckOfCard = decks.find((d) => d.id === card.deckId)
  const sc = subjectColor(deckOfCard?.subject ?? 'Mathematics')
  const progressPct = queue.length > 0 ? (idx / queue.length) * 100 : 0

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* ── Minimal session chrome (§32 focus mode spirit) ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onExit} aria-label="End session">
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{deckOfCard?.name ?? 'All decks'}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{deckOfCard?.subject}</p>
        </div>
        <p className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">{idx + 1}<span className="text-muted-foreground/60">/{queue.length}</span></p>
      </div>
      <Progress value={progressPct} className="h-1" aria-label={`Review progress ${idx + 1} of ${queue.length}`} />

      {/* ── The card (§18) ── */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.button
            key={card.id}
            type="button"
            initial={{ opacity: 0, y: 10, rotateX: -4 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => !revealed && setRevealed(true)}
            aria-label={revealed ? 'Answer revealed' : 'Tap to reveal the answer'}
            className={cn(
              'flex min-h-[16rem] w-full flex-col items-center justify-center gap-4 rounded-2xl border p-6 text-center transition-colors sm:min-h-[18rem]',
              'on-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !revealed && 'cursor-pointer hover:border-primary/30',
            )}
          >
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', sc.bg, sc.text, 'border-transparent ring-1', sc.ring)} aria-hidden>
              <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} /> {card.reps === 0 ? 'New card' : card.intervalDays >= 21 ? 'Mastered card' : 'Learning'}
            </span>
            <p className="text-lg font-semibold leading-relaxed text-foreground sm:text-xl">{card.front}</p>
            {card.hint && !revealed && (
              <p className="text-[11px] italic text-muted-foreground">Hint: {card.hint}</p>
            )}
            {revealed ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 w-full border-t border-dashed border-border/70 pt-4">
                <p className="text-base leading-relaxed text-primary sm:text-lg">{card.back}</p>
              </motion.div>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Eye className="h-3.5 w-3.5" aria-hidden /> Tap or press Space to reveal
              </span>
            )}
          </motion.button>
        </AnimatePresence>
      </div>

      {/* ── Grades — the real SM-2 decision (§17/§18) ── */}
      {revealed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              onClick={() => grade(g.grade)}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                g.btn,
              )}
            >
              {g.label}
              <span className="text-[9px] font-medium uppercase tracking-wide opacity-70">{g.next} · {g.key}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
