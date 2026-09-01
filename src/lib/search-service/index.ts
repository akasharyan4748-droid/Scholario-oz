/* ============================================================
   search-service/index.ts
   Barrel re-export for the global search service.

   Backward-compatibility entry point: every named export that
   used to live in the monolithic `search-service.ts` is
   re-exported here so existing imports like:
       import { searchEntities, getRecentSearches, type SearchResultItem } from '@/lib/search-service'
   continue to resolve unchanged.
   ============================================================ */

export type { SearchResultItem } from './types'
export {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from './recent-searches'
export { searchEntities } from './search-entities'
