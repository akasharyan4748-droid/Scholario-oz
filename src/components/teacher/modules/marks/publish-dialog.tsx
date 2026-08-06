'use client'

import { motion } from 'framer-motion'
import { Send, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import type { Exam } from '@/lib/mock/academics'
import { students } from '@/lib/mock/students'
import type { MarksStats } from './data'

// Publish confirmation dialog. Caller controls `open` and `publishing` state.
export function PublishDialog({
  open,
  onOpenChange,
  exam,
  subject,
  stats,
  maxMarks,
  publishing,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  exam: Exam | undefined
  subject: string
  stats: MarksStats
  maxMarks: number
  publishing: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle>Publish Examination Results?</DialogTitle>
          <DialogDescription>
            Once published, results will be visible to students and parents. This action cannot be undone without admin approval.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Examination</span><span className="font-medium">{exam?.name}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subject</span><span className="font-medium">{subject}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Class</span><span className="font-medium">Class 2-A · {students.length} students</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Class Average</span><span className="font-medium">{stats.avg.toFixed(1)}/{maxMarks}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Pass Rate</span><span className="font-medium text-emerald-600">{((stats.passCount / stats.total) * 100).toFixed(0)}%</span></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={onConfirm} disabled={publishing} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            {publishing ? (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
              </motion.span>
            ) : (
              <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Confirm & Publish</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
