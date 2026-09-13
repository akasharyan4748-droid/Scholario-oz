'use client'

/**
 * CompareDialog — side-by-side comparison of two saved careers
 * (spec §31: understandable, never scary). Compares the interest
 * area, the school subjects that help, the important skills and the
 * related interest areas — the same facts the detail dialog shows,
 * next to each other. NO scores, NO "better than" verdicts.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { X, GitCompare } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import {
  careerById,
  FIELD_ORDER,
  type CareerEntry,
  type CareerField,
} from '@/lib/store/student-career-store'
import { FieldChip, FieldTile, SkillChip, SubjectChip, BTN_OUTLINE } from './shared'

interface CompareDialogProps {
  /** Exactly two career ids, or null when closed. */
  careerIds: [string, string] | null
  onClose: () => void
}

function relatedFieldsOf(career: CareerEntry): CareerField[] {
  const set = new Set<CareerField>()
  for (const id of career.relatedIds) {
    const related = careerById(id)
    if (related) set.add(related.field)
  }
  return FIELD_ORDER.filter((f) => set.has(f))
}

function CompareCell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

export function CompareDialog({ careerIds, onClose }: CompareDialogProps) {
  // Hooks first — never conditional (careerIds gates the render).
  useDismissOnEscape(onClose, careerIds != null)

  const careers = careerIds
    ? (careerIds.map(careerById).filter((c): c is CareerEntry => c != null) as CareerEntry[])
    : []
  const open = careers.length === 2
  const [a, b] = careers

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
          aria-label={`Compare ${a.title} and ${b.title}`}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400" aria-hidden>
                  <GitCompare className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-base font-semibold leading-snug">Compare two careers</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close comparison"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body — two columns, stacked facts */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {/* The two careers, side by side */}
              <div className="grid grid-cols-2 gap-2.5">
                {[a, b].map((career) => (
                  <div key={career.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <FieldTile field={career.field} className="h-8 w-8 [&>svg]:h-4 [&>svg]:w-4" />
                      <h3 className="min-w-0 text-[13px] font-semibold leading-snug">{career.title}</h3>
                    </div>
                    <FieldChip field={career.field} />
                  </div>
                ))}
              </div>

              <CompareCell label="What they do">
                {[a, b].map((career) => (
                  <p key={career.id} className="w-full text-[13px] leading-relaxed text-foreground/85">
                    <span className="font-semibold text-foreground">{career.title}:</span> {career.whatTheyDo}
                  </p>
                ))}
              </CompareCell>

              <CompareCell label="School subjects that help">
                {[a, b].map((career) => (
                  <div key={career.id} className="flex w-full flex-wrap items-center gap-1.5">
                    <span className="mr-0.5 text-[11px] font-semibold text-muted-foreground">{career.title}</span>
                    {career.subjects.map((subject) => (
                      <SubjectChip key={subject} subject={subject} />
                    ))}
                  </div>
                ))}
              </CompareCell>

              <CompareCell label="Important skills">
                {[a, b].map((career) => (
                  <div key={career.id} className="flex w-full flex-wrap items-center gap-1.5">
                    <span className="mr-0.5 text-[11px] font-semibold text-muted-foreground">{career.title}</span>
                    {career.skills.map((skill) => (
                      <SkillChip key={skill}>{skill}</SkillChip>
                    ))}
                  </div>
                ))}
              </CompareCell>

              <CompareCell label="Related interest areas">
                {[a, b].map((career) => (
                  <div key={career.id} className="flex w-full flex-wrap items-center gap-1.5">
                    <span className="mr-0.5 text-[11px] font-semibold text-muted-foreground">{career.title}</span>
                    {relatedFieldsOf(career).map((f) => (
                      <FieldChip key={f} field={f} />
                    ))}
                  </div>
                ))}
              </CompareCell>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
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
