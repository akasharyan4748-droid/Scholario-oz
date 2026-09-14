'use client'

/**
 * StudentNotificationsModule — a data-driven notification feed DERIVED
 * from real sources (no fabricated random items):
 *
 *   Exams            → mock academics `exams` (Scheduled)
 *   Fee reminder     → students-store STU-58 (feeStatus ≠ Paid)
 *   Library overdue  → library-store issues (borrower STU-58, Overdue)
 *   New messages     → student-messaging store unread conversations
 *   School news      → mock operations `announcements` (first 3)
 *   Timetable        → timetable-store publications (≤72h, affects the
 *                      student's class) — one notification per publication,
 *                      so the same event is never duplicated.
 *
 * Read state + "Mark all read" persist in the shared student-notif-prefs
 * store (the channel switches live in Settings). `onNavigate` (optional)
 * deep-links each item to its module where one exists.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, Award, IndianRupee, Library, MessageCircle,
  Megaphone, CheckCheck, ChevronRight, Inbox, CalendarDays,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatRelativeTime, formatDate, formatINR } from '@/lib/format'
import { exams } from '@/lib/mock/academics'
import { announcements } from '@/lib/mock/operations'
import { useStudentsStore, type StudentRecord } from '@/lib/store/students-store'
import { useLibraryStore, type IssueRecord } from '@/lib/store/library-store'
import {
  useStudentMessagingStore, countUnreadConversations, isConversationUnread,
  type StudentConversation,
} from '@/lib/store/student-messaging-store'
import { useStudentNotifPrefsStore } from '@/lib/store/student-notif-prefs-store'
import { useTimetableStore, getRecentChangesForClass, type PublishedVersion } from '@/lib/store/timetable-store'
import { toast } from 'sonner'
import { DEMO_STUDENT_ID } from '../applications/student'

// ─── Types ───────────────────────────────────────────────────────────

export type StudentNotificationTarget =
  | 'results' | 'fees'
  | 'messages' | 'announcements' | 'timetable'

export type StudentNotificationKind =
  | 'exam' | 'fee' | 'library' | 'message' | 'announcement' | 'timetable'

export interface StudentNotificationItem {
  id: string
  kind: StudentNotificationKind
  title: string
  description: string
  /** Event timestamp (ISO). Standing reminders carry a label instead. */
  at?: string
  /** Label shown instead of a relative time (e.g. 'This term'). */
  standing?: string
  target?: StudentNotificationTarget
}

interface BuildDeps {
  student: StudentRecord | undefined
  issues: IssueRecord[]
  conversations: StudentConversation[]
  seenAt: Record<string, string>
  publications: PublishedVersion[]
}

// ─── Derivation (single source of truth for feed + badge) ───────────

export function buildStudentNotifications({ student, issues, conversations, seenAt, publications }: BuildDeps): StudentNotificationItem[] {
  const items: StudentNotificationItem[] = []

  // Timetable — ONE notification per recent publication (≤72h) whose
  // changes affect the student's class. Same TTL as the timetable's
  // "Updated" chips; the id is keyed by version so the same event is
  // never duplicated in the feed.
  if (student) {
    const myClass = `${student.className}-${student.section}`
    for (const pub of publications) {
      if (Date.now() >= new Date(pub.publishedAt).getTime() + 72 * 60 * 60 * 1000) continue
      const affecting = getRecentChangesForClass(myClass, [pub])
      if (affecting.length === 0) continue
      const first = affecting[0]
      items.push({
        id: `tt-pub-${pub.version}`,
        kind: 'timetable',
        title: 'Your class timetable was updated',
        description:
          affecting.length === 1 && first.changeLabel
            ? `${first.context.split(' · ')[1] ?? first.context} — ${first.changeLabel}`
            : `${affecting.length} changes published by your school`,
        at: pub.publishedAt,
        target: 'timetable',
      })
    }
  }

  // Exams — Scheduled announcements
  for (const e of exams.filter((x) => x.status === 'Scheduled')) {
    items.push({
      id: `exam-${e.id}`,
      kind: 'exam',
      title: `${e.name} — schedule announced`,
      description: `${e.type} · ${formatDate(e.startDate)} to ${formatDate(e.endDate)} · ${e.classes.join(', ')}`,
      at: e.startDate,
      target: 'results',
    })
  }

  // Fee reminder — standing, derived from the canonical student record
  if (student && student.feeStatus !== 'Paid') {
    const pending = Math.max(0, student.feeTotal - student.feePaid)
    items.push({
      id: `fee-${student.id}`,
      kind: 'fee',
      title: 'Fee reminder',
      description: `${formatINR(pending)} pending of ${formatINR(student.feeTotal)} (${student.feeStatus})`,
      standing: 'This term',
      target: 'fees',
    })
  }

  // Library — the student's own overdue issues (with fine). Informational
  // only (no target): the dedicated student Library module was retired in
  // the 2.9 workspace cut — returns/fines settle at the counter.
  if (student) {
    for (const i of issues.filter((x) => x.borrowerId === student.id && x.status === 'Overdue')) {
      items.push({
        id: `lib-${i.id}`,
        kind: 'library',
        title: `Library book overdue — ${i.bookTitle}`,
        description: `Was due ${formatDate(i.dueDate)} · fine ${formatINR(i.fine)}`,
        at: i.dueDate,
      })
    }
  }

  // New messages — one notification while any conversation is unread
  const unread = countUnreadConversations(conversations, seenAt)
  if (unread > 0) {
    const latestUnreadAt = conversations.reduce<string | undefined>((acc, c) => {
      if (!isConversationUnread(c, seenAt)) return acc
      return !acc || c.lastOn > acc ? c.lastOn : acc
    }, undefined)
    items.push({
      id: 'msg-unread',
      kind: 'message',
      title: 'New message from teacher',
      description: `${unread} unread conversation${unread > 1 ? 's' : ''} — open Messages`,
      at: latestUnreadAt,
      target: 'messages',
    })
  }

  // School announcements — first 3
  for (const a of announcements.slice(0, 3)) {
    items.push({
      id: `ann-${a.id}`,
      kind: 'announcement',
      title: a.title,
      description: `${a.category} · posted by ${a.postedBy}`,
      at: a.date,
      target: 'announcements',
    })
  }

  // Newest first; standing reminders (no timestamp) sort last.
  return items.sort((a, b) => (b.at ? new Date(b.at).getTime() : 0) - (a.at ? new Date(a.at).getTime() : 0))
}

