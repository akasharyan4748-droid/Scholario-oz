'use client'

import { motion } from 'framer-motion'
import { CreditCard, IndianRupee, Download, TrendingUp, Receipt, Percent, FileText } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut, ProgressBar } from '@/components/shared/charts'
import { invoices, platformStats } from '@/lib/mock/platform'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const invoiceStatusConfig = {
  Paid: { variant: 'success' as const, color: 'text-emerald-600' },
  Pending: { variant: 'warning' as const, color: 'text-amber-600' },
  Overdue: { variant: 'danger' as const, color: 'text-rose-600' },
  Refunded: { variant: 'neutral' as const, color: 'text-muted-foreground' },
}

export function BillingModule() {
  const totalCollected = invoices.filter((i) => i.status === 'Paid').reduce((a, b) => a + b.total, 0)
  const totalPending = invoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue').reduce((a, b) => a + b.total, 0)

  return (
    <div className="space-y-5">
      <SectionHeading title="Billing & Revenue" subtitle="MRR, ARR, invoices, GST & subscription analytics" icon={<CreditCard className="h-5 w-5" />} action={
        <button onClick={() => toast.success('Report exported', { description: 'Revenue report downloaded' })} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"><Download className="h-3.5 w-3.5" /> Export</button>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="MRR" value={platformStats.mrr} format={(n) => formatINR(n, true)} icon={<TrendingUp className="h-5 w-5" />} accent="emerald" trend={platformStats.mrrGrowth} trendLabel="monthly recurring" delay={0} />
        <KpiCard label="ARR" value={platformStats.arr} format={(n) => formatINR(n, true)} icon={<TrendingUp className="h-5 w-5" />} accent="violet" trend={platformStats.arrGrowth} trendLabel="annual recurring" delay={0.05} />
        <KpiCard label="Collected (Nov)" value={totalCollected} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} accent="amber" trendLabel={`${invoices.filter(i => i.status === 'Paid').length} invoices paid`} delay={0.1} />
        <KpiCard label="Outstanding" value={totalPending} format={(n) => formatINR(n, true)} icon={<Receipt className="h-5 w-5" />} accent="rose" trendLabel={`${invoices.filter(i => i.status !== 'Paid' && i.status !== 'Refunded').length} pending`} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Revenue Growth" subtitle="MRR trend (last 11 months)" className="lg:col-span-2">
          <AreaTrend data={platformStats.monthlyRevenue} xKey="month" yKey="mrr" color="oklch(0.45 0.18 265)" height={260} gradientId="billingGrad" />
        </ChartCard>
        <ChartCard title="Plan Distribution" subtitle="Revenue by tier">
          <Donut data={platformStats.planDistribution} centerValue={`${platformStats.activeSchools}`} centerLabel="schools" height={260} />
        </ChartCard>
      </div>

      {/* Unit economics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Customer LTV', value: formatINR(platformStats.ltv, true), icon: '💎', color: 'from-violet-500 to-purple-600' },
          { label: 'Customer CAC', value: formatINR(platformStats.cac, true), icon: '🎯', color: 'from-amber-500 to-orange-600' },
          { label: 'LTV:CAC Ratio', value: `${(platformStats.ltv / platformStats.cac).toFixed(1)}:1`, icon: '⚖️', color: 'from-emerald-500 to-teal-600' },
          { label: 'Gross Margin', value: `${platformStats.grossMargin}%`, icon: '📈', color: 'from-cyan-500 to-sky-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-4 shadow-premium">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-lg mb-2', s.color)}>{s.icon}</div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-xl font-bold mt-0.5">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Invoices table */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-sm">Recent Invoices</h3><p className="text-xs text-muted-foreground mt-0.5">November 2024 billing cycle</p></div>
          <button onClick={() => toast.success('All invoices exported')} className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"><FileText className="h-3.5 w-3.5" /> All Invoices</button>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Invoice No.</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">School</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">GST (18%)</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell">Method</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2.5"><p className="font-mono text-xs font-semibold">{inv.invoiceNo}</p><p className="text-[10px] text-muted-foreground">{formatDate(inv.date)}</p></td>
                  <td className="px-3 py-2.5 hidden sm:table-cell"><p className="font-medium">{inv.school}</p><p className="text-[10px] text-muted-foreground">{inv.plan}</p></td>
                  <td className="px-3 py-2.5">{formatINR(inv.amount)}</td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">{formatINR(inv.gst)}</td>
                  <td className="px-3 py-2.5 font-semibold">{formatINR(inv.total)}</td>
                  <td className="px-3 py-2.5 hidden lg:table-cell"><span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">{inv.method}</span></td>
                  <td className="px-3 py-2.5"><StatusBadge status={inv.status} variant={invoiceStatusConfig[inv.status].variant} dot /></td>
                  <td className="px-3 py-2.5"><button onClick={() => toast.success('Invoice downloaded', { description: inv.invoiceNo })} className="text-muted-foreground hover:text-primary transition-colors"><Download className="h-4 w-4" /></button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
