'use client'

import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { purchaseOrders } from '@/lib/mock/procurement'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { poStatusConfig } from './data'

export function OrdersTab() {
  return (
    <motion.div key="po" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Purchase Orders</h3>
          <button onClick={() => toast.success('Export started')} className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">PO No.</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">Vendor</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Items</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell">Expected</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po, i) => {
                const cfg = poStatusConfig[po.status]
                return (
                  <motion.tr
                    key={po.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-mono text-xs font-semibold">{po.poNo}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(po.orderDate)}</p>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <p className="font-medium">{po.vendor}</p>
                      <p className="text-[10px] text-muted-foreground">{po.category}</p>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">{po.items}</td>
                    <td className="px-3 py-2.5 font-semibold">{formatINR(po.amount, true)}</td>
                    <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground text-xs">{formatDate(po.expectedDate)}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', cfg.color)}>{po.status}</span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </motion.div>
  )
}
