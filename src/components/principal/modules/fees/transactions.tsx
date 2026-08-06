'use client'

import { motion } from 'framer-motion'
import { Receipt, Search, Filter, Download } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  feeTransactions, type FeeTransaction,
} from '@/lib/mock/finance'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { modeIcon, modeAccent, modeVariant } from './data'

// Transaction History section — sticky-header table with search + mode and
// status filters. Mode icons use per-mode accent colors, tabular-nums on all
// currency. Sticky header with backdrop blur, hover states, max-height scroll.
export function TransactionsTable({
  search,
  setSearch,
  modeFilter,
  setModeFilter,
  statusFilter,
  setStatusFilter,
  filteredTxns,
}: {
  search: string
  setSearch: (v: string) => void
  modeFilter: string
  setModeFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  filteredTxns: FeeTransaction[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      <GlassCard className="p-3 sm:p-4 lg:p-5 shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold">Transaction History</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{filteredTxns.length} of {feeTransactions.length} transactions</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student / receipt…"
                className="pl-8 h-9 w-full sm:w-56"
              />
            </div>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="h-9 w-full sm:w-36">
                <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Net Banking">Net Banking</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 max-h-[28rem] overflow-y-auto rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Receipt</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Student</TableHead>
                <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wider text-muted-foreground">Class</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wider text-muted-foreground">Mode</TableHead>
                <TableHead className="text-center text-[11px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-[11px] uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="hidden xl:table-cell text-[11px] uppercase tracking-wider text-muted-foreground">Purpose</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTxns.map((t: FeeTransaction, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">{t.receiptNo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <GradientAvatar name={t.studentName} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{t.studentName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{t.admissionNo}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">{t.className}</TableCell>
                  <TableCell className="text-right font-display font-bold tabular-nums whitespace-nowrap">{formatINR(t.amount)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${modeAccent[t.mode]}`}>
                      {modeIcon[t.mode]}
                      {t.mode}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={t.status} variant={modeVariant[t.status]} dot />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">{formatDate(t.date)}</TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{t.purpose}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => toast.success('Receipt downloaded', { description: `${t.receiptNo}.pdf · ${formatINR(t.amount)}` })}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus-ring"
                      aria-label="Download receipt"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </motion.tr>
              ))}
              {filteredTxns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                    No transactions match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </motion.div>
  )
}
