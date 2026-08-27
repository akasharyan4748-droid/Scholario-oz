'use client'

import { motion } from 'framer-motion'
import {
  BookOpen, ArrowRight, Award,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar, Donut } from '@/components/shared/charts'
import { homeworks, assignments, classToppers } from '@/lib/mock/academics'
import { formatDate } from '@/lib/format'
import { subjectSplit } from './data'

interface PendingReviewsProps {
  onNavigate: (key: string) => void
}

export function PendingReviews({ onNavigate }: PendingReviewsProps) {
  const myHomeworks = homeworks.filter((h) => h.assignedBy === 'Rohan Mehta')
  const myAssignments = assignments.filter((a) => a.subject === 'Mathematics' || a.subject === 'Computer Science')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <SectionHeading
          title="Pending Reviews"
          subtitle="Homework & assignments awaiting your action"
          icon={<BookOpen className="h-5 w-5" />}
          action={
            <button
              onClick={() => onNavigate('homework')}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              Open module <ArrowRight className="h-3 w-3" />
            </button>
          }
          className="mb-4"
        />
        <div className="space-y-3">
          {myHomeworks.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.subject} · Class 2-A · Due {formatDate(h.dueDate)}</p>
                </div>
                <StatusBadge status={h.status} variant={h.status === 'Active' ? 'warning' : 'success'} dot />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Submissions</span>
                    <span className="font-semibold">{h.submissions}/{h.total}</span>
                  </div>
                  <ProgressBar value={h.submissions} max={h.total} color="oklch(0.65 0.16 75)" height={6} />
                </div>
                <button
                  onClick={() => onNavigate('homework')}
                  className="shrink-0 rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  Review
                </button>
              </div>
            </motion.div>
          ))}
          {myAssignments.slice(0, 1).map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.15 }}
              className="rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subject} · Class 2-A · {a.marks} marks · Due {formatDate(a.dueDate)}</p>
                </div>
                <StatusBadge status={a.status} variant={a.status === 'Graded' ? 'success' : a.status === 'Submitted' ? 'info' : 'warning'} dot />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Rubric</span>
                    <span className="font-semibold">{a.rubric.length} criteria</span>
                  </div>
                  <ProgressBar value={a.status === 'Graded' ? 100 : a.status === 'Submitted' ? 60 : 30} color="oklch(0.6 0.18 300)" height={6} />
                </div>
                <button
                  onClick={() => onNavigate('assignments')}
                  className="shrink-0 rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  Grade
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-4">
        <TopPerformers />
        <SubjectLoad />
      </div>
    </div>
  )
}

function TopPerformers() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Award className="h-4 w-4 text-amber-500" /> Top Performers
      </h3>
      <div className="space-y-2.5">
        {classToppers.slice(0, 4).map((t, i) => (
          <motion.div
            key={t.rank}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
              i === 0 ? 'bg-amber-400/20 text-amber-600' : i === 1 ? 'bg-slate-300/30 text-slate-600' : i === 2 ? 'bg-orange-400/20 text-orange-600' : 'bg-muted text-muted-foreground'
            }`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : t.rank}
            </div>
            <GradientAvatar name={t.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">Roll #{t.rollNo}</p>
            </div>
            <span className="font-display font-bold text-sm text-emerald-600">{t.percentage}%</span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

function SubjectLoad() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-1">My Subject Load</h3>
      <p className="text-xs text-muted-foreground mb-3">Class 2-A · This term</p>
      <Donut data={subjectSplit} height={170} innerRadius={45} outerRadius={70} centerValue="40" centerLabel="hrs/wk" />
    </GlassCard>
  )
}
