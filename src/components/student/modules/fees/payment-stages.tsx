'use client'

import { motion } from 'framer-motion'
import {
  IndianRupee, Download, CheckCircle2, Receipt, ShieldCheck, Sparkles,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/ui'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatINR, formatDate } from '@/lib/format'
import type { PaymentStudentInfo } from './data'

export function PaymentProcessingStage({ paidAmount, method }: { paidAmount: number; method: string }) {
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
        className="text-sm text-muted-foreground mt-1"
      >
        {formatINR(paidAmount)} via {method.toUpperCase()}
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

export function PaymentSuccessStage({ paidAmount, method }: { paidAmount: number; method: string }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-10 text-center relative"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-premium-lg mb-5"
      >
        <CheckCircle2 className="h-14 w-14" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-display text-2xl font-extrabold"
      >
        Payment Submitted
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground mt-1"
      >
        {formatINR(paidAmount)} via {method.toUpperCase()} · Awaiting confirmation by the school office
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-[11px] text-muted-foreground mt-3 max-w-[280px]"
      >
        Your receipt becomes available as soon as the office verifies the payment — usually the same day.
      </motion.p>
    </motion.div>
  )
}

export function PaymentReceiptStage({
  paidAmount, method, student, reference, receiptNo, onDownload, onComplete,
}: {
  paidAmount: number
  method: string
  student: PaymentStudentInfo
  /** Transfer reference the parent provided (real, from the form). */
  reference?: string
  /** Canonical acknowledgement number from the fee ledger (pending state). */
  receiptNo?: string
  onDownload: () => void
  onComplete: () => void
}) {
  return (
    <motion.div key="receipt" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
            <Receipt className="h-4 w-4" />
          </div>
          Payment Acknowledgement
        </DialogTitle>
        <DialogDescription>Submitted — the official receipt follows confirmation</DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <div className="rounded-t-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-display text-lg font-bold">Payment Submitted</p>
          </div>
          <p className="text-[11px] text-amber-50">Awaiting confirmation by the school office</p>
        </div>

        <div className="rounded-b-2xl border border-t-0 border-border bg-card/40 p-4">
          <div className="text-center mb-4">
            <p className="text-[11px] text-muted-foreground">Amount Submitted</p>
            <p className="font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatINR(paidAmount)}
            </p>
          </div>

          <div className="space-y-2 text-sm border-t border-border pt-3">
            {receiptNo && <ReceiptRow label="Reference No" value={receiptNo} mono />}
            {reference && <ReceiptRow label="Transaction Ref" value={reference} mono small />}
            <ReceiptRow label="Date" value={formatDate(new Date().toISOString())} />
            <ReceiptRow label="Method" value={method.toUpperCase()} />
            <ReceiptRow label="Student" value={student.name} />
            <ReceiptRow label="Admission No" value={student.admissionNo} mono />
            <ReceiptRow label="Class" value={`${student.className}-${student.section}`} />
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Status</span>
            <StatusBadge status="Awaiting confirmation" variant="warning" dot />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Keep the transaction reference safe. Your official receipt appears in Payment History once the office confirms.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDownload} className="flex-1">
          <Download className="h-3.5 w-3.5" /> Download Acknowledgement
        </Button>
        <Button
          onClick={onComplete}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Done
        </Button>
      </DialogFooter>
    </motion.div>
  )
}

function ReceiptRow({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : ''}`}>{value}</span>
    </div>
  )
}
