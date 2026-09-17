'use client'

/**
 * learning/hub/resource-detail — the resource's own surface (§10/§13/§71).
 *
 * What each type honestly supports:
 *   · quiz    → a REAL inline quiz runner (question → answer → score);
 *               the result records progress + accuracy (§82 real functionality)
 *   · deck    → jumps straight into the Flashcards session for that deck
 *   · video / pdf / notes / worksheet / interactive → the school library
 *               catalogue entry: description, provenance, and honest
 *               engagement tracking (opened / completed), never fake playback
 *
 * Interconnected actions (§71): Add to today's plan · Create flashcard ·
 * Ask your teacher (through the CENTRAL messaging bridge — never a second
 * messaging system, §42/§43).
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Award, CalendarPlus, CheckCircle2, ChevronRight, Layers,
  MessageCircleQuestion, RotateCcw, Sparkles,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLearningStore } from '@/lib/store/learning-store'
import { useStudentComposeBridge } from '@/lib/store/student-compose-bridge'
import { teachers } from '@/lib/mock/teachers'
import { subjectColor } from '../../timetable/subject-colors'
import { typeToken, resourceMeta, ProgressBar } from '../shared/tokens'
import type { LearningResource, QuizQuestion } from '@/lib/store/learning-types'

interface ResourceDetailProps {
  resource: LearningResource | null
  onClose: () => void
  /** Interconnection callbacks (§71). */
  onAddToPlanner: (resource: LearningResource) => void
  onCreateFlashcard: (resource: LearningResource) => void
  onReviewDeck: (deckId: string) => void
  onNavigate: (key: string) => void
}

