'use client'

import { motion } from 'framer-motion'
import { MapPin, Users } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import type { Period } from '@/lib/mock/academics'

interface Props {
  myPeriods: Period[]
}

export function TodaySchedule({ myPeriods }: Props) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 relative overflow-hidden">
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Today's Schedule</h3>
              <StatusBadge status="Live" variant="success" dot />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Wednesday · {myPeriods.length} teaching periods · 9 periods total</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400">{myPeriods.length}</p>
            <p className="text-[10px] text-muted-foreground">My Classes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {myPeriods.map((p, i) => (
            <motion.div
              key={`${p.time}-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-primary/30 bg-primary/5 p-3"
            >
              <p className="text-[10px] font-bold text-primary uppercase">{p.time}</p>
              <p className="font-semibold text-sm mt-1">{p.subject}</p>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                <MapPin className="h-2.5 w-2.5" /> {p.room}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Users className="h-2.5 w-2.5" /> 18 students
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
