'use client'

/* ============================================================
   charts/legacy.tsx
   Recharts-based premium charts: container + area variants.
   - ChartCard  : premium container wrapper
   - AreaTrend  : single-series area with glow + rich gradient
   - DualArea   : multi-series area chart
   ============================================================ */

import { useId } from 'react'
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { GlassCard } from '../ui'
import { cn } from '@/lib/utils'
import { AXIS_TICK, formatAxisTick } from './colors'
import { PremiumTooltip, GlowFilter } from './utils'

/* ============================================================
   ChartCard — premium container
   ============================================================ */
interface ChartCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  height?: number
}

export function ChartCard({ title, subtitle, action, children, className, height = 280 }: ChartCardProps) {
  return (
    <GlassCard className={cn('chart-card-premium p-3 sm:p-4 lg:p-5', className)}>
      {/* top accent hairline */}
      <span className="chart-card-accent" aria-hidden />
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-xs sm:text-sm tracking-tight truncate">{title}</h3>
          {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ height }} className="w-full">{children}</div>
      <style jsx>{`
        .chart-card-premium {
          position: relative;
          overflow: hidden;
        }
        .chart-card-premium::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(120% 80% at 100% 0%, var(--primary) 0%, transparent 60%);
          opacity: 0.035;
        }
        .dark .chart-card-premium::after { opacity: 0.06; }
        .chart-card-accent {
          position: absolute;
          top: 0;
          left: 14%;
          right: 14%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          opacity: 0.5;
          border-radius: 999px;
        }
      `}</style>
    </GlassCard>
  )
}

/* ============================================================
   AreaTrend — single-series area with glow + rich gradient
   ============================================================ */
interface AreaTrendProps {
  data: any[]
  xKey: string
  yKey: string
  color?: string
  height?: number
  gradientId?: string
}

export function AreaTrend({ data, xKey, yKey, color = 'oklch(0.55 0.14 162)', height = 240, gradientId }: AreaTrendProps) {
  const uid = useId().replace(/:/g, '')
  const gid = gradientId || `area-${uid}`
  const glowId = `glow-${gid}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <stop offset="50%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${gid}-stroke`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
          <GlowFilter id={glowId} intensity={4.5} />
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} opacity={0.55} />
        <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={42} tickFormatter={formatAxisTick} tickCount={5} />
        <Tooltip content={<PremiumTooltip />} cursor={{ stroke: color, strokeOpacity: 0.35, strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={3}
          fill={`url(#${gid})`}
          filter={`url(#${glowId})`}
          isAnimationActive
          animationDuration={1000}
          animationEasing="ease-out"
          activeDot={{
            r: 6,
            stroke: color,
            strokeWidth: 2.5,
            fill: 'var(--popover)',
          }}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ============================================================
   DualArea — multi-series area chart
   ============================================================ */
interface DualAreaProps {
  data: any[]
  xKey: string
  keys: { key: string; color: string; name: string }[]
  height?: number
}

export function DualArea({ data, xKey, keys, height = 240 }: DualAreaProps) {
  const uid = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k.key} id={`dual-${uid}-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color} stopOpacity={0.5} />
              <stop offset="55%" stopColor={k.color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={k.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} opacity={0.55} />
        <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={42} tickFormatter={formatAxisTick} tickCount={5} />
        <Tooltip content={<PremiumTooltip />} cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.3, strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
        />
        {keys.map((k, idx) => (
          <Area
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.name}
            stroke={k.color}
            strokeWidth={2.75}
            fill={`url(#dual-${uid}-${k.key})`}
            isAnimationActive
            animationDuration={1000}
            animationEasing="ease-out"
            animationBegin={idx * 120}
            activeDot={{ r: 5, stroke: k.color, strokeWidth: 2.5, fill: 'var(--popover)' }}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
