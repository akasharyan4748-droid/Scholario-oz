'use client'

/**
 * communication/announcements-card — the SCHOOL ANNOUNCEMENTS card: the
 * Notification rows this teacher is allowed to see (audience-scoped via
 * audienceAllows, class fan-outs deduped on the server — same rule as the
 * bell feed), newest first. A row expands inline to the full announcement;
 * unread items can be acknowledged ("Mark as read" persists a
 * NotificationRead through the SAME /api/notifications-feed PATCH the bell
 * feed uses, so the state is shared).
 */

import { useState } from 'react'
import { Check, ChevronDown, Loader2, Megaphone, Plus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { cn } from '@/lib/utils'
import { announcementDate, audienceChip, priorityTone } from './shared'
import type { CommunicationAnnouncement } from './types'

const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'

interface AnnouncementsCardProps {
  announcements: CommunicationAnnouncement[]
  /** read-state resolver (server readAt ∨ local acknowledgement override) */
  isRead: (a: CommunicationAnnouncement) => boolean
  /** mark as read — the parent persists it and updates the override */
  onMarkRead: (id: string) => Promise<void>
  /** shown on the empty state ONLY when the teacher has announcement permission */
  onNewAnnouncement?: () => void
}

export function AnnouncementsCard({
  announcements,
  isRead,
  onMarkRead,
  onNewAnnouncement,
}: AnnouncementsCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <GlassCard className="flex flex-col p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          School Announcements
        </p>
        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
          {announcements.length} visible
        </span>
      </div>

      {announcements.length === 0 ? (
        <HubEmptyState
          icon={Megaphone}
          title="No announcements yet"
          hint="School-wide notices addressed to teachers will appear here."
          action={
            onNewAnnouncement && (
              <button
                onClick={onNewAnnouncement}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New Announcement
              </button>
            )
          }
        />
      ) : (
        <div
          className={cn('max-h-[26rem] divide-y divide-border/50 overflow-y-auto', THIN_SCROLLBAR)}
          role="list"
          aria-label="School announcements for teachers"
        >
          {announcements.map((a) => {
            const read = isRead(a)
            const expanded = expandedId === a.id
            const priority = priorityTone(a.priority)
            return (
              <div key={a.id} role="listitem">
                <button
                  onClick={() => setExpandedId(expanded ? null : a.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40"
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      read ? 'bg-transparent' : 'bg-primary',
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          'truncate text-sm',
                          read ? 'font-medium text-foreground' : 'font-semibold text-foreground',
                        )}
                      >
                        {a.title}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                          audienceChip(a),
                        )}
                      >
                        {a.ownClass ? `Your class · ${a.audienceLabel}` : a.audienceLabel}
                      </span>
                      {a.priority !== 'NORMAL' && (
                        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} aria-hidden="true" />
                          {priority.label}
                        </span>
                      )}
                    </span>
                    {!expanded && (
                      <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                        {a.message}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground tabular-nums">
                      {announcementDate(a.createdAt)}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform',
                        expanded && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {expanded && (
                  <div className="px-4 pb-3.5 pl-[1.9rem]">
                    <p className="whitespace-pre-line text-xs leading-relaxed text-foreground/90">
                      {a.message}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground">By {a.senderName}</p>
                      {!read && <MarkReadButton id={a.id} onMarkRead={onMarkRead} />}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}

function MarkReadButton({
  id,
  onMarkRead,
}: {
  id: string
  onMarkRead: (id: string) => Promise<void>
}) {
  const [marking, setMarking] = useState(false)
  return (
    <button
      onClick={() => {
        setMarking(true)
        onMarkRead(id).finally(() => setMarking(false))
      }}
      disabled={marking}
      className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-60"
    >
      {marking ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="h-3 w-3" aria-hidden="true" />
      )}
      Mark as read
    </button>
  )
}
