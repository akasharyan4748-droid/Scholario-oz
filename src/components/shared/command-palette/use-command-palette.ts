'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/lib/store/auth-store'
import { useTheme } from '@/lib/store/theme-store'
import type { NavGroup } from '@/components/shell/app-shell'
import {
  searchEntities,
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  type SearchResultItem,
} from '@/lib/search-service'

export interface UseCommandPaletteArgs {
  open: boolean
  onOpenChange: (o: boolean) => void
  groups: NavGroup[]
  role: 'principal' | 'teacher' | 'student' | 'superadmin'
  onNavigate: (key: string) => void
}

export interface UseCommandPaletteReturn {
  query: string
  setQuery: (q: string) => void
  active: number
  setActive: (n: number | ((a: number) => number)) => void
  recentList: SearchResultItem[]
  setRecentList: (items: SearchResultItem[]) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLDivElement | null>
  searchResults: SearchResultItem[]
  groupedResults: [string, SearchResultItem[]][]
  flatResults: SearchResultItem[]
  systemActions: SearchResultItem[]
  handleSelect: (item: SearchResultItem) => void
  refreshRecent: () => void
  removeRecent: (id: string) => void
  clearRecent: () => void
}

export function useCommandPalette({
  open,
  onOpenChange,
  groups,
  role,
  onNavigate,
}: UseCommandPaletteArgs): UseCommandPaletteReturn {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [recentList, setRecentList] = useState<SearchResultItem[]>([])
  const { switchTo, logout } = useAuth()
  const { toggle: toggleTheme } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load recent searches when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setRecentList(getRecentSearches())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset active index when query changes
  useEffect(() => setActive(0), [query])

  // Real-time search entities matching
  const searchResults = useMemo(() => {
    return searchEntities(query, role, groups)
  }, [query, role, groups])

  // Group search results by category
  const groupedResults = useMemo(() => {
    const map = new Map<string, SearchResultItem[]>()
    searchResults.forEach((item) => {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    })
    return Array.from(map.entries())
  }, [searchResults])

  // Flattened results for keyboard navigation
  const flatResults = useMemo(() => {
    return searchResults
  }, [searchResults])

  // System actions (Dark mode, Switch role, Logout) when query matches 'theme', 'switch', 'logout'
  const systemActions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const actions: SearchResultItem[] = []

    if ('theme dark light appearance mode'.includes(q)) {
      actions.push({
        id: 'act-theme',
        title: 'Toggle dark / light appearance',
        subtitle: 'Switch application color theme',
        category: 'Settings & System',
        type: 'setting',
        moduleKey: 'settings',
        iconName: 'Settings',
        badge: 'Appearance',
      })
    }

    if (role === 'principal' && 'switch login role teacher student demo'.includes(q)) {
      actions.push({
        id: 'act-switch-teacher',
        title: 'Switch to Teacher Portal',
        subtitle: 'Preview system as senior faculty',
        category: 'Settings & System',
        type: 'setting',
        moduleKey: 'dashboard',
        iconName: 'BookOpen',
        badge: 'Role Demo',
      })
      actions.push({
        id: 'act-switch-student',
        title: 'Switch to Student Portal',
        subtitle: 'Preview system as student',
        category: 'Settings & System',
        type: 'setting',
        moduleKey: 'dashboard',
        iconName: 'User',
        badge: 'Role Demo',
      })
    }

    if ('logout signout exit session'.includes(q)) {
      actions.push({
        id: 'act-logout',
        title: 'Sign out of SCHOLARIO-OS',
        subtitle: 'Log out of administrative session',
        category: 'Settings & System',
        type: 'setting',
        moduleKey: 'logout',
        iconName: 'LogOut',
        badge: 'Session',
        badgeVariant: 'destructive',
      })
    }

    return actions
  }, [query, role])

  // Handle item selection
  const handleSelect = (item: SearchResultItem) => {
    if (item.id === 'act-theme') {
      toggleTheme()
    } else if (item.id === 'act-switch-teacher') {
      switchTo('teacher')
    } else if (item.id === 'act-switch-student') {
      switchTo('student')
    } else if (item.id === 'act-logout') {
      logout()
    } else {
      saveRecentSearch(item)
      onNavigate(item.moduleKey)
    }
    onOpenChange(false)
  }

  // Keyboard navigation handler
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (query.trim()) {
          setActive((a) => Math.min(a + 1, flatResults.length + systemActions.length - 1))
        } else if (recentList.length > 0) {
          setActive((a) => Math.min(a + 1, recentList.length - 1))
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (query.trim()) {
          const allItems = [...flatResults, ...systemActions]
          const target = allItems[active]
          if (target) handleSelect(target)
        } else if (recentList[active]) {
          handleSelect(recentList[active])
        }
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, query, flatResults, systemActions, recentList, active, onOpenChange])

  // Scroll active element into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const refreshRecent = () => setRecentList(getRecentSearches())
  const removeRecent = (id: string) => {
    const updated = removeRecentSearch(id)
    setRecentList(updated)
  }
  const clearRecent = () => {
    clearRecentSearches()
    setRecentList([])
  }

  return {
    query,
    setQuery,
    active,
    setActive,
    recentList,
    setRecentList,
    inputRef,
    listRef,
    searchResults,
    groupedResults,
    flatResults,
    systemActions,
    handleSelect,
    refreshRecent,
    removeRecent,
    clearRecent,
  }
}
