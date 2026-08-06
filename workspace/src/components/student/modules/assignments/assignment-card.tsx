'use client'

import { motion } from 'framer-motion'
import {
  ClipboardList, Clock, CheckCircle2, Award, Send, FileText, Star,
} from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { Assignment } from '@/lib/mock/academics'
import { subjectColor } from './data'

interface AssignmentCardProps {
  a: Assignment
  submitted: boolean
  onSubmit: () => void
  index: number
}

export function AssignmentCard({ a, submitted, onSubmit, index }: AssignmentCardProps) {
  const sc = subjectColor(a.subject)
  const isGraded = a.status === 'Graded'
  const isSubmitted = a.status === 'Submitted' || submitted
  const dueDate = new Date(a.dueDate)
  const today = new Date('2024-11-27')
  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <GlassCard className={`p-5 ${isGraded ? 'border-emerald-500/20' : ''}`} hover>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sc.gradient} text-white shadow-md`}>
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.subject} · {a.marks} marks</p>
            </div>
          </div>
          {isGraded ? (
            <StatusBadge status="Graded" variant="success" dot />
          ) : isSubmitted ? (
            <StatusBadge status="Submitted" variant="info" dot />
          ) : daysLeft < 0 ? (
            <StatusBadge status="Overdue" variant="danger" dot />
          ) : (
            <StatusBadge status={`${daysLeft}d left`} variant="warning" dot />
          )}
        </div>

        {/* Rubric breakdown */}
        <div className="rounded-xl border border-border bg-card/40 p-3 mb-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Rubric Breakdown
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {a.rubric.map((r, ri) => (
              <div key={ri} className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graded: show marks + remarks */}
        {isGraded && a.obtainedMarks !== undefined && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[11px] text-muted-foreground">Marks Obtained</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-display text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{a.obtainedMarks}</span>
                  <span className="text-sm text-muted-foreground">/ {a.marks}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= 5 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 pt-2 border-t border-emerald-500/20">
              <GradientAvatar name="Kavita Joshi" size="sm" />
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Teacher's Comment</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{a.remarks}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Due {formatDate(a.dueDate)}</span>
          </div>
          {isGraded ? (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <Award className="h-3 w-3" /> Completed
            </Badge>
          ) : isSubmitted ? (
            <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
              <CheckCircle2 className="h-3 w-3" /> Pending Review
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onSubmit}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              <Send className="h-3.5 w-3.5" /> Submit
            </Button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
