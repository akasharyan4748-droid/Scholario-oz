import type { Flashcard } from '@/lib/mock/flashcards'

export type Tab = 'study' | 'cards' | 'notes'

export const statusConfig: Record<Flashcard['status'], { variant: 'neutral' | 'warning' | 'info' | 'success'; label: string; color: string }> = {
  new: { variant: 'neutral' as const, label: 'New', color: 'text-muted-foreground bg-muted' },
  learning: { variant: 'warning' as const, label: 'Learning', color: 'text-amber-600 bg-amber-500/10' },
  reviewing: { variant: 'info' as const, label: 'Reviewing', color: 'text-sky-600 bg-sky-500/10' },
  mastered: { variant: 'success' as const, label: 'Mastered', color: 'text-emerald-600 bg-emerald-500/10' },
}

export const difficultyConfig: Record<Flashcard['difficulty'], string> = {
  easy: 'bg-emerald-500/15 text-emerald-600',
  medium: 'bg-amber-500/15 text-amber-600',
  hard: 'bg-rose-500/15 text-rose-600',
}
