'use client'

import { motion } from 'framer-motion'
import { CalendarDays, MapPin, ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { reunions } from '@/lib/mock/alumni'

export function ReunionsTab() {
  return (
    <motion.div key="reu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {reunions.map((r, i) => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <span className="text-[9px] leading-none">BATCH</span>
                  <span className="font-display text-sm font-bold leading-tight">{r.batch}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {formatDate(r.date)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {r.venue}
                  </p>
                </div>
              </div>
              <StatusBadge status={r.status} variant={r.status === 'Completed' ? 'success' : r.status === 'Scheduled' ? 'info' : 'warning'} dot />
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Confirmed Attendees</span>
                <span className="font-semibold">{r.confirmed} / {r.attendees}</span>
              </div>
              <ProgressBar value={r.confirmed} max={r.attendees} color="oklch(0.55 0.14 162)" height={6} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground">Organized by <span className="font-medium text-foreground">{r.organizer}</span></span>
              <button
                onClick={() => toast.success('Details', { description: `${r.title} — ${r.confirmed} confirmed` })}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:gap-1.5 transition-all"
              >
                Manage <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
