'use client'

import { motion } from 'framer-motion'
import { Megaphone, ArrowUpRight, MapPin, Bus } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { announcements } from '@/lib/mock/operations'
import { toast } from 'sonner'

interface AnnouncementsTransportProps {
  transportId?: string
}

export function AnnouncementsTransport({ transportId }: AnnouncementsTransportProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> School Announcements
          </h3>
          <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {announcements.slice(0, 3).map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                a.category === 'Urgent' ? 'bg-rose-500/10 text-rose-600' :
                a.category === 'Event' ? 'bg-emerald-500/10 text-emerald-600' :
                a.category === 'Holiday' ? 'bg-amber-500/10 text-amber-600' :
                a.category === 'Academic' ? 'bg-violet-500/10 text-violet-600' :
                'bg-cyan-500/10 text-cyan-600'
              }`}>
                <Megaphone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{a.title}</p>
                  <StatusBadge status={a.category} variant={a.category === 'Urgent' ? 'danger' : a.category === 'Event' ? 'success' : a.category === 'Holiday' ? 'warning' : 'neutral'} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.content}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{a.postedBy} · {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Transport info */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Bus className="h-4 w-4 text-cyan-500" /> My Transport
        </h3>
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-sky-500/5 border border-cyan-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-white shadow-md">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Route 5 — Sector 14 & 15</p>
              <p className="text-xs text-muted-foreground font-mono">{transportId}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-muted-foreground">Pickup: 7:15 AM · Sector 14</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-muted-foreground">Drop: 2:45 PM · Sector 14</span>
            </div>
            <div className="flex items-center gap-2">
              <Bus className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-muted-foreground">Bus: HR-26-IJ-5634</span>
            </div>
          </div>
          <button
            onClick={() => toast.info('Live tracking unavailable in demo mode', { description: 'Vehicle HR-26-IJ-5634 is currently in maintenance' })}
            className="mt-3 w-full rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold py-2 hover:bg-cyan-500/15 transition-colors"
          >
            Track My Bus
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
