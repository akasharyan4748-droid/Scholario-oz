'use client'

import { motion } from 'framer-motion'
import { FileText, Download, ChevronDown } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ProgressBar } from '@/components/shared/charts'
import { feeStructures } from '@/lib/mock/finance'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import { categoryAccent } from './data'

// Fee Structures section — expandable Collapsible cards per category
// (Pre-Primary, Primary, Middle, Secondary, Senior). First card open by
// default. Category-specific accent colors and mini ProgressBar breakdowns
// per component (Tuition, Transport, Library, Exam, Activity).
export function FeeStructures({
  expandedId,
  onExpand,
}: {
  expandedId: string | null
  onExpand: (id: string | null) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <GlassCard className="p-4 sm:p-5 shadow-premium">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold">Fee Structures</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Annual categories · click to expand breakdown</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success('Fee structure exported', { description: 'fee-structure-2025-26.xlsx' })}
            className="h-8"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {feeStructures.map((f, i) => {
            const accent = categoryAccent[f.category] ?? categoryAccent.Primary
            const open = expandedId === f.id
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Collapsible open={open} onOpenChange={(o) => onExpand(o ? f.id : null)}>
                  <div
                    className={`rounded-xl border bg-card/50 overflow-hidden transition-all ring-1 ${open ? `border-transparent ${accent.ring} shadow-sm` : 'border-border ring-transparent hover:border-primary/30'}`}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full text-left p-3.5 focus-ring rounded-xl">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${accent.chip}`}>
                            {f.category}
                          </span>
                          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">{f.className}</p>
                        <p className="font-display text-xl font-bold tabular-nums mt-0.5">{formatINR(f.annual, true)}</p>
                        <div className="mt-2.5">
                          <ProgressBar value={100} max={100} color={accent.bar} height={4} />
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-border/60">
                        {f.components.map((c, idx) => {
                          const pct = (c.amount / f.annual) * 100
                          return (
                            <motion.div
                              key={c.name}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">{c.name}</span>
                                <span className="font-mono font-semibold tabular-nums">{formatINR(c.amount, true)}</span>
                              </div>
                              <ProgressBar value={pct} max={100} color={accent.bar} height={5} />
                            </motion.div>
                          )
                        })}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px]">
                          <span className="text-muted-foreground font-medium">Annual Total</span>
                          <span className="font-display font-bold tabular-nums">{formatINR(f.annual, true)}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
