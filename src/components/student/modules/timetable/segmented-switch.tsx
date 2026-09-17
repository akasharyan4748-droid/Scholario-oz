'use client'

/**
 * Student Timetable — SegmentedSwitch.
 *
 * The one control primitive shared by both switch surfaces:
 *   - MY CLASS | SCHOOL (the module's primary view switch)
 *   - BY DAY | FULL WEEK (the School view's scope switch)
 *
 * Premium but restrained: a single sliding active pill (Scholario green)
 * animated with a soft spring — no oversized buttons, no explanatory text.
 * ARIA tabs semantics + arrow-key navigation + visible focus ring.
 */
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  key: T
  label: string
  icon?: React.ElementType
}

export function SegmentedSwitch<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
  className,
}: {
  value: T
  options: SegmentedOption<T>[]
  onChange: (v: T) => void
  ariaLabel: string
  size?: 'md' | 'sm'
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const idx = options.findIndex((o) => o.key === value)
        if (idx === -1) return
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const next = (idx + dir + options.length) % options.length
        onChange(options[next].key)
        // Roving focus — move DOM focus to the newly active segment
        const btn = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]
        btn?.focus()
      }}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-2xs',
        className
      )}
    >
      {options.map(({ key, label, icon: Icon }) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors',
              'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              size === 'md' ? 'min-w-[104px] px-3.5 py-2 text-xs' : 'min-w-[86px] px-3 py-1.5 text-[11px]',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${ariaLabel}`}
                className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                aria-hidden
              />
            )}
            {Icon && <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden />}
            <span className="relative z-10">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
