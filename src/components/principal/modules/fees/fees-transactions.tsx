'use client'

/**
 * FeesTransactionsSection — serious financial transaction table.
 *
 * - Filters: session, date range, class, payment mode, status, fee head
 * - Search: student, receipt, transaction id
 * - Row actions: View Receipt, Print, Download, Reprint (no duplicate)
 * - Row click: opens a slide-from-right Transaction Detail Drawer showing
 *   student info, fee info, payment info, gateway info (if available),
 *   offline info, balance before/after, receipt actions, and audit info.
 *
 * Phase 4 fixes (FEE-SETTINGS-TXN):
 *   - Summary metrics now count ONLY successful transactions for amounts
 *     (Total Amount / Avg. Transaction). A separate count shows the success
 *     count vs the filtered-total count so the operator sees what's settled
 *     versus what's pending/failed.
 *   - Empty state copy updated to "No transactions match your filters."
 *   - Export now generates a real CSV from the filtered rows and reports
 *     the actual filtered count in the toast (previously a placeholder).
 *   - Detail drawer wired to real FeeTransaction fields (incl. gateway,
 *     settlement, reconciliation, refund fields) and to the student account
 *     ledger for the balance before/after computation.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, ChevronDown, Download, Printer, Eye,
  Receipt as ReceiptIcon, RefreshCw, X, User, Calendar,
  CreditCard, Landmark, ArrowRightLeft, ShieldCheck, AlertCircle,
  FileText, Banknote, Smartphone, Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  useFeeData, useFeeStore, txnCategory,
  type FeeTransaction, type PaymentMode, type PaymentStatus, type TransactionCategory,
} from '@/lib/store/fee-store'
import { formatINR, formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeEmptyState, ModeIcon, modeAccent, FeeStatusBadge, statusAccent } from './fees-shared'
import { ReceiptPreview, downloadReceiptHTML, printReceipt } from './fees-receipt'
import { toast } from 'sonner'

// ─── Financial type badge (Core Fee / Examination Fee / Additional) ────

const TXN_TYPE_META: Record<TransactionCategory, { label: string; className: string }> = {
  CORE: { label: 'Core Fee', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20' },
  EXAMINATION: { label: 'Exam Fee', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/20' },
  ADDITIONAL: { label: 'Additional', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/20' },
}

export function TransactionTypeBadge({ category, className }: { category: TransactionCategory; className?: string }) {
  const meta = TXN_TYPE_META[category] ?? TXN_TYPE_META.CORE
  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap', meta.className, className)}>
      {meta.label}
    </span>
  )
}

export function txnCategoryLabel(category: TransactionCategory): string {
  return (TXN_TYPE_META[category] ?? TXN_TYPE_META.CORE).label
}

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect?: () => void
}

export function FeesTransactionsSection({ data }: Props) {
  const { transactions, accounts } = data
  const reprintReceipt = useFeeStore((s) => s.reprintReceipt)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [modeFilter, setModeFilter] = useState<'all' | PaymentMode>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [classFilter, setClassFilter] = useState('all')
  const [feeHeadFilter, setFeeHeadFilter] = useState('all')
  // FINANCIAL TYPE filter — Core Fee / Examination Fee / Additional Charge.
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionCategory>('all')
  const [viewReceipt, setViewReceipt] = useState<FeeTransaction | null>(null)
  const [detailTxn, setDetailTxn] = useState<FeeTransaction | null>(null)

  const classes = useMemo(() => {
    const set = new Set(transactions.map((t) => t.className))
    return Array.from(set).sort()
  }, [transactions])
  const feeHeads = useMemo(() => {
    const set = new Set(transactions.map((t) => t.feeHead))
    return Array.from(set).sort()
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.toLowerCase().trim()
      if (q && !t.studentName.toLowerCase().includes(q) && !t.receiptNo.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q) && !t.admissionNo.toLowerCase().includes(q)) return false
      if (modeFilter !== 'all' && t.mode !== modeFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (classFilter !== 'all' && t.className !== classFilter) return false
      if (feeHeadFilter !== 'all' && t.feeHead !== feeHeadFilter) return false
      if (typeFilter !== 'all' && txnCategory(t) !== typeFilter) return false
      return true
    })
  }, [transactions, search, modeFilter, statusFilter, classFilter, feeHeadFilter, typeFilter])

  // ─── Summary metrics (FIX) ────────────────────────────────────────
  // Only count transactions with status === 'Success' for amount totals.
  // The Total count reflects ALL rows matching the current filters, and
  // the Success count shows how many of those have settled — so the
  // operator sees pending/failed volume separately.
  const successFiltered = useMemo(
    () => filtered.filter((t) => t.status === 'Success'),
    [filtered],
  )
  const totalAmount = successFiltered.reduce((s, t) => s + t.amount, 0)
  const successCount = successFiltered.length
  const totalCount = filtered.length
  const avgAmount = successCount > 0 ? Math.round(totalAmount / successCount) : 0

  const activeFiltersCount = (modeFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (classFilter !== 'all' ? 1 : 0) + (feeHeadFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0)

  const handleReprint = (t: FeeTransaction) => {
    reprintReceipt(t.id, 'Principal')
    toast.success('Receipt reprinted', { description: `${t.receiptNo} — no second transaction created.` })
  }

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info('Nothing to export', { description: 'No transactions match the current filters.' })
      return
    }
    const headers = ['Receipt No', 'Transaction ID', 'Student', 'Admission No', 'Class', 'Fee Head', 'Type', 'Amount', 'Mode', 'Status', 'Date', 'Collected By', 'Verified By', 'Reference No', 'Gateway', 'Gateway Payment ID', 'Settlement ID', 'UTR', 'Academic Year']
    const rows = filtered.map((t) => [
      t.receiptNo, t.id, t.studentName, t.admissionNo, t.className, t.feeHead,
      txnCategoryLabel(txnCategory(t)),
      String(t.amount), t.mode, t.status, t.date, t.collectedBy,
      t.verifiedBy ?? '', t.referenceNo ?? '',
      t.gateway ?? '', t.gatewayPaymentId ?? '', t.settlementId ?? '', t.utr ?? '', t.academicYear,
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => {
        const s = String(c ?? '')
        // Quote + escape per RFC 4180
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Export downloaded', { description: `${filtered.length} transaction(s) exported to CSV.` })
  }

  return (
    <div className="space-y-4">
      {/* Purpose header — distinguishes this full ledger from Collections' Recent Payments snapshot */}
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Complete Payment Ledger</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Search, filter, verify, print, download, or reprint any receipt. Click any row for the full transaction detail. The authoritative transaction history.
        </p>
      </div>

      {/* Summary strip (FIX: separate Success vs Total counts; amounts from Success only) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Transactions</p>
          <p className="text-base font-bold tabular-nums mt-0.5">{totalCount}</p>
          <p className="text-[9px] text-muted-foreground">
            <span className="text-emerald-600 font-semibold">{successCount} successful</span>
            {' · '}
            <span className="text-amber-600 font-semibold">{totalCount - successCount} other</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Total Amount</p>
          <p className="text-base font-bold tabular-nums mt-0.5 text-emerald-600">{formatINR(totalAmount, true)}</p>
          <p className="text-[9px] text-muted-foreground">successful only · across filtered rows</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Avg. Transaction</p>
          <p className="text-base font-bold tabular-nums mt-0.5">{formatINR(avgAmount, true)}</p>
          <p className="text-[9px] text-muted-foreground">per successful payment</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student / receipt / transaction ID…" className="pl-8 h-8 text-xs" />
        </div>
        <Button variant="outline" size="sm" className={cn('h-8 text-xs gap-1', showFilters && 'border-primary')} onClick={() => setShowFilters((v) => !v)}>
          <Filter className="h-3.5 w-3.5" /> Filters
          {activeFiltersCount > 0 && <span className="inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold bg-primary text-primary-foreground">{activeFiltersCount}</span>}
          <ChevronDown className={cn('h-3 w-3 transition-transform', showFilters && 'rotate-180')} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-lg border border-border bg-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Class</label>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Classes</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Payment Mode</label>
                <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as any)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Modes</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Status</option>
                  <option value="Success">Success</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Verification">Under Verification</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Fee Head</label>
                <select value={feeHeadFilter} onChange={(e) => setFeeHeadFilter(e.target.value)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Heads</option>
                  {feeHeads.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              {/* FINANCIAL TYPE — Core Fee / Examination Fee / Additional Charge */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Types</option>
                  <option value="CORE">Core Fee</option>
                  <option value="EXAMINATION">Examination Fee</option>
                  <option value="ADDITIONAL">Additional Charge</option>
                </select>
              </div>
              {activeFiltersCount > 0 && (
                <div className="col-span-full flex items-center justify-end gap-1 pt-1 border-t border-border/40 mt-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { setModeFilter('all'); setStatusFilter('all'); setClassFilter('all'); setFeeHeadFilter('all'); setTypeFilter('all') }}>
                    <X className="h-3 w-3" /> Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions table */}
      <FeePanel bodyClassName="p-0">
        <div className="overflow-x-auto max-h-[36rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Receipt</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Student</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden md:table-cell">Class</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden lg:table-cell">Fee Head</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Amount</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden sm:table-cell">Mode</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden xl:table-cell">Collected By</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10 cursor-pointer transition-colors"
                  onClick={() => setDetailTxn(t)}
                >
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{t.receiptNo}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-[11px]">{t.studentName}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{t.admissionNo}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{t.className}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{t.feeHead}</td>
                  <td className="px-3 py-2 text-center hidden md:table-cell">
                    <TransactionTypeBadge category={txnCategory(t)} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatINR(t.amount)}</td>
                  <td className="px-3 py-2 text-center hidden sm:table-cell">
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ring-1', modeAccent(t.mode))}>
                      <ModeIcon mode={t.mode} className="h-2.5 w-2.5" />
                      {t.mode}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center"><FeeStatusBadge status={t.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell whitespace-nowrap text-[10px]">{formatDate(t.date)}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden xl:table-cell text-[10px]">{t.collectedBy}</td>
                  <td className="px-3 py-2 text-center">
                    <div
                      className="inline-flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => setDetailTxn(t)} className="inline-flex items-center justify-center h-6 w-6 rounded text-primary hover:bg-primary/10 transition-colors" title="View Detail">
                        <Eye className="h-3 w-3" />
                      </button>
                      <button onClick={() => printReceipt(t, receiptSettings)} className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Print">
                        <Printer className="h-3 w-3" />
                      </button>
                      <button onClick={() => downloadReceiptHTML(t, receiptSettings)} className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Download">
                        <Download className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleReprint(t)} className="inline-flex items-center justify-center h-6 w-6 rounded text-amber-600 hover:bg-amber-500/10 transition-colors" title="Reprint (no duplicate)">
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="py-12"><FeeEmptyState icon={<ReceiptIcon className="h-6 w-6" />} title="No transactions match your filters" description="Try adjusting the search or filter criteria." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </FeePanel>

      {/* Receipt preview modal */}
      <AnimatePresence>
        {viewReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ReceiptPreview
                transaction={viewReceipt}
                settings={receiptSettings}
                onClose={() => setViewReceipt(null)}
                onPrint={() => { printReceipt(viewReceipt, receiptSettings); toast.success('Print dialog opened') }}
                onDownload={() => { downloadReceiptHTML(viewReceipt, receiptSettings); toast.success('Receipt downloaded', { description: `${viewReceipt.receiptNo}.html` }) }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction detail drawer (slide-from-right) */}
      <TransactionDetailDrawer
        txn={detailTxn}
        accounts={accounts}
        receiptSettings={receiptSettings}
        onClose={() => setDetailTxn(null)}
        onViewReceipt={(t) => setViewReceipt(t)}
        onPrint={(t) => { printReceipt(t, receiptSettings); toast.success('Print dialog opened') }}
        onDownload={(t) => { downloadReceiptHTML(t, receiptSettings); toast.success('Receipt downloaded', { description: `${t.receiptNo}.html` }) }}
        onReprint={handleReprint}
      />
    </div>
  )
}

