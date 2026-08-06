'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const INDIAN_STATES = [
  'Uttar Pradesh',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

interface SearchableStateSelectProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  placeholder?: string
}

export function SearchableStateSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select State',
}: SearchableStateSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredStates = useMemo(() => {
    if (!search.trim()) return INDIAN_STATES
    return INDIAN_STATES.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20 text-left h-10',
          disabled && 'opacity-60 bg-muted/50 cursor-not-allowed'
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-popover shadow-xl overflow-hidden p-2 space-y-2 max-w-full"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search state..."
                  autoFocus
                  className="w-full rounded-lg border border-border bg-muted/40 pl-8 pr-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-border/20">
                {filteredStates.length === 0 ? (
                  <p className="p-3 text-center text-xs text-muted-foreground">No matching states found</p>
                ) : (
                  filteredStates.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onChange(st)
                        setIsOpen(false)
                        setSearch('')
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors hover:bg-accent rounded-lg',
                        st === value && 'font-bold text-primary bg-primary/10'
                      )}
                    >
                      <span>{st}</span>
                      {st === value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
