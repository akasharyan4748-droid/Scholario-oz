'use client'

/**
 * FeesModule — Principal Fee Management & Financial Control Center.
 *
 * Connected to canonical students store via useFeeData().
 * All numbers derive from the same StudentRecord[] used across the ERP.
 *
 * Sections:
 *   1. KPI Dashboard — Total Expected, Collected, Outstanding, Overdue
 *   2. Analytics — Collection trend, fee head distribution, aging analysis
 *   3. Fee Structures — Configurable fee heads by class level
 *   4. Transaction History — Searchable/filterable with receipt download
 *   5. Pending Dues — Actionable student accounts with aging
 *   6. Class-wise Finance — Per-class collection performance
 *   7. Cash Approvals — Principal verification workflow
 */

import { useState, useMemo } from 'react'
import {
  IndianRupee, Send, Download, Plus, Wallet, Receipt, AlertCircle,
  Users, Clock, Banknote, CheckCircle2, FileText, TrendingUp,
  ChevronRight, ShieldCheck, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { CollapsibleSection } from '@/components/principal/modules/exams/collapsible-section'
import { useFeeData, FEE_STRUCTURES, type FeeTransaction, type StudentFeeAccount, type PaymentMode } from '@/lib/store/fee-store'
import { school } from '@/lib/mock/school'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function FeesModule() {
  const { accounts, transactions, analytics, feeStructures } = useFeeData('2025-2026')
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState<StudentFeeAccount | null>(null)
  const [principalCashRequests, setPrincipalCashRequests] = useState([
    { id: 'PCASH-01', studentName: 'Aarav Sharma', admissionNo: 'DSO2025018', class: 'Class 10-A', promotedClass: 'Class 11-A', amount: 65000, receiver: `${school.principal} (Principal)`, date: '2025-03-28', status: 'Pending Principal Acceptance' as const },
    { id: 'PCASH-02', studentName: 'Vihaan Joshi', admissionNo: 'DSO2025035', class: 'Class 10-A', promotedClass: 'Class 11-A', amount: 65000, receiver: 'Ananya Sharma (Class Teacher)', date: '2025-03-27', status: 'Collected by Teacher' as const },
  ])

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.toLowerCase()
      const matchesSearch = !q || t.studentName.toLowerCase().includes(q) || t.receiptNo.toLowerCase().includes(q) || t.admissionNo.toLowerCase().includes(q)
      const matchesMode = modeFilter === 'all' || t.mode === modeFilter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesSearch && matchesMode && matchesStatus
    })
  }, [transactions, search, modeFilter, statusFilter])

  const handleAcceptCash = (id: string, name: string, amt: number) => {
    setPrincipalCashRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Confirmed by Principal' as const } : r))
    toast.success('Principal Cash Collection Confirmed!', { description: `Collected ${formatINR(amt)} from ${name}.` })
  }

  const pendingDues = accounts.filter((a) => a.outstanding > 0).sort((a, b) => b.totalDue - a.totalDue)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
            Fee Management
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Academic Year {school.academicYear} · Collections, dues & receipts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toast.success('Reminders dispatched', { description: `SMS sent to ${pendingDues.length} guardians.` })}>
            <Send className="h-3.5 w-3.5" /> Remind
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toast.success('Report exported', { description: 'fees-report-2025-26.xlsx' })}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.info('Collect Payment', { description: 'Select a student from Pending Dues to collect payment.' })}>
            <Plus className="h-3.5 w-3.5" /> Collect Payment
          </Button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <FeeKpi icon={<Wallet className="h-4 w-4" />} label="Total Expected" value={formatINR(analytics.totalExpected, true)} accent="emerald" />
        <FeeKpi icon={<CheckCircle2 className="h-4 w-4" />} label="Total Collected" value={formatINR(analytics.totalCollected, true)} sub={`${analytics.collectionRate}% collection rate`} accent="emerald" />
        <FeeKpi icon={<AlertCircle className="h-4 w-4" />} label="Outstanding" value={formatINR(analytics.totalOutstanding, true)} sub={`${analytics.pendingCount} students`} accent="rose" />
        <FeeKpi icon={<Clock className="h-4 w-4" />} label="Pending Verification" value={String(analytics.pendingVerification)} sub="cash & pending txns" accent="amber" />
      </div>

      {/* Analytics */}
      <CollapsibleSection title="Analytics" subtitle="collection trends & fee head distribution" accent="violet" defaultOpen={true}>
        <div className="p-3 space-y-3">
          {/* Collection Rate bar */}
          <div className="rounded-lg border border-border/60 bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Collection Rate</p>
              <span className="text-[11px] font-bold tabular-nums">{analytics.collectionRate}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${analytics.collectionRate}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[9px] text-muted-foreground">
              <span>Collected: {formatINR(analytics.totalCollected, true)}</span>
              <span>Expected: {formatINR(analytics.totalExpected, true)}</span>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="rounded-lg border border-border/60 bg-card p-3">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Monthly Collection Trend</p>
            <div className="flex items-end gap-1 h-20">
              {analytics.monthly.map((m) => {
                const max = Math.max(...analytics.monthly.map((x) => x.collected))
                const h = max > 0 ? Math.round((m.collected / max) * 100) : 0
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-emerald-500/60 hover:bg-emerald-500 transition-colors" style={{ height: `${h}%` }} title={`${m.month}: ${formatINR(m.collected)}`} />
                    <span className="text-[8px] text-muted-foreground">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Fee head distribution + Aging */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fee head distribution */}
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Fee Head Distribution</p>
              <div className="space-y-1.5">
                {analytics.byCategory.map((c) => {
                  const total = analytics.byCategory.reduce((s, x) => s + x.value, 0)
                  const pct = total > 0 ? Math.round((c.value / total) * 100) : 0
                  return (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-[10px] font-medium w-20">{c.name}</span>
                      <div className="flex-1 h-3 rounded bg-muted/30 overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                      </div>
                      <span className="text-[9px] tabular-nums text-right w-16">{formatINR(c.value, true)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Aging analysis */}
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Overdue Aging Analysis</p>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: 'Due Soon', value: analytics.aging.dueSoon, color: 'text-amber-600' },
                  { label: '1–7d', value: analytics.aging['1-7'], color: 'text-amber-600' },
                  { label: '8–30d', value: analytics.aging['8-30'], color: 'text-orange-600' },
                  { label: '31–60d', value: analytics.aging['31-60'], color: 'text-rose-600' },
                  { label: '60+d', value: analytics.aging['60+'], color: 'text-rose-700' },
                ].map((a) => (
                  <div key={a.label} className="text-center p-1.5 rounded-md bg-muted/30">
                    <p className={cn('text-sm font-bold tabular-nums', a.color)}>{a.value}</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5">{a.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Class-wise Finance */}
      <CollapsibleSection title="Class-wise Finance" subtitle="per-class collection performance" accent="sky" defaultOpen={false}>
        <div className="overflow-x-auto max-h-[16rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Class</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Students</th>
                <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Expected</th>
                <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Collected</th>
                <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Outstanding</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Collection %</th>
              </tr>
            </thead>
            <tbody>
              {analytics.classWise.map((c, i) => (
                <tr key={i} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
                  <td className="px-2 py-1.5 font-medium">{c.className}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums">{c.students}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatINR(c.expected, true)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-emerald-600">{formatINR(c.collected, true)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-rose-600">{formatINR(c.outstanding, true)}</td>
                  <td className="px-2 py-1.5 text-center">
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
                      c.collectionRate >= 75 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                      c.collectionRate >= 50 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
                      'bg-rose-500/10 text-rose-700 dark:text-rose-300')}>
                      {c.collectionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Fee Structures */}
      <CollapsibleSection title="Fee Structures" subtitle="configurable fee heads by class level" accent="violet" defaultOpen={false}>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {feeStructures.map((f) => (
            <div key={f.id} className="rounded-lg border border-border/60 bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-primary/10 text-primary">{f.category}</span>
                <span className="text-[10px] text-muted-foreground">{f.className}</span>
              </div>
              <p className="font-display text-xl font-bold tabular-nums">{formatINR(f.annual, true)}</p>
              <div className="space-y-1 mt-2 pt-2 border-t border-border/40">
                {f.components.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-mono font-semibold tabular-nums">{formatINR(c.amount, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Transaction History */}
      <CollapsibleSection title="Transaction History" subtitle={`${filteredTxns.length} of ${transactions.length} transactions`} accent="cyan">
        <div className="p-3 space-y-2">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student / receipt / ID…" className="h-7 text-xs w-48" />
            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="h-7 text-[10px] rounded border border-border/40 px-1 bg-transparent">
              <option value="all">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-7 text-[10px] rounded border border-border/40 px-1 bg-transparent">
              <option value="all">All Status</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          {/* Table */}
          <div className="overflow-x-auto max-h-[24rem] rounded-lg border border-border/60">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr>
                  <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Receipt</th>
                  <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Student</th>
                  <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground hidden md:table-cell">Class</th>
                  <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Amount</th>
                  <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground hidden sm:table-cell">Mode</th>
                  <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((t) => (
                  <tr key={t.id} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
                    <td className="px-2 py-1.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{t.receiptNo}</td>
                    <td className="px-2 py-1.5">
                      <p className="font-medium text-[11px]">{t.studentName}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{t.admissionNo}</p>
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground hidden md:table-cell">{t.className}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{formatINR(t.amount)}</td>
                    <td className="px-2 py-1.5 text-center hidden sm:table-cell">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium',
                        t.mode === 'UPI' ? 'bg-emerald-500/10 text-emerald-600' :
                        t.mode === 'Cash' ? 'bg-rose-500/10 text-rose-600' :
                        t.mode === 'Cheque' ? 'bg-violet-500/10 text-violet-600' :
                        'bg-amber-500/10 text-amber-600')}>
                        {t.mode}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold',
                        t.status === 'Success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                        t.status === 'Pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
                        t.status === 'Under Verification' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' :
                        'bg-rose-500/10 text-rose-700 dark:text-rose-300')}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground hidden lg:table-cell whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => toast.success('Receipt downloaded', { description: `${t.receiptNo}.pdf · ${formatINR(t.amount)}` })} className="inline-flex items-center justify-center h-6 w-6 rounded text-primary hover:bg-primary/10 transition-colors">
                        <Download className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTxns.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No transactions match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* Pending Dues */}
      <CollapsibleSection title="Pending Dues" subtitle={`${pendingDues.length} students with outstanding fees`} accent="rose" defaultOpen={true}>
        <div className="p-3 space-y-2 max-h-[28rem] overflow-y-auto">
          {pendingDues.map((d) => (
            <div key={d.studentId} className="rounded-lg border border-border/60 bg-card p-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{d.studentName}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{d.admissionNo} · {d.className}</p>
                </div>
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold',
                  d.status === 'Overdue' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' :
                  d.status === 'Partially Paid' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
                  'bg-sky-500/10 text-sky-700 dark:text-sky-300')}>
                  {d.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-md bg-muted/30 px-2 py-1">
                  <p className="text-[8px] text-muted-foreground uppercase">Outstanding</p>
                  <p className="text-[11px] font-bold text-rose-600 tabular-nums">{formatINR(d.outstanding, true)}</p>
                </div>
                <div className="rounded-md bg-muted/30 px-2 py-1">
                  <p className="text-[8px] text-muted-foreground uppercase">Late Fee</p>
                  <p className="text-[11px] font-bold text-amber-600 tabular-nums">{formatINR(d.lateFee, true)}</p>
                </div>
                <div className="rounded-md bg-muted/30 px-2 py-1">
                  <p className="text-[8px] text-muted-foreground uppercase">Total Due</p>
                  <p className="text-[11px] font-bold tabular-nums">{formatINR(d.totalDue, true)}</p>
                </div>
                <div className="rounded-md bg-muted/30 px-2 py-1">
                  <p className="text-[8px] text-muted-foreground uppercase">Last Payment</p>
                  <p className="text-[10px] font-medium">{d.lastPaymentDate ? formatDate(d.lastPaymentDate) : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/40">
                <Button size="sm" className="h-6 text-[9px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setSelectedAccount(d)}>
                  <Wallet className="h-2.5 w-2.5" /> Collect
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1" onClick={() => setSelectedAccount(d)}>
                  <Eye className="h-2.5 w-2.5" /> View Account
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1" onClick={() => toast.success('Reminder sent', { description: `SMS dispatched to guardian of ${d.studentName}.` })}>
                  <Send className="h-2.5 w-2.5" /> Remind
                </Button>
              </div>
            </div>
          ))}
          {pendingDues.length === 0 && (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">All fees are paid. No pending dues.</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Cash Approvals */}
      <CollapsibleSection title="Cash Collection & Approvals" subtitle="principal verification workflow" accent="amber" defaultOpen={false}>
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {principalCashRequests.map((req) => {
            const done = req.status.includes('Confirmed')
            return (
              <div key={req.id} className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{req.studentName}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{req.admissionNo}</p>
                  </div>
                  <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold',
                    done ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
                    {req.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-border/40">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-emerald-600 tabular-nums">{formatINR(req.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Receiver:</span>
                  <span className="font-medium truncate">{req.receiver}</span>
                </div>
                {req.status === 'Pending Principal Acceptance' ? (
                  <Button size="sm" className="w-full h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAcceptCash(req.id, req.studentName, req.amount)}>
                    <CheckCircle2 className="h-3 w-3" /> Accept Cash & Approve
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1" onClick={() => toast.success('Receipt issued', { description: `Principal-signed receipt for ${req.studentName}.` })}>
                    <FileText className="h-3 w-3" /> View Receipt
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Student Fee Account Modal */}
      {selectedAccount && (
        <StudentFeeAccountModal account={selectedAccount} onClose={() => setSelectedAccount(null)} />
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function FeeKpi({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: 'emerald' | 'rose' | 'amber' }) {
  const accentMap = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-500/10 text-rose-600',
    amber: 'bg-amber-500/10 text-amber-600',
  }
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</p>
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', accentMap[accent])}>{icon}</span>
      </div>
      <p className="font-display text-xl font-bold tabular-nums mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function StudentFeeAccountModal({ account, onClose }: { account: StudentFeeAccount; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">{account.studentName}</h3>
              <p className="text-[10px] text-muted-foreground">{account.admissionNo} · {account.className} · AY 2025–2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
              account.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
              account.status === 'Overdue' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' :
              'bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
              {account.status}
            </span>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="px-5 py-3 border-b border-border/60 bg-muted/20">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div className="text-center">
              <p className="text-[8px] uppercase text-muted-foreground">Applicable</p>
              <p className="text-[11px] font-bold tabular-nums">{formatINR(account.totalApplicable, true)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase text-muted-foreground">Concession</p>
              <p className="text-[11px] font-bold tabular-nums text-emerald-600">{account.concession > 0 ? `-${formatINR(account.concession, true)}` : '—'}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase text-muted-foreground">Net Payable</p>
              <p className="text-[11px] font-bold tabular-nums">{formatINR(account.netPayable, true)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase text-muted-foreground">Paid</p>
              <p className="text-[11px] font-bold tabular-nums text-emerald-600">{formatINR(account.paid, true)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase text-muted-foreground">Outstanding</p>
              <p className="text-[11px] font-bold tabular-nums text-rose-600">{formatINR(account.outstanding, true)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase text-muted-foreground">Total Due</p>
              <p className="text-[11px] font-bold tabular-nums">{formatINR(account.totalDue, true)}</p>
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="overflow-y-auto flex-1">
          {account.transactions.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr>
                  <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Receipt</th>
                  <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Amount</th>
                  <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Mode</th>
                  <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Collected By</th>
                </tr>
              </thead>
              <tbody>
                {account.transactions.map((t) => (
                  <tr key={t.id} className="border-t border-border/30 hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono text-[10px]">{t.receiptNo}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatINR(t.amount)}</td>
                    <td className="px-3 py-2 text-center text-[10px]">{t.mode}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold',
                        t.status === 'Success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                        'bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-[10px]">{formatDate(t.date)}</td>
                    <td className="px-3 py-2 text-muted-foreground text-[10px]">{t.collectedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No transactions recorded yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <p className="text-[9px] text-muted-foreground">Fee account connected to canonical student record.</p>
          {account.outstanding > 0 && (
            <Button size="sm" className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { toast.success('Payment dialog', { description: `Collect ${formatINR(account.outstanding)} from ${account.studentName}.` }); onClose() }}>
              <Wallet className="h-3 w-3" /> Collect {formatINR(account.outstanding, true)}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeesModule
