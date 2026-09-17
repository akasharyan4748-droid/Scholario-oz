'use client'

/**
 * AddAchievementDialog — the "+ Add" affordance for self-reported
 * accomplishments (title, category, date, one-line description).
 *
 * Honesty by design: the record is saved with source 'self' and scope
 * 'class' — and the toast says exactly what happened ("self-reported").
 * Everywhere it renders, the record carries the neutral "You added
 * this" treatment so it never looks like an official award.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useStudentGrowthStore,
  GROWTH_CATEGORIES,
  type GrowthCategory,
} from '@/lib/store/student-growth-store'
import { BTN_PRIMARY, BTN_OUTLINE, CATEGORY_META, INPUT_CLASSES, TEXTAREA_CLASSES } from './shared'

interface AddAchievementDialogProps {
  open: boolean
  onClose: () => void
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AddAchievementDialog({ open, onClose }: AddAchievementDialogProps) {
  const addSelfAchievement = useStudentGrowthStore((s) => s.addSelfAchievement)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GrowthCategory>('participation')
  const [dateISO, setDateISO] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  useDismissOnEscape(onClose, open)

  function reset() {
    setTitle('')
    setCategory('participation')
    setDateISO(todayISO())
    setDescription('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    if (!trimmedTitle) {
      setError('Give your accomplishment a short title.')
      return
    }
    if (!trimmedDescription) {
      setError('Add a one-line description.')
      return
    }
    if (!dateISO) {
      setError('Pick the date it happened.')
      return
    }
    addSelfAchievement({ title: trimmedTitle, category, dateISO, description: trimmedDescription })
    toast.success('Added to your record — self-reported', {
      description: `“${trimmedTitle}” is marked as added by you`,
    })
    handleClose()
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
          aria-label="Add your own accomplishment"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-md sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-snug">Add an accomplishment</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Self-reported — it will be tagged “Added by you”, never as a school award
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
                <div>
                  <label htmlFor="self-achievement-title" className="mb-1.5 block text-xs font-medium text-foreground">
                    Title
                  </label>
                  <input
                    id="self-achievement-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Learned to ride a bicycle"
                    maxLength={80}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-foreground" id="self-achievement-category-label">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="self-achievement-category-label">
                    {GROWTH_CATEGORIES.map((c) => {
                      const meta = CATEGORY_META[c]
                      const Icon = meta.icon
                      const selected = category === c
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          aria-pressed={selected}
                          className={cn(
                            'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors sm:min-h-0 sm:py-1.5',
                            selected
                              ? 'border-primary/40 bg-primary/[0.08] text-primary'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="self-achievement-date" className="mb-1.5 block text-xs font-medium text-foreground">
                    Date
                  </label>
                  <input
                    id="self-achievement-date"
                    type="date"
                    value={dateISO}
                    max={todayISO()}
                    onChange={(e) => setDateISO(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label htmlFor="self-achievement-description" className="mb-1.5 block text-xs font-medium text-foreground">
                    One-line description
                  </label>
                  <textarea
                    id="self-achievement-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you do?"
                    rows={2}
                    maxLength={160}
                    className={TEXTAREA_CLASSES}
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
                <button type="button" onClick={handleClose} className={BTN_OUTLINE}>
                  Cancel
                </button>
                <button type="submit" className={BTN_PRIMARY}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Add to my record
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
