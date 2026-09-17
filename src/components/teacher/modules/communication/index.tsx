'use client'

/**
 * communication/index — the Communication Hub composition.
 *
 * A practical communication workspace for the teacher (NOT a principal-style
 * broadcast dashboard):
 *   · quiet context toolbar (the app bar carries the module name)
 *   · 4 honest summary cards — every number is a real count from
 *     /api/teacher/communication (no delivery rates, no fabricated metrics)
 *   · RECENT CONVERSATIONS — a read-only preview of her own Parent Connect
 *     threads with "Open Conversation" deep-links (onNavigate('parent-
 *     connect')); the thread UI is NOT duplicated here
 *   · SCHOOL ANNOUNCEMENTS — Notification rows this role may see
 *     (audienceAllows), expandable inline, with persistent "Mark as read"
 *   · SENT MESSAGES — what she has actually sent (parent threads + direct)
 *   · Message Parent dialog — same authorization model + backend as Parent
 *     Connect, so threads stay unified
 *   · New Announcement — rendered ONLY when the teacher's active position
 *     permissions include 'announcements' (teachers-store, the same system
 *     that gates the teacher nav). Normal teachers never see it.
 */

import { useCallback, useMemo, useState } from 'react'
import { MailOpen, Megaphone, Plus, Reply, Send } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '@/components/teacher/teacher-panel/module-toolbar'
import {
  HubEmptyState,
  HubModuleSkeleton,
  HubSectionError,
  HubStatCardSkeleton,
  HubStatCards,
  type HubStat,
} from '@/components/teacher/modules/shared/hub-stat-cards'
import { toast } from 'sonner'
import { getTeacherActivePermissions, useTeachersStore } from '@/lib/store/teachers-store'
import { useCommunicationHub, markAnnouncementRead } from './hooks'
import { OUTLINE_ACTION_CLASS, PRIMARY_ACTION_CLASS } from './shared'
import type { CommunicationAnnouncement } from './types'
import { AnnouncementsCard } from './announcements-card'
import { ConversationsPreviewCard } from './conversations-preview'
import { CreateAnnouncementDialog } from './create-announcement-dialog'
import { MessageParentDialog } from './message-parent-dialog'
import { SentMessagesCard } from './sent-messages'

/** Placeholder shapes so the error state matches the real card layout. */
const SKELETON_STATS: HubStat[] = [
  { key: 'unread', label: 'Unread Messages', value: null, icon: MailOpen, tone: 'emerald' },
  { key: 'announcements', label: 'Announcements', value: null, icon: Megaphone, tone: 'sky' },
  { key: 'sent', label: 'Messages Sent', value: null, icon: Send, tone: 'violet' },
  { key: 'awaiting', label: 'Awaiting Reply', value: null, icon: Reply, tone: 'amber' },
]

