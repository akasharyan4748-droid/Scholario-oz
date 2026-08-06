'use client'

import { motion } from 'framer-motion'
import { Flag, Plus, MoreHorizontal } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { featureFlags } from '@/lib/mock/platform'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const flagStatusConfig = {
  Enabled: { variant: 'success' as const, color: 'bg-emerald-500/15 text-emerald-600' },
  Beta: { variant: 'warning' as const, color: 'bg-amber-500/15 text-amber-600' },
  Disabled: { variant: 'neutral' as const, color: 'bg-muted text-muted-foreground' },
}

export function FeatureFlagsModule() {
  return (
    <div className="space-y-5">
      <SectionHeading title="Feature Flags" subtitle="Progressive rollout & feature management" icon={<Flag className="h-5 w-5" />} action={
        <button onClick={() => toast.success('Flag created', { description: 'New feature flag added' })} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"><Plus className="h-3.5 w-3.5" /> New Flag</button>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Enabled" value={featureFlags.filter((f) => f.status === 'Enabled').length} icon={<Flag className="h-5 w-5" />} accent="emerald" trendLabel="live features" delay={0} />
        <KpiCard label="Beta" value={featureFlags.filter((f) => f.status === 'Beta').length} icon={<Flag className="h-5 w-5" />} accent="amber" trendLabel="gradual rollout" delay={0.05} />
        <KpiCard label="Disabled" value={featureFlags.filter((f) => f.status === 'Disabled').length} icon={<Flag className="h-5 w-5" />} accent="rose" trendLabel="hidden" delay={0.1} />
        <KpiCard label="Total Flags" value={featureFlags.length} icon={<Flag className="h-5 w-5" />} accent="violet" trendLabel="managed" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {featureFlags.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', flagStatusConfig[f.status].color)}><Flag className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-sm">{f.name}</p>
                    <code className="text-[10px] text-muted-foreground">{f.key}</code>
                  </div>
                </div>
                <StatusBadge status={f.status} variant={flagStatusConfig[f.status].variant} dot />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{f.description}</p>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1"><span className="text-muted-foreground">Rollout</span><span className="font-semibold">{f.percentage}% · {f.schools} schools</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${f.percentage}%` }} transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ background: f.status === 'Enabled' ? 'oklch(0.55 0.14 162)' : f.status === 'Beta' ? 'oklch(0.65 0.16 75)' : 'var(--muted-foreground)' }} /></div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground">Modified {f.lastModified}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => toast.success('Flag toggled', { description: `${f.name} updated` })} className={cn('relative h-5 w-9 rounded-full transition-colors', f.status !== 'Disabled' ? 'bg-primary' : 'bg-muted')}>
                    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform', f.status !== 'Disabled' ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
