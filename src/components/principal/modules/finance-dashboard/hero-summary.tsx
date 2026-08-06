'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { financeStats } from '@/lib/mock/finance-dashboard'
import { ease } from './data'
import { HeroStat } from './shared'

// Hero summary banner — emerald→teal gradient card at the top of the Finance
// Dashboard. Shows the three hero stats (Total Revenue, Total Expenses, Net
// Surplus) plus a circular SVG margin ring on the right showing the net
// surplus margin percentage.
export function HeroSummary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-7 text-white shadow-premium-lg"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float-slow" />
      <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative grid lg:grid-cols-4 gap-5 items-center">
        <div className="lg:col-span-3 grid sm:grid-cols-3 gap-5">
          <HeroStat icon={<TrendingUp className="h-4 w-4" />} label="Total Revenue" value={financeStats.totalRevenue} trend="+12.4% YoY" />
          <HeroStat icon={<TrendingDown className="h-4 w-4" />} label="Total Expenses" value={financeStats.totalExpenses} trend="+6.8% YoY" tone="warn" />
          <HeroStat icon={<Wallet className="h-4 w-4" />} label="Net Surplus" value={financeStats.netSurplus} trend={`${financeStats.netSurplusMargin}% margin`} tone="good" />
        </div>
        {/* margin ring */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 50}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - financeStats.netSurplusMargin / 100) }}
                transition={{ duration: 1.2, ease, delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-extrabold">{financeStats.netSurplusMargin}%</span>
              <span className="text-[10px] text-emerald-50/80">surplus margin</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
