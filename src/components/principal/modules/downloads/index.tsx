'use client'

/**
 * DownloadsModule — Document Library.
 *
 * Refined document library (NOT a card grid):
 *   · Sticky header "Document Library"
 *   · Search bar + category filter + sort dropdown
 *   · Category tabs (with count badges) — counts are shown ONCE here
 *   · Quick Access row (compact, 4-5 most-used chips)
 *   · Document list (table) — rows with file-type icon, name, badges,
 *     updated date and Preview / Download / More actions
 *   · Slide-from-right detail drawer
 *
 * NO duplicate title (the sidebar already says "Downloads").
 * NO summary pill row — the category tabs already show Total/Generated/
 * Forms/Templates/Reports counts as badges.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library, Search, Filter, ArrowUpDown, Zap,
  X, Download as DownloadIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useDownloadsStore, type DownloadDocument, type CategoryTab } from '@/lib/store/downloads-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { toast } from 'sonner'
import {
  DocIcon, FormatBadge,
  SORT_OPTIONS, CATEGORY_OPTIONS,
  DOWNLOADS_GLOBAL_STYLES,
} from './downloads-shared'
import { DocumentList } from './document-list'
import { DocumentDetail } from './document-detail'

const TABS: Array<{ value: CategoryTab; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'Recent', label: 'Recent' },
  { value: 'Generated', label: 'Generated' },
  { value: 'Forms', label: 'Forms' },
  { value: 'Templates', label: 'Templates' },
  { value: 'Reports', label: 'Reports' },
]

export function DownloadsModule() {
  const [selectedDoc, setSelectedDoc] = useState<DownloadDocument | null>(null)

  // Subscribe to store
  const query = useDownloadsStore((s) => s.query)
  const setQuery = useDownloadsStore((s) => s.setQuery)
  const categoryFilter = useDownloadsStore((s) => s.categoryFilter)
  const setCategoryFilter = useDownloadsStore((s) => s.setCategoryFilter)
  const categoryTab = useDownloadsStore((s) => s.categoryTab)
  const setCategoryTab = useDownloadsStore((s) => s.setCategoryTab)
  const sortBy = useDownloadsStore((s) => s.sortBy)
  const setSortBy = useDownloadsStore((s) => s.setSortBy)
  const resetFilters = useDownloadsStore((s) => s.resetFilters)
  const getFilteredDocuments = useDownloadsStore((s) => s.getFilteredDocuments)
  const getCountsByTab = useDownloadsStore((s) => s.getCountsByTab)
  const getQuickAccess = useDownloadsStore((s) => s.getQuickAccess)
  const download = useDownloadsStore((s) => s.download)

  // Subscribe to cert store so generated counts update live
  const certDocsCount = useCertificatesStore((s) => s.documents.length)

  // Re-derive counts whenever cert docs change
  const counts = useMemo(() => getCountsByTab(), [getCountsByTab, certDocsCount])
  // Re-derive filtered list whenever any filter or the cert doc count changes
  const filtered = useMemo(
    () => getFilteredDocuments(),
    [getFilteredDocuments, certDocsCount, query, categoryFilter, categoryTab, sortBy],
  )
  const quickAccess = useMemo(() => getQuickAccess(), [getQuickAccess, certDocsCount])

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/') {
        e.preventDefault()
        const el = document.getElementById('downloads-search')
        el?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function handleQuickDownload(doc: DownloadDocument) {
    const filename = download(doc)
    toast.success('Download started', { description: `${filename} · ${doc.format}` })
  }

  const hasActiveFilters = query.trim().length > 0 || categoryFilter !== 'All' || categoryTab !== 'All'

  return (
    <div className="flex flex-col h-full downloads-shell">
      <style dangerouslySetInnerHTML={{ __html: DOWNLOADS_GLOBAL_STYLES }} />

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">
                Documents & Files
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                <Library className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Document Library
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                School documents, templates &amp; generated files
              </p>
            </div>
          </div>

          {/* Search + filters row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="downloads-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents, students, doc no…"
                className="h-9 pl-8 pr-8 text-xs"
                aria-label="Search documents"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Filter className="h-3.5 w-3.5 ml-1" />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as 'All' | typeof categoryFilter)}
            >
              <SelectTrigger className="h-9 text-xs w-[150px]" aria-label="Filter by category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-9 text-xs w-[150px]" aria-label="Sort documents">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline" size="sm"
                className="h-9 text-xs gap-1.5"
                onClick={resetFilters}
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Category tabs */}
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 -mb-1 downloads-list-scroll">
            {TABS.map((t) => {
              const active = t.value === categoryTab
              const count = counts[t.value]
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setCategoryTab(t.value)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap border',
                    active
                      ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[9px] font-semibold tabular-nums',
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Body — scrollable ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 downloads-list-scroll">
        {/* Quick Access section */}
        {quickAccess.length > 0 && (
          <QuickAccess docs={quickAccess} onOpen={setSelectedDoc} onDownload={handleQuickDownload} />
        )}

        {/* Document list */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryTab === 'All' ? 'All documents' : categoryTab}
            </h2>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </span>
            {query && (
              <span className="text-[10px] text-muted-foreground">
                · matching “<span className="text-foreground font-medium">{query}</span>”
              </span>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${categoryTab}-${categoryFilter}-${sortBy}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <DocumentList onSelectDoc={setSelectedDoc} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Detail drawer ─────────────────────────────────────────────── */}
      <DocumentDetail
        doc={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  )
}

// ─── Quick Access section ─────────────────────────────────────────────

function QuickAccess({
  docs, onOpen, onDownload,
}: {
  docs: DownloadDocument[]
  onOpen: (doc: DownloadDocument) => void
  onDownload: (doc: DownloadDocument) => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border bg-gradient-to-br from-emerald-50/40 to-transparent dark:from-emerald-500/[0.04] p-3"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Access
          </h2>
          <span className="text-[10px] text-muted-foreground/70 truncate">
            · most used documents
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground/60 hidden sm:inline">
          click to open · icon to download
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {docs.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, delay: i * 0.03 }}
            className="group inline-flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-full bg-card border border-border hover:border-emerald-500/40 hover:shadow-sm transition-all max-w-full"
          >
            <button
              type="button"
              onClick={() => onOpen(doc)}
              className="inline-flex items-center gap-2 min-w-0"
              aria-label={`Open ${doc.name}`}
            >
              <DocIcon format={doc.format} size="sm" className="!h-6 !w-6 !rounded-full" />
              <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
                {doc.name}
              </span>
              <FormatBadge format={doc.format} className="!text-[8px]" />
            </button>
            <button
              type="button"
              onClick={() => onDownload(doc)}
              className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground hover:bg-emerald-500 hover:text-white transition-colors shrink-0"
              aria-label={`Download ${doc.name}`}
              title="Download"
            >
              <DownloadIcon className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
