'use client'

/**
 * SkillsSection — SKILLS as evidence, not scores (spec §22/§23).
 *
 * skillsWithEvidence(...) aggregates the skill tags on real items +
 * achievements; each tag shows its evidence count and expands to the list
 * of real work carrying that skill (title, date, kind). "Research · 3
 * pieces of work" is more credible than any 88/100 — no skill scores
 * anywhere. Sky accent: skills / information.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Trophy } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  skillsWithEvidence,
  type GrowthAchievement,
  type PortfolioItem,
} from '@/lib/store/student-growth-store'
import { KIND_META } from './shared'

function evidenceKindLabel(kind: string): string {
  if (kind === 'achievement') return 'Achievement'
  const meta = KIND_META[kind as keyof typeof KIND_META]
  return meta?.label ?? kind
}

function evidenceDot(kind: string): string {
  if (kind === 'achievement') return 'bg-amber-500'
  const meta = KIND_META[kind as keyof typeof KIND_META]
  return meta?.dot ?? 'bg-muted-foreground/50'
}

export function SkillsSection({ achievements, portfolioItems }: {
  achievements: GrowthAchievement[]
  portfolioItems: PortfolioItem[]
}) {
  const skills = useMemo(
    () => skillsWithEvidence({ achievements, portfolioItems }),
    [achievements, portfolioItems],
  )
  const [expanded, setExpanded] = useState<string | null>(null)

  if (skills.length === 0) return null

  const expandedSkill = skills.find((s) => s.skill === expanded) ?? null

  return (
    <section aria-labelledby="portfolio-skills-label" className="space-y-3">
      <SectionLabel hint={`${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`}>
        <span id="portfolio-skills-label">Skills</span>
      </SectionLabel>

      <GlassCard hover={false} className="on-card space-y-3 p-4 sm:p-5">
        {/* Tags with evidence counts — click to expand the evidence */}
        <div className="flex flex-wrap items-center gap-1.5">
          {skills.map((s) => {
            const active = expanded === s.skill
            return (
              <button
                key={s.skill}
                type="button"
                aria-pressed={active}
                aria-expanded={active}
                onClick={() => setExpanded(active ? null : s.skill)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9 sm:py-1.5',
                  active
                    ? 'border-sky-500/30 bg-sky-500/[0.1] text-sky-700 dark:text-sky-300'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {s.skill}
                <span
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
                    active
                      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {s.evidence.length}
                </span>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 shrink-0 transition-transform', active && 'rotate-180')}
                  aria-hidden
                />
              </button>
            )
          })}
        </div>

        {/* The evidence behind the expanded skill */}
        <AnimatePresence initial={false}>
          {expandedSkill && (
            <motion.div
              key={expandedSkill.skill}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              role="region"
              aria-label={`Evidence for ${expandedSkill.skill}`}
              className="rounded-xl border border-border/60 bg-muted/30 p-3"
            >
              <p className="mb-2 px-1 text-[11px] font-medium text-muted-foreground">
                {expandedSkill.evidence.length} {expandedSkill.evidence.length === 1 ? 'piece' : 'pieces'} of
                work show <span className="font-semibold text-foreground">{expandedSkill.skill}</span>
              </p>
              <ul className="space-y-1">
                {expandedSkill.evidence.map((ev) => (
                  <li
                    key={`${ev.title}-${ev.dateISO}`}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-background px-3 py-2 text-[13px]"
                  >
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', evidenceDot(ev.kind))} aria-hidden />
                    <span className="min-w-0 flex-1 font-medium text-foreground/90">{ev.title}</span>
                    {ev.kind === 'achievement' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/[0.07] px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        <Trophy className="h-2.5 w-2.5" aria-hidden />
                        Achievement
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {evidenceKindLabel(ev.kind)}
                      </span>
                    )}
                    <span className="text-[11px] tabular-nums text-muted-foreground">{formatDate(ev.dateISO)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </section>
  )
}
