'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, BookHeart, PenLine } from 'lucide-react'
import { moodConfig, type DiaryEntry } from '@/lib/mock/diary'
import { cn } from '@/lib/utils'

// New Entry modal — pick a mood, write a title + content, and save
export function NewEntryModal({
  open,
  onClose,
  onSave,
  selectedMood,
  onSelectMood,
  title,
  onTitleChange,
  content,
  onContentChange,
}: {
  open: boolean
  onClose: () => void
  onSave: () => void
  selectedMood: DiaryEntry['mood']
  onSelectMood: (m: DiaryEntry['mood']) => void
  title: string
  onTitleChange: (v: string) => void
  content: string
  onContentChange: (v: string) => void
}) {
  return (
    <AnimatePresence>
      {open && (
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
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white">
              <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-2 mb-1">
                <BookHeart className="h-5 w-5" />
                <h2 className="font-display text-lg font-bold">New Diary Entry</h2>
              </div>
              <p className="text-violet-50/90 text-xs">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Mood selector */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">How are you feeling today?</p>
                <div className="flex gap-2">
                  {(Object.keys(moodConfig) as DiaryEntry['mood'][]).map((m) => {
                    const cfg = moodConfig[m]
                    const isSelected = selectedMood === m
                    return (
                      <button
                        key={m}
                        onClick={() => onSelectMood(m)}
                        className={cn(
                          'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all',
                          isSelected ? 'border-primary bg-primary/5 scale-105' : 'border-border hover:border-primary/40'
                        )}
                      >
                        <span className="text-2xl">{cfg.emoji}</span>
                        <span className={cn('text-[10px] font-medium', isSelected && 'text-primary')}>{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Title</p>
                <input
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Give your entry a title…"
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>

              {/* Content */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">What happened today?</p>
                <textarea
                  value={content}
                  onChange={(e) => onContentChange(e.target.value)}
                  placeholder="Write about your day, your feelings, what you learned…"
                  rows={5}
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
                />
              </div>

              <button
                onClick={onSave}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 py-2.5 text-sm font-semibold text-white shadow-md"
              >
                <PenLine className="h-4 w-4" /> Save Entry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
