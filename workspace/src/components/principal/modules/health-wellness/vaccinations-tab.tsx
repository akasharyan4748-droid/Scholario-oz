'use client'

import { motion } from 'framer-motion'
import { Syringe, Clock, Shield, Download } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { vaccinations } from '@/lib/mock/health'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'

// Vaccinations tab — 2-col card grid of vaccination drives with progress bar,
// date/location meta, and Report / Notify Parents actions.
export function VaccinationsTab() {
  return (
    <motion.div key="vac" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {vaccinations.map((v, i) => {
        const pct = Math.round((v.vaccinated / v.totalStudents) * 100)
        return (
          <motion.div key={v.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                    <Syringe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{v.vaccine}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.targetClasses}</p>
                  </div>
                </div>
                <StatusBadge status={v.status} variant={v.status === 'Completed' ? 'success' : v.status === 'Ongoing' ? 'warning' : 'info'} dot />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Date</p>
                  <p className="font-semibold mt-0.5">{formatDate(v.scheduledDate)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Location</p>
                  <p className="font-semibold mt-0.5 truncate">{v.location}</p>
                </div>
              </div>

              {v.status !== 'Scheduled' && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Vaccinated</span>
                    <span className="font-semibold">{v.vaccinated} / {v.totalStudents} · {pct}%</span>
                  </div>
                  <ProgressBar value={v.vaccinated} max={v.totalStudents} color={v.status === 'Completed' ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'} height={6} />
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => toast.success('Report generated', { description: `${v.vaccine} coverage report downloaded` })}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/50 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <Download className="h-3 w-3" /> Report
                </button>
                <button
                  onClick={() => toast.success('Parents notified', { description: `Vaccination reminder sent for ${v.vaccine}` })}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  Notify Parents
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
