'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Users, IndianRupee, TrendingUp, TrendingDown, Server,
  ShieldCheck, LifeBuoy, Activity, Zap, ArrowUpRight, ArrowDownRight,
  Cloud, Globe, Star, Sparkles
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { ChartCard, DualArea, Donut, ProgressBar, RadialGauge } from '@/components/shared/charts'
import { formatINR, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SADashboardModule() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(async (r) => {
        if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return {}
        return r.json().catch(() => ({}))
      })
      .then((j) => {
        if (j && j.data) setData(j.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats || { schools: 0, students: 0, teachers: 0, revenue: 0 }
  const recentSchools = data?.recentSchools || []

  return (
    <div className="space-y-6">
      {/* Hero platform banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8 text-white shadow-premium-lg"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 text-xs font-medium mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              Real database operational · Platform Engine Active
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              SCHOLARIO Cloud Platform
            </h1>
            <p className="text-indigo-50/90 mt-1.5 text-sm sm:text-base max-w-xl">
              Serving {stats.schools} school tenants · {formatNumber(stats.students)} enrolled students · {formatNumber(stats.teachers)} verified educators
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
              <p className="font-display text-2xl font-bold">{formatINR(stats.revenue, true)}</p>
              <p className="text-[11px] text-indigo-100">Total Fee Collections</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Active Schools" value={stats.schools} icon={<Building2 className="h-5 w-5" />} trendLabel="live tenants" accent="emerald" delay={0} />
        <KpiCard label="Total Students" value={stats.students} icon={<Users className="h-5 w-5" />} trendLabel="across real schools" accent="violet" delay={0.05} />
        <KpiCard label="Verified Teachers" value={stats.teachers} icon={<Users className="h-5 w-5" />} trendLabel="faculty members" accent="amber" delay={0.1} />
        <KpiCard label="Gross Revenue" value={stats.revenue} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} trendLabel="real collections" accent="cyan" delay={0.15} />
      </div>

      {/* Recent schools list */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" /> Managed School Tenants ({recentSchools.length})
            </h3>
            <p className="text-xs text-muted-foreground">Connected to SQLite Prisma Database</p>
          </div>
        </div>

        {recentSchools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-semibold">No schools registered</p>
            <p className="text-xs text-muted-foreground">Onboard a school in the Tenants view to see it listed here.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSchools.map((s: any) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-3.5 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold text-sm">
                    {s.code.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{s.name}</p>
                      {s.isDemo && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                          Demo Tenant
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.domain || `${s.slug}.scholario.app`} · {s.city || 'Gurugram'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{s.counts?.students || 0} Students</p>
                    <p className="text-[10px] text-muted-foreground">{s.counts?.teachers || 0} Teachers</p>
                  </div>
                  <StatusBadge status={s.plan || 'STANDARD'} variant="primary" />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
