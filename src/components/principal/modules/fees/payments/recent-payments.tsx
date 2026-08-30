'use client'

/**
 * RecentPayments — "Recent / Active Payments" panel on the Payments page
 * (PAY-REWORK-1 spec §8/§10/§12/§13/§20/§21).
 *
 *   Payments = CURRENT / ACTIONABLE payment activity.
 *   Transactions = the completed historical ledger.
 *
 * A payment stays here while it is NEW or ACTIONABLE — i.e. while it is
 * still awaiting verification, or until its receipt has been printed or
 * downloaded (receiptHandledAt). It then settles into Transactions on its
 * own; the payment record is never deleted — only its UI classification
 * changes. Every row shows the spec's scan line: student · class · amount ·
 * method · collector · status · date · reference · receipt availability,
 * with progressive disclosure (secondary details in the receipt dialog).
 *
 * Bulk receipts: contextual selection — the bulk bar exists ONLY while a
 * selection is made; no permanent toolbar (spec §21).
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Printer, Download, X, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useFeeStore, useFeeData, type FeeTransaction } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Panel } from '../../shared/panel'
import { FeeStatusBadge, ModeIcon, paymentStatusLabel } from '../fees-shared'
import { ReceiptRowActions, ReceiptViewDialog, printReceiptsA5Bulk, downloadReceiptsA5Bulk } from '../fee-receipt-a5'
import { toast } from 'sonner'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const MAX_ROWS = 8

export function RecentPayments({
  data,
  onOpenTransactions,
}: {
  data: ReturnType<typeof useFeeData>
  onOpenTransactions?: () => void
}) {
  const receiptSettings = useFeeStore((s) => s.receiptSettings)
  const { transactions } = data
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewing, setViewing] = useState<FeeTransaction | null>(null)

  // Recent / actionable slice — newest first (store prepends).
  const recent = useMemo(() => {
    const cutoff = Date.now() - THIRTY_DAYS_MS
    return transactions.filter((t) => {
      if (t.status !== 'Success') return true // pending/failed = actionable
      if (!t.receiptHandledAt) return true // receipt not yet issued = actionable
      const handled = new Date(t.receiptHandledAt).getTime()
      return handled >= cutoff // recently completed → still "recent"
    })
  }, [transactions])

  const visible = recent.slice(0, MAX_ROWS)
  const overflow = recent.length - visible.length

  // Bulk selection works on receipt-able rows (verified payments).
  const selectable = visible.filter((t) => t.status === 'Success')
  const allSelected = selectable.length > 0 && selectable.every((t) => selected.has(t.id))
  const selectedItems = transactions
    .filter((t) => selected.has(t.id) && t.status === 'Success')
    .map((transaction) => ({ transaction }))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => (allSelected ? new Set() : new Set(selectable.map((t) => t.id))))
  }

  const clearSelection = () => setSelected(new Set())

  const handleBulkPrint = () => {
    if (selectedItems.length === 0) return
    const ok = printReceiptsA5Bulk(selectedItems, receiptSettings)
    if (ok) {
      toast.success(`Printing ${selectedItems.length} receipt${selectedItems.length === 1 ? '' : 's'}`, { description: 'One A5 sheet per payment.' })
      const mark = useFeeStore.getState().markReceiptHandled
      selectedItems.forEach(({ transaction }) => mark(transaction.id, 'Principal'))
      clearSelection()
    } else {
      toast.error('Pop-up blocked', { description: 'Allow pop-ups for this site to print receipts.' })
    }
  }

  const handleBulkDownload = () => {
    if (selectedItems.length === 0) return
    downloadReceiptsA5Bulk(selectedItems, receiptSettings)
    toast.success(`Receipt file downloaded`, { description: `${selectedItems.length} A5 sheet${selectedItems.length === 1 ? '' : 's'} · one per payment.` })
    const mark = useFeeStore.getState().markReceiptHandled
    selectedItems.forEach(({ transaction }) => mark(transaction.id, 'Principal'))
    clearSelection()
  }

  return (
    <Panel
      title="Recent Payments"
      subtitle={
        <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{recent.length} recent · actionable</span>
          {selected.size > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {selected.size} selected
            </span>
          )}
        </span>
      }
      action={
        selected.size > 0 ? (
          /* Contextual bulk bar — exists only while a selection is made */
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={clearSelection}>
              <X className="h-3 w-3" /> Clear
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleBulkDownload}>
              <Download className="h-3 w-3" /> Download receipts
            </Button>
            <Button size="sm" className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBulkPrint}>
              <Printer className="h-3 w-3" /> Print receipts
            </Button>
          </div>
        ) : (
          onOpenTransactions && (
            <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-muted-foreground" onClick={onOpenTransactions}>
              Transactions <ArrowRight className="h-3 w-3" />
            </Button>
          )
        )
      }
      bodyClassName="p-0"
      className={cn(selected.size > 0 && 'ring-1 ring-emerald-500/30')}
    >
      {recent.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs font-medium">No payments yet</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Recorded collections appear here with their verification status and receipt.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {/* Select-all — only when there is anything receipt-able */}
          {selectable.length > 0 && selected.size === 0 && (
            <label className="flex items-center gap-2 px-4 py-1.5 text-[10px] text-muted-foreground cursor-pointer hover:bg-muted/30 select-none">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all verified payments for bulk receipt actions"
                className="h-3.5 w-3.5"
              />
              Select verified payments for bulk receipts
            </label>
          )}

          {visible.map((t, i) => {
            const isOffice = !t.collectorRole || t.collectorRole === 'principal'
            const collectorLabel = isOffice ? 'Office' : t.collectorRole === 'teacher' ? t.collectedBy : 'Self-service'
            const canSelect = t.status === 'Success'
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className={cn(
                  'px-3.5 py-2 flex items-center gap-3 hover:bg-muted/30 transition-colors',
                  selected.has(t.id) && 'bg-emerald-500/[0.04]',
                )}
              >
                {canSelect ? (
                  <Checkbox
                    checked={selected.has(t.id)}
                    onCheckedChange={() => toggle(t.id)}
                    aria-label={`Select receipt ${t.receiptNo} for ${t.studentName}`}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                ) : (
                  <span className="w-[14px] shrink-0" aria-hidden />
                )}

                {/* Scan column — who / what / when */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-semibold truncate">{t.studentName}</p>
                    <span
                      className={cn(
                        'shrink-0 inline-flex items-center px-1.5 py-px rounded text-[9px] font-semibold',
                        isOffice
                          ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                      )}
                      title={`Collected by ${collectorLabel}`}
                    >
                      {isOffice ? 'Office' : collectorRoleShort(t.collectorRole)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {t.className} · {t.feeHead} · {formatDate(t.date)}
                    {t.referenceNo ? <span className="font-mono"> · {t.referenceNo}</span> : null}
                  </p>
                </div>

                {/* Mode */}
                <span className="shrink-0 hidden sm:flex h-6 w-6 items-center justify-center rounded-md ring-1 bg-muted/40 text-muted-foreground" title={t.mode}>
                  <ModeIcon mode={t.mode} className="h-3 w-3" />
                </span>

                {/* Amount + status */}
                <div className="shrink-0 text-right min-w-[92px]">
                  <p className="text-xs font-bold tabular-nums leading-tight">{formatINR(t.amount, true)}</p>
                  <div className="mt-0.5 flex justify-end">
                    <FeeStatusBadge status={paymentStatusLabel(t.status, 'principal')} />
                  </div>
                </div>

                {/* Receipt actions — Success only; pending rows show nothing
                    (their action lives in the Cash Verification queue below) */}
                {t.status === 'Success' ? (
                  <ReceiptRowActions transaction={t} settings={receiptSettings} onView={setViewing} />
                ) : (
                  <span className="w-[78px] shrink-0 text-right text-[9px] text-muted-foreground hidden md:block">
                    {t.status === 'Under Verification' ? 'Awaiting verification' : '—'}
                  </span>
                )}
              </motion.div>
            )
          })}

          {overflow > 0 && (
            <button
              type="button"
              onClick={onOpenTransactions}
              className="w-full px-4 py-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
            >
              {overflow} older payment{overflow === 1 ? '' : 's'} in Transactions <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* All-clear helper when everything has settled */}
      {recent.length > 0 && selectable.length > 0 && selected.size === 0 && recent.every((t) => t.status === 'Success' && t.receiptHandledAt) && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/60 text-[10px] text-muted-foreground">
          <CheckCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          All caught up — receipts issued for recent payments. Complete history lives in Transactions.
        </div>
      )}

      <ReceiptViewDialog
        transaction={viewing}
        settings={receiptSettings}
        open={viewing !== null}
        onOpenChange={(open) => { if (!open) setViewing(null) }}
      />
    </Panel>
  )
}

function collectorRoleShort(role: FeeTransaction['collectorRole']): string {
  if (role === 'teacher') return 'Teacher'
  if (role === 'self') return 'Self'
  return 'Office'
}
