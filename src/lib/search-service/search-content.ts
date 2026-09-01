// Content-domain search: notices/announcements and library/resources.

import { libraryBooks, notifications } from '@/lib/mock/operations'
import { resources } from '@/lib/mock/resources'
import type { SearchResultItem } from './types'

export function searchContent(q: string): SearchResultItem[] {
  const matches = (text: string, kw: string = ''): boolean => {
    if (!text) return false
    const lower = text.toLowerCase()
    return lower.includes(q) || (kw ? kw.toLowerCase().includes(q) : false)
  }

  const results: SearchResultItem[] = []

  // 6. NOTICES & ANNOUNCEMENTS SEARCH
  notifications.forEach((n) => {
    if (matches(n.title) || matches(n.description)) {
      results.push({
        id: `ntf-${n.id}`,
        title: n.title,
        subtitle: `${n.description} · ${n.time}`,
        category: 'Notices & Announcements',
        type: 'notice',
        moduleKey: 'communication',
        iconName: 'Megaphone',
        badge: n.unread ? 'New' : 'Notice',
        badgeVariant: n.unread ? 'destructive' : 'outline',
        keywords: `${n.title} notice circular communication broadcast`,
      })
    }
  })

  // 7. LIBRARY & RESOURCES SEARCH
  libraryBooks.forEach((bk) => {
    if (matches(bk.title) || matches(bk.author) || matches(bk.category) || matches(bk.isbn)) {
      results.push({
        id: `bk-${bk.id}`,
        title: bk.title,
        subtitle: `By ${bk.author} · Category: ${bk.category} · Available: ${bk.available}/${bk.copies}`,
        category: 'Library & Resources',
        type: 'book',
        moduleKey: 'library',
        iconName: 'BookMarked',
        badge: `${bk.available} Available`,
        badgeVariant: bk.available > 0 ? 'success' : 'destructive',
        keywords: `${bk.title} ${bk.author} ${bk.category} book library ISBN`,
      })
    }
  })

  resources.forEach((res) => {
    if (matches(res.title) || matches(res.subject) || matches(res.description)) {
      results.push({
        id: `res-${res.id}`,
        title: res.title,
        subtitle: `${res.subject} · ${res.type.toUpperCase()} · By ${res.uploadedBy}`,
        category: 'Library & Resources',
        type: 'book',
        moduleKey: 'library',
        iconName: 'BookOpen',
        badge: res.type,
        badgeVariant: 'info',
        keywords: `${res.title} ${res.subject} resource video notes worksheet study material`,
      })
    }
  })

  return results
}
