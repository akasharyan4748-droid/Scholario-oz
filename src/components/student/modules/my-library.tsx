'use client'

/**
 * MyLibraryModule — the STUDENT library view.
 *
 * Reads the SAME canonical library-store as the Principal module, filtered
 * to the logged-in student's borrower records. Read-only by design — a
 * student never sees issue/return controls, other borrowers, or fines
 * beyond their own.
 *
 * Sections:
 *   - Compact summary chips (issued · overdue · pending fine)
 *   - Currently issued books (due date, days left / overdue + fine)
 *   - Reading history (returned books)
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, AlertTriangle, IndianRupee, CheckCircle2, Library } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { useLibraryStore } from '@/lib/store/library-store'
import type { IssueRecord } from '@/lib/store/library-store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const STUDENT_ID = 'STU-58'

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}

function dueInfo(issue: IssueRecord) {
  const today = new Date().toISOString().slice(0, 10)
  const days = daysBetween(today, issue.dueDate)
  if (issue.status === 'Overdue') {
    const late = Math.max(1, -days)
    return { label: `${late} day${late > 1 ? 's' : ''} overdue`, tone: 'danger' as const, days: late }
  }
  if (days < 0) return { label: 'Due today', tone: 'warning' as const, days: 0 }
  return { label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'success' as const, days }
}

export function MyLibraryModule() {
  const issues = useLibraryStore((s) => s.issues)

  const mine = useMemo(
    () => issues.filter((i) => i.borrowerId === STUDENT_ID),
    [issues],
  )
  const current = mine.filter((i) => i.status === 'Issued' || i.status === 'Overdue')
  const history = mine.filter((i) => i.status === 'Returned')
  const overdue = current.filter((i) => i.status === 'Overdue')
  const pendingFine = current.reduce((s, i) => s + (i.fineStatus === 'Pending' ? i.fine : 0), 0)

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Library"
        subtitle="Books issued to you, due dates and your reading history"
        icon={<Library className="h-5 w-5" />}
        action={
          <StatusBadge
            status={current.length > 0 ? `${current.length} book${current.length > 1 ? 's' : ''} with you` : 'No books issued'}
            variant={overdue.length > 0 ? 'warning' : 'primary'}
            dot
          />
        }
      />

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-3 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <BookOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold tabular-nums leading-none">{current.length}</p>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mt-1">Issued</p>
          </div>
        </GlassCard>
        <GlassCard className="p-3 flex items-center gap-3">
          <span className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            overdue.length > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-muted text-muted-foreground',
          )}>
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold tabular-nums leading-none">{overdue.length}</p>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mt-1">Overdue</p>
          </div>
        </GlassCard>
        <GlassCard className="p-3 flex items-center gap-3">
          <span className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            pendingFine > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground',
          )}>
            <IndianRupee className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold tabular-nums leading-none">₹{pendingFine}</p>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mt-1">Fine due</p>
          </div>
        </GlassCard>
      </div>

      {/* Currently issued */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Books With You
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Return or renew at the library counter</p>
          </div>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">14-day loan period</span>
        </div>

        {current.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-2">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">No books issued right now</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Visit the school library to borrow books.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {current.map((issue, i) => {
              const d = dueInfo(issue)
              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    issue.status === 'Overdue'
                      ? 'border-rose-500/30 bg-rose-500/[0.03]'
                      : 'border-border bg-card',
                  )}
                >
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    issue.status === 'Overdue'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  )}>
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{issue.bookTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Issued {formatDate(issue.issueDate)} · Due {formatDate(issue.dueDate)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={d.label} variant={d.tone} dot />
                    {issue.status === 'Overdue' && issue.fine > 0 && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                        Fine ₹{issue.fine} · ₹5/day
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassCard>

      {/* History */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Reading History
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Books you have borrowed and returned</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{history.length} returned</span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Nothing here yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {history.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-3 rounded-md px-2.5 py-2 hover:bg-muted/40 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <p className="text-xs font-medium text-foreground truncate flex-1">{issue.bookTitle}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  Returned {issue.returnDate ? formatDate(issue.returnDate) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
