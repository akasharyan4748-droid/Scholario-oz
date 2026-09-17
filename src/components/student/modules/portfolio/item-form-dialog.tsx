'use client'

/**
 * ItemFormDialog — the "+ Add" affordance (and Edit for self-origin items).
 *
 * Add: title, kind chips, subject chips (DERIVED from the subjects already
 * present on portfolio items + achievements), date, description, skill
 * tags (comma-separated with a live chip preview) and visibility (default
 * Private — school-controlled audience, no public option). Saves via
 * addPortfolioItem with an honest toast.
 *
 * Edit: same form prefilled — offered for origin 'self' items only (the
 * from-achievement mirrors belong to the Achievements tab).
 */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Plus, Pencil } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useStudentGrowthStore,
  type PortfolioItem,
  type PortfolioKind,
  type PortfolioVisibility,
} from '@/lib/store/student-growth-store'
import { subjectColor } from '../timetable/subject-colors'
import { BTN_OUTLINE, BTN_PRIMARY, INPUT_CLASSES, KIND_META, KIND_ORDER, TEXTAREA_CLASSES, visibilityLabel } from './shared'

export interface ItemFormState {
  mode: 'add' | 'edit'
  /** The item being edited (mode 'edit' only). */
  item?: PortfolioItem
}

interface ItemFormDialogProps {
  form: ItemFormState | null
  subjects: string[]
  onClose: () => void
}

const VISIBILITIES: PortfolioVisibility[] = ['private', 'class', 'school']

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Comma-separated input → deduped, trimmed skill tags (max 6). */
function parseSkills(input: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input.split(',')) {
    const s = raw.trim().replace(/\s+/g, ' ').slice(0, 30)
    if (!s) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= 6) break
  }
  return out
}

export function ItemFormDialog({ form, subjects, onClose }: ItemFormDialogProps) {
  const addPortfolioItem = useStudentGrowthStore((s) => s.addPortfolioItem)
  const updatePortfolioItem = useStudentGrowthStore((s) => s.updatePortfolioItem)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<PortfolioKind>('project')
  const [subject, setSubject] = useState<string | null>(null)
  const [dateISO, setDateISO] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [visibility, setVisibility] = useState<PortfolioVisibility>('private')
  const [error, setError] = useState<string | null>(null)

  const open = form != null
  useDismissOnEscape(onClose, open)

  // Prefill on open (edit mode) / reset (add mode).
  useEffect(() => {
    if (!form) return
    if (form.mode === 'edit' && form.item) {
      setTitle(form.item.title)
      setKind(form.item.kind)
      setSubject(form.item.subject ?? null)
      setDateISO(form.item.dateISO)
      setDescription(form.item.description)
      setSkillsInput(form.item.skills.join(', '))
      setVisibility(form.item.visibility)
    } else {
      setTitle('')
      setKind('project')
      setSubject(null)
      setDateISO(todayISO())
      setDescription('')
      setSkillsInput('')
      setVisibility('private')
    }
    setError(null)
  }, [form])

  const parsedSkills = parseSkills(skillsInput)
  const isEdit = form?.mode === 'edit'

  function handleClose() {
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    if (!trimmedTitle) {
      setError('Give your work a short title.')
      return
    }
    if (!trimmedDescription) {
      setError('Add a one-line description — what is this work?')
      return
    }
    if (!dateISO) {
      setError('Pick the date of this work.')
      return
    }

    if (isEdit && form?.item) {
      updatePortfolioItem(form.item.id, {
        title: trimmedTitle,
        kind,
        subject: subject ?? undefined,
        dateISO,
        description: trimmedDescription,
        skills: parsedSkills,
        visibility,
      })
      toast.success('Portfolio item updated', {
        description: `“${trimmedTitle}” — changes saved`,
      })
    } else {
      addPortfolioItem({
        title: trimmedTitle,
        kind,
        description: trimmedDescription,
        dateISO,
        subject: subject ?? undefined,
        skills: parsedSkills,
        visibility,
      })
      toast.success('Added to your portfolio', {
        description: `“${trimmedTitle}” — ${visibility === 'private' ? 'private, only you can see it' : `visible to your ${visibilityLabel(visibility).toLowerCase()}`}`,
      })
    }
    handleClose()
  }

  return (
    <AnimatePresence>
      {form && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? 'Edit portfolio item' : 'Add work to your portfolio'}
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
                <h2 className="text-base font-semibold leading-snug">
                  {isEdit ? 'Edit your work' : 'Add work to your portfolio'}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isEdit
                    ? '“Added by you” work you created here'
                    : 'Projects, artwork, activities — work you’re proud of'}
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
                  <label htmlFor="portfolio-item-title" className="mb-1.5 block text-xs font-medium text-foreground">
                    Title
                  </label>
                  <input
                    id="portfolio-item-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Story: The Lost Kite"
                    maxLength={80}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-foreground" id="portfolio-item-kind-label">
                    Kind
                  </p>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="portfolio-item-kind-label">
                    {KIND_ORDER.map((k) => {
                      const meta = KIND_META[k]
                      const Icon = meta.icon
                      const selected = kind === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setKind(k)}
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
                  <p className="mb-1.5 text-xs font-medium text-foreground" id="portfolio-item-subject-label">
                    Subject <span className="font-normal text-muted-foreground">(optional)</span>
                  </p>
                  {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="portfolio-item-subject-label">
                      {subjects.map((s) => {
                        const selected = subject === s
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSubject(selected ? null : s)}
                            aria-pressed={selected}
                            className={cn(
                              'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors sm:min-h-0 sm:py-1.5',
                              selected
                                ? 'border-primary/40 bg-primary/[0.08] text-primary'
                                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                            )}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full', subjectColor(s).dot)} aria-hidden />
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No subjects yet — add work with a subject first.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="portfolio-item-date" className="mb-1.5 block text-xs font-medium text-foreground">
                    Date
                  </label>
                  <input
                    id="portfolio-item-date"
                    type="date"
                    value={dateISO}
                    max={todayISO()}
                    onChange={(e) => setDateISO(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label htmlFor="portfolio-item-description" className="mb-1.5 block text-xs font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    id="portfolio-item-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this work about?"
                    rows={3}
                    maxLength={280}
                    className={TEXTAREA_CLASSES}
                  />
                </div>

                <div>
                  <label htmlFor="portfolio-item-skills" className="mb-1.5 block text-xs font-medium text-foreground">
                    Skills <span className="font-normal text-muted-foreground">(comma-separated, optional)</span>
                  </label>
                  <input
                    id="portfolio-item-skills"
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. Research, Teamwork"
                    className={INPUT_CLASSES}
                  />
                  {parsedSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-live="polite">
                      {parsedSkills.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-foreground" id="portfolio-item-visibility-label">
                    Who can see this
                  </p>
                  <div role="radiogroup" aria-labelledby="portfolio-item-visibility-label" className="flex flex-wrap gap-1.5">
                    {VISIBILITIES.map((v) => {
                      const selected = visibility === v
                      return (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setVisibility(v)}
                          className={cn(
                            'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors sm:min-h-0 sm:py-1.5',
                            selected
                              ? 'border-primary/30 bg-primary/[0.08] text-primary'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                          )}
                        >
                          {visibilityLabel(v)}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Visibility follows school policy — your teacher and class can see Class and School items.
                  </p>
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
                  {isEdit ? (
                    <>
                      <Pencil className="h-4 w-4" aria-hidden />
                      Save changes
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" aria-hidden />
                      Add to portfolio
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
