'use client'

import { motion } from 'framer-motion'
import { BookOpen, Bookmark, BookmarkCheck, Lightbulb } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { subjectNotes } from '@/lib/mock/flashcards'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { difficultyConfig } from './shared'

interface NotesTabProps {
  notesProgress: Record<string, number>
  bookmarkedNotes: Set<string>
  onToggleBookmark: (id: string) => void
  onMarkRead: (id: string) => void
}

export function NotesTab({ notesProgress, bookmarkedNotes, onToggleBookmark, onMarkRead }: NotesTabProps) {
  return (
    <motion.div key="nt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {subjectNotes.map((note, i) => {
        const progress = notesProgress[note.id] ?? note.readProgress
        const isBookmarked = bookmarkedNotes.has(note.id)
        return (
          <motion.div key={note.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-600">{note.subject}</span>
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-medium', difficultyConfig[note.difficulty])}>{note.difficulty}</span>
                </div>
                <button onClick={() => onToggleBookmark(note.id)} className="text-muted-foreground hover:text-amber-500 transition-colors">
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-amber-500 fill-amber-400" /> : <Bookmark className="h-4 w-4" />}
                </button>
              </div>
              <p className="font-semibold text-sm">{note.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{note.topic}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">{note.content}</p>

              {/* Read progress */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Read progress</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <ProgressBar value={progress} color="oklch(0.6 0.2 300)" height={4} />
              </div>

              {/* Key points */}
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-amber-500" /> Key Points
                </p>
                <ul className="space-y-1">
                  {note.keyPoints.slice(0, 2).map((k, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-violet-500 mt-0.5">•</span>
                      <span className="line-clamp-1">{k}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  onMarkRead(note.id)
                  toast.success('Notes completed! 📖', { description: '+15 XP for studying' })
                }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <BookOpen className="h-3 w-3" /> {progress >= 100 ? 'Completed ✓' : 'Mark as Read'}
              </button>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
