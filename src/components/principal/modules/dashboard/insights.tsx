'use client'

import { motion } from 'framer-motion'
import {
  Users, GraduationCap, Wallet, Sparkles, TrendingUp, TrendingDown,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'

// Shape of each tile rendered in the Quick Insights strip.
interface QuickInsight {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  color: string
  trend: string
  trendUp: boolean
}

// Quick Insights — compact metric strip showing today's snapshot at a glance
// (Avg Class Size, Teacher Ratio, Fee Collection, Parent Satisfaction).
// Each tile is animated and carries a trend pill.
export function QuickInsights() {
  const insights: QuickInsight[] = [
    {
      label: 'Avg Class Size',
      value: '24',
      sub: 'students/class',
      icon: <Users className="h-4 w-4" />,
      color: 'text-emerald-600 bg-emerald-500/10',
      trend: '+2',
      trendUp: true,
    },
    {
      label: 'Teacher Ratio',
      value: '1:19',
      sub: 'student-teacher',
      icon: <GraduationCap className="h-4 w-4" />,
      color: 'text-amber-600 bg-amber-500/10',
      trend: '-1',
      trendUp: false,
    },
    {
      label: 'Fee Collection',
      value: '94.2%',
      sub: 'of target',
      icon: <Wallet className="h-4 w-4" />,
      color: 'text-violet-600 bg-violet-500/10',
      trend: '+3.1%',
      trendUp: true,
    },
    {
      label: 'Parent Satisfaction',
      value: '4.7/5',
      sub: '328 surveys',
      icon: <Sparkles className="h-4 w-4" />,
      color: 'text-cyan-600 bg-cyan-500/10',
      trend: '+0.2',
      trendUp: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold tracking-tight">Quick Insights</h3>
              <p className="text-[11px] text-muted-foreground">Today's snapshot at a glance</p>
            </div>
          </div>
          <StatusBadge status="Updated just now" variant="success" dot />
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.07 }}
              whileHover={{ y: -2 }}
              className="group relative rounded-xl border border-border bg-card/40 p-3 hover:shadow-premium hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', insight.color)}>
                  {insight.icon}
                </div>
                <span className={cn(
                  'flex items-center gap-0.5 text-[10px] font-bold rounded-full px-1.5 py-0.5',
                  insight.trendUp ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'
                )}>
                  {insight.trendUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {insight.trend}
                </span>
              </div>
              <p className="font-display text-xl font-bold tracking-tight">{insight.value}</p>
              <p className="text-[11px] font-medium text-foreground/80 mt-0.5">{insight.label}</p>
              <p className="text-[10px] text-muted-foreground">{insight.sub}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
