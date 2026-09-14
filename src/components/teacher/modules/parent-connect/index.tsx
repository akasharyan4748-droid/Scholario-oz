'use client'

/**
 * parent-connect/index — the Parent Connect module composition.
 *
 * Top → bottom: quiet context toolbar (the app bar already carries the
 * module name), 4 honest summary cards, the two-pane conversation workspace
 * inside one GlassCard (master-detail below lg), and the open follow-ups
 * card. All data comes from /api/teacher/parent-connect* — the server
 * resolves the teacher, her school and her class-teacher scope.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlarmClock, Loader2, MailOpen, MessageSquareHeart, MessagesSquare, Plus, Reply } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '@/components/teacher/teacher-panel/module-toolbar'
import {
  HubEmptyState,
  HubModuleSkeleton,
  HubSectionError,
  HubStatCards,
  HubStatCardSkeleton,
  type HubStat,
} from '@/components/teacher/modules/shared/hub-stat-cards'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/format'
import { useFocusStore } from '@/lib/store/focus-store'
import { useTeacherHubStore } from '@/lib/store/teacher-hub-store'
import type { ConversationSummary, FollowUpItem, ThreadMessage } from '@/lib/teacher-hub-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ConversationList } from './conversation-list'
import { FollowUpDialog, type FollowUpContext } from './follow-up-dialog'
import { patchConversation, updateFollowUp, useParentConnect, useThread } from './hooks'
import { NewConversationDialog } from './new-conversation-dialog'
import { dateInputValue, dueChip, PRIORITY_DOT, sortConversations } from './shared'
import { ThreadView } from './thread-view'

const ACTIVE_WINDOW_MS = 21 * 86_400_000

/** Placeholder shapes so the skeleton row matches the real card layout. */
const SKELETON_STATS: HubStat[] = [
  { key: 'total', label: 'Conversations', value: null, icon: MessagesSquare, tone: 'sky' },
  { key: 'unread', label: 'Unread', value: null, icon: MailOpen, tone: 'emerald' },
  { key: 'followups', label: 'Follow-ups', value: null, icon: AlarmClock, tone: 'amber' },
  { key: 'reply', label: 'Reply rate', value: null, icon: Reply, tone: 'violet' },
]

