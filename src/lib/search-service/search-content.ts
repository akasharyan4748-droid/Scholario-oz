// Content-domain search: notices/announcements and library books.
// Role-aware (L2D spec §50/§78 + Teacher Workspace cleanup §7): the mock
// "resources" block is GONE (the real learning search is server-side in
// /api/search + the Learning module's own search); library books surface
// ONLY for the Principal (the sole role with an active Library module —
// the Teacher "School Library" module was removed in the cleanup pass,
// and the student Library module is retired); notices navigate students
// to their Notices module key instead of the staff 'communication' surface.

import { libraryBooks, notifications } from '@/lib/mock/operations'
import type { SearchResultItem } from './types'

type Role = 'principal' | 'teacher' | 'student' | 'superadmin' | 'parent'

export function searchContent(q: string, role: Role = 'principal'): SearchResultItem[] {
  const isStudent = role === 'student'
  const matches = (text: string, kw: string = ''): boolean => {
    if (!text) return false
    const lower = text.toLowerCase()
    return lower.includes(q) || (kw ? kw.toLowerCase().includes(q) : false)
  }

  const results: SearchResultItem[] = []

  // NOTICES & ANNOUNCEMENTS SEARCH
  notifications.forEach((n) => {
    if (matches(n.title) || matches(n.description)) {
      results.push({
        id: `ntf-${n.id}`,
        title: n.title,
        subtitle: `${n.description} · ${n.time}`,
        category: 'Notices & Announcements',
        type: 'notice',
        moduleKey: isStudent ? 'notices' : 'communication',
        iconName: 'Megaphone',
        badge: n.unread ? 'New' : 'Notice',
        badgeVariant: n.unread ? 'destructive' : 'outline',
        keywords: `${n.title} notice circular communication broadcast`,
      })
    }
  })

  // LIBRARY SEARCH — Principal only (the only role with an active Library
  // module; everyone else would get dead-route search results).
  if (role === 'principal') {
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
  }

  return results
}
