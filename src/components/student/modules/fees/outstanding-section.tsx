'use client'

import { motion } from 'framer-motion'
import { AlertCircle, FileText, Wallet } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/format'
import { feeBreakdown } from './data'

interface OutstandingSectionProps {
  totalFee: number
  totalPending: number
  totalPaid: number
  paidPct: number
  onPay: () => void
}

export function OutstandingSection({ totalFee, totalPending, paidPct, onPay }: OutstandingSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" /> Outstanding Fees
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pay before 15 December 2024 to avoid late fee</p>
            </div>
            <StatusBadge status="Pending" variant="danger" dot />
          </div>
          <div className="flex items-baseline gap-3">
            <p className="font-display text-4xl sm:text-5xl font-extrabold text-rose-600 dark:text-rose-400">
              <AnimatedCounter value={totalPending} format={(n) => formatINR(n)} />
            </p>
            <span className="text-sm text-muted-foreground">of {formatINR(totalFee)}</span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-semibold">{paidPct}% paid</span>
            </div>
            <ProgressBar value={paidPct} color="oklch(0.55 0.14 162)" height={10} />
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Late Fee (after 15 Dec)</p>
              <p className="font-display text-lg font-bold text-amber-600 mt-0.5">₹500 / month</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Scholarship Applied</p>
              <p className="font-display text-lg font-bold text-emerald-600 mt-0.5">₹0</p>
            </div>
          </div>

          <Button
            onClick={onPay}
            className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11"
          >
            <Wallet className="h-4 w-4" /> Pay {formatINR(totalPending)} Now
          </Button>
        </div>
      </GlassCard>

      {/* Fee breakdown */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Fee Breakdown
        </h3>
        <div className="space-y-3">
          {feeBreakdown.map((f, i) => {
            const pct = (f.paid / f.amount) * 100
            const pending = f.amount - f.paid
            return (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium">{f.name}</span>
                  <span className={pending > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                    {pending > 0 ? `${formatINR(pending)} pending` : 'Paid'}
                  </span>
                </div>
                <ProgressBar value={pct} color={pct === 100 ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'} height={5} />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>Paid: {formatINR(f.paid)}</span>
                  <span>Total: {formatINR(f.amount)}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
