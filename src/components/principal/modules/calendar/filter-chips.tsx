'use client'

import { ALL_TYPES, TYPE_COLORS } from './data'

interface Props {
  filterTypes: string[]
  onToggle: (t: string) => void
}

export function FilterChips({ filterTypes, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TYPES.map((t) => {
        const active = filterTypes.includes(t)
        return (
          <button
            key={t}
            onClick={() => onToggle(t)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card/40 border-border text-muted-foreground hover:bg-accent/40'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[t] }} />
            {t}
          </button>
        )
      })}
    </div>
  )
}
