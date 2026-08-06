'use client'

import { Truck, ShoppingCart, IndianRupee, Clock } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { procurementStats } from '@/lib/mock/procurement'
import { formatINR } from '@/lib/format'

export function KpiRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Active Vendors" value={procurementStats.activeVendors} icon={<Truck className="h-5 w-5" />} accent="emerald" trend={6} trendLabel={`of ${procurementStats.totalVendors} total`} delay={0} />
      <KpiCard label="Pending POs" value={procurementStats.pendingPOs} icon={<ShoppingCart className="h-5 w-5" />} accent="amber" trendLabel={`${procurementStats.pendingApprovals} need approval`} delay={0.05} />
      <KpiCard label="Monthly Spend" value={procurementStats.monthlySpend} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} accent="violet" trend={8.4} trendLabel="this month" delay={0.1} />
      <KpiCard label="Pending Payments" value={procurementStats.pendingPayments} format={(n) => formatINR(n, true)} icon={<Clock className="h-5 w-5" />} accent="rose" trendLabel={`avg ${procurementStats.avgDeliveryTime} delivery`} delay={0.15} />
    </div>
  )
}
