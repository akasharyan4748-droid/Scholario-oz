// Features & Pages domain search: matches the runtime navigation
// groups so users can jump to any registered module by typing.

import type { NavGroup } from '@/components/shell/app-shell'
import type { SearchResultItem } from './types'

export function searchFeatures(q: string, groups: NavGroup[] = []): SearchResultItem[] {
  const matches = (text: string, kw: string = ''): boolean => {
    if (!text) return false
    const lower = text.toLowerCase()
    return lower.includes(q) || (kw ? kw.toLowerCase().includes(q) : false)
  }

  const results: SearchResultItem[] = []

  // 9. FEATURES & PAGES SEARCH (Dynamic search match ONLY when query is typed!)
  if (groups && groups.length > 0) {
    groups.forEach((g) => {
      g.items.forEach((item) => {
        const title = item.label
        const subtitle = `Navigate to ${g.label} → ${item.label}`
        const kw = `${g.label} ${item.label} page module feature dashboard`
        if (matches(title) || matches(g.label) || matches(kw)) {
          results.push({
            id: `nav-${item.key}`,
            title: item.label,
            subtitle,
            category: 'Features & Pages',
            type: 'feature',
            moduleKey: item.key,
            iconName: 'Sparkles',
            badge: g.label,
            badgeVariant: 'default',
            keywords: kw,
          })
        }
      })
    })
  }

  return results
}
