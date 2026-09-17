'use client'

import { motion } from 'framer-motion'
import {
  Clock, CheckCircle2, Circle, PlayCircle, Sparkles, Lightbulb,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar, Donut } from '@/components/shared/charts'
import { mathematicsCurriculum } from '@/lib/mock/lessons'
import { cn } from '@/lib/utils'
import { aiSuggestions } from './data'

// Curriculum Map tab — annual syllabus table + syllabus coverage donut +
// AI suggestions panel. All values are derived from `mathematicsCurriculum`.
export function CurriculumTab() {
  const curriculumDone = mathematicsCurriculum.filter((t) => t.status === 'done').length
  const curriculumTotal = mathematicsCurriculum.length
  const curriculumProgress = Math.round((curriculumDone / curriculumTotal) * 100)

  const curriculumDonut = [
    { name: 'Completed', value: curriculumDone, color: 'oklch(0.55 0.14 162)' },
    { name: 'Ongoing', value: mathematicsCurriculum.filter((t) => t.status === 'ongoing').length, color: 'oklch(0.65 0.16 75)' },
    { name: 'Upcoming', value: mathematicsCurriculum.filter((t) => t.status === 'upcoming').length, color: 'oklch(0.85 0.01 160)' },
  ]

  // Returns a fragment of the two grid items (table card + side panel) so the
  // parent motion.div can act as the grid container (preserving the original
  // layout where the motion.div itself is the grid).
  return (
    <>
      {/* Curriculum table */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Mathematics — Class 2-A Curriculum</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Annual syllabus mapping · CBSE</p>
          </div>
          <StatusBadge status={`${curriculumProgress}% complete`} variant="success" dot />
        </div>
        <div className="space-y-1">
          {mathematicsCurriculum.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors',
                topic.status === 'done' ? 'border-emerald-500/20 bg-emerald-500/5' :
                topic.status === 'ongoing' ? 'border-amber-500/30 bg-amber-500/5' :
                'border-border bg-card/40'
              )}
            >
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs',
                topic.status === 'done' ? 'bg-emerald-500/15 text-emerald-600' :
                topic.status === 'ongoing' ? 'bg-amber-500/15 text-amber-600' :
                'bg-muted text-muted-foreground'
              )}>
                {topic.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : topic.status === 'ongoing' ? <PlayCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{topic.topic}</p>
                <p className="text-[10px] text-muted-foreground">{topic.unit}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {topic.hours}h
              </div>
              <div className="w-20">
                <ProgressBar value={topic.completed} max={topic.hours} color={topic.status === 'done' ? 'oklch(0.55 0.14 162)' : topic.status === 'ongoing' ? 'oklch(0.65 0.16 75)' : 'var(--muted-foreground)'} height={5} />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{Math.round((topic.completed / topic.hours) * 100)}%</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Curriculum donut + AI suggestions */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3">Syllabus Coverage</h3>
          <Donut data={curriculumDonut} centerValue={`${curriculumProgress}%`} centerLabel="complete" height={200} />
          <div className="mt-3 space-y-2">
            {curriculumDonut.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold">{d.value} topics</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" /> AI Suggestions
          </h3>
          <div className="space-y-2.5">
            {aiSuggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-2.5"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-relaxed">{s.text}</p>
                  <span className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium', s.color)}>{s.tag}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  )
}
