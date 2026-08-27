'use client'

// Assignment details / grading dialog: rubric breakdown with per-criterion
// marks bars, three-tile stats row (Total / Avg-or-Submitted / Top-or-Pending),
// and a scrollable list of mock student submissions with status badges and
// graded scores.

import { motion } from 'framer-motion'
import {
  Clock, CheckCircle2, FileText, Star, Target, BarChart3,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { type Assignment } from '@/lib/mock/academics'
import { makeStudentSubmissions, statusVariant, subjectColor } from './data'

interface AssignmentDetailsDialogProps {
  selected: Assignment | null
  onClose: () => void
}

export function AssignmentDetailsDialog({ selected, onClose }: AssignmentDetailsDialogProps) {
  return (
    <Dialog open={!!selected} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {selected && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="rounded-md text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide"
                  style={{ background: `${subjectColor(selected.subject)}1a`, color: subjectColor(selected.subject) }}
                >
                  {selected.subject}
                </span>
                <Badge variant="outline" className="text-[10px]">{selected.className}</Badge>
                <StatusBadge status={selected.status} variant={statusVariant[selected.status]} dot />
              </div>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>Due {formatDate(selected.dueDate)} · {selected.marks} marks</DialogDescription>
            </DialogHeader>

            {/* Rubric breakdown */}
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" /> Rubric Breakdown
              </p>
              <div className="space-y-1.5">
                {selected.rubric.map((r, i) => {
                  const marksMatch = r.match(/\((\d+)\)/)
                  const marks = marksMatch ? parseInt(marksMatch[1]) : Math.round(selected.marks / selected.rubric.length)
                  const name = r.replace(/\s*\(\d+\)\s*$/, '')
                  const pct = (marks / selected.marks) * 100
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-medium min-w-0 flex-1 truncate">{name}</span>
                      <div className="w-24"><ProgressBar value={pct} color={subjectColor(selected.subject)} height={5} /></div>
                      <span className="text-xs font-mono font-semibold w-8 text-right">{marks}</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="font-display text-lg font-bold">{makeStudentSubmissions(selected).length}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{selected.status === 'Graded' ? 'Avg Score' : 'Submitted'}</p>
                <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {selected.status === 'Graded' && selected.obtainedMarks != null
                    ? `${Math.round((selected.obtainedMarks / selected.marks) * 100)}%`
                    : makeStudentSubmissions(selected).filter((s) => s.aStatus !== 'Pending').length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{selected.status === 'Graded' ? 'Top Score' : 'Pending'}</p>
                <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">
                  {selected.status === 'Graded'
                    ? `${Math.round(selected.marks * 0.96)}/${selected.marks}`
                    : makeStudentSubmissions(selected).filter((s) => s.aStatus === 'Pending').length}
                </p>
              </div>
            </div>

            {/* Student submissions list */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 custom-scroll">
              <p className="text-xs font-semibold text-muted-foreground px-1">Student Submissions</p>
              {makeStudentSubmissions(selected).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <GradientAvatar name={s.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">#{s.rollNo}</span>
                    </div>
                    {s.submittedAt && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" /> {s.submittedAt}
                      </p>
                    )}
                    {s.remark && (
                      <p className="text-[11px] text-muted-foreground italic mt-0.5">&ldquo;{s.remark}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge
                      status={s.aStatus}
                      variant={s.aStatus === 'Graded' ? 'success' : s.aStatus === 'Submitted' ? 'info' : 'warning'}
                    />
                    {s.aStatus === 'Graded' && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold">{s.obtained}/{selected.marks}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => toast.success('Report exported', { description: `${selected.title}-evaluation.xlsx` })}
              >
                <FileText className="h-3.5 w-3.5" /> Export
              </Button>
              {selected.status !== 'Graded' ? (
                <Button
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  onClick={() => {
                    toast.success('Evaluation started', { description: `${selected.title} · ${makeStudentSubmissions(selected).length} submissions queued for grading.` })
                    onClose()
                  }}
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Evaluate All
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Close
                  </Button>
                </DialogClose>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
