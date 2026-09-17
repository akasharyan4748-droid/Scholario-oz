'use client'

/**
 * NewCardModal — flashcard creation (spec §19).
 *
 * Question + Answer + Subject (chips derived from the store's real
 * subjects) + Topic + Difficulty. Submit writes the canonical store via
 * `addCard()` — custom cards land in the "My Cards" deck (deckId D-my)
 * and the toast says exactly that. Accessible dialog following the
 * Student workspace conventions: role=dialog + aria-modal, Escape
 * closes (useDismissOnEscape), backdrop click closes, bottom sheet on
 * mobile / centered from sm up.
 *
 * `prefill` supports "create from note" (spec §19) — the Notes tab can
 * open this dialog with a note's title/content/subject/topic already
 * filled for the student to shape into a card.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentLearningStore, type Difficulty } from '@/lib/store/student-learning-store'
import { DIFFICULTY_META } from './shared'

export interface NewCardPrefill {
  front?: string
  back?: string
  subject?: string
  topic?: string
}

interface NewCardModalProps {
  open: boolean
  prefill?: NewCardPrefill | null
  onClose: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

const FIELD_CLASSES =
  'w-full rounded-xl border border-border bg-card/50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10'

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-foreground">
      {children}
      {required && (
        <span className="ml-0.5 text-rose-500" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}

export function NewCardModal({ open, prefill, onClose }: NewCardModalProps) {
  const addCard = useStudentLearningStore((s) => s.addCard)
  const resources = useStudentLearningStore((s) => s.resources)

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  // Subjects actually known to the store — chips, never a hardcoded list.
  const subjects = useMemo(() => Array.from(new Set(resources.map((r) => r.subject))).filter(Boolean), [resources])

  // Fresh form every time the dialog opens (with optional prefill).
  useEffect(() => {
    if (!open) return
    setFront(prefill?.front ?? '')
    setBack(prefill?.back ?? '')
    setSubject(prefill?.subject ?? '')
    setTopic(prefill?.topic ?? '')
    setDifficulty('medium')
  }, [open, prefill])

  useDismissOnEscape(onClose, open)

  const valid = front.trim() !== '' && back.trim() !== '' && subject !== ''

  const submit = () => {
    if (!valid) return
    addCard({ front: front.trim(), back: back.trim(), subject, topic: topic.trim(), difficulty })
    toast.success('Card added to My Cards', { description: front.trim() })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create a new flashcard"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-lg sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-snug">New card</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Cards you create go to your My Cards deck.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close new card dialog"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div>
                <FieldLabel htmlFor="nc-front" required>
                  Question
                </FieldLabel>
                <textarea
                  id="nc-front"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  rows={3}
                  required
                  autoFocus
                  placeholder="What is 7 + 8?"
                  aria-required="true"
                  className={cn(FIELD_CLASSES, 'resize-none')}
                />
              </div>

              <div>
                <FieldLabel htmlFor="nc-back" required>
                  Answer
                </FieldLabel>
                <textarea
                  id="nc-back"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  rows={3}
                  required
                  placeholder="15"
                  aria-required="true"
                  className={cn(FIELD_CLASSES, 'resize-none')}
                />
              </div>

              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-foreground">
                  Subject<span className="ml-0.5 text-rose-500" aria-hidden>*</span>
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => {
                    const active = subject === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSubject(active ? '' : s)}
                        aria-pressed={active}
                        aria-label={`Subject ${s}`}
                        className={cn(
                          'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                          active ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : subjectColor(s).dot)} aria-hidden />
                        {s}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div>
                <FieldLabel htmlFor="nc-topic">Topic</FieldLabel>
                <input
                  id="nc-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Addition"
                  className={FIELD_CLASSES}
                />
              </div>

              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-foreground">Difficulty</legend>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Card difficulty">
                  {DIFFICULTIES.map((d) => {
                    const active = difficulty === d
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          'inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-[11px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                          active ? cn(DIFFICULTY_META[d], 'font-semibold') : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card/60 px-4 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!valid}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9"
              >
                Add card
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
