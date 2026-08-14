'use client'

/**
 * ReviewSubmissionDialog — teacher reviews a student's submission.
 * Marks + feedback + return/resubmit actions.
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useHomeworkAction } from '@/lib/homework/use-homework'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'

interface Props {
  submission: any
  homework: any
  onClose: () => void
  onReviewed: () => void
}

export function ReviewSubmissionDialog({ submission, homework, onClose, onReviewed }: Props) {
  const { action, loading } = useHomeworkAction()
  const [marks, setMarks] = useState<string>(submission.marks !== null ? String(submission.marks) : '')
  const [grade, setGrade] = useState<string>(submission.grade ?? '')
  const [feedback, setFeedback] = useState<string>(submission.feedback ?? '')
  const [privateNote, setPrivateNote] = useState<string>(submission.privateNote ?? '')

  const maxMarks = homework.maxMarks ?? 0
  const marksNum = parseFloat(marks)
  const marksValid = marks === '' || (!isNaN(marksNum) && marksNum >= 0 && (maxMarks === 0 || marksNum <= maxMarks))
  const marksExceeds = marks !== '' && maxMarks > 0 && !isNaN(marksNum) && marksNum > maxMarks

  const handleAction = async (reviewAction: 'review' | 'return' | 'resubmit') => {
    if (!marksValid && reviewAction === 'review') {
      toast.error('Invalid marks', { description: `Enter a value between 0 and ${maxMarks}.` })
      return
    }
    try {
      await action(homework.id, {
        action: 'review',
        submissionId: submission.id,
        marks: marks === '' ? undefined : marksNum,
        grade: grade || undefined,
        feedback: feedback || undefined,
        privateNote: privateNote || undefined,
        reviewAction,
      })
      const labels = { review: 'Reviewed', return: 'Returned', resubmit: 'Resubmission requested' }
      toast.success(labels[reviewAction])
      onReviewed()
    } catch (e: any) {
      toast.error(`Failed to ${reviewAction}`, { description: e.message })
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[88vh] overflow-y-auto">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-semibold">Review Submission</DialogTitle>
          <DialogDescription className="text-[10px]">
            {submission.studentName} (#{submission.studentRollNo ?? '—'}) · {homework.title}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Submission info */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[9px] uppercase font-semibold text-muted-foreground">Status</p>
                <p className="text-xs font-medium">{submission.status}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-semibold text-muted-foreground">Submitted</p>
                <p className="text-xs font-medium">
                  {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-semibold text-muted-foreground">Late</p>
                <p className="text-xs font-medium">
                  {submission.submittedLate ? `Yes (${submission.lateByMinutes ? `${Math.floor(submission.lateByMinutes / 60)}h ${submission.lateByMinutes % 60}m` : 'Late'})` : 'No'}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-semibold text-muted-foreground">Attempt</p>
                <p className="text-xs font-medium">#{submission.attemptNumber}</p>
              </div>
            </div>
          </div>

          {/* Student response */}
          {submission.responseText && (
            <div>
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Student Response</Label>
              <div className="mt-1 rounded-lg border border-border/60 bg-card p-3 max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs font-sans">{submission.responseText}</pre>
              </div>
            </div>
          )}

          {/* Attachments */}
          {submission.attachments && submission.attachments.length > 0 && (
            <div>
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Attachments</Label>
              <div className="mt-1 space-y-1">
                {submission.attachments.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded border border-border/40">
                    <span className="text-xs flex-1 truncate">{a.name}</span>
                    <span className="text-[9px] text-muted-foreground">{a.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review form */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h3 className="text-xs font-semibold">Review</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px]">Marks {maxMarks > 0 && `(max ${maxMarks})`}</Label>
                <Input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="0"
                  className={cn(
                    'h-8 text-xs',
                    marksExceeds && 'border-rose-500/50 bg-rose-500/5',
                  )}
                  disabled={loading}
                />
                {marksExceeds && (
                  <p className="text-[9px] text-rose-600 mt-0.5">Cannot exceed {maxMarks}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px]">Grade (optional)</Label>
                <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="A+" className="h-8 text-xs" disabled={loading} />
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Feedback</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback for the student…" className="text-xs min-h-[60px]" disabled={loading} />
            </div>
            <div>
              <Label className="text-[10px]">Private Note (teacher only)</Label>
              <Textarea value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} placeholder="Internal notes not shared with student…" className="text-xs min-h-[40px]" disabled={loading} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction('review')} disabled={loading || !marksValid}>
              <CheckCircle2 className="h-3 w-3" /> Save Review
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('return')} disabled={loading}>
              <RotateCcw className="h-3 w-3" /> Return to Student
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('resubmit')} disabled={loading}>
              <AlertTriangle className="h-3 w-3" /> Request Resubmission
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
