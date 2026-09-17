'use client'

/**
 * dashboard/learning-section — the Learning OS's dashboard surface.
 *
 * Replaces the decommissioned homework/assignments cards with the student's
 * REAL learning day: today's plan (canonical planner store), the flashcard
 * review queue, and the library card (unchanged — its own store).
 * Every number derives from the learning store (§61).
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BookMarked, CalendarRange, CheckCircle2, Layers } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { useLearningStore, openTasksToday, deckStats, streakOf } from '@/lib/store/learning-store'
import { useLibraryStore } from '@/lib/store/library-store'
import { formatDate } from '@/lib/format'
import { subjectColor } from '../timetable/subject-colors'
import { fmtMin } from '../learning/shared/tokens'
import { DEMO_STUDENT_ID } from '../applications/student'

interface LearningSectionProps {
  libraryId: string
  onNavigate: (key: string) => void
}

export function LearningSection({ libraryId, onNavigate }: LearningSectionProps) {
  const tasks = useLearningStore((s) => s.tasks)
  const cards = useLearningStore((s) => s.cards)
  const sessions = useLearningStore((s) => s.sessions)

  // STU-F — the library card reads the ONE library store (the same source
  // My Library and Notifications use), filtered to the demo student's live
  // overdue issue.
  const allIssues = useLibraryStore((s) => s.issues)
  const myIssues = useMemo(
    () => allIssues.filter((i) => i.borrowerId === DEMO_STUDENT_ID),
    [allIssues],
  )
  const myIssue = myIssues.find((i) => i.status === 'Overdue')
  const openCount = myIssues.filter((i) => i.status === 'Issued' || i.status === 'Overdue').length
  const totalFine = myIssues
    .filter((i) => i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.fine ?? 0), 0)

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])
  const todayList = useMemo(() => openTasksToday(tasks, today).slice(0, 3), [tasks, today])
  const doneToday = useMemo(
    () => tasks.filter((t) => t.date === today && t.status === 'done').length,
    [tasks, today],
  )
  const due = useMemo(() => deckStats(cards, null, today).due, [cards, today])
  const streak = useMemo(() => streakOf(sessions), [sessions])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Today's study plan — the planner, surfaced */}
      <GlassCard className="on-card p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-amber-500" /> Today&apos;s Plan
          </h3>
          <StatusBadge status={todayList.length > 0 ? `${todayList.length} to go` : 'clear'} variant={todayList.length > 0 ? 'warning' : 'success'} />
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {todayList.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-6 text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
              <p className="text-xs font-semibold text-foreground/70">{doneToday > 0 ? 'Everything done for today' : 'Your day is clear'}</p>
              <p className="text-[10px] text-muted-foreground">Plan a session in Learning</p>
            </div>
          ) : (
            todayList.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm leading-tight">{t.title}</p>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5 shrink-0">
                    {t.startTime ?? fmtMin(t.durationMin)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${subjectColor(t.subject).dot}`} aria-hidden />
                  {t.subject}{t.topic ? ` · ${t.topic}` : ''} · {fmtMin(t.durationMin)}
                </p>
              </motion.div>
            ))
          )}
        </div>
        <Button variant="ghost" size="sm" className="mt-2.5 w-full text-[11px]" onClick={() => onNavigate('planner')}>
          Open Study Planner
        </Button>
      </GlassCard>

      {/* Flashcard review queue */}
      <GlassCard className="on-card p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" /> Review Queue
          </h3>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              {streak}-day streak
            </span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/[0.04] px-4 py-6 text-center">
          <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {due}
            <span className="ml-1 text-sm font-semibold text-muted-foreground">cards</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {due === 0 ? 'All caught up — nicely done.' : 'due for review today'}
          </p>
          <Button
            size="sm"
            className="mt-3 gap-1"
            disabled={due === 0}
            onClick={() => onNavigate('flashcards')}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden /> {due === 0 ? 'Nothing due' : 'Start review'}
          </Button>
        </div>
      </GlassCard>

      {/* Library book (unchanged data source — its own canonical store) */}
      <GlassCard className="on-card p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-cyan-500" /> My Library
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{libraryId}</span>
        </div>
        {myIssue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 text-white">
                <BookMarked className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{myIssue.bookTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Issued {formatDate(myIssue.issueDate)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status="Overdue" variant="danger" dot />
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Fine: ₹{myIssue.fine}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Books issued now</span><span className="font-semibold">{openCount}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Overdue fine</span><span className={totalFine > 0 ? 'font-semibold text-rose-600 dark:text-rose-400' : 'font-semibold text-emerald-600 dark:text-emerald-400'}>{totalFine > 0 ? `₹${totalFine}` : 'None'}</span></div>
        </div>
      </GlassCard>
    </div>
  )
}