export function ParentConnectModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { data, loading, error, reload } = useParentConnect()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpCtx, setFollowUpCtx] = useState<FollowUpContext | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUpItem | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const thread = useThread(selectedId)

  // Local list state — synced from the server payload after every load.
  useEffect(() => {
    if (data) setConversations(data.conversations)
  }, [data])

  // Publish live counts for the sidebar badge after every load AND after
  // every local change (thread opened → unread cleared).
  useEffect(() => {
    if (!data) return
    useTeacherHubStore.getState().setCounts({
      parentUnread: conversations.reduce((sum, c) => sum + c.unread, 0),
      followUpsOpen: data.stats.followUpsOpen,
    })
  }, [data, conversations])

  // Opening a thread marks the parent's messages read server-side — clear
  // the conversation's local unread so the row + badge follow instantly.
  useEffect(() => {
    if (!thread.thread || !selectedId) return
    setConversations((prev) => {
      const convo = prev.find((c) => c.id === selectedId)
      if (!convo || convo.unread === 0) return prev
      return prev.map((c) => (c.id === selectedId ? { ...c, unread: 0 } : c))
    })
  }, [thread.thread, selectedId])

  // Focus deep-links from the command palette — consumed once on mount.
  const focusConsumed = useRef(false)
  useEffect(() => {
    if (focusConsumed.current || !data) return
    focusConsumed.current = true
    const focus = useFocusStore.getState().focus
    if (!focus || focus.moduleKey !== 'parent-connect' || focus.type !== 'parent') return
    let target: string | null = null
    if (focus.id.startsWith('pcv-')) {
      target = focus.id.slice(4)
    } else if (focus.id.startsWith('grd-')) {
      const studentId = focus.id.slice(4)
      target = data.conversations.find((c) => c.student.id === studentId)?.id ?? null
    }
    // Cross-layer fallback: instant local search rows carry mock-roster ids —
    // match by the ward's name in the subtitle ("Guardian of X · …").
    if (!target && focus.subtitle) {
      const m = /guardian of ([^·]+)/i.exec(focus.subtitle)
      if (m) {
        const wardName = m[1].trim().toLowerCase()
        target =
          data.conversations.find((c) => c.student.name.toLowerCase() === wardName)?.id ?? null
      }
    }
    if (target) setSelectedId(target)
    useFocusStore.getState().clearFocus()
  }, [data])

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  // ── handlers ─────────────────────────────────────────────────────────

  const handleSent = useCallback((conversationId: string, message: ThreadMessage) => {
    setConversations((prev) =>
      sortConversations(
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessageAt: message.createdAt,
                lastMessage: {
                  body: message.body,
                  fromTeacher: true,
                  createdAt: message.createdAt,
                },
              }
            : c,
        ),
      ),
    )
  }, [])

  const handleTogglePin = useCallback(
    async (conversationId: string, pinned: boolean) => {
      setConversations((prev) =>
        sortConversations(prev.map((c) => (c.id === conversationId ? { ...c, pinned } : c))),
      )
      try {
        await patchConversation(conversationId, { pinned })
      } catch (e) {
        toast.error('Could not update the conversation', {
          description: e instanceof Error ? e.message : undefined,
        })
        reload()
      }
    },
    [reload],
  )

  const handleMarkFollowUp = useCallback((ctx: FollowUpContext) => {
    setFollowUpCtx(ctx)
    setFollowUpOpen(true)
  }, [])

  const handleFollowUpCreated = useCallback(() => {
    setFollowUpOpen(false)
    reload()
  }, [reload])

  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      setNewDialogOpen(false)
      setSelectedId(conversationId)
      reload()
    },
    [reload],
  )

  const handleSelectExisting = useCallback((conversationId: string) => {
    setNewDialogOpen(false)
    setSelectedId(conversationId)
  }, [])

  const handleComplete = useCallback(
    async (followUp: FollowUpItem) => {
      setCompletingId(followUp.id)
      try {
        await updateFollowUp(followUp.id, { status: 'done' })
        toast.success('Follow-up completed', { description: followUp.reason })
        reload()
      } catch (e) {
        toast.error('Could not complete the follow-up', {
          description: e instanceof Error ? e.message : undefined,
        })
      } finally {
        setCompletingId(null)
      }
    },
    [reload],
  )

  const openReschedule = useCallback((followUp: FollowUpItem) => {
    setRescheduleTarget(followUp)
    setRescheduleDate(followUp.dueDate.slice(0, 10))
  }, [])

  const handleReschedule = useCallback(async () => {
    if (!rescheduleTarget || !rescheduleDate) return
    setRescheduling(true)
    try {
      await updateFollowUp(rescheduleTarget.id, { dueDate: rescheduleDate })
      toast.success('Follow-up rescheduled', { description: `Due ${formatDate(rescheduleDate)}` })
      setRescheduleTarget(null)
      reload()
    } catch (e) {
      toast.error('Could not reschedule the follow-up', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setRescheduling(false)
    }
  }, [rescheduleDate, rescheduleTarget, reload])

  const openConversation = useCallback(
    (conversationId: string) => {
      if (conversations.some((c) => c.id === conversationId)) setSelectedId(conversationId)
    },
    [conversations],
  )

  // ── render ───────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <PageTransition className="space-y-4">
        <HubModuleSkeleton />
      </PageTransition>
    )
  }

  if (!data) {
    // Quiet inline error with retry — never a full-page dead-end.
    return (
      <PageTransition className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SKELETON_STATS.map((s) => (
            <HubStatCardSkeleton key={s.key} />
          ))}
        </div>
        <HubSectionError message={error ?? 'Parent Connect could not load.'} onRetry={reload} />
      </PageTransition>
    )
  }

  const stats = data.stats
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0)
  const activeCount = conversations.filter(
    (c) => c.lastMessageAt != null && Date.parse(c.lastMessageAt) >= Date.now() - ACTIVE_WINDOW_MS,
  ).length

  const summaryStats: HubStat[] = [
    {
      key: 'total',
      label: 'Conversations',
      value: conversations.length,
      context: `${activeCount} active`,
      icon: MessagesSquare,
      tone: 'sky',
    },
    {
      key: 'unread',
      label: 'Unread',
      value: unreadTotal,
      context: unreadTotal > 0 ? 'awaiting your reply' : 'all caught up',
      icon: MailOpen,
      tone: 'emerald',
    },
    {
      key: 'followups',
      label: 'Follow-ups',
      value: stats.followUpsOpen,
      context: `${stats.followUpsDue} due today`,
      icon: AlarmClock,
      tone: 'amber',
    },
    {
      key: 'reply',
      label: 'Reply rate',
      value: stats.replyRate == null ? '—' : `${stats.replyRate}%`,
      context: 'parent-initiated threads',
      icon: Reply,
      tone: 'violet',
    },
  ]

  const newMessageButton = (
    <button
      onClick={() => setNewDialogOpen(true)}
      className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      New Message
    </button>
  )

  return (
    <PageTransition className="space-y-4">
      <ModuleToolbar
        context={`${data.teacher.name} · Class Teacher · ${data.teacher.classLabel} · ${data.students.length} parents connected`}
        action={newMessageButton}
      />

      {error && <HubSectionError message={error} onRetry={reload} />}

      <HubStatCards stats={summaryStats} />

      {/* Two-pane workspace */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="grid h-[540px] lg:h-[600px] lg:grid-cols-[340px_1fr]">
          <div
            className={cn(
              'flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r',
              selectedId && 'hidden lg:flex',
            )}
          >
            <ConversationList
              conversations={conversations}
              activeId={selectedId}
              onSelect={setSelectedId}
              onNewMessage={() => setNewDialogOpen(true)}
            />
          </div>
          <div className={cn('flex min-h-0 flex-col', !selectedId && 'hidden lg:flex')}>
            {selectedId ? (
              <ThreadView
                conversationId={selectedId}
                summary={selected}
                thread={thread.thread}
                loading={thread.loading}
                error={thread.error}
                onRetry={thread.reload}
                onBack={() => setSelectedId(null)}
                onNavigate={onNavigate}
                teacherName={data.teacher.name}
                templates={data.templates}
                onSent={handleSent}
                onTogglePin={(id, pinned) => void handleTogglePin(id, pinned)}
                onMarkFollowUp={handleMarkFollowUp}
              />
            ) : (
              <HubEmptyState
                icon={MessageSquareHeart}
                title="Select a conversation"
                hint="Choose a parent thread from the list to read and reply."
                className="h-full"
              />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Open follow-ups */}
      {data.followUps.length > 0 && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Follow-ups
            </p>
          </div>
          <div className="divide-y divide-border/60">
            {data.followUps.map((f) => {
              const chip = dueChip(f.dueDate)
              const threadId = f.conversationId
              return (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    {threadId ? (
                      <button
                        onClick={() => openConversation(threadId)}
                        className="max-w-full text-left"
                        title="Open conversation"
                      >
                        <p className="truncate text-sm font-medium hover:text-primary">
                          {f.student?.name ?? 'Follow-up'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{f.reason}</p>
                      </button>
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{f.student?.name ?? 'Follow-up'}</p>
                        <p className="truncate text-xs text-muted-foreground">{f.reason}</p>
                      </div>
                    )}
                  </div>
                  <span className={chip.className}>{chip.label}</span>
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[f.priority])}
                    title={`${f.priority} priority`}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => void handleComplete(f)}
                      disabled={completingId === f.id}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                    >
                      {completingId === f.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        'Complete'
                      )}
                    </button>
                    <button
                      onClick={() => openReschedule(f)}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Dialogs */}
      <NewConversationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        students={data.students}
        templates={data.templates}
        teacherName={data.teacher.name}
        onSelectExisting={handleSelectExisting}
        onCreated={handleConversationCreated}
      />

      <FollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        context={followUpCtx}
        onCreated={handleFollowUpCreated}
      />

      <Dialog
        open={rescheduleTarget != null}
        onOpenChange={(o) => {
          if (!o) setRescheduleTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Reschedule follow-up</DialogTitle>
            <DialogDescription className="text-xs">
              {rescheduleTarget?.reason}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="fu-reschedule-date">New due date</Label>
            <Input
              id="fu-reschedule-date"
              type="date"
              value={rescheduleDate}
              min={dateInputValue(0)}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setRescheduleTarget(null)}
              disabled={rescheduling}
              className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleReschedule()}
              disabled={!rescheduleDate || rescheduling}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {rescheduling && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Save Date
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
