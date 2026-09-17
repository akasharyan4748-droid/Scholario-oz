'use client'

/**
 * SharePickerModal — "Share a resource" (spec §41).
 *
 * Lists the learning store's REAL bookmarked + recently-studied
 * resources (permission-controlled sharing: only content the student
 * already has in their own library — never private notes or unseen
 * documents). Picking one + optional note calls `addShare()`: the
 * share is class-scoped, authored by the demo student ("You") and
 * starts saved to the collection.
 *
 * Accessible dialog: role=dialog + aria-modal, Escape closes
 * (useDismissOnEscape), backdrop click closes, bottom sheet on
 * mobile / centered from sm up.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, History, X } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { subjectColor } from '../timetable/subject-colors'
import { TypeChip, sizeLabelOf } from '../resources/type-meta'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentLearningStore, type LearningResource } from '@/lib/store/student-learning-store'
import { useStudentGroupsStore } from '@/lib/store/student-groups-store'
import { BTN_PRIMARY, FIELD_CLASSES, FieldLabel } from './shared'

interface SharePickerModalProps {
  open: boolean
  onClose: () => void
}

interface Candidate {
  resource: LearningResource
  marker: 'saved' | 'studied'
  lastStudiedAt?: string | null
}

export function SharePickerModal({ open, onClose }: SharePickerModalProps) {
  const resources = useStudentLearningStore((s) => s.resources)
  const bookmarks = useStudentLearningStore((s) => s.bookmarks)
  const progress = useStudentLearningStore((s) => s.progress)
  const shares = useStudentGroupsStore((s) => s.shares)
  const addShare = useStudentGroupsStore((s) => s.addShare)

  const [resourceId, setResourceId] = useState('')
  const [note, setNote] = useState('')

  // Bookmarked first, then recently studied — the student's own library.
  const candidates = useMemo<Candidate[]>(() => {
    const out: Candidate[] = []
    const seen = new Set<string>()
    for (const id of bookmarks) {
      const resource = resources.find((r) => r.id === id)
      if (resource && !seen.has(id)) {
        seen.add(id)
        out.push({ resource, marker: 'saved' })
      }
    }
    const studied = Object.entries(progress)
      .filter(([, p]) => p.lastStudiedAt !== null)
      .sort((a, b) => ((a[1].lastStudiedAt ?? '') < (b[1].lastStudiedAt ?? '') ? 1 : -1))
    for (const [id, p] of studied) {
      const resource = resources.find((r) => r.id === id)
      if (resource && !seen.has(id)) {
        seen.add(id)
        out.push({ resource, marker: 'studied', lastStudiedAt: p.lastStudiedAt })
      }
    }
    return out.slice(0, 12)
  }, [bookmarks, progress, resources])

  const alreadyShared = useMemo(() => new Set(shares.map((sh) => sh.resourceId)), [shares])

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) return
    setResourceId('')
    setNote('')
  }, [open])

  useDismissOnEscape(onClose, open)

  const selected = candidates.find((c) => c.resource.id === resourceId) ?? null
  const valid = resourceId !== '' && !alreadyShared.has(resourceId)

  const submit = () => {
    if (!selected || !valid) return
    addShare({ resourceId: selected.resource.id, note })
    toast.success('Shared with Class 2-A', { description: selected.resource.title })
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
          aria-label="Share a resource with your class"
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
                <h2 className="text-base font-semibold leading-snug">Share a resource</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">From your saved & recently studied — with Class 2-A only.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close share dialog"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-foreground">
                  Pick a resource<span className="ml-0.5 text-rose-500" aria-hidden>*</span>
                </legend>
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {candidates.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Nothing in your library yet — study or save a resource first.
                    </p>
                  )}
                  {candidates.map(({ resource, marker, lastStudiedAt }) => {
                    const sc = subjectColor(resource.subject)
                    const shared = alreadyShared.has(resource.id)
                    const active = resourceId === resource.id
                    return (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => setResourceId(active ? '' : resource.id)}
                        aria-pressed={active}
                        disabled={shared}
                        aria-label={`${resource.title} — ${resource.subject}, ${resource.topic}${shared ? ' — already shared' : ''}`}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                          active
                            ? 'border-primary/50 bg-primary/[0.06]'
                            : 'border-border/80 bg-card/40 hover:bg-accent/40',
                          shared && 'cursor-not-allowed opacity-55',
                        )}
                      >
                        <TypeChip type={resource.type} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-foreground">{resource.title}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                            {resource.subject} · {resource.topic}
                            {sizeLabelOf(resource) && ` · ${sizeLabelOf(resource)}`}
                          </span>
                        </span>
                        {shared ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">Already shared</span>
                        ) : marker === 'saved' ? (
                          <Bookmark className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                        ) : (
                          <span className="flex shrink-0 items-center gap-0.5 text-[9px] font-medium text-muted-foreground">
                            <History className="h-3 w-3" aria-hidden />
                            {lastStudiedAt ? formatRelativeTime(lastStudiedAt) : ''}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div>
                <FieldLabel htmlFor="sh-note">Note for your class</FieldLabel>
                <textarea
                  id="sh-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={160}
                  placeholder="Why did this help you? (optional)"
                  className={cn(FIELD_CLASSES, 'resize-none')}
                />
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
                Share with class
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
