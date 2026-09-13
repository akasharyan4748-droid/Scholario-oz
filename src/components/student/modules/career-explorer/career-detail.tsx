'use client'

/**
 * CareerDetail — the accessible career detail dialog.
 *
 * Conventions follow the Student workspace shells: role=dialog +
 * aria-modal, Escape closes (useDismissOnEscape), backdrop click
 * closes, bottom sheet on mobile / centered from sm up.
 *
 * Age-aware content rules: what they do (simple language), skills
 * that help, school subjects that help (the SAME subject colour
 * identity as the workspace), related careers (clickable — swaps the
 * dialog to that career) and the student's own note when saved.
 * NO salary, NO education timeline, NO "you should become".
 */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Eye, Link2, NotebookPen, Bookmark, BookmarkCheck } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  careerById,
  useStudentCareerStore,
} from '@/lib/store/student-career-store'
import { FieldChip, FieldTile, SkillChip, SubjectChip, BTN_OUTLINE, BTN_VIOLET, TEXTAREA_CLASSES } from './shared'

interface CareerDetailProps {
  careerId: string | null
  onClose: () => void
  /** Switch the dialog to a related career (records a real view). */
  onSwitch: (careerId: string) => void
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function CareerDetail({ careerId, onClose, onSwitch }: CareerDetailProps) {
  // Hooks first — never conditional (careerId gates the render).
  const career = careerId ? careerById(careerId) : null
  const savedEntry = useStudentCareerStore((s) => (careerId ? s.saved.find((c) => c.careerId === careerId) ?? null : null))
  const viewed = useStudentCareerStore((s) => s.viewed)
  const saveCareer = useStudentCareerStore((s) => s.saveCareer)
  const removeSaved = useStudentCareerStore((s) => s.removeSaved)
  const setNote = useStudentCareerStore((s) => s.setNote)
  useDismissOnEscape(onClose, careerId != null)

  const saved = savedEntry != null
  const [noteDraft, setNoteDraft] = useState('')

  // Sync the note draft whenever the dialog career or the stored note changes.
  useEffect(() => {
    setNoteDraft(savedEntry?.note ?? '')
  }, [careerId, savedEntry?.note])

  // The MOST RECENT real view of this career, if any.
  const lastViewed = careerId
    ? [...viewed]
        .filter((v) => v.careerId === careerId)
        .sort((a, b) => (a.viewedOn < b.viewedOn ? 1 : -1))[0] ?? null
    : null

  const related = career ? career.relatedIds.map(careerById).filter((c): c is NonNullable<typeof c> => c != null) : []

  function handleSaveToggle() {
    if (!career) return
    if (saved) {
      removeSaved(career.id)
      toast(`${career.title} removed from saved`)
    } else {
      saveCareer(career.id)
      toast.success(`${career.title} saved`, {
        description: 'Add a note or compare it with another career under Saved.',
      })
    }
  }

  function handleSaveNote() {
    if (!career) return
    setNote(career.id, noteDraft)
    toast.success('Note saved', { description: noteDraft.trim() || 'The note was cleared.' })
  }

  return (
    <AnimatePresence>
      {career && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${career.title} — career details`}
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
              <div className="flex min-w-0 items-start gap-3">
                <FieldTile field={career.field} />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-snug">{career.title}</h2>
                  <div className="mt-1.5">
                    <FieldChip field={career.field} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close career details"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3">
                <p className="text-sm leading-relaxed text-foreground/90">{career.whatTheyDo}</p>
              </div>

              {career.skills.length > 0 && (
                <Section label="Skills that help">
                  <div className="flex flex-wrap gap-1.5">
                    {career.skills.map((skill) => (
                      <SkillChip key={skill}>{skill}</SkillChip>
                    ))}
                  </div>
                </Section>
              )}

              {career.subjects.length > 0 && (
                <Section label="School subjects that help">
                  <div className="flex flex-wrap gap-1.5">
                    {career.subjects.map((subject) => (
                      <SubjectChip key={subject} subject={subject} />
                    ))}
                  </div>
                </Section>
              )}

              {related.length > 0 && (
                <Section label="Related careers">
                  <div className="flex flex-wrap gap-1.5">
                    {related.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onSwitch(r.id)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/[0.05] px-2.5 py-1 text-[11px] font-medium text-violet-700 transition-colors hover:bg-violet-500/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-violet-300"
                      >
                        <Link2 className="h-3 w-3 shrink-0" aria-hidden />
                        {r.title}
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {saved && (
                <Section label="Your note">
                  <div className="space-y-2">
                    <div className="relative">
                      <NotebookPen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        rows={2}
                        placeholder="Why does this career interest you?"
                        aria-label="Your note about this career"
                        className={cn(TEXTAREA_CLASSES, 'pl-9')}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveNote}
                        className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Save note
                      </button>
                    </div>
                  </div>
                </Section>
              )}

              {lastViewed && (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                  <Eye className="h-3 w-3 shrink-0" aria-hidden />
                  You viewed this on {formatDate(lastViewed.viewedOn)}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={handleSaveToggle}
                aria-pressed={saved}
                className={cn(
                  saved ? BTN_OUTLINE : BTN_VIOLET,
                  'gap-1.5',
                )}
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                    Remove from saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" aria-hidden />
                    Save this career
                  </>
                )}
              </button>
              <button type="button" onClick={onClose} className={BTN_OUTLINE}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
