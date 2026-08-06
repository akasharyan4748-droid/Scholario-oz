'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp, ArrowDownRight, Wallet, Activity,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { balanceSheet, cashflow } from '@/lib/mock/finance-dashboard'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { E, R, V } from './data'
import { SectionLabel } from './shared'

/* ---------- Balance Sheet ---------- */
export function BalanceStatement({ totalAssets, totalLiabilities, totalEquity }: { totalAssets: number; totalLiabilities: number; totalEquity: number }) {
  const assets = balanceSheet.filter((b) => b.type === 'asset')
  const liabilities = balanceSheet.filter((b) => b.type === 'liability')
  const equity = balanceSheet.filter((b) => b.type === 'equity')
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-sm">Balance Sheet</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">As at 31 March 2026</p>
        </div>
        <StatusBadge status={balanced ? 'Balanced' : 'Imbalanced'} variant={balanced ? 'success' : 'danger'} dot />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Assets */}
        <div>
          <SectionLabel icon={<TrendingUp className="h-3 w-3" />} color="text-emerald-600" label={`Assets · ${formatINR(totalAssets, true)}`} />
          <div className="space-y-1.5">
            {assets.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border border-border bg-card/40 p-2.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{b.account}</p>
                    <p className="text-[10px] text-muted-foreground">{b.category}</p>
                  </div>
                  <p className="text-xs font-semibold tabular-nums">{formatINR(b.amount, true)}</p>
                </div>
                <div className="mt-1.5"><ProgressBar value={(b.amount / totalAssets) * 100} color={E} height={3} /></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Liabilities + Equity */}
        <div>
          <SectionLabel icon={<ArrowDownRight className="h-3 w-3" />} color="text-rose-600" label={`Liabilities · ${formatINR(totalLiabilities, true)}`} />
          <div className="space-y-1.5 mb-3">
            {liabilities.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border border-border bg-card/40 p-2.5 hover:border-rose-500/30 hover:bg-rose-500/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{b.account}</p>
                    <p className="text-[10px] text-muted-foreground">{b.category}</p>
                  </div>
                  <p className="text-xs font-semibold text-rose-600 tabular-nums">{formatINR(b.amount, true)}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <SectionLabel icon={<Wallet className="h-3 w-3" />} color="text-violet-600" label={`Equity · ${formatINR(totalEquity, true)}`} />
          <div className="space-y-1.5">
            {equity.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border border-border bg-card/40 p-2.5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{b.account}</p>
                    <p className="text-[10px] text-muted-foreground">{b.category}</p>
                  </div>
                  <p className="text-xs font-semibold text-violet-600 tabular-nums">{formatINR(b.amount, true)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Balance equation */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Total Assets</p>
            <p className="font-display text-sm font-bold tabular-nums">{formatINR(totalAssets, true)}</p>
          </div>
          <div className="border-x border-border/60">
            <p className="text-[10px] text-muted-foreground mb-0.5">Liabilities + Equity</p>
            <p className="font-display text-sm font-bold tabular-nums">{formatINR(totalLiabilities + totalEquity, true)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Status</p>
            <p className={cn('font-display text-sm font-bold', balanced ? 'text-emerald-600' : 'text-rose-600')}>{balanced ? '✓ Balanced' : '✗ Imbalanced'}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

/* ---------- Cash Flow Statement ---------- */
export function CashflowStatement({ operatingNet, investingNet, financingNet, netCashChange }: { operatingNet: number; investingNet: number; financingNet: number; netCashChange: number }) {
  const sections = [
    { label: 'Operating Activities', items: cashflow.filter((c) => c.activity === 'operating'), net: operatingNet, color: 'text-emerald-600', accent: E },
    { label: 'Investing Activities', items: cashflow.filter((c) => c.activity === 'investing'), net: investingNet, color: 'text-rose-600', accent: R },
    { label: 'Financing Activities', items: cashflow.filter((c) => c.activity === 'financing'), net: financingNet, color: 'text-violet-600', accent: V },
  ]
  const totalAbs = sections.reduce((a, s) => a + Math.abs(s.net), 0)
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-sm">Cash Flow Statement</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Year ending 31 March 2026</p>
        </div>
        <StatusBadge status={`Net ${netCashChange >= 0 ? '+' : ''}${formatINR(netCashChange, true)}`} variant="success" dot />
      </div>

      <div className="space-y-4">
        {sections.map((section, si) => (
          <motion.div key={section.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: section.accent }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
              </div>
              <p className={cn('text-sm font-bold tabular-nums', section.color)}>{section.net >= 0 ? '+' : ''}{formatINR(section.net, true)}</p>
            </div>
            <div className="space-y-1">
              {section.items.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-2.5">
                  <p className="text-xs">{c.description}</p>
                  <p className={cn('text-xs font-semibold tabular-nums', c.inflow > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                    {c.inflow > 0 ? '+' : '−'}{formatINR(c.inflow > 0 ? c.inflow : c.outflow, true)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-1.5"><ProgressBar value={(Math.abs(section.net) / Math.max(totalAbs, 1)) * 100} color={section.accent} height={3} /></div>
          </motion.div>
        ))}
      </div>

      {/* Net change */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Net Change in Cash</p>
              <p className="text-[10px] text-muted-foreground">Operating + Investing + Financing</p>
            </div>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600 tabular-nums">+{formatINR(netCashChange)}</p>
        </div>
      </div>
    </GlassCard>
  )
}
