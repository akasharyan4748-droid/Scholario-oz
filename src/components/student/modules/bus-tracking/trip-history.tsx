'use client'

import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { busTripHistory } from '@/lib/mock/bus-tracking'

export function TripHistory() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Trip History
        </h3>
        <span className="text-[11px] text-muted-foreground">Last 5 trips</span>
      </div>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Pickup</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Drop</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">Driver</th>
            </tr>
          </thead>
          <tbody>
            {busTripHistory.map((trip, i) => (
              <motion.tr
                key={trip.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
              >
                <td className="px-3 py-2.5">{new Date(trip.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                <td className="px-3 py-2.5 hidden sm:table-cell tabular-nums text-muted-foreground">{trip.pickupTime}</td>
                <td className="px-3 py-2.5 hidden sm:table-cell tabular-nums text-muted-foreground">{trip.dropTime}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={trip.status} variant={trip.status === 'On Time' ? 'success' : 'warning'} dot />
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs">{trip.driver}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
