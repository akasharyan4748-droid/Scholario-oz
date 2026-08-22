'use client'

/**
 * SalaryShell — Principal Salary & Payroll workspace orchestrator.
 *
 * Visually converged to the Academics (Examinations + Attendance) canonical
 * pattern: a single PageTransition wrapper with one row of SegmentedTabs on
 * the left + action buttons on the right, then AnimatePresence tab content.
 *
 * The AppShell provides the scroll container + outer padding — this shell
 * does NOT add its own scroll wrapper (which previously caused double
 * scroll + double padding).
 *
 * Tabs:
 *   Overview · Payroll · Employees · Salary Structures · Adjustments ·
 *   Payslips · History · Reports
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs, type SegmentedTab } from '../shared/segmented-tabs'
import { useSalaryData } from '@/lib/store/salary-store'
import type { SalaryTab } from './salary-shared'
import { SalaryOverviewSection } from './salary-overview'
import { SalaryPayrollSection } from './salary-payroll'
import { SalaryEmployeesSection } from './salary-employees'
import { SalaryStructuresSection } from './salary-structures'
import { SalaryAdjustmentsSection } from './salary-adjustments'
import { SalaryPayslipsSection } from './salary-payslips'
import { SalaryHistorySection } from './salary-history'
import { SalaryReportsSection } from './salary-reports'

// Static tab values used for keyboard-shortcut mapping (1–8 → tab index).
const TAB_VALUES: SalaryTab[] = [
  'overview', 'payroll', 'employees', 'structures',
  'adjustments', 'payslips', 'history', 'reports',
]

export function SalaryShell() {
  const [tab, setTab] = useState<SalaryTab>('overview')
  const data = useSalaryData()
  const { analytics } = data

  // Build tab list with optional badges for adjustments + payroll exceptions.
  const tabs: SegmentedTab[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'payroll', label: 'Payroll', badge: analytics.exceptions.length },
    { value: 'employees', label: 'Employees' },
    { value: 'structures', label: 'Salary Structures' },
    { value: 'adjustments', label: 'Adjustments', badge: analytics.pendingAdjustments },
    { value: 'payslips', label: 'Payslips' },
    { value: 'history', label: 'History' },
    { value: 'reports', label: 'Reports' },
  ]

  // Keyboard shortcuts: 1-8 switch tabs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '8') {
        const idx = Number(e.key) - 1
        if (idx < TAB_VALUES.length) {
          e.preventDefault()
          setTab(TAB_VALUES[idx])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <PageTransition className="space-y-4">
      {/* Tab row + right-side action buttons (Academics canonical layout) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="overflow-x-auto -mx-1 px-1 pb-1 max-w-full">
          <SegmentedTabs
            tabs={tabs}
            value={tab}
            onValueChange={(v) => setTab(v as SalaryTab)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setTab('employees')}
          >
            <Users className="h-3.5 w-3.5" /> View Staff
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setTab('payroll')}
          >
            <CalendarClock className="h-3.5 w-3.5" /> Process Payroll
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
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
    </PageTransition>
  )
}
