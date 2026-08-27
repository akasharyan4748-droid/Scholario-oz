'use client'

/**
 * comm-platform-broadcasts — live view of announcements that were really
 * published to the school database (Notification rows) via the compose
 * broadcast flow or the API.
 *
 * Data source: GET /api/announcements (server rows, newest first, includes
 * sender + acknowledgement counts). This is the authoritative cross-session
 * history — the local demo store only knows about this browser's drafts.
 *
 * UX states: skeleton rows while loading · graceful demo-mode strip when the
 * endpoint is unavailable · empty state · manual refresh · search-aware
 * filtering driven by the parent History search box.
 */

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Radio, RefreshCw, CheckCheck, Server, Database, X,
  Megaphone, ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface PlatformAnnouncement {
  id: string
  title: string
  message: string
  audience: string
  priority: string
  sender: string
  createdAt: string
  acknowledgedBy: number
}

// Canonical DB audience tag → human label (mirrors the composer mapping).
export function audienceLabel(a: string): string {
  if (a === 'ALL') return 'Whole School'
  if (a === 'PARENTS') return 'All Parents'
  if (a === 'STUDENTS') return 'All Students'
  if (a === 'TEACHERS') return 'All Teachers'
  if (a === 'STAFF') return 'All Staff'
  if (a.startsWith('CLASS:')) return `Class · ${a.slice(6).trim()}`
  return a
}

function priorityStyle(p: string): string {
  if (p === 'URGENT') return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
  if (p === 'HIGH') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
  return 'bg-muted/40 text-muted-foreground border-border'
}

function priorityLabel(p: string): string {
  if (p === 'URGENT') return 'Emergency'
  if (p === 'HIGH') return 'Priority'
  return 'General'
}

interface Props {
  /** Live search text from the History tab — platform rows filter along. */
  search: string
  /** Bumped whenever a new broadcast is composed, so the list refreshes. */
  refreshSignal?: number
}

export function PlatformBroadcasts({ search, refreshSignal }: Props) {
  const [rows, setRows] = useState<PlatformAnnouncement[] | null>(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState<PlatformAnnouncement | null>(null)

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setBusy(true)
    try {
      const r = await fetch('/api/announcements', { cache: 'no-store' })
      if (!r.ok) throw new Error('unavailable')
      const j = await r.json().catch(() => null)
      const data = j && typeof j === 'object' && 'data' in j ? (j as { data?: { announcements?: PlatformAnnouncement[] } }).data : null
      setRows(Array.isArray(data?.announcements) ? data!.announcements! : [])
      setError(false)
    } catch {
      setError(true)
    } finally {
      if (showSpinner) setBusy(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshSignal])

  const q = search.toLowerCase().trim()
  const visible = (rows ?? []).filter((a) =>
    !q || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q) || a.sender.toLowerCase().includes(q)
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header — always visible so the platform channel is discoverable */}
      <div className="px-3 py-2.5 border-b border-border/60 bg-gradient-to-r from-emerald-500/[0.06] via-transparent to-transparent flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
            <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold tracking-wide">Platform Broadcasts</p>
              {rows && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {rows.length}
                </span>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground truncate">Acknowledged records from the school database — visible to every session</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={busy}
          aria-label="Refresh platform broadcasts"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
        </button>
      </div>

      {/* Body */}
      {error ? (
        <div className="px-3 py-3 flex items-start gap-2 bg-amber-500/[0.06]">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Platform history unavailable</p>
            <p className="text-[10px] text-muted-foreground">Broadcasts composed in this session are still tracked below in demo mode.</p>
          </div>
        </div>
      ) : rows === null ? (
        /* Skeleton rows */
        <div className="divide-y divide-border/30" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-3 py-2.5 flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 rounded bg-muted animate-pulse" style={{ width: `${58 - i * 9}%` }} />
                <div className="h-2 rounded bg-muted/70 animate-pulse" style={{ width: `${80 - i * 12}%` }} />
              </div>
              <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="px-3 py-5 text-center">
          <Megaphone className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1.5" />
          <p className="text-[11px] font-medium text-muted-foreground">
            {rows.length === 0 ? 'No platform broadcasts yet' : 'No broadcasts match your search'}
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            {rows.length === 0 ? 'Announcements sent from the Compose tab appear here instantly.' : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/30 max-h-64 overflow-y-auto custom-scrollbar">
          {visible.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setViewing(a)}
              className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted/25 transition-colors group"
            >
              <span className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                a.priority === 'URGENT' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                : a.priority === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              )}>
                <Megaphone className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold truncate group-hover:text-primary transition-colors">{a.title}</p>
                  <span className={cn('shrink-0 px-1 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wide', priorityStyle(a.priority))}>
                    {priorityLabel(a.priority)}
                  </span>
                </div>
                <p className="text-[9.5px] text-muted-foreground truncate">{a.message}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-muted-foreground">
                  <span className="truncate">{audienceLabel(a.audience)}</span>
                  <span className="text-border">•</span>
                  <span className="truncate">by {a.sender}</span>
                </div>
              </div>
              <div className="shrink-0 text-right space-y-1">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/5 text-primary" title={`${a.acknowledgedBy} recipient${a.acknowledgedBy === 1 ? '' : 's'} acknowledged`}>
                  <CheckCheck className="h-3 w-3" />
                  <span className="text-[10px] font-bold tabular-nums">{a.acknowledgedBy}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">{formatRelativeTime(a.createdAt)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <PlatformViewModal announcement={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}

function PlatformViewModal({ announcement: a, onClose }: { announcement: PlatformAnnouncement; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={a.title}
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/[0.06] to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Server className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">{a.title}</h3>
              <p className="text-[9px] text-muted-foreground">Delivered on the live event stream</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.message}</p>

          <div className="rounded-md bg-muted/30 p-2.5 text-[11px] space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Sender</span><span className="font-medium">{a.sender}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Audience</span><span className="font-medium">{audienceLabel(a.audience)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><span className={cn('px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase', priorityStyle(a.priority))}>{priorityLabel(a.priority)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Acknowledgements</span>
              <span className="inline-flex items-center gap-1 font-semibold text-primary tabular-nums">
                <CheckCheck className="h-3.5 w-3.5" /> {a.acknowledgedBy} recipient{a.acknowledgedBy === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Published</span><span className="font-medium">{formatDate(a.createdAt)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">DB record</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground truncate max-w-[12rem]" title={a.id}>
                <Database className="h-3 w-3 shrink-0" /> {a.id}
              </span>
            </div>
          </div>

          <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2 text-[11px] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Live platform record — persisted across sessions and pushed to every connected dashboard.</span>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-1">
          <Button size="sm" className="h-8 text-xs" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
