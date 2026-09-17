'use client'

/**
 * PendingActions — real, server-derived action queue for the Teacher
 * Dashboard. Replaces the former mock "Pending Reviews" widget (homework /
 * assignment grading) after those modules were removed from the Teacher
 * Workspace.
 *
 * Sources (existing Teacher Hub APIs, teacher-session scoped):
 *   • GET /api/teacher/parent-connect  → stats.unread + follow-ups
 *   • GET /api/teacher/behavior        → stats.openConcerns
 * Every number rendered here traces to a real row — the widget renders an
 * honest empty state when nothing needs attention.
 */

import { useEffect, useState } from 'react'
import {
  AlarmClock, ArrowRight, MessageSquareHeart, Shield, Inbox,
} from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type {
  BehaviorPayload,
  FollowUpItem,
  ParentConnectPayload,
} from '@/lib/teacher-hub-types'

interface PendingActionsProps {
  onNavigate: (key: string) => void
}

interface FollowUpRow extends FollowUpItem {
  moduleKey: 'parent-connect' | 'behavior'
}

function dueLabel(due: string): { text: string; tone: 'overdue' | 'today' | 'later' } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // `due` may be a plain "YYYY-MM-DD" day key OR a full ISO timestamp —
  // parse it as-is when it already carries a time part.
  const d = new Date(due.includes('T') ? due : `${due}T00:00:00`)
  if (Number.isNaN(d.getTime())) return { text: 'Scheduled', tone: 'later' }
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { text: `Overdue ${Math.abs(days)}d`, tone: 'overdue' }
  if (days === 0) return { text: 'Due today', tone: 'today' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'later' }
  return { text: `Due in ${days}d`, tone: 'later' }
}

export function PendingActions({ onNavigate }: PendingActionsProps) {
  const [state, setState] = useState<
    | { phase: 'loading' }
    | { phase: 'error' }
    | {
        phase: 'ready'
        unread: number
        openConcerns: number
        followUps: FollowUpRow[]
      }
  >({ phase: 'loading' })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [pc, beh] = await Promise.allSettled([
          fetch('/api/teacher/parent-connect', { cache: 'no-store', credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('pc')))),
          fetch('/api/teacher/behavior', { cache: 'no-store', credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('beh')))),
        ])
        if (cancelled) return
        const pcData = pc.status === 'fulfilled' ? (pc.value.data as ParentConnectPayload) : null
        const behData = beh.status === 'fulfilled' ? (beh.value.data as BehaviorPayload) : null

        const rows: FollowUpRow[] = []
        pcData?.followUps
          ?.filter((f) => f.status === 'open')
          .forEach((f) => rows.push({ ...f, moduleKey: 'parent-connect' }))
        rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

        setState({
          phase: 'ready',
          unread: pcData?.stats?.unread ?? 0,
          openConcerns: behData?.stats?.openConcerns ?? 0,
          followUps: rows.slice(0, 4),
        })
      } catch {
        if (!cancelled) setState({ phase: 'error' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlarmClock className="h-4 w-4 text-amber-500" /> Pending Actions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Follow-ups & messages awaiting your attention</p>
          </div>
        </div>

        {state.phase === 'loading' && (
          <div className="space-y-2.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        )}

        {state.phase === 'error' && (
          <div className="py-8 text-center">
            <Inbox className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Pending actions could not load.</p>
            <button
              onClick={() => setState({ phase: 'loading' })}
              className="mt-2 text-xs text-primary font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {state.phase === 'ready' && state.followUps.length === 0 && state.unread === 0 && state.openConcerns === 0 && (
          <div className="py-8 text-center">
            <Inbox className="h-8 w-8 mx-auto text-emerald-500/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">No follow-ups or unread messages right now.</p>
          </div>
        )}

        {state.phase === 'ready' && (
          <div className="space-y-2.5">
            {state.unread > 0 && (
              <button
                onClick={() => onNavigate('parent-connect')}
                className="w-full flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-left hover:bg-sky-500/10 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                  <MessageSquareHeart className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{state.unread} unread parent message{state.unread === 1 ? '' : 's'}</p>
                  <p className="text-xs text-muted-foreground">Parent Connect · reply from your conversations</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            )}

            {state.openConcerns > 0 && (
              <button
                onClick={() => onNavigate('behavior')}
                className="w-full flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-left hover:bg-rose-500/10 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{state.openConcerns} open behavior concern{state.openConcerns === 1 ? '' : 's'}</p>
                  <p className="text-xs text-muted-foreground">Student Behavior · review status</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            )}

            {state.followUps.map((f) => {
              const due = dueLabel(f.dueDate)
              return (
                <button
                  key={f.id}
                  onClick={() => onNavigate(f.moduleKey)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3 text-left hover:bg-accent/40 transition-colors"
                >
                  <GradientAvatar name={f.student?.name ?? 'Follow-up'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{f.student?.name ?? 'Follow-up'}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.reason}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      due.tone === 'overdue' && 'bg-rose-500/10 text-rose-600',
                      due.tone === 'today' && 'bg-amber-500/10 text-amber-600',
                      due.tone === 'later' && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {due.text}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </GlassCard>

      <div className="space-y-4">
        <TeacherHubCard onNavigate={onNavigate} />
      </div>
    </div>
  )
}

/** Quiet secondary card — the teacher's Class Teacher Hub entry point,
 *  driven by the same live payloads already fetched above (no extra call). */
function TeacherHubCard({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
        <Shield className="h-4 w-4 text-emerald-500" /> Class Teacher Hub
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Parents, behaviour & meetings</p>
      <button
        onClick={() => onNavigate('parent-connect')}
        className="w-full rounded-xl border border-border bg-card/40 p-3 text-left hover:bg-accent/40 transition-colors"
      >
        <p className="text-[11px] text-muted-foreground">
          Open Parent Connect, Student Behavior & PTM Scheduler
        </p>
      </button>
    </GlassCard>
  )
}