/** Nav-badge helper — unread derived notifications (not in readIds). */
export function useUnreadStudentNotificationCount(): number {
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))
  const issues = useLibraryStore((s) => s.issues)
  const conversations = useStudentMessagingStore((s) => s.conversations)
  const seenAt = useStudentMessagingStore((s) => s.seenAt)
  const publications = useTimetableStore((s) => s.publications)
  const readIds = useStudentNotifPrefsStore((s) => s.readIds)
  return useMemo(() => {
    const items = buildStudentNotifications({ student, issues, conversations, seenAt, publications })
    return items.filter((i) => !readIds.includes(i.id)).length
  }, [student, issues, conversations, seenAt, publications, readIds])
}

// ─── Presentation meta ───────────────────────────────────────────────

const KIND_META: Record<StudentNotificationKind, { icon: typeof Bell; gradient: string; label: string }> = {
  exam: { icon: Award, gradient: 'from-amber-500 to-orange-600', label: 'Exam' },
  fee: { icon: IndianRupee, gradient: 'from-rose-500 to-pink-600', label: 'Fees' },
  library: { icon: Library, gradient: 'from-teal-600 to-emerald-700', label: 'Library' },
  message: { icon: MessageCircle, gradient: 'from-green-500 to-emerald-600', label: 'Messages' },
  announcement: { icon: Megaphone, gradient: 'from-orange-500 to-amber-600', label: 'School' },
  timetable: { icon: CalendarDays, gradient: 'from-cyan-500 to-sky-600', label: 'Timetable' },
}

// ─── Module ──────────────────────────────────────────────────────────

export function StudentNotificationsModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))
  const issues = useLibraryStore((s) => s.issues)
  const publications = useTimetableStore((s) => s.publications)
  const conversations = useStudentMessagingStore((s) => s.conversations)
  const seenAt = useStudentMessagingStore((s) => s.seenAt)
  const readIds = useStudentNotifPrefsStore((s) => s.readIds)
  const markRead = useStudentNotifPrefsStore((s) => s.markRead)
  const markAllRead = useStudentNotifPrefsStore((s) => s.markAllRead)

  const items = useMemo(
    () => buildStudentNotifications({ student, issues, conversations, seenAt, publications }),
    [student, issues, conversations, seenAt, publications],
  )
  const unreadItems = items.filter((i) => !readIds.includes(i.id))

  const handleMarkAllRead = () => {
    markAllRead(items.map((i) => i.id))
    toast.success('All notifications marked as read')
  }

  const handleItemClick = (item: StudentNotificationItem) => {
    markRead(item.id)
    if (item.target && onNavigate) onNavigate(item.target)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Notifications"
        subtitle="Everything that needs your attention — exams, fees, library & school news"
        icon={<Bell className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={`${items.length} items`} variant="primary" dot />
            {unreadItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
          </div>
        }
      />

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" /> Your Feed
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {unreadItems.length} new
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Derived live from exams, fees, library, messages, timetable & announcements
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Nothing needs your attention right now — you are all caught up.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            {items.map((item, i) => {
              const meta = KIND_META[item.kind]
              const Icon = meta.icon
              const isUnread = !readIds.includes(item.id)
              const time = item.standing ?? (item.at ? formatRelativeTime(item.at) : '')
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                >
                  <div
                    role={item.target ? 'button' : undefined}
                    tabIndex={item.target ? 0 : undefined}
                    onClick={() => handleItemClick(item)}
                    onKeyDown={(e) => {
                      if (item.target && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        handleItemClick(item)
                      }
                    }}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3 transition-colors',
                      isUnread ? 'border-primary/25 bg-primary/5' : 'border-border bg-card/40',
                      item.target && 'cursor-pointer hover:border-primary/40 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring/40',
                    )}
                  >
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
                      meta.gradient,
                      !isUnread && 'opacity-60',
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm truncate', isUnread ? 'font-semibold' : 'font-medium text-muted-foreground')}>
                          {item.title}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-label="Unread" />
                        )}
                      </div>
                      <p className={cn('text-[11px] mt-0.5 leading-relaxed', isUnread ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                          {meta.label}
                        </span>
                        {time && (
                          <>
                            <span className="text-border">·</span>
                            <span className="text-[10px] text-muted-foreground/70">{time}</span>
                          </>
                        )}
                        {item.target && (
                          <>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary group-hover:underline">
                              View <ChevronRight className="h-3 w-3" />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
