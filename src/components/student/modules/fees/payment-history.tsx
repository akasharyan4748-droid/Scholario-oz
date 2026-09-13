'use client'

/**
 * fees/payment-history — PAYMENT HISTORY (FEES-R §13).
 *
 * Optimised for scanning: compact transaction rows (amount · purpose ·
 * date · method · status chip · receipt action) that stack as cards on
 * mobile — no giant table on small screens. The receipt number copies on
 * click (§36 micro-interaction) and the official A5 receipt downloads for
 * CONFIRMED payments only — an under-verification payment honestly reads
 * "Receipt after verification" instead of pretending to be official.
 */

import { motion } from 'framer-motion'
import { Copy, Download, Receipt } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { FeeTransaction, ReceiptSettings } from '@/lib/store/fee-store'
import { downloadReceiptA5 } from '@/components/principal/modules/fees/fee-receipt-a5'
import { txnStatusChip } from './derive'

const TONE_CLASS: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
  neutral: 'bg-muted text-muted-foreground border-border',
  cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25',
}

interface PaymentHistoryProps {
  totalPaid: number
  transactions: FeeTransaction[]
  receiptSettings: ReceiptSettings
}

export function PaymentHistory({ totalPaid, transactions, receiptSettings }: PaymentHistoryProps) {
  // Newest first — the freshest ledger activity on top.
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (a.recordedAt ?? '') < (b.recordedAt ?? '') ? 1 : -1
  })

  const copyReceiptNo = async (receiptNo: string) => {
    try {
      await navigator.clipboard.writeText(receiptNo)
      toast.success('Receipt number copied', { description: receiptNo })
    } catch {
      toast.error('Could not copy', { description: `The receipt number is ${receiptNo}.` })
    }
  }

  return (
    <GlassCard className="p-4 sm:p-5" data-testid="payment-history">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" aria-hidden>
              <Receipt className="h-3.5 w-3.5" />
            </span>
            Payment history
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {transactions.length === 0 ? 'No payments recorded yet' : `${transactions.length} ${transactions.length === 1 ? 'transaction' : 'transactions'} · from the school fee ledger`}
          </p>
        </div>
        {totalPaid > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            {formatINR(totalPaid)} paid
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
          No payments recorded yet — your first receipt will appear here once a payment is confirmed.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5" aria-label="Payment transactions">
          {sorted.map((t, i) => {
            const chip = txnStatusChip(t)
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="rounded-xl border border-border/80 bg-card/60 p-3 sm:p-3.5 transition-colors hover:bg-accent/30"
              >
                {/* Scannable primary line: purpose ↔ amount (§13 example). */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{t.purpose}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(t.date)} · {t.mode}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-base font-bold tabular-nums text-foreground">{formatINR(t.amount)}</p>
                </div>

                {/* Secondary line: copyable receipt no · status · receipt action. */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => copyReceiptNo(t.receiptNo)}
                    aria-label={`Copy receipt number ${t.receiptNo}`}
                    title="Copy receipt number"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {t.receiptNo}
                    <Copy className="h-3 w-3 shrink-0" aria-hidden />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold', TONE_CLASS[chip.tone])}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                      {chip.label}
                    </span>
                    {t.status === 'Success' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          downloadReceiptA5(t, receiptSettings)
                          toast.success('Receipt downloaded', { description: `${t.receiptNo}.html` })
                        }}
                        aria-label={`Download receipt ${t.receiptNo}`}
                        className="h-10 gap-1.5 px-3 text-[11px]"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden /> Receipt
                      </Button>
                    ) : (
                      <span className="max-w-[160px] text-right text-[10px] leading-tight text-muted-foreground" title="The official receipt becomes available once the school office verifies the payment">
                        Receipt after verification
                      </span>
                    )}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}
    </GlassCard>
  )
}
