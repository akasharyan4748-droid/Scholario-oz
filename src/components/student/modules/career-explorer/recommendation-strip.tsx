'use client'

/**
 * RecommendationStrip — "You might like", the explainable idea strip
 * at the top of the Explore view (spec §35).
 *
 * EVERY card carries only real reasons, derived live from:
 *   · the interest chips the student picked (career store),
 *   · their strongest subjects in the LATEST published result
 *     (student-results-store, via useMyResults),
 *   · skill tags they have real evidence for (student-growth-store
 *     skillsWithEvidence),
 *   · careers they really saved (relatedIds).
 * With no interests chosen there is no honest recommendation — the
 * strip says so and points at the Interests view (§62, no dead ends).
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Eye, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { useStudentCareerStore, recommendationsFor } from '@/lib/store/student-career-store'
import { useStudentGrowthStore, skillsWithEvidence } from '@/lib/store/student-growth-store'
import { useMyResults, pctOf } from '@/lib/store/student-results-store'
import { FieldChip, FieldTile, BTN_OUTLINE } from './shared'
import { cn } from '@/lib/utils'

interface RecommendationStripProps {
  onOpen: (careerId: string) => void
  /** Jump to the My Interests view (honest empty state CTA). */
  onGoInterests: () => void
}

export function RecommendationStrip({ onOpen, onGoInterests }: RecommendationStripProps) {
  const interests = useStudentCareerStore((s) => s.interests)
  const saved = useStudentCareerStore((s) => s.saved)

  const achievements = useStudentGrowthStore((s) => s.achievements)
  const portfolioItems = useStudentGrowthStore((s) => s.portfolioItems)
  const myResults = useMyResults()

  const recs = useMemo(() => {
    // Top 2–3 strongest subjects of the latest published result —
    // real subject names, never a guess.
    const strongestSubjects = (myResults.latest?.result.subjects ?? [])
      .map((s) => ({ subject: s.subject, pct: pctOf(s.obtained, s.maxMarks) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3)
      .map((s) => s.subject)
    const skillTags = skillsWithEvidence({ achievements, portfolioItems }).map((s) => s.skill)
    return recommendationsFor({ interests, saved, strongestSubjects, skillTags })
  }, [interests, saved, achievements, portfolioItems, myResults.latest])

  if (interests.length === 0) {
    return (
      <GlassCard hover={false} className="on-card flex flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400" aria-hidden>
            <Lightbulb className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">Pick a few interests to get ideas for careers to explore.</p>
        </div>
        <button
          type="button"
          onClick={onGoInterests}
          className={cn(BTN_OUTLINE, 'sm:w-auto')}
        >
          Choose interests
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </GlassCard>
    )
  }

  if (recs.length === 0) return null

  return (
    <section aria-labelledby="career-recs-heading" className="space-y-2.5">
      <SectionLabel hint={`${recs.length} ${recs.length === 1 ? 'idea' : 'ideas'}`}>
        <span id="career-recs-heading">You might like</span>
      </SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((rec, i) => (
          <motion.div
            key={rec.career.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.15) }}
          >
            <GlassCard className="on-card h-full p-4">
              <div className="flex items-start gap-3">
                <FieldTile field={rec.career.field} />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-snug">{rec.career.title}</h3>
                  <div className="mt-1.5">
                    <FieldChip field={rec.career.field} />
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5" aria-label={`Why ${rec.career.title} might interest you`}>
                {rec.reasons.slice(0, 3).map((r) => (
                  <li key={r.text} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500/60" aria-hidden />
                    {r.text}
                  </li>
                ))}
                {rec.reasons.length > 3 && (
                  <li className="pl-3.5 text-[11px] text-muted-foreground/70">
                    +{rec.reasons.length - 3} more reasons
                  </li>
                )}
              </ul>
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={() => onOpen(rec.career.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.06] px-3 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-violet-300"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Explore
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
