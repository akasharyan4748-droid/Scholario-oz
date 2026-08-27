'use client'

/**
 * comm-announcements — primary view with recent announcements + Notice Board.
 *
 * Layout:
 *   - Compact control row: search + single filter Select
 *   - Announcement list (left, 2/3 width)
 *   - Notice Board (right, 1/3 width) — only pinned/important + upcoming
 *
 * Each announcement card:
 *   icon · title · category badge · audience badge · message · author + date · status · actions
 *
 * Actions: View · Pin/Unpin · Duplicate · Archive
 *
 * Counts (Active / Scheduled / Drafts) are shown ONCE in the comm-shell
 * header summary pills — NOT duplicated as chips here.
 */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Pin, PinOff, Copy, Archive, Eye, MoreHorizontal, Bell,
  Clock, Calendar, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCommunicationStore, type Announcement } from '@/lib/store/communication-store'
import { upcomingEvents } from '@/lib/mock/operations'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  CategoryBadge, StatusBadge, AudienceBadge, ChannelBadge,
  CommPanel, CommEmptyState, categoryAccent,
} from './comm-shared'
import type { CommTab } from './comm-shared'
import { toast } from 'sonner'

interface Props {
  onNavigate: (tab: CommTab) => void
}

type AnnouncementFilter = 'all' | 'active' | 'scheduled' | 'draft'

