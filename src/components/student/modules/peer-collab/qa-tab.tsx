'use client'

/**
 * QaTab — the class Q&A forum (spec §39/§40).
 *
 * Expandable THREADS, not chat (§42): each row opens in place to its
 * full body + answers. Answers carry a working [Helpful] toggle (the
 * demo student's own mark, persisted — seeded helpful counts are
 * classmates' seed facts). Every item — question or answer — has a
 * real [Report] action that persists `reportedByMe` and turns into an
 * honest "Reported — your class teacher will review" state; students
 * can never delete each other's content (§40). Teacher-locked threads
 * show the lock + hide the composer.
 *
 * All counts derive from the store arrays. Sorting: newest first.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Flag, Lock, MessageCircle, MessageCircleQuestion, ThumbsUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { displayOf, openQuestionsOf, useStudentGroupsStore, type QAQuestion } from '@/lib/store/student-groups-store'
import { BTN_GHOST, BTN_SKY, FIELD_CLASSES, InitialCircle, ReportedChip } from './shared'
import { NewQuestionModal } from './new-question-modal'

interface QaTabProps {
  /** Deep-link from the groups drill-down: this question opens expanded. */
  focusQuestionId?: string | null
  onFocusConsumed?: () => void
}

export function QaTab({ focusQuestionId, onFocusConsumed }: QaTabProps) {
  const questions = useStudentGroupsStore((s) => s.questions)
  const addAnswer = useStudentGroupsStore((s) => s.addAnswer)
  const toggleHelpful = useStudentGroupsStore((s) => s.toggleHelpful)
  const reportItem = useStudentGroupsStore((s) => s.reportItem)

  const [openId, setOpenId] = useState<string | null>(focusQuestionId ?? null)
  const [draft, setDraft] = useState('')
  const [askOpen, setAskOpen] = useState(false)

  // Consume the deep-link once so later tab visits don't re-expand.
  useEffect(() => {
    if (focusQuestionId) {
      setOpenId(focusQuestionId)
      onFocusConsumed?.()
    }
  }, [focusQuestionId, onFocusConsumed])

  const sorted = useMemo(() => [...questions].sort((a, b) => (a.askedOn < b.askedOn ? 1 : -1)), [questions])
  const open = useMemo(() => openQuestionsOf(questions), [questions])

  const toggleThread = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id))
    setDraft('')
  }

  const postAnswer = (q: QAQuestion) => {
    if (draft.trim() === '') return
    addAnswer(q.id, draft)
    setDraft('')
    toast.success('Answer posted', { description: 'Thanks for helping your classmates.' })
  }

  const reportQuestion = (q: QAQuestion) => {
    reportItem('question', { questionId: q.id })
    toast.warning('Reported — your class teacher will review', {
      description: "Students can't delete each other's content. Reports go to your class teacher only.",
    })
  }

  const reportAnswer = (q: QAQuestion, answerId: string) => {
    reportItem('answer', { questionId: q.id, answerId })
    toast.warning('Reported — your class teacher will review', {
      description: "Students can't delete each other's content. Reports go to your class teacher only.",
    })
  }

  return (
    <motion.div
      key="qa"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel hint={questions.length > 0 ? `${questions.length} asked · ${open.length} unanswered` : undefined}>
          Questions
        </SectionLabel>
        <button
          type="button"
          onClick={() => setAskOpen(true)}
          className={BTN_SKY}
        >
          <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden />
          Ask a question
        </button>
      </div>

      {sorted.length === 0 ? (
        <GlassCard hover={false} className="on-card px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">No questions yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Your question could be the first — ask your Class 2-A classmates.</p>
          <button type="button" onClick={() => setAskOpen(true)} className={cn(BTN_SKY, 'mt-4')}>
            <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden />
            Ask a question
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {sorted.map((q, i) => {
            const sc = subjectColor(q.subject)
            const expanded = openId === q.id
            const answerCount = q.answers.length
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.2 }}
              >
                <GlassCard hover={false} className="on-card p-0">
                  {/* Row header — expands the thread in place */}
                  <button
                    type="button"
                    onClick={() => toggleThread(q.id)}
                    aria-expanded={expanded}
                    aria-controls={`q-${q.id}-thread`}
                    className="w-full p-4 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-semibold leading-snug">
                          {q.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />}
                          {q.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {q.locked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              <Lock className="h-3 w-3" aria-hidden />
                              Locked by your teacher
                            </span>
                          )}
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold', sc.bg, sc.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                            {q.subject}
                          </span>
                          {q.topic && (
                            <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{q.topic}</span>
                          )}
                          {q.tags.map((t) => (
                            <span key={t} className="rounded-full bg-muted/50 px-1.5 py-0 text-[9px] font-medium text-muted-foreground">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <InitialCircle name={q.authorName} className="h-5 w-5 text-[8px]" />
                          {displayOf(q.authorName)} · {formatRelativeTime(q.askedOn)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                            answerCount > 0
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400'
                              : 'bg-muted/70 text-muted-foreground',
                          )}
                        >
                          <MessageCircle className="h-3 w-3" aria-hidden />
                          {answerCount} answer{answerCount === 1 ? '' : 's'}
                        </span>
                        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} aria-hidden />
                      </div>
                    </div>
                  </button>

                  {/* Thread */}
                  {expanded && (
                    <div id={`q-${q.id}-thread`} className="space-y-4 border-t border-border/60 px-4 py-4">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{q.body}</p>

                      {/* Question-level report (§40) */}
                      <div>
                        {q.reportedByMe ? (
                          <ReportedChip />
                        ) : (
                          <button type="button" onClick={() => reportQuestion(q)} className={BTN_GHOST} aria-label="Report this question">
                            <Flag className="h-3 w-3" aria-hidden />
                            Report
                          </button>
                        )}
                      </div>

                      {/* Answers */}
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                          Answers · {answerCount}
                        </p>
                        {answerCount === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            {q.locked ? 'No answers — this thread is locked.' : 'No answers yet — yours could be the first.'}
                          </p>
                        ) : (
                          <ul className="space-y-2.5">
                            {q.answers.map((a) => (
                              <li key={a.id} className="rounded-xl border border-border/70 bg-muted/30 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-foreground">
                                    <InitialCircle name={a.authorName} className="h-5 w-5 text-[8px]" />
                                    <span className="truncate">{displayOf(a.authorName)}</span>
                                    <span className="shrink-0 font-normal text-muted-foreground">· {formatRelativeTime(a.answeredOn)}</span>
                                  </p>
                                  <span className="shrink-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-400" title="Found this helpful">
                                    <ThumbsUp className="mr-0.5 inline h-3 w-3" aria-hidden />
                                    {a.helpfulCount}
                                    <span className="sr-only">
                                      {a.helpfulCount === 1 ? 'classmate found' : 'classmates found'} this answer helpful
                                    </span>
                                  </span>
                                </div>
                                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-foreground/90">{a.body}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleHelpful(q.id, a.id)}
                                    aria-pressed={a.markedHelpfulByMe}
                                    aria-label={`Mark ${displayOf(a.authorName)}'s answer as helpful`}
                                    className={cn(
                                      'inline-flex h-11 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9',
                                      a.markedHelpfulByMe
                                        ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                    )}
                                  >
                                    <ThumbsUp className={cn('h-3 w-3', a.markedHelpfulByMe && 'fill-emerald-500 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400')} aria-hidden />
                                    {a.markedHelpfulByMe ? 'Helpful ✓' : 'Helpful'}
                                  </button>
                                  {a.reportedByMe ? (
                                    <ReportedChip className="ml-1" />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => reportAnswer(q, a.id)}
                                      className={BTN_GHOST}
                                      aria-label={`Report ${displayOf(a.authorName)}'s answer`}
                                    >
                                      <Flag className="h-3 w-3" aria-hidden />
                                      Report
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Composer — hidden on teacher-locked threads (§40) */}
                      {q.locked ? (
                        <p className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Locked by your teacher — new answers are disabled.
                        </p>
                      ) : (
                        <div>
                          <label htmlFor={`answer-${q.id}`} className="mb-1.5 block text-xs font-medium text-foreground">
                            Your answer
                          </label>
                          <textarea
                            id={`answer-${q.id}`}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={3}
                            maxLength={600}
                            placeholder="Explain it kindly — a classmate is learning from you."
                            className={cn(FIELD_CLASSES, 'resize-none')}
                          />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] text-muted-foreground">Visible to Class 2-A · teacher-moderated</p>
                            <button
                              type="button"
                              onClick={() => postAnswer(q)}
                              disabled={draft.trim() === ''}
                              className={cn(
                                BTN_SKY,
                                draft.trim() === '' && 'cursor-not-allowed opacity-50',
                              )}
                            >
                              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                              Post answer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      <NewQuestionModal open={askOpen} onClose={() => setAskOpen(false)} />
    </motion.div>
  )
}
