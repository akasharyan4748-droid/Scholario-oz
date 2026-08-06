/**
 * Main Search Indexer & Matcher
 * Executes multi-entity search tailored to user role and query string.
 *
 * Delegates to per-domain searchers (people, academic, content, fees,
 * features) and merges + sorts the combined result set by match score.
 */
import type { NavGroup } from '@/components/shell/app-shell'
import type { SearchResultItem } from './types'
import { getScore } from './helpers'
import { searchPeople } from './search-people'
import { searchAcademic } from './search-academic'
import { searchContent } from './search-content'
import { searchFees } from './search-fees'
import { searchFeatures } from './search-features'

export function searchEntities(
  query: string,
  role: 'principal' | 'teacher' | 'student' | 'superadmin' | 'parent' = 'principal',
  groups: NavGroup[] = []
): SearchResultItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: SearchResultItem[] = [
    ...searchPeople(q, role),
    ...searchAcademic(q),
    ...searchContent(q),
    ...searchFees(q),
    ...searchFeatures(q, groups),
  ]

  // Sort by score
  results.sort((a, b) => getScore(b.title, b.subtitle, q) - getScore(a.title, a.subtitle, q))

  return results
}
