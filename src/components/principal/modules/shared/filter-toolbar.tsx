'use client'

/**
 * FilterToolbar — THE reusable responsive filter system (SaaS-STAGE-1).
 *
 * Pattern rule for the whole application: whenever a surface needs more
 * than ~3 facets, desktop (lg+) renders search + selects inline; on
 * tablet/mobile the selects collapse behind ONE compact "Filters" button
 * (with an active-count badge) that opens a sheet containing all facets.
 * Consumers keep full control of filter state — this component is purely
 * presentational, so the same config object can drive both layouts.
 *
 * Consumers: Transactions ledger (first), then any module whose inline
 * filter row would wrap/overflow on smaller widths.
 */

import { useState, type ReactNode } from 'react'
import { Search, SlidersHorizontal, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface FilterSelectOption {
  value: string
  label: string
}

export interface FilterSelectConfig {
  id: string
  value: string
  onChange: (value: string) => void
  /** "All Classes"-style trigger placeholder */
  placeholder: string
  options: FilterSelectOption[]
  /** desktop trigger width (default w-[130px] xl:w-[140px]) */
  widthClass?: string
  /** sr-only/visible label shown above the select inside the mobile sheet */
  label: string
}

interface FilterToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filters: FilterSelectConfig[]
  /** number of currently active facet filters (drives the badges) */
  activeCount: number
  onReset?: () => void
  /** right-aligned actions (Export, etc.) — always visible on all sizes */
  actions?: ReactNode
  className?: string
}

export function FilterToolbar({
  search, onSearchChange, searchPlaceholder = 'Search…',
  filters, activeCount, onReset, actions, className,
}: FilterToolbarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const selects = filters.map((f) => (
    <Select key={f.id} value={f.value} onValueChange={f.onChange}>
      <SelectTrigger className={cn('h-9 text-xs shrink-0', f.widthClass ?? 'w-[130px] xl:w-[140px]')}>
        <SelectValue placeholder={f.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {f.options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  ))

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* ── Desktop (lg+): everything inline, as before ── */}
      <div className="hidden lg:flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="pl-9 h-9 text-xs" />
          </div>
          {selects}
          {activeCount > 0 && onReset && (
            <>
              <Badge variant="secondary" className="text-[11px] font-semibold tabular-nums">
                {activeCount} active
              </Badge>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={onReset}>
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            </>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* ── Mobile / tablet (< lg): search row + ONE compact Filters button.
          Never show every filter inline — the sheet holds them all. ── */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="pl-9 h-9 text-xs" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-9 text-xs gap-1.5 shrink-0', activeCount > 0 && 'border-primary/40 text-primary')}
          onClick={() => setSheetOpen(true)}
          aria-label={`Filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* ── Mobile filter sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xs flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
            </SheetTitle>
            <SheetDescription className="text-[11px]">
              {activeCount > 0 ? `${activeCount} filter${activeCount === 1 ? '' : 's'} active` : 'No filters applied'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
            {filters.map((f) => (
              <div key={f.id}>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">{f.label}</p>
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder={f.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-card px-4 py-3 flex items-center gap-2">
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={onReset}
                disabled={activeCount === 0}
              >
                <X className="h-3.5 w-3.5" /> Reset all
              </Button>
            )}
            <div className="flex-1" />
            <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setSheetOpen(false)}>
              <Check className="h-3.5 w-3.5" /> Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
