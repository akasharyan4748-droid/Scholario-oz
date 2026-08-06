'use client'

import { motion } from 'framer-motion'
import { Clock, Download, Star, MessageSquare } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Homework } from '@/lib/mock/academics'
import type { Submission } from './data'
import { SubjectTag, StatusChip } from './shared'

interface Props {
  selected: Homework | null
  onClose: () => void
  submissions: Record<string, Submission[]>
}

export function SubmissionsDialog({ selected, onClose, submissions }: Props) {
  return (
    <Dialog open={!!selected} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {selected && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <SubjectTag subject={selected.subject} />
                <Badge variant="outline" className="text-[10px]">{selected.className}</Badge>
                <StatusChip status={selected.status} />
              </div>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>{selected.description}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GradientAvatar name={selected.assignedBy} size="sm" />
              <span>Assigned by <span className="font-semibold text-foreground">{selected.assignedBy}</span> on {formatDate(selected.assignedOn)} · Due {formatDate(selected.dueDate)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Submitted</p>
                <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{submissions[selected.id]?.filter((s) => s.status === 'Submitted' || s.status === 'Reviewed').length}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Pending</p>
                <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">{submissions[selected.id]?.filter((s) => s.status === 'Pending').length}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Late</p>
                <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">{submissions[selected.id]?.filter((s) => s.status === 'Late').length}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 custom-scroll">
              {submissions[selected.id]?.map((s, i) => (
                <SubmissionRow key={s.rollNo} s={s} i={i} />
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => toast.success('Reminders sent', { description: 'SMS dispatched to parents of pending students.' })}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Remind Pending
              </Button>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubmissionRow({ s, i }: { s: Submission; i: number }) {
  return (
    <motion.div
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
        {s.remark && (
          <p className="text-[11px] text-muted-foreground italic mt-0.5">&ldquo;{s.remark}&rdquo;</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusBadge
          status={s.status}
          variant={s.status === 'Reviewed' ? 'success' : s.status === 'Submitted' ? 'info' : s.status === 'Late' ? 'warning' : 'neutral'}
        />
        {s.rating && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star key={idx} className={cn('h-3 w-3', idx < s.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
            ))}
          </div>
        )}
      </div>
      {s.fileName && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success(`Downloading ${s.fileName}`)}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  )
}