export function CommunicationModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { data, loading, error, reload } = useCommunicationHub()
  const [messageOpen, setMessageOpen] = useState(false)
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  /** locally acknowledged announcements (persisted via NotificationRead) */
  const [readOverrides, setReadOverrides] = useState<ReadonlySet<string>>(new Set())

  // ── Announcement permission gate (REAL check — no fake grants) ────────
  // The teachers-store position system is the same permission source that
  // gates the teacher nav (teacher-panel + nav-registry). The session
  // teacher is resolved exactly like teacher-panel does for the demo
  // teacher preview. 'announcements' is granted by positions such as
  // Cultural Coordinator — normal teachers do NOT have it.
  const { teachers, positionsList } = useTeachersStore()
  const currentTeacher = teachers.find((t) => t.id === 'T-014') || teachers[0]
  const isRelieved =
    currentTeacher != null &&
    ((currentTeacher.status as string) === 'Relieved' ||
      currentTeacher.status === 'Suspended' ||
      (currentTeacher.status as string) === 'Terminated')
  const activePermissions = useMemo(
    () =>
      currentTeacher && !isRelieved
        ? getTeacherActivePermissions(currentTeacher, positionsList)
        : [],
    [currentTeacher, isRelieved, positionsList],
  )
  const canAnnounce = activePermissions.includes('announcements')

  const openParentConnect = useCallback(() => {
    onNavigate?.('parent-connect')
  }, [onNavigate])

  const isRead = useCallback(
    (a: CommunicationAnnouncement) => a.readAt != null || readOverrides.has(a.id),
    [readOverrides],
  )

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await markAnnouncementRead(id)
      setReadOverrides((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
    } catch (e) {
      toast.error('Could not mark as read', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }, [])

  // ── First load: skeleton · error without data: quiet retry state ─────
  if (loading && !data) {
    return (
      <PageTransition className="space-y-4">
        <HubModuleSkeleton />
      </PageTransition>
    )
  }

  if (!data) {
    return (
      <PageTransition className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SKELETON_STATS.map((s) => (
            <HubStatCardSkeleton key={s.key} />
          ))}
        </div>
        <HubSectionError message={error ?? 'Communication Hub could not load.'} onRetry={reload} />
      </PageTransition>
    )
  }

  const stats = data.stats
  const unreadAnnouncements = data.announcements.filter((a) => !isRead(a)).length

  const summaryStats: HubStat[] = [
    {
      key: 'unread',
      label: 'Unread Messages',
      value: stats.unreadMessages,
      context:
        stats.unreadMessages > 0
          ? `${stats.unreadParentMessages} from parents · ${stats.unreadDirectMessages} direct`
          : 'all caught up',
      icon: MailOpen,
      tone: 'emerald',
    },
    {
      key: 'announcements',
      label: 'Announcements',
      value: stats.announcements,
      context: `${unreadAnnouncements} unread`,
      icon: Megaphone,
      tone: 'sky',
    },
    {
      key: 'sent',
      label: 'Messages Sent',
      value: stats.messagesSent,
      context: `${stats.messagesSentToParents} to parents · ${stats.messagesSentDirect} direct`,
      icon: Send,
      tone: 'violet',
    },
    {
      key: 'awaiting',
      label: 'Awaiting Reply',
      value: stats.awaitingReply,
      context:
        stats.openFollowUps > 0
          ? `${stats.openFollowUps} follow-ups open`
          : `${stats.conversations} conversations`,
      icon: Reply,
      tone: 'amber',
    },
  ]

  const toolbarActions = (
    <div className="flex items-center gap-2">
      <button onClick={() => setMessageOpen(true)} className={OUTLINE_ACTION_CLASS}>
        <Send className="h-3.5 w-3.5" aria-hidden="true" />
        Message Parent
      </button>
      {canAnnounce && (
        <button onClick={() => setAnnouncementOpen(true)} className={PRIMARY_ACTION_CLASS}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New Announcement
        </button>
      )}
    </div>
  )

  return (
    <PageTransition className="space-y-4">
      <ModuleToolbar
        context={`${data.teacher.scopeLabel} · ${data.students.length} guardians reachable`}
        action={toolbarActions}
      />

      {error && <HubSectionError message={error} onRetry={reload} />}

      <HubStatCards stats={summaryStats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConversationsPreviewCard
          conversations={data.conversations}
          total={data.totalConversations}
          onOpenParentConnect={openParentConnect}
          onMessageParent={() => setMessageOpen(true)}
        />
        <AnnouncementsCard
          announcements={data.announcements}
          isRead={isRead}
          onMarkRead={handleMarkRead}
          onNewAnnouncement={canAnnounce ? () => setAnnouncementOpen(true) : undefined}
        />
      </div>

      <SentMessagesCard messages={data.sentMessages} onMessageParent={() => setMessageOpen(true)} />

      {data.conversations.length === 0 && data.announcements.length === 0 && (
        <HubEmptyState
          icon={MailOpen}
          title="Nothing in your communication workspace yet"
          hint="School announcements and parent conversations will appear here as they happen."
        />
      )}

      <MessageParentDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        students={data.students}
        templates={data.templates}
        teacherName={data.teacher.name}
        onSent={reload}
      />

      {canAnnounce && (
        <CreateAnnouncementDialog
          open={announcementOpen}
          onOpenChange={setAnnouncementOpen}
          classLabels={data.teacher.classLabels}
          onPublished={reload}
        />
      )}
    </PageTransition>
  )
}
