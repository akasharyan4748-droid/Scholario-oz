'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb } from 'lucide-react'
import { mentees } from '@/lib/mock/mentoring'
import { toast } from 'sonner'

// Log Session modal. Renders nothing when `open` is false. The dialog owns
// its own AnimatePresence so the parent just renders `<LogSessionDialog
// open={...} onClose={...} />` once.
export function LogSessionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
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
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
              <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
              <h2 className="font-display text-lg font-bold">Log Mentoring Session</h2>
              <p className="text-amber-50/90 text-xs mt-0.5">Record a 1-on-1 mentoring session</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Mentee</p>
                <select className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50">
                  {mentees.map((m) => <option key={m.id}>{m.name} — Roll #{m.rollNo}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Topic</p>
                <input placeholder="e.g. Academic progress & confidence building" className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Duration</p>
                  <select className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50">
                    <option>15 min</option><option>20 min</option><option>25 min</option><option>30 min</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Rating</p>
                  <select className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50">
                    <option>5 — Excellent</option><option>4 — Good</option><option>3 — Average</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Session Summary</p>
                <textarea placeholder="What was discussed? Key observations..." rows={3} className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
              </div>
              <button
                onClick={() => { toast.success('Session logged', { description: 'Mentoring session recorded' }); onClose() }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md"
              >
                <Lightbulb className="h-4 w-4" /> Save Session Log
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
