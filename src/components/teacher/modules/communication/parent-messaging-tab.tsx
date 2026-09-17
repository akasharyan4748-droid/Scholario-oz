'use client'

/**
 * communication/parent-messaging-tab — the teacher's REAL parent-messaging
 * surface, summarized.
 *
 * Data comes from GET /api/teacher/parent-connect (the same aggregate the
 * Parent Connect module uses): per-conversation parent/student, unread
 * count, last message and follow-up state, plus the linkable-students
 * list and honest stats.
 *
 * This tab is deliberately a SUMMARY, not a second thread UI (the §28
 * duplicate-component audit forbids two thread renderers): clicking a
 * conversation (or the primary button) navigates to the Parent Connect
 * module where reading and replying actually happens. No fake call/email
 * buttons, no broadcast send — those channels do not exist for teachers.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, ChevronRight, MessagesSquare, Pin } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  HubEmptyState,
  HubSectionError,
} from '@/components/teacher/modules/shared/hub-stat-cards'
import { formatRelativeTime } from '@/lib/format'
import type { ParentConnectPayload } from '@/lib/teacher-hub-types'
import { cn } from '@/lib/utils'
import { conversationPreview } from './shared'

interface ParentMessagingTabProps {
  parent: ParentConnectPayload | null
  loading: boolean
  error: string | null
  /** navigate to the Parent Connect module (the full thread lives there) */
  onOpenParentConnect: () => void
  onRetry: () => void
}

export function ParentMessagingTab({
  parent,
  loading,
  error,
  onOpenParentConnect,
  onRetry,
}: ParentMessagingTabProps) {
  const firstLoad = loading && !parent && !error
  const conversations = parent?.conversations ?? []
  const linkableCount = parent?.students.length ?? 0

  if (firstLoad) {
    return (
      <div className="space-y-3">
        <GlassCard hover={false} className="p-4">
          <ParentMessagingSkeleton />
        </GlassCard>
      </div>
    )
  }

  if (error && !parent) {
    return (
      <GlassCard hover={false} className="p-4">
        <HubSectionError message={error} onRetry={onRetry} />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-3">
      {error && parent ? <HubSectionError message={error} onRetry={onRetry} /> : null}

      <GlassCard hover={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Parent conversations</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {conversations.length} conversation{conversations.length === 1 ? '' : 's'} ·{' '}
              {linkableCount} of your students have a linked guardian you can message through
              Parent Connect.
            </p>
          </div>
          <Button
            type="button"
            onClick={onOpenParentConnect}
            className="h-11 shrink-0 rounded-xl text-xs"
          >
            <MessagesSquare className="h-4 w-4" aria-hidden="true" />
            Open Parent Connect
          </Button>
        </div>

        {conversations.length === 0 ? (
          <HubEmptyState
            icon={MessagesSquare}
            title="No parent conversations yet"
            hint="Messages with parents of your students will appear here — start one in Parent Connect."
            action={
              <Button
                type="button"
                onClick={onOpenParentConnect}
                className="h-11 rounded-xl text-xs"
              >
                <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                Open Parent Connect
              </Button>
            }
          />
        ) : (
          <div
            className="max-h-[600px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
            aria-label="Parent conversation summaries"
          >
            {conversations.map((c, i) => (
              <ConversationSummaryRow
                key={c.id}
                c={c}
                index={i}
                onOpen={onOpenParentConnect}
              />
            ))}
          </div>
        )}

        <p className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
          Reading and replying happens in Parent Connect — this tab is a live summary of your real
          threads, not a separate channel.
        </p>
      </GlassCard>
    </div>
  )
}

function ConversationSummaryRow({
  c,
  index,
  onOpen,
}: {
  c: ParentConnectPayload['conversations'][number]
  index: number
  onOpen: () => void
}) {
  const reduce = useReducedMotion()

  return (
    <motion.button
      type="button"
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.28), duration: 0.28 }}
      onClick={onOpen}
      className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none min-h-[44px]"
      aria-label={`Open conversation with ${c.parent.name}, parent of ${c.student.name}, in Parent Connect`}
    >
      <Avatar name={c.parent.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-sm font-medium text-foreground">{c.parent.name}</p>
          {c.unread > 0 && (
            <span
              className={cn(
                'rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground',
              )}
            >
              {c.unread} unread
            </span>
          )}
          {c.openFollowUp && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
              Follow-up due
            </span>
          )}
          {c.pinned && <Pin className="h-3 w-3 text-muted-foreground" aria-label="Pinned" />}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          Parent of {c.student.name} · {c.student.classLabel}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground/90">
          {conversationPreview(c)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        {c.lastMessageAt && (
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(c.lastMessageAt)}
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
      </div>
    </motion.button>
  )
}

function ParentMessagingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
