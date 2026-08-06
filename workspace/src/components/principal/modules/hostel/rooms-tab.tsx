'use client'

import { motion } from 'framer-motion'
import { Search, Snowflake, Flame } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { hostelRooms } from '@/lib/mock/hostel'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { roomStatusConfig } from './data'

export function RoomsTab({
  search, setSearch,
}: {
  search: string
  setSearch: (s: string) => void
}) {
  const filteredRooms = hostelRooms.filter(
    (r) => r.roomNo.toLowerCase().includes(search.toLowerCase()) || r.block.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div key="rm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room number or block…"
            className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </GlassCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredRooms.map((r, i) => {
          const cfg = roomStatusConfig[r.status]
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn('rounded-2xl border-2 p-4', cfg.color)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-display text-lg font-bold">{r.roomNo}</p>
                  <p className="text-[11px] text-muted-foreground">{r.block} Block · Floor {r.floor}</p>
                </div>
                <div className="flex items-center gap-1">
                  {r.ac ? <Snowflake className="h-3.5 w-3.5 text-sky-500" /> : <Flame className="h-3.5 w-3.5 text-amber-500" />}
                  <StatusBadge status={r.status} variant={cfg.variant} />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mb-2">
                <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{r.type}</span>
                <span className="text-muted-foreground">{r.occupied}/{r.capacity} occupied</span>
              </div>

              {r.occupants.length > 0 ? (
                <div className="space-y-1 mb-2">
                  {r.occupants.map((o, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <GradientAvatar name={o} size="sm" />
                      <span className="truncate">{o}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic mb-2">No occupants</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-semibold text-emerald-600">{formatINR(r.monthlyRent)}/mo</span>
                <button
                  onClick={() => toast.info(`Manage room ${r.roomNo}`)}
                  className="text-[11px] font-medium text-primary hover:underline"
                >Manage</button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
