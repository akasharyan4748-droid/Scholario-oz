'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'

// Auto-save status indicator shown next to the Publish button in the
// SectionHeading action slot.
export function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'saved' }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' && (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Unsaved
          </motion.span>
        )}
        {state === 'saving' && (
          <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </motion.span>
        )}
        {state === 'saved' && (
          <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Auto-saved
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
