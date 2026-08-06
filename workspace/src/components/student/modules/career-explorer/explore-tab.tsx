'use client'

import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { careerPaths, type CareerPath } from '@/lib/mock/career'
import { cn } from '@/lib/utils'

interface ExploreTabProps {
  saved: Set<string>
  onToggleSave: (id: string) => void
  onSelect: (c: CareerPath) => void
}

export function ExploreTab({ saved, onToggleSave, onSelect }: ExploreTabProps) {
  return (
    <motion.div key="ex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {careerPaths.map((c, i) => (
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
            <div className={cn('relative h-24 bg-gradient-to-br flex items-center justify-center', c.gradient)}>
              <div className="absolute inset-0 bg-grid opacity-20" />
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSave(c.id) }}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
              >
                {saved.has(c.id) ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> : <Bookmark className="h-3.5 w-3.5 text-white" />}
              </button>
              <span className="relative text-4xl">{c.icon}</span>
              <span className="absolute bottom-2 left-2 rounded-md bg-white/85 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold text-violet-600">{c.matchScore}% match</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600">{c.field}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">🔥 {c.popularity}%</span>
              </div>
              <p className="font-semibold text-sm leading-tight">{c.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs font-semibold text-emerald-600">{c.avgSalary}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-primary">Explore <ChevronRight className="h-3 w-3" /></span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
