'use client'

/**
 * SalaryShell — Principal Salary & Payroll workspace orchestrator.
 *
 * 8-tab navigation grouped by concern:
 *   Operate: Overview · Payroll
 *   Manage: Employees · Salary Structures · Adjustments
 *   Records: Payslips · History · Reports
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CalendarClock, Users, Layers, Plus,
  Receipt, History, FileBarChart2, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSalaryData } from '@/lib/store/salary-store'
import { school } from '@/lib/mock/school'
import type { SalaryTab } from './salary-shared'
import { SalaryOverviewSection } from './salary-overview'
import { SalaryPayrollSection } from './salary-payroll'
import { SalaryEmployeesSection } from './salary-employees'
import { SalaryStructuresSection } from './salary-structures'
import { SalaryAdjustmentsSection } from './salary-adjustments'
import { SalaryPayslipsSection } from './salary-payslips'
import { SalaryHistorySection } from './salary-history'
import { SalaryReportsSection } from './salary-reports'
import { SALARY_GLOBAL_STYLES } from './salary-shared'
import { formatINR } from '@/lib/format'

const TAB_GROUPS: Array<{ label: string; items: Array<{ value: SalaryTab; label: string; icon: React.ReactNode }> }> = [
  {
    label: 'Operate',
    items: [
      { value: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
      { value: 'payroll', label: 'Payroll', icon: <CalendarClock className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Manage',
    items: [
      { value: 'employees', label: 'Employees', icon: <Users className="h-3.5 w-3.5" /> },
      { value: 'structures', label: 'Salary Structures', icon: <Layers className="h-3.5 w-3.5" /> },
      { value: 'adjustments', label: 'Adjustments', icon: <Plus className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Records',
    items: [
      { value: 'payslips', label: 'Payslips', icon: <Receipt className="h-3.5 w-3.5" /> },
      { value: 'history', label: 'History', icon: <History className="h-3.5 w-3.5" /> },
      { value: 'reports', label: 'Reports', icon: <FileBarChart2 className="h-3.5 w-3.5" /> },
    ],
  },
]

const TABS = TAB_GROUPS.flatMap((g) => g.items)

function formatINRCompact(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export function SalaryShell() {
  const [tab, setTab] = useState<SalaryTab>('overview')
  const data = useSalaryData()
  const { analytics } = data

  const pendingCount = analytics.exceptions.length + analytics.pendingAdjustments
  const tabBadges: Partial<Record<SalaryTab, number>> = {
    adjustments: analytics.pendingAdjustments,
    payroll: analytics.exceptions.length,
  }

  // Keyboard shortcuts: 1-8 switch tabs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '8') {
        const idx = Number(e.key) - 1
        if (idx < TABS.length) {
          e.preventDefault()
          setTab(TABS[idx].value)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col h-full salary-shell">
      <style dangerouslySetInnerHTML={{ __html: SALARY_GLOBAL_STYLES }} />
      {/* Header — contextual content (NOT a duplicate "Salary & Payroll" title) */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">Academic Year {school.academicYear}</p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Monthly Payroll & Disbursement</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setTab('employees')}>
                <Users className="h-3.5 w-3.5" /> View Staff
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" onClick={() => setTab('payroll')}>
                <CalendarClock className="h-3.5 w-3.5" /> Process Payroll
              </Button>
            </div>
          </div>
          {/* Summary pill line */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="tabular-nums">Monthly Payroll <span className="font-bold text-foreground">{formatINRCompact(analytics.monthlyPayroll)}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums">Net Payable <span className="font-bold text-emerald-600">{formatINRCompact(analytics.netPayable)}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums">Deductions <span className="font-bold text-rose-600">{formatINRCompact(analytics.totalDeductions)}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums">{analytics.employeeCount} employees</span>
            {pendingCount > 0 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold tabular-nums">
                  <AlertCircle className="h-2.5 w-2.5" /> {pendingCount} pending
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {TAB_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-center gap-2">
                {gi > 0 && <span className="text-muted-foreground/40 text-xs select-none" aria-hidden>•</span>}
                <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
                  {group.items.map((t) => {
                    const badge = tabBadges[t.value]
                    return (
                      <button
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        aria-current={tab === t.value ? 'page' : undefined}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
                          tab === t.value
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                        {badge !== undefined && badge > 0 && (
                          <span className={cn(
                            'inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold tabular-nums',
                            tab === t.value ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground',
                          )}>
                            {badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'overview' && <SalaryOverviewSection data={data} onNavigate={setTab} />}
            {tab === 'payroll' && <SalaryPayrollSection data={data} />}
            {tab === 'employees' && <SalaryEmployeesSection data={data} />}
            {tab === 'structures' && <SalaryStructuresSection data={data} />}
            {tab === 'adjustments' && <SalaryAdjustmentsSection data={data} />}
            {tab === 'payslips' && <SalaryPayslipsSection data={data} />}
            {tab === 'history' && <SalaryHistorySection data={data} />}
            {tab === 'reports' && <SalaryReportsSection data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
