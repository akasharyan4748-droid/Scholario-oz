'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Users, IndianRupee, TrendingUp, TrendingDown, Server,
  ShieldCheck, LifeBuoy, Activity, Zap, ArrowUpRight, ArrowDownRight,
  Cloud, Globe, Star, Sparkles, Download, Check, Loader2, Wallet,
  ShieldAlert
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { ChartCard, DualArea, Donut, ProgressBar, RadialGauge } from '@/components/shared/charts'
import { formatINR, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

// ────────────────────────────────────────────────────────────────────────────
// StackedMethodColumns — monthly × payment-method stacked column chart.
// Hand-rolled (vs recharts) so every segment gets donut-matched colors,
// spring grow-in, hover isolation and a per-column breakdown popover.
// ────────────────────────────────────────────────────────────────────────────
function StackedMethodColumns({
  rows,
  series,
}: {
  rows: Array<Record<string, number | string>>
  series: { key: string; name: string; color: string }[]
}) {
  const [hovered, setHovered] = useState<string | null>(null) // hovered month key
  const [dimKey, setDimKey] = useState<string | null>(null) // legend isolation

  const max = useMemo(
    () =>
      Math.max(
        1,
        ...rows.map((r) => series.reduce((s, sr) => s + (Number(r[sr.key]) || 0), 0))
      ),
    [rows, series]
  )

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Wallet className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-semibold">No transactions in the last 6 months</p>
        <p className="text-xs text-muted-foreground">New payments will chart here in real time.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        {series.map((sr) => {
          const total = rows.reduce((s, r) => s + (Number(r[sr.key]) || 0), 0)
          const dimmed = dimKey !== null && dimKey !== sr.key
          return (
            <button
              key={sr.key}
              onMouseEnter={() => setDimKey(sr.key)}
              onMouseLeave={() => setDimKey(null)}
              onFocus={() => setDimKey(sr.key)}
              onBlur={() => setDimKey(null)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] font-semibold transition-all duration-200',
                dimmed ? 'opacity-40' : 'opacity-100 hover:bg-accent/40'
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: sr.color }} />
              {sr.name}
              <span className="text-muted-foreground font-mono">{formatINR(total, true)}</span>
            </button>
          )
        })}
      </div>

      {/* Columns */}
      <div className="flex items-end gap-2 sm:gap-4 h-44 sm:h-52">
        {rows.map((r, ri) => {
          const total = series.reduce((s, sr) => s + (Number(r[sr.key]) || 0), 0)
          const isHover = hovered === String(r.month)
          return (
            <div
              key={String(r.month)}
              className="relative flex-1 h-full flex flex-col justify-end items-stretch group"
              onMouseEnter={() => setHovered(String(r.month))}
              onMouseLeave={() => setHovered(null)}
            >
              {/* breakdown popover */}
              {isHover && total > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'absolute bottom-full z-20 mb-2 w-max max-w-[11rem] rounded-xl border border-border bg-popover/95 backdrop-blur px-3 py-2 shadow-premium',
                    // Edge-aware anchoring so the popover never clips at the card boundary
                    ri === 0
                      ? 'left-0'
                      : ri === rows.length - 1
                        ? 'right-0'
                        : 'left-1/2 -translate-x-1/2'
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                    {String(r.month)} · {formatINR(total, true)}
                  </p>
                  {series.map((sr) => {
                    const v = Number(r[sr.key]) || 0
                    if (v <= 0) return null
                    return (
                      <div key={sr.key} className="flex items-center justify-between gap-3 py-0.5">
                        <span className="flex items-center gap-1.5 text-[11px] text-foreground">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: sr.color }} />
                          {sr.name}
                        </span>
                        <span className="text-[11px] font-bold font-mono">{formatINR(v, true)}</span>
                      </div>
                    )
                  })}
                </motion.div>
              )}

              {/* stacked segments (flex-col-reverse → UPI at bottom).
                  flex-1 + min-h-0 gives children a DEFINITE height so the
                  per-segment percentage heights actually resolve. */}
              <div className="flex-1 min-h-0 flex flex-col justify-end w-full max-w-24 mx-auto">
                <div className="flex flex-col-reverse rounded-t-lg overflow-hidden cursor-pointer h-full">
                  {series.map((sr, si) => {
                    const v = Number(r[sr.key]) || 0
                    if (v <= 0) return null
                    const hPct = Math.max(2, (v / max) * 100)
                    const dim = dimKey !== null && dimKey !== sr.key
                    const isTop = series.slice(si + 1).every((s2) => (Number(r[s2.key]) || 0) <= 0)
                    return (
                      <motion.div
                        key={sr.key}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: `${hPct}%`, opacity: dim ? 0.25 : 1 }}
                        transition={{
                          height: { type: 'spring', stiffness: 120, damping: 20, delay: ri * 0.06 },
                          opacity: { duration: 0.2 },
                        }}
                        className={cn('w-full shrink-0 transition-[filter] duration-200', isTop && 'rounded-t-lg')}
                        style={{
                          background: `linear-gradient(180deg, ${sr.color} 0%, ${sr.color}cc 100%)`,
                          filter: isHover ? 'brightness(1.12)' : undefined,
                        }}
                        title={`${sr.name}: ${formatINR(v, true)}`}
                      />
                    )
                  })}
                </div>
              </div>

              {/* month label + total */}
              <div className={cn(
                'mt-2 text-center transition-colors',
                isHover ? 'text-foreground' : 'text-muted-foreground'
              )}>
                <p className="text-[10px] sm:text-[11px] font-bold">{String(r.month)}</p>
                <p className="text-[9px] font-mono opacity-70">{total > 0 ? formatINR(total, true) : '—'}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SADashboardModule() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Donut segment colors (avoiding blue/indigo as primary palette)
  const METHOD_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

  // Human-friendly labels for payment channel codes
  const METHOD_LABELS: Record<string, string> = {
    UPI: 'UPI',
    CARD: 'Card',
    NETBANKING: 'Net Banking',
    CASH: 'Cash',
    CHEQUE: 'Cheque',
    WALLET: 'Wallet',
    UNKNOWN: 'Other',
  }
  const methodLabel = (m: string) => METHOD_LABELS[m] ?? m

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

  // Normalize platform stats — coerce missing/undefined numeric fields to 0
  // so a scope-mismatched payload (e.g. a school-scoped session viewing the
  // platform dashboard) degrades to honest zeros instead of NaN.
  const rawStats = data?.stats
  const stats = {
    schools: Number(rawStats?.schools ?? 0) || 0,
    students: Number(rawStats?.students ?? 0) || 0,
    teachers: Number(rawStats?.teachers ?? 0) || 0,
    revenue: Number(rawStats?.revenue ?? 0) || 0,
  }
  const scopeMismatch = Boolean(data && (data as { scope?: string }).scope && (data as { scope?: string }).scope !== 'PLATFORM')
  const recentSchools = data?.recentSchools || []
  const methodBreakdown = data?.methodBreakdown || []
  const methodTrend: Array<Record<string, number | string>> = data?.methodTrend || []

  // CSV ledger export — fetch → blob → download, with loading/success states
  const [exportState, setExportState] = useState<'idle' | 'busy' | 'done'>('idle')
  const handleExportCsv = async () => {
    if (exportState === 'busy') return
    setExportState('busy')
    try {
      const r = await fetch('/api/payments-export?limit=1000')
      if (!r.ok) throw new Error('export failed')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scholario-transactions-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setExportState('done')
      setTimeout(() => setExportState('idle'), 2200)
    } catch {
      setExportState('idle')
    }
  }

  // Skeleton while platform stats load
  if (loading && !data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading platform overview">
        <div className="h-40 rounded-3xl bg-gradient-to-br from-muted via-muted/60 to-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-border bg-muted/30 animate-pulse" />
      </div>
    )
  }

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

      {/* Scope-mismatch guard — the session cookie identifies a school-scoped
          user while this surface expects the platform admin. Never silently
          render NaN; explain and point at the fix. */}
      {scopeMismatch && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-2.5 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Session is school-scoped — platform metrics unavailable</p>
            <p className="text-[11px] text-muted-foreground">This browser is authenticated as a school user. Sign out and log in as the platform admin (admin@scholario.cloud) to view live tenant analytics.</p>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Active Schools" value={stats.schools} icon={<Building2 className="h-5 w-5" />} trendLabel="live tenants" accent="emerald" delay={0} />
        <KpiCard label="Total Students" value={stats.students} icon={<Users className="h-5 w-5" />} trendLabel="across real schools" accent="violet" delay={0.05} />
        <KpiCard label="Verified Teachers" value={stats.teachers} icon={<Users className="h-5 w-5" />} trendLabel="faculty members" accent="amber" delay={0.1} />
        <KpiCard label="Gross Revenue" value={stats.revenue} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} trendLabel="real collections" accent="cyan" delay={0.15} />
      </div>

      {/* Collections by Payment Method */}
      {methodBreakdown.length > 0 && (() => {
        const totalAmt = methodBreakdown.reduce((s: number, m: { amount: number }) => s + m.amount, 0)
        const totalCount = methodBreakdown.reduce((s: number, m: { count: number }) => s + m.count, 0)
        const top = [...methodBreakdown].sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount)[0]
        const topIdx = methodBreakdown.indexOf(top)
        const topPct = totalAmt > 0 ? Math.round((top.amount / totalAmt) * 100) : 0
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Donut column — chart + bottom-anchored insight strip so the
                cell height matches the ledger card without dead space */}
            <div className="lg:col-span-1 flex flex-col gap-3 h-full">
              <ChartCard
                title="Collections by Payment Method"
                subtitle="Successful transactions across all tenants"
                height={260}
              >
                <Donut
                  data={methodBreakdown.map((m: { method: string; amount: number }, i: number) => ({
                    name: methodLabel(m.method),
                    value: Math.round(m.amount),
                    color: METHOD_COLORS[i % METHOD_COLORS.length],
                  }))}
                  centerLabel="Total"
                  centerValue={formatINR(totalAmt, true)}
                />
              </ChartCard>
              {/* Insight strip — anchors to the row bottom, mirroring the ledger card edge */}
              <div className="mt-auto grid grid-cols-3 gap-2">
                <div className="group rounded-xl border border-border bg-muted/20 p-2.5 hover:bg-accent/30 hover:ring-1 hover:ring-emerald-500/20 transition-all">
                  <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Top Channel</p>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: METHOD_COLORS[topIdx % METHOD_COLORS.length] }} />
                    <p className="text-[11px] font-bold truncate">{methodLabel(top.method)}</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5 tabular-nums">{topPct}% of collections</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-2.5 hover:bg-accent/30 hover:ring-1 hover:ring-emerald-500/20 transition-all">
                  <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Avg Ticket</p>
                  <p className="text-[11px] font-bold tabular-nums">{formatINR(totalCount > 0 ? Math.round(totalAmt / totalCount) : 0, true)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">per transaction</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-2.5 hover:bg-accent/30 hover:ring-1 hover:ring-emerald-500/20 transition-all">
                  <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Transactions</p>
                  <p className="text-[11px] font-bold tabular-nums">{formatNumber(totalCount)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">successful payments</p>
                </div>
              </div>
            </div>
            <GlassCard className="p-4 sm:p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <SectionHeading
                icon={<IndianRupee className="h-4 w-4 text-cyan-500" />}
                title="Transaction Ledger by Method"
                subtitle="Every successful payment aggregated per channel"
              />
              <button
                onClick={handleExportCsv}
                disabled={exportState === 'busy'}
                aria-label="Export transaction ledger as CSV"
                className={cn(
                  'group relative shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200',
                  'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                  'hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
                  'active:scale-95 disabled:opacity-60'
                )}
              >
                {exportState === 'busy' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : exportState === 'done' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Download className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
                )}
                {exportState === 'done' ? 'Saved' : 'Export CSV'}
              </button>
            </div>
            <div className="mt-4 space-y-2.5">
              {methodBreakdown.map((m: { method: string; amount: number; count: number }, i: number) => {
                const total = methodBreakdown.reduce((s: number, x: { amount: number }) => s + x.amount, 0) || 1
                const pct = Math.round((m.amount / total) * 100)
                return (
                  <div
                    key={m.method}
                    className="group rounded-xl border border-transparent bg-card/40 p-3 hover:bg-accent/30 hover:border-border hover:ring-1 hover:ring-emerald-500/20 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                          style={{ background: METHOD_COLORS[i % METHOD_COLORS.length] }}
                        />
                        <p className="text-sm font-bold text-foreground truncate">{methodLabel(m.method)}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.count} txn{m.count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{formatINR(m.amount, true)}</p>
                        <p className="text-[10px] text-muted-foreground">{pct}% of collections</p>
                      </div>
                    </div>
                    <ProgressBar value={pct} color={METHOD_COLORS[i % METHOD_COLORS.length]} />
                  </div>
                )
              })}
            </div>
            </GlassCard>
          </div>
        )
      })()}

      {/* Monthly collections trend by channel (stacked columns) */}
      {methodTrend.length > 0 && (
        <ChartCard
          title="Monthly Collections by Channel"
          subtitle="Successful transactions · last 6 months · live from Payment ledger"
          height={300}
          action={
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 6M window
            </span>
          }
        >
          <StackedMethodColumns
            rows={methodTrend}
            series={methodBreakdown.map((m: { method: string }, i: number) => ({
              key: String(m.method).toUpperCase(),
              name: methodLabel(String(m.method).toUpperCase()),
              color: METHOD_COLORS[i % METHOD_COLORS.length],
            }))}
          />
        </ChartCard>
      )}

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
