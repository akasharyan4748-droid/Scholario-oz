'use client'

/**
 * StudyMaterialsModule — the STUDENT repository surface (RB-1).
 *
 * A premium, server-authorized view of everything the school has shared:
 * worksheets, notes, syllabi, sample papers and revision packs. The list
 * comes from GET /api/study-materials (metadata only, school-scoped via
 * the session), and every download goes through
 * GET /api/study-materials/[id]/download — the browser never sees a file
 * URL and can never bypass the authorization check.
 *
 * Surfaces, all real (no fabricated data):
 *   · count + category filter chips (All + the repository categories)
 *   · debounced search over title/description (server-side ?q=)
 *   · cards: title, description, subject/class chips, category badge,
 *     file type, size + date, Download (blob download with per-file
 *     spinner + error toast)
 *   · loading skeleton · honest error state with retry · empty state
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FolderOpen, Search, Download, Loader2, FileText, PencilRuler,
  NotebookPen, ListOrdered, FileCheck, RefreshCw, AlertTriangle,
  RefreshCcw, X,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'

// ─── Types (mirror the API contract in src/lib/study-materials.ts) ───

interface StudyMaterialMeta {
  id: string
  title: string
  description: string | null
  subjectId: string | null
  subjectName: string | null
  className: string | null
  category: string
  originalName: string
  sizeBytes: number
  mimeType: string
  createdAt: string
}

// ─── Presentation metadata ───────────────────────────────────────────

const CATEGORY_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'worksheet', label: 'Worksheets' },
  { key: 'notes', label: 'Notes' },
  { key: 'syllabus', label: 'Syllabus' },
  { key: 'sample-paper', label: 'Sample Papers' },
  { key: 'revision', label: 'Revision' },
]

const CATEGORY_META: Record<string, { label: string; icon: typeof FileText; tone: string }> = {
  general: { label: 'General', icon: FileText, tone: 'bg-muted text-muted-foreground border-border' },
  worksheet: { label: 'Worksheet', icon: PencilRuler, tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  notes: { label: 'Notes', icon: NotebookPen, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  syllabus: { label: 'Syllabus', icon: ListOrdered, tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' },
  'sample-paper': { label: 'Sample Paper', icon: FileCheck, tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
  revision: { label: 'Revision', icon: RefreshCw, tone: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20' },
}

/** Short, honest file-type label from the stored MIME type. */
function fileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'text/plain') return 'TXT'
  if (mimeType.startsWith('image/')) return 'IMG'
  if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') return 'DOC'
  if (mimeType.includes('presentationml') || mimeType === 'application/vnd.ms-powerpoint') return 'PPT'
  if (mimeType.includes('spreadsheetml') || mimeType === 'application/vnd.ms-excel') return 'XLS'
  return 'FILE'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Module ──────────────────────────────────────────────────────────

