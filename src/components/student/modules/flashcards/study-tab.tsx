'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Dispatch, SetStateAction } from 'react'
import { RotateCw, Sparkles, Award, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar, RadialGauge } from '@/components/shared/charts'
import { flashcardStats, type Flashcard } from '@/lib/mock/flashcards'
import { cn } from '@/lib/utils'
import { statusConfig, difficultyConfig } from './shared'

type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

interface StudyTabProps {
  currentCard: Flashcard | undefined
  currentIdx: number
  studyQueue: Flashcard[]
  flipped: boolean
  setFlipped: Dispatch<SetStateAction<boolean>>
  reviewedToday: number
  dueCards: number
  cardStates: Record<string, Flashcard['status']>
  onReview: (quality: ReviewQuality) => void
  onRestart: () => void
}

export function StudyTab({
  currentCard, currentIdx, studyQueue, flipped, setFlipped,
  reviewedToday, dueCards, cardStates, onReview, onRestart,
}: StudyTabProps) {
  return (
    <motion.div key="st" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Flashcard study area */}
      <div className="lg:col-span-2">
        {currentCard ? (
          <GlassCard className="p-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground">Card {currentIdx + 1} of {studyQueue.length}</span>
              <div className="flex items-center gap-2">
                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', statusConfig[cardStates[currentCard.id]].color)}>
                  {statusConfig[cardStates[currentCard.id]].label}
                </span>
                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', difficultyConfig[currentCard.difficulty])}>
                  {currentCard.difficulty}
                </span>
              </div>
            </div>
            <ProgressBar value={currentIdx + 1} max={studyQueue.length} color="oklch(0.6 0.2 300)" height={4} className="mb-6" />

            {/* Flashcard */}
            <div className="relative" style={{ perspective: '1000px' }}>
              <motion.div
                className="relative w-full cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setFlipped((f) => !f)}
              >
                {/* Front */}
                <div className="rounded-2xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-8 min-h-[240px] flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-3">{currentCard.subject} · {currentCard.topic}</p>
                  <p className="font-display text-2xl font-bold">{currentCard.front}</p>
                  <p className="text-[11px] text-muted-foreground mt-6 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Tap to reveal answer
                  </p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-8 min-h-[240px] flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-3">Answer</p>
                  <p className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-300">{currentCard.back}</p>
                </div>
              </motion.div>
            </div>

            {/* Review buttons */}
            <AnimatePresence>
              {flipped && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="grid grid-cols-4 gap-2 mt-6"
                >
                  <button
                    onClick={() => onReview('again')}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-rose-500/30 bg-rose-500/5 py-3 hover:bg-rose-500/10 transition-colors"
                  >
                    <RotateCw className="h-4 w-4 text-rose-500" />
                    <span className="text-[10px] font-semibold text-rose-600">Again</span>
                    <span className="text-[9px] text-muted-foreground">&lt; 1 min</span>
                  </button>
                  <button
                    onClick={() => onReview('hard')}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 py-3 hover:bg-amber-500/10 transition-colors"
                  >
                    <span className="text-base">😰</span>
                    <span className="text-[10px] font-semibold text-amber-600">Hard</span>
                    <span className="text-[9px] text-muted-foreground">1 day</span>
                  </button>
                  <button
                    onClick={() => onReview('good')}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-sky-500/30 bg-sky-500/5 py-3 hover:bg-sky-500/10 transition-colors"
                  >
                    <span className="text-base">🙂</span>
                    <span className="text-[10px] font-semibold text-sky-600">Good</span>
                    <span className="text-[9px] text-muted-foreground">3 days</span>
                  </button>
                  <button
                    onClick={() => onReview('easy')}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 py-3 hover:bg-emerald-500/10 transition-colors"
                  >
                    <span className="text-base">😎</span>
                    <span className="text-[10px] font-semibold text-emerald-600">Easy</span>
                    <span className="text-[9px] text-muted-foreground">7 days</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!flipped && (
              <button
                onClick={() => setFlipped(true)}
                className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-md"
              >
                <Sparkles className="h-4 w-4" /> Show Answer
              </button>
            )}
          </GlassCard>
        ) : (
          <GlassCard className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 mb-4"
            >
              <Award className="h-8 w-8" />
            </motion.div>
            <h3 className="font-display text-lg font-bold">All caught up! 🎉</h3>
            <p className="text-sm text-muted-foreground mt-1">You've reviewed all due cards for today.</p>
            <button
              onClick={onRestart}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            >
              <RotateCw className="h-4 w-4" /> Study Again
            </button>
          </GlassCard>
        )}
      </div>

      {/* Study stats sidebar */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center">
          <h3 className="font-semibold text-sm mb-3 self-start flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" /> Today's Progress
          </h3>
          <RadialGauge value={Math.round((reviewedToday / (reviewedToday + dueCards)) * 100)} label="complete" size={140} color="oklch(0.6 0.2 300)" />
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <div className="rounded-lg bg-emerald-500/10 py-2 text-center">
              <p className="font-display text-lg font-bold text-emerald-600">{reviewedToday}</p>
              <p className="text-[10px] text-muted-foreground">Reviewed</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 py-2 text-center">
              <p className="font-display text-lg font-bold text-amber-600">{dueCards}</p>
              <p className="text-[10px] text-muted-foreground">Remaining</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3">Cards by Subject</h3>
          <div className="space-y-2.5">
            {flashcardStats.cardsBySubject.map((s, i) => (
              <motion.div key={s.subject} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{s.subject}</span>
                  <span className="text-muted-foreground">{s.mastered}/{s.total}</span>
                </div>
                <ProgressBar value={s.mastered} max={s.total} color={s.color} height={5} />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}
