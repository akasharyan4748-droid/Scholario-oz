'use client'

import { motion } from 'framer-motion'
import { LifeBuoy, Plus, Clock, MessageCircle, ChevronRight } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { supportTickets, platformStats } from '@/lib/mock/platform'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const priorityConfig = {
  urgent: 'bg-rose-500/15 text-rose-600',
  high: 'bg-amber-500/15 text-amber-600',
  medium: 'bg-sky-500/15 text-sky-600',
  low: 'bg-muted text-muted-foreground',
}

const statusConfig = {
  Open: { variant: 'warning' as const },
  'In Progress': { variant: 'info' as const },
  Resolved: { variant: 'success' as const },
  Closed: { variant: 'neutral' as const },
}

const categoryIcons: Record<string, string> = { Technical: '🔧', Billing: '💳', Onboarding: '🚀', 'Feature Request': '💡', Bug: '🐛' }

export function SupportModule() {
  return (
    <div className="space-y-5">
      <SectionHeading title="Support Center" subtitle="Ticket management & customer success" icon={<LifeBuoy className="h-5 w-5" />} action={
        <button onClick={() => toast.success('Ticket created', { description: 'New support ticket opened' })} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"><Plus className="h-3.5 w-3.5" /> New Ticket</button>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Open Tickets" value={supportTickets.filter((t) => t.status === 'Open').length} icon={<LifeBuoy className="h-5 w-5" />} accent="amber" trendLabel="needs attention" delay={0} />
        <KpiCard label="In Progress" value={supportTickets.filter((t) => t.status === 'In Progress').length} icon={<Clock className="h-5 w-5" />} accent="violet" trendLabel="being worked on" delay={0.05} />
        <KpiCard label="SLA Compliance" value={platformStats.slaCompliance} suffix="%" icon={<LifeBuoy className="h-5 w-5" />} accent="emerald" trend={2.4} trendLabel="response time met" delay={0.1} />
        <KpiCard label="NPS Score" value={platformStats.nps} icon={<MessageCircle className="h-5 w-5" />} accent="cyan" trend={4} trendLabel="customer love" delay={0.15} />
      </div>

      {/* Tickets list */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Support Tickets</h3>
          <div className="flex items-center gap-3 text-xs">
            {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => <span key={s} className="flex items-center gap-1"><StatusBadge status={s} variant={statusConfig[s as keyof typeof statusConfig].variant} /> {supportTickets.filter((t) => t.status === s).length}</span>)}
          </div>
        </div>
        <div className="space-y-2">
          {supportTickets.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => toast.info(`Opening ${t.id}`)}>
              <span className="text-2xl shrink-0">{categoryIcons[t.category]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono text-xs font-semibold">{t.id}</p>
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase', priorityConfig[t.priority])}>{t.priority}</span>
                  <StatusBadge status={t.status} variant={statusConfig[t.status].variant} />
                </div>
                <p className="text-sm font-medium mt-0.5 truncate">{t.subject}</p>
                <p className="text-[11px] text-muted-foreground">{t.school} · {t.category} · {t.createdAt}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-end"><MessageCircle className="h-2.5 w-2.5" /> {t.messages}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.assignee}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
