'use client'

import { motion } from 'framer-motion'
import { X, Download, Share2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/ui'
import { type PortfolioAchievement } from '@/lib/mock/portfolio'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { categoryConfig, levelConfig } from './data'

export function AchievementModal({
  selected,
  onClose,
}: {
  selected: PortfolioAchievement | null
  onClose: () => void
}) {
  if (!selected) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
      >
        <div className={cn('relative h-32 bg-gradient-to-br flex items-center justify-center', categoryConfig[selected.category].color)}>
          <div className="absolute inset-0 bg-grid opacity-20" />
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white"><X className="h-4 w-4" /></button>
          <span className="relative text-6xl">{selected.icon}</span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 rounded-md bg-gradient-to-br px-2 py-0.5 text-[10px] font-semibold text-white', categoryConfig[selected.category].color)}>
              {categoryConfig[selected.category].icon} {selected.category}
            </span>
            <StatusBadge status={levelConfig[selected.level].label} variant={levelConfig[selected.level].variant} />
          </div>
          <h2 className="font-display text-lg font-bold leading-tight">{selected.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
            <div>
              <p className="text-[10px] text-muted-foreground">Date</p>
              <p className="text-sm font-semibold">{formatDate(selected.date)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Issued By</p>
              <p className="text-sm font-semibold">{selected.issuer}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { toast.success('Certificate downloaded', { description: `${selected.title} — PDF saved` }); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              <Download className="h-4 w-4" /> Download Certificate
            </button>
            <button
              onClick={() => { toast.success('Shared', { description: 'Achievement shared with family' }); onClose() }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
