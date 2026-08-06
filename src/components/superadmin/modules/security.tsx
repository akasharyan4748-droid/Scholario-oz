'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, AlertTriangle, Lock, Eye, Smartphone, Globe, Ban, CheckCircle2 } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { securityEvents, platformStats } from '@/lib/mock/platform'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const eventStatusConfig = {
  Success: { variant: 'success' as const, color: 'text-emerald-600 bg-emerald-500/10' },
  Blocked: { variant: 'danger' as const, color: 'text-rose-600 bg-rose-500/10' },
  Flagged: { variant: 'warning' as const, color: 'text-amber-600 bg-amber-500/10' },
}

const typeIcons: Record<string, React.ReactNode> = {
  Login: <CheckCircle2 className="h-4 w-4" />,
  'Failed Login': <Ban className="h-4 w-4" />,
  'Permission Change': <Lock className="h-4 w-4" />,
  'Data Export': <Eye className="h-4 w-4" />,
  'API Key': <ShieldCheck className="h-4 w-4" />,
  Suspicious: <AlertTriangle className="h-4 w-4" />,
}

export function SecurityModule() {
  return (
    <div className="space-y-5">
      <SectionHeading title="Security Center" subtitle="Session monitoring, threat detection & access control" icon={<ShieldCheck className="h-5 w-5" />} action={
        <button onClick={() => toast.success('Security scan started', { description: 'Full platform audit in progress' })} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-rose-500/20"><ShieldCheck className="h-3.5 w-3.5" /> Run Scan</button>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Active Sessions" value={1842} icon={<Smartphone className="h-5 w-5" />} accent="emerald" trendLabel="across all schools" delay={0} />
        <KpiCard label="Blocked Today" value={48} icon={<Ban className="h-5 w-5" />} accent="rose" trend={12} trendLabel="threats prevented" delay={0.05} />
        <KpiCard label="Flagged Events" value={3} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" trendLabel="needs review" delay={0.1} />
        <KpiCard label="2FA Coverage" value={94} suffix="%" icon={<Lock className="h-5 w-5" />} accent="violet" trend={4} trendLabel="of admin accounts" delay={0.15} />
      </div>

      {/* Security posture */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-6 text-white shadow-premium-lg">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><ShieldCheck className="h-7 w-7" /></div>
            <div>
              <p className="text-rose-50/80 text-xs font-medium">Security Posture</p>
              <h2 className="font-display text-2xl font-extrabold">A · Strong</h2>
              <p className="text-rose-50/80 text-sm mt-0.5">No critical vulnerabilities · 2FA enforced · Encryption at rest</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-center"><p className="font-bold text-lg">A+</p><p className="text-[10px] text-rose-50">SSL Labs</p></div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-center"><p className="font-bold text-lg">94%</p><p className="text-[10px] text-rose-50">2FA</p></div>
          </div>
        </div>
      </motion.div>

      {/* Security events */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-sm">Security Events — Live Feed</h3><p className="text-xs text-muted-foreground mt-0.5">Real-time access & threat monitoring</p></div>
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span> Live</span>
        </div>
        <div className="space-y-2">
          {securityEvents.map((e, i) => {
            const cfg = eventStatusConfig[e.status]
            return (
              <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/30 transition-colors">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', cfg.color)}>{typeIcons[e.type]}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{e.type}</p>
                    <StatusBadge status={e.status} variant={cfg.variant} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{e.user} · {e.school}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> {e.location}</span>
                    <span>IP: {e.ip}</span>
                    <span>{e.device}</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{e.timestamp}</span>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
