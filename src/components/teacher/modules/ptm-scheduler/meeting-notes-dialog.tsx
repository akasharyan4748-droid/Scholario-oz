'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Star } from 'lucide-react'
import { type PTMSlot } from '@/lib/mock/ptm'
import { cn } from '@/lib/utils'

/**
 * Meeting notes dialog — the class teacher's working surface during a PTM
 * slot. Notes + parent-satisfaction rating persist through the ptm-store
 * when the meeting is marked complete. No simulated calls: contact
 * happens through Parent Connect.
 */
export function MeetingNotesDialog({
  activeSlot,
  notes,
  rating,
  onNotesChange,
  onRatingChange,
  onClose,
  onSave,
}: {
  activeSlot: PTMSlot
  notes: string
  rating: number
  onNotesChange: (value: string) => void
  onRatingChange: (value: number) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-label={`Meeting with ${activeSlot.parentName}`}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
          >
            ✕
          </button>
          <p className="text-xs text-amber-50/90 mb-1">{activeSlot.time} · {activeSlot.duration}</p>
          <h2 className="font-display text-lg font-bold">Meeting with {activeSlot.parentName}</h2>
          <p className="text-amber-50/90 text-sm">Parent of {activeSlot.studentName} (Roll #{activeSlot.rollNo})</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Notes */}
          <div>
            <label htmlFor="ptm-notes" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 block">
              Meeting Notes
            </label>
            <textarea
              id="ptm-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Record discussion points, progress, concerns, action items…"
              rows={5}
              className="w-full rounded-xl border border-border bg-card/60 p-3 text-sm outline-none focus:border-primary/50 resize-none"
            />
          </div>

          {/* Rating */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Parent Satisfaction</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRatingChange(r)}
                  aria-label={`Rate ${r} of 5`}
                  aria-pressed={rating === r}
                  className="text-muted-foreground hover:text-amber-400 transition-colors"
                >
                  <Star className={cn('h-6 w-6', r <= rating ? 'fill-amber-400 text-amber-400' : 'hover:fill-amber-400')} />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            >
              <CheckCircle2 className="h-4 w-4" /> Complete Meeting
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Completing the meeting saves these notes to your PTM record. Use Parent Connect for follow-up messages.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
