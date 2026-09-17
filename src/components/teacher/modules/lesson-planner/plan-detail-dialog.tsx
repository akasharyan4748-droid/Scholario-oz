'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, CheckCircle2, PlayCircle, Target, ListChecks,
  FileText, ClipboardList,
} from 'lucide-react'
import type { LessonPlan } from '@/lib/mock/lessons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Lesson plan detail dialog. Renders nothing when `plan` is null.
// AnimatePresence is owned here so the parent only needs to render the
// component once with the current (possibly null) plan.
export function PlanDetailDialog({ plan, onClose }: { plan: LessonPlan | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {plan && (
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
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border glass-strong shadow-premium-lg"
          >
            {/* Header */}
            <div className={cn('p-5 text-white', plan.subject === 'Mathematics' ? 'bg-gradient-to-br from-violet-600 to-purple-700' : 'bg-gradient-to-br from-cyan-600 to-sky-700')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-white/80 mb-1">{plan.subject} · {plan.className}</p>
                  <h2 className="font-display text-xl font-bold">{plan.topic}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/90">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(plan.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {plan.period}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {plan.duration}</span>
                  </div>
                </div>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-primary" /> Learning Objectives
                </p>
                <ul className="space-y-1.5">
                  {plan.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                  <ListChecks className="h-3 w-3 text-primary" /> Teaching Activities
                </p>
                <div className="space-y-2">
                  {plan.activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 p-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-primary" /> Resources
                  </p>
                  <ul className="space-y-1">
                    {plan.resources.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                    <ClipboardList className="h-3 w-3 text-primary" /> Homework
                  </p>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-sm text-amber-900 dark:text-amber-200">
                    {plan.homework}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => { toast.success('Lesson started', { description: 'Marked as in-progress' }); onClose() }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md"
                >
                  <PlayCircle className="h-4 w-4" /> Start Lesson
                </button>
                <button
                  onClick={() => { toast.success('Lesson completed', { description: 'Progress updated to 100%' }); onClose() }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Complete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
