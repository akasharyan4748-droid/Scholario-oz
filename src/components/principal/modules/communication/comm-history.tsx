'use client'

/**
 * comm-history — practical communication history with filters + search.
 *
 * Shows sent / scheduled / failed / archived communications.
 * Filters: All · Push · SMS · Email · Scheduled · Sent · Failed · Archived
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  History as HistoryIcon, Search, Archive, Eye, Pin, PinOff, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCommunicationStore, type Announcement } from '@/lib/store/communication-store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  CategoryBadge, StatusBadge, AudienceBadge, ChannelBadge,
  CommPanel, CommEmptyState,
} from './comm-shared'
import { PlatformBroadcasts } from './comm-platform-broadcasts'
import { toast } from 'sonner'

type FilterType = 'all' | 'push' | 'sms' | 'email' | 'scheduled' | 'sent' | 'failed' | 'archived'

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'push', label: 'Push' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'failed', label: 'Failed' },
  { value: 'archived', label: 'Archived' },
]

export function HistorySection() {
  const announcements = useCommunicationStore((s) => s.announcements)
  const archiveAnnouncement = useCommunicationStore((s) => s.archiveAnnouncement)
  const pinAnnouncement = useCommunicationStore((s) => s.pinAnnouncement)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [viewing, setViewing] = useState<Announcement | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return announcements.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.message.toLowerCase().includes(q) && !a.author.toLowerCase().includes(q)) return false
      if (filter === 'push' && !a.channels.includes('Push')) return false
      if (filter === 'sms' && !a.channels.includes('SMS')) return false
      if (filter === 'email' && !a.channels.includes('Email')) return false
      if (filter === 'scheduled' && a.status !== 'Scheduled') return false
      if (filter === 'sent' && !(a.status === 'Sent' || a.status === 'Delivered')) return false
      if (filter === 'failed' && a.status !== 'Failed') return false
      if (filter === 'archived' && !a.archived) return false
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [announcements, search, filter])

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Search + filter Select */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, message or author…"
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <SelectTrigger size="sm" className="h-8 text-xs w-[150px]" aria-label="Filter history">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Platform broadcasts — authoritative DB rows (server-side) with
          acknowledgement counts; filters along with the search box. */}
      <PlatformBroadcasts search={search} />

      {/* Local history list */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border/60 bg-muted/20 grid grid-cols-12 gap-2 text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
            <div className="col-span-9 sm:col-span-5">Message</div>
            <div className="col-span-2 hidden md:block">Audience</div>
            <div className="col-span-2 hidden lg:block">Channels</div>
            <div className="col-span-2 hidden sm:block">Date</div>
            <div className="col-span-3 sm:col-span-1">Status</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border/30 max-h-[36rem] overflow-y-auto">
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-muted/20 transition-colors items-center"
              >
                {/* Message — wider on mobile so the status cell never overlaps */}
                <div className="col-span-9 sm:col-span-5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium truncate">{a.title}</p>
                    {a.pinned && <Pin className="h-2.5 w-2.5 text-primary shrink-0" />}
                    {a.archived && <Archive className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">{a.message}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CategoryBadge category={a.category} />
                    {a.synced && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" title={`Persisted to school DB (${a.dbId ?? 'synced'}) · pushed on the live event stream`}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        LIVE
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground">by {a.author}</span>
                  </div>
                </div>
                {/* Audience */}
                <div className="col-span-2 hidden md:block">
                  <AudienceBadge audience={a.audience} />
                </div>
                {/* Channels */}
                <div className="col-span-2 hidden lg:block">
                  <ChannelBadge channels={a.channels} />
                </div>
                {/* Date */}
                <div className="col-span-2 hidden sm:block text-[10px] text-muted-foreground">
                  {a.status === 'Scheduled' && a.scheduledFor ? (
                    <span className="text-amber-600 font-medium">{formatDate(a.scheduledFor)}</span>
                  ) : a.sentAt ? (
                    formatDate(a.sentAt)
                  ) : (
                    formatDate(a.createdAt)
                  )}
                </div>
                {/* Status + actions — pin/archive hidden on mobile for room; view stays */}
                <div className="col-span-3 sm:col-span-1 flex items-center justify-end gap-0.5">
                  <StatusBadge status={a.status} />
                  <div className="flex items-center gap-0.5 ml-1">
                    <button onClick={() => setViewing(a)} className="inline-flex items-center justify-center h-6 w-6 rounded text-primary hover:bg-primary/10 transition-colors" title="View">
                      <Eye className="h-3 w-3" />
                    </button>
                    {!a.archived && (
                      <button onClick={() => { pinAnnouncement(a.id); toast.success(a.pinned ? 'Unpinned' : 'Pinned') }} className="hidden sm:inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title={a.pinned ? 'Unpin' : 'Pin'}>
                        {a.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>
                    )}
                    <button onClick={() => { archiveAnnouncement(a.id); toast.success(a.archived ? 'Restored' : 'Archived') }} className={cn('hidden sm:inline-flex items-center justify-center h-6 w-6 rounded transition-colors',
                      a.archived ? 'text-emerald-600 hover:bg-emerald-500/10' : 'text-amber-600 hover:bg-amber-500/10')} title={a.archived ? 'Restore' : 'Archive'}>
                      {a.archived ? <RotateCcw className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <CommPanel>
          <CommEmptyState icon={<HistoryIcon className="h-6 w-6" />} title="No local history" description={search ? "Try a different search." : "Drafts and demo-mode sends from this session will appear here. Delivered broadcasts live in the Platform Broadcasts panel above."} />
        </CommPanel>
      )}

      {/* View modal */}
      {viewing && (
        <HistoryViewModal announcement={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}

function HistoryViewModal({ announcement: a, onClose }: { announcement: Announcement; onClose: () => void }) {
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
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold truncate">{a.title}</h3>
          <StatusBadge status={a.status} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.message}</p>

          <div className="rounded-md bg-muted/30 p-2.5 text-[11px] space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Author</span><span className="font-medium">{a.author}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Audience</span><span className="font-medium">{a.audience}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Recipients</span><span className="font-medium tabular-nums">{a.recipientCount.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Channels</span><span><ChannelBadge channels={a.channels} /></span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{formatDate(a.createdAt)}</span></div>
            {a.sentAt && <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span className="font-medium">{formatDate(a.sentAt)}</span></div>}
            {a.scheduledFor && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled for</span><span className="font-medium text-amber-600">{formatDate(a.scheduledFor)}</span></div>}
            {a.synced && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Platform broadcast</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Delivered live
                </span>
              </div>
            )}
            {a.dbId && <div className="flex justify-between"><span className="text-muted-foreground">DB record</span><span className="font-mono text-[10px] text-muted-foreground truncate max-w-[12rem]">{a.dbId}</span></div>}
            {a.deliveredCount !== undefined && <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span className="font-medium tabular-nums text-emerald-600">{a.deliveredCount.toLocaleString('en-IN')}</span></div>}
            {a.failedCount !== undefined && a.failedCount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><span className="font-medium tabular-nums text-rose-600">{a.failedCount.toLocaleString('en-IN')}</span></div>}
          </div>

          {a.relatedModule && (
            <div className="rounded-md bg-sky-500/5 border border-sky-500/20 p-2 text-[11px]">
              <span className="text-muted-foreground">Related: </span>
              <span className="font-medium text-sky-700 dark:text-sky-300">{a.relatedModule}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-1">
          <Button size="sm" className="h-8 text-xs" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
