'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Download, Eye, Share2 } from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { formatDate } from '@/lib/format'
import { type TeachingResource } from '@/lib/mock/teacher-resources'
import { toast } from 'sonner'
import { typeConfig } from './data'

export function ResourceDetailModal({
  selected, onClose,
}: {
  selected: TeachingResource | null
  onClose: () => void
}) {
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
            className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
              <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-semibold">
                  {typeConfig[selected.type].icon} {selected.type}
                </span>
                <span className="rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">{selected.subject}</span>
              </div>
              <h2 className="font-display text-lg font-bold leading-tight">{selected.title}</h2>
              <p className="text-amber-50/90 text-sm mt-1">{selected.grade} · {selected.topic}</p>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm leading-relaxed">{selected.description}</p>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">File Size</p>
                  <p className="text-sm font-semibold">{selected.fileSize}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Downloads</p>
                  <p className="text-sm font-semibold">{selected.downloads}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Rating</p>
                  <p className="text-sm font-semibold flex items-center justify-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {selected.rating}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Uploaded</p>
                  <p className="text-sm font-semibold">{formatDate(selected.uploadedOn)}</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Uploaded by */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                <GradientAvatar name={selected.uploadedBy} size="md" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Uploaded by</p>
                  <p className="text-sm font-semibold">{selected.uploadedBy}</p>
                  {selected.lastUsed && <p className="text-[11px] text-muted-foreground">Last used {formatDate(selected.lastUsed)}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { toast.success('Downloaded', { description: `${selected.title} saved` }); onClose() }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={() => { toast.success('Opening preview', { description: 'Resource preview' }); onClose() }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { toast.success('Share link copied', { description: 'Ready to paste' }); onClose() }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
