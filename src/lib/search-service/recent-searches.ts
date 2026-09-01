// localStorage-backed recent search history.
// Persists the user's last 8 selected search items so the command
// palette can show them when the input is empty.

import type { SearchResultItem } from './types'

// Key for local storage persistence
export const RECENT_SEARCHES_KEY = 'scholario_recent_searches_v2'

export function getRecentSearches(): SearchResultItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SearchResultItem[]
  } catch (err) {
    console.error('Failed to parse recent searches:', err)
    return []
  }
}

export function saveRecentSearch(item: SearchResultItem): SearchResultItem[] {
  if (typeof window === 'undefined') return []
  try {
    const existing = getRecentSearches()
    const filtered = existing.filter((i) => i.id !== item.id)
    const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 8)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save recent search:', err)
    return []
  }
}

export function removeRecentSearch(id: string): SearchResultItem[] {
  if (typeof window === 'undefined') return []
  try {
    const existing = getRecentSearches()
    const updated = existing.filter((i) => i.id !== id)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to remove recent search:', err)
    return []
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch (err) {
    console.error('Failed to clear recent searches:', err)
  }
}
