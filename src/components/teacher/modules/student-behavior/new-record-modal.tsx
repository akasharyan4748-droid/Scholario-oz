'use client'

import { motion } from 'framer-motion'
import { Frown, Meh, Smile, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
}

const TYPE_BUTTONS = [
  { type: 'positive' as const, icon: <Smile className="h-5 w-5" />, label: 'Positive', color: 'border-emerald-500 bg-emerald-500/5' },
  { type: 'concern' as const, icon: <Meh className="h-5 w-5" />, label: 'Concern', color: 'border-amber-500 bg-amber-500/5' },
  { type: 'incident' as const, icon: <Frown className="h-5 w-5" />, label: 'Incident', color: 'border-rose-500 bg-rose-500/5' },
]

export function NewRecordModal({ onClose }: Props) {
  const handleAdd = () => {
    toast.success('Behavior record added', { description: 'Parent notified via SMS + email' })
    onClose()
  }

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
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors">✕</button>
          <h2 className="font-display text-lg font-bold">Record Behavior</h2>
          <p className="text-amber-50/90 text-xs mt-0.5">Log a positive, concern, or incident</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {TYPE_BUTTONS.map((t) => (
              <button key={t.type} className={cn('flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all', t.color)}>
                {t.icon}
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Student</p>
            <select className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50">
              <option>Aarav Sharma — Roll #18</option>
              <option>Diya Patel — Roll #02</option>
              <option>Vivaan Reddy — Roll #03</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Category</p>
            <select className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50">
              <option>Helpfulness</option>
              <option>Academic Excellence</option>
              <option>Leadership</option>
              <option>Discipline</option>
              <option>Incomplete Homework</option>
              <option>Attendance</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Description</p>
            <textarea placeholder="Describe the behavior…" rows={3} className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Points</p>
            <input type="number" placeholder="+5 or -3" className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="rounded accent-primary" />
            Notify parent via SMS + email
          </label>
          <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md">
            <Sparkles className="h-4 w-4" /> Save Behavior Record
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
