'use client'

/**
 * SearchFilterBar — universal search + filter component for the entire ERP.
 *
 * Provides a consistent search input, optional dropdown filters, and
 * optional action buttons in a single responsive row.
 *
 * Usage:
 *   <SearchFilterBar
 *     search={search}
 *     onSearchChange={setSearch}
 *     placeholder="Search name, ID…"
 *     filters={[
 *       { value: 'all', label: 'All Classes', options: [...] },
 *     ]}
 *     onFilterChange={(id, val) => ...}
 *     actions={<Button>Add Student</Button>}
 *   />
 */

import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  options: FilterOption[]
  width?: string
}

interface SearchFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  placeholder?: string
  filters?: FilterConfig[]
  actions?: ReactNode
  className?: string
}

export function SearchFilterBar({
  search, onSearchChange, placeholder = 'Search…',
  filters = [], actions, className,
}: SearchFilterBarProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between', className)}>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-1 min-w-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        {filters.map((f) => (
          <Select key={f.id} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className={cn('h-9 text-xs', f.width || 'w-[140px]')}>
              <SelectValue placeholder={f.placeholder || 'All'} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      {/* Actions */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
