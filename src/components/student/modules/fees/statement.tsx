'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, Download, ArrowDownRight, ArrowUpRight, BadgePercent, AlertTriangle, History, ChevronDown } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { downloadReceiptA5 } from '@/components/principal/modules/fees/fee-receipt-a5'
import type { StudentFeeAccount, FeeTransaction, ReceiptSettings } from '@/lib/store/fee-store'

/**
 * Statement — the ONE fee ledger this account actually has: the engine's
 * chronological ledger (charges, concession, late fee, previous receipts)
 * plus every countable payment with its official receipt available for
 * download. Under-verification submissions are clearly marked — they are
 * real money claims still awaiting the office, not paid money.
 */
export function Statement({ acct, transactions, receiptSettings }: {
  acct: StudentFeeAccount
  transactions: FeeTransaction[]
  receiptSettings: ReceiptSettings
}) {
  const [ledgerOpen, setLedgerOpen] = useState(false)
  // Countable money only — Failed/Refunded rows never appear as history.
  const myTxns = transactions.filter(
    (t) => t.studentId === acct.studentId && (t.status === 'Success' || t.status === 'Under Verification'),
  )
  const visibleLedger = ledgerOpen ? acct.ledger : acct.ledger.slice(-6)

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Payments &amp; receipts
        </h3>
        <span className="text-[11px] text-muted-foreground">{myTxns.length} on the school ledger</span>
      </div>

      {myTxns.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
          No payments recorded yet this session.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {myTxns.map((t, i) => {
            const awaiting = t.status === 'Under Verification'
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="flex items-center gap-3 py-2.5"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    awaiting
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  )}
                  aria-hidden
                >
                  {awaiting ? <History className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold tabular-nums">{formatINR(t.amount)}</p>
                    <span className="text-[10px] text-muted-foreground">{t.mode}</span>
                    {awaiting && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                        Awaiting verification
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t.receiptNo} · {formatDate(t.date)}
                    {t.gatewayPaymentId ? ' · gateway-verified' : ''}
                  </p>
                </div>
                {!awaiting && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 shrink-0 h-8 text-xs"
                    onClick={() => {
                      downloadReceiptA5(t, receiptSettings)
                      toast.success('Receipt downloaded', { description: `${t.receiptNo}.html` })
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Receipt
                  </Button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* The chronological account ledger — collapsible full view */}
      <div className="mt-3 rounded-xl border border-border bg-muted/20">
        <button
          onClick={() => setLedgerOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-expanded={ledgerOpen}
        >
          <span className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5" /> Account ledger — {acct.ledger.length} entries
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', ledgerOpen && 'rotate-180')} />
        </button>
        {ledgerOpen && (
          <div className="max-h-72 overflow-y-auto custom-scrollbar border-t border-border">
            {visibleLedger.map((e) => {
              const isPayment = e.payment > 0
              const isConcession = e.entryType === 'concession'
              const isLateFee = e.entryType === 'late-fee'
              return (
                <div key={e.id} className="flex items-center gap-2.5 px-3.5 py-2 border-b border-border/60 last:border-0">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                      isPayment
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isConcession
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isLateFee
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-muted text-muted-foreground',
                    )}
                    aria-hidden
                  >
                    {isPayment ? <ArrowUpRight className="h-3 w-3" /> : isConcession ? <BadgePercent className="h-3 w-3" /> : isLateFee ? <AlertTriangle className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{e.feeHead}</p>
                    <p className="text-[9.5px] text-muted-foreground truncate">{formatDate(e.date)} · {e.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      'text-[11px] font-semibold tabular-nums',
                      isPayment ? 'text-emerald-600 dark:text-emerald-400' : e.charge < 0 ? 'text-emerald-600 dark:text-emerald-400' : isLateFee ? 'text-rose-600 dark:text-rose-400' : '',
                    )}>
                      {isPayment ? `+${formatINR(e.payment)}` : e.charge < 0 ? `−${formatINR(-e.charge)}` : formatINR(e.charge)}
                    </p>
                    <p className="text-[9px] text-muted-foreground tabular-nums">bal {formatINR(e.balance)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
