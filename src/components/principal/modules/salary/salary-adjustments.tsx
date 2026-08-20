'use client'

/**
 * SalaryAdjustmentsSection — bonuses, reimbursements, advances, arrears.
 *
 * - Pending adjustments (queue for approval)
 * - All adjustments table with filters
 * - Approve / Reject actions
 * - Add new adjustment
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Gift, Wallet, ArrowDownRight, ArrowUpRight, Check, X, MessageSquare,
  IndianRupee, Search, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSalaryData, useSalaryStore, type AdjustmentType } from '@/lib/store/salary-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, SalaryStat, AdjustmentStatusBadge, SalaryEmptyState } from './salary-shared'
import { toast } from 'sonner'

const TYPE_ICON: Record<AdjustmentType, React.ReactNode> = {
  'Bonus': <Gift className="h-3 w-3" />,
  'Reimbursement': <Wallet className="h-3 w-3" />,
  'Advance': <ArrowDownRight className="h-3 w-3" />,
  'Arrears': <ArrowUpRight className="h-3 w-3" />,
  'Incentive': <IndianRupee className="h-3 w-3" />,
  'Deduction': <ArrowDownRight className="h-3 w-3" />,
}

export function SalaryAdjustmentsSection({ data }: { data: ReturnType<typeof useSalaryData> }) {
  const { adjustments } = data
  const approveAdjustment = useSalaryStore((s) => s.approveAdjustment)
  const rejectAdjustment = useSalaryStore((s) => s.rejectAdjustment)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return adjustments.filter((a) => {
      if (q && !a.employeeName.toLowerCase().includes(q) && !a.reason.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      return true
    })
  }, [adjustments, search, statusFilter])

  const pending = adjustments.filter((a) => a.status === 'Pending')
  const approved = adjustments.filter((a) => a.status === 'Approved')
  const totalPendingAmount = pending.reduce((s, a) => s + a.amount, 0)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <SalaryStat label="Pending Approval" value={pending.length} sub="awaiting review" className="p-2.5" accent="amber" />
        <SalaryStat label="Pending Amount" value={formatINR(totalPendingAmount, true)} sub="across pending items" className="p-2.5" accent="amber" />
        <SalaryStat label="Approved" value={approved.length} sub="ready for payroll" className="p-2.5" accent="emerald" />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee or reason…" className="pl-8 h-8 text-xs" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-xs rounded-md border border-border bg-background px-2">
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Adjustment
        </Button>
      </div>

      {/* Pending approvals (if any) */}
      {pending.length > 0 && (
        <SalaryPanel title="Pending Approvals" subtitle={`${pending.length} adjustments awaiting review`}>
          <div className="space-y-2">
            {pending.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {TYPE_ICON[a.type]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{a.employeeName}</p>
                      <p className="text-[9px] text-muted-foreground">{a.type} · {a.effectivePeriod}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold tabular-nums text-amber-600">{formatINR(a.amount, true)}</p>
                    <AdjustmentStatusBadge status={a.status} />
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground mb-2">{a.reason}</div>
                <div className="flex items-center gap-1 pt-2 border-t border-amber-500/20">
                  <Button size="sm" className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={() => { approveAdjustment(a.id, 'Principal'); toast.success('Adjustment approved', { description: `${formatINR(a.amount)} for ${a.employeeName}` }) }}>
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => { rejectAdjustment(a.id, 'Principal'); toast.error('Adjustment rejected', { description: `${formatINR(a.amount)} for ${a.employeeName}` }) }}>
                    <X className="h-3 w-3" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </SalaryPanel>
      )}

      {/* All adjustments table */}
      <SalaryPanel title="All Adjustments" subtitle={`${filtered.length} of ${adjustments.length} adjustments`} bodyClassName="p-0">
        <div className="overflow-x-auto max-h-[36rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Employee</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden md:table-cell">Reason</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden lg:table-cell">Period</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
                  <td className="px-3 py-2">
                    <p className="font-medium text-[11px]">{a.employeeName}</p>
                    <p className="text-[9px] text-muted-foreground">{a.submittedBy}</p>
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium',
                      a.type === 'Bonus' || a.type === 'Incentive' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                      a.type === 'Advance' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' :
                      a.type === 'Reimbursement' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' :
                      'bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
                      {TYPE_ICON[a.type]}
                      {a.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatINR(a.amount, true)}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-[10px] text-muted-foreground">{a.reason}</td>
                  <td className="px-3 py-2 text-center"><AdjustmentStatusBadge status={a.status} /></td>
                  <td className="px-3 py-2 hidden lg:table-cell text-[10px] text-muted-foreground">{a.effectivePeriod}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12"><SalaryEmptyState icon={<Gift className="h-6 w-6" />} title="No adjustments" description="Try adjusting filters or add a new adjustment." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SalaryPanel>

      {/* Add adjustment modal */}
      <AnimatePresence>
        {showAdd && <AddAdjustmentModal onClose={() => setShowAdd(false)} data={data} />}
      </AnimatePresence>
    </div>
  )
}

function AddAdjustmentModal({ onClose, data }: { onClose: () => void; data: ReturnType<typeof useSalaryData> }) {
  const addAdjustment = useSalaryStore((s) => s.addAdjustment)
  const [employeeId, setEmployeeId] = useState(data.allEmployees[0]?.id ?? '')
  const [type, setType] = useState<AdjustmentType>('Bonus')
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [effectivePeriod, setEffectivePeriod] = useState(data.currentPeriod)

  const submit = () => {
    const employee = data.allEmployees.find((e) => e.id === employeeId)
    if (!employee) {
      toast.error('Select an employee', { description: 'Please select an employee.' })
      return
    }
    if (amount <= 0) {
      toast.error('Amount required', { description: 'Amount must be greater than zero.' })
      return
    }
    if (!reason) {
      toast.error('Reason required', { description: 'Please provide a reason.' })
      return
    }
    addAdjustment({
      employeeId, employeeName: employee.name, type, amount, reason,
      effectivePeriod, status: 'Pending', submittedBy: 'Principal',
    })
    toast.success('Adjustment added', { description: `${type} of ${formatINR(amount)} for ${employee.name} — pending approval.` })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-600" /> Add Adjustment
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Employee</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1">
              {data.allEmployees.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.employeeId}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-semibold">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as AdjustmentType)} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1">
                <option value="Bonus">Bonus</option>
                <option value="Incentive">Incentive</option>
                <option value="Reimbursement">Reimbursement</option>
                <option value="Advance">Advance</option>
                <option value="Arrears">Arrears</option>
                <option value="Deduction">Deduction</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-semibold">Amount (₹)</label>
              <Input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="h-8 text-xs tabular-nums mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Effective Period</label>
            <Input value={effectivePeriod} onChange={(e) => setEffectivePeriod(e.target.value)} className="h-8 text-xs mt-1" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual performance bonus" className="h-8 text-xs mt-1" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submit}>
            <Check className="h-3 w-3" /> Add Adjustment
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
