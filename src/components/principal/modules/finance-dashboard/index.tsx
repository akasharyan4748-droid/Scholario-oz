'use client'

// Finance Dashboard module — modular composition root.
//
// The original monolithic `finance-dashboard.tsx` (598 lines) has been split
// across focused files inside this directory. This `index.tsx` is the entry
// point that re-exports the public `FinanceDashboardModule` symbol used by
// `principal-panel.tsx` and composes the sub-sections in their original
// visual order. No UI/UX was changed in the refactor — only the file layout.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Download, Calendar } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  pnlData, balanceSheet, cashflow,
} from '@/lib/mock/finance-dashboard'
import { toast } from 'sonner'

import { HeroSummary } from './hero-summary'
import { KpiRow } from './kpi-row'
import { ChartsRow1, ChartsRow2, BudgetVsActualRow } from './charts'
import { TabButtons, PnLStatement } from './reports'
import { BalanceStatement, CashflowStatement } from './reports-statements'
import { type Tab } from './data'

export function FinanceDashboardModule() {
  const [tab, setTab] = useState<Tab>('pnl')
  const [period, setPeriod] = useState('fy25-26')

  // P&L derived totals — totalIncome, totalExpense, surplus
  const totalIncome = pnlData.filter((p) => p.type === 'income').reduce((a, b) => a + b.amount, 0)
  const totalExpense = pnlData.filter((p) => p.type === 'expense').reduce((a, b) => a + b.amount, 0)
  const surplus = totalIncome - totalExpense

  // Balance sheet derived totals — totalAssets, totalLiabilities, totalEquity
  const totalAssets = balanceSheet.filter((b) => b.type === 'asset').reduce((a, b) => a + b.amount, 0)
  const totalLiabilities = balanceSheet.filter((b) => b.type === 'liability').reduce((a, b) => a + b.amount, 0)
  const totalEquity = balanceSheet.filter((b) => b.type === 'equity').reduce((a, b) => a + b.amount, 0)

  // Cash flow derived totals — operatingNet, investingNet, financingNet, netCashChange
  const operatingCash = cashflow.filter((c) => c.activity === 'operating')
  const operatingNet = operatingCash.reduce((a, b) => a + b.inflow - b.outflow, 0)
  const investingNet = cashflow.filter((c) => c.activity === 'investing').reduce((a, b) => a + b.inflow - b.outflow, 0)
  const financingNet = cashflow.filter((c) => c.activity === 'financing').reduce((a, b) => a + b.inflow - b.outflow, 0)
  const netCashChange = operatingNet + investingNet + financingNet

  const handleExport = () => toast.success('Report exported', { description: 'Financial statements downloaded as PDF' })

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Finance Dashboard"
        subtitle="P&L · Balance Sheet · Cash Flow — AY 2025-26"
        icon={<Wallet className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-[150px] rounded-xl glass text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fy25-26">FY 2025-26</SelectItem>
                <SelectItem value="fy24-25">FY 2024-25</SelectItem>
                <SelectItem value="q4">Q4 2025-26</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-shadow"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        }
      />

      <HeroSummary />
      <KpiRow />
      <ChartsRow1 />
      <ChartsRow2 />
      <BudgetVsActualRow />

      {/* Statement tabs + AnimatePresence switch */}
      <TabButtons tab={tab} setTab={setTab} />
      <AnimatePresence mode="wait">
        {tab === 'pnl' && (
          <motion.div key="pnl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <PnLStatement totalIncome={totalIncome} totalExpense={totalExpense} surplus={surplus} />
          </motion.div>
        )}
        {tab === 'balance' && (
          <motion.div key="bal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <BalanceStatement totalAssets={totalAssets} totalLiabilities={totalLiabilities} totalEquity={totalEquity} />
          </motion.div>
        )}
        {tab === 'cashflow' && (
          <motion.div key="cf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <CashflowStatement operatingNet={operatingNet} investingNet={investingNet} financingNet={financingNet} netCashChange={netCashChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FinanceDashboardModule
