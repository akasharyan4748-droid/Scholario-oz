'use client'

/**
 * Learning (L2D) — Study Groups tab (spec §26-29): academic identity ONLY —
 * group name, subject, real member counts, published questions and shared
 * resources. No rankings, no helpfulness scores, no "Super Helper", no
 * streaks — student learning is not a popularity contest. Questions asked
 * by the student land in PENDING state and show an honest "Pending
 * moderation" chip until a teacher publishes them; authors carry
 * school-scoped identity only (name + class label — never contact details).
 */

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Users, ArrowLeft, AlertTriangle, RotateCcw, MessageCircle, Share2,
  Loader2, Send, Clock, BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiFetch, apiPost } from './api'
import { ResourceDetailDialog } from './resource-detail'
import { categoryMeta, materialMetaLine } from './resource-shared'
import type { LearningMaterialCard, StudyGroupDetail, StudyGroupSummary } from './types'

// ─── Shared states ───────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">Couldn&apos;t load study groups</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
      </Button>
    </div>
  )
}

function GroupsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading study groups">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Group card (list view) ──────────────────────────────────────────

function GroupCard({ group, index, onOpen }: {
  group: StudyGroupSummary
  index: number
  onOpen: (id: string) => void
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      onClick={() => onOpen(group.id)}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 text-left shadow-2xs transition-shadow hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label={`Open ${group.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-primary">
          <Users className="h-4 w-4" aria-hidden />
        </span>
        {group.isMember && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            Member
          </span>
        )}
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
        {group.name}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {group.subjectName ?? 'All subjects'} · {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
      </p>
      {group.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
          {group.description}
        </p>
      )}
    </motion.button>
  )
}

// ─── Question row ────────────────────────────────────────────────────

function QuestionRow({ q }: { q: StudyGroupDetail['questions'][number] }) {
  const pending = q.status === 'pending'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-lg border px-3.5 py-3',
        pending ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-border/70 bg-card/60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">
          {q.isMine ? 'You' : q.author?.name ?? 'Student'}
          {!q.isMine && q.author?.classLabel ? ` · ${q.author.classLabel}` : ''}
        </p>
        <span className="text-[10px] text-muted-foreground/60">
          {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{q.question}</p>
      {pending && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
          <Clock className="h-3 w-3" aria-hidden /> Pending moderation
        </span>
      )}
    </motion.div>
  )
}

// ─── Groups tab ──────────────────────────────────────────────────────

export function GroupsTab() {
  const [groups, setGroups] = useState<StudyGroupSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Detail view state
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<StudyGroupDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Ask-question form
  const [questionText, setQuestionText] = useState('')
  const [asking, setAsking] = useState(false)

  // Detail dialog for shared resources
  const [resource, setResource] = useState<LearningMaterialCard | null>(null)

  // Propagate card changes (bookmark/completion) into the group's shared
  // resources + the open dialog — defined BEFORE the early returns (hooks
  // must run in the same order on every render).
  const applyResourceChange = useCallback((changed: LearningMaterialCard) => {
    setDetail((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sharedResources: prev.sharedResources.map((m) => (m.id === changed.id ? changed : m)),
      }
    })
    setResource((prev) => (prev && prev.id === changed.id ? changed : prev))
  }, [])

  // ── Groups list ──
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    setError(null)
    apiFetch<{ groups: StudyGroupSummary[] }>('/api/student/study-groups', { signal: controller.signal })
      .then((d) => { if (!cancelled) setGroups(d.groups) })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setError(e instanceof Error ? e.message : 'Could not load study groups.')
      })
    return () => { cancelled = true; controller.abort() }
  }, [reloadKey])

  // ── Group detail ──
  useEffect(() => {
    if (!detailId) { setDetail(null); setDetailError(null); return }
    const controller = new AbortController()
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    apiFetch<StudyGroupDetail>(`/api/student/study-groups/${detailId}`, { signal: controller.signal })
      .then((d) => { if (!cancelled) setDetail(d) })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setDetailError(e instanceof Error ? e.message : 'Could not load this group.')
      })
      .finally(() => { if (!cancelled) setDetailLoading(false) })
    return () => { cancelled = true; controller.abort() }
  }, [detailId])

  const askQuestion = useCallback(async () => {
    if (!detail || asking) return
    const trimmed = questionText.trim()
    if (trimmed.length < 5 || trimmed.length > 500) return
    setAsking(true)
    try {
      const q = await apiPost<StudyGroupDetail['questions'][number]>(
        `/api/student/study-groups/${detail.group.id}/questions`,
        { question: trimmed },
      )
      setDetail((prev) => (prev ? { ...prev, questions: [q, ...prev.questions] } : prev))
      setQuestionText('')
      toast.success('Question sent', { description: 'It will appear once a teacher approves it.' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send your question.')
    } finally {
      setAsking(false)
    }
  }, [detail, asking, questionText])

  // ── List view ──
  if (!detailId) {
    if (error && !groups) {
      return <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
    }
    if (!groups) return <GroupsSkeleton />

    const mine = groups.filter((g) => g.isMember)
    const others = groups.filter((g) => !g.isMember)

    if (groups.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-border bg-card/50 px-4 py-12 text-center">
          <Users className="h-6 w-6 text-primary/60" aria-hidden />
          <p className="text-sm font-medium">No study groups yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Your teachers will add groups here.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-7">
        {mine.length > 0 && (
          <section className="space-y-3" aria-label="My groups">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" aria-hidden /> My Groups
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((g, i) => (
                <GroupCard key={g.id} group={g} index={i} onOpen={setDetailId} />
              ))}
            </div>
          </section>
        )}
        {others.length > 0 && (
          <section className="space-y-3" aria-label="More groups at school">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden /> At your school
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((g, i) => (
                <GroupCard key={g.id} group={g} index={i} onOpen={setDetailId} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // ── Detail view ──

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" size="sm"
          onClick={() => { setDetailId(null); setQuestionText('') }}
          className="h-8 gap-1.5 px-2"
          aria-label="Back to all groups"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Groups
        </Button>
      </div>

      {detailLoading && !detail ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : detailError && !detail ? (
        <ErrorState onRetry={() => setDetailId((id) => (id ? null : id))} />
      ) : detail ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={detail.group.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Group header — academic identity only (spec §27) */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-primary">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-tight">{detail.group.name}</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {detail.group.subjectName ?? 'All subjects'} · {detail.group.memberCount} member{detail.group.memberCount === 1 ? '' : 's'}
                </p>
                {detail.group.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                    {detail.group.description}
                  </p>
                )}
              </div>
            </div>

            {/* Questions (spec §29 — moderated) */}
            <section className="space-y-3" aria-label="Group questions">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MessageCircle className="h-4 w-4 text-primary" aria-hidden /> Questions
              </h3>

              {/* Ask */}
              <div className="rounded-xl border border-border bg-card p-3">
                <Textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ask your group a question…"
                  aria-label="Ask your group a question"
                  rows={2}
                  maxLength={500}
                  className="resize-none text-sm"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground/70">
                    Visible once a teacher approves it.
                  </p>
                  <Button
                    size="sm"
                    onClick={askQuestion}
                    disabled={asking || questionText.trim().length < 5}
                    className="h-8 gap-1.5"
                  >
                    {asking ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="h-3.5 w-3.5" aria-hidden />}
                    Ask
                  </Button>
                </div>
              </div>

              {detail.questions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
                  No questions yet.
                </p>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                  {detail.questions.map((q) => (
                    <QuestionRow key={q.id} q={q} />
                  ))}
                </div>
              )}
            </section>

            {/* Shared resources (authorized materials for this group) */}
            {detail.sharedResources.length > 0 && (
              <section className="space-y-3" aria-label="Shared resources">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Share2 className="h-4 w-4 text-teal-500" aria-hidden /> Shared Resources
                </h3>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {detail.sharedResources.map((m) => {
                    const meta = categoryMeta(m.category)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setResource(m)}
                        className="group flex w-full items-center gap-3 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-left transition-colors hover:bg-muted/30 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        aria-label={`Open ${m.title}`}
                      >
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border', meta.tone)}>
                          <meta.icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium">{m.title}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {materialMetaLine(m)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      ) : null}

      <ResourceDetailDialog
        material={resource}
        onClose={() => setResource(null)}
        onCardChange={applyResourceChange}
      />
    </div>
  )
}
