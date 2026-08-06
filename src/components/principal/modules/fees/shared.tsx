'use client'

import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight } from 'lucide-react'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { school } from '@/lib/mock/school'
import { feeAnalytics } from '@/lib/mock/finance'
import { formatINR } from '@/lib/format'

// Hero summary banner — the emerald→teal hero at the top of the Fees module.
// Shows big animated totals (Total Collected, Pending Dues), the YoY delta
// and a custom SVG radial gauge showing the Collection Rate. Kept in shared.tsx
// because it is a self-contained visual anchor (mirrors the dashboard's
// WelcomeBanner pattern).
export function HeroSummaryBanner() {
  const heroCircumference = 2 * Math.PI * 42
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl shadow-premium"
    >
      {/* gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700" />
      {/* grid overlay (white lines) */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        }}
      />
      {/* blurred orbs */}
      <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-teal-300/30 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />

      {/* content */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-4 p-4 sm:p-6 lg:p-7 text-white">
        {/* left: headline + 2 stats */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur ring-1 ring-white/25">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-100/80 font-semibold">Fee Performance · AY 2025–26</p>
              <h2 className="font-display text-base sm:text-lg font-bold leading-tight">{school.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-[11px] text-emerald-100/80 font-medium">Total Collected</p>
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight tabular-nums mt-0.5">
                <AnimatedCounter value={feeAnalytics.totalCollected} format={(n) => formatINR(n, true)} />
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-100">
                <ArrowUpRight className="h-3 w-3" />
                <span className="font-semibold">+12.5%</span>
                <span className="text-emerald-100/70">vs last year</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-emerald-100/80 font-medium">Pending Dues</p>
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight tabular-nums mt-0.5">
                <AnimatedCounter value={feeAnalytics.pendingDues} format={(n) => formatINR(n, true)} />
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-100">
                <span className="font-semibold tabular-nums">{feeAnalytics.pendingCount}</span>
                <span className="text-emerald-100/70">students · ₹500/mo late fee</span>
              </div>
            </div>
          </div>
        </div>

        {/* right: radial collection rate */}
        <div className="lg:col-span-4 flex items-center justify-center lg:justify-end">
          <div className="relative h-32 w-32 sm:h-36 sm:w-36 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={heroCircumference}
                initial={{ strokeDashoffset: heroCircumference }}
                animate={{ strokeDashoffset: heroCircumference * (1 - feeAnalytics.collectionRate / 100) }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />
            </svg>
            <div className="relative flex flex-col items-center justify-center">
              <span className="font-display text-2xl sm:text-3xl font-bold tabular-nums">{feeAnalytics.collectionRate}%</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-100/80 font-semibold mt-0.5">Collection Rate</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
