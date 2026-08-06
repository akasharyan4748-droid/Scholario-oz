'use client'

import { motion } from 'framer-motion'
import {
  BookOpen, Calendar, Plus, Clock, CheckCircle2, Circle, PlayCircle,
  Target, ListChecks, FileText, ChevronRight,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { lessonPlans, type LessonPlan } from '@/lib/mock/lessons'
import { cn } from '@/lib/utils'
import { statusConfig } from './data'

// Weekly Plans tab — grid of lesson plan cards.
// Each card opens the detail dialog via `onSelect`.
export function WeeklyPlansTab({ onSelect }: { onSelect: (plan: LessonPlan) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {lessonPlans.map((plan, i) => {
        const cfg = statusConfig[plan.status]
        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full hover:shadow-premium-lg transition-shadow cursor-pointer" >
              <div onClick={() => onSelect(plan)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md',
                      plan.subject === 'Mathematics' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-cyan-500 to-sky-600'
                    )}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{plan.topic}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.subject} · {plan.className}</p>
                    </div>
                  </div>
                  <StatusBadge status={cfg.label} variant={cfg.variant} dot />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Date</p>
                    <p className="text-xs font-semibold mt-0.5">{new Date(plan.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Period</p>
                    <p className="text-xs font-semibold mt-0.5">{plan.period.split('·')[0].trim()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Duration</p>
                    <p className="text-xs font-semibold mt-0.5">{plan.duration}</p>
                  </div>
                </div>

                {/* Objectives preview */}
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5 flex items-center gap-1">
                    <Target className="h-3 w-3" /> Learning Objectives
                  </p>
                  <ul className="space-y-1">
                    {plan.objectives.slice(0, 2).map((o, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="line-clamp-1">{o}</span>
                      </li>
                    ))}
                    {plan.objectives.length > 2 && (
                      <li className="text-[10px] text-muted-foreground/60">+{plan.objectives.length - 2} more</li>
                    )}
                  </ul>
                </div>

                {/* Progress (if completed/in-progress) */}
                {plan.status !== 'planned' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Delivery progress</span>
                      <span className="font-semibold">{plan.progress}%</span>
                    </div>
                    <ProgressBar value={plan.progress} color={plan.status === 'completed' ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'} height={5} />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <ListChecks className="h-2.5 w-2.5" /> {plan.activities.length} activities
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <FileText className="h-2.5 w-2.5" /> {plan.resources.length} resources
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] font-medium text-primary hover:gap-1.5 transition-all">
                    View <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}
