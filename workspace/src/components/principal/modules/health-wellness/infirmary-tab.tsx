'use client'

import { motion } from 'framer-motion'
import { Clock, Phone } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { infirmaryVisits, healthStats } from '@/lib/mock/health'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { severityConfig } from './data'

// Infirmary Log tab — today's visits list with severity-color-coded cards,
// complaint/diagnosis/treatment detail, and parent-notified indicator.
export function InfirmaryTab() {
  return (
    <motion.div key="inf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Today's Infirmary Visits</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{infirmaryVisits.length} visits · Avg response: {healthStats.avgResponseTime}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Minor</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Urgent</span>
          </div>
        </div>
        <div className="space-y-2.5">
          {infirmaryVisits.map((visit, i) => {
            const sev = severityConfig[visit.severity]
            return (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn('flex items-start gap-3 rounded-xl border p-3', sev.color)}
              >
                <GradientAvatar name={visit.studentName} initials={visit.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{visit.studentName}</p>
                    <span className="text-[11px] text-muted-foreground">{visit.className}</span>
                    <span className={cn('rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase', sev.color)}>{sev.label}</span>
                    {visit.discharged && <StatusBadge status="Discharged" variant="success" />}
                  </div>
                  <div className="mt-1.5 space-y-1 text-xs">
                    <p><span className="text-muted-foreground">Complaint:</span> {visit.complaint}</p>
                    <p><span className="text-muted-foreground">Diagnosis:</span> {visit.diagnosis}</p>
                    <p><span className="text-muted-foreground">Treatment:</span> {visit.treatment}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {visit.visitTime} · {formatDate(visit.visitDate)}</span>
                    {visit.parentNotified && <span className="flex items-center gap-1 text-emerald-600"><Phone className="h-2.5 w-2.5" /> Parent notified</span>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
