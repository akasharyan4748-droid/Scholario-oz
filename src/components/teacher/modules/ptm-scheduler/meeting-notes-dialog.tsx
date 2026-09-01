'use client'

import { motion } from 'framer-motion'
import {
  Video, PhoneCall, Users, CheckCircle2, AlertCircle, Star,
} from 'lucide-react'
import { type PTMSlot } from '@/lib/mock/ptm'
import { toast } from 'sonner'

export function MeetingNotesDialog({
  activeSlot,
  notes,
  onNotesChange,
  onClose,
  onSave,
}: {
  activeSlot: PTMSlot
  notes: string
  onNotesChange: (value: string) => void
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
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors">✕</button>
          <p className="text-xs text-amber-50/90 mb-1">{activeSlot.time} · {activeSlot.duration}</p>
          <h2 className="font-display text-lg font-bold">Meeting with {activeSlot.parentName}</h2>
          <p className="text-amber-50/90 text-sm">Parent of {activeSlot.studentName} (Roll #{activeSlot.rollNo})</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => toast.info('Video call starting')} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent transition-colors">
              <Video className="h-4 w-4 text-violet-500" />
              <span className="text-[10px] font-medium">Video Call</span>
            </button>
            <button onClick={() => toast.info('Connecting call')} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent transition-colors">
              <PhoneCall className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-medium">Call Parent</span>
            </button>
            <button onClick={() => toast.info('Opening student profile')} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent transition-colors">
              <Users className="h-4 w-4 text-sky-500" />
              <span className="text-[10px] font-medium">Student File</span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Meeting Notes</p>
            <textarea
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
                <button key={r} className="text-muted-foreground hover:text-amber-400 transition-colors">
                  <Star className="h-6 w-6 hover:fill-amber-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" /> Complete Meeting
            </button>
            <button
              onClick={() => { toast.success('Reschedule requested', { description: 'Parent notified of reschedule option' }); onClose() }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <AlertCircle className="h-4 w-4" /> Reschedule
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
