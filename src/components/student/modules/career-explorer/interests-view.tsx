'use client'

/**
 * InterestsView — "What do you enjoy?": the interest chip picker and
 * its LIVE mapping into careers. This is the age-appropriate heart of
 * the module for a primary-school child: interests and curiosity, not
 * test scores or stream selection.
 *
 * The mapping line is honest and visible: each chosen chip → the
 * interest areas it suggests. Every suggested career row carries its
 * WHY ("Because you picked …") — explainable, never opaque.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Eye, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { toast } from 'sonner'
import {
  CAREER_CATALOG,
  INTEREST_CHIPS,
  INTEREST_FIELDS,
  MAX_INTERESTS,
  fieldsOfInterests,
  useStudentCareerStore,
  type CareerEntry,
  type CareerField,
} from '@/lib/store/student-career-store'
import { CareerEmptyState, FieldChip, FieldTile } from './shared'
import { cn } from '@/lib/utils'

interface InterestsViewProps {
  onOpen: (career: CareerEntry) => void
}

/** The chips (of those chosen) that point at a career's field. */
function chipsForField(chosen: string[], field: CareerField): string[] {
  return chosen.filter((chip) => (INTEREST_FIELDS[chip] ?? []).includes(field))
}

function joinChips(chips: string[]): string {
  if (chips.length === 0) return ''
  if (chips.length === 1) return `“${chips[0]}”`
  return `${chips.slice(0, -1).map((c) => `“${c}”`).join(', ')} and “${chips[chips.length - 1]}”`
}

export function InterestsView({ onOpen }: InterestsViewProps) {
  const interests = useStudentCareerStore((s) => s.interests)
  const toggleInterest = useStudentCareerStore((s) => s.toggleInterest)

  const fields = useMemo(() => fieldsOfInterests(interests), [interests])

  const suggestions = useMemo(() => {
    if (interests.length === 0) return []
    return CAREER_CATALOG
      .filter((c) => fields.includes(c.field))
      .map((career) => ({ career, chips: chipsForField(interests, career.field) }))
  }, [interests, fields])

  function handleToggle(chip: string) {
    const isChosen = interests.includes(chip)
    if (!isChosen && interests.length >= MAX_INTERESTS) {
      toast(`You can pick up to ${MAX_INTERESTS} interests`, {
        description: 'Remove one first to add another.',
      })
      return
    }
    const changed = toggleInterest(chip)
    if (!changed) return
    if (isChosen) {
      toast(`“${chip}” removed`, { description: 'Your career ideas will update.' })
    } else {
      toast.success(`“${chip}” added`, {
        description: 'See the careers this interest points to below.',
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* The picker */}
      <section aria-labelledby="interests-picker-heading" className="space-y-2.5">
        <SectionLabel hint={`${interests.length} of ${MAX_INTERESTS} chosen`}>
          <span id="interests-picker-heading">What do you enjoy?</span>
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {INTEREST_CHIPS.map((chip) => {
            const chosen = interests.includes(chip)
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleToggle(chip)}
                aria-pressed={chosen}
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:py-1.5',
                  chosen
                    ? 'border-violet-500/40 bg-violet-500/[0.09] text-violet-700 dark:text-violet-300'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {chosen && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />}
                {chip}
              </button>
            )
          })}
        </div>
      </section>

      {interests.length === 0 ? (
        <GlassCard hover={false} className="on-card">
          <CareerEmptyState
            icon={Lightbulb}
            title="Pick a few things you enjoy to see ideas."
            note="Your choices stay yours — change them any time."
          />
        </GlassCard>
      ) : (
        <>
          {/* The live mapping — chip → interest areas */}
          <section aria-labelledby="interest-mapping-heading" className="space-y-2.5">
            <SectionLabel hint={`${interests.length} ${interests.length === 1 ? 'interest' : 'interests'}`}>
              <span id="interest-mapping-heading">What your interests point to</span>
            </SectionLabel>
            <GlassCard hover={false} className="on-card divide-y divide-border/60">
              {interests.map((chip) => {
                const chipFields = INTEREST_FIELDS[chip] ?? []
                return (
                  <div key={chip} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-4 py-3">
                    <span className="text-[13px] font-semibold text-foreground">{chip}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                    <span className="flex flex-wrap items-center gap-1.5">
                      {chipFields.map((f) => (
                        <FieldChip key={f} field={f} />
                      ))}
                    </span>
                  </div>
                )
              })}
            </GlassCard>
          </section>

          {/* Careers you might like — with the WHY line */}
          <section aria-labelledby="interest-careers-heading" className="space-y-2.5">
            <SectionLabel hint={`${suggestions.length} ${suggestions.length === 1 ? 'career' : 'careers'}`}>
              <span id="interest-careers-heading">Careers you might like</span>
            </SectionLabel>
            <div className="space-y-2">
              {suggestions.map(({ career, chips }, i) => (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
                >
                  <GlassCard className="on-card flex items-center gap-3 p-3 sm:p-4">
                    <FieldTile field={career.field} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{career.title}</h3>
                        <FieldChip field={career.field} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Because you picked {joinChips(chips)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpen(career)}
                      className="ml-auto inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
