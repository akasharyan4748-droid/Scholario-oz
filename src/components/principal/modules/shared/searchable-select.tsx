'use client'

/**
 * SearchableSelect — universal SCHOLARIO entity picker.
 *
 * Used for selecting teachers, subjects, sections, classes, or any other
 * entity where the user needs to search a list of options.
 *
 * Canonical patterns honoured (audited from Admissions + Teachers):
 *   - Trigger button: chip-style when selected (avatar + name + meta),
 *     placeholder when vacant (h-9 px-3, muted text)
 *   - PopoverContent: w-72 p-0 with `bg-card` surface (dark-mode safe)
 *   - Search input: `pl-8 h-8 text-xs bg-card` with `Search` icon
 *   - Option row: avatar tile + name + meta, hover:bg-muted/40
 *   - Selected indicator: subtle "Selected" pill (no inline × destructive)
 *
 * Brief section 23: "polished native enterprise control, not a random popover"
 * Brief section 24: cursor / focus stability — the search Input has a stable
 *   React key derived from `pickerId`, so it is NEVER recreated during
 *   rerenders. Its value is fully controlled by parent state.
 * Brief section 25: reusable — pass any Option shape via generics.
 */
import { useState, useMemo, type ReactNode } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  /** Stable identifier (teacher ID, subject code, etc.) */
  id: string
  /** Primary display name */
  label: string
  /** Optional 2-3 letter avatar initials */
  avatar?: string
  /** Optional secondary metadata (e.g. "EMP-014 · Mathematics") */
  meta?: string
  /** Optional disabled flag (e.g. archived records) */
  disabled?: boolean
}

export interface SearchableSelectProps {
  /** Currently-selected option id (controlled). Empty string = vacant. */
  selectedId: string
  /** Called when the user picks an option from the dropdown. */
  onSelect: (id: string) => void
  /** Placeholder text shown when no option is selected. */
  placeholder: string
  /** Full list of selectable options (already filtered by caller if needed). */
  options: SearchableSelectOption[]
  /** Optional id to keep the search Input stable across rerenders. */
  pickerId?: string
  /** Optional className applied to the trigger wrapper. */
  className?: string
  /** Optional width of the popover content. Default w-72. */
  popoverWidth?: string
  /** Optional render for the empty-state (no results). */
  emptyState?: ReactNode
}

export function SearchableSelect({
  selectedId,
  onSelect,
  placeholder,
  options,
  pickerId = 'default',
  className,
  popoverWidth = 'w-72',
  emptyState,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = useMemo(
    () => options.find((o) => o.id === selectedId),
    [options, selectedId]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.meta || '').toLowerCase().includes(q)
    )
  }, [options, search])

  // Trigger button: chip-style when selected, placeholder when vacant.
  // Brief section 26: NO inline × destructive — clicking the chip opens the
  // dropdown so the user can pick another. Removal is handled by the caller
  // via an explicit Remove button + ConfirmDialog.
  const trigger = selected ? (
    <div className={cn(
      'flex items-center justify-between w-full gap-2 rounded-lg border border-border bg-card p-2 hover:border-primary/40 transition-colors text-left',
      className
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {selected.avatar && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
            {selected.avatar}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-tight">{selected.label}</p>
          {selected.meta && (
            <p className="text-[10px] text-muted-foreground leading-tight truncate">{selected.meta}</p>
          )}
        </div>
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </div>
  ) : (
    <div className={cn(
      'flex items-center justify-between w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:border-primary/40 transition-colors',
      className
    )}>
      <span>{placeholder}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </div>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="block w-full text-left">{trigger}</button>
      </PopoverTrigger>
      <PopoverContent className={cn(popoverWidth, 'p-0')} align="start" sideOffset={4}>
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              key={`search-input-${pickerId}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 h-8 text-xs bg-card"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
          {filtered.length === 0 ? (
            emptyState ?? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No results found.</p>
            )
          ) : filtered.slice(0, 50).map((o) => {
            const isSelected = o.id === selectedId
            return (
              <button
                key={o.id}
                type="button"
                disabled={o.disabled}
                onClick={() => { onSelect(o.id); setOpen(false); setSearch('') }}
                className={cn(
                  'w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-muted/40 transition-colors',
                  o.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                )}
              >
                {o.avatar && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
                    {o.avatar}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">{o.label}</p>
                  {o.meta && (
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">{o.meta}</p>
                  )}
                </div>
                {isSelected && (
                  <span className="text-[10px] text-emerald-600 font-medium shrink-0 inline-flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Selected
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
