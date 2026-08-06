'use client'

import { motion } from 'framer-motion'
import { Building2, Calendar, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { complianceItems, type ComplianceItem } from '@/lib/mock/compliance'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { statusConfig, categoryIcons, priorityConfig } from './data'

export function ComplianceTab({ onSelect }: { onSelect: (c: ComplianceItem) => void }) {
  return (
    <motion.div key="cp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {complianceItems.map((c, i) => {
        const cfg = statusConfig[c.status]
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            className="cursor-pointer"
            onClick={() => onSelect(c)}
          >
            <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow">
              <div className={cn('relative h-16 bg-gradient-to-br p-3 text-white', c.gradient)}>
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                      {categoryIcons[c.category]}
                    </div>
                    <div>
                      <p className="text-[10px] text-white/80 font-medium uppercase">{c.category}</p>
                      <p className="font-semibold text-sm leading-tight">{c.title}</p>
                    </div>
                  </div>
                  <span className={cn('flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-white/15 backdrop-blur')}>
                    {cfg.icon} {c.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3 w-3" /> {c.authority}</div>
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> Next: {formatDate(c.nextAudit)}</div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase', priorityConfig[c.priority])}>{c.priority}</span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-primary">Details <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
