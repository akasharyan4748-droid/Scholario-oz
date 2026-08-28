'use client'

/**
 * SalaryEmployeeAccountsSection — the PAYROLL-SIDE equivalent of
 * Fee Management → Student Accounts (PART 1/2 of the finance refinement).
 *
 * Student Accounts = the student's financial ledger.
 * Employee Accounts = the employee's payroll ledger.
 *
 * Each account REFERENCES the existing employee/teacher record from the
 * salary store — no second employee database is created. The list shows
 * identity (ID, designation, department, joining date, employment status)
 * beside the financial summary (gross monthly, current payable, session
 * paid, pending receipts, outstanding) derived from the SAME data the
 * Payments/Payslips tabs consume. "Open Account →" opens the existing
 * SalaryEmployeeDrawer (payroll history, salary payments, payslips,
 * adjustments) — the parallel of the student fee drawer.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Banknote, CheckCircle2, Clock, Search, Users, Wallet,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useSalaryStore, useSalaryData, currentPeriodKey, periodOptions,
  netPayableFor, confirmedPaidFor,
} from '@/lib/store/salary-store'
import type { Employee, EmployeeStatus } from '@/lib/store/salary-store'
import { useSalaryUI } from './salary-ui-context'
import { moneyMy, fmtDayYear } from './salary-shared'
import { cn } from '@/lib/utils'

const STATUS_TONE: Record<EmployeeStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'On Leave': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Suspended: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  Resigned: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  Retired: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  Inactive: 'bg-muted text-muted-foreground',
}

interface AccountRow {
  employee: Employee
  grossMonthly: number
  payableCurrent: number
  paidSession: number
  pendingAmount: number
  outstanding: number
}

export function SalaryEmployeeAccountsSection() {
  const { openEmployee } = useSalaryUI()
  const employees = useSalaryStore((s) => s.employees)
  const salaries = useSalaryStore((s) => s.salaries)
  const adjustments = useSalaryStore((s) => s.adjustments)
  const payments = useSalaryStore((s) => s.payments)
  const rows = useSalaryData().rows

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const periodKey = currentPeriodKey()
  // Bounded payroll lookback — the last 6 monthly periods up to the
  // current one. Months before the employee's joining date are excluded
  // so nobody accrues "outstanding" for months they weren't employed.
  const lookbackPeriods = useMemo(() => periodOptions(6), [])

  const accountRows = useMemo<AccountRow[]>(() => {
    return employees.map((e) => {
      const state = salaries[e.id]
      const grossMonthly = state?.salary.base ?? 0
      const row = rows.find((r) => r.employee.id === e.id)
      const payableCurrent = row?.payable ?? 0

      const empPayments = payments.filter((p) => p.employeeId === e.id)
      const paidSession = empPayments.filter((p) => p.status === 'Confirmed').reduce((s, p) => s + p.amount, 0)
      const pendingAmount = empPayments.filter((p) => p.status === 'Pending Receipt' || p.status === 'Not Received').reduce((s, p) => s + p.amount, 0)

      // Outstanding = unpaid payroll across the last 6 periods (current
      // month included), for periods after the joining date. Uses the same
      // netPayable/confirmedPaid helpers as the Payments tab — one ledger.
      let outstanding = 0
      for (const pk of lookbackPeriods) {
        if (pk > periodKey) continue
        const joinKey = e.joiningDate?.slice(0, 7) ?? ''
        if (joinKey && pk < joinKey) continue
        const payable = netPayableFor({ salaries, adjustments }, e.id, pk)
        if (payable <= 0) continue
        const confirmed = confirmedPaidFor(payments, e.id, pk)
        outstanding += Math.max(0, payable - confirmed)
      }

      return { employee: e, grossMonthly, payableCurrent, paidSession, pendingAmount, outstanding }
    })
  }, [employees, salaries, adjustments, payments, rows, lookbackPeriods, periodKey])

  const deptOptions = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees],
  )
  const statusOptions = useMemo(
    () => Array.from(new Set(employees.map((e) => e.status))),
    [employees],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accountRows
      .filter((r) => {
        if (deptFilter !== 'all' && r.employee.department !== deptFilter) return false
        if (statusFilter !== 'all' && r.employee.status !== statusFilter) return false
        if (q) {
          const hay = `${r.employee.name} ${r.employee.employeeId} ${r.employee.designation} ${r.employee.department} ${r.employee.email}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        // Active staff first, then by name — Student Accounts ordering spirit.
        const active = (e: Employee) => (e.status === 'Active' ? 0 : e.status === 'On Leave' ? 1 : 2)
        return active(a.employee) - active(b.employee) || a.employee.name.localeCompare(b.employee.name)
      })
  }, [accountRows, search, deptFilter, statusFilter])

  const totals = useMemo(() => ({
    employees: filtered.length,
    grossMonthly: filtered.reduce((s, r) => s + r.grossMonthly, 0),
    paidSession: filtered.reduce((s, r) => s + r.paidSession, 0),
    outstanding: filtered.reduce((s, r) => s + r.outstanding, 0),
    pending: filtered.reduce((s, r) => s + r.pendingAmount, 0),
  }), [filtered])

  return (
    <div className="space-y-4">
      {/* Toolbar — Employee Accounts title block (matches Student Accounts) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> Employee Accounts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Each employee&apos;s payroll ledger — gross, payable, paid, pending and outstanding, one account per staff member.
          </p>
        </div>
      </div>

      {/* Summary strip — mirrors Student Accounts' KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AccountTile label="Employee accounts" value={String(totals.employees)} icon={<Users className="h-3 w-3" />} />
        <AccountTile label="Gross monthly payroll" value={moneyMy(totals.grossMonthly)} icon={<Wallet className="h-3 w-3" />} />
        <AccountTile label="Paid (session)" value={moneyMy(totals.paidSession)} tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />} />
        <AccountTile
          label="Outstanding payroll"
          value={moneyMy(totals.outstanding)}
          tone={totals.outstanding > 0 ? 'rose' : undefined}
          hint={totals.pending > 0 ? `+${moneyMy(totals.pending)} receipts pending` : undefined}
          icon={<Banknote className="h-3 w-3" />}
        />
      </div>

      {/* Filter row — search / department / employment status (PART 2) */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="Search employee, ID, designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search employees"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Department filter"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All departments</SelectItem>
            {deptOptions.map((d) => (
              <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="Employment status filter"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All employment status</SelectItem>
            {statusOptions.map((st) => (
              <SelectItem key={st} value={st} className="text-xs">{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Accounts table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/30 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
          <span className="flex-1">Employee</span>
          <span className="w-28 shrink-0">Department · Joined</span>
          <span className="w-20 shrink-0 text-right">Gross/mo</span>
          <span className="w-24 shrink-0 text-right hidden lg:block">Payable</span>
          <span className="w-24 shrink-0 text-right hidden lg:block">Paid</span>
          <span className="w-24 shrink-0 text-right">Outstanding</span>
          <span className="w-[104px] shrink-0" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="h-6 w-6 mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">No employee accounts match this view.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r, i) => (
              <AccountRowView key={r.employee.id} row={r} index={i} onOpen={() => openEmployee(r.employee.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AccountTile({ label, value, hint, tone, icon }: {
  label: string
  value: string
  hint?: string
  tone?: 'emerald' | 'rose'
  icon?: React.ReactNode
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </p>
      <p className={cn(
        'text-lg font-bold tabular-nums leading-tight mt-0.5',
        tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'rose' && 'text-rose-600 dark:text-rose-400',
      )}>{value}</p>
      {hint && <p className="text-[9px] text-amber-600 dark:text-amber-400 truncate">{hint}</p>}
    </motion.div>
  )
}

function AccountRowView({ row, index, onOpen }: { row: AccountRow; index: number; onOpen: () => void }) {
  const { employee: e } = row
  const initials = e.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
  const paidThisMonth = row.payableCurrent > 0 && row.outstanding === 0

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.2) }}>
      {/* Whole row is the click target — no overlay/absolute trickery, so every
          area (avatar, figures, department) opens the account. Inner buttons
          handle their own click; the guard avoids double-firing. Keyboard
          users open via the trailing "Open Account" button (focusable). */}
      <div
        className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-muted/25 transition-colors cursor-pointer"
        onClick={(ev) => { if (!(ev.target instanceof HTMLElement && ev.target.closest('button'))) onOpen() }}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">{initials}</AvatarFallback>
        </Avatar>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs font-semibold truncate">{e.name}</p>
            <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold shrink-0', STATUS_TONE[e.status])}>
              {e.status}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {e.employeeId} · {e.designation} · {e.employeeType}
          </p>
        </button>
        <div className="w-28 shrink-0 hidden md:block">
          <p className="text-[11px] font-medium truncate">{e.department}</p>
          <p className="text-[9px] text-muted-foreground hidden xl:block">joined {fmtDayYear(e.joiningDate)}</p>
        </div>
        <div className="w-20 shrink-0 text-right">
          <p className="text-[11px] font-semibold tabular-nums">{moneyMy(row.grossMonthly)}</p>
          <p className="text-[9px] text-muted-foreground">gross/mo</p>
        </div>
        <div className="w-24 shrink-0 text-right hidden lg:block">
          <p className="text-[11px] font-medium tabular-nums">{moneyMy(row.payableCurrent)}</p>
          <p className="text-[9px] text-muted-foreground">this month</p>
        </div>
        <div className="w-24 shrink-0 text-right hidden lg:block">
          <p className="text-[11px] font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{moneyMy(row.paidSession)}</p>
          <p className="text-[9px] text-muted-foreground flex items-center justify-end gap-0.5">
            {row.pendingAmount > 0 && <Clock className="h-2.5 w-2.5 text-amber-500" />}
            paid
          </p>
        </div>
        <div className="w-24 shrink-0 text-right">
          <p className={cn(
            'text-[11px] font-bold tabular-nums',
            row.outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground',
          )}>
            {row.outstanding > 0 ? moneyMy(row.outstanding) : 'Clear'}
          </p>
          <p className="text-[9px] text-muted-foreground">{paidThisMonth ? 'settled' : row.outstanding > 0 ? 'payroll' : '—'}</p>
        </div>
        <div className="shrink-0 w-[104px] flex justify-end">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted/60 transition-colors"
            aria-label={`Open payroll account for ${e.name}`}
          >
            Open Account <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
