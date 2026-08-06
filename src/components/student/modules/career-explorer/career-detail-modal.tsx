'use client'

import { motion } from 'framer-motion'
import { X, Target, GraduationCap, Bookmark, BookmarkCheck, Lightbulb } from 'lucide-react'
import { type CareerPath } from '@/lib/mock/career'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CareerDetailModalProps {
  selected: CareerPath | null
  saved: Set<string>
  onToggleSave: (id: string) => void
  onClose: () => void
}

export function CareerDetailModal({ selected, saved, onToggleSave, onClose }: CareerDetailModalProps) {
  if (!selected) return null
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
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
      >
        <div className={cn('bg-gradient-to-br p-5 text-white', selected.gradient)}>
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-3xl">{selected.icon}</div>
            <div>
              <p className="text-[10px] text-white/80 font-medium uppercase">{selected.field}</p>
              <h2 className="font-display text-lg font-bold">{selected.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded bg-white/15 px-1.5 py-0 text-[10px] font-bold">{selected.matchScore}% match</span>
                <span className="text-xs">🔥 {selected.popularity}% popular</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed">{selected.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-[10px] text-muted-foreground">Avg Salary</p>
              <p className="text-sm font-bold text-emerald-600">{selected.avgSalary}</p>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-[10px] text-muted-foreground">Growth Rate</p>
              <p className="text-sm font-bold text-violet-600">{selected.growthRate}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1"><Target className="h-3 w-3" /> Required Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.requiredSkills.map((s) => (
                <span key={s} className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Education Path</p>
            <div className="space-y-2">
              {selected.educationPath.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-[10px] font-bold text-violet-600">{idx + 1}</span>
                  <span className="text-xs">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { onToggleSave(selected.id) }}
              className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold shadow-md transition-colors',
                saved.has(selected.id) ? 'bg-amber-500/15 text-amber-600' : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
              )}
            >
              {saved.has(selected.id) ? <><BookmarkCheck className="h-4 w-4" /> Saved</> : <><Bookmark className="h-4 w-4" /> Save Career</>}
            </button>
            <button
              onClick={() => { toast.success('Counselor session booked', { description: `Discuss ${selected.title}` }); onClose() }}
              className="flex items-center justify-center rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
