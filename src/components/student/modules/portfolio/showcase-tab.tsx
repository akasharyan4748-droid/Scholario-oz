'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { achievements, type PortfolioAchievement } from '@/lib/mock/portfolio'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { categoryConfig, levelConfig } from './data'

export function ShowcaseTab({ onSelect }: { onSelect: (a: PortfolioAchievement) => void }) {
  return (
    <motion.div key="sc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {achievements.map((a, i) => {
        const cfg = categoryConfig[a.category]
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="cursor-pointer"
            onClick={() => onSelect(a)}
          >
            <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow">
              <div className={cn('relative h-24 bg-gradient-to-br flex items-center justify-center', cfg.color)}>
                <div className="absolute inset-0 bg-grid opacity-20" />
                <span className="relative text-4xl">{a.icon}</span>
                <span className="absolute top-2.5 right-2.5">
                  <StatusBadge status={levelConfig[a.level].label} variant={levelConfig[a.level].variant} />
                </span>
              </div>
              <div className="p-4">
                <span className={cn('inline-flex items-center gap-1 rounded-md bg-gradient-to-br px-1.5 py-0.5 text-[9px] font-semibold text-white', cfg.color)}>
                  {cfg.icon} {a.category}
                </span>
                <p className="font-semibold text-sm leading-tight mt-2 line-clamp-2">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{a.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">{formatDate(a.date)}</span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-primary">View <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
