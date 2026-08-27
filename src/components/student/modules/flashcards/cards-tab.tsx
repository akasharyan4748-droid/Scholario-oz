'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/ui'
import { flashcards, type Flashcard } from '@/lib/mock/flashcards'
import { cn } from '@/lib/utils'
import { statusConfig, difficultyConfig } from './shared'

interface CardsTabProps {
  cardStates: Record<string, Flashcard['status']>
}

export function CardsTab({ cardStates }: CardsTabProps) {
  return (
    <motion.div key="cd" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">All Flashcards ({flashcards.length})</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {flashcards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card/40 p-3 hover:shadow-premium transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-muted-foreground">{card.subject}</span>
                <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-semibold', statusConfig[cardStates[card.id]].color)}>
                  {statusConfig[cardStates[card.id]].label}
                </span>
              </div>
              <p className="text-sm font-medium leading-tight line-clamp-2">{card.front}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1 italic">→ {card.back}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-medium', difficultyConfig[card.difficulty])}>{card.difficulty}</span>
                <span className="text-[9px] text-muted-foreground">{card.reviews} reviews</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
