'use client'

/**
 * CareerExplorerModule — the Careers tab of "My Progress".
 *
 * The biggest conceptual change of the rebuild: for a PRIMARY school
 * student (the demo student is in Class 2-A) this is an INTERESTS,
 * ACTIVITIES and CURIOSITY surface — career awareness, never stream
 * selection, invented scores, entrance exams or future-planning
 * ladders. The old mock-backed module (a fake subject-stream hero,
 * made-up score KPIs, a lying session-booking toast and
 * higher-secondary planning tabs) is gone — the legacy mock career
 * file has zero importers.
 *
 * Structure: one header + a compact live fact strip (catalog size,
 * saved count, honest distinct-career explored count) + a persistent
 * search + three views (Explore · My Interests · Saved). The module
 * owns the career detail dialog; opening a career records a REAL
 * view into the persisted career store.
 */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Bookmark, Eye, Lightbulb } from 'lucide-react'
import { StudentPageHeader } from '@/components/student/shell/page-header'
import {
  CAREER_CATALOG,
  exploreCountOf,
  useStudentCareerStore,
  type CareerEntry,
} from '@/lib/store/student-career-store'
import { ExploreView } from './explore-view'
import { InterestsView } from './interests-view'
import { SavedView } from './saved-view'
import { CareerDetail } from './career-detail'
import { FooterPolicyLine } from './shared'
import { cn } from '@/lib/utils'

type View = 'explore' | 'interests' | 'saved'

const VIEWS: Array<{ key: View; label: string }> = [
  { key: 'explore', label: 'Explore' },
  { key: 'interests', label: 'My Interests' },
  { key: 'saved', label: 'Saved' },
]

function FactChip({ icon: Icon, children }: { icon: typeof Compass; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      {children}
    </span>
  )
}

export function CareerExplorerModule() {
  const saved = useStudentCareerStore((s) => s.saved)
  const viewed = useStudentCareerStore((s) => s.viewed)
  const recordView = useStudentCareerStore((s) => s.recordView)

  const [view, setView] = useState<View>('explore')
  // The search query is module state — it persists across view switches.
  const [query, setQuery] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const explored = useMemo(() => exploreCountOf(viewed), [viewed])

  function openCareer(career: CareerEntry) {
    recordView(career.id)
    setDetailId(career.id)
  }

  function switchCareer(careerId: string) {
    // Swapping the detail to a related career is a real open, too.
    recordView(careerId)
    setDetailId(careerId)
  }

  return (
    <div className="space-y-5">
      <StudentPageHeader title="Career Explorer" subtitle="Find out what jobs are like" />

      {/* Live fact strip — every number derived at render time */}
      <div className="flex flex-wrap items-center gap-2">
        <FactChip icon={Compass}>
          {CAREER_CATALOG.length} careers to explore
        </FactChip>
        <FactChip icon={Bookmark}>{saved.length} saved</FactChip>
        <FactChip icon={Eye}>{explored} explored</FactChip>
      </div>

      {/* View switch */}
      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Career Explorer views">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              view === v.key
                ? 'bg-violet-500/[0.1] text-violet-700 dark:text-violet-300'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {v.key === 'interests' && <Lightbulb className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden />}
            {v.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'explore' && (
            <ExploreView
              query={query}
              onQueryChange={setQuery}
              onOpen={openCareer}
              onGoInterests={() => setView('interests')}
            />
          )}
          {view === 'interests' && <InterestsView onOpen={openCareer} />}
          {view === 'saved' && <SavedView onOpen={openCareer} />}
        </motion.div>
      </AnimatePresence>

      {/* The age-honest policy line */}
      <FooterPolicyLine />

      {/* The detail dialog (opening a career records a real view) */}
      <CareerDetail careerId={detailId} onClose={() => setDetailId(null)} onSwitch={switchCareer} />
    </div>
  )
}
