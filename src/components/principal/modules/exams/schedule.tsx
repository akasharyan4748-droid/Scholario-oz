'use client'

// "All Exams" list — the exam-schedule view: one card per exam in the roster.

import { motion } from 'framer-motion'
import {
  FileText, Users, BookOpen, ChevronRight, Award, Download, BarChart3,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { exams, type Exam } from '@/lib/mock/academics'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { examStatusVariant, emeraldGradientBtn } from './data'
import { ExamTypeBadge } from './shared'

export interface ScheduleCallbacks {
  onViewDetails: (exam: Exam) => void
  onOpenResult: (examId: string) => void
}

export function ExamsSchedule({ callbacks }: { callbacks: ScheduleCallbacks }) {
  const { onViewDetails, onOpenResult } = callbacks
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">All Exams</h3>
        <p className="text-xs text-muted-foreground">
          {exams.length} exams · {exams.filter((e) => e.status === 'Result Declared').length} results declared
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {exams.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full" hover>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <ExamTypeBadge type={e.type} />
                    <StatusBadge status={e.status} variant={examStatusVariant[e.status]} dot />
                  </div>
                  <p className="font-semibold text-sm">{e.name}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Start</p>
                  <p className="text-xs font-semibold">{formatDate(e.startDate)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">End</p>
                  <p className="text-xs font-semibold">{formatDate(e.endDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.classes.join(', ')}</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {e.subjects} subjects</span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => onViewDetails(e)}>
                  Details <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {e.status === 'Result Declared' ? (
                  <Button
                    size="sm"
                    className={`h-8 flex-1 ${emeraldGradientBtn}`}
                    onClick={() => onOpenResult(e.id)}
                  >
                    <Award className="h-3.5 w-3.5" /> Results
                  </Button>
                ) : e.status === 'Scheduled' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1"
                    onClick={() => toast.info('Hall tickets will be available 7 days before exam', { description: `${e.name} · ${formatDate(e.startDate)}` })}
                  >
                    <Download className="h-3.5 w-3.5" /> Hall Tickets
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1"
                    onClick={() => onOpenResult(e.id)}
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> Generate Result
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
