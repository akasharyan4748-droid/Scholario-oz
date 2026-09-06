'use client'

/**
 * TypeFilters — the event-type filter row (Exam / Event / Holiday /
 * Meeting / Competition / Cultural / General).
 *
 * The chips double as the color legend (each carries its type dot), so
 * no separate legend is rendered anywhere. States are instantly
 * readable:
 *   - active  → glass pill (frosted surface + hairline border + solid
 *               dot + live count)
 *   - inactive → fades back (transparent bg, dimmed dot, no count)
 * A compact "Show all" reset appears only while a partial/empty filter
 * is active. On phones the row scrolls horizontally (no wrap, no
 * overflow) with soft edge fades.
 */

import { cn } from '@/lib/utils'
import { ALL_TYPES, TYPE_TOKENS, typeColor } from './data'

export interface TypeFiltersProps {
  filterTypes: string[]
  onToggle: (t: string) => void
  /** Live per-type counts for the visible month (unfiltered). */
  counts: Record<string, number>
  onShowAll: () => void
}

export function TypeFilters({ filterTypes, onToggle, counts, onShowAll }: TypeFiltersProps) {
  const allOn = filterTypes.length === ALL_TYPES.length
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap',
        // Soft edge fades while the row scrolls on phones
        'max-sm:[mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]',
      )}
      role="group"
      aria-label="Filter events by type"
    >
      {ALL_TYPES.map((t) => {
        const active = filterTypes.includes(t)
        const count = counts[t] ?? 0
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            aria-pressed={active}
            className={cn(
              'flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.97]',
              active
                ? 'cal-glass-chip text-foreground'
                : 'border border-transparent bg-transparent text-muted-foreground/55 hover:bg-foreground/[0.05] hover:text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full transition-opacity',
                !active && 'opacity-30',
              )}
              style={{ background: typeColor(t) }}
              aria-hidden
            />
            {t}
            {active && count > 0 && (
              <span
                className={cn(
                  'ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none tabular-nums',
                  (TYPE_TOKENS[t] ?? TYPE_TOKENS.General).badge,
                  (TYPE_TOKENS[t] ?? TYPE_TOKENS.General).text,
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}

      {/* Reset — only while filtered */}
      {!allOn && (
        <button
          type="button"
          onClick={onShowAll}
          className="h-7 shrink-0 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Show all
        </button>
      )}

      {allOn && (
        <span className="ml-1 hidden shrink-0 text-[11px] tabular-nums text-muted-foreground/70 sm:inline">
          {total} this month
        </span>
      )}
    </div>
  )
}
