'use client'

/**
 * results/assessment-selector — the one prominent control (gen 2 §3/§24).
 *
 * A refined wrap-safe selector (never a giant dropdown): published
 * assessments are selectable chips in publish order, the latest carries
 * a subtle LATEST tag, and upcoming assessments appear in their
 * chronological place as quiet "pending" chips so the student always
 * sees the full session shape. Wrapping (not scrolling) keeps iPad and
 * mobile safe from horizontal overflow at any assessment count.
 */

import { Check, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssessmentDef } from '@/lib/store/student-results-store'

interface AssessmentSelectorProps {
  published: AssessmentDef[]
  upcoming: AssessmentDef[]
  selectedId: string
  onSelect: (id: string) => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shortDate(iso: string): string {
  const m = Number(iso.slice(5, 7)) - 1
  return `${MONTHS[m] ?? ''} ${Number(iso.slice(8, 10))}`
}

export function AssessmentSelector({ published, upcoming, selectedId, onSelect }: AssessmentSelectorProps) {
  // Interleave upcoming into chronological position (by conducted date)
  // while keeping published first-class and clickable.
  const latestId = published.length > 0 ? published[published.length - 1].id : null
  const items: { def: AssessmentDef; published: boolean }[] = [
    ...published.map((def) => ({ def, published: true })),
    ...upcoming.map((def) => ({ def, published: false })),
  ].sort((a, b) => (a.def.conductedFrom < b.def.conductedFrom ? -1 : 1))

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Select assessment">
      {items.map(({ def, published }) => {
        const isSelected = def.id === selectedId
        const isLatest = def.id === latestId
        return (
          <button
            key={def.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            disabled={!published}
            onClick={() => onSelect(def.id)}
            title={
              published
                ? `Result published ${shortDate(def.publishDate ?? def.conductedTo)}`
                : def.expectedBy
                  ? `Result expected after ${def.expectedBy}`
                  : 'Result not published yet'
            }
            className={cn(
              'group relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              published
                ? 'cursor-pointer'
                : 'cursor-default border-dashed border-border/70 bg-transparent text-muted-foreground/70',
              published && !isSelected && 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground',
              isSelected && 'border-primary/40 bg-primary/[0.09] font-semibold text-foreground shadow-2xs'
            )}
          >
            {published ? (
              <Check
                className={cn('h-3.5 w-3.5 shrink-0 transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground/50')}
                aria-hidden
              />
            ) : (
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
            )}
            <span className="min-w-0 truncate">{def.name}</span>
            <span className={cn('shrink-0 text-[10px] tabular-nums', isSelected ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
              {shortDate(def.conductedTo)}
            </span>
            {isLatest && (
              <span className="absolute -top-2 left-2.5 rounded-full border border-primary/30 bg-primary px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                Latest
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
