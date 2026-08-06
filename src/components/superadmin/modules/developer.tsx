'use client'

import { motion } from 'framer-motion'
import { Code2, Key, Webhook, Plug, Plus, Copy, MoreHorizontal, Zap } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { apiKeys, platformStats } from '@/lib/mock/platform'
import { formatNumber, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function DeveloperModule() {
  return (
    <div className="space-y-5">
      <SectionHeading title="Developer Center" subtitle="API keys, webhooks & integrations" icon={<Code2 className="h-5 w-5" />} action={
        <button onClick={() => toast.success('API key generated', { description: 'New key created with selected scopes' })} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"><Plus className="h-3.5 w-3.5" /> Generate Key</button>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Active API Keys" value={platformStats.activeApiKeys} icon={<Key className="h-5 w-5" />} accent="violet" trendLabel="across all schools" delay={0} />
        <KpiCard label="API Calls Today" value={platformStats.usageMetrics.apiCallsToday} icon={<Zap className="h-5 w-5" />} accent="amber" trend={6.8} trendLabel="requests" delay={0.05} />
        <KpiCard label="Avg Latency" value={42} suffix="ms" icon={<Zap className="h-5 w-5" />} accent="emerald" trend={-8} trendLabel="p95 response" delay={0.1} />
        <KpiCard label="Error Rate" value={0.04} suffix="%" icon={<Code2 className="h-5 w-5" />} accent="cyan" trend={-0.02} trendLabel="4xx + 5xx" delay={0.15} />
      </div>

      {/* API keys table */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-sm">API Keys</h3><p className="text-xs text-muted-foreground mt-0.5">Manage authentication credentials for school integrations</p></div>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">School</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Requests</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell">Last Used</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k, i) => (
                <motion.tr key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2.5"><p className="font-medium">{k.name}</p><p className="text-[10px] text-muted-foreground">Created {formatDate(k.created)}</p></td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{k.school}</td>
                  <td className="px-3 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{k.key}</code></td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">{formatNumber(k.requests)}</td>
                  <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground text-xs">{k.lastUsed}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={k.status} variant={k.status === 'Active' ? 'success' : 'neutral'} dot /></td>
                  <td className="px-3 py-2.5"><div className="flex items-center gap-1"><button onClick={() => toast.success('Key copied', { description: 'API key copied to clipboard' })} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="h-3.5 w-3.5" /></button><button className="text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="h-3.5 w-3.5" /></button></div></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Webhooks & Integrations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Webhook className="h-4 w-4 text-indigo-500" /> Webhooks</h3>
          <div className="space-y-2">
            {[
              { name: 'Payment Success', url: 'https://greenwood.edu.in/api/webhooks/payment', events: 3, status: 'Active' },
              { name: 'Student Admission', url: 'https://dps45.in/api/webhooks/admission', events: 5, status: 'Active' },
              { name: 'Fee Default', url: 'https://stxaviersblr.in/api/webhooks/fees', events: 2, status: 'Active' },
              { name: 'Attendance Alert', url: 'https://heritagevk.in/api/webhooks/attendance', events: 4, status: 'Paused' },
            ].map((w, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', w.status === 'Active' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground')}><Webhook className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{w.name}</p><code className="text-[10px] text-muted-foreground truncate block">{w.url}</code></div>
                <StatusBadge status={w.status} variant={w.status === 'Active' ? 'success' : 'neutral'} dot />
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Plug className="h-4 w-4 text-violet-500" /> Integrations</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Razorpay', desc: 'Payment Gateway', icon: '💳', connected: true, color: 'from-sky-500 to-blue-600' },
              { name: 'Twilio', desc: 'SMS & Voice', icon: '📱', connected: true, color: 'from-rose-500 to-red-600' },
              { name: 'Google Workspace', desc: 'Email & Drive', icon: '📧', connected: true, color: 'from-amber-500 to-yellow-600' },
              { name: 'Zoom', desc: 'Video Classes', icon: '🎥', connected: false, color: 'from-violet-500 to-purple-600' },
              { name: 'WhatsApp Business', desc: 'Messaging', icon: '💬', connected: false, color: 'from-emerald-500 to-green-600' },
              { name: 'AWS S3', desc: 'File Storage', icon: '☁️', connected: true, color: 'from-orange-500 to-amber-600' },
            ].map((int, i) => (
              <motion.div key={int.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} className={cn('rounded-xl border p-3 transition-all', int.connected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-card/40')}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{int.icon}</span>
                  {int.connected ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs font-semibold">{int.name}</p>
                <p className="text-[10px] text-muted-foreground">{int.desc}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  )
}