export function StudyMaterialsModule() {
  const [items, setItems] = useState<StudyMaterialMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Debounce the search box → refetch at most ~400ms after typing stops.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 400)
    return () => clearTimeout(t)
  }, [query])

  // Repository index — server-authorized, school-scoped metadata only.
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    setError(null)
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (debouncedQ) params.set('q', debouncedQ)
    const qs = params.toString()
    fetch(`/api/study-materials${qs ? `?${qs}` : ''}`, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => null)
          throw new Error(j?.error ?? `Could not load study materials (${r.status}).`)
        }
        return r.json()
      })
      .then((j) => {
        if (cancelled) return
        const data = j && typeof j === 'object' && 'data' in j ? (j as { data?: StudyMaterialMeta[] }).data : null
        if (!Array.isArray(data)) throw new Error('Unexpected response from the server.')
        setItems(data)
      })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setItems([])
        setError(e instanceof Error ? e.message : 'Could not load study materials.')
      })
    return () => { cancelled = true; controller.abort() }
  }, [category, debouncedQ, reloadKey])

  // Download — server-authorized stream → blob → save. The URL never
  // exposes the stored file; the session cookie carries the authorization.
  const download = useCallback(async (m: StudyMaterialMeta) => {
    if (downloadingId) return
    setDownloadingId(m.id)
    try {
      const r = await fetch(`/api/study-materials/${m.id}/download`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!r.ok) {
        const j = await r.json().catch(() => null)
        throw new Error(j?.error ?? `The file could not be downloaded (${r.status}).`)
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = m.originalName || 'study-material'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      toast.success('Download started', { description: m.originalName })
    } catch (e) {
      toast.error('Download failed', {
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
      })
    } finally {
      setDownloadingId(null)
    }
  }, [downloadingId])

  const countLabel = useMemo(
    () => (items == null ? '…' : `${items.length} material${items.length === 1 ? '' : 's'}`),
    [items],
  )

  return (
    <div className="space-y-5 max-w-5xl">
      <SectionHeading
        title="Study Materials"
        subtitle="Worksheets, notes, syllabi, sample papers and revision packs shared by your school"
        icon={<FolderOpen className="h-5 w-5" />}
        action={
          <StatusBadge status={countLabel} variant="primary" dot />
        }
      />

      {/* ── Filters: category chips + debounced search ─────────────── */}
      <div className="flex flex-col gap-3">
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar"
          role="group"
          aria-label="Filter study materials by category"
        >
          {CATEGORY_FILTERS.map((c) => {
            const activeChip = category === c.key
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={activeChip}
                onClick={() => setCategory(c.key)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors min-h-[36px]',
                  activeChip
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent/50',
                )}
              >
                {c.label}
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
          <label htmlFor="study-materials-search" className="sr-only">Search study materials</label>
          <Input
            id="study-materials-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or description…"
            className="pl-9 pr-9 h-10"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Error state (honest, retryable) ────────────────────────── */}
      {error && (
        <GlassCard className="p-6 text-center" hover={false}>
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Your school&apos;s repository could not be reached.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCcw className="h-4 w-4" /> Try again
          </Button>
        </GlassCard>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────── */}
      {!error && items == null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading study materials">
          {[0, 1, 2, 3].map((i) => (
            <GlassCard key={i} className="p-4" hover={false}>
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex gap-2 pt-1.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!error && items != null && items.length === 0 && (
        <GlassCard className="p-10 text-center" hover={false}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <FolderOpen className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">No study materials yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm mx-auto leading-relaxed">
            {debouncedQ || category !== 'all'
              ? 'Nothing matches this filter — try another category or clear the search.'
              : 'When your school shares worksheets, notes or papers, they will appear here.'}
          </p>
          {(debouncedQ || category !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => { setQuery(''); setCategory('all') }}
            >
              <RefreshCcw className="h-4 w-4" /> Clear filters
            </Button>
          )}
        </GlassCard>
      )}

      {/* ── Repository cards ───────────────────────────────────────── */}
      {!error && items != null && items.length > 0 && (
        <div className="max-h-[62vh] overflow-y-auto custom-scrollbar pr-0.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {items.map((m, i) => {
              const meta = CATEGORY_META[m.category] ?? CATEGORY_META.general
              const CatIcon = meta.icon
              const isDownloading = downloadingId === m.id
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
                >
                  <GlassCard className="p-4 h-full flex flex-col">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                        meta.tone,
                      )}>
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{m.title}</h3>
                          <span className={cn(
                            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                            meta.tone,
                          )}>
                            {meta.label}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                            {m.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      {m.subjectName && (
                        <span className="rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-medium px-2 py-0.5">
                          {m.subjectName}
                        </span>
                      )}
                      {m.className && (
                        <span className="rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-medium px-2 py-0.5">
                          Class {m.className}
                        </span>
                      )}
                      <span className="rounded-full bg-muted/60 border border-border text-muted-foreground text-[10px] font-mono font-medium px-2 py-0.5">
                        {fileTypeLabel(m.mimeType)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 ml-auto">
                        {formatBytes(m.sizeBytes)} · {formatDate(m.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between gap-3">
                      <p className="text-[11px] text-muted-foreground/80 truncate min-w-0" title={m.originalName}>
                        {m.originalName}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => download(m)}
                        disabled={isDownloading || downloadingId != null}
                        aria-label={`Download ${m.title}`}
                        className="shrink-0 min-h-[36px]"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Downloading…
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" /> Download
                          </>
                        )}
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
        <FileText className="h-3 w-3 shrink-0" />
        Files are shared by your school and downloaded securely with your session.
      </p>
    </div>
  )
}
