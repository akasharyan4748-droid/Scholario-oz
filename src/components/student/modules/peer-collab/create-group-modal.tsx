'use client'

/**
 * CreateGroupModal — group creation (spec §38), class-scoped only.
 *
 * Name + Subject (chips derived from the learning store's REAL
 * subjects) + Topic + Description. Visibility is NOT an option: it is
 * a read-only policy field ("Your class — 2-A") because school policy
 * scopes student groups to the class (§37 — never school-wide). The
 * created group lists the student as creator + first member and is
 * joined immediately.
 *
 * Accessible dialog: role=dialog + aria-modal, Escape closes
 * (useDismissOnEscape), backdrop click closes, bottom sheet on
 * mobile / centered from sm up.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, X } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentLearningStore } from '@/lib/store/student-learning-store'
import { useStudentGroupsStore } from '@/lib/store/student-groups-store'
import { BTN_PRIMARY, FIELD_CLASSES, FieldLabel } from './shared'

interface CreateGroupModalProps {
  open: boolean
  onClose: () => void
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const createGroup = useStudentGroupsStore((s) => s.createGroup)
  const resources = useStudentLearningStore((s) => s.resources)

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')

  // Subjects actually known to the learning store — never a hardcoded list.
  const subjects = useMemo(() => Array.from(new Set(resources.map((r) => r.subject))).filter(Boolean), [resources])

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) return
    setName('')
    setSubject('')
    setTopic('')
    setDescription('')
  }, [open])

  useDismissOnEscape(onClose, open)

  const valid = name.trim() !== '' && subject !== '' && topic.trim() !== ''

  const submit = () => {
    if (!valid) return
    createGroup({ name: name.trim(), subject, topic: topic.trim(), description: description.trim() })
    toast.success(`Created ${name.trim()}`, {
      description: 'Visible to your class only · your teacher moderates this space.',
    })
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
          aria-label="Create a study group"
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
                <h2 className="text-base font-semibold leading-snug">New study group</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Study with your Class 2-A classmates.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close new group dialog"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div>
                <FieldLabel htmlFor="cg-name" required>
                  Group name
                </FieldLabel>
                <input
                  id="cg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  maxLength={48}
                  placeholder="e.g. Fractions Friends"
                  aria-required="true"
                  className={FIELD_CLASSES}
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

              <div>
                <FieldLabel htmlFor="cg-topic" required>
                  Topic
                </FieldLabel>
                <input
                  id="cg-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  maxLength={48}
                  placeholder="e.g. Fractions"
                  aria-required="true"
                  className={FIELD_CLASSES}
                />
              </div>

              <div>
                <FieldLabel htmlFor="cg-desc">Description</FieldLabel>
                <textarea
                  id="cg-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={160}
                  placeholder="What will your group do together?"
                  className={cn(FIELD_CLASSES, 'resize-none')}
                />
              </div>

              {/* §37/§38 — visibility is school policy, read-only. */}
              <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  Visibility
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your class (2-A) — set by school policy. Groups are never visible school-wide, and your teacher moderates this space.
                </p>
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
                  BTN_PRIMARY,
                  !valid && 'cursor-not-allowed opacity-50',
                )}
              >
                Create group
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