export function ResourceDetail({ resource, onClose, onAddToPlanner, onCreateFlashcard, onReviewDeck, onNavigate }: ResourceDetailProps) {
  const progress = useLearningStore((s) => (resource ? s.progress[resource.id] : undefined))
  const setProgress = useLearningStore((s) => s.setProgress)
  const recordQuizResult = useLearningStore((s) => s.recordQuizResult)
  const setComposeDraft = useStudentComposeBridge((s) => s.setDraft)

  // Quiz runner state (only for quiz-type resources)
  const [quizIdx, setQuizIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const questions = useMemo(() => resource?.questions ?? [], [resource])
  const quizMode = resource?.type === 'quiz' && questions.length > 0 && !finished
  const question: QuizQuestion | undefined = questions[quizIdx]

  const resetQuiz = () => {
    setQuizIdx(0); setPicked(null); setRevealed(false); setCorrectCount(0); setFinished(false)
  }

  const close = () => {
    resetQuiz()
    onClose()
  }

  if (!resource) return null
  const tt = typeToken(resource.type)
  const TypeIcon = tt.icon
  const sc = subjectColor(resource.subject)
  const pct = progress?.pct ?? 0
  const teacher = teachers.find((t) => t.name === resource.uploadedBy)

  const askTeacher = () => {
    const fallback = teachers[0]
    const target = teacher ?? fallback
    if (!target) {
      toast.info('Your teacher is not available for messages right now.')
      return
    }
    setComposeDraft({
      teacherId: target.id,
      teacherName: target.name,
      teacherSubject: target.department,
      subject: `Question about: ${resource.title}`,
      body: `Hello sir/ma'am, I was studying "${resource.title}" (${resource.subject} — ${resource.topic}) and I have a question: `,
    })
    close()
    onNavigate('messages')
  }

  const complete = () => {
    setProgress(resource.id, 100)
    toast.success('Marked as completed', { description: resource.title })
  }

  const pick = (option: string) => {
    if (revealed || !question) return
    setPicked(option)
    setRevealed(true)
    // The bank stores the answer as a letter — compare by option POSITION.
    const letter = String.fromCharCode(65 + question.options.indexOf(option))
    if (letter === question.answer) setCorrectCount((c) => c + 1)
  }

  const nextQuestion = () => {
    if (quizIdx + 1 >= questions.length) {
      setFinished(true)
      recordQuizResult(resource.id, correctCount, questions.length)
      toast.success(
        correctCount >= questions.length * 0.7 ? 'Well done!' : 'Quiz complete',
        { description: `${correctCount} of ${questions.length} correct — saved to your progress.` },
      )
    } else {
      setQuizIdx((i) => i + 1)
      setPicked(null)
      setRevealed(false)
    }
  }

  return (
    <Dialog open={!!resource} onOpenChange={(open) => !open && close()}>
      <DialogContent className="on-card max-w-lg gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-0 border-b border-border/70 p-5 text-left sm:p-6">
          <div className="flex items-start gap-3">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', tt.tile)} aria-hidden>
              <TypeIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold leading-snug tracking-tight sm:text-lg">{resource.title}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-1.5 text-xs">
                <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                {resource.subject} · {resource.topic} · {resourceMeta(resource)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">
          {quizMode && question ? (
            /* ── REAL QUIZ RUNNER (§82 — a feature, not a stub) ── */
            <div>
              <div className="mb-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <span>Question {quizIdx + 1} of {questions.length}</span>
                <span className="tabular-nums">{correctCount} correct</span>
              </div>
              <ProgressBar pct={((quizIdx + (revealed ? 1 : 0)) / questions.length) * 100} className="mb-5" />
              <p className="text-[15px] font-semibold leading-relaxed text-foreground">{question.question}</p>
              <div className="mt-4 grid gap-2">
                {question.options.map((option) => {
                  const isRight = revealed && option === question.answer
                  const isWrongPick = revealed && option === picked && option !== question.answer
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => pick(option)}
                      disabled={revealed}
                      className={cn(
                        'flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        !revealed && 'cursor-pointer border-border hover:border-primary/40 hover:bg-primary/[0.04]',
                        isRight && 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400',
                        isWrongPick && 'border-rose-500/40 bg-rose-500/[0.07] text-rose-700 dark:text-rose-400',
                        revealed && !isRight && !isWrongPick && 'border-border/60 opacity-60',
                      )}
                    >
                      <span className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                        isRight ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600' : 'border-border text-muted-foreground',
                      )} aria-hidden>
                        {isRight ? '✓' : String.fromCharCode(65 + question.options.indexOf(option))}
                      </span>
                      {option}
                    </button>
                  )
                })}
              </div>
              {revealed && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex justify-end">
                  <Button onClick={nextQuestion} className="gap-1">
                    {quizIdx + 1 >= questions.length ? 'Finish' : 'Next question'}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </motion.div>
              )}
            </div>
          ) : resource.type === 'quiz' && finished ? (
            /* ── Quiz summary — real score (§18-style honesty) ── */
            <div className="flex flex-col items-center py-6 text-center">
              <span className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl border',
                correctCount >= questions.length * 0.7
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600',
              )} aria-hidden>
                <Award className="h-7 w-7" />
              </span>
              <p className="mt-3 text-lg font-bold tracking-tight">{correctCount} of {questions.length} correct</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {correctCount >= questions.length * 0.7
                  ? 'Strong work — this quiz counts as completed.'
                  : 'Worth another try soon — it stays in your recommendations.'}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={resetQuiz} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Retake
                </Button>
                <Button size="sm" onClick={close} className="gap-1.5">Done</Button>
              </div>
            </div>
          ) : (
            /* ── Catalogue entry for every other type (honest, no fake playback) ── */
            <>
              <p className="text-sm leading-relaxed text-foreground/85">{resource.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                <span>Shared by <span className="font-medium text-foreground/80">{resource.uploadedBy}</span></span>
                {resource.rating && <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" aria-hidden />{resource.rating.toFixed(1)} school rating</span>}
              </div>
              {resource.type === 'deck' && (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] px-3.5 py-3">
                  <Layers className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
                  <p className="text-xs text-foreground/80">This is a flashcard deck — reviewing happens in the Flashcards section.</p>
                </div>
              )}
              {pct > 0 && (
                <div className="mt-4 flex items-center gap-2.5">
                  <ProgressBar pct={pct} className="flex-1" />
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">{pct}%{pct >= 100 ? ' · completed' : ''}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Actions: ONE primary + quiet contextual secondaries (§13) ── */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/70 bg-muted/[0.15] p-4 sm:p-5">
          {resource.type === 'quiz' && questions.length > 0 && !finished && null}
          {resource.type === 'deck' && resource.deckId ? (
            <Button className="gap-1.5" onClick={() => { onReviewDeck(resource.deckId!); close() }}>
              <Layers className="h-4 w-4" aria-hidden /> Review deck
            </Button>
          ) : resource.type !== 'quiz' ? (
            pct >= 100 ? (
              <Button variant="outline" className="gap-1.5" onClick={() => { setProgress(resource.id, 25); toast.info('Reset for another pass') }}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Study again
              </Button>
            ) : (
              <Button className="gap-1.5" onClick={complete}>
                <CheckCircle2 className="h-4 w-4" aria-hidden /> {pct === 0 ? 'Open & mark complete' : 'Mark complete'}
              </Button>
            )
          ) : null}
          <Button variant="outline" className="gap-1.5" onClick={() => { onAddToPlanner(resource); close() }}>
            <CalendarPlus className="h-4 w-4" aria-hidden /> Add to today&apos;s plan
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => { onCreateFlashcard(resource); close() }}>
            <Layers className="h-3.5 w-3.5" aria-hidden /> Create flashcard
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-muted-foreground" onClick={askTeacher}>
            <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden /> Ask your teacher
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
