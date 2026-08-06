'use client'

import { motion } from 'framer-motion'
import { ScrollText, Download, Filter } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { auditTrail } from '@/lib/mock/platform'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const categoryConfig = {
  Admin: { color: 'bg-indigo-500/15 text-indigo-600' },
  Billing: { color: 'bg-emerald-500/15 text-emerald-600' },
  Security: { color: 'bg-rose-500/15 text-rose-600' },
  Data: { color: 'bg-amber-500/15 text-amber-600' },
  System: { color: 'bg-violet-500/15 text-violet-600' },
}

export function AuditTrailModule() {
  return (
    <div className="space-y-5">
      <SectionHeading title="Platform Audit Trail" subtitle="Complete activity log for compliance & security" icon={<ScrollText className="h-5 w-5" />} action={
        <button onClick={() => toast.success('Audit log exported', { description: 'CSV downloaded with all entries' })} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"><Download className="h-3.5 w-3.5" /> Export Log</button>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Events Today" value={142} icon={<ScrollText className="h-5 w-5" />} accent="violet" trend={8} trendLabel="vs yesterday" delay={0} />
        <KpiCard label="Admin Actions" value={38} icon={<ScrollText className="h-5 w-5" />} accent="violet" trendLabel="by platform admins" delay={0.05} />
        <KpiCard label="Security Events" value={12} icon={<ScrollText className="h-5 w-5" />} accent="rose" trendLabel="access & auth" delay={0.1} />
        <KpiCard label="System Events" value={92} icon={<ScrollText className="h-5 w-5" />} accent="emerald" trendLabel="automated jobs" delay={0.15} />
      </div>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-sm">Activity Log</h3><p className="text-xs text-muted-foreground mt-0.5">Immutable record of all platform actions</p></div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"><Filter className="h-3.5 w-3.5" /> Filter</button>
        </div>
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />
          <div className="space-y-3">
            {auditTrail.map((entry, i) => {
              const cfg = categoryConfig[entry.category]
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative flex items-start gap-3">
                  <div className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-card', cfg.color)}>
                    <ScrollText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 rounded-xl border border-border bg-card/40 p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{entry.action}</p>
                      <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase', cfg.color)}>{entry.category}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>by <span className="font-medium text-foreground">{entry.actor}</span></span>
                      <span>target: <code className="font-mono">{entry.target}</code></span>
                      <span>IP: {entry.ip}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 pt-3">{entry.timestamp}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