// ─── Transaction Detail Drawer ──────────────────────────────────────

interface DrawerProps {
  txn: FeeTransaction | null
  accounts: ReturnType<typeof useFeeData>['accounts']
  receiptSettings: ReturnType<typeof useFeeStore.getState>['receiptSettings']
  onClose: () => void
  onViewReceipt: (t: FeeTransaction) => void
  onPrint: (t: FeeTransaction) => void
  onDownload: (t: FeeTransaction) => void
  onReprint: (t: FeeTransaction) => void
}

function TransactionDetailDrawer({ txn, accounts, onClose, onViewReceipt, onPrint, onDownload, onReprint }: DrawerProps) {
  if (!txn) return null

  // Look up the student account + ledger to compute balance before/after.
  const account = accounts.find((a) => a.studentId === txn.studentId)
  let balanceBefore: number | null = null
  let balanceAfter: number | null = null
  if (account) {
    const idx = account.ledger.findIndex((e) => e.id === `LED-${txn.studentId}-${txn.id}`)
    if (idx >= 0) {
      balanceAfter = account.ledger[idx].balance
      balanceBefore = idx > 0 ? account.ledger[idx - 1].balance : 0
    }
  }

  const isOnline = txn.paymentSource === 'online' || txn.paymentSource === 'gateway' || !!txn.gateway
  const hasGateway = !!txn.gateway || !!txn.gatewayPaymentId || !!txn.gatewayOrderId || !!txn.settlementId
  const isOffline = txn.paymentSource === 'offline' || ['Cash', 'Cheque', 'Bank Transfer'].includes(txn.mode)
  const isRefunded = txn.status === 'Refunded' || !!txn.refundedAmount

  return (
    <Sheet open={!!txn} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <ReceiptIcon className="h-4 w-4 text-emerald-600" />
            Transaction Detail
          </SheetTitle>
          <SheetDescription className="text-[11px]">
            {txn.receiptNo} · {txn.id}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Status banner */}
          <div className={cn(
            'rounded-lg border px-3 py-2 flex items-center justify-between',
            txn.status === 'Success' && 'bg-emerald-500/[0.04] border-emerald-500/20',
            txn.status === 'Pending' && 'bg-amber-500/[0.04] border-amber-500/20',
            txn.status === 'Under Verification' && 'bg-sky-500/[0.04] border-sky-500/20',
            txn.status === 'Failed' && 'bg-rose-500/[0.04] border-rose-500/20',
            txn.status === 'Refunded' && 'bg-violet-500/[0.04] border-violet-500/20',
          )}>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Status</p>
              <p className="text-base font-bold mt-0.5">{txn.status}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Amount</p>
              <p className={cn('text-xl font-bold tabular-nums mt-0.5', txn.status === 'Success' ? 'text-emerald-600' : txn.status === 'Failed' ? 'text-rose-600' : '')}>
                {formatINR(txn.amount)}
              </p>
            </div>
          </div>

          {/* Student info */}
          <DetailSection icon={<User className="h-3.5 w-3.5" />} title="Student Information">
            <DetailRow label="Student Name" value={txn.studentName} />
            <DetailRow label="Admission No" value={txn.admissionNo} mono />
            <DetailRow label="Class" value={txn.className} />
            {account && <DetailRow label="Roll No" value={account.rollNo || '—'} />}
            {account && <DetailRow label="Guardian" value={`${account.guardianName} · ${account.guardianPhone}`} />}
          </DetailSection>

          {/* Fee info */}
          <DetailSection icon={<FileText className="h-3.5 w-3.5" />} title="Fee Information">
            <DetailRow
              label="Type"
              value={<TransactionTypeBadge category={txnCategory(txn)} />}
            />
            <DetailRow label="Fee Head / Charge" value={txn.feeHead} />
            <DetailRow label="Purpose" value={txn.purpose} />
            <DetailRow label="Academic Year" value={txn.academicYear} />
            {account && (
              <>
                <DetailRow label="Net Payable" value={formatINR(account.netPayable)} />
                <DetailRow label="Outstanding" value={formatINR(account.outstanding)} />
              </>
            )}
          </DetailSection>

          {/* Payment info */}
          <DetailSection icon={<CreditCard className="h-3.5 w-3.5" />} title="Payment Information">
            <DetailRow
              label="Mode"
              value={
                <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ring-1', modeAccent(txn.mode))}>
                  <ModeIcon mode={txn.mode} className="h-2.5 w-2.5" />
                  {txn.mode}
                </span>
              }
            />
            <DetailRow label="Status" value={<FeeStatusBadge status={txn.status} />} />
            <DetailRow label="Receipt No" value={txn.receiptNo} mono />
            <DetailRow label="Transaction ID" value={txn.id} mono />
            <DetailRow label="Date / Time" value={`${formatDate(txn.date)} ${txn.verifiedAt ? `· verified ${formatRelativeTime(txn.verifiedAt)}` : ''}`} />
            {txn.referenceNo && <DetailRow label="Reference No" value={txn.referenceNo} mono />}
            {txn.meta?.bankName && <DetailRow label="Bank" value={txn.meta.bankName} />}
            {txn.meta?.chequeNumber && <DetailRow label="Cheque No" value={`${txn.meta.chequeNumber}${txn.meta.chequeDate ? ` · ${formatDate(txn.meta.chequeDate)}` : ''}`} mono />}
            {txn.meta?.cardLast4 && <DetailRow label="Card Last 4" value={`**** ${txn.meta.cardLast4}`} mono />}
            {txn.meta?.upiId && <DetailRow label="UPI ID" value={txn.meta.upiId} mono />}
            {txn.meta?.neftUtr && <DetailRow label="NEFT UTR" value={txn.meta.neftUtr} mono />}
          </DetailSection>

          {/* Gateway info (only if applicable) */}
          {hasGateway && (
            <DetailSection icon={<Landmark className="h-3.5 w-3.5" />} title="Gateway Information">
              {txn.gateway && <DetailRow label="Gateway" value={<span className="capitalize">{txn.gateway}</span>} />}
              {txn.gatewayPaymentId && <DetailRow label="Gateway Payment ID" value={txn.gatewayPaymentId} mono />}
              {txn.gatewayOrderId && <DetailRow label="Gateway Order ID" value={txn.gatewayOrderId} mono />}
              {txn.settlementId && <DetailRow label="Settlement ID" value={txn.settlementId} mono />}
              {txn.settlementStatus && (
                <DetailRow
                  label="Settlement Status"
                  value={
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold capitalize',
                      txn.settlementStatus === 'settled' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      txn.settlementStatus === 'pending' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                      txn.settlementStatus === 'failed' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                      txn.settlementStatus === 'reversed' && 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
                    )}>
                      {txn.settlementStatus}
                    </span>
                  }
                />
              )}
              {txn.utr && <DetailRow label="UTR" value={txn.utr} mono />}
              {txn.gatewayFee !== undefined && <DetailRow label="Gateway Fee" value={formatINR(txn.gatewayFee)} accent="rose" />}
              {txn.taxOnFee !== undefined && <DetailRow label="Tax on Fee" value={formatINR(txn.taxOnFee)} accent="rose" />}
              {txn.netAmount !== undefined && <DetailRow label="Net Amount" value={formatINR(txn.netAmount)} accent="emerald" />}
              {txn.reconciliationStatus && (
                <DetailRow
                  label="Reconciliation"
                  value={
                    <span className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold capitalize',
                      txn.reconciliationStatus === 'reconciled' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      txn.reconciliationStatus === 'pending' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                      txn.reconciliationStatus === 'unreconciled' && 'bg-muted text-muted-foreground',
                      txn.reconciliationStatus === 'exception' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    )}>
                      <ArrowRightLeft className="h-2.5 w-2.5" />
                      {txn.reconciliationStatus}
                    </span>
                  }
                />
              )}
            </DetailSection>
          )}

          {/* Refund info (if applicable) */}
          {isRefunded && (
            <DetailSection icon={<AlertCircle className="h-3.5 w-3.5" />} title="Refund Information">
              {txn.refundedAmount !== undefined && <DetailRow label="Refunded Amount" value={formatINR(txn.refundedAmount)} accent="rose" />}
              {txn.refundReason && <DetailRow label="Reason" value={txn.refundReason} />}
            </DetailSection>
          )}

          {/* Offline info (if applicable) */}
          {isOffline && (
            <DetailSection icon={<Banknote className="h-3.5 w-3.5" />} title="Offline Collection">
              <DetailRow label="Collected By" value={txn.collectedBy} />
              <DetailRow
                label="Verification"
                value={
                  txn.verifiedBy
                    ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-2.5 w-2.5" /> Verified by {txn.verifiedBy}</span>
                    : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300">Pending verification</span>
                }
              />
              {txn.verifiedAt && <DetailRow label="Verified At" value={`${formatDate(txn.verifiedAt)} · ${formatRelativeTime(txn.verifiedAt)}`} />}
            </DetailSection>
          )}

          {/* Online collection info (if applicable) */}
          {isOnline && !hasGateway && (
            <DetailSection icon={<Smartphone className="h-3.5 w-3.5" />} title="Online Collection">
              <DetailRow label="Collected By" value={txn.collectedBy} />
              <DetailRow label="Source" value={<span className="capitalize">{txn.paymentSource ?? 'online'}</span>} />
            </DetailSection>
          )}

          {/* Balance before / after (if computable from the student ledger) */}
          {balanceAfter !== null && (
            <DetailSection icon={<Wallet className="h-3.5 w-3.5" />} title="Account Balance Impact">
              <DetailRow label="Balance Before" value={balanceBefore !== null ? formatINR(Math.max(0, balanceBefore)) : '—'} />
              <DetailRow label="Payment Applied" value={`− ${formatINR(txn.amount)}`} accent="emerald" />
              <DetailRow label="Balance After" value={formatINR(Math.max(0, balanceAfter))} />
            </DetailSection>
          )}

          {/* Audit info */}
          <DetailSection icon={<Calendar className="h-3.5 w-3.5" />} title="Audit Information">
            <DetailRow label="Recorded On" value={formatDate(txn.date)} />
            <DetailRow label="Collected By" value={txn.collectedBy} />
            {txn.verifiedBy && <DetailRow label="Verified By" value={txn.verifiedBy} />}
            {txn.verifiedAt && <DetailRow label="Verified At" value={`${formatDate(txn.verifiedAt)} · ${formatRelativeTime(txn.verifiedAt)}`} />}
            <DetailRow label="Academic Year" value={txn.academicYear} />
          </DetailSection>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border bg-card px-4 py-3 flex items-center gap-2 flex-wrap">
          <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => onViewReceipt(txn)}>
            <Eye className="h-3.5 w-3.5" /> View Receipt
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onPrint(txn)}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onDownload(txn)}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-amber-600 ml-auto" onClick={() => { onReprint(txn); onClose() }}>
            <RefreshCw className="h-3.5 w-3.5" /> Reprint
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Drawer sub-components ───────────────────────────────────────────

function DetailSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground">{icon}</span>
        <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{title}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 space-y-1">
        {children}
      </div>
    </div>
  )
}

function DetailRow({
  label, value, mono, accent,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  accent?: 'emerald' | 'rose' | 'amber'
}) {
  const accentClass = {
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
  }[accent ?? ''] ?? ''
  return (
    <div className="flex items-start justify-between gap-3 text-[11px]">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('font-medium text-right min-w-0 break-words', mono && 'font-mono text-[10px]', accentClass)}>{value || '—'}</span>
    </div>
  )
}
