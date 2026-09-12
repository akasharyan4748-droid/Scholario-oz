'use client'

/**
 * results/history — the ACADEMIC TIMELINE (§16/§17, gen 2).
 *
 * Result history reads like a story, not a list: a vertical timeline
 * where every published assessment is a coloured node (its own assessment
 * colour), the latest carries a subtle LATEST indicator, and upcoming
 * assessments continue the line in clearly-muted styling (clock icon,
 * dashed connector, "Result pending") so a future exam can never be
 * mistaken for a published result. Clicking a published node selects that
 * result in the page above — no round-trip.
 */

import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  fmtPct,
  totalsOf,
  resultFor,
  type AssessmentDef,
  type AssessmentResult,
  type GradeBand,
  gradeFor,
  type AssessmentType,
} from '@/lib/store/student-results-store'
import { gradeTone } from './grade-tone'
import { SectionLabel } from '../../shell/page-header'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shortDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
}

/** Assessment-type colour identity — one colour per assessment kind (§16). */
const TYPE_COLOR: Record<AssessmentType, { dot: string; ring: string; text: string }> = {
  'Unit Test': {
    dot: 'bg-sky-500',
    ring: 'ring-sky-500/25',
    text: 'text-sky-600 dark:text-sky-400',
  },
  'Mid Term': {
    dot: 'bg-violet-500',
    ring: 'ring-violet-500/25',
    text: 'text-violet-600 dark:text-violet-400',
  },
  Final: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
  },
}

interface HistoryProps {
  published: AssessmentDef[]
  upcoming: AssessmentDef[]
  results: AssessmentResult[]
  gradeScale: GradeBand[]
  selectedId: string
  onSelect: (id: string) => void
}

export function History({ published, upcoming, results, gradeScale, selectedId, onSelect }: HistoryProps) {
  // The story reads forward: oldest → latest → what's coming next.
  const story = [
    ...published.map((a) => ({ def: a, published: true as const })),
    ...upcoming.map((a) => ({ def: a, published: false as const })),
  ]
  const latestId = published.length > 0 ? published[published.length - 1].id : null

  return (
    <section aria-label="Result history">
      <SectionLabel hint={`${published.length} published`}>Result History</SectionLabel>

      <ol className="relative mt-3 space-y-1">
        {/* The timeline spine */}
        <span className="absolute bottom-3 left-[1.05rem] top-3 w-px bg-border/80" aria-hidden />

        {story.map(({ def, published: isPublished }) => {
          const r = isPublished ? resultFor(results, def.id) : null
          const t = r ? totalsOf(r) : null
          const grade = t ? gradeFor(t.pct, gradeScale) : null
          const tone = grade ? gradeTone(grade) : null
          const color = TYPE_COLOR[def.type]
          const isActive = def.id === selectedId
          const isLatest = def.id === latestId

          return (
            <li key={def.id} className="relative pl-11">
              {/* The node */}
              <span
                className={cn(
                  'absolute left-2.5 top-1/2 flex h-[1.4rem] w-[1.4rem] -translate-y-1/2 items-center justify-center rounded-full bg-background ring-4',
                  isPublished ? color.ring : 'ring-border/40',
                )}
                aria-hidden
              >
                {isPublished ? (
                  <span className={cn('h-2.5 w-2.5 rounded-full', color.dot, isActive && 'h-3 w-3')} />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted-foreground/50 bg-transparent" />
                )}
              </span>

              {isPublished ? (
                <button
                  type="button"
                  onClick={() => onSelect(def.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive ? 'bg-primary/[0.07] shadow-2xs' : 'hover:bg-muted/40',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className={cn('truncate text-sm', isActive ? 'font-bold text-foreground' : 'font-semibold text-foreground/90')}>
                        {def.name}
                      </span>
                      {isLatest && (
                        <span className="rounded-full border border-primary/30 bg-primary/[0.08] px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                          Latest
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600/70" aria-hidden />
                      Published {shortDate(def.publishDate!)}
                    </span>
                  </span>
                  {t && (
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span className="text-sm font-bold tabular-nums text-foreground">{fmtPct(t.pct)}%</span>
                      {grade && tone && (
                        <span className={cn('rounded-lg border px-2 py-0.5 text-[11px] font-bold tabular-nums', tone.badge)}>{grade}</span>
                      )}
                    </span>
                  )}
                </button>
              ) : (
                /* Upcoming — muted, dashed, unmistakably not a result yet (§17) */
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 px-3 py-2.5" aria-label={`${def.name}: result pending`}>
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">{def.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                      <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
                      {def.expectedBy ? `Expected ${def.expectedBy}` : 'Result pending'}
                    </p>
                  </span>
                  <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Pending
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
