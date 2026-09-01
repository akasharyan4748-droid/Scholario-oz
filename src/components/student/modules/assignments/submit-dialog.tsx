'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, CheckCircle2, Send, Upload, Paperclip, MessageSquare, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Assignment } from '@/lib/mock/academics'
import { subjectColor } from './data'

interface SubmitDialogProps {
  openId: string | null
  openAssignment: Assignment | undefined
  submitting: boolean
  success: boolean
  notes: string
  fileName: string | null
  onClose: () => void
  onSubmit: () => void
  setNotes: (v: string) => void
  setFileName: (v: string | null) => void
}

export function SubmitAssignmentDialog({
  openId, openAssignment, submitting, success, notes, fileName,
  onClose, onSubmit, setNotes, setFileName,
}: SubmitDialogProps) {
  return (
    <Dialog open={openId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Assignment Submission</DialogTitle>
          <DialogDescription>Submit work or view submission status</DialogDescription>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              {[...Array(18)].map((_, i) => {
                const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
                const angle = (i / 18) * 2 * Math.PI
                const distance = 100 + Math.random() * 40
                return (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 rounded-full"
                    style={{ background: colors[i % colors.length] }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: 0,
                      scale: 0.3,
                      rotate: 360,
                    }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                  />
                )
              })}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-premium-lg mb-4"
              >
                <CheckCircle2 className="h-12 w-12" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-xl font-bold"
              >
                Submitted! 🎉
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-muted-foreground mt-1"
              >
                Your assignment is on its way to your teacher.
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${subjectColor(openAssignment?.subject ?? 'English').gradient} text-white`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  Submit Assignment
                </DialogTitle>
                <DialogDescription>
                  {openAssignment?.title} · {openAssignment?.subject} · {openAssignment?.marks} marks
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Attach Your Work</label>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/40 p-5 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          setFileName(f.name)
                          toast.success('File attached', { description: f.name })
                        }
                      }}
                    />
                    {fileName ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Click to upload</p>
                          <p className="text-[11px] text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Notes (optional)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything your teacher should know…"
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
                  <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Rubric Reminder
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1">
                    {openAssignment?.rubric.map((r, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-violet-500" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white min-w-[120px]"
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Submit
                    </>
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
