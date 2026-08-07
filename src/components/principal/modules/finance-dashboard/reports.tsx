'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, Activity,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import {
  pnlData, balanceSheet, cashflow, financeStats,
} from '@/lib/mock/finance-dashboard'
import { formatINR } from '@/lib/format'
import { E, R, V, statementTabs, type Tab } from './data'
import { SectionLabel } from './shared'

import { SegmentedTabs } from '../shared/segmented-tabs'

/* ---------- Tab strip ---------- */
export function TabButtons({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <SegmentedTabs
      tabs={statementTabs.map((t) => ({ value: t.id, label: t.label, icon: t.icon, badge: t.count }))}
      value={tab}
      onValueChange={setTab}
    />
  )
}

/* ---------- P&L Statement ---------- */
export function PnLStatement({ totalIncome, totalExpense, surplus }: { totalIncome: number; totalExpense: number; surplus: number }) {
  const incomeItems = pnlData.filter((p) => p.type === 'income')
  const expenseItems = pnlData.filter((p) => p.type === 'expense')
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-sm">Profit & Loss Statement</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Year ending 31 March 2026</p>
        </div>
        <StatusBadge status={`Surplus ${formatINR(surplus, true)}`} variant="success" dot />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Income */}
        <div>
          <SectionLabel icon={<ArrowUpRight className="h-3 w-3" />} color="text-emerald-600" label={`Revenue · ${formatINR(totalIncome, true)}`} />
          <div className="space-y-1.5">
            {incomeItems.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="group flex items-center justify-between rounded-lg border border-border bg-card/40 p-2.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.account}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-semibold text-emerald-600 tabular-nums">{formatINR(p.amount, true)}</p>
                  <div className="flex items-center justify-end gap-0.5 text-[10px]">
                    {p.yoyChange >= 0 ? <ArrowUpRight className="h-2.5 w-2.5 text-emerald-600" /> : <ArrowDownRight className="h-2.5 w-2.5 text-rose-600" />}
                    <span className={p.yoyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{Math.abs(p.yoyChange)}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Expense */}
        <div>
          <SectionLabel icon={<ArrowDownRight className="h-3 w-3" />} color="text-rose-600" label={`Expenses · ${formatINR(totalExpense, true)}`} />
          <div className="space-y-1.5">
            {expenseItems.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="group flex items-center justify-between rounded-lg border border-border bg-card/40 p-2.5 hover:border-rose-500/30 hover:bg-rose-500/5 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.account}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-semibold text-rose-600 tabular-nums">{formatINR(p.amount, true)}</p>
                  <div className="flex items-center justify-end gap-0.5 text-[10px]">
                    {p.yoyChange >= 0 ? <ArrowUpRight className="h-2.5 w-2.5 text-rose-600" /> : <ArrowDownRight className="h-2.5 w-2.5 text-emerald-600" />}
                    <span className={p.yoyChange >= 0 ? 'text-rose-600' : 'text-emerald-600'}>{Math.abs(p.yoyChange)}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Net surplus highlight */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Net Surplus</p>
              <p className="text-[10px] text-muted-foreground">Revenue − Expenses</p>
            </div>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600 tabular-nums">{formatINR(surplus)}</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={financeStats.netSurplusMargin} max={100} color={E} height={6} />
          <div className="flex justify-between mt-1">
            <p className="text-[10px] text-muted-foreground">{financeStats.netSurplusMargin}% surplus margin</p>
            <p className="text-[10px] text-muted-foreground">Target 30%</p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
