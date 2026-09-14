'use client'

/**
 * LeadershipPanel (SD-3 · PHASE 13–16) — the dashboard's leadership
 * surface for APPOINTED students only (Class Captain / Monitor / …).
 *
 * Derives entirely from the permission/appointment system:
 *   · active positions — students-store + filterActivePositions (the
 *     ONE session-scoped activity resolver)
 *   · quick actions    — POSITION_DEFS capability allowlist (never a
 *     hardcoded button; student leaders never get admin powers)
 *   · responsibilities — class-responsibility-store tasks assigned by
 *     staff (task · deadline · status)
 *
 * Ordinary students never see this panel (it renders null).
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Megaphone, ListTodo, ChevronRight, CheckCircle2, Circle, Flag, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import { useClassResponsibilityStore } from '@/lib/store/class-responsibility-store'
import { POSITION_DEFS, hasCapability, filterActivePositions } from '@/lib/student-positions'
import { useAcademicSession } from '@/lib/academic-session'
import { formatDate } from '@/lib/format'
import { DEMO_STUDENT_ID } from '../applications/student'
import { dueLabel } from './data'

export function LeadershipPanel({ onNavigate }: { onNavigate: (key: string) => void }) {
  // ── Active appointment (session-scoped resolver) ───────────────────
  const allPositions = useStudentsStore((s) => s.studentPositions)
  const sessionId = useAcademicSession().id
  const positions = useMemo(
    () => filterActivePositions(allPositions, DEMO_STUDENT_ID, sessionId),
    [allPositions, sessionId],
  )

  // ── Staff-assigned responsibility tasks (PHASE 16) ─────────────────
  const tasks = useClassResponsibilityStore((s) => s.responsibilityTasks)
  const myTasks = useMemo(
    () => tasks.filter((t) => t.studentId === DEMO_STUDENT_ID).slice(0, 3),
    [tasks],
  )

  if (positions.length === 0) return null
  const primary = positions[0]
  const def = POSITION_DEFS[primary.key]
  const title = def?.title ?? 'Class Responsibility'

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Class leadership"
      className="flex flex-col rounded-2xl border border-primary/25 bg-primary/[0.03] p-3.5 shadow-2xs sm:p-4"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
          <Crown className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold tracking-tight">{title}</h2>
          <p className="truncate text-[11px] text-muted-foreground">
            Since {formatDate(primary.assignedOn)} · by {primary.assignedByName}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {def?.description ?? 'You carry an active class responsibility this session.'}
      </p>

      {/* ── Capability-scoped quick actions (PHASE 15) ──────────────── */}
      <div className="mt-3 flex flex-wrap gap-2">
        {hasCapability(positions, 'post-class-updates') && (
          <Action onClick={() => onNavigate('my-class')} icon={<Megaphone className="h-3.5 w-3.5" aria-hidden />} primary>
            Class updates
          </Action>
        )}
        {hasCapability(positions, 'view-class-tasks') && (
          <Action onClick={() => onNavigate('my-class')} icon={<ListTodo className="h-3.5 w-3.5" aria-hidden />}>
            My tasks
          </Action>
        )}
        {hasCapability(positions, 'report-issues') && (
          <Action onClick={() => onNavigate('my-class')} icon={<Flag className="h-3.5 w-3.5" aria-hidden />}>
            Report issue
          </Action>
        )}
      </div>

      {/* ── MY RESPONSIBILITIES (PHASE 16 — real tasks only) ────────── */}
      {myTasks.length > 0 && (
        <div className="mt-3.5 border-t border-primary/15 pt-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-3 w-3" aria-hidden /> My Responsibilities
          </p>
          <ul className="mt-2 space-y-1.5">
            {myTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg bg-background/60 px-2.5 py-2">
                {t.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-xs font-medium', t.done && 'text-muted-foreground line-through')}>
                    {t.title}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {t.dueOn ? dueLabel(t.dueOn) : 'No deadline'} · by {t.assignedByName}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  )
}

function Action({ children, icon, onClick, primary }: {
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        primary
          ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
          : 'border border-primary/30 bg-background text-primary hover:bg-primary/5',
      )}
    >
      {icon}
      {children}
      <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
    </button>
  )
}
