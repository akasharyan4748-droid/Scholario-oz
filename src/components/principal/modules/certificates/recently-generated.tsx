'use client'

import { motion } from 'framer-motion'
import { Download, FileText, Printer } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { CERTS, RECENTLY_GENERATED } from './data'

/**
 * The "Recently Generated" panel — a scrollable list of the last 6 certificates
 * issued school-wide in the past 7 days, each with re-download and re-print
 * quick actions.
 */
export function RecentlyGenerated() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Recently Generated</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 7 days · 6 certificates issued</p>
        </div>
        <StatusBadge status="Digital signatures applied" variant="success" dot />
      </div>
      <div className="space-y-2">
        {RECENTLY_GENERATED.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {CERTS.find((c) => c.title.startsWith(r.type))?.icon ?? <FileText className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{r.student}</p>
                <StatusBadge status={r.type} variant="neutral" />
              </div>
              <p className="text-[11px] text-muted-foreground">{r.class} · {r.ref} · {formatDate(r.date)}</p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => toast.success('Re-downloaded', { description: `${r.type} · ${r.student}` })}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => toast.success('Sent to print queue', { description: `Printer: HP-LaserJet-Admin` })}
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
