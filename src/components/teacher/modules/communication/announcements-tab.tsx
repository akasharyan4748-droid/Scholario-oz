'use client'

/**
 * communication/announcements-tab — the REAL announcements history.
 *
 * Every row comes from GET /api/announcements (published Notification rows
 * with sender, audience, priority, read count and estimated recipients).
 * The delivery bar = acknowledgements ÷ estimated recipients — hidden when
 * the server cannot estimate the audience, never a fabricated number.
 *
 * There is deliberately NO composer: publishing school-wide announcements
 * is a school-administration (principal) action — the POST API rejects
 * teachers with FORBIDDEN, and the UI must not offer what the permissions
 * do not allow.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Megaphone, User } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Progress } from '@/components/ui/progress'
import {
  HubEmptyState,
  HubSectionError,
} from '@/components/teacher/modules/shared/hub-stat-cards'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { audienceLabel, deliveryRate, priorityLabel, priorityTone } from './shared'
import type { AnnouncementDTO } from './types'
import { NoticeBoard, NoticeBoardSkeleton } from './notice-board'

interface AnnouncementsTabProps {
  announcements: AnnouncementDTO[]
  loading: boolean
  error: string | null
  /** refetch both hub sources */
  onRetry: () => void
}

export function AnnouncementsTab({ announcements, loading, error, onRetry }: AnnouncementsTabProps) {
  // First load with nothing to show → section skeletons (the stat strip and
  // toolbar stay live above).
  const firstLoad = loading && announcements.length === 0 && !error

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        School-wide announcements are published by the school administration — every notice
        that reaches the school appears here with its real read status.
      </p>

      {/* stale-data reload failure → inline strip, content stays live */}
      {error && announcements.length > 0 ? <HubSectionError message={error} onRetry={onRetry} /> : null}

      {error && announcements.length === 0 && !loading ? (
        <GlassCard hover={false} className="p-4">
          <HubSectionError message={error} onRetry={onRetry} />
        </GlassCard>
      ) : announcements.length === 0 && !loading ? (
        <GlassCard hover={false} className="overflow-hidden">
          <HubEmptyState
            icon={Megaphone}
            title="No announcements published yet"
            hint="School-wide notices will appear here as soon as the administration publishes them."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <AnnouncementsList announcements={announcements} skeleton={firstLoad} />
          {firstLoad ? <NoticeBoardSkeleton /> : <NoticeBoard announcements={announcements} />}
        </div>
      )}
    </div>
  )
}

function AnnouncementsList({
  announcements,
  skeleton,
}: {
  announcements: AnnouncementDTO[]
  skeleton: boolean
}) {
  return (
    <GlassCard hover={false} className="p-3 sm:p-4 xl:col-span-2">
      <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold">All announcements</h3>
        <span className="text-[10px] text-muted-foreground">
          newest first · showing the latest {announcements.length}
        </span>
      </div>

      <div
        className="max-h-[600px] space-y-2.5 overflow-y-auto pr-1 -mr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        aria-label="School announcements"
      >
        {skeleton ? (
          <AnnouncementsListSkeleton />
        ) : (
          announcements.map((a, i) => <AnnouncementRow key={a.id} a={a} index={i} />)
        )}
      </div>
    </GlassCard>
  )
}

function AnnouncementRow({ a, index }: { a: AnnouncementDTO; index: number }) {
  const reduce = useReducedMotion()
  const rate = deliveryRate(a)

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.32), duration: 0.3 }}
      className="rounded-xl border border-border bg-card/40 p-3 transition-colors hover:bg-accent/30"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={priorityLabel(a.priority)} variant={priorityTone(a.priority)} dot />
        <StatusBadge status={audienceLabel(a.audience)} variant="info" />
      </div>

      <h4 className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{a.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{a.message}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/80">
        <span className="inline-flex items-center gap-1">
          <User className="h-2.5 w-2.5" aria-hidden="true" />
          {a.sender}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
          {formatRelativeTime(a.createdAt)} · {formatDate(a.createdAt)}
        </span>
      </div>

      <div className="mt-2.5 border-t border-border/60 pt-2">
        {rate === null ? (
          <p className="text-[10px] text-muted-foreground">
            Read by {a.acknowledgedBy} recipient{a.acknowledgedBy === 1 ? '' : 's'} · audience size
            unavailable
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2 text-[10px] text-muted-foreground">
              <span>
                Read by {a.acknowledgedBy} of {a.estimatedRecipients} recipient
                {a.estimatedRecipients === 1 ? '' : 's'}
              </span>
              <span className="font-medium tabular-nums">{rate}% read</span>
            </div>
            <Progress
              value={rate}
              className="mt-1.5 h-1"
              aria-label={`Read by ${a.acknowledgedBy} of ${a.estimatedRecipients} recipients (${rate}%)`}
            />
          </>
        )}
      </div>
    </motion.article>
  )
}

function AnnouncementsListSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card/40 p-3">
          <div className="flex gap-1.5">
            <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="mt-2 h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-3 w-full rounded bg-muted animate-pulse" />
          <div className="mt-1.5 h-3 w-2/3 rounded bg-muted animate-pulse" />
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="mt-2.5 h-1 w-full rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
