'use client'

import { motion } from 'framer-motion'
import { Server, Activity, Database, HardDrive, Zap, Cloud, Cpu, Globe } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, ProgressBar, Donut } from '@/components/shared/charts'
import { infrastructure, platformStats } from '@/lib/mock/platform'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const statusConfig = {
  Operational: { variant: 'success' as const, color: 'text-emerald-600 bg-emerald-500/10', dot: 'bg-emerald-500' },
  Degraded: { variant: 'warning' as const, color: 'text-amber-600 bg-amber-500/10', dot: 'bg-amber-500' },
  Down: { variant: 'danger' as const, color: 'text-rose-600 bg-rose-500/10', dot: 'bg-rose-500' },
}

export function InfrastructureModule() {
  return (
    <div className="space-y-5">
      <SectionHeading title="Cloud & Infrastructure" subtitle="Real-time monitoring of platform services & resources" icon={<Server className="h-5 w-5" />} action={
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
          All Systems Operational
        </div>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Uptime (30d)" value={platformStats.uptime} suffix="%" icon={<Activity className="h-5 w-5" />} accent="emerald" trend={0.02} trendLabel="SLA met" delay={0} />
        <KpiCard label="API Calls Today" value={platformStats.usageMetrics.apiCallsToday} icon={<Zap className="h-5 w-5" />} accent="violet" trend={6.8} trendLabel={`${(platformStats.totalApiCalls / 1000000).toFixed(0)}M total`} delay={0.05} />
        <KpiCard label="Storage Used" value={platformStats.usageMetrics.storageUsed} suffix={`/${platformStats.usageMetrics.storageTotal}TB`} icon={<HardDrive className="h-5 w-5" />} accent="amber" trendLabel="42% capacity" delay={0.1} />
        <KpiCard label="Active Users" value={platformStats.usageMetrics.activeUsers} icon={<Globe className="h-5 w-5" />} accent="cyan" trend={14.2} trendLabel="MAU" delay={0.15} />
      </div>

      {/* Service status grid */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Server className="h-4 w-4 text-indigo-500" /> Service Status — ap-south-1 (Mumbai)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {infrastructure.map((svc, i) => {
            const cfg = statusConfig[svc.status]
            return (
              <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-border bg-card/40 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', cfg.color)}><Database className="h-4 w-4" /></div>
                    <div><p className="text-sm font-semibold">{svc.service}</p><p className="text-[10px] text-muted-foreground">{svc.region}</p></div>
                  </div>
                  <StatusBadge status={svc.status} variant={cfg.variant} dot />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="text-[9px] text-muted-foreground">Uptime</p><p className="font-semibold">{svc.uptime}%</p></div>
                  <div><p className="text-[9px] text-muted-foreground">Latency</p><p className="font-semibold">{svc.latency}ms</p></div>
                  <div><p className="text-[9px] text-muted-foreground">Load</p><p className="font-semibold">{svc.load}%</p></div>
                </div>
                <div className="mt-2"><ProgressBar value={svc.load} color={svc.load > 70 ? 'oklch(0.62 0.2 25)' : svc.load > 50 ? 'oklch(0.65 0.16 75)' : 'oklch(0.55 0.14 162)'} height={4} /></div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>

      {/* Resource usage + database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Cloud className="h-4 w-4 text-cyan-500" /> Resource Utilization</h3>
          <div className="space-y-4">
            {[
              { label: 'CPU Usage', value: 38, max: 100, color: 'oklch(0.45 0.18 265)', icon: <Cpu className="h-4 w-4" /> },
              { label: 'Memory', value: 52, max: 100, color: 'oklch(0.55 0.14 162)', icon: <Cpu className="h-4 w-4" /> },
              { label: 'Storage', value: 42, max: 100, color: 'oklch(0.65 0.16 75)', icon: <HardDrive className="h-4 w-4" /> },
              { label: 'Network I/O', value: 28, max: 100, color: 'oklch(0.7 0.15 200)', icon: <Globe className="h-4 w-4" /> },
            ].map((r, i) => (
              <motion.div key={r.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between text-xs mb-1.5"><span className="font-medium flex items-center gap-1.5">{r.icon} {r.label}</span><span className="text-muted-foreground">{r.value}%</span></div>
                <ProgressBar value={r.value} max={r.max} color={r.color} height={7} />
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <ChartCard title="Database Performance" subtitle="Query latency distribution">
          <Donut data={[
            { name: 'Reads', value: 68, color: 'oklch(0.55 0.14 162)' },
            { name: 'Writes', value: 24, color: 'oklch(0.65 0.16 75)' },
            { name: 'Cache Hits', value: 8, color: 'oklch(0.7 0.15 200)' },
          ]} centerValue="8ms" centerLabel="avg latency" height={200} />
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Active Connections</span><span className="font-semibold">142 / 200</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Slow Queries (5s+)</span><span className="font-semibold text-amber-600">3</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Replication Lag</span><span className="font-semibold text-emerald-600">0.2s</span></div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
