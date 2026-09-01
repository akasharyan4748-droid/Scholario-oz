'use client'

import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Play, Star, Download, CheckCircle2, Search } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { Resource } from '@/lib/mock/resources'
import { typeConfig } from './data'

interface ResourceGridProps {
  items: Resource[]
  bookmarked: Set<string>
  completed: Set<string>
  onToggleBookmark: (id: string) => void
  onMarkComplete: (id: string) => void
  onSelect: (r: Resource) => void
}

export function ResourceGrid({
  items,
  bookmarked,
  completed,
  onToggleBookmark,
  onMarkComplete,
  onSelect,
}: ResourceGridProps) {
  if (items.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
          <Search className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">No resources found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
      </GlassCard>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((r, i) => {
        const cfg = typeConfig[r.type]
        const isBookmarked = bookmarked.has(r.id)
        const isCompleted = completed.has(r.id)
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            className="group"
          >
            <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow cursor-pointer">
              {/* Thumbnail */}
              <div
                onClick={() => onSelect(r)}
                className={cn('relative h-32 bg-gradient-to-br flex items-center justify-center overflow-hidden', r.thumbnailColor)}
              >
                <div className="absolute inset-0 bg-grid opacity-20" />
                {r.type === 'video' ? (
                  <motion.div whileHover={{ scale: 1.1 }} className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur ring-2 ring-white/40">
                    <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                  </motion.div>
                ) : (
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur ring-2 ring-white/40 text-white">
                    {cfg.icon}
                  </div>
                )}
                {/* Type badge */}
                <span className={cn('absolute top-2.5 left-2.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur bg-white/85', cfg.color.split(' ')[1])}>
                  {cfg.label}
                </span>
                {/* Bookmark */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleBookmark(r.id) }}
                  className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
                >
                  {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> : <Bookmark className="h-3.5 w-3.5 text-white" />}
                </button>
                {/* Completed check */}
                {isCompleted && (
                  <div className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white/40">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
                {/* Duration/pages */}
                {r.duration && (
                  <span className="absolute bottom-2.5 left-2.5 rounded bg-black/50 backdrop-blur px-1.5 py-0.5 text-[9px] font-medium text-white">{r.duration}</span>
                )}
                {r.pages && (
                  <span className="absolute bottom-2.5 left-2.5 rounded bg-black/50 backdrop-blur px-1.5 py-0.5 text-[9px] font-medium text-white">{r.pages} pages</span>
                )}
                {r.questions && (
                  <span className="absolute bottom-2.5 left-2.5 rounded bg-black/50 backdrop-blur px-1.5 py-0.5 text-[9px] font-medium text-white">{r.questions} Qs</span>
                )}
              </div>

              {/* Content */}
              <div className="p-4" onClick={() => onSelect(r)}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground">{r.subject}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                    <Star className="h-2.5 w-2.5 fill-amber-400" /> {r.rating}
                  </span>
                </div>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{r.description}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Download className="h-3 w-3" /> {r.downloads}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{new Date(r.uploadedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkComplete(r.id) }}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                      isCompleted ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    {isCompleted ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}
