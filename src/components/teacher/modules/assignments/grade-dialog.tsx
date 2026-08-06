'use client'

import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import type { Assignment } from '@/lib/mock/academics'
import type { Submission } from './data'

export interface GradeFormState {
  obtained: string
  remarks: string
  rubricScores: string[]
}

interface GradeDialogProps {
  target: { asg: Assignment; sub: Submission } | null
  form: GradeFormState
  setForm: (form: GradeFormState) => void
  onClose: () => void
  onGrade: () => void
}

export function GradeSubmissionDialog({ target, form, setForm, onClose, onGrade }: GradeDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        {target && (
          <>
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <DialogDescription>
                {target.sub.name} · Roll #{target.sub.rollNo} · {target.asg.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Rubric Scoring</p>
                <div className="space-y-2">
                  {target.asg.rubric.map((r, idx) => {
                    const max = parseInt(r.match(/\((\d+)\)/)?.[1] ?? '5')
                    return (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground flex-1 truncate">{r}</span>
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          value={form.rubricScores[idx]}
                          onChange={(e) => {
                            const next = [...form.rubricScores]
                            next[idx] = e.target.value
                            setForm({ ...form, rubricScores: next })
                          }}
                          className="w-16 h-8 text-xs"
                        />
                        <span className="text-[10px] text-muted-foreground w-8">/{max}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="font-display font-bold text-amber-600 dark:text-amber-400">
                    {form.rubricScores.reduce((a, b) => a + (parseInt(b) || 0), 0)}/{target.asg.marks}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade-remark">Remarks</Label>
                <Textarea
                  id="grade-remark"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Feedback for the student…"
                  className="min-h-16 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={onGrade} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                <Save className="h-4 w-4" /> Submit Grade
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
