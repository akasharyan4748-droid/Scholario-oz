'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { inventoryItems } from '@/lib/mock/operations'
import { toast } from 'sonner'
import { stockMovements } from './data'

type InventoryItem = (typeof inventoryItems)[number]
type Movement = (typeof stockMovements)[number]

export function LowStockAlerts({ lowStockItems }: { lowStockItems: InventoryItem[] }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600"><AlertTriangle className="h-4.5 w-4.5" /></div>
          <div>
            <h3 className="font-semibold text-sm">Low Stock Alerts</h3>
            <p className="text-xs text-muted-foreground">{lowStockItems.length} items need reorder</p>
          </div>
        </div>
        <StatusBadge status="Action needed" variant="danger" dot />
      </div>
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {lowStockItems.map((it, i) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{it.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Current: {it.stock} {it.unit} · Suggested reorder: 50 {it.unit}</p>
              </div>
              <StatusBadge status={`Only ${it.stock} left`} variant="warning" />
            </div>
            <div className="mt-2">
              <ProgressBar value={it.stock} max={50} color="oklch(0.7 0.16 75)" height={5} />
            </div>
            <Button size="sm" variant="outline" className="w-full mt-2 text-xs h-7 gap-1.5" onClick={() => toast.success('Reorder placed', { description: `${it.name} · 50 units ordered from supplier` })}>
              <RefreshCw className="h-3 w-3" /> Place Reorder (50 units)
            </Button>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

export function StockMovementLog({ movements }: { movements: Movement[] }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><TrendingUp className="h-4.5 w-4.5" /></div>
          <div>
            <h3 className="font-semibold text-sm">Stock Movement Log</h3>
            <p className="text-xs text-muted-foreground">Recent transactions</p>
          </div>
        </div>
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {movements.map((m, i) => {
          const isIn = m.action === 'Stock In'
          const isOut = m.action === 'Issued' || m.action === 'Damaged'
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/40 transition-colors"
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                isIn ? 'bg-emerald-500/10 text-emerald-600' :
                isOut ? 'bg-rose-500/10 text-rose-600' :
                'bg-amber-500/10 text-amber-600'
              }`}>
                {isIn ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{m.item}</p>
                <p className="text-[11px] text-muted-foreground">{m.by} · {m.time}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-semibold ${isIn ? 'text-emerald-600' : isOut ? 'text-rose-600' : 'text-amber-600'}`}>
                  {isIn ? '+' : isOut ? '−' : ''}{m.qty}
                </p>
                <p className="text-[10px] text-muted-foreground">{m.action}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
