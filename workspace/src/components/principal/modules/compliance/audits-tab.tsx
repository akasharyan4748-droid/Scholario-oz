'use client'

import { motion } from 'framer-motion'
import {
  FileCheck, AlertTriangle, Star,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { auditLogs } from '@/lib/mock/compliance'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function AuditsTab() {
  return (
    <motion.div key="au" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
      {auditLogs.map((a, i) => (
        <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', a.type === 'Statutory' ? 'bg-rose-500/15 text-rose-600' : a.type === 'External' ? 'bg-violet-500/15 text-violet-600' : 'bg-emerald-500/15 text-emerald-600')}>
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{a.area}</p>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase">{a.type}</span>
                  <StatusBadge status={a.status} variant={a.status === 'Completed' ? 'success' : a.status === 'In Progress' ? 'warning' : 'info'} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.auditor} · {formatDate(a.date)}</p>
                {a.findings > 0 && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> {a.findings} finding{a.findings > 1 ? 's' : ''}</p>
                )}
                {a.notes && <p className="text-[11px] text-muted-foreground italic mt-1">"{a.notes}"</p>}
              </div>
              {a.rating > 0 && (
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-0.5 justify-end">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={cn('h-3 w-3', idx < Math.round(a.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">audit rating</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
