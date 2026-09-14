'use client'

/**
 * Learning (L2D) — Overview tab: the student's academic home (spec §8/§52).
 * Search-first hero, Continue Learning, For You, Subjects, Recently
 * Opened, Saved — every section renders REAL data only and disappears
 * when it has none (spec §13/§42). One aggregate fetch
 * (GET /api/student/learning/overview) + a debounced cross-entity search
 * (GET /api/student/learning/search) + a subject drill-down
 * (overview?subjectId=). No big module title — the shell header is the
 * single WHERE-AM-I (spec §6).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, X, BookOpen, Layers, GraduationCap, Users, ListTodo, ArrowRight,
  AlertTriangle, RotateCcw, Compass, History, Bookmark as BookmarkIcon, Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { apiFetch, apiPost } from './api'
import { ResourceCard, ResourceRow, categoryMeta } from './resource-shared'
import { ResourceDetailDialog } from './resource-detail'
import type { LearningMaterialCard, LearningOverview, LearningSearchResult } from './types'

// ─── Small shared pieces ─────────────────────────────────────────────

function SectionShell({
  title, icon, action, children, className,
}: {
  title: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-3', className)} aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">Couldn&apos;t load Learning</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
      </Button>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Loading Learning">
      <Skeleton className="h-11 w-full max-w-xl rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ─── Search result row ───────────────────────────────────────────────

const KIND_ICON: Record<LearningSearchResult['kind'], typeof BookOpen> = {
  material: BookOpen,
  deck: Layers,
  group: Users,
  task: ListTodo,
}

function SearchResultRow({
  result, onOpenMaterial, onOpenTab,
}: {
  result: LearningSearchResult
  onOpenMaterial: (kind: string, id: string) => void
  onOpenTab: (tab: string) => void
}) {
  const Icon = KIND_ICON[result.kind] ?? BookOpen
  const handleClick = () => {
    if (result.kind === 'material') onOpenMaterial('material', result.id)
    else if (result.tab) onOpenTab(result.tab)
  }
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{result.title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{result.subtitle}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
    </motion.button>
  )
}

// ─── Overview ────────────────────────────────────────────────────────

export function LearningOverview({ onOpenTab }: { onOpenTab: (tab: string) => void }) {
  const [data, setData] = useState<LearningOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [searchResults, setSearchResults] = useState<LearningSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState<string | null>(null)

  const [detail, setDetail] = useState<LearningMaterialCard | null>(null)
  const bookmarkPending = useRef<Set<string>>(new Set())

  // ── Data: the ONE aggregate (+ subject drill-down via ?subjectId) ──
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    setError(null)
    apiFetch<LearningOverview>(
      `/api/student/learning/overview${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`,
      { signal: controller.signal },
    )
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setError(e instanceof Error ? e.message : 'Could not load Learning.')
      })
    return () => { cancelled = true; controller.abort() }
  }, [reloadKey, subjectId])

  // ── Debounced cross-entity search ─────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 350)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (debouncedQ.length < 2) {
      setSearchResults(null)
      setSearching(false)
      return
    }
    const controller = new AbortController()
    let cancelled = false
    setSearching(true)
    apiFetch<{ results: LearningSearchResult[] }>(
      `/api/student/learning/search?q=${encodeURIComponent(debouncedQ)}`,
      { signal: controller.signal },
    )
      .then((d) => { if (!cancelled) setSearchResults(d.results) })
      .catch(() => { if (!cancelled) setSearchResults([]) })
      .finally(() => { if (!cancelled) setSearching(false) })
    return () => { cancelled = true; controller.abort() }
  }, [debouncedQ])

  // ── Card mutations propagate into every list ──────────────────────
  const applyCardChange = useCallback((changed: LearningMaterialCard) => {
    setData((prev) => {
      if (!prev) return prev
      const map = (m: LearningMaterialCard) => (m.id === changed.id ? changed : m)
      return {
        ...prev,
        continueLearning: prev.continueLearning
          ? map(prev.continueLearning)
          : null,
        forYou: prev.forYou.map(map),
        recent: prev.recent.map(map),
        saved: prev.saved.map(map),
      }
    })
    setDetail((prev) => (prev && prev.id === changed.id ? changed : prev))
  }, [])

  const toggleBookmark = useCallback(
    async (m: LearningMaterialCard) => {
      // Optimistic scale + instant visual flip; rollback on failure.
      bookmarkPending.current.add(m.id)
      applyCardChange({ ...m, bookmarked: !m.bookmarked })
      try {
        const res = await apiPost<{ bookmarked: boolean }>('/api/student/learning/bookmark', {
          studyMaterialId: m.id,
        })
        if (res.bookmarked !== !m.bookmarked) applyCardChange({ ...m, bookmarked: res.bookmarked })
      } catch {
        applyCardChange({ ...m, bookmarked: m.bookmarked })
        import('sonner').then(({ toast }) => toast.error('Could not save right now.'))
      } finally {
        bookmarkPending.current.delete(m.id)
      }
    },
    [applyCardChange],
  )

  // Deep link from the ⌘K palette can open a material by id.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ kind: string; id: string }>
      if (ce.detail?.kind === 'material' && data) {
        const found = [data.continueLearning, ...data.forYou, ...data.recent, ...data.saved]
          .find((m): m is LearningMaterialCard => !!m && m.id === ce.detail.id)
        if (found) setDetail(found)
      }
    }
    window.addEventListener('learning:open-material', handler)
    return () => window.removeEventListener('learning:open-material', handler)
  }, [data])

  const openMaterialFromSearch = (kind: string, id: string) => {
    if (kind !== 'material' || !data) return
    const found = [data.continueLearning, ...data.forYou, ...data.recent, ...data.saved]
      .find((m): m is LearningMaterialCard => !!m && m.id === id)
    if (found) setDetail(found)
    else {
      // A search hit outside the loaded lists (e.g. subject drill-down) —
      // open a minimal honest card; the detail route revalidates access.
      setDetail({
        id, title: 'Opening…', description: null, subjectId: null, subjectName: null,
        className: null, category: 'general', status: 'published', publishedAt: null,
        originalName: '', sizeBytes: 0, mimeType: 'application/pdf', createdAt: '',
        opened: false, completed: false, bookmarked: false, lastOpenedAt: null,
      })
    }
  }

  const isSearching = searchResults !== null
  const subjects = useMemo(() => data?.subjects ?? [], [data])

  if (error && !data) {
    return (
      <div className="space-y-5">
        <SearchHero query={query} setQuery={setQuery} disabled />
        <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    )
  }
  if (!data) return <OverviewSkeleton />

  const hasSubjectDrill = !!subjectId
  const continueCard = data.continueLearning
  const newStudent =
    data.forYou.length === 0 && data.saved.length === 0 && data.recent.length === 0 && !hasSubjectDrill

  return (
    <div className="space-y-7">
      {/* ── Search-first hero (spec §6/§9) ─────────────────────────── */}
      <SearchHero query={query} setQuery={setQuery} />

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.section
            key="search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
            aria-label="Search results"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {searching ? 'Searching…' : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
              </h2>
              <Button
                variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                onClick={() => { setQuery(''); setSearchResults(null) }}
              >
                <X className="h-3.5 w-3.5" aria-hidden /> Clear
              </Button>
            </div>
            {searching && searchResults === null ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : searchResults.length === 0 ? (
              <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                No matches for &ldquo;{debouncedQ}&rdquo;
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {searchResults.map((r) => (
                  <SearchResultRow
                    key={`${r.kind}-${r.id}`}
                    result={r}
                    onOpenMaterial={openMaterialFromSearch}
                    onOpenTab={onOpenTab}
                  />
                ))}
              </div>
            )}
          </motion.section>
        ) : hasSubjectDrill ? (
          <motion.section
            key={`subject-${subjectId}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
            aria-label={`${subjectName ?? 'Subject'} materials`}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
                {subjectName ?? 'Subject'}
                <span className="text-xs font-normal text-muted-foreground">
                  {data.forYou.length} material{data.forYou.length === 1 ? '' : 's'}
                </span>
              </h2>
              <Button
                variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                onClick={() => setSubjectId(null)}
              >
                <X className="h-3.5 w-3.5" aria-hidden /> All subjects
              </Button>
            </div>
            {data.forYou.length === 0 ? (
              <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                No {subjectName} materials yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.forYou.map((m, i) => (
                  <ResourceCard
                    key={m.id}
                    material={m}
                    index={i}
                    onOpen={setDetail}
                    onToggleBookmark={toggleBookmark}
                    bookmarkPending={bookmarkPending.current.has(m.id)}
                  />
                ))}
              </div>
            )}
          </motion.section>
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-7"
          >
            {/* ── Continue Learning (spec §15) ──────────────────────── */}
            {continueCard && (
              <SectionShell
                title="Continue Learning"
                icon={<Sparkles className="h-4 w-4 text-violet-500" aria-hidden />}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(continueCard)}
                    className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg"
                    aria-label={`Open ${continueCard.title}`}
                  >
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', categoryMeta(continueCard.category).tone)}>
                      {(() => {
                        const I = categoryMeta(continueCard.category).icon
                        return <I className="h-4.5 w-4.5" aria-hidden />
                      })()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{continueCard.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {continueCard.subjectName ?? 'Learning'}
                        {continueCard.lastOpenedAt
                          ? ` · opened ${new Date(continueCard.lastOpenedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                          : ''}
                      </span>
                    </span>
                  </button>
                  <Button size="sm" onClick={() => setDetail(continueCard)} className="h-8 shrink-0 gap-1.5">
                    Continue <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </motion.div>
              </SectionShell>
            )}

            {/* ── For You (spec §18 — deterministic) ────────────────── */}
            {data.forYou.length > 0 && (
              <SectionShell
                title="For You"
                icon={<BookOpen className="h-4 w-4 text-primary" aria-hidden />}
                action={<span className="text-[11px] text-muted-foreground">New for you</span>}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.forYou.map((m, i) => (
                    <ResourceCard
                      key={m.id}
                      material={m}
                      index={i}
                      onOpen={setDetail}
                      onToggleBookmark={toggleBookmark}
                      bookmarkPending={bookmarkPending.current.has(m.id)}
                    />
                  ))}
                </div>
              </SectionShell>
            )}

            {/* ── Subjects (spec §10 — compact chips, scroll on mobile) ── */}
            {subjects.length > 0 && (
              <SectionShell title="Subjects" icon={<GraduationCap className="h-4 w-4 text-primary" aria-hidden />}>
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  role="group"
                  aria-label="Filter by subject"
                >
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSubjectId(s.id)
                        setSubjectName(s.name)
                        setSearchResults(null)
                        setQuery('')
                      }}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      {s.name}
                      <span className={cn(
                        'rounded-full px-1.5 text-[10px] font-semibold',
                        s.count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}>
                        {s.count}
                      </span>
                    </button>
                  ))}
                </div>
              </SectionShell>
            )}

            {/* ── Recently Opened (spec §16) ─────────────────────────── */}
            {data.recent.length > 0 && (
              <SectionShell title="Recently Opened" icon={<History className="h-4 w-4 text-teal-500" aria-hidden />}>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {data.recent.map((m) => (
                    <ResourceRow
                      key={m.id}
                      material={m}
                      onOpen={setDetail}
                      onToggleBookmark={toggleBookmark}
                      trailing={
                        m.lastOpenedAt
                          ? new Date(m.lastOpenedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : undefined
                      }
                    />
                  ))}
                </div>
              </SectionShell>
            )}

            {/* ── Saved (spec §17/§42) ───────────────────────────────── */}
            <SectionShell
              title={data.saved.length > 0 ? `Saved · ${data.saved.length}` : 'Saved'}
              icon={<BookmarkIcon className="h-4 w-4 text-amber-500" aria-hidden />}
            >
              {data.saved.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No saved resources yet.</p>
                  <Button
                    variant="outline" size="sm" className="h-8 gap-1.5"
                    onClick={() => {
                      document.querySelector<HTMLDivElement>('[aria-label="For You"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                  >
                    <Compass className="h-3.5 w-3.5" aria-hidden /> Explore Learning
                  </Button>
                </div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {data.saved.map((m) => (
                    <ResourceRow key={m.id} material={m} onOpen={setDetail} onToggleBookmark={toggleBookmark} />
                  ))}
                </div>
              )}
            </SectionShell>

            {/* ── New-student state (spec §67) ──────────────────────── */}
            {newStudent && (
              <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-border bg-card/50 px-4 py-12 text-center">
                <GraduationCap className="h-6 w-6 text-primary/60" aria-hidden />
                <p className="text-sm font-medium">Explore your subjects</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Materials your teachers share will appear here.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ResourceDetailDialog
        material={detail}
        onClose={() => setDetail(null)}
        onCardChange={applyCardChange}
      />
    </div>
  )
}

// ─── Search hero ─────────────────────────────────────────────────────

function SearchHero({
  query, setQuery, disabled,
}: {
  query: string
  setQuery: (q: string) => void
  disabled?: boolean
}) {
  return (
    <div className="relative max-w-xl">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        placeholder="Search your learning…"
        aria-label="Search your learning"
        className="h-11 rounded-xl border-border bg-card pl-10 pr-4 text-sm shadow-2xs placeholder:text-muted-foreground/70 focus-visible:ring-ring/40"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}
