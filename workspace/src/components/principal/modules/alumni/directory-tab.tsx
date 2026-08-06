'use client'

import { motion } from 'framer-motion'
import { Search, Heart, Trophy, ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { formatINR } from '@/lib/format'
import type { Alumni } from '@/lib/mock/alumni'

export function DirectoryTab({
  alumni, search, setSearch, onSelect,
}: {
  alumni: Alumni[]
  search: string
  setSearch: (s: string) => void
  onSelect: (a: Alumni) => void
}) {
  const filtered = alumni.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.batch.includes(search) || a.currentRole.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div key="dir" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, batch, or profession…"
            className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            onClick={() => onSelect(a)}
            className="cursor-pointer"
          >
            <GlassCard className="p-3 sm:p-4 hover:shadow-premium-lg transition-shadow h-full">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <GradientAvatar name={a.name} initials={a.avatar} size="lg" />
                  {a.status === 'Lifetime Member' && (
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-card">
                      <Trophy className="h-3 w-3 text-white" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{a.name}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Batch {a.batch} · {a.passingYear}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.currentRole}</p>
                  <p className="text-[11px] text-muted-foreground/80 line-clamp-1">{a.company}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <StatusBadge
                  status={a.status}
                  variant={a.status === 'Lifetime Member' ? 'warning' : a.status === 'Active' ? 'success' : 'neutral'}
                  dot
                />
                <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <Heart className="h-3 w-3 fill-emerald-500" />
                  {formatINR(a.totalDonation, true)}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export { ChevronRight }
