'use client'

/**
 * FeesPendingDuesSection — operational pending dues view.
 *
 * - Filters: class, status, aging, amount range
 * - Search by name / ID / admission
 * - Sortable list with bulk actions
 * - Per-student actions: Collect / View Account / Remind
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Wallet, Eye, Send, AlertCircle, CheckCircle2, X,
  ChevronDown, Users, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFeeData, type StudentFeeAccount, type FeePaymentStatus } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeStat, FeeStatusBadge, FeeEmptyState } from './fees-shared'
import { toast } from 'sonner'

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect: (studentId: string) => void
}

type StatusFilter = 'all' | FeePaymentStatus
type AgingFilter = 'all' | 'due-soon' | '1-7' | '8-30' | '31-60' | '60+'

export function FeesPendingDuesSection({ data, onCollect }: Props) {
  const { accounts } = data
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('all')
  const [minAmount, setMinAmount] = useState<number>(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [viewAccount, setViewAccount] = useState<StudentFeeAccount | null>(null)

  const classes = useMemo(() => {
    const set = new Set(accounts.map((a) => a.className))
    return Array.from(set).sort()
  }, [accounts])

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (a.outstanding <= 0) return false
      const q = search.toLowerCase().trim()
      if (q && !a.studentName.toLowerCase().includes(q) && !a.admissionNo.toLowerCase().includes(q) && !a.studentId.toLowerCase().includes(q)) return false
      if (classFilter !== 'all' && a.className !== classFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (minAmount > 0 && a.totalDue < minAmount) return false
      if (agingFilter !== 'all') {
        if (agingFilter === 'due-soon' && a.daysOverdue > 0) return false
        if (agingFilter === '1-7' && (a.daysOverdue <= 0 || a.daysOverdue > 7)) return false
        if (agingFilter === '8-30' && (a.daysOverdue <= 7 || a.daysOverdue > 30)) return false
        if (agingFilter === '31-60' && (a.daysOverdue <= 30 || a.daysOverdue > 60)) return false
        if (agingFilter === '60+' && a.daysOverdue <= 60) return false
      }
      return true
    }).sort((a, b) => b.totalDue - a.totalDue)
  }, [accounts, search, classFilter, statusFilter, agingFilter, minAmount])

  const totalDue = filtered.reduce((s, a) => s + a.totalDue, 0)
  const totalOutstanding = filtered.reduce((s, a) => s + a.outstanding, 0)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((a) => a.studentId)))
    }
  }

  const bulkRemind = () => {
    toast.success(`Reminders dispatched to ${selected.size} guardians`, { description: 'SMS + Email sent.' })
    setSelected(new Set())
  }

  const activeFiltersCount = (classFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (agingFilter !== 'all' ? 1 : 0) + (minAmount > 0 ? 1 : 0)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <FeeStat label="Students with Dues" value={filtered.length} sub={`of ${accounts.filter((a) => a.outstanding > 0).length} total`} />
        <FeeStat label="Outstanding" value={formatINR(totalOutstanding, true)} accent="rose" />
        <FeeStat label="Total Due (with late fee)" value={formatINR(totalDue, true)} accent="amber" />
      </div>

      {/* Filter + search bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student / ID / admission…" className="pl-8 h-8 text-xs" />
        </div>
        <Button variant="outline" size="sm" className={cn('h-8 text-xs gap-1', showFilters && 'border-primary')} onClick={() => setShowFilters((v) => !v)}>
          <Filter className="h-3.5 w-3.5" /> Filters
          {activeFiltersCount > 0 && <span className="inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold bg-primary text-primary-foreground">{activeFiltersCount}</span>}
          <ChevronDown className={cn('h-3 w-3 transition-transform', showFilters && 'rotate-180')} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toast.success('Export queued', { description: 'pending-dues.csv will be downloaded.' })}>
          <Mail className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Class</label>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Classes</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Status</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Due">Due</option>
                  <option value="Partially Paid">Partially Paid</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Aging</label>
                <select value={agingFilter} onChange={(e) => setAgingFilter(e.target.value as AgingFilter)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2 mt-1">
                  <option value="all">All Aging</option>
                  <option value="due-soon">Due Soon</option>
                  <option value="1-7">1–7 days</option>
                  <option value="8-30">8–30 days</option>
                  <option value="31-60">31–60 days</option>
                  <option value="60+">60+ days</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Min Amount</label>
                <Input type="number" value={minAmount || ''} onChange={(e) => setMinAmount(Number(e.target.value))} placeholder="0" className="h-7 text-xs tabular-nums mt-1" />
              </div>
              {activeFiltersCount > 0 && (
                <div className="col-span-full flex items-center justify-end gap-1 pt-1 border-t border-border/40 mt-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { setClassFilter('all'); setStatusFilter('all'); setAgingFilter('all'); setMinAmount(0) }}>
                    <X className="h-3 w-3" /> Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk actions */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-primary/30 bg-primary/5 p-2 flex items-center justify-between gap-2"
          >
            <p className="text-xs font-medium">{selected.size} selected</p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={bulkRemind}>
                <Send className="h-3 w-3" /> Remind All
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={() => setSelected(new Set())}>
                <X className="h-3 w-3" /> Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <FeePanel bodyClassName="p-0">
        {/* Header row with select-all */}
        <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between gap-2 bg-muted/20">
          <label className="flex items-center gap-2 text-[11px] font-semibold cursor-pointer">
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} className="rounded" />
            {filtered.length} students with dues
          </label>
          <p className="text-[10px] text-muted-foreground tabular-nums">{formatINR(totalDue, true)} total</p>
        </div>

        <div className="max-h-[32rem] overflow-y-auto divide-y divide-border/30">
          {filtered.map((a) => (
            <div key={a.studentId} className={cn('flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors', selected.has(a.studentId) && 'bg-primary/5')}>
              <input type="checkbox" checked={selected.has(a.studentId)} onChange={() => toggleSelect(a.studentId)} aria-label={`Select ${a.studentName}`} className="rounded shrink-0" />
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-semibold',
                a.status === 'Overdue' ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-amber-500 to-orange-600')}>
                {a.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{a.studentName}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{a.admissionNo} · {a.className}-{a.section}</p>
              </div>
              <div className="hidden sm:block text-right shrink-0 tabular-nums">
                <p className="text-[9px] text-muted-foreground">Outstanding</p>
                <p className="text-xs font-bold text-rose-600">{formatINR(a.outstanding, true)}</p>
              </div>
              <div className="hidden md:block text-right shrink-0 tabular-nums">
                <p className="text-[9px] text-muted-foreground">Late Fee</p>
                <p className="text-xs font-bold text-amber-600">{a.lateFee > 0 ? formatINR(a.lateFee, true) : '—'}</p>
              </div>
              <FeeStatusBadge status={a.status} />
              <div className="flex items-center gap-0.5 shrink-0">
                <Button size="sm" className="h-7 text-[9px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5" onClick={() => onCollect(a.studentId)}>
                  <Wallet className="h-2.5 w-2.5" /> Collect
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewAccount(a)} title="View Account" aria-label={`View ${a.studentName} account`}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.success('Reminder sent', { description: `SMS sent to guardian of ${a.studentName}.` })} title="Send Reminder" aria-label={`Send reminder to ${a.studentName}`}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <FeeEmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="No dues found" description="Try adjusting filters or search." />
          )}
        </div>
      </FeePanel>

      {/* Quick view account (read-only summary) */}
      <AnimatePresence>
        {viewAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewAccount(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-border bg-gradient-to-br from-rose-500/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold',
                    viewAccount.status === 'Overdue' ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-amber-500 to-orange-600')}>
                    {viewAccount.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{viewAccount.studentName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{viewAccount.admissionNo} · {viewAccount.className}-{viewAccount.section}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewAccount(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <FeeStat label="Total Applicable" value={formatINR(viewAccount.totalApplicable, true)} />
                  <FeeStat label="Concession" value={viewAccount.concession > 0 ? `-${formatINR(viewAccount.concession, true)}` : '—'} accent="emerald" />
                  <FeeStat label="Net Payable" value={formatINR(viewAccount.netPayable, true)} />
                  <FeeStat label="Total Paid" value={formatINR(viewAccount.paid, true)} accent="emerald" />
                  <FeeStat label="Outstanding" value={formatINR(viewAccount.outstanding, true)} accent="rose" />
                  <FeeStat label="Total Due" value={formatINR(viewAccount.totalDue, true)} accent="amber" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border p-2 text-[10px] text-muted-foreground">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {viewAccount.daysOverdue > 0
                    ? `${viewAccount.daysOverdue} days overdue · Late fee ${formatINR(viewAccount.lateFee, true)} applied`
                    : 'No overdue · Within grace period'}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground">{viewAccount.transactions.length} transactions · Guardian: {viewAccount.guardianName}</p>
                  <Button size="sm" className="h-7 text-[10px] gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" onClick={() => { onCollect(viewAccount.studentId); setViewAccount(null) }}>
                    <Wallet className="h-3 w-3" /> Collect Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
