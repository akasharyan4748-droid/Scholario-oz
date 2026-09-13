'use client'

/**
 * GroupsTab — Study Groups (spec §36/§37/§38).
 *
 * YOUR GROUPS: the demo student's joined groups — real member stacks
 * (Class 2-A roster names), an honest activity hint derived from the
 * Q&A + share data for that subject, and an [Open] drill-down that
 * surfaces the subject's recent questions and shared resources
 * (links into the Q&A forum — a forum drill-down, never a chat §42).
 *
 * DISCOVER: un-joined class groups with a working [Join]/[Leave]
 * membership toggle (toggleJoin). [+ New Group] creates class-scoped
 * groups only (§38 — creation permitted at class visibility).
 *
 * Every member count / activity date derives from the store arrays.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, MessageCircle, Plus, UserPlus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { TypeChip } from '../resources/type-meta'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentLearningStore } from '@/lib/store/student-learning-store'
import {
  displayOf,
  lastActivityIsoFor,
  useStudentGroupsStore,
  type StudyGroup,
} from '@/lib/store/student-groups-store'
import { BTN_EMERALD, BTN_GHOST, InitialCircle, MemberStack } from './shared'
import { CreateGroupModal } from './create-group-modal'

interface GroupsTabProps {
  /** Contextual link (§42): opens a question thread in the Q&A tab. */
  onOpenQuestion: (questionId: string) => void
}

