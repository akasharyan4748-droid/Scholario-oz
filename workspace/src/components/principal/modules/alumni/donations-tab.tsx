'use client'

import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import { donations, alumniStats } from '@/lib/mock/alumni'

export function DonationsTab() {
  return (
    <motion.div key="don" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Recent Donations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{formatINR(alumniStats.donationsThisYear, true)} collected this year</p>
          </div>
          <button onClick={() => toast.success('Export started', { description: 'Donation report downloading…' })} className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Donor</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">Batch</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Purpose</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell">Method</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <GradientAvatar name={d.donor} initials={d.avatar} size="sm" />
                      <div>
                        <p className="font-medium">{d.donor}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{d.receiptNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell text-muted-foreground">{d.batch}</td>
                  <td className="px-3 py-2.5 font-semibold text-emerald-600">{formatINR(d.amount)}</td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs">{d.purpose}</td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">{d.method}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={d.status} variant={d.status === 'Received' ? 'success' : d.status === 'Processing' ? 'warning' : 'info'} dot />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </motion.div>
  )
}
