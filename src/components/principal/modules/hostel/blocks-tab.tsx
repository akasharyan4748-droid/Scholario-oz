'use client'

import { motion } from 'framer-motion'
import { Building2, Phone } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { hostelBlocks } from '@/lib/mock/hostel'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function BlocksTab() {
  return (
    <motion.div key="bl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {hostelBlocks.map((b, i) => {
        const pct = Math.round((b.occupied / b.totalRooms) * 100)
        return (
          <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md', b.type === 'Boys' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-violet-500 to-purple-600')}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.type} Hostel · {b.totalRooms} rooms</p>
                  </div>
                </div>
                <StatusBadge status={b.status} variant={b.status === 'Operational' ? 'success' : 'warning'} dot />
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-semibold">{b.occupied} / {b.totalRooms} · {pct}%</span>
                </div>
                <ProgressBar value={b.occupied} max={b.totalRooms} color={b.type === 'Boys' ? 'oklch(0.55 0.14 162)' : 'oklch(0.6 0.18 300)'} height={6} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <GradientAvatar name={b.warden} size="sm" />
                  <div>
                    <p className="text-xs font-medium">{b.warden}</p>
                    <p className="text-[10px] text-muted-foreground">Warden</p>
                  </div>
                </div>
                <button onClick={() => toast.info(`Calling ${b.warden}`)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
