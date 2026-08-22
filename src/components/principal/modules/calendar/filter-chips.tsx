'use client'

/**
 * FilterChips — interactive event-type filter row.
 *
 * Replaces the static legend that used to live at the bottom of the
 * calendar grid (audit fix #6 — keep only the interactive chips, drop the
 * duplicate static legend). Each chip shows the live count of visible
 * events of that type in the current month so the user can see at a
 * glance what's filtered out.
 *
 * Active chip: emerald-tinted background + emerald border.
 * Inactive chip: muted card background, hover-lift.
 * Per-type colored dot uses the canonical TYPE_COLORS so the chip and the
 * grid dots share the same legend.
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ALL_TYPES, TYPE_COLORS } from './data'

interface Props {
  filterTypes: string[]
  onToggle: (t: string) => void
  /** Per-type live counts for the visible month (excluding filtered-out types). */
  counts?: Record<string, number>
  /** Total events in the visible month (for the "All / Clear" affordance). */
  totalVisible?: number
  onAll?: () => void
  onNone?: () => void
}

export function FilterChips({ filterTypes, onToggle, counts, totalVisible, onAll, onNone }: Props) {
  const allOn = filterTypes.length === ALL_TYPES.length
  const noneOn = filterTypes.length === 0

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Select-all / clear affordance */}
      <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-border">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onAll}
          disabled={allOn}
          className={cn(
            'h-7 px-2 rounded-md text-[10px] font-medium transition-colors',
            allOn
              ? 'text-muted-foreground/40 cursor-default'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
          )}
        >
          All
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onNone}
          disabled={noneOn}
          className={cn(
            'h-7 px-2 rounded-md text-[10px] font-medium transition-colors',
            noneOn
              ? 'text-muted-foreground/40 cursor-default'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
          )}
        >
          Clear
        </motion.button>
      </div>

      {ALL_TYPES.map((t, i) => {
        const active = filterTypes.includes(t)
        const count = counts?.[t] ?? 0
        return (
          <motion.button
            key={t}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onToggle(t)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
              active
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card/40 border-border text-muted-foreground hover:bg-accent/40 hover:border-border/60',
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: TYPE_COLORS[t] }}
            />
            {t}
            {count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full text-[9px] font-bold tabular-nums',
                  active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {count}
              </span>
            )}
          </motion.button>
        )
      })}

      {/* Trailing summary count */}
      {typeof totalVisible === 'number' && (
        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
          {totalVisible} event{totalVisible === 1 ? '' : 's'} this month
        </span>
      )}
    </div>
  )
}
