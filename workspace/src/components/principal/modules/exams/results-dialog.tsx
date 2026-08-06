'use client'

// Result Generation dialog — three AnimatePresence states:
//   1. form       → select exam & class + marks entry preview
//   2. generating → spinner + step-by-step loader
//   3. generated  → success summary (pass rate / distinctions / class avg)

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Sparkles, CheckCircle2, Download, BarChart3 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { exams } from '@/lib/mock/academics'
import { toast } from 'sonner'
import {
  generateClassOptions, resultGenerationSteps, gradeSheet, emeraldGradientBtn,
} from './data'

function ResultFormState({
  genExam,
  setGenExam,
  genClass,
  setGenClass,
}: {
  genExam: string
  setGenExam: (v: string) => void
  genClass: string
  setGenClass: (v: string) => void
}) {
  return (
    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Exam</Label>
          <Select value={genExam} onValueChange={setGenExam}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={genClass} onValueChange={setGenClass}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {generateClassOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Marks entry preview (mock) */}
      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
          <p className="text-xs font-semibold">Marks Entry Preview</p>
          <Badge variant="secondary" className="text-[10px]">18 students · 6 subjects</Badge>
        </div>
        <div className="max-h-40 overflow-y-auto custom-scroll">
          {gradeSheet.slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 border-b border-border/50 last:border-0 text-xs">
              <span className="font-medium">{s.name}</span>
              <div className="flex gap-1">
                {s.marks.map((m, idx) => (
                  <span key={idx} className="font-mono text-[10px] w-7 text-center rounded bg-muted px-1 py-0.5">{m}</span>
                ))}
              </div>
            </div>
          ))}
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-center italic">+ 14 more students</div>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
        <p className="text-[11px] text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
          Result will auto-compute grades, rank, percentage & generate report cards for all 18 students.
        </p>
      </div>
    </motion.div>
  )
}

function GeneratingState() {
  return (
    <motion.div
      key="generating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20 border-t-primary"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Award className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-lg font-bold mt-5">Generating Results…</h3>
      <p className="text-sm text-muted-foreground mt-1">Computing grades · Ranking students · Building report cards</p>
      <div className="mt-4 w-full max-w-xs space-y-2">
        {resultGenerationSteps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.4 }}
            className="flex items-center gap-2 text-xs"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="h-1.5 w-1.5 rounded-full bg-primary"
            />
            <span className="text-muted-foreground">{step}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function GeneratedState({ genClass }: { genClass: string }) {
  return (
    <motion.div
      key="generated"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-4"
    >
      <div className="flex flex-col items-center text-center mb-4">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-premium-lg mb-3"
        >
          <CheckCircle2 className="h-9 w-9" />
        </motion.div>
        <h3 className="font-display text-xl font-bold">Results Generated!</h3>
        <p className="text-sm text-muted-foreground mt-1">UT3 · {genClass} · 18 students processed</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center">
          <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">96.4%</p>
          <p className="text-[10px] text-muted-foreground">Pass rate</p>
        </div>
        <div className="rounded-lg bg-amber-500/10 p-2.5 text-center">
          <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">6</p>
          <p className="text-[10px] text-muted-foreground">Distinctions</p>
        </div>
        <div className="rounded-lg bg-cyan-500/10 p-2.5 text-center">
          <p className="font-display text-lg font-bold text-cyan-600 dark:text-cyan-400">91.3%</p>
          <p className="text-[10px] text-muted-foreground">Class avg</p>
        </div>
      </div>
    </motion.div>
  )
}

export function GenerateResultDialog({
  open,
  onOpenChange,
  initialExamId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialExamId: string
}) {
  const [genExam, setGenExam] = useState(initialExamId)
  const [genClass, setGenClass] = useState('Class 2-A')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Sync the exam selector when a different exam triggers the dialog, and
  // reset progress whenever the dialog is reopened.
  useEffect(() => { setGenExam(initialExamId) }, [initialExamId])
  useEffect(() => {
    if (open) { setGenerating(false); setGenerated(false) }
  }, [open])

  const handleGenerate = () => {
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      toast.success('Result generated', { description: `UT3 · ${genClass} · 18 students · Auto-ranked` })
    }, 2200)
  }

  const close = () => {
    onOpenChange(false)
    setTimeout(() => { setGenerating(false); setGenerated(false) }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o ? close() : onOpenChange(o)}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg" showCloseButton={!generating}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Generate Result
          </DialogTitle>
          <DialogDescription>Select exam & class to compute results and report cards</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!generating && !generated && (
            <ResultFormState
              genExam={genExam}
              setGenExam={setGenExam}
              genClass={genClass}
              setGenClass={setGenClass}
            />
          )}
          {generating && <GeneratingState />}
          {generated && <GeneratedState genClass={genClass} />}
        </AnimatePresence>

        <DialogFooter>
          {!generating && !generated && (
            <>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleGenerate} className={emeraldGradientBtn}>
                <BarChart3 className="h-4 w-4" /> Generate Result
              </Button>
            </>
          )}
          {generated && (
            <>
              <Button
                variant="outline"
                onClick={() => toast.success('Report cards generated', { description: `18 report cards emailed to parents.` })}
              >
                <Download className="h-3.5 w-3.5" /> Report Cards
              </Button>
              <Button onClick={close} className={emeraldGradientBtn}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
