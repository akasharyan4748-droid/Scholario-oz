'use client'

/**
 * NewQuestionModal — the Q&A forum's composer (spec §39).
 *
 * Title + Question body + Subject (chips derived from the learning
 * store's REAL subjects) + Topic + Tags (comma separated). Posts to
 * the class forum via `addQuestion()` — this is a FORUM, not a chat
 * (§42): the question lands as a thread classmates can answer.
 *
 * Privacy is stated in the dialog itself (§37): the question is
 * visible to Class 2-A only and the space is teacher-moderated.
 *
 * Accessible dialog: role=dialog + aria-modal, Escape closes
 * (useDismissOnEscape), backdrop click closes, bottom sheet on
 * mobile / centered from sm up.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, X } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentLearningStore } from '@/lib/store/student-learning-store'
import { useStudentGroupsStore } from '@/lib/store/student-groups-store'
import { BTN_SKY, FIELD_CLASSES, FieldLabel } from './shared'

const MAX_TAGS = 4

export function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
    ),
  ).slice(0, MAX_TAGS)
}

interface NewQuestionModalProps {
  open: boolean
  onClose: () => void
}

export function NewQuestionModal({ open, onClose }: NewQuestionModalProps) {
  const addQuestion = useStudentGroupsStore((s) => s.addQuestion)
  const resources = useStudentLearningStore((s) => s.resources)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')

  // Subjects actually known to the learning store — never a hardcoded list.
  const subjects = useMemo(() => Array.from(new Set(resources.map((r) => r.subject))).filter(Boolean), [resources])

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) return
    setTitle('')
    setBody('')
    setSubject('')
    setTopic('')
    setTagsRaw('')
  }, [open])

  useDismissOnEscape(onClose, open)

  const tags = parseTags(tagsRaw)
  const valid = title.trim() !== '' && body.trim() !== '' && subject !== ''

  const submit = () => {
    if (!valid) return
    addQuestion({ title: title.trim(), body: body.trim(), subject, topic: topic.trim(), tags })
    toast.success('Question posted', { description: 'Visible to Class 2-A — your classmates can now answer.' })
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
          aria-label="Ask the class forum"
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
                <h2 className="text-base font-semibold leading-snug">Ask a question</h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  Class 2-A only · teacher-moderated
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close ask question dialog"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div>
                <FieldLabel htmlFor="nq-title" required>
                  Title
                </FieldLabel>
                <input
                  id="nq-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  maxLength={90}
                  placeholder="Ask it like a headline — e.g. How do I compare fractions?"
                  aria-required="true"
                  className={FIELD_CLASSES}
                />
              </div>

              <div>
                <FieldLabel htmlFor="nq-body" required>
                  Question
                </FieldLabel>
                <textarea
                  id="nq-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  required
                  placeholder="Add the details — what you tried, where you got stuck…"
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
                          active
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : subjectColor(s).dot)} aria-hidden />
                        {s}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="nq-topic">Topic</FieldLabel>
                  <input
                    id="nq-topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={40}
                    placeholder="e.g. Fractions"
                    className={FIELD_CLASSES}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="nq-tags">Tags</FieldLabel>
                  <input
                    id="nq-tags"
                    type="text"
                    value={tagsRaw}
                    onChange={(e) => setTagsRaw(e.target.value)}
                    placeholder="comma separated"
                    aria-describedby="nq-tags-hint"
                    className={FIELD_CLASSES}
                  />
                  <p id="nq-tags-hint" className="mt-1 text-[10px] text-muted-foreground">
                    {tags.length > 0 ? tags.map((t) => `#${t}`).join(' ') : `Up to ${MAX_TAGS} tags`}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-border/60 px-4 py-3.5 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center rounded-lg px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!valid}
                className={cn(
                  BTN_SKY,
                  !valid && 'cursor-not-allowed opacity-50',
                )}
              >
                Post question
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