export function AnnouncementsSection({ onNavigate }: Props) {
  const announcements = useCommunicationStore((s) => s.announcements)
  const pinAnnouncement = useCommunicationStore((s) => s.pinAnnouncement)
  const archiveAnnouncement = useCommunicationStore((s) => s.archiveAnnouncement)
  const duplicateAnnouncement = useCommunicationStore((s) => s.duplicateAnnouncement)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AnnouncementFilter>('all')
  const [moreMenuOpen, setMoreMenuOpen] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Announcement | null>(null)

  // Active announcements (not archived)
  const active = useMemo(() => announcements.filter((a) => !a.archived), [announcements])
  const pinned = useMemo(() => active.filter((a) => a.pinned), [active])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return active.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.message.toLowerCase().includes(q)) return false
      if (filter === 'active' && a.status === 'Draft') return false
      if (filter === 'scheduled' && a.status !== 'Scheduled') return false
      if (filter === 'draft' && a.status !== 'Draft') return false
      return true
    }).sort((a, b) => {
      // Pinned first, then by date descending
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [active, search, filter])

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Compact control row: search + filter Select */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="w-full h-8 pl-3 pr-3 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as AnnouncementFilter)}>
          <SelectTrigger size="sm" className="h-8 text-xs w-[140px]" aria-label="Filter announcements">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main grid: announcements + notice board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Announcements list */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.length > 0 ? (
            filtered.map((a, i) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onPin={() => { pinAnnouncement(a.id); toast.success(a.pinned ? 'Unpinned' : 'Pinned to Notice Board') }}
                onDuplicate={() => { duplicateAnnouncement(a.id); toast.success('Announcement duplicated', { description: 'Saved as draft' }) }}
                onArchive={() => { archiveAnnouncement(a.id); toast.success('Announcement archived') }}
                onView={() => setViewing(a)}
                moreMenuOpen={moreMenuOpen === a.id}
                setMoreMenuOpen={(open) => setMoreMenuOpen(open ? a.id : null)}
                index={i}
              />
            ))
          ) : (
            <CommPanel>
              <CommEmptyState
                icon={<Megaphone className="h-6 w-6" />}
                title="No announcements found"
                description={search ? "Try a different search." : "Create your first announcement to get started."}
                action={<Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onNavigate('compose')}><Megaphone className="h-3.5 w-3.5" /> New Announcement</Button>}
              />
            </CommPanel>
          )}
        </div>

        {/* Notice Board */}
        <div>
          <CommPanel
            title="Notice Board"
            subtitle="Pinned & important"
            bodyClassName="p-3"
          >
            <div className="space-y-2">
              {pinned.length > 0 ? pinned.map((n) => {
                const a = categoryAccent(n.category)
                return (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2 }}
                    onClick={() => setViewing(n)}
                    className={cn('w-full text-left rounded-lg p-2.5 border-l-4 shadow-sm transition-all', a.bg)}
                    style={{ borderLeftColor: 'currentColor' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-xs leading-tight">{n.title}</p>
                      <CategoryBadge category={n.category} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> {formatDate(n.createdAt)}
                    </p>
                  </motion.button>
                )
              }) : (
                <CommEmptyState icon={<Bell className="h-5 w-5" />} title="No pinned notices" description="Pin an announcement to see it here." />
              )}
            </div>

            {/* Upcoming from canonical calendar events */}
            {pinned.length > 0 && pinned.length < 4 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">Upcoming</p>
                <div className="space-y-1">
                  {upcomingEvents.slice(0, 3).map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-[10px] rounded-md px-1.5 py-1 hover:bg-muted/30">
                      <span className="font-medium truncate">{e.title}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0">{formatDate(e.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CommPanel>
        </div>
      </div>

      {/* View modal */}
      <AnimatePresence>
        {viewing && (
          <ViewAnnouncementModal
            announcement={viewing}
            onClose={() => setViewing(null)}
            onPin={() => { pinAnnouncement(viewing.id); toast.success(viewing.pinned ? 'Unpinned' : 'Pinned') }}
            onArchive={() => { archiveAnnouncement(viewing.id); toast.success('Archived'); setViewing(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Announcement Card ────────────────────────────────────────────────

function AnnouncementCard({ announcement: a, onPin, onDuplicate, onArchive, onView, moreMenuOpen, setMoreMenuOpen, index }: {
  announcement: Announcement
  onPin: () => void
  onDuplicate: () => void
  onArchive: () => void
  onView: () => void
  moreMenuOpen: boolean
  setMoreMenuOpen: (open: boolean) => void
  index: number
}) {
  const acc = categoryAccent(a.category)
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'rounded-xl border bg-card p-3.5 transition-all hover:shadow-md',
        a.pinned ? 'border-primary/40 shadow-sm' : 'border-border',
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', acc.icon)}>
          {a.category === 'Emergency' ? <AlertCircle className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm">{a.title}</h3>
                {a.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <CategoryBadge category={a.category} />
                <AudienceBadge audience={a.audience} />
                <ChannelBadge channels={a.channels} />
              </div>
            </div>
            <StatusBadge status={a.status} />
          </div>

          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{a.message}</p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[8px] font-semibold">
                  {a.author.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                {a.author}
              </span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {formatRelativeTime(a.createdAt)}</span>
              {a.status === 'Scheduled' && a.scheduledFor && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 font-medium">Scheduled for {formatDate(a.scheduledFor)}</span>
                </>
              )}
              {a.deliveredCount !== undefined && a.status === 'Delivered' && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 font-medium tabular-nums">{a.deliveredCount.toLocaleString('en-IN')} delivered</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1" onClick={onView}>
                <Eye className="h-3 w-3" /> View
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onPin} title={a.pinned ? 'Unpin' : 'Pin to Notice Board'}>
                {a.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </Button>
              <div className="relative">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setMoreMenuOpen(!moreMenuOpen)} title="More">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
                {moreMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMoreMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-card shadow-md z-20 py-1">
                      <button onClick={() => { onDuplicate(); setMoreMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted/40 flex items-center gap-1.5">
                        <Copy className="h-3 w-3" /> Duplicate
                      </button>
                      <button onClick={() => { onArchive(); setMoreMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted/40 flex items-center gap-1.5 text-amber-600">
                        <Archive className="h-3 w-3" /> Archive
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── View Modal ──────────────────────────────────────────────────────

function ViewAnnouncementModal({ announcement: a, onClose, onPin, onArchive }: {
  announcement: Announcement
  onClose: () => void
  onPin: () => void
  onArchive: () => void
}) {
  const acc = categoryAccent(a.category)
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
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', acc.icon)}>
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">{a.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CategoryBadge category={a.category} />
                <AudienceBadge audience={a.audience} />
              </div>
            </div>
          </div>
          <StatusBadge status={a.status} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.message}</p>

          <div className="rounded-md bg-muted/30 p-2.5 text-[11px] space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Author</span><span className="font-medium">{a.author}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{formatDate(a.createdAt)}</span></div>
            {a.sentAt && <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span className="font-medium">{formatDate(a.sentAt)}</span></div>}
            {a.scheduledFor && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled for</span><span className="font-medium text-amber-600">{formatDate(a.scheduledFor)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Recipients</span><span className="font-medium tabular-nums">{a.recipientCount.toLocaleString('en-IN')}</span></div>
            {a.deliveredCount !== undefined && <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span className="font-medium tabular-nums text-emerald-600">{a.deliveredCount.toLocaleString('en-IN')}</span></div>}
            {a.failedCount !== undefined && a.failedCount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><span className="font-medium tabular-nums text-rose-600">{a.failedCount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Channels</span><span><ChannelBadge channels={a.channels} /></span></div>
          </div>

          {a.relatedModule && (
            <div className="rounded-md bg-sky-500/5 border border-sky-500/20 p-2 text-[11px]">
              <span className="text-muted-foreground">Related: </span>
              <span className="font-medium text-sky-700 dark:text-sky-300">{a.relatedModule}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onPin}>
            {a.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            {a.pinned ? 'Unpin' : 'Pin'}
          </Button>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10" onClick={onArchive}>
              <Archive className="h-3 w-3" /> Archive
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={onClose}>Close</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
