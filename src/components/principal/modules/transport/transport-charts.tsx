'use client'

/**
 * transport-charts — Route distribution + capacity utilization views.
 *
 * Reads analytics from `useTransportData`:
 *   - analytics.routeDistribution: { name: 'R1', value, color }[]
 *   - analytics.capacityUtil:     { name: 'R1', value (%), enrolled, capacity }[]
 *
 * Both are rendered as horizontal bars with the full route name from the
 * store, color-coded per route.
 *
 * NO fake data — every value derives from the store via the analytics hook.
 */

import { motion } from 'framer-motion'
import { BarChart3, Gauge, Users, TrendingUp } from 'lucide-react'
import { useTransportStore } from '@/lib/store/transport-store'
import { useTransportData } from '@/lib/store/transport-store'
import { cn } from '@/lib/utils'
import { TptPanel, TptPill } from './transport-shared'

// ─── RouteDistributionChart ────────────────────────────────────────

export function RouteDistributionChart() {
  const data = useTransportData()
  const routes = useTransportStore((s) => s.routes)
  const { routeDistribution } = data.analytics

  const max = Math.max(1, ...routeDistribution.map((d) => d.value))
  const totalStudents = routeDistribution.reduce((s, d) => s + d.value, 0)
  const avg = routeDistribution.length > 0 ? Math.round(totalStudents / routeDistribution.length) : 0

  return (
    <TptPanel
      title="Route Distribution"
      subtitle="students per route"
      action={
        <div className="flex items-center gap-1.5">
          <TptPill accent="bg-muted text-muted-foreground">
            {routeDistribution.length} routes
          </TptPill>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
      }
    >
      <div className="space-y-2.5">
        {routeDistribution.map((d, i) => {
          const route = routes[i]
          const pct = Math.round((d.value / max) * 100)
          return (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-32 shrink-0 hidden sm:block">
                <p className="text-[11px] font-medium truncate" title={route?.name}>
                  {route?.name ?? d.name}
                </p>
              </div>
              <div className="sm:hidden w-8 shrink-0">
                <p className="text-[11px] font-semibold">{d.name}</p>
              </div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.04 }}
                    className="h-full rounded-full"
                    style={{ background: d.color }}
                  />
                </div>
              </div>
              <div className="w-12 shrink-0 text-right">
                <span className="text-[11px] font-bold tabular-nums">{d.value}</span>
                <span className="text-[9px] text-muted-foreground ml-0.5">stu</span>
              </div>
            </motion.div>
          )
        })}
        {routeDistribution.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No routes configured.</p>
        )}
      </div>

      {/* Footer: totals */}
      {routeDistribution.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/20 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                Total Students
              </p>
            </div>
            <p className="font-display text-lg font-bold tabular-nums mt-1 text-emerald-700 dark:text-emerald-300">
              {totalStudents}
            </p>
          </div>
          <div className="rounded-lg bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] border border-cyan-500/20 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-cyan-600" />
              <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                Avg per Route
              </p>
            </div>
            <p className="font-display text-lg font-bold tabular-nums mt-1 text-cyan-700 dark:text-cyan-300">
              {avg}
            </p>
          </div>
        </div>
      )}
    </TptPanel>
  )
}

// ─── CapacityUtilizationChart ──────────────────────────────────────

export function CapacityUtilizationChart() {
  const data = useTransportData()
  const routes = useTransportStore((s) => s.routes)
  const { capacityUtil } = data.analytics

  const avgUtil = capacityUtil.length > 0
    ? Math.round(capacityUtil.reduce((s, d) => s + d.value, 0) / capacityUtil.length)
    : 0
  const fullRoutes = capacityUtil.filter((d) => d.value >= 100).length
  const nearFullRoutes = capacityUtil.filter((d) => d.value >= 85 && d.value < 100).length

  return (
    <TptPanel
      title="Capacity Utilization"
      subtitle="enrolled vs capacity per route"
      action={
        <div className="flex items-center gap-1.5">
          <TptPill accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            {avgUtil}% avg
          </TptPill>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </div>
      }
    >
      <div className="space-y-3">
        {capacityUtil.map((d, i) => {
          const route = routes[i]
          const full = d.value >= 100
          const near = d.value >= 85 && d.value < 100
          const barColor = full
            ? 'bg-rose-500'
            : near
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          return (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[11px] font-medium truncate flex-1" title={route?.name}>
                  {route?.name ?? d.name}
                </p>
                <span
                  className={cn(
                    'text-[10px] font-bold tabular-nums shrink-0',
                    full ? 'text-rose-600' : near ? 'text-amber-600' : 'text-muted-foreground'
                  )}
                >
                  {d.enrolled}/{d.capacity} · {d.value}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, d.value)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.04 }}
                  className={cn('h-full rounded-full', barColor)}
                />
              </div>
              {full && (
                <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Route at full capacity</p>
              )}
              {!full && near && (
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                  Near full · {d.capacity - d.enrolled} seats left
                </p>
              )}
            </motion.div>
          )
        })}
        {capacityUtil.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No routes configured.</p>
        )}
      </div>

      {/* Footer summary */}
      {capacityUtil.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/30 px-2.5 py-1.5">
            <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Avg Util</p>
            <p className="text-sm font-bold tabular-nums mt-0.5 text-foreground">{avgUtil}%</p>
          </div>
          <div className="rounded-lg bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20 px-2.5 py-1.5">
            <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Near Full</p>
            <p className="text-sm font-bold tabular-nums mt-0.5 text-amber-600">{nearFullRoutes}</p>
          </div>
          <div className="rounded-lg bg-rose-500/[0.04] dark:bg-rose-500/[0.06] border border-rose-500/20 px-2.5 py-1.5">
            <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Full</p>
            <p className="text-sm font-bold tabular-nums mt-0.5 text-rose-600">{fullRoutes}</p>
          </div>
        </div>
      )}
    </TptPanel>
  )
}

// ─── TransportReports (combined reports view) ───────────────────────

export function TransportReports() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <RouteDistributionChart />
      <CapacityUtilizationChart />
    </div>
  )
}
