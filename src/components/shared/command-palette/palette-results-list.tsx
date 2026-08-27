'use client'

import { Search, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResultItem } from '@/lib/search-service'
import { renderItemIcon, getBadgeStyle } from './utils'

// Highlights case-insensitive query matches inside text with a soft primary tint
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/15 text-primary rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

interface PaletteResultsListProps {
  query: string
  groupedResults: [string, SearchResultItem[]][]
  systemActions: SearchResultItem[]
  active: number
  setActive: (n: number | ((a: number) => number)) => void
  handleSelect: (item: SearchResultItem) => void
}

export function PaletteResultsList({
  query,
  groupedResults,
  systemActions,
  active,
  setActive,
  handleSelect,
}: PaletteResultsListProps) {
  let flatCounter = -1

  return (
    <div className="space-y-3">
      {groupedResults.length === 0 && systemActions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-2">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">No matches for "{query}"</p>
          <p className="text-[11px] text-muted-foreground max-w-xs mt-0.5">
            Try searching by name, roll number, subject, class name, exam title, or fee status.
          </p>
        </div>
      ) : (
        <>
          {groupedResults.map(([groupName, groupItems]) => (
            <div key={groupName} className="space-y-0.5">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                {groupName}
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-normal">
                  {groupItems.length}
                </span>
              </p>
              {groupItems.map((item) => {
                flatCounter++
                const idx = flatCounter
                const isActive = idx === active

                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    onMouseMove={() => setActive(idx)}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all border border-transparent',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium border-primary/20 shadow-xs'
                        : 'hover:bg-accent/60 text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border border-border/50',
                        isActive ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted/80 text-muted-foreground'
                      )}
                    >
                      {renderItemIcon(item.iconName)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-xs text-foreground">
                          <HighlightMatch text={item.title} query={query} />
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              'shrink-0 rounded-full border px-2 py-0.2 text-[9px] font-semibold',
                              getBadgeStyle(item.badgeVariant)
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        <HighlightMatch text={item.subtitle} query={query} />
                      </p>
                    </div>

                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {/* System Actions if matched */}
          {systemActions.length > 0 && (
            <div className="space-y-0.5 pt-1 border-t border-border/50">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Settings & System
              </p>
              {systemActions.map((item) => {
                flatCounter++
                const idx = flatCounter
                const isActive = idx === active
                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    onMouseMove={() => setActive(idx)}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all',
                      isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent/60 text-foreground'
                    )}
                  >
                    <span className={cn('flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground', isActive && 'bg-primary/15 text-primary')}>
                      {renderItemIcon(item.iconName)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-xs text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
