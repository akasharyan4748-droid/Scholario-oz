'use client'

import { motion } from 'framer-motion'
import {
  IndianRupee, CheckCircle2, ShieldCheck, Download, Receipt, Sparkles,
} from 'lucide-react'
import {
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { school } from '@/lib/mock/school'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { Student } from '@/lib/mock/students'
import type { PayStage } from './data'

/* ----------------------------------------------------------------
   Stage 2: PROCESSING
   ---------------------------------------------------------------- */
export function CollectProcessingStage({ amount, method }: { amount: number; method: string }) {
  return (
    <motion.div
      key="processing"
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
          <IndianRupee className="h-8 w-8 text-primary" />
        </div>
      </div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-lg font-bold mt-5"
      >
        Processing Payment…
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground mt-1 tabular-nums"
      >
        {formatINR(amount)} via {method}
      </motion.p>
      <div className="flex items-center gap-1.5 mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="h-2 w-2 rounded-full bg-primary"
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3" /> Do not close this window
      </p>
    </motion.div>
  )
}

/* ----------------------------------------------------------------
   Stage 3: SUCCESS with confetti
   ---------------------------------------------------------------- */
export function CollectSuccessStage({ amount, method }: { amount: number; method: string }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-10 text-center relative"
    >
      {[...Array(28)].map((_, i) => {
        const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316']
        const angle = (i / 28) * 2 * Math.PI
        const distance = 120 + Math.random() * 60
        return (
          <motion.div
            key={i}
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0.2,
              rotate: 720,
            }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
        )
      })}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-premium-lg mb-5"
      >
        <CheckCircle2 className="h-14 w-14" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-display text-2xl font-extrabold"
      >
        Payment Successful!
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground mt-1 tabular-nums"
      >
        {formatINR(amount)} collected via {method}
      </motion.p>
    </motion.div>
  )
}

/* ----------------------------------------------------------------
   Stage 4: RECEIPT
   ---------------------------------------------------------------- */
export function CollectReceiptStage({
  amount,
  method,
  purpose,
  student,
  receiptNo,
  onDone,
}: {
  amount: number
  method: string
  purpose: string
  student: Student
  receiptNo: string
  onDone: () => void
}) {
  return (
    <motion.div
      key="receipt"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
            <Receipt className="h-4 w-4" />
          </div>
          Payment Receipt
        </DialogTitle>
        <DialogDescription>Transaction completed successfully</DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <div className="rounded-t-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-display text-lg font-bold">Payment Successful</p>
          </div>
          <p className="text-[11px] text-emerald-100">{school.name}</p>
        </div>

        <div className="rounded-b-2xl border border-t-0 border-border bg-card/40 p-4">
          <div className="text-center mb-4">
            <p className="text-[11px] text-muted-foreground">Amount Paid</p>
            <p className="font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              <AnimatedCounter value={amount} format={(n) => formatINR(n)} />
            </p>
          </div>

          <div className="space-y-2 text-sm border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receipt No</span>
              <span className="font-mono font-semibold">{receiptNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">TXN{Date.now().toString().slice(-10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-semibold">{formatDate(new Date().toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-semibold">{method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student</span>
              <span className="font-semibold">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admission No</span>
              <span className="font-mono font-semibold">{student.admissionNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Class</span>
              <span className="font-semibold">{student.className}-{student.section}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purpose</span>
              <span className="font-semibold">{purpose}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Status</span>
            <StatusBadge status="Success" variant="success" dot />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground">Receipt emailed to {student.email}</p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => toast.success('Receipt downloaded', { description: `${receiptNo}.pdf · ${formatINR(amount)}` })}
          className="flex-1"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
        <Button onClick={onDone} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          <CheckCircle2 className="h-3.5 w-3.5" /> Done
        </Button>
      </DialogFooter>
    </motion.div>
  )
}

/* Helper used by the parent to render the correct stage by `stage` value. */
export function CollectStageRouter({
  stage,
  amount,
  method,
  purpose,
  student,
  receiptNo,
  onDone,
}: {
  stage: PayStage
  amount: number
  method: string
  purpose: string
  student: Student
  receiptNo: string
  onDone: () => void
}) {
  if (stage === 'processing') return <CollectProcessingStage amount={amount} method={method} />
  if (stage === 'success') return <CollectSuccessStage amount={amount} method={method} />
  if (stage === 'receipt') return (
    <CollectReceiptStage
      amount={amount}
      method={method}
      purpose={purpose}
      student={student}
      receiptNo={receiptNo}
      onDone={onDone}
    />
  )
  return null
}
