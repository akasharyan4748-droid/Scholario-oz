'use client'

import { motion } from 'framer-motion'
import { Clock, Star, Award, Download } from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Assignment } from '@/lib/mock/academics'
import { statusVariant, type Submission } from './data'

interface SubmissionsDialogProps {
  selected: Assignment | null
  submissions: Submission[]
  onClose: () => void
  onGrade: (asg: Assignment, sub: Submission) => void
}

export function SubmissionsDialog({ selected, submissions, onClose, onGrade }: SubmissionsDialogProps) {
  return (
    <Dialog open={!!selected} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {selected && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">{selected.subject}</span>
                <StatusBadge status={selected.status} variant={statusVariant(selected.status as Submission['status'])} dot />
              </div>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>
                Due {formatDate(selected.dueDate)} · {selected.marks} marks · Rubric with {selected.rubric.length} criteria
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Submitted</p>
                <p className="font-display text-lg font-bold text-info">{submissions.filter((s) => s.status === 'Submitted').length}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Graded</p>
                <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{submissions.filter((s) => s.status === 'Graded').length}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Pending</p>
                <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">{submissions.filter((s) => s.status === 'Pending').length}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2">
              {submissions.map((s, i) => (
                <motion.div
                  key={s.rollNo}
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
                        <Clock className="h-2.5 w-2.5" /> Submitted {s.submittedAt}
                      </p>
                    )}
                    {s.remarks && <p className="text-[11px] text-muted-foreground italic mt-0.5">"{s.remarks}"</p>}
                  </div>
                  {s.obtained != null && (
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-sm text-emerald-600 dark:text-emerald-400">{s.obtained}/{selected.marks}</p>
                      <div className="flex items-center gap-0.5 justify-end mt-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={cn('h-2.5 w-2.5', idx < Math.round((s.obtained! / selected.marks) * 5) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                        ))}
                      </div>
                    </div>
                  )}
                  <StatusBadge status={s.status} variant={statusVariant(s.status)} />
                  {s.file && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success(`Downloading ${s.file}`)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {s.status === 'Submitted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                      onClick={() => onGrade(selected, s)}
                    >
                      <Award className="h-3.5 w-3.5" /> Grade
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            <DialogFooter>
              <DialogClose asChild><Button>Close</Button></DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
