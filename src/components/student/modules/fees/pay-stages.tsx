'use client'

/**
 * PayStages — processing / result / receipt stages of the payment flow
 * (§10 — every realistic state handled honestly).
 *
 * The UI NEVER says "Paid" merely because a button was clicked: only a
 * gateway-confirmed backend state (transaction.status === 'Success' with
 * a gateway payment id) renders the official-receipt treatment; a manual
 * submission renders the honest amber "under verification" acknowledgement.
 */

import { motion } from 'framer-motion'
import {
  BadgeCheck, Download, IndianRupee, ReceiptText, ShieldCheck,
} from 'lucide-react'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { FeeTransaction } from '@/lib/store/fee-store'

export function PayProcessingStage({ amount, method }: { amount: number; method: string }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-primary/15 border-t-primary"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <IndianRupee className="h-6 w-6 text-primary" aria-hidden />
        </div>
      </div>
      <h3 className="mt-5 font-display text-lg font-bold">Processing payment…</h3>
      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
        {formatINR(amount)} via {method}
      </p>
      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" aria-hidden />
        Do not close this window or pay again
      </p>
    </motion.div>
  )
}

export function PayResultStage({ txn, gatewayProvider }: { txn: FeeTransaction; gatewayProvider: string | null }) {
  const confirmed = txn.status === 'Success'
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg',
          confirmed
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/25'
            : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/25',
        )}
      >
        <BadgeCheck className="h-10 w-10" aria-hidden />
      </motion.div>
      <h3 className="mt-5 font-display text-xl font-extrabold">
        {confirmed ? 'Payment successful' : 'Payment submitted'}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
        {formatINR(txn.amount)} · {txn.mode}
        {confirmed && gatewayProvider && <> · confirmed by the {gatewayProvider} gateway</>}
      </p>
      <p className="mt-3 max-w-[300px] text-[11px] leading-relaxed text-muted-foreground">
        {confirmed
          ? 'Your official receipt is ready — it stays in Payment History forever.'
          : 'No need to pay again — the office is matching your reference now. The receipt follows confirmation.'}
      </p>
    </motion.div>
  )
}

export function PayReceiptStage({ txn, gatewayProvider, onDownload, onDone }: {
  txn: FeeTransaction
  gatewayProvider: string | null
  onDownload: () => void
  onDone: () => void
}) {
  const confirmed = txn.status === 'Success'
  return (
    <motion.div key="receipt" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            confirmed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          )}>
            <ReceiptText className="h-4 w-4" aria-hidden />
          </div>
          {confirmed ? 'Official receipt' : 'Payment acknowledgement'}
        </DialogTitle>
        <DialogDescription>
          {confirmed
            ? `Paid · confirmed by the ${gatewayProvider ?? 'payment'} gateway`
            : 'Submitted — the official receipt follows office verification'}
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <div className={cn(
          'rounded-xl border p-4',
          confirmed ? 'border-emerald-500/25 bg-emerald-500/[0.05]' : 'border-amber-500/25 bg-amber-500/[0.05]',
        )}>
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground">{confirmed ? 'Amount paid' : 'Amount submitted'}</p>
            <p className={cn(
              'font-display text-3xl font-extrabold tabular-nums',
              confirmed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
            )}>
              {formatINR(txn.amount)}
            </p>
          </div>
          <div className="mt-4 space-y-2 border-t border-border/70 pt-3 text-sm">
            <ReceiptRow label="Receipt No" value={txn.receiptNo} mono />
            {txn.referenceNo && <ReceiptRow label="Transaction ref" value={txn.referenceNo} mono small />}
            <ReceiptRow label="Date" value={formatDate(txn.date)} />
            <ReceiptRow label="Method" value={txn.mode} />
            <ReceiptRow label="Purpose" value={txn.purpose} small />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                confirmed
                  ? 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400'
                  : 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400',
              )}>
                <span className={cn('h-1.5 w-1.5 rounded-full', confirmed ? 'bg-emerald-500' : 'bg-amber-500')} aria-hidden />
                {confirmed ? 'Paid' : 'Under verification'}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {confirmed
            ? 'Download the A5 receipt now — or view, print and re-download it anytime from Payment History.'
            : 'Keep your reference safe. The official A5 receipt appears in Payment History once the office verifies.'}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDownload} className="flex-1">
          <Download className="h-3.5 w-3.5" aria-hidden />
          {confirmed ? 'Download receipt' : 'Download acknowledgement'}
        </Button>
        <Button onClick={onDone} className="flex-1">Done</Button>
      </DialogFooter>
    </motion.div>
  )
}

function ReceiptRow({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={cn('truncate text-right font-semibold', mono && 'font-mono', small && 'text-xs')} title={value}>
        {value}
      </span>
    </div>
  )
}
