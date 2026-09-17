'use client'

import { motion } from 'framer-motion'
import { Star, Download } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { type TeachingResource } from '@/lib/mock/teacher-resources'
import { typeConfig } from './data'

export function ResourceCard({
  r, i, onSelect,
}: {
  r: TeachingResource
  i: number
  onSelect: (r: TeachingResource) => void
}) {
  const cfg = typeConfig[r.type]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
      onClick={() => onSelect(r)}
    >
      <GlassCard className="p-3 sm:p-4 h-full hover:shadow-premium-lg transition-shadow">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold', cfg.color)}>
            {cfg.icon} {r.type}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
            <Star className="h-3 w-3 fill-amber-400" /> {r.rating}
          </span>
        </div>
        <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{r.subject} · {r.grade}</p>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{r.description}</p>

        <div className="flex flex-wrap gap-1 mt-2.5">
          {r.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">#{tag}</span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Download className="h-3 w-3" /> {r.downloads}
          </span>
          <span className="text-[10px] text-muted-foreground">{r.fileSize}</span>
          {r.shared && <StatusBadge status="Shared" variant="info" />}
        </div>
      </GlassCard>
    </motion.div>
  )
}
