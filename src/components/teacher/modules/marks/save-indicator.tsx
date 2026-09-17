'use client'

/**
 * marks/save-indicator — the autosave status pill shown in the ModuleToolbar
 * action area, next to "Submit marks".
 *
 * States: Unsaved changes (edits queued, debounce running) → Saving… →
 * All changes saved. A failed save renders as a quiet rose retry button so
 * the teacher can push the same entries again without losing them.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function SaveIndicator({
  state,
  onRetry,
}: {
  state: SaveState
  onRetry?: () => void
}) {
  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        title="Retry saving your marks"
        className="flex h-9 items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        Couldn&rsquo;t save — retry
      </button>
    )
  }

  return (
    <div className="flex h-9 items-center text-xs" role="status" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            Unsaved changes
          </motion.span>
        )}
        {state === 'saving' && (
          <motion.span
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
          >
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Saving…
          </motion.span>
        )}
        {state === 'saved' && (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn('flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400')}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            All changes saved
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
