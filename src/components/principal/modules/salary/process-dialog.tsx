'use client'

// Process Payroll dialog — 3-stage (confirm → processing → success) flow.

import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, Users, ShieldCheck, CheckCircle2, Sparkles,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { salaryAnalytics } from '@/lib/mock/finance'
import { school } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { type ProcessStage, earningsVsDeduction, processSteps, confettiColors } from './data'

export function ProcessPayrollDialog({
  open,
  stage,
  onOpenChange,
  onStart,
  onClose,
}: {
  open: boolean
  stage: ProcessStage
  onOpenChange: (o: boolean) => void
  onStart: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md" showCloseButton={stage !== 'processing'}>
        <AnimatePresence mode="wait">
          {stage === 'confirm' && (
            <ConfirmStage onStart={onStart} />
          )}
          {stage === 'processing' && <ProcessingStage />}
          {stage === 'success' && <SuccessStage />}
        </AnimatePresence>

        {stage === 'success' && (
          <DialogFooter>
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConfirmStage({ onStart }: { onStart: () => void }) {
  const netRatioPct = Math.round(
    (earningsVsDeduction[0].value / salaryAnalytics.totalMonthly) * 100
  )
  const summaryRows = [
    { l: 'Gross Salary', v: formatINR(salaryAnalytics.totalMonthly + salaryAnalytics.deductionsTotal), c: 'text-foreground' },
    { l: 'Total Deductions', v: `- ${formatINR(salaryAnalytics.deductionsTotal)}`, c: 'text-rose-600 dark:text-rose-400' },
    { l: 'Bonus (Festive)', v: formatINR(salaryAnalytics.bonusGiven), c: 'text-amber-600' },
    { l: 'Net Payable', v: formatINR(salaryAnalytics.totalMonthly + salaryAnalytics.bonusGiven), c: 'text-emerald-600 dark:text-emerald-400 font-bold' },
  ]

  return (
    <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Wallet className="h-4 w-4" />
          </div>
          Process Payroll — Next Cycle
        </DialogTitle>
        <DialogDescription>Review & confirm to disburse salary to all eligible employees</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Total Payroll Amount</p>
              <p className="font-display text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <AnimatedCounter value={salaryAnalytics.totalMonthly} format={(n) => formatINR(n)} />
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-card/40 p-2 text-center">
              <p className="text-muted-foreground text-[10px]">Employees</p>
              <p className="font-semibold">{school.totalTeachers + school.totalStaff}</p>
            </div>
            <div className="rounded-lg bg-card/40 p-2 text-center">
              <p className="text-muted-foreground text-[10px]">Net Ratio</p>
              <p className="font-semibold">{netRatioPct}%</p>
            </div>
            <div className="rounded-lg bg-card/40 p-2 text-center">
              <p className="text-muted-foreground text-[10px]">Pending</p>
              <p className="font-semibold text-amber-600">{salaryAnalytics.pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2 text-xs">
          {summaryRows.map((row) => (
            <div key={row.l} className="flex justify-between">
              <span className="text-muted-foreground">{row.l}</span>
              <span className={`font-medium ${row.c}`}>{row.v}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-card/40 border border-border p-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground">Direct deposit via NEFT/RTGS · Credited within 2 hours · Auto-PF filed with EPFO</p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        <Button
          onClick={onStart}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          <CheckCircle2 className="h-4 w-4" /> Confirm & Disburse
        </Button>
      </DialogFooter>
    </motion.div>
  )
}

function ProcessingStage() {
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
          <Wallet className="h-8 w-8 text-primary" />
        </div>
      </div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-lg font-bold mt-5"
      >
        Disbursing Payroll…
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground mt-1"
      >
        {formatINR(salaryAnalytics.totalMonthly)} · {school.totalTeachers + school.totalStaff - salaryAnalytics.pendingCount} employees
      </motion.p>
      <div className="mt-4 w-full max-w-xs space-y-2">
        {processSteps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.5 }}
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
      <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3" /> Do not close this window
      </p>
    </motion.div>
  )
}

function SuccessStage() {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-10 text-center relative"
    >
      {[...Array(28)].map((_, i) => {
        const angle = (i / 28) * 2 * Math.PI
        const distance = 120 + Math.random() * 60
        return (
          <motion.div
            key={i}
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{ background: confettiColors[i % confettiColors.length] }}
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
        Payroll Disbursed! 🎉
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground mt-1"
      >
        {formatINR(salaryAnalytics.totalMonthly)} paid to {school.totalTeachers + school.totalStaff - salaryAnalytics.pendingCount} employees
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5"
      >
        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
        <p className="text-[11px] text-muted-foreground">EPFO returns filed · Payslips emailed to all staff</p>
      </motion.div>
    </motion.div>
  )
}
