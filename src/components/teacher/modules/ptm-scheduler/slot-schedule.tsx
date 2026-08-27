'use client'

import { motion } from 'framer-motion'
import { Download, ChevronRight, Plus, Star } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { ptmSchedule, type PTMSlot } from '@/lib/mock/ptm'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { slotStatusConfig } from './data'

export function SlotSchedule({ onStartSlot }: { onStartSlot: (slot: PTMSlot) => void }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Meeting Schedule</h3>
          <p className="text-xs text-muted-foreground mt-0.5">15 slots · 10 min each</p>
        </div>
        <button onClick={() => toast.success('Schedule exported', { description: 'PTM schedule downloaded as PDF' })} className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {ptmSchedule.map((slot, i) => {
          const cfg = slotStatusConfig[slot.status]
          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                slot.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' :
                slot.status === 'booked' ? 'border-sky-500/20 bg-sky-500/5' :
                slot.status === 'cancelled' ? 'border-rose-500/20 bg-rose-500/5 opacity-70' :
                'border-border bg-card/40'
              )}
            >
              {/* Time */}
              <div className="flex flex-col items-center justify-center w-16 shrink-0">
                <p className="font-display text-sm font-bold tabular-nums">{slot.time.split(' ')[0]}</p>
                <p className="text-[9px] text-muted-foreground">{slot.duration}</p>
              </div>

              <div className="h-10 w-px bg-border shrink-0" />

              {/* Parent/student info */}
              {slot.parentName ? (
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <GradientAvatar name={slot.studentName} initials={slot.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{slot.studentName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{slot.parentName} · Roll #{slot.rollNo}</p>
                    {slot.rating && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={cn('h-2.5 w-2.5', idx < slot.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border">
                    <Plus className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground italic">Open slot — available for booking</p>
                </div>
              )}

              {/* Status + actions */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold', cfg.color)}>
                  {cfg.icon} {cfg.label}
                </span>
                {slot.status === 'booked' && (
                  <button
                    onClick={() => onStartSlot(slot)}
                    className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    Start <ChevronRight className="h-3 w-3" />
                  </button>
                )}
                {slot.status === 'available' && (
                  <button
                    onClick={() => toast.info('Slot booking', { description: 'Parent booking form would open' })}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-accent transition-colors"
                  >
                    Book
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
