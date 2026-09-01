'use client'

import { motion } from 'framer-motion'
import { Navigation, CheckCircle2, Circle, MapPin, Users } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { myBusRoute, myBusStops } from '@/lib/mock/bus-tracking'
import { cn } from '@/lib/utils'

export function StopsTimeline() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
        <Navigation className="h-4 w-4 text-primary" /> Stops Timeline
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Your pickup: {myBusRoute.pickupTime}</p>

      <div className="relative space-y-3">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

        {myBusStops.map((stop, i) => {
          const isMyStop = stop.name.includes('Your Stop')
          return (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn('relative flex items-start gap-3', isMyStop && 'bg-violet-500/5 -mx-2 px-2 py-1.5 rounded-lg')}
            >
              <div className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card',
                stop.status === 'completed' && 'bg-emerald-500 text-white',
                stop.status === 'current' && 'bg-amber-500 text-white',
                stop.status === 'upcoming' && 'bg-muted text-muted-foreground',
                isMyStop && 'ring-violet-500/30'
              )}>
                {stop.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                {stop.status === 'current' && (
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Circle className="h-4 w-4 fill-amber-300" />
                  </motion.span>
                )}
                {stop.status === 'upcoming' && <Circle className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <p className={cn('text-sm font-medium', stop.status === 'completed' && 'text-muted-foreground line-through', stop.status === 'current' && 'text-amber-600', isMyStop && 'text-violet-600 font-semibold')}>
                    {stop.name}
                  </p>
                  {isMyStop && <MapPin className="h-3 w-3 text-violet-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn('text-[11px]', stop.status === 'completed' ? 'text-emerald-600' : stop.status === 'current' ? 'text-amber-600 font-semibold' : 'text-muted-foreground')}>
                    {stop.actualTime ? stop.actualTime : stop.scheduledTime}
                  </span>
                  {stop.status === 'current' && <span className="rounded bg-amber-500/15 px-1 py-0 text-[9px] font-bold text-amber-600">HERE NOW</span>}
                  {stop.status === 'completed' && stop.actualTime && stop.actualTime !== stop.scheduledTime && (
                    <span className="text-[9px] text-muted-foreground">({stop.scheduledTime})</span>
                  )}
                </div>
                {stop.students > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" /> {stop.students} students onboard
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
