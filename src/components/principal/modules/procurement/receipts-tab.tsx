'use client'

import { motion } from 'framer-motion'
import { Package, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { goodsReceipts } from '@/lib/mock/procurement'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { qualityConfig } from './data'

export function ReceiptsTab() {
  return (
    <motion.div key="gr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
      {goodsReceipts.map((gr, i) => {
        const qCfg = qualityConfig[gr.qualityCheck]
        const isComplete = gr.itemsReceived === gr.itemsOrdered
        return (
          <motion.div key={gr.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isComplete ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600')}>
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-xs font-semibold">{gr.grnNo}</p>
                    <span className="text-[11px] text-muted-foreground">· {gr.vendor}</span>
                    <span className={cn('ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold', qCfg.color, 'bg-current/10')}>
                      <CheckCircle2 className="h-2.5 w-2.5" /> {gr.qualityCheck}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">PO: {gr.poNo} · Received: {formatDate(gr.receivedDate)}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Items Received</span>
                      <span className="font-semibold">{gr.itemsReceived} / {gr.itemsOrdered}</span>
                    </div>
                    <ProgressBar value={gr.itemsReceived} max={gr.itemsOrdered} color={isComplete ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'} height={5} />
                  </div>
                  {gr.remarks && (
                    <p className="text-[11px] text-muted-foreground italic mt-2">"{gr.remarks}"</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">Received by: {gr.receivedBy}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
