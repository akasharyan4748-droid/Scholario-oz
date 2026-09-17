'use client'

/**
 * learning/index — LEARNING: a Personal Learning OS (§2/§52/§84).
 *
 * Four connected sections, ONE ecosystem (§3):
 *   Learning Hub → Flashcards → Study Planner → Study Groups
 *
 * Context is established ONCE by the workspace (§4): the page header says
 * "Learning / Your learning space" and nothing more — no class, session or
 * school repetition anywhere below.
 *
 * The section switcher accepts deep-link tabs (dashboard queue, notifications,
 * the command palette) through the same {initialTab, onTabChange} contract
 * the panel already speaks. The Flashcards section can also be entered
 * straight into a deck review (hub → resource → "Review deck").
 */

import { useCallback, useState } from 'react'
import { GraduationCap, Layers, CalendarRange, Users } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { StudentPageHeader } from '../../shell/page-header'
import { HubHome } from './hub/hub-home'
import { FlashcardsHome } from './flashcards/flashcards-home'
import { ReviewSession } from './flashcards/review-session'
import { PlannerHome } from './planner/planner-home'
import { GroupsHome } from './groups/groups-home'

const SECTIONS = [
  { key: 'hub', label: 'Learning Hub', icon: GraduationCap },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'planner', label: 'Study Planner', icon: CalendarRange },
  { key: 'groups', label: 'Study Groups', icon: Users },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

/** Legacy tab keys → the new section keys (deep links keep working). */
const TAB_ALIASES: Record<string, SectionKey> = {
  resources: 'hub',
  flashcards: 'flashcards',
  planner: 'planner',
  peer: 'groups',
  hub: 'hub',
  groups: 'groups',
}

export function LearningModule({ initialTab, onTabChange, onNavigate }: {
  initialTab?: string
  onTabChange?: (tab: string) => void
  /** Module-level navigation (e.g. "Ask your teacher" → messages). */
  onNavigate?: (key: string) => void
}) {
  const [section, setSection] = useState<SectionKey>(
    (initialTab && TAB_ALIASES[initialTab]) || 'hub',
  )
  /** Deck to jump straight into review with (hub → "Review deck"). */
  const [reviewDeckId, setReviewDeckId] = useState<string | null>(null)

  const select = useCallback((key: string) => {
    const next = (TAB_ALIASES[key] ?? 'hub') as SectionKey
    setSection(next)
    setReviewDeckId(null)
    onTabChange?.(next)
  }, [onTabChange])

  const jumpToDeckReview = useCallback((deckId: string) => {
    setSection('flashcards')
    setReviewDeckId(deckId)
    onTabChange?.('flashcards')
  }, [onTabChange])

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-7">
        {/* Scope, once (§4) — nothing repeated below. */}
        <StudentPageHeader title="Learning" subtitle="Your learning space" />

        {/* Section switcher (§52 — four, never ten) */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-border pb-2.5" role="tablist" aria-label="Learning sections">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const active = section === s.key
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={active}
                onClick={() => select(s.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-primary/[0.09] text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* The connected ecosystem */}
        {section === 'hub' && (
          <HubHome
            key="hub"
            onSection={select}
            onReviewDeck={jumpToDeckReview}
            onNavigate={onNavigate ?? ((key) => onTabChange?.(key))}
          />
        )}
        {section === 'flashcards' && (
          <FlashcardsDeckEntry key={`fc-${reviewDeckId ?? 'all'}`} deckId={reviewDeckId} />
        )}
        {section === 'planner' && <PlannerHome key="planner" />}
        {section === 'groups' && <GroupsHome key="groups" />}
      </div>
    </PageTransition>
  )
}

/**
 * Flashcards entry — when the hub jumps straight into a deck review, the
 * session opens immediately (the "Review deck" promise is kept §62).
 */
function FlashcardsDeckEntry({ deckId }: { deckId: string | null }) {
  const [session, setSession] = useState<{ deckId: string | null; cardIds?: string[] | null } | null>(
    deckId ? { deckId } : null,
  )

  if (session) {
    return (
      <ReviewSession
        key={session.cardIds ? session.cardIds.join(',') : session.deckId ?? 'all'}
        deckId={session.deckId}
        cardIds={session.cardIds ?? null}
        onExit={() => setSession(null)}
        onReviewAgain={(ids) => setSession({ deckId: null, cardIds: ids })}
      />
    )
  }
  // No active session — the full Flashcards home (its own session state).
  return <FlashcardsHome key={deckId ? `home-${deckId}` : 'home'} />
}
