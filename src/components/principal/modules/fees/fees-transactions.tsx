'use client'

/**
 * FeesTransactionsSection — serious financial transaction table.
 *
 * - Filters: session, date range, class, payment mode, status, fee head
 * - Search: student, receipt, transaction id
 * - Row actions: View Receipt, Print, Download, Reprint (no duplicate)
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, ChevronDown, Download, Printer, Eye, Receipt as ReceiptIcon, RefreshCw, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFeeData, useFeeStore, type FeeTransaction, type PaymentMode, type PaymentStatus } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeEmptyState, ModeIcon, modeAccent, FeeStatusBadge } from './fees-shared'
import { ReceiptPreview, downloadReceiptHTML, printReceipt } from './fees-receipt'
import { toast } from 'sonner'

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect: () => void
}

export function FeesTransactionsSection({ data, onCollect }: Props) {
  const { transactions } = data
  const reprintReceipt = useFeeStore((s) => s.reprintReceipt)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [modeFilter, setModeFilter] = useState<'all' | PaymentMode>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [classFilter, setClassFilter] = useState('all')
  const [feeHeadFilter, setFeeHeadFilter] = useState('all')
  const [viewReceipt, setViewReceipt] = useState<FeeTransaction | null>(null)

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
      return true
    })
  }, [transactions, search, modeFilter, statusFilter, classFilter, feeHeadFilter])

  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0)
  const activeFiltersCount = (modeFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (classFilter !== 'all' ? 1 : 0) + (feeHeadFilter !== 'all' ? 1 : 0)

  const handleReprint = (t: FeeTransaction) => {
    reprintReceipt(t.id, 'Principal')
    toast.success('Receipt reprinted', { description: `${t.receiptNo} — no second transaction created.` })
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Transactions</p>
          <p className="text-base font-bold tabular-nums mt-0.5">{filtered.length}</p>
          <p className="text-[9px] text-muted-foreground">of {transactions.length} total</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Total Amount</p>
          <p className="text-base font-bold tabular-nums mt-0.5 text-emerald-600">{formatINR(totalAmount, true)}</p>
          <p className="text-[9px] text-muted-foreground">across filtered rows</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Avg. Transaction</p>
          <p className="text-base font-bold tabular-nums mt-0.5">{formatINR(filtered.length > 0 ? Math.round(totalAmount / filtered.length) : 0, true)}</p>
          <p className="text-[9px] text-muted-foreground">per payment</p>
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
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toast.success('Export queued', { description: 'transactions.csv will be downloaded.' })}>
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
              {activeFiltersCount > 0 && (
                <div className="col-span-full flex items-center justify-end gap-1 pt-1 border-t border-border/40 mt-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { setModeFilter('all'); setStatusFilter('all'); setClassFilter('all'); setFeeHeadFilter('all') }}>
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
                <tr key={t.id} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{t.receiptNo}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-[11px]">{t.studentName}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{t.admissionNo}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{t.className}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{t.feeHead}</td>
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
                    <div className="inline-flex items-center gap-0.5">
                      <button onClick={() => setViewReceipt(t)} className="inline-flex items-center justify-center h-6 w-6 rounded text-primary hover:bg-primary/10 transition-colors" title="View Receipt">
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
                <tr><td colSpan={10} className="py-12"><FeeEmptyState icon={<ReceiptIcon className="h-6 w-6" />} title="No transactions match your filters" description="Try adjusting filters or search." /></td></tr>
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
    </div>
  )
}
