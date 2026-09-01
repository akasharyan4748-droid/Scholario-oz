'use client'

/**
 * TeacherMyLibraryModule — the TEACHER school-library view.
 *
 * Reads the SAME canonical library-store as the Principal module:
 *   - "Books with you" — the teacher's own borrowed books (due dates,
 *     overdue, fines) — read-only; issue/return happen at the counter.
 *   - "Browse catalogue" — search the school catalogue so a teacher can
 *     look up availability before requesting a book.
 * Teachers never see other borrowers' records or circulation controls.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, Library, Clock, AlertTriangle, IndianRupee } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { Input } from '@/components/ui/input'
import { useLibraryStore } from '@/lib/store/library-store'
import type { IssueRecord, Book } from '@/lib/store/library-store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const TEACHER_ID = 'T-014'

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

function availabilityTone(b: Book): 'success' | 'warning' | 'danger' {
  if (b.status === 'Out of Stock') return 'danger'
  if (b.status === 'Low Stock') return 'warning'
  return 'success'
}

export function TeacherMyLibraryModule() {
  const issues = useLibraryStore((s) => s.issues)
  const books = useLibraryStore((s) => s.books)
  const [search, setSearch] = useState('')

  const mine = useMemo(
    () => issues.filter((i) => i.borrowerId === TEACHER_ID),
    [issues],
  )
  const current = mine.filter((i) => i.status === 'Issued' || i.status === 'Overdue')
  const history = mine.filter((i) => i.status === 'Returned')
  const pendingFine = current.reduce((s, i) => s + (i.fineStatus === 'Pending' ? i.fine : 0), 0)

  const catalogue = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return books.slice(0, 12)
    return books
      .filter((b) =>
        b.title.toLowerCase().includes(q)
        || b.author.toLowerCase().includes(q)
        || b.category.toLowerCase().includes(q),
      )
      .slice(0, 20)
  }, [books, search])

  return (
    <div className="space-y-6">
      <SectionHeading
        title="School Library"
        subtitle="Books issued to you and the school catalogue"
        icon={<Library className="h-5 w-5" />}
        action={
          <StatusBadge
            status={current.length > 0 ? `${current.length} book${current.length > 1 ? 's' : ''} with you` : 'No books issued'}
            variant={current.some((i) => i.status === 'Overdue') ? 'warning' : 'primary'}
            dot
          />
        }
      />

      {/* Books with the teacher */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Books With You
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Return or renew at the library counter</p>
          </div>
          {pendingFine > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <IndianRupee className="h-3.5 w-3.5" /> {pendingFine} fine due
            </span>
          )}
        </div>

        {current.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-2">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">No books issued right now</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Browse the catalogue below and visit the counter to borrow.</p>
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
                  <StatusBadge status={d.label} variant={d.tone} dot />
                </motion.div>
              )
            })}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1.5">
              Recently returned
            </p>
            <div className="space-y-1">
              {history.slice(0, 3).map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{h.bookTitle}</span>
                  <span className="text-muted-foreground ml-auto shrink-0">
                    returned {h.returnDate ? formatDate(h.returnDate) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Catalogue browse */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Browse Catalogue
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Check availability before requesting a book</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, author or category…"
              className="h-8 pl-8 text-xs"
              aria-label="Search catalogue"
            />
          </div>
        </div>

        {catalogue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">No books match “{search}”</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {catalogue.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-2.5 rounded-lg border border-border p-2.5"
              >
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  b.status === 'Out of Stock'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : b.status === 'Low Stock'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                )}>
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {b.author} · {b.category}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge
                    status={b.available > 0 ? `${b.available} available` : 'All issued'}
                    variant={availabilityTone(b)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