export function GroupsTab({ onOpenQuestion }: GroupsTabProps) {
  const groups = useStudentGroupsStore((s) => s.groups)
  const questions = useStudentGroupsStore((s) => s.questions)
  const shares = useStudentGroupsStore((s) => s.shares)
  const toggleJoin = useStudentGroupsStore((s) => s.toggleJoin)
  const resources = useStudentLearningStore((s) => s.resources)

  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const joined = useMemo(() => groups.filter((g) => g.joined), [groups])
  const discover = useMemo(() => groups.filter((g) => !g.joined), [groups])

  // Subject → shares (resolved through the learning store's resources).
  const sharesOfSubject = useMemo(() => {
    const map = new Map<string, typeof shares>()
    for (const sh of shares) {
      const subject = resources.find((r) => r.id === sh.resourceId)?.subject
      if (!subject) continue
      map.set(subject, [...(map.get(subject) ?? []), sh])
    }
    return map
  }, [shares, resources])

  const join = (g: StudyGroup) => {
    toggleJoin(g.id)
    toast.success(`Joined ${g.name}`, { description: 'Visible to your class only · your teacher moderates this space.' })
  }

  const leave = (g: StudyGroup) => {
    toggleJoin(g.id)
    setConfirmLeaveId(null)
    toast.success(`Left ${g.name}`, { description: 'You can rejoin anytime from Discover.' })
  }

  return (
    <motion.div
      key="gr"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* ── YOUR GROUPS ── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel hint={groups.length > 0 ? `${joined.length} of ${groups.length} joined` : undefined}>
            Your groups
          </SectionLabel>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New group
          </button>
        </div>

        {joined.length === 0 ? (
          <GlassCard hover={false} className="on-card px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No groups available yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Join one from Discover below, or create your own — it stays within Class 2-A.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {joined.map((g, i) => {
              const sc = subjectColor(g.subject)
              const subjectShares = sharesOfSubject.get(g.subject) ?? []
              const lastIso = lastActivityIsoFor(g, questions, subjectShares)
              const isFresh = lastIso === g.createdOn
              const expanded = openId === g.id
              const subjectQuestions = questions
                .filter((q) => q.subject === g.subject)
                .sort((a, b) => (a.askedOn < b.askedOn ? 1 : -1))
                .slice(0, 3)
              const subjectShareRows = subjectShares.slice(0, 3)
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.2), duration: 0.2 }}
                >
                  <GlassCard hover={false} className="on-card flex h-full flex-col p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold', sc.bg, sc.text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                        {g.subject}
                      </span>
                      <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{g.topic}</span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold leading-snug">{g.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{g.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <MemberStack names={g.memberNames} />
                      <span className="text-[11px] text-muted-foreground">
                        {g.memberNames.length} member{g.memberNames.length === 1 ? '' : 's'} · Class 2-A
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Created by {displayOf(g.createdBy)} · {isFresh ? `new · ${formatRelativeTime(g.createdOn)}` : `Active ${formatRelativeTime(lastIso ?? g.createdOn)}`}
                    </p>

                    {/* Footer — expand / leave */}
                    <div className="mt-3 flex items-center gap-1 border-t border-border/60 pt-3">
                      <button
                        type="button"
                        onClick={() => setOpenId(expanded ? null : g.id)}
                        aria-expanded={expanded}
                        aria-controls={`group-${g.id}-detail`}
                        className="inline-flex h-11 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
                      >
                        {expanded ? 'Close' : 'Open'}
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} aria-hidden />
                      </button>
                      {confirmLeaveId === g.id ? (
                        <span className="ml-auto flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Leave {g.name}?</span>
                          <button
                            type="button"
                            onClick={() => leave(g)}
                            className="inline-flex h-11 items-center rounded-lg bg-amber-500/10 px-2.5 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:text-amber-400 sm:h-9"
                          >
                            Yes, leave
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmLeaveId(null)}
                            className="inline-flex h-11 items-center rounded-lg px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
                          >
                            Keep
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmLeaveId(g.id)}
                          className={cn(BTN_GHOST, 'ml-auto')}
                          aria-label={`Leave ${g.name}`}
                        >
                          Leave
                        </button>
                      )}
                    </div>

                    {/* Drill-down — the subject's real questions + shares (NOT a chat §42) */}
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          id={`group-${g.id}-detail`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">Recent questions · {g.subject}</p>
                              {subjectQuestions.length === 0 ? (
                                <p className="mt-1.5 text-[11px] text-muted-foreground">No questions in {g.subject} yet.</p>
                              ) : (
                                <ul className="mt-1.5 space-y-1">
                                  {subjectQuestions.map((q) => (
                                    <li key={q.id}>
                                      <button
                                        type="button"
                                        onClick={() => onOpenQuestion(q.id)}
                                        aria-label={`Open question: ${q.title}`}
                                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                                        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">{q.title}</span>
                                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                          {q.answers.length} answer{q.answers.length === 1 ? '' : 's'}
                                        </span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">Shared with the class</p>
                              {subjectShareRows.length === 0 ? (
                                <p className="mt-1.5 text-[11px] text-muted-foreground">No shared resources for {g.subject} yet.</p>
                              ) : (
                                <ul className="mt-1.5 space-y-1.5">
                                  {subjectShareRows.map((sh) => {
                                    const resource = resources.find((r) => r.id === sh.resourceId)
                                    return (
                                      <li key={sh.id} className="flex items-center gap-2 px-2 py-1">
                                        {resource && <TypeChip type={resource.type} />}
                                        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
                                          {resource?.title ?? 'Resource no longer available'}
                                        </span>
                                        <span className="shrink-0 text-[10px] text-muted-foreground">by {displayOf(sh.sharedByName)}</span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── DISCOVER ── */}
      <section className="space-y-3">
        <SectionLabel hint={discover.length > 0 ? `${discover.length} to join` : undefined}>Discover</SectionLabel>
        {discover.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">You have joined every Class 2-A group.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {discover.map((g, i) => {
              const sc = subjectColor(g.subject)
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.2), duration: 0.2 }}
                >
                  <GlassCard hover={false} className="on-card flex h-full flex-col p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold', sc.bg, sc.text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                        {g.subject}
                      </span>
                      <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{g.topic}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold leading-snug">{g.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{g.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <MemberStack names={g.memberNames} />
                      <span className="text-[11px] text-muted-foreground">
                        {g.memberNames.length} member{g.memberNames.length === 1 ? '' : 's'} · Class 2-A
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <InitialCircle name={g.createdBy} className="h-5 w-5 text-[8px]" />
                        Created by {displayOf(g.createdBy)}
                      </span>
                      <button type="button" onClick={() => join(g)} className={BTN_EMERALD}>
                        <UserPlus className="h-3.5 w-3.5" aria-hidden />
                        Join
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </motion.div>
  )
}
