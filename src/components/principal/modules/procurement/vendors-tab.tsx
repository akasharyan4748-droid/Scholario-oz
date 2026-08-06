'use client'

import { motion } from 'framer-motion'
import { Truck, Star, Clock, Search } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Vendor } from '@/lib/mock/procurement'

interface Props {
  search: string
  setSearch: (s: string) => void
  filteredVendors: Vendor[]
  onSelectVendor: (v: Vendor) => void
}

export function VendorsTab({ search, setSearch, filteredVendors, onSelectVendor }: Props) {
  return (
    <motion.div key="vn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors by name or category…"
            className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredVendors.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            className="cursor-pointer"
            onClick={() => onSelectVendor(v)}
          >
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full hover:shadow-premium-lg transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', v.gradient)}>
                  <Truck className="h-5 w-5" />
                </div>
                <StatusBadge status={v.status} variant={v.status === 'Active' ? 'success' : v.status === 'On Hold' ? 'warning' : 'danger'} dot />
              </div>
              <p className="font-semibold text-sm leading-tight">{v.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{v.category} · {v.contact}</p>

              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                  <Star className="h-3 w-3 fill-amber-400" /> {v.rating}
                </span>
                <span className="text-[10px] text-muted-foreground">· {v.onTimeRate}% on-time</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-[9px] text-muted-foreground">Total Orders</p>
                  <p className="text-sm font-semibold">{v.totalOrders}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Total Value</p>
                  <p className="text-sm font-semibold">{formatINR(v.totalValue, true)}</p>
                </div>
              </div>

              {v.pendingPayment > 0 && (
                <div className="mt-2 flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-600">
                  <Clock className="h-2.5 w-2.5" /> {formatINR(v.pendingPayment)} pending
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
