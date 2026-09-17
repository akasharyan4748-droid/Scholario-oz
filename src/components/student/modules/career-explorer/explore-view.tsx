'use client'

/**
 * ExploreView — the default Careers view: the explainable idea strip,
 * the eight interest-area tiles (with REAL catalog counts), and the
 * career catalog itself (persistent search + area filter, live).
 *
 * NO invented scores, NO subject streams, NO future-planning
 * ladders — just an encyclopedia of real jobs described for a
 * primary-school child.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, SearchX, Check, History } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { formatRelativeTime } from '@/lib/format'
import {
  CAREER_CATALOG,
  FIELD_ORDER,
  careerById,
  recentOf,
  useStudentCareerStore,
  type CareerEntry,
  type CareerField,
} from '@/lib/store/student-career-store'
import { CareerCard } from './career-card'
import { RecommendationStrip } from './recommendation-strip'
import { CareerEmptyState, FIELD_META, INPUT_CLASSES, BTN_SOFT } from './shared'
import { cn } from '@/lib/utils'

interface ExploreViewProps {
  /** Persistent search query (state owned by the module index). */
  query: string
  onQueryChange: (q: string) => void
  onOpen: (career: CareerEntry) => void
  onGoInterests: () => void
}

export function ExploreView({ query, onQueryChange, onOpen, onGoInterests }: ExploreViewProps) {
  const [field, setField] = useState<CareerField | null>(null)
  const saved = useStudentCareerStore((s) => s.saved)
  const viewed = useStudentCareerStore((s) => s.viewed)
  const savedIds = useMemo(() => new Set(saved.map((c) => c.careerId)), [saved])

  // The REAL exploration history (persists in the career store) —
  // resolved against the catalog, newest view first.
  const recent = useMemo(
    () =>
      recentOf(viewed, 4)
        .map((r) => ({ ...r, career: careerById(r.careerId) }))
        .filter((r): r is { careerId: string; viewedOn: string; career: CareerEntry } => r.career != null),
    [viewed],
  )

  const fieldCounts = useMemo(() => {
    const map = new Map<CareerField, number>()
    for (const c of CAREER_CATALOG) map.set(c.field, (map.get(c.field) ?? 0) + 1)
    return map
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CAREER_CATALOG.filter((c) => {
      if (field && c.field !== field) return false
      if (!q) return true
      const haystack = [
        c.title,
        FIELD_META[c.field].label,
        ...c.skills,
        ...c.subjects,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, field])

  const filtering = query.trim().length > 0 || field !== null

  return (
    <div className="space-y-5">
      <RecommendationStrip onOpen={(id) => {
        const career = CAREER_CATALOG.find((c) => c.id === id)
        if (career) onOpen(career)
      }} onGoInterests={onGoInterests} />

      {/* Recently explored — the real view history */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-careers-heading" className="space-y-2.5">
          <SectionLabel hint="what you looked at">
            <span id="recent-careers-heading">Recently explored</span>
          </SectionLabel>
          <div className="flex flex-wrap gap-2">
            {recent.map(({ career, viewedOn }) => (
              <button
                key={career.id}
                type="button"
                onClick={() => onOpen(career)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:py-1.5"
              >
                <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
                {career.title}
                <span className="text-[10px] font-normal text-muted-foreground/70">{formatRelativeTime(viewedOn)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Explore by interest area — the eight fields, real counts */}
      <section aria-labelledby="explore-by-area-heading" className="space-y-2.5">
        <SectionLabel hint={field ? FIELD_META[field].label : 'All areas'}>
          <span id="explore-by-area-heading">Explore by interest area</span>
        </SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {FIELD_ORDER.map((f) => {
            const meta = FIELD_META[f]
            const Icon = meta.icon
            const count = fieldCounts.get(f) ?? 0
            const active = field === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setField(active ? null : f)}
                aria-pressed={active}
                className={cn(
                  'relative flex min-h-[68px] flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-violet-500/40 bg-violet-500/[0.06]'
                    : 'border-border bg-background hover:bg-accent',
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white" aria-hidden>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.tile)} aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-foreground">{meta.label}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {count} {count === 1 ? 'career' : 'careers'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* The catalog */}
      <section aria-labelledby="all-careers-heading" className="space-y-2.5">
        <SectionLabel hint={filtering ? `${filtered.length} of ${CAREER_CATALOG.length} careers` : `${CAREER_CATALOG.length} careers`}>
          <span id="all-careers-heading">All careers</span>
        </SectionLabel>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 sm:left-3.5" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search careers, skills or subjects…"
            aria-label="Search careers"
            className={cn(INPUT_CLASSES, 'pl-10 sm:pl-10')}
          />
        </div>

        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((career, i) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  saved={savedIds.has(career.id)}
                  onOpen={onOpen}
                  index={i}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <GlassCard hover={false} className="on-card">
                <CareerEmptyState icon={SearchX} title="No careers match — try another word." />
                <div className="flex justify-center pb-5">
                  <button
                    type="button"
                    onClick={() => {
                      onQueryChange('')
                      setField(null)
                    }}
                    className={cn(BTN_SOFT, 'sm:w-auto')}
                  >
                    Clear search
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
