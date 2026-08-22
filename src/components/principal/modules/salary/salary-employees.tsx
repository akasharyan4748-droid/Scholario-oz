'use client'

/**
 * SalaryEmployeesSection — payroll-focused employee directory + profile drawer.
 *
 * - Search by name/ID/designation/department
 * - Filters (department, type, status)
 * - Employee cards → open canonical Employee Payroll Profile drawer
 * - Drawer tabs: Overview · Salary · Payroll History · Payslips · Adjustments
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, ChevronRight, Wallet, IndianRupee, Clock, Receipt,
  ArrowLeft, History, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSalaryData, useSalaryStore, calculatePayrollForEmployee, type Employee, type Payslip } from '@/lib/store/salary-store'
import { formatINR, formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, SalaryStat, EmployeeStatusBadge, SalaryEmptyState } from './salary-shared'
import { PayslipModal } from './salary-payslips'
import { toast } from 'sonner'

interface Props {
  data: ReturnType<typeof useSalaryData>
}

type DrawerTab = 'overview' | 'salary' | 'history' | 'payslips' | 'adjustments'

export function SalaryEmployeesSection({ data }: Props) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState<Employee | null>(null)

  const departments = useMemo(() => {
    const set = new Set(data.allEmployees.map((e) => e.department))
    return Array.from(set).sort()
  }, [data.allEmployees])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return data.allEmployees.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.employeeId.toLowerCase().includes(q) && !e.designation.toLowerCase().includes(q) && !e.department.toLowerCase().includes(q)) return false
      if (deptFilter !== 'all' && e.department !== deptFilter) return false
      if (typeFilter !== 'all' && e.employeeType !== typeFilter) return false
      return true
    })
  }, [data.allEmployees, search, deptFilter, typeFilter])

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Search + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, employee ID, designation or department…" className="pl-8 h-9 text-xs" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-9 text-xs rounded-md border border-border bg-background px-2">
          <option value="all">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 text-xs rounded-md border border-border bg-background px-2">
          <option value="all">All Types</option>
          <option value="Teaching">Teaching</option>
          <option value="Administration">Administration</option>
          <option value="Finance">Finance</option>
          <option value="Support">Support</option>
          <option value="Transport">Transport</option>
        </select>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((e, i) => {
          const structure = data.structures.find((s) => s.applicableTo === e.employeeType) ?? data.structures[0]
          const calc = calculatePayrollForEmployee(e, structure, data.adjustments)
          return (
            <motion.button
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelected(e)}
              className="group rounded-xl border border-border bg-card p-3 text-left hover:border-emerald-500/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold',
                    e.employeeType === 'Teaching' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                    e.employeeType === 'Administration' ? 'bg-gradient-to-br from-sky-500 to-blue-600' :
                    e.employeeType === 'Finance' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    'bg-gradient-to-br from-violet-500 to-purple-600',
                  )}>
                    {e.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{e.name}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{e.employeeId} · {e.designation}</p>
                  </div>
                </div>
                <EmployeeStatusBadge status={e.status} />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <SalaryStat label="Gross" value={formatINR(calc.gross, true)} className="px-1.5 py-1" />
                <SalaryStat label="Net Pay" value={formatINR(calc.netPay, true)} accent="emerald" className="px-1.5 py-1" />
                <SalaryStat label="Deductions" value={formatINR(calc.totalDeductions, true)} accent="rose" className="px-1.5 py-1" />
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                <span>{e.department}</span>
                <span className="inline-flex items-center gap-0.5 group-hover:text-emerald-600 transition-colors">
                  Open Profile <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </motion.button>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full">
            <SalaryEmptyState icon={<Users className="h-6 w-6" />} title="No employees found" description="Try adjusting filters or search." />
          </div>
        )}
      </div>

      {/* Employee Payroll Profile Drawer */}
      <AnimatePresence>
        {selected && (
          <EmployeePayrollDrawer employee={selected} data={data} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmployeePayrollDrawer({ employee, data, onClose }: { employee: Employee; data: ReturnType<typeof useSalaryData>; onClose: () => void }) {
  const [tab, setTab] = useState<DrawerTab>('overview')
  const [payslipPreview, setPayslipPreview] = useState<Payslip | null>(null)
  const reviseSalary = useSalaryStore((s) => s.reviseSalary)
  const [showRevise, setShowRevise] = useState(false)
  const [newSalary, setNewSalary] = useState(employee.salary)
  const [reason, setReason] = useState('')

  const structure = data.structures.find((s) => s.applicableTo === employee.employeeType) ?? data.structures[0]
  const calc = calculatePayrollForEmployee(employee, structure, data.adjustments)
  const employeeAdjustments = data.adjustments.filter((a) => a.employeeId === employee.id)
  const employeeRevisions = data.revisions.filter((r) => r.employeeId === employee.id)
  const employeePayslips = data.payslips.filter((p) => p.employeeId === employee.id)

  const submitRevision = () => {
    if (newSalary <= 0) {
      toast.error('Salary revision failed', { description: 'New salary must be greater than zero.' })
      return
    }
    reviseSalary({ employeeId: employee.id, newSalary, effectiveFrom: new Date().toISOString().split('T')[0], reason: reason || 'Salary revision', actor: 'Principal' })
    toast.success('Salary revised', { description: `${employee.name}: ₹${employee.salary.toLocaleString('en-IN')} → ₹${newSalary.toLocaleString('en-IN')}` })
    setShowRevise(false)
    setReason('')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-stretch justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="bg-card border-l border-border w-full max-w-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-br from-emerald-500/5 to-transparent px-5 py-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={onClose}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <EmployeeStatusBadge status={employee.status} />
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white font-bold',
              employee.employeeType === 'Teaching' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
              employee.employeeType === 'Administration' ? 'bg-gradient-to-br from-sky-500 to-blue-600' :
              employee.employeeType === 'Finance' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
              'bg-gradient-to-br from-violet-500 to-purple-600',
            )}>
              {employee.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold truncate">{employee.name}</h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {employee.employeeId} · {employee.designation} · {employee.department}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Joined {formatDate(employee.joiningDate)} · {employee.email}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mt-3">
            <SalaryStat label="Basic" value={formatINR(employee.salary, true)} className="px-1.5 py-1 text-center" />
            <SalaryStat label="Gross" value={formatINR(calc.gross, true)} className="px-1.5 py-1 text-center" />
            <SalaryStat label="Deductions" value={formatINR(calc.totalDeductions, true)} accent="rose" className="px-1.5 py-1 text-center" />
            <SalaryStat label="Net Pay" value={formatINR(calc.netPay, true)} accent="emerald" className="px-1.5 py-1 text-center" />
            <SalaryStat label="Attendance" value={`${employee.attendance}%`} className="px-1.5 py-1 text-center" />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-muted/20 px-3 py-1.5 flex items-center gap-0.5 overflow-x-auto">
          {[
            { value: 'overview' as const, label: 'Overview', icon: <Users className="h-3 w-3" /> },
            { value: 'salary' as const, label: 'Salary Structure', icon: <IndianRupee className="h-3 w-3" /> },
            { value: 'history' as const, label: 'Payroll History', icon: <History className="h-3 w-3" /> },
            { value: 'payslips' as const, label: 'Payslips', icon: <Receipt className="h-3 w-3" /> },
            { value: 'adjustments' as const, label: 'Adjustments', icon: <Wallet className="h-3 w-3" /> },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap',
                tab === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'overview' && (
            <div className="space-y-3">
              <SalaryPanel title="Employee Information">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Employee ID:</span> <span className="font-medium">{employee.employeeId}</span></div>
                  <div><span className="text-muted-foreground">Designation:</span> <span className="font-medium">{employee.designation}</span></div>
                  <div><span className="text-muted-foreground">Department:</span> <span className="font-medium">{employee.department}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{employee.employeeType}</span></div>
                  <div><span className="text-muted-foreground">Joined:</span> <span className="font-medium">{formatDate(employee.joiningDate)}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <EmployeeStatusBadge status={employee.status} /></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium truncate">{employee.email}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{employee.phone}</span></div>
                  <div><span className="text-muted-foreground">PAN:</span> <span className="font-mono">{employee.pan ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Bank A/C:</span> <span className="font-mono">{employee.bankAccount ?? '—'}</span></div>
                </div>
              </SalaryPanel>
              <SalaryPanel title="Current Month Summary">
                <div className="grid grid-cols-2 gap-2">
                  <SalaryStat label="Working Days" value="30" />
                  <SalaryStat label="Present Days" value={String(Math.round((employee.attendance / 100) * 30))} />
                  <SalaryStat label="Gross Earnings" value={formatINR(calc.gross, true)} accent="emerald" />
                  <SalaryStat label="Total Deductions" value={formatINR(calc.totalDeductions, true)} accent="rose" />
                  <SalaryStat label="Adjustments" value={calc.totalAdjustments > 0 ? formatINR(calc.totalAdjustments, true) : '—'} accent="amber" />
                  <SalaryStat label="Net Pay" value={formatINR(calc.netPay, true)} accent="emerald" />
                </div>
              </SalaryPanel>
            </div>
          )}

          {tab === 'salary' && (
            <div className="space-y-3">
              <SalaryPanel
                title="Salary Structure"
                subtitle={structure.name}
                action={<Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { setNewSalary(employee.salary); setShowRevise(true) }}>
                  <IndianRupee className="h-3 w-3" /> Revise
                </Button>}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Earnings</p>
                    <div className="space-y-1">
                      {calc.earnings.map((e) => (
                        <div key={e.name} className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">{e.name}</span>
                          <span className="font-semibold tabular-nums">{formatINR(e.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[11px] pt-1 border-t border-border/40">
                        <span className="font-bold">Gross</span>
                        <span className="font-bold tabular-nums text-emerald-600">{formatINR(calc.gross)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Deductions</p>
                    <div className="space-y-1">
                      {calc.deductions.map((d) => (
                        <div key={d.name} className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="font-semibold tabular-nums text-rose-600">{formatINR(d.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[11px] pt-1 border-t border-border/40">
                        <span className="font-bold">Total</span>
                        <span className="font-bold tabular-nums text-rose-600">{formatINR(calc.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SalaryPanel>

              <SalaryPanel title="Salary Revision History" subtitle={`${employeeRevisions.length} revisions`}>
                {employeeRevisions.length > 0 ? (
                  <div className="space-y-1.5">
                    {employeeRevisions.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                          <IndianRupee className="h-3 w-3" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium">{formatINR(r.previousSalary, true)} → <span className="font-bold text-emerald-600">{formatINR(r.newSalary, true)}</span></p>
                          <p className="text-[9px] text-muted-foreground">{r.reason} · effective {formatDate(r.effectiveFrom)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <SalaryEmptyState icon={<Clock className="h-5 w-5" />} title="No salary revisions" description="Revisions will appear here." />
                )}
              </SalaryPanel>

              <AnimatePresence>
                {showRevise && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <SalaryPanel title="Revise Salary" subtitle="Future payroll uses the new amount.">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Current Salary</label>
                            <p className="text-sm font-bold tabular-nums">{formatINR(employee.salary)}</p>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">New Salary (₹)</label>
                            <Input type="number" value={newSalary} onChange={(e) => setNewSalary(Number(e.target.value))} className="h-7 text-xs tabular-nums" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase font-semibold">Reason</label>
                          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual increment" className="h-7 text-xs" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={submitRevision}>
                            <IndianRupee className="h-3 w-3" /> Approve Revision
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setShowRevise(false)}>Cancel</Button>
                        </div>
                      </div>
                    </SalaryPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {tab === 'history' && (
            <SalaryPanel title="Payroll History" subtitle={`${data.periods.length} periods`}>
              {data.periods.length > 0 ? (
                <div className="space-y-1.5">
                  {data.periods.map((p) => (
                    <div key={p.period} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                        <History className="h-3 w-3" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium">{p.period}</p>
                        <p className="text-[9px] text-muted-foreground">{p.employeeCount} employees · Net {formatINR(p.totalNetPay, true)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <SalaryEmptyState icon={<History className="h-5 w-5" />} title="No payroll history" description="Processed periods will appear here." />
              )}
            </SalaryPanel>
          )}

          {tab === 'payslips' && (
            <SalaryPanel title="Payslips" subtitle={`${employeePayslips.length} generated`}>
              {employeePayslips.length > 0 ? (
                <div className="space-y-1.5">
                  {employeePayslips.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                        <Receipt className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium">{p.period}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{formatINR(p.netPay, true)} · {formatDate(p.payDate)}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setPayslipPreview(p)}>View</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <SalaryEmptyState icon={<Receipt className="h-5 w-5" />} title="No payslips" description="Payslips will appear here after payroll is processed." />
              )}
            </SalaryPanel>
          )}

          {tab === 'adjustments' && (
            <SalaryPanel title="Adjustments" subtitle={`${employeeAdjustments.length} adjustments`}>
              {employeeAdjustments.length > 0 ? (
                <div className="space-y-1.5">
                  {employeeAdjustments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                        <Wallet className="h-3 w-3" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium">{a.type} · {formatINR(a.amount, true)}</p>
                        <p className="text-[9px] text-muted-foreground">{a.reason} · {a.effectivePeriod}</p>
                      </div>
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold',
                        a.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                        a.status === 'Pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
                        'bg-rose-500/10 text-rose-700 dark:text-rose-300')}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <SalaryEmptyState icon={<Wallet className="h-5 w-5" />} title="No adjustments" description="Bonuses, reimbursements, and advances will appear here." />
              )}
            </SalaryPanel>
          )}
        </div>
      </motion.div>
      {/* Payslip preview modal — renders on top of the drawer (later in DOM order, same z-50) so the user can preview a payslip without closing the drawer */}
      <AnimatePresence>
        {payslipPreview && (
          <PayslipModal payslip={payslipPreview} onClose={() => setPayslipPreview(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
