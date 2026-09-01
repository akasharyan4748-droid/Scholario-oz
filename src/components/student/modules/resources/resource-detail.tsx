'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Play, Star, Download, Bookmark, BookmarkCheck, FileQuestion, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Resource } from '@/lib/mock/resources'
import { typeConfig } from './data'

interface ResourceDetailProps {
  selected: Resource | null
  bookmarked: Set<string>
  onToggleBookmark: (id: string) => void
  onClose: () => void
}

export function ResourceDetail({ selected, bookmarked, onToggleBookmark, onClose }: ResourceDetailProps) {
  return (
    <AnimatePresence>
      {selected && (
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
            className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg overflow-hidden rounded-2xl border border-border glass-strong shadow-premium-lg"
          >
            {/* Header banner */}
            <div className={cn('relative h-40 bg-gradient-to-br flex items-center justify-center', selected.thumbnailColor)}>
              <div className="absolute inset-0 bg-grid opacity-20" />
              {selected.type === 'video' ? (
                <motion.div whileHover={{ scale: 1.1 }} className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur ring-4 ring-white/40 cursor-pointer">
                  <Play className="h-7 w-7 text-white fill-white ml-1" />
                </motion.div>
              ) : (
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur ring-4 ring-white/40 text-white">
                  {typeConfig[selected.type].icon}
                </div>
              )}
              <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur hover:bg-white/30 transition-colors text-white">✕</button>
              <span className={cn('absolute top-3 left-3 rounded-md px-2 py-0.5 text-[10px] font-semibold backdrop-blur bg-white/85', typeConfig[selected.type].color.split(' ')[1])}>
                {typeConfig[selected.type].label}
              </span>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-primary">{selected.subject}</span>
                <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
                  <Star className="h-3 w-3 fill-amber-400" /> {selected.rating}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Download className="h-3 w-3" /> {selected.downloads} downloads
                </span>
              </div>
              <h2 className="font-display text-lg font-bold leading-tight">{selected.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-border">
                {selected.duration && (
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Duration</p>
                    <p className="text-sm font-semibold">{selected.duration}</p>
                  </div>
                )}
                {selected.pages && (
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Pages</p>
                    <p className="text-sm font-semibold">{selected.pages}</p>
                  </div>
                )}
                {selected.questions && (
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Questions</p>
                    <p className="text-sm font-semibold">{selected.questions}</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Uploaded</p>
                  <p className="text-sm font-semibold">{new Date(selected.uploadedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">By</p>
                  <p className="text-sm font-semibold truncate">{selected.uploadedBy.split(' ')[0]}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { toast.success(selected.type === 'video' ? 'Playing video…' : selected.type === 'quiz' ? 'Starting quiz…' : 'Opening resource…'); onClose() }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md"
                >
                  {selected.type === 'video' ? <Play className="h-4 w-4" /> : selected.type === 'quiz' ? <FileQuestion className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {selected.type === 'video' ? 'Watch Now' : selected.type === 'quiz' ? 'Start Quiz' : 'Open'}
                </button>
                <button
                  onClick={() => { toast.success('Downloaded', { description: `${selected.title} saved to your device` }) }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onToggleBookmark(selected.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {bookmarked.has(selected.id) ? <BookmarkCheck className="h-4 w-4 text-amber-500 fill-amber-400" /> : <Bookmark className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
