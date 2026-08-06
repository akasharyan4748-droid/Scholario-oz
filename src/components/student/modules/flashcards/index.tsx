'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Plus, Brain, BookOpen, Clock, Award, Flame, Target } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend } from '@/components/shared/charts'
import { flashcards, subjectNotes, flashcardStats, type Flashcard } from '@/lib/mock/flashcards'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './shared'
import { StudyTab } from './study-tab'
import { CardsTab } from './cards-tab'
import { NotesTab } from './notes-tab'

type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

export function FlashcardsModule() {
  const [tab, setTab] = useState<Tab>('study')
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>(flashcards.filter((c) => c.status !== 'mastered'))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewedToday, setReviewedToday] = useState(flashcardStats.reviewsToday)
  const [cardStates, setCardStates] = useState<Record<string, Flashcard['status']>>(
    Object.fromEntries(flashcards.map((c) => [c.id, c.status]))
  )
  const [notesProgress, setNotesProgress] = useState<Record<string, number>>(
    Object.fromEntries(subjectNotes.map((n) => [n.id, n.readProgress]))
  )
  const [bookmarkedNotes, setBookmarkedNotes] = useState<Set<string>>(
    new Set(subjectNotes.filter((n) => n.bookmarked).map((n) => n.id))
  )

  const currentCard = studyQueue[currentIdx]
  const dueCards = flashcards.filter((c) => c.status !== 'mastered').length

  const reviewCard = (quality: ReviewQuality) => {
    if (!currentCard) return
    const newState =
      quality === 'again' ? 'learning' :
      quality === 'hard' ? 'learning' :
      quality === 'good' ? 'reviewing' : 'mastered'

    setCardStates((prev) => ({ ...prev, [currentCard.id]: newState }))
    setReviewedToday((n) => n + 1)

    if (quality === 'easy') {
      toast.success('Card mastered! 🎓', { description: '+10 XP — great recall!' })
    } else if (quality === 'again') {
      toast.info('Card will repeat soon', { description: 'Review again in 1 min' })
    }

    setFlipped(false)
    setTimeout(() => {
      setCurrentIdx((i) => Math.min(i + 1, studyQueue.length - 1))
    }, 300)
  }

  const restartStudy = () => {
    setStudyQueue(flashcards.filter((c) => cardStates[c.id] !== 'mastered'))
    setCurrentIdx(0)
    setFlipped(false)
    toast.info('Study session restarted', { description: `${flashcards.filter((c) => cardStates[c.id] !== 'mastered').length} cards in queue` })
  }

  const toggleBookmark = (id: string) => {
    setBookmarkedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else { next.add(id); toast.success('Bookmarked', { description: 'Saved to your notes' }) }
      return next
    })
  }

  const markNoteRead = (id: string) => {
    setNotesProgress((prev) => ({ ...prev, [id]: 100 }))
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Flashcards & Notes"
        subtitle="Spaced repetition revision + subject notes for exam prep"
        icon={<Layers className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('New flashcard', { description: 'Card builder would open' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> New Card
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Due Today" value={dueCards} icon={<Clock className="h-5 w-5" />} accent="violet" trendLabel={`${reviewedToday} reviewed`} delay={0} />
        <KpiCard label="Mastered" value={Object.values(cardStates).filter((s) => s === 'mastered').length} suffix={`/${flashcardStats.totalCards}`} icon={<Award className="h-5 w-5" />} accent="emerald" trend={12} trendLabel="this week" delay={0.05} />
        <KpiCard label="Study Streak" value={flashcardStats.streak} suffix=" days 🔥" icon={<Flame className="h-5 w-5" />} accent="rose" trendLabel={`best: ${flashcardStats.longestStreak}`} delay={0.1} />
        <KpiCard label="Accuracy" value={flashcardStats.accuracyRate} suffix="%" icon={<Target className="h-5 w-5" />} accent="amber" trend={4} trendLabel="recall rate" delay={0.15} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'study' as Tab, label: 'Study Session', icon: <Brain className="h-3.5 w-3.5" /> },
          { id: 'cards' as Tab, label: 'All Cards', icon: <Layers className="h-3.5 w-3.5" /> },
          { id: 'notes' as Tab, label: 'Subject Notes', icon: <BookOpen className="h-3.5 w-3.5" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'study' && (
          <StudyTab
            currentCard={currentCard}
            currentIdx={currentIdx}
            studyQueue={studyQueue}
            flipped={flipped}
            setFlipped={setFlipped}
            reviewedToday={reviewedToday}
            dueCards={dueCards}
            cardStates={cardStates}
            onReview={reviewCard}
            onRestart={restartStudy}
          />
        )}

        {tab === 'cards' && <CardsTab cardStates={cardStates} />}

        {tab === 'notes' && (
          <NotesTab
            notesProgress={notesProgress}
            bookmarkedNotes={bookmarkedNotes}
            onToggleBookmark={toggleBookmark}
            onMarkRead={markNoteRead}
          />
        )}
      </AnimatePresence>

      {/* Weekly reviews chart (always visible) */}
      {tab === 'study' && (
        <ChartCard title="Weekly Review Activity" subtitle="Cards reviewed each day">
          <BarTrend data={flashcardStats.weeklyReviews} xKey="day" yKey="reviews" color="oklch(0.6 0.2 300)" height={200} />
        </ChartCard>
      )}
    </div>
  )
}
